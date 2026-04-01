import { NextResponse } from 'next/server';
import { getCacheById } from '@/lib/db/cache';

export const dynamic = 'force-dynamic';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = Number(params.id);
        if (isNaN(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

        const row = getCacheById(id);
        if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json({
            id: row.id,
            start_date: row.start_date,
            end_date: row.end_date,
            fetched_at: row.fetched_at,
            overview: row.overview_json ? JSON.parse(row.overview_json) : null,
            models: row.models_json ? JSON.parse(row.models_json) : null,
            usage: row.usage_json ? JSON.parse(row.usage_json) : null,
            smart: row.smart_json ? JSON.parse(row.smart_json) : null,
        });
    } catch (error) {
        console.error('Cache [id] GET error:', error);
        return NextResponse.json({ error: 'Failed to get cache' }, { status: 500 });
    }
}
