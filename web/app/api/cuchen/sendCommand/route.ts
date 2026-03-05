import { NextResponse } from 'next/server';

const LEGACY_SERVER_URL = process.env.LOCAL_API_URL || "http://localhost:8080";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { recipeKey, recipeNo, deviceKey, modelKey, accessToken, svcKey } = body;

        // 쿠첸 서버 API에 필요한 파라미터 세팅
        const params = {
            menu: recipeNo,
            reservMin1: 0, reservMin2: 0,
            isKeepWarming: 1,
            keepWarmingMin1: 3, keepWarmingMin2: 132,
            cookTime1: 0, cookTime2: 0,
            temp: 0, isMyRecipe: "0",
        };

        const bodyParams = new URLSearchParams();
        bodyParams.append('apiAlias', 'cooking');
        bodyParams.append('deviceKey', deviceKey);
        bodyParams.append('modelKey', modelKey);
        bodyParams.append('recipeKey', recipeKey);
        bodyParams.append('params', JSON.stringify(params));


        const targetUrl = `${LEGACY_SERVER_URL}/cuchenon/api/sendCommand.action?event=sendCommand`;

        // 외부 요청 전송 (CORS 등 브라우저 제약 우회)
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Service-Identifier': svcKey as string,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            body: bodyParams
        });

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("sendCommand Proxy Error:", error);
        return NextResponse.json({ success: false, error: 'Command Failed' }, { status: 500 });
    }
}
