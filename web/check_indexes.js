const fs = require('fs');
const mysql = require('mysql2/promise');

try {
    const envFileData = fs.readFileSync('.env', 'utf8');
    envFileData.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const val = parts.slice(1).join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
            if (key) process.env[key] = val;
        }
    });
} catch (e) { }

async function check() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_HOST === '127.0.0.1' ? 33306 : Number(process.env.DB_PORT) || 3306,
    });

    try {
        const [indexes] = await pool.execute('SHOW INDEX FROM SC_COOKER_LOG');
        console.log("=== SC_COOKER_LOG INDEXES ===");
        console.dir(indexes.map(i => i.Key_name + " : " + i.Column_name), { depth: null });

        const queries = {
            recipe: `EXPLAIN SELECT sr.RECIPE_NM as name, count(sr.RECIPE_NM) as count
                     FROM SC_COOKER_LOG scl
                     INNER JOIN SC_RECIPE sr ON scl.RECIPE_KEY = sr.RECIPE_KEY
                     WHERE scl.REG_DT >= '2025-12-30 00:00:00' AND scl.REG_DT <= '2026-03-30 23:59:59'
                     GROUP BY sr.RECIPE_NM ORDER BY count DESC LIMIT 10`,

            hourly: `EXPLAIN SELECT HOUR(REG_DT) as hour, 
                     COUNT(CASE WHEN APP_CTRL_YN = 'Y' THEN 1 END) as appCount,
                     COUNT(CASE WHEN APP_CTRL_YN = 'N' THEN 1 END) as manualCount
                     FROM SC_COOKER_LOG
                     WHERE REG_DT >= '2025-12-30 00:00:00' AND REG_DT <= '2026-03-30 23:59:59'
                     GROUP BY hour ORDER BY hour ASC`,

            warm: `EXPLAIN SELECT count(case when WARM_TIME = 0 then 1 end) as t0
                     FROM SC_DEVICE_WARM_LOG
                     WHERE REG_DT >= '2025-12-30 00:00:00' AND REG_DT <= '2026-03-30 23:59:59'`,

            smart_model: `EXPLAIN SELECT M.MODEL_ALIAS as modelName, COUNT(*) as totalCooks FROM SC_COOKER_LOG C JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY WHERE C.REG_DT >= '2025-12-30' AND C.REG_DT <= '2026-03-30' GROUP BY M.MODEL_ALIAS`,

            retention: `EXPLAIN SELECT TIMESTAMPDIFF(MONTH, D.REG_DT, C.REG_DT) as month_diff, COUNT(DISTINCT C.DEVICE_KEY) as active_devices
                        FROM SC_COOKER_LOG C JOIN SC_DEVICE_STATUS D ON C.DEVICE_KEY = D.DEVICE_KEY
                        WHERE C.APP_CTRL_YN = 'Y' AND C.REG_DT >= '2025-12-30' AND C.REG_DT <= '2026-03-30' GROUP BY month_diff`
        };

        for (let q in queries) {
            console.log(`\n=== EXPLAIN ${q} ===`);
            const [rows] = await pool.execute(queries[q]);
            console.log(JSON.stringify(rows[0], null, 2));
            if (rows[1]) console.log(JSON.stringify(rows[1], null, 2));
        }

    } finally {
        await pool.end();
    }
}
check();
