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

        const tables = ['SC_COOKER_LOG', 'SC_DEVICE_STATUS', 'SC_DEVICE_WARM_LOG', 'SC_DEVICE_RESV_TIME', 'SC_DEVICE_COOK_LOG'];
        const fs = require('fs');
        let output = "";
        for (const table of tables) {
            output += `=== INDEXES FOR ${table} ===\n`;
            const [rows] = await connection.execute(`SHOW INDEX FROM ${table}`);
            output += JSON.stringify(rows.map(r => ({
                Table: r.Table,
                Column: r.Column_name,
                Key_name: r.Key_name,
                Seq_in_index: r.Seq_in_index,
                Cardinality: r.Cardinality
            })), null, 2) + "\n\n";
        }
        fs.writeFileSync('index_info.json', output);
        console.log("Index info written to index_info.json");

        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}
main();
