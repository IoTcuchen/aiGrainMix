import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let connection: mysql.Connection | null = null;

  try {
    const { searchParams } = new URL(request.url);
    const deviceKey = searchParams.get('deviceKey');
    const modelKey = searchParams.get('modelKey');

    if (!deviceKey || !modelKey) {
      return NextResponse.json(
        {
          code: 'RECIPE_PARAM_MISSING',
          message: 'deviceKey와 modelKey가 필요합니다.',
          retryable: false,
        },
        { status: 400 },
      );
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'lihom-test2',
    });

    const [rows] = await connection.execute(
      `
      SELECT sr.RECIPE_KEY as recipeKey, sr.RECIPE_NO as recipeNo, sr.RECIPE_NM as recipeNm
      FROM SC_RECIPE sr
      LEFT JOIN SC_COOKER_CUSTOM scc ON sr.RECIPE_KEY = scc.RECIPE_KEY AND scc.DEVICE_KEY = ?
      WHERE sr.MODEL_KEY = ? AND sr.USE_YN = 'Y' AND sr.DEL_YN = 'N' AND sr.REG_YN = 'Y' AND sr.ADMIN_YN = 'Y'
    `,
      [deviceKey, modelKey],
    );

    return NextResponse.json(rows);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'DB Error';
    return NextResponse.json(
      { code: 'RECIPE_DB_ERROR', message, retryable: true },
      { status: 500 },
    );
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
