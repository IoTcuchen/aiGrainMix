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
    const deviceKey = localStorage.getItem('deviceKey');
    const modelKey = localStorage.getItem('modelKey');

    if (!deviceKey || !modelKey) {
      console.error("Missing deviceKey or modelKey in localStorage.");
      // You might want to redirect to login or show an error state here.
      return;
    }

    fetch(`/api/recipes?deviceKey=${deviceKey}&modelKey=${modelKey}`)
      .then(res => res.json())
      .then(data => {
        const formattedList = data.map((r: any) => ({
          ...r,
          recipeNo: String(r.recipeNo),
          recipeKey: String(r.recipeKey),
          recipeNm: String(r.recipeNm)
        })).sort((a: any, b: any) => parseInt(a.recipeNo) - parseInt(b.recipeNo));
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

    const deviceKey = localStorage.getItem('deviceKey');
    const modelKey = localStorage.getItem('modelKey');

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
    const deviceKey = localStorage.getItem('deviceKey');
    const modelKey = localStorage.getItem('modelKey');

    if (!deviceKey || !modelKey || !currentToken) {
      alert("연결 정보가 부족합니다. 다시 로그인해주세요.");
      return;
    }

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
      const response = await fetch('/api/cuchen/sendCommand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipeKey,
          recipeNo,
          deviceKey,
          modelKey,
          accessToken: currentToken
        })
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

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <main className="flex min-h-screen flex-col items-center p-6 bg-white">
      {/* 상단바: 더 깔끔한 디자인 */}
      <header className="relative w-full flex items-center justify-between mb-10 mt-2 z-50">
        <button
          onClick={() => router.back()}
          className="p-2.5 text-gray-400 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="w-7 h-7" />
        </button>
        <h2 className="absolute left-1/2 transform -translate-x-1/2 font-bold text-xl tracking-tight text-gray-900">
          쿠첸 AI 맞춤 취사
        </h2>

        {/* 우측 상단 메뉴 (불러온 레시피 확인/즉시 취사) */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-brand-accent transition-all bg-white border border-gray-200 hover:border-brand-accent rounded-full shadow-sm hover:shadow-md"
            aria-label="레시피 목록"
          >
            <span className="text-sm font-semibold tracking-tight">메뉴</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-sm">취사가능 메뉴</span>
              </div>
              <ul className="max-h-60 overflow-y-auto custom-scrollbar">
                {appState.recipe_list.length > 0 ? (
                  appState.recipe_list.map((r: any) => (
                    <li key={r.recipeKey} className="border-b border-gray-50 last:border-none">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          executeCook(r.recipeNo, r.recipeKey, r.recipeNm);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium text-gray-800 group-hover:text-brand-accent">
                          {r.recipeNm}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md group-hover:bg-brand-accent group-hover:text-white transition-colors">
                          취사
                        </span>
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-4 text-center text-sm text-gray-500">
                    레시피가 없습니다.
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
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