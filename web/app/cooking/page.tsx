'use client';

import React, { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MenuIcon, XIcon } from '@/components/icons';
import VoiceRecorder from '@/components/VoiceRecorder';
import {
  analyzeCookingConversation,
  fetchRecipes,
  sendCookCommand,
} from '@/lib/apiClient';
import { useClientSession } from '@/lib/hooks/useClientSession';
import type {
  CookingAppState,
  CookingMessage,
  CookCommand,
  RecipeItem,
} from '@/lib/types';

const INITIAL_STATE: CookingAppState = {
  conversation_stage: 'start',
  cooking_state: {
    ingredient: null,
    purpose: null,
    texture: null,
    specific_menu: null,
  },
  recipe_list: [],
};

function CookingContent() {
  const router = useRouter();
  const { session } = useClientSession();

  const [isProcessing, setIsProcessing] = useState(false);
  const [chatStatus, setChatStatus] = useState('원하시는 목적에 맞는 메뉴로 맞춤 취사 해드릴게요. 재료나 식감, 원하는 요리 등을 말씀해주세요.');
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeItem | null>(null);
  const [messages, setMessages] = useState<CookingMessage[]>([]);
  const [appState, setAppState] = useState<CookingAppState>(INITIAL_STATE);

  useEffect(() => {
    if (!session.deviceKey || !session.modelKey) {
      return;
    }

    fetchRecipes(session.deviceKey, session.modelKey)
      .then((list) => {
        const formattedList = list
          .map((recipe) => ({
            ...recipe,
            recipeNo: String(recipe.recipeNo),
            recipeKey: String(recipe.recipeKey),
            recipeNm: String(recipe.recipeNm),
          }))
          .sort((a, b) => Number(a.recipeNo) - Number(b.recipeNo));

        setAppState((prev) => ({ ...prev, recipe_list: formattedList }));
      })
      .catch((error) => {
        console.error('Recipe Load Error:', error);
      });
  }, [session.deviceKey, session.modelKey]);

  const goBackToCuchen = useCallback(() => {
    if (session.modelKey && session.deviceKey) {
      const targetUrl = `cuchen://start_cooking?modelKey=${session.modelKey}&deviceKey=${session.deviceKey}`;
      window.location.href = targetUrl;
      return;
    }

    router.back();
  }, [router, session.deviceKey, session.modelKey]);

  const executeCook = useCallback(async (command: CookCommand) => {
    const accessToken = session.accessToken;
    const svcKey = session.svcKey || '1422266982285';

    if (!session.deviceKey || !session.modelKey || !accessToken) {
      alert('기기 정보 또는 인증 정보가 유효하지 않아 취사를 시작할 수 없습니다.');
      return;
    }

    const params = {
      menu: command.recipeNo,
      reservMin1: 0,
      reservMin2: 0,
      isKeepWarming: 1,
      keepWarmingMin1: 3,
      keepWarmingMin2: 132,
      cookTime1: 0,
      cookTime2: 0,
      temp: 0,
      isMyRecipe: '0',
    };

    const bodyParams = new URLSearchParams();
    bodyParams.append('apiAlias', 'cooking');
    bodyParams.append('deviceKey', session.deviceKey);
    bodyParams.append('modelKey', session.modelKey);
    bodyParams.append('recipeKey', command.recipeKey);
    bodyParams.append('params', JSON.stringify(params));

    try {
      const result = await sendCookCommand(bodyParams, accessToken, svcKey);
      const bean = result?.bean;

      if (result.success === true || (bean && !bean.error)) {
        setChatStatus(`${command.recipeNm} 취사가 시작되었습니다.`);
        setTimeout(goBackToCuchen, 2000);
        return;
      }

      setChatStatus('밥솥 상태를 확인해 주세요.');

      let errorMessage = '취사를 실패하였습니다.\n밥솥의 연결상태를 확인해주세요.';
      if (bean?.error === 'status') {
        const statusMap: Record<string, string> = {
          '823002': '취사중에는 밥솥 제어가 불가능합니다.',
          '823007': '취사중에는 밥솥 제어가 불가능합니다.',
          '823003': '예약취사중에는 제어가 불가능합니다.',
          '823004': '보온중에는 밥솥 제어가 불가능합니다.',
          '823005': '재가열중에는 밥솥 제어가 불가능합니다.',
          '823006': '자동세척중에는 밥솥 제어가 불가능합니다.',
          '823099': '업데이트중에는 밥솥 제어가 불가능합니다.',
        };
        errorMessage = statusMap[bean.status] || '동작중에는 밥솥 제어가 불가능합니다.';
      } else if (bean?.error === 'sensorHeadOpenYn') {
        errorMessage = '밥솥의 뚜껑을 확인해주세요.';
      } else if (bean?.error === 'possible') {
        errorMessage = '뚜껑을 열어 내용물을 확인 후 원격 제어 부탁드립니다.';
      } else if (result?.errors?.[0]?.message) {
        errorMessage = result.errors[0].message;
      }

      alert(errorMessage);
    } catch (error) {
      console.error(error);
      alert('네트워크 오류가 발생했습니다.');
    }
  }, [goBackToCuchen, session.accessToken, session.deviceKey, session.modelKey, session.svcKey]);

  const handleVoiceResult = useCallback(async (transcript: string) => {
    setChatStatus(`"${transcript}" 분석 중...`);
    setIsProcessing(true);

    const updatedMessages = [...messages, { role: 'user', content: transcript } as CookingMessage];
    setMessages(updatedMessages);

    try {
      const result = await analyzeCookingConversation(updatedMessages, appState);

      if (result.message) {
        setChatStatus(result.message.content);
        setMessages((prev) => [...prev, { role: 'bot', content: result.message.content }]);
      }

      if (result.appState) {
        setAppState((prev) => ({ ...prev, ...result.appState }));
      }

      if (result.isComplete && result.message.cook_command) {
        await executeCook(result.message.cook_command);
      }
    } catch (error) {
      console.error('Analysis Error:', error);
      setChatStatus('명령을 이해하지 못했습니다. 다시 말씀해주세요.');
    } finally {
      setIsProcessing(false);
    }
  }, [appState, executeCook, messages]);

  const sortedRecipes = useMemo(() => appState.recipe_list, [appState.recipe_list]);

  return (
    <main className="app-shell items-center p-6">
      <header className="w-full flex items-center justify-between mb-10 mt-2 relative">
        <button onClick={() => router.back()} className="btn-ghost p-2.5 z-10" aria-label="뒤로가기">
          <ArrowLeftIcon className="w-7 h-7" />
        </button>
        <h2 className="font-bold text-xl tracking-tight text-gray-900 absolute left-1/2 -translate-x-1/2 w-max">쿠첸 AI 맞춤 취사</h2>
        <div className="w-[84px]" />
      </header>

      <div className="w-full max-w-md relative z-20">
        <button
          onClick={() => {
            setShowRecipeModal(true);
            setSelectedRecipe(null);
          }}
          className="absolute right-0 top-0 flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-full font-semibold text-[13px] transition-colors shadow-sm border border-orange-100"
          aria-label="메뉴 목록 열기"
        >
          <MenuIcon className="w-4 h-4" />
          메뉴 보기
        </button>
      </div>

      <div className="w-full max-w-md flex flex-col items-center justify-between flex-1 pb-16">
        <div className="flex flex-col items-center space-y-12 mt-12 w-full">
          <div className="relative flex items-center justify-center">
            <div className={`absolute w-48 h-48 bg-orange-300/20 rounded-full blur-3xl transition-all duration-1000 ${isProcessing ? 'opacity-100 scale-125' : 'opacity-40'}`} />

            <div
              className={`relative w-32 h-32 rounded-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_20px_50px_rgba(251,146,60,0.3)] transition-all duration-700 ease-in-out ${
                isProcessing ? 'scale-110 rotate-180' : 'scale-100'
              }`}
            >
              <div className="flex gap-1.5">
                <span className={`w-1.5 h-8 bg-white/90 rounded-full ${isProcessing ? 'animate-bounce' : ''}`} style={{ animationDelay: '0ms' }} />
                <span className={`w-1.5 h-12 bg-white rounded-full ${isProcessing ? 'animate-bounce' : ''}`} style={{ animationDelay: '150ms' }} />
                <span className={`w-1.5 h-8 bg-white/90 rounded-full ${isProcessing ? 'animate-bounce' : ''}`} style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>

          <div className="text-center px-8 w-full">
            <p className="text-[22px] font-semibold text-gray-900 leading-[1.4] break-keep tracking-tight">{chatStatus}</p>
          </div>
        </div>

        <div className="w-full flex justify-center mt-12">
          <VoiceRecorder onResult={handleVoiceResult} isProcessing={isProcessing} />
        </div>
      </div>

      {showRecipeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900 tracking-tight">취사 가능한 메뉴</h3>
              <button onClick={() => setShowRecipeModal(false)} className="btn-ghost p-1" aria-label="모달 닫기">
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto min-h-[50vh]">
              <p className="text-sm text-gray-500 mb-4 break-keep">아래 메뉴를 직접 선택하여 즉시 취사할 수도 있습니다.</p>
              <ul className="grid grid-cols-2 gap-2">
                {sortedRecipes.length > 0 ? (
                  sortedRecipes.map((recipe) => {
                    const isSelected = selectedRecipe?.recipeNo === recipe.recipeNo;
                    return (
                      <li
                        key={recipe.recipeKey}
                        onClick={() => setSelectedRecipe(recipe)}
                        className={`p-3 rounded-xl font-semibold text-sm flex justify-center items-center border transition-all text-center cursor-pointer select-none ${
                          isSelected
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md transform scale-105'
                            : 'bg-gray-50/80 text-brand-text border-orange-100/50 hover:border-orange-300'
                        }`}
                      >
                        {recipe.recipeNm}
                      </li>
                    );
                  })
                ) : (
                  <li className="col-span-2 text-center text-gray-400 py-4 text-sm">메뉴를 불러오는 중입니다...</li>
                )}
              </ul>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRecipeModal(false);
                  if (selectedRecipe) {
                    executeCook(selectedRecipe);
                  }
                }}
                className={`w-full py-3 text-white rounded-xl font-bold transition-all ${
                  selectedRecipe ? 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)] animate-pulse' : 'bg-brand-text hover:bg-gray-800'
                }`}
              >
                {selectedRecipe ? `${selectedRecipe.recipeNm} 취사 시작` : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}
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
