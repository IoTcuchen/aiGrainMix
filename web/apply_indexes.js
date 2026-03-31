const mysql = require('mysql2/promise');

async function main() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '127.0.0.1',
            user: process.env.DB_USER || 'admin',
            password: process.env.DB_PASSWORD || 'lihomwifi!234',
            database: process.env.DB_NAME || 'cuchenon',
            port: Number(process.env.DB_PORT) || 33306
        });

        console.log("Adding missing indexes...");

        try {
            await connection.execute('CREATE INDEX idx_status_reg_dt ON SC_DEVICE_STATUS(REG_DT)');
            console.log("Created idx_status_reg_dt on SC_DEVICE_STATUS(REG_DT)");
        } catch (e) {
            console.log("idx_status_reg_dt probably exists or error:", e.message);
        }

        try {
            await connection.execute('CREATE INDEX idx_cook_log_day ON SC_DEVICE_COOK_LOG(DAY)');
            console.log("Created idx_cook_log_day on SC_DEVICE_COOK_LOG(DAY)");
        } catch (e) {
            console.log("idx_cook_log_day probably exists or error:", e.message);
        }

        console.log("Optimization complete.");
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}
main();
