import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Resolve DB path - persistent across restarts, relative to project root
const DB_DIR = path.join(process.cwd());
const DB_PATH = path.join(DB_DIR, 'mgr_cache.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');   // better concurrency
        db.pragma('synchronous = NORMAL'); // safe + fast enough
        initSchema(db);
    }
    return db;
}

function initSchema(db: Database.Database) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS mgr_query_cache (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            start_date    TEXT NOT NULL,
            end_date      TEXT NOT NULL,
            overview_json TEXT,
            models_json   TEXT,
            usage_json    TEXT,
            smart_json    TEXT,
            fetched_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S', 'now', 'localtime')),
            UNIQUE(start_date, end_date)
        );
    `);
}

export interface CacheRow {
    id: number;
    start_date: string;
    end_date: string;
    overview_json: string | null;
    models_json: string | null;
    usage_json: string | null;
    smart_json: string | null;
    fetched_at: string;
}

export function getCacheList(): Pick<CacheRow, 'id' | 'start_date' | 'end_date' | 'fetched_at'>[] {
    const db = getDb();
    return db.prepare(`
        SELECT id, start_date, end_date, fetched_at
        FROM mgr_query_cache
        ORDER BY fetched_at DESC
    `).all() as any;
}

export function getCacheById(id: number): CacheRow | undefined {
    const db = getDb();
    return db.prepare(`SELECT * FROM mgr_query_cache WHERE id = ?`).get(id) as any;
}

export function upsertCache(start: string, end: string, tab: string, data: any): void {
    const db = getDb();
    const col = `${tab}_json`;
    const allowed = ['overview', 'models', 'usage', 'smart'];
    if (!allowed.includes(tab)) return;

    const json = JSON.stringify(data);
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        .replace(/\. /g, '-').replace(/\./g, '').replace(' ', ' ').trim();

    // Try INSERT first, if exists UPDATE just the tab column
    const existing = db.prepare(`SELECT id FROM mgr_query_cache WHERE start_date = ? AND end_date = ?`).get(start, end) as any;
    if (existing) {
        db.prepare(`UPDATE mgr_query_cache SET ${col} = ?, fetched_at = ? WHERE id = ?`)
            .run(json, now, existing.id);
    } else {
        db.prepare(`
            INSERT INTO mgr_query_cache (start_date, end_date, ${col}, fetched_at)
            VALUES (?, ?, ?, ?)
        `).run(start, end, json, now);
    }
}

export function deleteCacheById(id: number): void {
    const db = getDb();
    db.prepare(`DELETE FROM mgr_query_cache WHERE id = ?`).run(id);
}
