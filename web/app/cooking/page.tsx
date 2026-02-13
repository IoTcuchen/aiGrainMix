'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, CameraIcon } from '@/components/icons';
import VoiceRecorder from '@/components/VoiceRecorder';

function CookingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [userName, setUserName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatStatus, setChatStatus] = useState("무엇을 도와드릴까요?");
    const [recipeList, setRecipeList] = useState([]);

    useEffect(() => {
        setUserName(localStorage.getItem('userName'));
        // 1. 페이지 로드 시 DB에서 유효 레시피 목록 조회
        fetch('/api/recipes')
            .then(res => res.json())
            .then(data => setRecipeList(data))
            .catch(err => console.error("Recipe Load Error:", err));
    }, []);

    // 음성 인식이 완료되어 텍스트(transcript)가 돌아왔을 때 실행
    const handleVoiceResult = async (transcript: string) => {
        setChatStatus(`"${transcript}" 분석 중...`);
        setIsProcessing(true);

        try {
            // 2. Python FastAPI 서버의 cooking 라우터 호출 (GPT-4o 분석)
            const response = await fetch('http://localhost:8000/api/cooking/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: transcript,
                    recipe_list: recipeList
                })
            });

            if (!response.ok) throw new Error("LLM Server Error");

            const selected = await response.json();
            setChatStatus(selected.reason); // LLM의 추천 사유 출력

            // 3. 분석된 결과(recipeNo, recipeKey)로 밥솥 명령 전송
            await executeCook(selected.recipeNo, selected.recipeKey, selected.recipeNm);
        } catch (error) {
            console.error("Analysis Error:", error);
            setChatStatus("명령을 이해하지 못했습니다. 다시 말씀해주세요.");
        } finally {
            setIsProcessing(false);
        }
    };

    const executeCook = async (recipeNo: string, recipeKey: string, recipeNm: string) => {
        const currentToken = localStorage.getItem('accessToken');
        const svcKey = localStorage.getItem('svcKey') || "1422266982285";

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
        bodyParams.append('deviceKey', "1766110593791");
        bodyParams.append('modelKey', "1649666900327");
        bodyParams.append('recipeKey', recipeKey);
        bodyParams.append('params', JSON.stringify(params));

        try {
            const response = await fetch('/cuchenon/api/sendCommand.action?event=sendCommand', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Service-Identifier': svcKey,
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: bodyParams
            });

            const result = await response.json();
            if (result.success === true || (result.bean && !result.bean.error)) {
                alert(`✅ ${recipeNm} 취사 시작!`);
            } else {
                setChatStatus("밥솥 상태를 확인해 주세요.");
                alert(`❌ 오류: ${result.errors?.[0]?.message || "취사 불가"}`);
            }
        } catch (e) {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-[#F8F9FA]">
            <header className="w-full flex items-center mb-10">
                <button onClick={() => router.back()} className="p-2 text-gray-500 bg-white rounded-full shadow-sm">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h2 className="flex-1 text-center font-bold text-lg pr-10">음성 맞춤 취사</h2>
            </header>

            <div className="w-full max-w-md flex flex-col items-center justify-between flex-1 pb-20">
                <div className="flex flex-col items-center space-y-8 mt-10">
                    {/* 에이전트 캐릭터/아이콘 */}
                    <div className={`w-32 h-32 rounded-full bg-white shadow-2xl flex items-center justify-center transition-all duration-500 ${isProcessing ? 'scale-110 ring-8 ring-orange-100' : ''}`}>
                        <CameraIcon className={`w-16 h-16 ${isProcessing ? 'text-orange-500' : 'text-gray-300'}`} />
                    </div>

                    {/* 대화 텍스트 박스 */}
                    <div className="text-center px-4">
                        <p className="text-2xl font-bold text-gray-800 leading-tight break-keep">
                            {chatStatus}
                        </p>
                    </div>
                </div>

                {/* 하단 마이크 컨트롤러 */}
                <VoiceRecorder
                    onResult={handleVoiceResult}
                    isProcessing={isProcessing}
                />
            </div>
        </main>
    );
}

export default function CookingPage() {
    return (
        <Suspense fallback={null}>
            <CookingContent />
        </Suspense>
    );
}