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

async function applyIndexes() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_HOST === '127.0.0.1' ? 33306 : Number(process.env.DB_PORT) || 3306,
    });

    try {
        console.log("Adding idx_reg_dt on SC_COOKER_LOG...");
        try {
            await pool.execute("CREATE INDEX idx_reg_dt ON SC_COOKER_LOG(REG_DT)");
            console.log("Success: SC_COOKER_LOG index added.");
        } catch (e) {
            console.log("Skipping or Error:", e.message);
        }

        console.log("Adding idx_reg_dt on SC_DEVICE_WARM_LOG...");
        try {
            await pool.execute("CREATE INDEX idx_warm_reg_dt ON SC_DEVICE_WARM_LOG(REG_DT)");
            console.log("Success: SC_DEVICE_WARM_LOG index added.");
        } catch (e) {
            console.log("Skipping or Error:", e.message);
        }

        console.log("Adding idx_reg_dt on SC_DEVICE_RESV_TIME...");
        try {
            await pool.execute("CREATE INDEX idx_resv_reg_dt ON SC_DEVICE_RESV_TIME(REG_DT)");
            console.log("Success: SC_DEVICE_RESV_TIME index added.");
        } catch (e) {
            console.log("Skipping or Error:", e.message);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

applyIndexes().catch(console.error);
