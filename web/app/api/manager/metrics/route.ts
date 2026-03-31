import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';

interface CacheItem {
    data: any;
    timestamp: number;
}
const cache = new Map<string, CacheItem>();
const CACHE_TTL_MS = 1; // 1 ms to force refresh

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
    const cacheKey = `${startStr}_${endStr}_${tab}`;

    if (cache.has(cacheKey)) {
        const cached = cache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return NextResponse.json(cached.data);
        } else {
            cache.delete(cacheKey);
        }
    }

    let pool;
    try {
        const startYMD = startStr.replace(/-/g, '');
        const endYMD = endStr.replace(/-/g, '');
        const todayStr = today.getFullYear().toString() +
            (today.getMonth() + 1).toString().padStart(2, '0') +
            today.getDate().toString().padStart(2, '0');

        const startDateTime = `${startStr} 00:00:00`;
        const endDateTime = `${endStr} 23:59:59`;

        pool = mysql.createPool({
            host: process.env.MGR_DB_HOST || process.env.DB_HOST,
            user: process.env.MGR_DB_USER || process.env.DB_USER,
            password: process.env.MGR_DB_PASSWORD || process.env.DB_PASSWORD,
            database: process.env.MGR_DB_NAME || process.env.DB_NAME,
            port: Number(process.env.MGR_DB_PORT) || (process.env.MGR_DB_HOST === '127.0.0.1' ? 33306 : Number(process.env.DB_PORT) || 3306),
            connectionLimit: 15,
            waitForConnections: true,
            queueLimit: 0
        });

        let data: any = {};

        if (tab === 'overview') {
            const [
                [deviceRows],
                [trendRows],
                [todayRows],
                [monthlyRegsRows],
                [dataVolumeRows],
                [modelPerfRows],
                [userRows]
            ] = await Promise.all([
                pool.execute(`SELECT CONN_YN as status, COUNT(*) as count FROM SC_DEVICE_STATUS GROUP BY CONN_YN`),
                pool.execute(`
                    SELECT DAY as dateStr, COUNT(*) as count
                    FROM SC_DEVICE_COOK_LOG
                    WHERE DAY BETWEEN ? AND ?
                    GROUP BY DAY
                    ORDER BY DAY ASC
                `, [startYMD, endYMD]),
                pool.execute(`SELECT COUNT(*) as count FROM SC_DEVICE_COOK_LOG WHERE DAY = ?`, [todayStr]).catch(e => [[{ count: 0 }]]),
                pool.execute(`
                    SELECT DATE_FORMAT(REG_DT, '%Y-%m') as month, COUNT(*) as count
                    FROM SC_DEVICE_STATUS
                    WHERE REG_DT >= ? AND REG_DT <= ?
                    GROUP BY month ORDER BY month ASC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        (SELECT COUNT(*) FROM SC_COOKER_LOG WHERE REG_DT >= ? AND REG_DT <= ?) as cook,
                        (SELECT COUNT(*) FROM SC_DEVICE_WARM_LOG WHERE REG_DT >= ? AND REG_DT <= ?) as warm,
                        (SELECT COUNT(*) FROM SC_DEVICE_RESV_TIME WHERE REG_DT >= ? AND REG_DT <= ?) as resv
                `, [startDateTime, endDateTime, startDateTime, endDateTime, startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        CASE 
                            WHEN M.MODEL_NM LIKE '%PS06%' THEN 'PS06'
                            WHEN M.MODEL_NM LIKE '%PR03%' THEN 'PR03'
                            WHEN M.MODEL_NM LIKE '%PX06%' THEN 'PX06'
                            WHEN M.MODEL_NM LIKE '%PX10%' THEN 'PX10'
                            ELSE M.MODEL_NM 
                        END as modelName,
                        COUNT(*) as totalCooks,
                        SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
                    FROM SC_COOKER_LOG C
                    JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                    WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                    GROUP BY modelName ORDER BY totalCooks DESC LIMIT 10
                `, [startDateTime, endDateTime]),
                pool.execute(`SELECT COUNT(*) as count FROM SC_MEM`)
            ]);

            let onlineCount = 0; let offlineCount = 0;
            (deviceRows as any[]).forEach(row => {
                if (row.status === 'Y') onlineCount += row.count;
                else offlineCount += row.count;
            });

            const dbTrendMap = new Map((trendRows as any[]).map(r => [r.dateStr, r.count]));
            let fullDailyTrend = [];
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
                dailyCookTrend = Array.from(monthlyMap.entries()).map(([ym, count]) => {
                    const y = ym.substring(2, 4);
                    const m = ym.substring(4, 6);
                    return { rawDate: ym, name: `${y}년 ${m}월`, count };
                });
            } else if (dailyCookTrend.length > 21) {
                const compressed = [];
                const interval = Math.ceil(dailyCookTrend.length / 15);
                for (let i = 0; i < dailyCookTrend.length; i += interval) {
                    const slice = dailyCookTrend.slice(i, i + interval);
                    const sum = slice.reduce((acc, curr) => acc + curr.count, 0);
                    compressed.push({ rawDate: slice[0].rawDate, name: slice[0].name, count: sum });
                }
                dailyCookTrend = compressed;
            }

            let todayCooks = (todayRows as any[])[0]?.count || 0;

            const monthlyRegistrations = (monthlyRegsRows as any[]).map(row => ({
                month: row.month, count: Number(row.count)
            }));

            const dr = (dataVolumeRows as any[])[0] || { cook: 0, warm: 0, resv: 0 };
            let totalUsers = (userRows as any[])[0]?.count || 0;
            const dataVolumes = [
                { name: '총 가입자수', count: totalUsers, icon: 'Users', tooltip: '데이터베이스에 가입되어 있는 전체 사용자(멤버) 고유 수입니다.' },
                { name: '총 기기수', count: onlineCount + offlineCount, icon: 'Smartphone', tooltip: '현재까지 서버와 연동(가입) 기록이 있는 물리적 스마트 기기의 총 개수입니다.' },
                { name: '취사 작동 로그', count: Number(dr.cook), icon: 'Database', tooltip: '조회 기간 내 기기들이 실제로 밥을 지은(취사 동작) 총 횟수 기록입니다.' },
                { name: '보온 작동 로그', count: Number(dr.warm), icon: 'Database', tooltip: '조회 기간 내 기기들이 취사 후 보온 상태를 유지하며 남긴 기기 상태 데이터 합산 건수입니다.' },
                { name: '예약 취사 로그', count: Number(dr.resv), icon: 'Database', tooltip: '조회 기간 내 "예약 취사" 기능을 통해 특정 시간에 맞추어 밥을 한 접속 횟수입니다.' }
            ];

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
                kpi: {
                    activeDevices: onlineCount,
                    totalCooksToday: todayCooks,
                    totalDevices: onlineCount + offlineCount,
                },
                monthlyRegistrations,
                dataVolumes,
                modelPerformance
            };
        }
        else if (tab === 'models') {
            const [
                [connRows],
                [cookRows],
                [servingRows],
                [warmRows]
            ] = await Promise.all([
                pool.execute(`
                    SELECT M.MODEL_NM as modelName, 
                           COUNT(*) as totalCount,
                           SUM(CASE WHEN D.REG_DT >= ? AND D.REG_DT <= ? THEN 1 ELSE 0 END) as newCount
                    FROM SC_DEVICE_STATUS D
                    JOIN SC_MODEL M ON D.MODEL_KEY = M.MODEL_KEY
                    WHERE D.REG_DT <= ? AND M.MODEL_NM NOT IN ('HEN-ID6A1WLA', 'CEN-ID6A0WSA')
                    GROUP BY M.MODEL_NM
                    ORDER BY totalCount DESC
                `, [startDateTime, endDateTime, endDateTime]),
                pool.execute(`
                    SELECT M.MODEL_NM as modelName, COUNT(*) as totalCooks,
                           SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
                    FROM SC_COOKER_LOG C
                    JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                    WHERE C.REG_DT >= ? AND C.REG_DT <= ? AND M.MODEL_NM NOT IN ('HEN-ID6A1WLA', 'CEN-ID6A0WSA')
                    GROUP BY M.MODEL_NM ORDER BY totalCooks DESC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT M.MODEL_NM as modelName, 
                           CASE 
                               WHEN sr.RECIPE_NM = '백미찰진밥' THEN '찰진백미'
                               WHEN sr.RECIPE_NM = '백미고슬밥' THEN '고슬백미'
                               WHEN sr.RECIPE_NM = '혼합잡곡밥' THEN '혼합잡곡'
                               ELSE sr.RECIPE_NM 
                           END as menu, 
                           C.SERVING_CNT as servingSize, COUNT(*) as count
                    FROM SC_COOKER_LOG C
                    JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                    JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
                    WHERE C.REG_DT >= ? AND C.REG_DT <= ? AND C.SERVING_CNT >= 0 AND M.MODEL_NM NOT IN ('HEN-ID6A1WLA', 'CEN-ID6A0WSA')
                    GROUP BY M.MODEL_NM, menu, C.SERVING_CNT
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT
                        M.MODEL_NM as modelName,
                        COUNT(CASE WHEN W.WARM_TIME = 0 THEN 1 END) as t0,
                        COUNT(CASE WHEN W.WARM_TIME BETWEEN 1 AND 120 THEN 1 END) as t2,
                        COUNT(CASE WHEN W.WARM_TIME BETWEEN 121 AND 360 THEN 1 END) as t6,
                        COUNT(CASE WHEN W.WARM_TIME BETWEEN 361 AND 720 THEN 1 END) as t12,
                        COUNT(CASE WHEN W.WARM_TIME BETWEEN 721 AND 900 THEN 1 END) as t15,
                        COUNT(CASE WHEN W.WARM_TIME BETWEEN 901 AND 1440 THEN 1 END) as t24,
                        COUNT(CASE WHEN W.WARM_TIME BETWEEN 1441 AND 2160 THEN 1 END) as t36,
                        COUNT(CASE WHEN W.WARM_TIME > 2160 THEN 1 END) as t36plus
                    FROM SC_DEVICE_WARM_LOG W
                    JOIN SC_MODEL M ON W.MODEL_KEY = M.MODEL_KEY
                    WHERE W.REG_DT >= ? AND W.REG_DT <= ? AND M.MODEL_NM NOT IN ('HEN-ID6A1WLA', 'CEN-ID6A0WSA')
                    GROUP BY M.MODEL_NM
                `, [startDateTime, endDateTime])
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
                    menu: r.menu || '기타',
                    servingSize: Number(r.servingSize) || 0,
                    count: Number(r.count) || 0
                })),
                warmTimes: (warmRows as any[]).map(r => ({
                    modelName: r.modelName || '기타',
                    t0: Number(r.t0) || 0,
                    t2: Number(r.t2) || 0,
                    t6: Number(r.t6) || 0,
                    t12: Number(r.t12) || 0,
                    t15: Number(r.t15) || 0,
                    t24: Number(r.t24) || 0,
                    t36: Number(r.t36) || 0,
                    t36plus: Number(r.t36plus) || 0
                }))
            };
        }
        else if (tab === 'usage') {
            const [
                [recipeRows],
                [hourlyRows],
                [warmRows],
                [dayOfWeekRows],
                [soakSteamRows],
                [servingRows],
                [tasteRows],
                [resvRows]
            ] = await Promise.all([
                pool.execute(`
                    SELECT 
                        CASE 
                            WHEN sr.RECIPE_NM = '백미찰진밥' THEN '찰진백미'
                            WHEN sr.RECIPE_NM = '백미고슬밥' THEN '고슬백미'
                            WHEN sr.RECIPE_NM = '혼합잡곡밥' THEN '혼합잡곡'
                            ELSE sr.RECIPE_NM 
                        END as name, 
                        count(*) as count
                    FROM SC_COOKER_LOG scl
                    INNER JOIN SC_RECIPE sr ON scl.RECIPE_KEY = sr.RECIPE_KEY
                    WHERE scl.REG_DT >= ? AND scl.REG_DT <= ?
                    GROUP BY name
                    ORDER BY count DESC
                    LIMIT 10
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        HOUR(REG_DT) as hour, 
                        COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) as appCount,
                        COUNT(CASE WHEN APP_CTRL_YN = 'N' THEN 1 END) as manualCount
                    FROM SC_COOKER_LOG
                    WHERE REG_DT >= ? AND REG_DT <= ?
                    GROUP BY hour
                    ORDER BY hour ASC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT
                        count(case when WARM_TIME = 0 then 1 end) as t0,
                        count(case when WARM_TIME BETWEEN 1 and 120 then 1 end) as t2,
                        count(case when WARM_TIME BETWEEN 121 and 360 then 1 end) as t6,
                        count(case when WARM_TIME BETWEEN 361 and 720 then 1 end) as t12,
                        count(case when WARM_TIME BETWEEN 721 and 900 then 1 end) as t15,
                        count(case when WARM_TIME BETWEEN 901 and 1440 then 1 end) as t24,
                        count(case when WARM_TIME BETWEEN 1441 and 2160 then 1 end) as t36
                    FROM SC_DEVICE_WARM_LOG
                    WHERE REG_DT >= ? AND REG_DT <= ?
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        DAYOFWEEK(REG_DT) as dayIndex,
                        COUNT(*) as count
                    FROM SC_COOKER_LOG
                    WHERE REG_DT >= ? AND REG_DT <= ?
                    GROUP BY dayIndex
                    ORDER BY dayIndex ASC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        CASE 
                            WHEN sr.RECIPE_NM = '백미찰진밥' THEN '찰진백미'
                            WHEN sr.RECIPE_NM = '백미고슬밥' THEN '고슬백미'
                            WHEN sr.RECIPE_NM = '혼합잡곡밥' THEN '혼합잡곡'
                            ELSE sr.RECIPE_NM 
                        END as menu, 
                        C.SOAK_LEVEL as soak, C.STEAM_LEVEL as steam, COUNT(*) as count 
                    FROM SC_COOKER_LOG C
                    JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
                    WHERE C.REG_DT >= ? AND C.REG_DT <= ? AND (C.SOAK_LEVEL > 0 OR C.STEAM_LEVEL > 0)
                    GROUP BY menu, C.SOAK_LEVEL, C.STEAM_LEVEL
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT C.SERVING_CNT as servingSize, COUNT(*) as count
                    FROM SC_COOKER_LOG C
                    JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                    WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                    AND C.SERVING_CNT >= 0 AND C.SERVING_CNT <= 5
                    AND NOT (M.MODEL_NM LIKE '%PR03%' AND C.SERVING_CNT > 2)
                    GROUP BY C.SERVING_CNT
                    ORDER BY C.SERVING_CNT ASC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT
                        SUM(CASE WHEN SOAK_LEVEL > 0 THEN 1 ELSE 0 END) as soakUsed,
                        SUM(CASE WHEN STEAM_LEVEL > 0 THEN 1 ELSE 0 END) as steamUsed,
                        SUM(CASE WHEN SOAK_LEVEL = 0 AND STEAM_LEVEL = 0 THEN 1 ELSE 0 END) as noneUsed,
                        COUNT(*) as total
                    FROM SC_COOKER_LOG
                    WHERE REG_DT >= ? AND REG_DT <= ?
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        LEFT(RESV_TIME, 2) as hourStr, 
                        COUNT(*) as count
                    FROM SC_DEVICE_RESV_TIME
                    WHERE REG_DT >= ? AND REG_DT <= ?
                    GROUP BY hourStr
                    ORDER BY hourStr ASC
                `, [startDateTime, endDateTime])
            ]);

            const hourlyTrend = Array.from({ length: 24 }).map((_, i) => ({
                hour: `${i}시`, count: 0, appCount: 0, manualCount: 0
            }));
            (hourlyRows as any[]).forEach(row => {
                const h = Number(row.hour);
                if (h >= 0 && h < 24) {
                    hourlyTrend[h].count = (Number(row.appCount) || 0) + (Number(row.manualCount) || 0);
                    hourlyTrend[h].appCount = Number(row.appCount) || 0;
                    hourlyTrend[h].manualCount = Number(row.manualCount) || 0;
                }
            });

            const warmTimeData = [
                { name: '보온안함', count: Number((warmRows as any[])[0]?.t0) || 0 },
                { name: '1~2시간', count: Number((warmRows as any[])[0]?.t2) || 0 },
                { name: '2~6시간', count: Number((warmRows as any[])[0]?.t6) || 0 },
                { name: '6~12시간', count: Number((warmRows as any[])[0]?.t12) || 0 },
                { name: '12~15시간', count: Number((warmRows as any[])[0]?.t15) || 0 },
                { name: '15~24시간', count: Number((warmRows as any[])[0]?.t24) || 0 },
                { name: '24시간 이상', count: Number((warmRows as any[])[0]?.t36) || 0 },
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

            const servingSizeTrend = (servingRows as any[]).map(row => ({
                name: `${Number(row.servingSize) + 1}인분`,
                count: Number(row.count)
            }));

            const resvTimeTrend = Array.from({ length: 24 }).map((_, i) => ({
                hour: `${String(i).padStart(2, '0')}시`, count: 0
            }));
            (resvRows as any[]).forEach(row => {
                if (row.hourStr) {
                    const hh = Number(row.hourStr);
                    if (!isNaN(hh) && hh >= 0 && hh < 24) resvTimeTrend[hh].count = Number(row.count) || 0;
                }
            });

            data = {
                topRecipes: recipeRows,
                hourlyTrend: hourlyTrend,
                warmTimeStatus: warmTimeData,
                dayOfWeekTrend: dayOfWeekTrend,
                soakSteamDetails: soakSteamRows,
                servingSizeTrend: servingSizeTrend,
                customTasteTrend: customTasteTrend,
                resvTimeTrend: resvTimeTrend
            };
        }
        else if (tab === 'smart') {
            const [
                [appCtrlRows],
                [resvRows],
                [modelAppRows]
            ] = await Promise.all([
                pool.execute(`
                    SELECT
                        COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) AS Y_CNT,
                        COUNT(CASE WHEN APP_CTRL_YN = 'N' THEN 1 END) AS N_CNT
                    FROM SC_COOKER_LOG
                    WHERE REG_DT >= ? AND REG_DT <= ?
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        LEFT(RESV_TIME, 2) as hourStr, 
                        COUNT(*) as count
                    FROM SC_DEVICE_RESV_TIME
                    WHERE REG_DT >= ? AND REG_DT <= ?
                    GROUP BY hourStr
                    ORDER BY hourStr ASC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT
                    M.MODEL_NM as modelName,
                    COUNT(*) as totalCooks,
                    SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
                    FROM SC_COOKER_LOG C
                    JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                    WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                    GROUP BY M.MODEL_NM
                    ORDER BY totalCooks DESC
                    LIMIT 10
                `, [startDateTime, endDateTime])
            ]);

            const yCount = (appCtrlRows as any[])[0]?.Y_CNT || 0;
            const nCount = (appCtrlRows as any[])[0]?.N_CNT || 0;
            const appCtrlRatio = { app: yCount, manual: nCount, total: yCount + nCount };

            const resvTimeTrend = Array.from({ length: 24 }).map((_, i) => ({
                hour: `${String(i).padStart(2, '0')}시`, count: 0
            }));
            (resvRows as any[]).forEach(row => {
                if (row.hourStr) {
                    const hh = Number(row.hourStr);
                    if (!isNaN(hh) && hh >= 0 && hh < 24) resvTimeTrend[hh].count = Number(row.count) || 0;
                }
            });

            const modelAppRatio = (modelAppRows as any[]).map(row => ({
                name: row.modelName || '기타',
                total: Number(row.totalCooks),
                app: Number(row.appCooks),
                manual: Number(row.totalCooks) - Number(row.appCooks)
            }));

            data = {
                appCtrlRatio: appCtrlRatio,
                resvTimeTrend: resvTimeTrend,
                modelAppRatio: modelAppRatio
            };
        }
        else if (tab === 'insights') {
            const [
                [retentionRows],
                [errorRows],
                [topDeviceRow]
            ] = await Promise.all([
                pool.execute(`
                    SELECT 
                        TIMESTAMPDIFF(MONTH, D.REG_DT, C.REG_DT) as month_diff,
                        COUNT(DISTINCT C.DEVICE_KEY) as active_devices
                    FROM SC_COOKER_LOG C
                    JOIN SC_DEVICE_STATUS D ON C.DEVICE_KEY = D.DEVICE_KEY
                    WHERE C.APP_CTRL_YN = 'Y'
                    AND C.REG_DT >= ? AND C.REG_DT <= ?
                    AND C.REG_DT >= D.REG_DT
                    GROUP BY month_diff
                    ORDER BY month_diff ASC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT ERR_1 as code, COUNT(*) as count 
                    FROM SC_DEVICE_ERR 
                    WHERE REG_DT >= ? AND REG_DT <= ? 
                    GROUP BY ERR_1 ORDER BY count DESC LIMIT 20
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT DEVICE_KEY, COUNT(*) as cnt 
                    FROM SC_COOKER_LOG 
                    WHERE REG_DT >= ? AND REG_DT <= ? 
                    GROUP BY DEVICE_KEY ORDER BY cnt DESC LIMIT 1
                `, [startDateTime, endDateTime])
            ]);

            let powerUserLogs: any[] = [];
            const topDevice = (topDeviceRow as any[])[0]?.DEVICE_KEY;
            if (topDevice) {
                const [pLogs] = await pool.execute(`
                    SELECT C.REG_DT as logTime, 
                           CASE 
                               WHEN sr.RECIPE_NM = '백미찰진밥' THEN '찰진백미'
                               WHEN sr.RECIPE_NM = '백미고슬밥' THEN '고슬백미'
                               WHEN sr.RECIPE_NM = '혼합잡곡밥' THEN '혼합잡곡'
                               ELSE sr.RECIPE_NM 
                           END as menu, 
                           C.APP_CTRL_YN as appCtrl,
                           C.SOAK_LEVEL as soak, C.STEAM_LEVEL as steam, C.SERVING_CNT as servingSize
                    FROM SC_COOKER_LOG C
                    LEFT JOIN SC_RECIPE sr ON C.RECIPE_KEY = sr.RECIPE_KEY
                    JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                    WHERE C.DEVICE_KEY = ? AND C.REG_DT >= ? AND C.REG_DT <= ?
                    AND NOT (M.MODEL_NM LIKE '%PR03%' AND C.SERVING_CNT > 2)
                    ORDER BY C.REG_DT DESC LIMIT 30
                `, [topDevice, startDateTime, endDateTime]);
                powerUserLogs = pLogs as any[];
            }

            const retentionTrend = (retentionRows as any[]).map(row => ({
                month: `${row.month_diff}개월 차`,
                active: Number(row.active_devices)
            }));

            data = {
                retentionTrend,
                errorCodes: errorRows,
                powerUser: {
                    deviceKey: topDevice || 'N/A',
                    logs: powerUserLogs
                }
            };
        }
        else if (tab === 'report') {
            const [
                [monthlyRegsRows],
                [dataVolumeRows],
                [modelPerfRows]
            ] = await Promise.all([
                pool.execute(`
                    SELECT DATE_FORMAT(REG_DT, '%Y-%m') as month, COUNT(*) as count
                    FROM SC_DEVICE_STATUS
                    WHERE REG_DT >= ? AND REG_DT <= ?
                    GROUP BY month ORDER BY month ASC
                `, [startDateTime, endDateTime]),
                pool.execute(`
                    SELECT 
                        (SELECT COUNT(*) FROM SC_COOKER_LOG WHERE REG_DT >= ? AND REG_DT <= ?) as cook,
                        (SELECT COUNT(*) FROM SC_DEVICE_WARM_LOG WHERE REG_DT >= ? AND REG_DT <= ?) as warm,
                        (SELECT COUNT(*) FROM SC_DEVICE_RESV_TIME WHERE REG_DT >= ? AND REG_DT <= ?) as resv
                `, [startDateTime, endDateTime, startDateTime, endDateTime, startDateTime, endDateTime]),
                pool.execute(`
                    SELECT M.MODEL_ALIAS as modelName, COUNT(*) as totalCooks,
                           SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
                    FROM SC_COOKER_LOG C
                    JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
                    WHERE C.REG_DT >= ? AND C.REG_DT <= ?
                    GROUP BY M.MODEL_ALIAS ORDER BY totalCooks DESC LIMIT 15
                `, [startDateTime, endDateTime])
            ]);

            const monthlyRegistrations = (monthlyRegsRows as any[]).map(row => ({
                month: row.month, count: Number(row.count)
            }));

            const dr = (dataVolumeRows as any[])[0] || { cook: 0, warm: 0, resv: 0 };
            const dataVolumes = [
                { name: '취사 작동 로그', count: Number(dr.cook) },
                { name: '보온 분석 로그', count: Number(dr.warm) },
                { name: '예약 취사 로그', count: Number(dr.resv) }
            ];

            const modelPerformance = (modelPerfRows as any[]).map(row => ({
                name: row.modelName || '기타',
                total: Number(row.totalCooks),
                app: Number(row.appCooks),
                manual: Number(row.totalCooks) - Number(row.appCooks)
            }));

            data = {
                monthlyRegistrations,
                dataVolumes,
                modelPerformance
            };
        }

        cache.set(cacheKey, { data, timestamp: Date.now() });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Manager API DB Error:", error);
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}
