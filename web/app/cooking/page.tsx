'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon } from '@/components/icons';
import VoiceRecorder from '@/components/VoiceRecorder';
import { getRecipes, analyzeCookingStatus } from '@/lib/api/cooking';
import { sendCookCommand } from '@/lib/api/cuchen';

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

    getRecipes(deviceKey, modelKey)
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
      const result = await analyzeCookingStatus(updatedMessages, appState);

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
      const result = await sendCookCommand({
        recipeKey,
        recipeNo,
        deviceKey,
        modelKey,
        accessToken: currentToken
      });
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
    <div className="bg-[#F9FAFB] dark:bg-[#111827] text-[#111827] dark:text-[#F9FAFB] flex flex-col h-screen overflow-hidden antialiased font-['Pretendard']">
      <style jsx global>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .pulse-circle {
          position: absolute;
          left: 0; top: 0;
          width: 100%; height: 100%;
          border-radius: 50%;
          background-color: #FF6D00;
          animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
          z-index: -1;
        }
        .wave-bar {
          animation: wave 1s ease-in-out infinite alternate;
        }
        .wave-bar:nth-child(1) { animation-delay: 0s; }
        .wave-bar:nth-child(2) { animation-delay: 0.2s; }
        .wave-bar:nth-child(3) { animation-delay: 0.4s; }
        @keyframes wave {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1); }
        }
      `}</style>

      {/* 헤더 */}
      <nav className="flex items-center justify-between px-5 py-4 bg-white dark:bg-[#1F2937] sticky top-0 z-10 w-full transition-colors duration-200 shadow-sm border-b border-[#E5E7EB] dark:border-[#374151]">
        <button
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111827] dark:text-[#F9FAFB]"
        >
          <span className="material-icons text-[24px]">arrow_back</span>
        </button>
        <h1 className="text-lg font-bold tracking-tight">쿠첸 AI 맞춤 취사</h1>

        {/* 우측 상단 메뉴 */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[#111827] dark:text-[#F9FAFB]"
          >
            <span className="material-icons text-[24px]">menu</span>
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1F2937] rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-gray-700 overflow-hidden z-[100]">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <span className="font-semibold text-gray-800 dark:text-gray-200 text-sm">취사가능 메뉴</span>
              </div>
              <ul className="max-h-60 overflow-y-auto">
                {appState.recipe_list.length > 0 ? (
                  appState.recipe_list.map((r: any) => (
                    <li key={r.recipeKey} className="border-b border-gray-50 dark:border-gray-700 last:border-none">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          executeCook(r.recipeNo, r.recipeKey, r.recipeNm);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-between group"
                      >
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#FF6D00]">
                          {r.recipeNm}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md group-hover:bg-[#FF6D00] group-hover:text-white transition-colors">
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
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col items-center justify-center relative w-full px-6 pt-10 pb-32 overflow-y-auto">
        <div className="relative flex flex-col items-center justify-center mb-12">
          {/* AI Orb 부위 */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className={`pulse-circle opacity-20 ${isProcessing ? '' : 'hidden'}`}></div>
            <div className={`pulse-circle opacity-10 ${isProcessing ? '' : 'hidden'}`} style={{ animationDelay: '1s' }}></div>
            <div className={`w-24 h-24 bg-[#FF6D00] rounded-full flex items-center justify-center shadow-[0_0_40px_-10px_rgba(255,109,0,0.5)] z-10 relative overflow-hidden transition-transform duration-500 ${isProcessing ? 'scale-110' : 'scale-100'}`}>
              <div className="flex items-center space-x-1.5 h-10">
                <div className={`wave-bar w-1.5 h-6 bg-white rounded-full ${isProcessing ? '' : 'opacity-50'}`}></div>
                <div className={`wave-bar w-1.5 h-10 bg-white rounded-full ${isProcessing ? '' : 'opacity-50'}`}></div>
                <div className={`wave-bar w-1.5 h-6 bg-white rounded-full ${isProcessing ? '' : 'opacity-50'}`}></div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center max-w-[300px]">
            <h2 className="text-[22px] leading-[1.4] font-bold text-[#111827] dark:text-[#F9FAFB] mb-3 break-keep">
              {chatStatus}
            </h2>
          </div>
        </div>

        {/* 추천 칩 영역 */}
        <div className="w-full mt-auto flex flex-col items-center pb-8 animate-in fade-in slide-in-from-bottom-5 duration-700 z-[60]">
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-4 font-medium tracking-wide">이런 메뉴는 어때요?</p>
          <div className="flex flex-wrap justify-center gap-2.5 w-full max-w-[320px]">
            {appState.recipe_list
              .sort(() => 0.5 - Math.random()) // 간단한 랜덤 셔플
              .slice(0, 4) // 4개만 선택
              .map((r: any) => (
                <button
                  key={r.recipeKey}
                  onClick={() => executeCook(r.recipeNo, r.recipeKey, r.recipeNm)}
                  className="px-4 py-2.5 bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] rounded-full text-[14px] font-semibold text-[#111827] dark:text-[#F9FAFB] shadow-sm hover:shadow-md transition-shadow active:scale-95 duration-200"
                >
                  "{r.recipeNm}"
                </button>
              ))}
          </div>
        </div>
      </main>

      {/* 하단 마이크 버튼 (Floating) */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center z-20 px-6">
        <VoiceRecorder
          onResult={handleVoiceResult}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
}

export default function CookingPage() {
  return (
    <Suspense fallback={null}>
      <CookingContent />
    </Suspense>
  );
}