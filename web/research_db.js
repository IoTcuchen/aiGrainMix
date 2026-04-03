const mysql = require('mysql2/promise');
const fs = require('fs');
async function main() {
    try {
        const pool = mysql.createPool({
            host: '127.0.0.1',
            port: 33306,
            user: 'admin',
            password: 'lihomwifi!234',
            database: 'cuchenon'
        });

        const result = {};
        async function getTableInfo(table) {
            const [cols] = await pool.execute(`DESC ${table}`);
            result[table] = cols.map(c => c.Field);
        }

        await getTableInfo('SC_MEM');
        await getTableInfo('TB_SVC_MEM');
        await getTableInfo('SC_DEVICE_STATUS');
        await getTableInfo('SC_RECIPE');

        fs.writeFileSync('research_result.json', JSON.stringify(result, null, 2));
        console.log('Result written to research_result.json');

        await pool.end();
    } catch (e) {
        console.error(e);
    }
}
main();
