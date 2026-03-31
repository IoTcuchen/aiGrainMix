const mysql = require('mysql2/promise');

async function main() {
    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: 'admin',
            password: 'lihomwifi!234',
            database: 'cuchenon',
            port: 33306
        });

        console.log("=== SC_COOKER_LOG ===");
        const [cookerCols] = await connection.execute('DESCRIBE SC_COOKER_LOG');
        console.table(cookerCols);

        console.log("=== SC_DEVICE_STATUS ===");
        const [devCols] = await connection.execute('DESCRIBE SC_DEVICE_STATUS');
        console.table(devCols);

        console.log("=== SC_MODEL ===");
        const [modelCols] = await connection.execute('DESCRIBE SC_MODEL');
        console.table(modelCols);

        await connection.end();
    } catch (e) {
        console.error(e);
    }
}
main();
