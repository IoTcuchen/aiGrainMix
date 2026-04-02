import { NextResponse } from 'next/server';
import { getMgrPool } from '@/lib/api/db';
import { upsertCache } from '@/lib/db/cache';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────
//  캐시: 쿼리 단위(공유 캐시 키)로 분리하여
//  탭이 달라도 동일 쿼리는 재사용
// ─────────────────────────────────────────────
interface CacheItem {
    data: any;
    timestamp: number;
}
const cache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5분

function getCached(key: string): any | null {
    const item = cache.get(key);
    if (item && Date.now() - item.timestamp < CACHE_TTL_MS) return item.data;
    cache.delete(key);
    return null;
}
function setCached(key: string, data: any) {
    cache.set(key, { data, timestamp: Date.now() });
}

// ─────────────────────────────────────────────
//  레시피 이름 정규화 (반복 CASE WHEN 제거)
// ─────────────────────────────────────────────
function normalizeRecipeName(name: string | null): string {
    if (!name) return '기타';
    const n = name.trim();
    if (n.includes('백미찰진밥') || n.includes('찰진백미')) return '찰진백미';
    if (n.includes('백미고슬밥') || n.includes('고슬백미')) return '고슬백미';
    if (n.includes('혼합잡곡밥') || n.includes('혼합잡곡')) return '혼합잡곡';
    if (n.includes('백미쾌속')) return '백미쾌속';
    if (n.includes('가마솥밥')) return '가마솥밥';
    if (n.includes('현미100')) return '현미100';
    if (n.includes('잡곡쾌속')) return '잡곡쾌속';
    return n;
}

/** [추가] 레시피 명칭 통합 및 카운트 합산 헬퍼 */
function consolidateRecipes(rows: any[], limit = 15) {
    const map = new Map<string, number>();
    rows.forEach(r => {
        const name = normalizeRecipeName(r.name);
        map.set(name, (map.get(name) || 0) + (Number(r.count) || 0));
    });
    return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const tab = searchParams.get('tab') || 'overview';

    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 90);

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : today;

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    const startYMD = startStr.replace(/-/g, '');
    const endYMD = endStr.replace(/-/g, '');
    const startDateTime = `${startStr} 00:00:00`;
    const endDateTime = `${endStr} 23:59:59`;
    const todayStr =
        today.getFullYear().toString() +
        (today.getMonth() + 1).toString().padStart(2, '0') +
        today.getDate().toString().padStart(2, '0');

    const base = `${startStr}_${endStr}`;

    // 5분 메모리 캐시 히트 (정확히 같은 날짜) → 즉시 반환
    const tabCacheKey = `${base}_${tab}`;
    const tabCached = getCached(tabCacheKey);
    if (tabCached) {
        // [수정] 메모리 캐시 히트 시에도 SQLite에 누락되어 있을 수 있으므로(삭제 등) 저장 시도
        try { upsertCache(startStr, endStr, tab, tabCached); } catch (e) { }
        return NextResponse.json(tabCached);
    }

    // ─── 싱글톤 풀 (생성/종료 없음) ───
    const pool = getMgrPool();

    try {
        let data: any = {};

        // ════════════════════════════════════════
        //  공유 쿼리 헬퍼 (탭 간 캐시 공유)
        // ════════════════════════════════════════

        /** SC_COOKER_LOG 앱 제어 비율 (smart / usage / overview 공통 사용) */
        async function getAppCtrlRatio() {
            const key = `${base}_appCtrl`;
            const hit = getCached(key);
            if (hit) return hit;
            const [rows] = await pool.execute(
                `SELECT
                    COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) AS Y_CNT,
                    COUNT(CASE WHEN APP_CTRL_YN = 'N' THEN 1 END) AS N_CNT
                 FROM SC_COOKER_LOG
                 WHERE REG_DT >= ? AND REG_DT <= ?`,
                [startDateTime, endDateTime]
            );
            setCached(key, rows);
            return rows;
        }

        /** 예약 취사 시간대 (smart / usage 공통) */
        async function getResvTimeTrend() {
            const key = `${base}_resv`;
            const hit = getCached(key);
            if (hit) return hit;
            const [rows] = await pool.execute(
                `SELECT LEFT(RESV_TIME, 2) as hourStr, COUNT(*) as count
                 FROM SC_DEVICE_RESV_TIME
                 WHERE REG_DT >= ? AND REG_DT <= ?
                 GROUP BY hourStr ORDER BY hourStr ASC`,
                [startDateTime, endDateTime]
            );
            setCached(key, rows);
            return rows;
        }

        /** 모델별 앱 제어 비율 (smart / overview / report 공통) */
        async function getModelAppRatio(alias = false, limit = 10) {
            const key = `${base}_modelApp_${alias ? 'alias' : 'nm'}_${limit}`;
            const hit = getCached(key);
            if (hit) return hit;
            const col = alias ? 'M.MODEL_ALIAS' : 'M.MODEL_NM';
            const [rows] = await pool.execute(
                `SELECT ${col} as modelName, COUNT(*) as totalCooks,
                    SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
                 FROM SC_COOKER_LOG C
                 JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                 WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                 GROUP BY ${col} ORDER BY totalCooks DESC LIMIT ${limit}`,
                [startDateTime, endDateTime]
            );
            setCached(key, rows);
            return rows;
        }

        /** 시간대별 앱/수동 현황 (usage / smart 공통) */
        async function getHourlyTrend() {
            const key = `${base}_hourly`;
            const hit = getCached(key);
            if (hit) return hit;
            const [rows] = await pool.execute(
                `SELECT HOUR(REG_DT) as hour,
                        COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) as appCount,
                        COUNT(CASE WHEN APP_CTRL_YN = 'N' THEN 1 END) as manualCount
                 FROM SC_COOKER_LOG
                 WHERE REG_DT >= ? AND REG_DT <= ?
                 GROUP BY hour ORDER BY hour ASC`,
                [startDateTime, endDateTime]
            );
            setCached(key, rows);
            return rows;
        }

        // ════════════════════════════════════════
        //  TAB: overview
        // ════════════════════════════════════════
        if (tab === 'overview') {
            const [
                [deviceRows],
                [trendRows],
                [todayRows],
                [monthlyRegsRows],
                [dataVolumeRows],
                modelPerfRows,
                [userRows]
            ] = await Promise.all([
                pool.execute(`SELECT CONN_YN as status, COUNT(*) as count FROM SC_DEVICE_STATUS GROUP BY CONN_YN`),
                pool.execute(
                    `SELECT DAY as dateStr, COUNT(*) as count
                     FROM SC_DEVICE_COOK_LOG
                     WHERE DAY BETWEEN ? AND ?
                     GROUP BY DAY ORDER BY DAY ASC`,
                    [startYMD, endYMD]
                ),
                pool.execute(
                    `SELECT COUNT(*) as count FROM SC_DEVICE_COOK_LOG WHERE DAY = ?`,
                    [todayStr]
                ).catch(() => [[{ count: 0 }]]),
                pool.execute(
                    `SELECT DATE_FORMAT(REG_DT, '%Y-%m') as month, COUNT(*) as count
                     FROM SC_DEVICE_STATUS
                     WHERE REG_DT >= ? AND REG_DT <= ?
                     GROUP BY month ORDER BY month ASC`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT
                        (SELECT COUNT(*) FROM SC_COOKER_LOG     WHERE REG_DT >= ? AND REG_DT <= ?) as cook,
                        (SELECT COUNT(*) FROM SC_DEVICE_WARM_LOG WHERE REG_DT >= ? AND REG_DT <= ?) as warm,
                        (SELECT COUNT(*) FROM SC_DEVICE_RESV_TIME WHERE REG_DT >= ? AND REG_DT <= ?) as resv`,
                    [startDateTime, endDateTime, startDateTime, endDateTime, startDateTime, endDateTime]
                ),
                // 공유 캐시 사용
                getModelAppRatio(false, 10),
                pool.execute(`SELECT COUNT(*) as count FROM SC_MEM`)
            ]);

            let onlineCount = 0; let offlineCount = 0;
            (deviceRows as any[]).forEach(row => {
                if (row.status === 'Y') onlineCount += row.count;
                else offlineCount += row.count;
            });

            const dbTrendMap = new Map((trendRows as any[]).map(r => [r.dateStr, r.count]));
            let fullDailyTrend: any[] = [];
            const curDate = new Date(startDate);
            while (curDate <= endDate) {
                const y = curDate.getFullYear().toString();
                const m = (curDate.getMonth() + 1).toString().padStart(2, '0');
                const d = curDate.getDate().toString().padStart(2, '0');
                const ymdStr = `${y}${m}${d}`;
                fullDailyTrend.push({ rawDate: ymdStr, name: `${m}.${d}`, count: dbTrendMap.get(ymdStr) || 0 });
                curDate.setDate(curDate.getDate() + 1);
            }

            let dailyCookTrend = fullDailyTrend;
            if (dailyCookTrend.length > 60) {
                const monthlyMap = new Map<string, number>();
                dailyCookTrend.forEach(item => {
                    const ym = item.rawDate.substring(0, 6);
                    monthlyMap.set(ym, (monthlyMap.get(ym) || 0) + item.count);
                });
                dailyCookTrend = Array.from(monthlyMap.entries()).map(([ym, count]) => ({
                    rawDate: ym,
                    name: `${ym.substring(2, 4)}년 ${ym.substring(4, 6)}월`,
                    count
                }));
            } else if (dailyCookTrend.length > 21) {
                const compressed: any[] = [];
                const interval = Math.ceil(dailyCookTrend.length / 15);
                for (let i = 0; i < dailyCookTrend.length; i += interval) {
                    const slice = dailyCookTrend.slice(i, i + interval);
                    const sum = slice.reduce((acc, curr) => acc + curr.count, 0);
                    compressed.push({ rawDate: slice[0].rawDate, name: slice[0].name, count: sum });
                }
                dailyCookTrend = compressed;
            }

            const dr = (dataVolumeRows as any[])[0] || { cook: 0, warm: 0, resv: 0 };
            const totalUsers = (userRows as any[])[0]?.count || 0;
            const todayCooks = (todayRows as any[])[0]?.count || 0;

            const modelPerformance = (modelPerfRows as any[]).map(row => ({
                name: row.modelName || '기타',
                total: Number(row.totalCooks),
                app: Number(row.appCooks),
                manual: Number(row.totalCooks) - Number(row.appCooks)
            }));

            data = {
                deviceStatus: [
                    { name: '온라인', value: onlineCount },
                    { name: '오프라인', value: offlineCount }
                ],
                weeklyCookTrend: dailyCookTrend,
                kpi: { activeDevices: onlineCount, totalCooksToday: todayCooks, totalDevices: onlineCount + offlineCount },
                monthlyRegistrations: (monthlyRegsRows as any[]).map(r => ({ month: r.month, count: Number(r.count) })),
                dataVolumes: [
                    { name: '총 가입자수', count: totalUsers, icon: 'Users', tooltip: '데이터베이스에 가입되어 있는 전체 사용자(멤버) 고유 수입니다.' },
                    { name: '총 기기수', count: onlineCount + offlineCount, icon: 'Smartphone', tooltip: '현재까지 서버와 연동(가입) 기록이 있는 물리적 스마트 기기의 총 개수입니다.' },
                    { name: '취사 작동 로그', count: Number(dr.cook), icon: 'Database', tooltip: '조회 기간 내 기기들이 실제로 밥을 지은(취사 동작) 총 횟수 기록입니다.' },
                    { name: '보온 작동 로그', count: Number(dr.warm), icon: 'Database', tooltip: '조회 기간 내 기기들이 취사 후 보온 상태를 유지하며 남긴 기기 상태 데이터 합산 건수입니다.' },
                    { name: '예약 취사 로그', count: Number(dr.resv), icon: 'Database', tooltip: '조회 기간 내 "예약 취사" 기능을 통해 특정 시간에 맞추어 밥을 한 접속 횟수입니다.' }
                ],
                modelPerformance
            };
        }

        // ════════════════════════════════════════
        //  TAB: models
        // ════════════════════════════════════════
        else if (tab === 'models') {
            const EXCLUDED = `M.MODEL_NM NOT IN ('HEN-ID6A1WLA', 'CEN-ID6A0WSA')`;

            const [
                [connRows],
                [cookRows],
                // 3중 조인 → 2중 조인. RECIPE_KEY·MODEL_KEY는 앱 레벨에서 이름 매핑
                [servingRows],
                [warmRows]
            ] = await Promise.all([
                pool.execute(
                    `SELECT M.MODEL_NM as modelName,
                            COUNT(*) as totalCount,
                            SUM(CASE WHEN D.REG_DT >= ? AND D.REG_DT <= ? THEN 1 ELSE 0 END) as newCount
                     FROM SC_DEVICE_STATUS D
                     JOIN SC_MODEL M ON D.MODEL_KEY = M.MODEL_KEY
                     WHERE D.REG_DT <= ? AND ${EXCLUDED}
                     GROUP BY M.MODEL_NM ORDER BY totalCount DESC`,
                    [startDateTime, endDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT M.MODEL_NM as modelName, COUNT(*) as totalCooks,
                            SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
                     FROM SC_COOKER_LOG C
                     JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                     WHERE C.REG_DT >= ? AND C.REG_DT <= ? AND ${EXCLUDED}
                     GROUP BY M.MODEL_NM ORDER BY totalCooks DESC`,
                    [startDateTime, endDateTime]
                ),
                // ── 개선: SC_RECIPE 조인 제거, 앱에서 RECIPE_KEY → 이름 매핑 ──
                pool.execute(
                    `SELECT M.MODEL_NM as modelName,
                            sr.RECIPE_NM as recipeNm,
                            C.SERVING_CNT as servingSize,
                            COUNT(*) as count
                     FROM SC_COOKER_LOG C
                     JOIN SC_MODEL M  ON C.MODEL_KEY = M.MODEL_KEY
                     JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
                     WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                       AND C.SERVING_CNT >= 0 AND ${EXCLUDED}
                     GROUP BY M.MODEL_NM, sr.RECIPE_NM, C.SERVING_CNT`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT M.MODEL_NM as modelName,
                            COUNT(CASE WHEN W.WARM_TIME = 0            THEN 1 END) as t0,
                            COUNT(CASE WHEN W.WARM_TIME BETWEEN 1   AND 120  THEN 1 END) as t2,
                            COUNT(CASE WHEN W.WARM_TIME BETWEEN 121  AND 360  THEN 1 END) as t6,
                            COUNT(CASE WHEN W.WARM_TIME BETWEEN 361  AND 720  THEN 1 END) as t12,
                            COUNT(CASE WHEN W.WARM_TIME BETWEEN 721  AND 900  THEN 1 END) as t15,
                            COUNT(CASE WHEN W.WARM_TIME BETWEEN 901  AND 1440 THEN 1 END) as t24,
                            COUNT(CASE WHEN W.WARM_TIME BETWEEN 1441 AND 2160 THEN 1 END) as t36,
                            COUNT(CASE WHEN W.WARM_TIME > 2160               THEN 1 END) as t36plus
                     FROM SC_DEVICE_WARM_LOG W
                     JOIN SC_MODEL M ON W.MODEL_KEY = M.MODEL_KEY
                     WHERE W.REG_DT >= ? AND W.REG_DT <= ? AND ${EXCLUDED}
                     GROUP BY M.MODEL_NM`,
                    [startDateTime, endDateTime]
                )
            ]);

            data = {
                connections: (connRows as any[]).map(r => ({
                    modelName: r.modelName || '기타',
                    totalCount: Number(r.totalCount) || 0,
                    newCount: Number(r.newCount) || 0
                })),
                cooks: (cookRows as any[]).map(r => ({
                    modelName: r.modelName || '기타',
                    totalCooks: Number(r.totalCooks) || 0,
                    appCooks: Number(r.appCooks) || 0
                })),
                servings: (servingRows as any[]).map(r => ({
                    modelName: r.modelName || '기타',
                    menu: normalizeRecipeName(r.recipeNm),
                    servingSize: Number(r.servingSize) || 0,
                    count: Number(r.count) || 0
                })),
                warmTimes: (warmRows as any[]).map(r => ({
                    modelName: r.modelName || '기타',
                    t0: Number(r.t0) || 0, t2: Number(r.t2) || 0,
                    t6: Number(r.t6) || 0, t12: Number(r.t12) || 0,
                    t15: Number(r.t15) || 0, t24: Number(r.t24) || 0,
                    t36: Number(r.t36) || 0, t36plus: Number(r.t36plus) || 0
                }))
            };
        }

        // ════════════════════════════════════════
        //  TAB: usage
        // ════════════════════════════════════════
        else if (tab === 'usage') {
            const [
                [recipeRows],
                hourlyRows,
                [warmRows],
                [dayOfWeekRows],
                [soakSteamRows],
                [servingRows],
                [tasteRows],
                resvRows
            ] = await Promise.all([
                pool.execute(
                    `SELECT sr.RECIPE_NM as name, COUNT(*) as count
                     FROM SC_COOKER_LOG scl
                     INNER JOIN SC_RECIPE sr ON scl.RECIPE_KEY = sr.RECIPE_KEY
                     WHERE scl.REG_DT >= ? AND scl.REG_DT <= ?
                     GROUP BY sr.RECIPE_NM ORDER BY count DESC LIMIT 100`,
                    [startDateTime, endDateTime]
                ),
                getHourlyTrend(),
                pool.execute(
                    `SELECT
                        COUNT(CASE WHEN WARM_TIME = 0            THEN 1 END) as t0,
                        COUNT(CASE WHEN WARM_TIME BETWEEN 1   AND 120  THEN 1 END) as t2,
                        COUNT(CASE WHEN WARM_TIME BETWEEN 121  AND 360  THEN 1 END) as t6,
                        COUNT(CASE WHEN WARM_TIME BETWEEN 361  AND 720  THEN 1 END) as t12,
                        COUNT(CASE WHEN WARM_TIME BETWEEN 721  AND 900  THEN 1 END) as t15,
                        COUNT(CASE WHEN WARM_TIME BETWEEN 901  AND 1440 THEN 1 END) as t24,
                        COUNT(CASE WHEN WARM_TIME BETWEEN 1441 AND 2160 THEN 1 END) as t36
                     FROM SC_DEVICE_WARM_LOG
                     WHERE REG_DT >= ? AND REG_DT <= ?`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT DAYOFWEEK(REG_DT) as dayIndex, COUNT(*) as count
                     FROM SC_COOKER_LOG
                     WHERE REG_DT >= ? AND REG_DT <= ?
                     GROUP BY dayIndex ORDER BY dayIndex ASC`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT sr.RECIPE_NM as menu,
                            C.SOAK_LEVEL as soak, C.STEAM_LEVEL as steam, COUNT(*) as count
                     FROM SC_COOKER_LOG C
                     JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
                     WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                       AND (C.SOAK_LEVEL > 0 OR C.STEAM_LEVEL > 0)
                     GROUP BY sr.RECIPE_NM, C.SOAK_LEVEL, C.STEAM_LEVEL`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT C.SERVING_CNT as servingSize, COUNT(*) as count
                     FROM SC_COOKER_LOG C
                     JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                     WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                       AND C.SERVING_CNT >= 0 AND C.SERVING_CNT <= 5
                       AND NOT (M.MODEL_NM LIKE '%PR03%' AND C.SERVING_CNT > 2)
                     GROUP BY C.SERVING_CNT ORDER BY C.SERVING_CNT ASC`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT
                        SUM(CASE WHEN SOAK_LEVEL > 0  THEN 1 ELSE 0 END) as soakUsed,
                        SUM(CASE WHEN STEAM_LEVEL > 0 THEN 1 ELSE 0 END) as steamUsed,
                        SUM(CASE WHEN SOAK_LEVEL = 0 AND STEAM_LEVEL = 0 THEN 1 ELSE 0 END) as noneUsed,
                        COUNT(*) as total
                     FROM SC_COOKER_LOG
                     WHERE REG_DT >= ? AND REG_DT <= ?`,
                    [startDateTime, endDateTime]
                ),
                // 공유 캐시 사용
                getResvTimeTrend()
            ]);

            const hourlyTrend = Array.from({ length: 24 }).map((_, i) => ({
                hour: `${i}시`, count: 0, appCount: 0, manualCount: 0
            }));
            (hourlyRows as any[]).forEach(row => {
                const h = Number(row.hour);
                if (h >= 0 && h < 24) {
                    hourlyTrend[h].appCount = Number(row.appCount) || 0;
                    hourlyTrend[h].manualCount = Number(row.manualCount) || 0;
                    hourlyTrend[h].count = hourlyTrend[h].appCount + hourlyTrend[h].manualCount;
                }
            });

            const warmRow = (warmRows as any[])[0] || {};
            const warmTimeData = [
                { name: '보온안함', count: Number(warmRow.t0) || 0 },
                { name: '1~2시간', count: Number(warmRow.t2) || 0 },
                { name: '2~6시간', count: Number(warmRow.t6) || 0 },
                { name: '6~12시간', count: Number(warmRow.t12) || 0 },
                { name: '12~15시간', count: Number(warmRow.t15) || 0 },
                { name: '15~24시간', count: Number(warmRow.t24) || 0 },
                { name: '24시간 이상', count: Number(warmRow.t36) || 0 }
            ];

            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            const dayOfWeekTrend = dayNames.map((name, index) => {
                const dbRow = (dayOfWeekRows as any[]).find((r: any) => Number(r.dayIndex) === index + 1);
                return { name, count: dbRow ? Number(dbRow.count) : 0 };
            });

            const tr = (tasteRows as any[])[0] || { soakUsed: 0, steamUsed: 0, noneUsed: 0, total: 1 };
            const customTasteTrend = [
                { name: '불림(Soak) 기능', value: Number(tr.soakUsed) },
                { name: '뜸(Steam) 기능', value: Number(tr.steamUsed) },
                { name: '커스텀 미사용', value: Number(tr.noneUsed) }
            ];

            const resvTimeTrend = Array.from({ length: 24 }).map((_, i) => ({
                hour: `${String(i).padStart(2, '0')}시`, count: 0
            }));
            (resvRows as any[]).forEach((row: any) => {
                const hh = Number(row.hourStr);
                if (!isNaN(hh) && hh >= 0 && hh < 24) resvTimeTrend[hh].count = Number(row.count) || 0;
            });

            data = {
                topRecipes: consolidateRecipes(recipeRows as any[]),
                hourlyTrend,
                warmTimeStatus: warmTimeData,
                dayOfWeekTrend,
                soakSteamDetails: (() => {
                    const ssMap = new Map<string, any>();
                    const countsByMenu = new Map<string, number>();
                    (soakSteamRows as any[]).forEach(r => {
                        const name = normalizeRecipeName(r.menu);
                        // Skip if both levels are zero or outside standard 1-3 range
                        if (![1, 2, 3].includes(Number(r.soak)) && ![1, 2, 3].includes(Number(r.steam))) return;
                        const key = `${name}_${r.soak}_${r.steam}`;
                        if (ssMap.has(key)) {
                            ssMap.get(key).count += Number(r.count);
                        } else {
                            ssMap.set(key, { ...r, menu: name, count: Number(r.count) });
                        }
                        countsByMenu.set(name, (countsByMenu.get(name) || 0) + Number(r.count));
                    });
                    const sortedMenus = Array.from(countsByMenu.entries())
                        .sort((a, b) => b[1] - a[1])
                        .map(e => e[0]);
                    const res: any[] = [];
                    sortedMenus.forEach(m => {
                        Array.from(ssMap.values())
                            .filter(v => v.menu === m)
                            .sort((a, b) => a.soak - b.soak || a.steam - b.steam)
                            .forEach(v => res.push(v));
                    });
                    return res;
                })(),
                servingSizeTrend: (servingRows as any[]).map(r => ({
                    name: `${Number(r.servingSize) + 1}인분`, count: Number(r.count)
                })),
                customTasteTrend,
                resvTimeTrend
            };
        }

        // ════════════════════════════════════════
        //  TAB: smart  (공유 캐시 헬퍼 최대 활용)
        // ════════════════════════════════════════
        else if (tab === 'smart') {
            const [appCtrlRows, resvRows, modelAppRows, hourlyRows] = await Promise.all([
                getAppCtrlRatio(),
                getResvTimeTrend(),
                getModelAppRatio(false, 10),
                getHourlyTrend()
            ]);

            const yCount = (appCtrlRows as any[])[0]?.Y_CNT || 0;
            const nCount = (appCtrlRows as any[])[0]?.N_CNT || 0;

            const resvTimeTrend = Array.from({ length: 24 }).map((_, i) => ({
                hour: `${String(i).padStart(2, '0')}시`, count: 0
            }));
            (resvRows as any[]).forEach((row: any) => {
                const hh = Number(row.hourStr);
                if (!isNaN(hh) && hh >= 0 && hh < 24) resvTimeTrend[hh].count = Number(row.count) || 0;
            });

            const hourlyTrend = Array.from({ length: 24 }).map((_, i) => ({
                hour: `${i}시`, count: 0, appCount: 0, manualCount: 0
            }));
            (hourlyRows as any[]).forEach(row => {
                const h = Number(row.hour);
                if (h >= 0 && h < 24) {
                    hourlyTrend[h].appCount = Number(row.appCount) || 0;
                    hourlyTrend[h].manualCount = Number(row.manualCount) || 0;
                    hourlyTrend[h].count = hourlyTrend[h].appCount + hourlyTrend[h].manualCount;
                }
            });

            data = {
                appCtrlRatio: { app: yCount, manual: nCount, total: yCount + nCount },
                resvTimeTrend,
                hourlyTrend,
                modelAppRatio: (modelAppRows as any[]).map(row => ({
                    name: row.modelName || '기타',
                    total: Number(row.totalCooks),
                    app: Number(row.appCooks),
                    manual: Number(row.totalCooks) - Number(row.appCooks)
                }))
            };
        }

        // ════════════════════════════════════════
        //  TAB: insights
        // ════════════════════════════════════════
        else if (tab === 'insights') {
            // ── 개선: powerUserLogs를 서브쿼리로 통합 → 직렬 2-trip → 단일 쿼리 ──
            const [
                [retentionRows],
                [errorRows],
                [powerUserRows]
            ] = await Promise.all([
                pool.execute(
                    `SELECT
                        TIMESTAMPDIFF(MONTH, D.REG_DT, C.REG_DT) as month_diff,
                        COUNT(DISTINCT C.DEVICE_KEY) as active_devices
                     FROM SC_COOKER_LOG C
                     JOIN SC_DEVICE_STATUS D ON C.DEVICE_KEY = D.DEVICE_KEY
                     WHERE C.APP_CTRL_YN = 'Y'
                       AND C.REG_DT >= ? AND C.REG_DT <= ?
                       AND C.REG_DT >= D.REG_DT
                     GROUP BY month_diff ORDER BY month_diff ASC`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT ERR_1 as code, COUNT(*) as count
                     FROM SC_DEVICE_ERR
                     WHERE REG_DT >= ? AND REG_DT <= ?
                     GROUP BY ERR_1 ORDER BY count DESC LIMIT 20`,
                    [startDateTime, endDateTime]
                ),
                // ── 서브쿼리로 top device 조회 + 로그 조회를 단일 쿼리로 통합 ──
                pool.execute(
                    `SELECT C.REG_DT as logTime,
                            sr.RECIPE_NM as menu,
                            C.DEVICE_KEY as deviceKey,
                            C.APP_CTRL_YN as appCtrl,
                            C.SOAK_LEVEL as soak, C.STEAM_LEVEL as steam,
                            C.SERVING_CNT as servingSize
                     FROM SC_COOKER_LOG C
                     LEFT JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
                     JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                     WHERE C.DEVICE_KEY = (
                         SELECT DEVICE_KEY FROM SC_COOKER_LOG
                         WHERE REG_DT >= ? AND REG_DT <= ?
                         GROUP BY DEVICE_KEY ORDER BY COUNT(*) DESC LIMIT 1
                     )
                       AND C.REG_DT >= ? AND C.REG_DT <= ?
                       AND NOT (M.MODEL_NM LIKE '%PR03%' AND C.SERVING_CNT > 2)
                     ORDER BY C.REG_DT DESC LIMIT 30`,
                    [startDateTime, endDateTime, startDateTime, endDateTime]
                )
            ]);

            const topDeviceKey = (powerUserRows as any[])[0]?.deviceKey || 'N/A';
            const powerUserLogs = (powerUserRows as any[]).map(r => ({
                logTime: r.logTime,
                menu: normalizeRecipeName(r.menu),
                appCtrl: r.appCtrl,
                soak: r.soak,
                steam: r.steam,
                servingSize: r.servingSize
            }));

            data = {
                retentionTrend: (retentionRows as any[]).map(row => ({
                    month: `${row.month_diff}개월 차`,
                    active: Number(row.active_devices)
                })),
                errorCodes: errorRows,
                powerUser: { deviceKey: topDeviceKey, logs: powerUserLogs }
            };
        }

        // ════════════════════════════════════════
        //  TAB: report
        // ════════════════════════════════════════
        else if (tab === 'report') {
            const [
                [monthlyRegsRows],
                [dataVolumeRows],
                modelPerfRows
            ] = await Promise.all([
                pool.execute(
                    `SELECT DATE_FORMAT(REG_DT, '%Y-%m') as month, COUNT(*) as count
                     FROM SC_DEVICE_STATUS
                     WHERE REG_DT >= ? AND REG_DT <= ?
                     GROUP BY month ORDER BY month ASC`,
                    [startDateTime, endDateTime]
                ),
                pool.execute(
                    `SELECT
                        (SELECT COUNT(*) FROM SC_COOKER_LOG      WHERE REG_DT >= ? AND REG_DT <= ?) as cook,
                        (SELECT COUNT(*) FROM SC_DEVICE_WARM_LOG  WHERE REG_DT >= ? AND REG_DT <= ?) as warm,
                        (SELECT COUNT(*) FROM SC_DEVICE_RESV_TIME WHERE REG_DT >= ? AND REG_DT <= ?) as resv`,
                    [startDateTime, endDateTime, startDateTime, endDateTime, startDateTime, endDateTime]
                ),
                getModelAppRatio(true, 15)
            ]);

            const dr = (dataVolumeRows as any[])[0] || { cook: 0, warm: 0, resv: 0 };
            data = {
                monthlyRegistrations: (monthlyRegsRows as any[]).map(r => ({ month: r.month, count: Number(r.count) })),
                dataVolumes: [
                    { name: '취사 작동 로그', count: Number(dr.cook) },
                    { name: '보온 분석 로그', count: Number(dr.warm) },
                    { name: '예약 취사 로그', count: Number(dr.resv) }
                ],
                modelPerformance: (modelPerfRows as any[]).map(row => ({
                    name: row.modelName || '기타',
                    total: Number(row.totalCooks),
                    app: Number(row.appCooks),
                    manual: Number(row.totalCooks) - Number(row.appCooks)
                }))
            };
        }

        setCached(tabCacheKey, data);

        // ── SQLite 영구 캐시 저장 (비동기 시도, 실패해도 응답에 영향 없음) ──
        try { upsertCache(startStr, endStr, tab, data); } catch (e) { console.warn('SQLite cache write failed:', e); }

        return NextResponse.json(data);

    } catch (error) {
        console.error('Manager API DB Error:', error);
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }
    // ── pool.end() 제거: 싱글톤 풀은 프로세스가 살아있는 동안 유지 ──
}
