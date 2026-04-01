const mysql = require('mysql2/promise');

async function main() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'admin',
            password: 'lihomwifi!234',
            database: 'cuchenon',
            port: 33306
        });

        const fs = require('fs');
        let out = "";

        // All relevant tables
        const tables = [
            'SC_COOKER_LOG',
            'SC_DEVICE_STATUS',
            'SC_DEVICE_WARM_LOG',
            'SC_DEVICE_RESV_TIME',
            'SC_DEVICE_COOK_LOG',
            'SC_MODEL',
            'SC_RECIPE',
            'SC_MEM',
        ];

        for (const t of tables) {
            const [rows] = await connection.execute(`SHOW INDEX FROM ${t}`);
            out += `\n=== ${t} ===\n`;
            out += rows.map(r => `  [${r.Key_name}] col=${r.Column_name} seq=${r.Seq_in_index} card=${r.Cardinality}`).join('\n') + '\n';
        }

        // Also get row counts
        out += '\n=== ROW COUNTS ===\n';
        for (const t of tables) {
            try {
                const [[row]] = await connection.execute(`SELECT COUNT(*) as cnt FROM ${t}`);
                out += `  ${t}: ${row.cnt}\n`;
            } catch (e) {
                out += `  ${t}: ERROR\n`;
            }
        }

        fs.writeFileSync('full_index_check.txt', out);
        console.log('Done. See full_index_check.txt');
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}
main();
