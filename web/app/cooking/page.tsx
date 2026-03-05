'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@/components/icons';
import VoiceRecorder from '@/components/VoiceRecorder';

function CookingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [userName, setUserName] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chatStatus, setChatStatus] = useState("원하시는 목적에 맞는 메뉴로 맞춤 취사 해드릴게요. 재료나 식감, 원하는 요리 등을 말씀해주세요.");

    // 대화형 오케스트레이터를 위한 상태 추가
    const [messages, setMessages] = useState<any[]>([]);
    const [appState, setAppState] = useState<any>({
        conversation_stage: "start",
        cooking_state: {
            ingredient: null,
            purpose: null,
            texture: null,
            specific_menu: null
        },
        recipe_list: []
    });

    useEffect(() => {
        setUserName(localStorage.getItem('userName'));
        fetch('/api/recipes')
            .then(res => res.json())
            .then(data => {
                const formattedList = data.map((r: any) => ({
                    ...r,
                    recipeNo: String(r.recipeNo),
                    recipeKey: String(r.recipeKey),
                    recipeNm: String(r.recipeNm)
                }));
                // 초기 레시피 목록을 appState에 세팅
                setAppState((prev: any) => ({ ...prev, recipe_list: formattedList }));
            })
            .catch(err => console.error("Recipe Load Error:", err));
    }, []);

    const handleVoiceResult = async (transcript: string) => {
        setChatStatus(`"${transcript}" 분석 중...`);
        setIsProcessing(true);

        const newUserMessage = { role: "user", content: transcript };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);

        try {
            const response = await fetch('/api/cooking/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    appState: appState
                })
            });

            if (!response.ok) throw new Error("LLM Server Error");

            const result = await response.json();

            // AI 응답 처리
            if (result.message) {
                setChatStatus(result.message.content);
                setMessages(prev => [...prev, { role: "bot", content: result.message.content }]);
            }

            // 앱 상태 및 요리 컨텍스트 업데이트
            if (result.appState) {
                setAppState((prev: any) => ({ ...prev, ...result.appState }));
            }

            // 확정되어 취사 가능한 경우
            if (result.isComplete && result.message.cook_command) {
                const cmd = result.message.cook_command;
                await executeCook(cmd.recipeNo, cmd.recipeKey, cmd.recipeNm);
            }

        } catch (error) {
            console.error("Analysis Error:", error);
            setChatStatus("명령을 이해하지 못했습니다. 다시 말씀해주세요.");
        } finally {
            setIsProcessing(false);
        }
    };

    const goBackToCuchen = () => {
        if (typeof window === 'undefined') return;

        const deviceKey = localStorage.getItem('deviceKey') || "1766110593791";
        const modelKey = localStorage.getItem('modelKey') || "1649666900327";

        // 1. 앱 네이티브 기능을 호출하기 위한 Custom Scheme 구성
        // iOS 코드 매칭: if let scheme = url.scheme, scheme == "cuchen"
        if (modelKey && deviceKey) {
            // 예: cuchen://start_cooking?modelKey=123&deviceKey=456
            const targetUrl = `cuchen://start_cooking?modelKey=${modelKey}&deviceKey=${deviceKey}`;

            console.log("앱 네이티브 명령 호출:", targetUrl);

            // 웹뷰가 이 URL로 이동을 시도하면, iOS Native Code가 이를 가로채서 실행합니다.
            window.location.href = targetUrl;
            return;
        }

        else {
            router.back();
        }
    };


    const executeCook = async (recipeNo: string, recipeKey: string, recipeNm: string) => {
        const currentToken = localStorage.getItem('accessToken');
        const svcKey = localStorage.getItem('svcKey') || "1422266982285";
        const deviceKey = localStorage.getItem('deviceKey') || "1766110593791";
        const modelKey = localStorage.getItem('modelKey') || "1649666900327";

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
            const d = result.bean;

            if (result.success === true || (d && !d.error)) {
                setChatStatus(`${recipeNm} 취사가 시작되었습니다.`);
                setTimeout(() => {
                    goBackToCuchen();
                }, 2000);
            } else {
                setChatStatus("밥솥 상태를 확인해 주세요.");

                let errorMessage = "취사를 실패하였습니다.\\n밥솥의 연결상태를 확인해주세요.";

                if (d && d.error) {
                    if (d.error === "status") {
                        if (d.status === "823002" || d.status === "823007") {
                            errorMessage = "취사중에는 밥솥 제어가 불가능합니다.";
                        } else if (d.status === "823003") {
                            errorMessage = "예약취사중에는 제어가 불가능합니다.";
                        } else if (d.status === "823004") {
                            errorMessage = "보온중에는 밥솥 제어가 불가능합니다.";
                        } else if (d.status === "823005") {
                            errorMessage = "재가열중에는 밥솥 제어가 불가능합니다.";
                        } else if (d.status === "823006") {
                            errorMessage = "자동세척중에는 밥솥 제어가 불가능합니다.";
                        } else if (d.status === "823099") {
                            errorMessage = "업데이트중에는 밥솥 제어가 불가능합니다.";
                        } else {
                            errorMessage = "동작중에는 밥솥 제어가 불가능합니다.";
                        }
                    } else if (d.error === "sensorHeadOpenYn") {
                        errorMessage = "밥솥의 뚜껑을 확인해주세요.";
                    } else if (d.error === "possible") {
                        errorMessage = "뚜껑을 열어 내용물을 확인 후 원격 제어 부탁드립니다.";
                    }
                } else if (result.errors?.[0]?.message) {
                    errorMessage = result.errors[0].message;
                }

                alert(errorMessage);
            }
        } catch (e) {
            alert("네트워크 오류가 발생했습니다.");
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center p-6 bg-white">
            {/* 상단바: 더 깔끔한 디자인 */}
            <header className="w-full flex items-center mb-10 mt-2">
                <button
                    onClick={() => router.back()}
                    className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeftIcon className="w-7 h-7" />
                </button>
                <h2 className="flex-1 text-center font-bold text-xl pr-10 tracking-tight text-gray-900">쿠첸 AI 맞춤 취사</h2>
            </header>

            <div className="w-full max-w-md flex flex-col items-center justify-between flex-1 pb-16">
                <div className="flex flex-col items-center space-y-12 mt-12 w-full">

                    {/* 현대적인 AI Orb 에이전트 */}
                    <div className="relative flex items-center justify-center">
                        {/* 배경 후광 효과 */}
                        <div className={`absolute w-48 h-48 bg-orange-300/20 rounded-full blur-3xl transition-all duration-1000 ${isProcessing ? 'opacity-100 scale-125' : 'opacity-40'}`} />

                        {/* 메인 AI 구체 */}
                        <div className={`
                            relative w-32 h-32 rounded-full flex items-center justify-center 
                            bg-gradient-to-br from-orange-400 to-orange-600 
                            shadow-[0_20px_50px_rgba(251,146,60,0.3)]
                            transition-all duration-700 ease-in-out
                            ${isProcessing ? 'scale-110 rotate-180' : 'scale-100'}
                        `}>
                            {/* 화이트 로고/심볼 (추상적인 AI 패턴) */}
                            <div className="flex gap-1.5">
                                <span className={`w-1.5 h-8 bg-white/90 rounded-full ${isProcessing ? 'animate-bounce' : ''}`} style={{ animationDelay: '0ms' }} />
                                <span className={`w-1.5 h-12 bg-white rounded-full ${isProcessing ? 'animate-bounce' : ''}`} style={{ animationDelay: '150ms' }} />
                                <span className={`w-1.5 h-8 bg-white/90 rounded-full ${isProcessing ? 'animate-bounce' : ''}`} style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>

                    {/* 대화 텍스트 박스: 폰트 가독성 향상 */}
                    <div className="text-center px-8 w-full">
                        <p className="text-[22px] font-semibold text-gray-900 leading-[1.4] break-keep tracking-tight">
                            {chatStatus}
                        </p>
                    </div>
                </div>

                {/* 하단 마이크 컨트롤러 영역 */}
                <div className="w-full flex justify-center">
                    <VoiceRecorder
                        onResult={handleVoiceResult}
                        isProcessing={isProcessing}
                    />
                </div>
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