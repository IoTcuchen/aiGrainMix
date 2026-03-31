const fs = require('fs');
const mysql = require('mysql2/promise');
async function main() {
    try {
        const conn = await mysql.createConnection({ host: '127.0.0.1', user: 'admin', password: 'lihomwifi!234', database: 'cuchenon', port: 33306 });
        const [cols] = await conn.execute("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('SC_COOKER_LOG', 'SC_MODEL', 'SC_DEVICE_STATUS')");
        fs.writeFileSync('db_cols_utf8.json', JSON.stringify(cols, null, 2), 'utf8');
        await conn.end();
    } catch (e) {
        console.error(e);
    }
}
main();
