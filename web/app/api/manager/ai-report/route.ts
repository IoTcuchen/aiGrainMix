import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Missing date range' }, { status: 400 });
    }

    const startDateTime = `${startDate} 00:00:00`;
    const endDateTime = `${endDate} 23:59:59`;
    const startYMD = startDate.replace(/-/g, '');
    const endYMD = endDate.replace(/-/g, '');

    let pool;
    try {
        pool = mysql.createPool({
            host: process.env.MGR_DB_HOST || process.env.DB_HOST,
            user: process.env.MGR_DB_USER || process.env.DB_USER,
            password: process.env.MGR_DB_PASSWORD || process.env.DB_PASSWORD,
            database: process.env.MGR_DB_NAME || process.env.DB_NAME,
            port: Number(process.env.MGR_DB_PORT) || 3306,
            connectionLimit: 5, // Low limit for AI report to keep sequential-like behavior
        });

        const reportData: any = {};

        // Step 1: Sequential Data Fetching to avoid CPU Spikes
        console.log("AI Report: Fetching Device Status...");
        const [deviceRows] = await pool.execute(`SELECT CONN_YN as status, COUNT(*) as count FROM SC_DEVICE_STATUS GROUP BY CONN_YN`);
        reportData.deviceStatus = deviceRows;

        console.log("AI Report: Fetching Cooking Trends...");
        const [trendRows] = await pool.execute(`
            SELECT DAY as dateStr, COUNT(*) as count
            FROM SC_DEVICE_COOK_LOG
            WHERE DAY BETWEEN ? AND ?
            GROUP BY DAY
            ORDER BY DAY ASC
        `, [startYMD, endYMD]);
        reportData.cookingTrends = trendRows;

        console.log("AI Report: Fetching Model Performance...");
        const [modelRows] = await pool.execute(`
            SELECT 
                M.MODEL_NM as modelName,
                COUNT(*) as totalCooks,
                SUM(CASE WHEN C.APP_CTRL_YN = 'Y' THEN 1 ELSE 0 END) as appCooks
            FROM SC_COOKER_LOG C
            JOIN SC_MODEL M ON C.MODEL_KEY = M.MODEL_KEY
            WHERE C.REG_DT >= ? AND C.REG_DT <= ?
            GROUP BY modelName ORDER BY totalCooks DESC LIMIT 15
        `, [startDateTime, endDateTime]);
        reportData.modelPerformance = modelRows;

        console.log("AI Report: Fetching Usage Habits...");
        const [recipeRows] = await pool.execute(`
            SELECT sr.RECIPE_NM as name, count(*) as count
            FROM SC_COOKER_LOG scl
            INNER JOIN SC_RECIPE sr ON scl.RECIPE_KEY = sr.RECIPE_KEY
            WHERE scl.REG_DT >= ? AND scl.REG_DT <= ?
            GROUP BY name ORDER BY count DESC LIMIT 10
        `, [startDateTime, endDateTime]);
        reportData.topRecipes = recipeRows;

        const [servingRows] = await pool.execute(`
            SELECT SERVING_CNT as servingSize, COUNT(*) as count
            FROM SC_COOKER_LOG
            WHERE REG_DT >= ? AND REG_DT <= ?
            GROUP BY SERVING_CNT ORDER BY servingSize ASC
        `, [startDateTime, endDateTime]);
        reportData.servingSizes = servingRows;

        // Step 2: Prepare Prompt for LLM
        const prompt = `
당신은 쿠첸(Cuchen)의 IoT 서비스 분석 전문가입니다. 
다음은 ${startDate}부터 ${endDate}까지의 쿠첸 스마트 밥솥 가입 및 이용 데이터 통계입니다.
이 데이터를 바탕으로 경영진에게 보고할 **'스마트 서비스 이용 행태 분석 보고서'**를 한국어로 작성해 주세요.

### 데이터 요약
1. 기기 연결 상태: ${JSON.stringify(reportData.deviceStatus)}
2. 모델별 취사 횟수 및 앱 제어 비중: ${JSON.stringify(reportData.modelPerformance)}
3. 가장 많이 사용된 메뉴 TOP 10: ${JSON.stringify(reportData.topRecipes)}
4. 취사 인분 수 분포: ${JSON.stringify(reportData.servingSizes)}

### 보고서 요구 사항
- **종합 분석**: 현재 서비스 이용의 핵심 트렌드 (예: 특정 모델의 압도적 비중, 앱 제어 활성화 정도 등)
- **사용자 패턴 추출**: 메뉴 선택 및 인분 수 데이터를 통해 본 사용자들의 식생활 특징
- **전략적 제안**: 향후 서비스 개선이나 마케팅 방향에 대한 3가지 핵심 제안
- **문체**: 정중하고 전문적인 비즈니스 보고서 형식 (Markdown 적용)
- **주의**: 수치는 정확히 인용하되, 이를 해석하여 의미 있는 인사이트를 제공하는 데 집중해 주세요.
`;

        console.log("AI Report: Generating LLM Report...");
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "당신은 데이터 분석 리포트를 작성하는 전문 비즈니스 컨설턴트입니다." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
        });

        const report = response.choices[0].message.content;

        return NextResponse.json({ report, data: reportData });
    } catch (error) {
        console.error("AI Report Error:", error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    } finally {
        if (pool) await pool.end();
    }
}
