import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceKey = searchParams.get('deviceKey');
    const modelKey = searchParams.get('modelKey');

    if (!deviceKey || !modelKey) {
      return NextResponse.json({ error: 'Missing deviceKey or modelKey parameters' }, { status: 400 });
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_HOST === '127.0.0.1' ? 33306 : Number(process.env.DB_PORT) || 3306,
    });

    const [rows] = await connection.execute(`
            SELECT sr.RECIPE_KEY as recipeKey, sr.RECIPE_NO as recipeNo, sr.RECIPE_NM as recipeNm
            FROM SC_RECIPE sr
            LEFT JOIN SC_COOKER_CUSTOM scc ON sr.RECIPE_KEY = scc.RECIPE_KEY AND scc.DEVICE_KEY = ?
            WHERE sr.MODEL_KEY = ? AND sr.USE_YN = 'Y' AND sr.DEL_YN = 'N' AND sr.REG_YN = 'Y' AND sr.ADMIN_YN = 'Y'
        `, [deviceKey, modelKey]);

    await connection.end();
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Recipe API DB Error:", error);
    return NextResponse.json({ error: 'DB Error' }, { status: 500 });
  }
}
