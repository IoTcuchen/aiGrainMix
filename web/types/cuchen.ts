// web/types/cuchen.ts

export interface AiResult {
    title: string;
    description: string;
    ingredients: { name: string; amount: string }[];
    steps: { action: string; desc: string; time: number }[];
    imageUrl?: string;
}

// 자바 서버의 RecipeApiVO와 1:1 매칭되는 구조
export interface CuchenLegacyRequest {
    // [1. 기본 정보 & 옵션]
    recipeId?: string;        // 엑셀 0번
    modelNm: string;
    recipeTypeNm: string;
    modelCategoryNm: string;
    recipeDownTpNm: string;
    recipeNo: string;
    basicRecipeNo: string;
    recipeNm: string;
    recipeNmSub: string;
    recipeInfo: string;       // 설명
    time: string;
    resvYn: string;
    soakSteamYn: string;      // "0" or "1~3"
    customYn: string;
    timeYn: string;
    tempYn: string;
    level: string;
    serving: string;
    calorie: string;
    natrium: string;
    barcode: string;          // 바코드
    qrcode: string;           // QR코드

    // [2. 카테고리 & 해시태그]
    categoryTitle: string;
    hashtagTitle1: string;
    hashtagTitle2?: string;
    hashtagTitle3?: string;

    // [3. 리스트 데이터]
    files: { fileName: string; fileUrl: string }[];
    subFiles: { fileName: string; fileUrl: string }[];    // 서브 이미지
    materials: { name: string; qty: string }[];           // 주재료
    materialsSub: { name: string; qty: string }[];        // 부재료

    // [4. 조리 단계 및 기술 파라미터 (60종)]
    steps: {
        title: string;
        content: string;
        subTip: string;
        time: number;

        // 기술 파라미터 (밥솥 제어용)
        temp: string; temp2: string; tsTemp: string; bsTemp: string;
        steamTime1: string; steamTime2: string; steamTime3: string;
        prot1: string; prot2: string;
        soakTime: string; soakTemp: string;
        calcTime1: string; calcTime2: string; calcTime3: string; calcTime4: string; calcTime5: string;
        heatTemp1: string; heat1: string; delayTime1: string; delayTemp1: string;
        heatTemp2: string; heat2: string; delayTime2: string; delayTemp2: string;
        cover: string;
        levelErange: string; timeErange: string;
    }[];
}