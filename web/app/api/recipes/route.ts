// app/api/recipes/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: 'lihom-test2',
        });

        const [rows] = await connection.execute(`
      SELECT sr.RECIPE_KEY as recipeKey, sr.RECIPE_NO as recipeNo, sr.RECIPE_NM as recipeNm
      FROM SC_RECIPE sr
      LEFT JOIN SC_COOKER_CUSTOM scc ON sr.RECIPE_KEY = scc.RECIPE_KEY AND scc.DEVICE_KEY = '1766110593791'
      WHERE sr.MODEL_KEY = '1649666900327' AND sr.USE_YN = 'Y' AND sr.DEL_YN = 'N' AND sr.REG_YN = 'Y' AND sr.ADMIN_YN = 'Y'
    `);

        await connection.end();
        return NextResponse.json(rows);
    } catch (error) {
        return NextResponse.json({ error: 'DB Error' }, { status: 500 });
    }
}