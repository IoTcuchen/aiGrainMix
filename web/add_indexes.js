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

        const indexes = [
            // SC_COOKER_LOG - 가장 쿼리가 많은 테이블
            { table: 'SC_COOKER_LOG', name: 'idx_cooker_model_reg', sql: 'CREATE INDEX idx_cooker_model_reg ON SC_COOKER_LOG (MODEL_KEY, REG_DT)' },
            { table: 'SC_COOKER_LOG', name: 'idx_cooker_app_reg', sql: 'CREATE INDEX idx_cooker_app_reg ON SC_COOKER_LOG (APP_CTRL_YN, REG_DT)' },
            { table: 'SC_COOKER_LOG', name: 'idx_cooker_recipe_reg', sql: 'CREATE INDEX idx_cooker_recipe_reg ON SC_COOKER_LOG (RECIPE_KEY, REG_DT)' },
            { table: 'SC_COOKER_LOG', name: 'idx_cooker_device_reg', sql: 'CREATE INDEX idx_cooker_device_reg ON SC_COOKER_LOG (DEVICE_KEY, REG_DT)' },
            // SC_DEVICE_WARM_LOG - REG_DT + MODEL_KEY 복합 (models 탭)
            { table: 'SC_DEVICE_WARM_LOG', name: 'idx_warm_model_reg', sql: 'CREATE INDEX idx_warm_model_reg ON SC_DEVICE_WARM_LOG (MODEL_KEY, REG_DT)' },
        ];

        for (const idx of indexes) {
            try {
                console.log(`Creating ${idx.name} on ${idx.table}...`);
                await connection.execute(idx.sql);
                console.log(`  ✓ Done`);
            } catch (e) {
                if (e.code === 'ER_DUP_KEYNAME') {
                    console.log(`  → Already exists, skipping.`);
                } else {
                    console.log(`  ✗ Error: ${e.message}`);
                }
            }
        }

        console.log('\nAll done!');
        await connection.end();
    } catch (e) {
        console.error(e);
        if (connection) await connection.end();
    }
}
main();
