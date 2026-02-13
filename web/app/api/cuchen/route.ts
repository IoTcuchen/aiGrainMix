// web/app/api/cuchen/route.ts

import { NextResponse } from 'next/server';
import { AiResult, CuchenLegacyRequest } from '@/types/cuchen';

// 자바 서버 주소
const BASE_URL = process.env.NEXT_PUBLIC_JAVA_SERVER_URL || "http://localhost:8080";
const LEGACY_SERVER_URL = `${BASE_URL}/manager/cont/importRecipeApi.action`;


// 테스트 위해 기존 레시피 엑셀 기준으로 하드코딩; AI 결과에 따라 동적으로 변환 필요
export async function POST(request: Request) {
    try {
        // 1. 프론트엔드에서 보낸 AI 결과 수신
        const aiResult: AiResult = await request.json();

        // 2. 데이터 매핑 (AI 결과 -> 자바 서버 엑셀 포맷)
        const payload: CuchenLegacyRequest[] = [{

            // ==========================================
            // [1] 기본 정보 & 옵션 (0~19, 28, 29번 컬럼)
            // ==========================================
            recipeId: "202602031637",                   // 0 레시피ID
            modelNm: "PR03_FND",        // 1 모델명
            recipeTypeNm: "서버",           // 2 내장/서버
            modelCategoryNm: "AI",      // 3 모델카테고리
            recipeDownTpNm: "서버취반",   // 4 요리 다운로드

            recipeNo: "212",              // 5 레시피 서버 번호
            basicRecipeNo: "4",             // 6 레시피 내장 번호
            //recipeNm: ` ${aiResult.title}`,
            recipeNm: "AI잡곡",           // 7 레시피 제목
            recipeNmSub: "AI잡곡",          // 8 레시피 소제목
            // recipeInfo: aiResult.description || "AI가 분석한 최적의 잡곡 블렌드입니다.",
            recipeInfo: "",  // 9 요리 정보

            time: "40",                     // 10 총 요리시간
            resvYn: "불가능",                 // 11 예약가능여부
            soakSteamYn: "0",               // 12 불림뜸 번호
            customYn: "0",                  // 13 미세밥맛 번호
            timeYn: "불가능",                 // 14 시간조절 가능
            tempYn: "불가능",               // 15 온도설정여부
            level: "쉬움",                  // 16 난이도
            serving: "2",                   // 17 용량
            calorie: "",                   // 18 칼로리
            natrium: "",                   // 19 나트륨
            barcode: "",
            qrcode: "",

            // ==========================================
            // [2] 카테고리 & 해시태그 (22~25번 컬럼)
            // ==========================================
            categoryTitle: "밥",          // 22 종류별 리스트
            hashtagTitle1: "아이성장",          // 23 상황별 리스트 1
            hashtagTitle2: "",       // 24 상황별 리스트 2
            hashtagTitle3: "",              // 25 상황별 리스트 3

            // ==========================================
            // [3] 리스트 데이터 (파일, 재료)
            // ==========================================
            // 메인 이미지
            // files: [
            //     {
            //         fileName: "ai_main.jpg",
            //         fileUrl: aiResult.imageUrl || "http://placehold.it/500x500" // 이미지 없을 시 더미
            //     }
            // ],
            files: [],
            // 서브 이미지 (없음)
            subFiles: [],

            // 주재료
            materials: aiResult.ingredients.map(ing => ({
                name: ing.name,
                qty: ing.amount
            })),
            // 부재료 (없음)
            materialsSub: [],

            // ==========================================
            // [4] 조리 단계 및 기술 파라미터 (30~60번 컬럼)
            // ==========================================
            steps: aiResult.steps.map(step => ({
                // 기본 텍스트 정보
                title: step.action,
                content: step.desc,
                subTip: "",
                time: step.time,

                // ----------------------------------------------------
                // 기술 파라미터 (밥솥 제어값) - 안전하게 모두 "0" 처리
                // ----------------------------------------------------
                temp: "0",            // [34]
                temp2: "0",           // [35]
                tsTemp: "0",          // [36]
                bsTemp: "0",          // [37]
                steamTime1: "0",      // [38]
                steamTime2: "0",      // [39]
                steamTime3: "0",      // [40]
                prot1: "0",           // [41]
                prot2: "0",           // [42]
                soakTime: "0",        // [43]
                soakTemp: "0",        // [44]
                calcTime1: "0",       // [45]
                calcTime2: "0",       // [46]
                calcTime3: "0",       // [47]
                calcTime4: "0",       // [48]
                calcTime5: "0",       // [49]
                heatTemp1: "0",       // [50]
                heat1: "0",           // [51]
                delayTime1: "0",      // [52]
                delayTemp1: "0",      // [53]
                heatTemp2: "0",       // [54]
                heat2: "0",           // [55]
                delayTime2: "0",      // [56]
                delayTemp2: "0",      // [57]
                cover: "0",           // [58]
                levelErange: "0",     // [59]
                timeErange: "0"       // [60]
            }))
        }];

        console.log("[Next.js] Sending payload to Java server:", JSON.stringify(payload, null, 2));

        // 3. 자바 서버로 전송
        const response = await fetch(LEGACY_SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
            },
            body: JSON.stringify(payload),
        });

        // 4. 응답 처리
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Java Server Error] ${response.status}: ${errorText}`);
            throw new Error(`Java Server Error: ${response.status}`);
        }

        const javaResult = await response.json();

        // 자바 서버 내부 로직 실패 체크 (status: fail인 경우)
        if (javaResult.status === 'fail' || javaResult.status === 'error') {
            throw new Error(javaResult.message || 'Java Server Process Failed');
        }

        return NextResponse.json({ success: true, data: javaResult });

    } catch (error: any) {
        console.error("[Export Error]:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}