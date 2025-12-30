'use client';

import React, { useState } from 'react';
import { SparklesIcon } from '@/components/icons';
import { submitSurvey, sendResultToCuchen } from '@/lib/apiClient';
import { send } from 'process';

const QUESTIONS = [
  { id: 'target_gender', label: '1. 주 섭취 대상 성별', options: ['남성', '여성', '혼성', '임산부'] },
  { id: 'target_age', label: '2. 주 섭취 대상 나이', options: ['10대 이하', '20-30대', '40-50대', '60대 이상'] },
  { id: 'texture_pref', label: '3. 선호식감', options: ['고슬밥', '찰진밥', '콩 없는 밥', '상관없음'] },
  { id: 'disease', label: '4. 질병 보유', options: ['당뇨병', '고혈압', '암 예방', '해당없음'] },
  { id: 'constitution1', label: '5. 체질 개선1', options: ['비만', '피로회복', '체내 염증 감소', '항산화/해당없음'] },
  { id: 'constitution2', label: '6. 체질 개선2', options: ['변비', '면역 강화', '간 건강', '혈중 콜레스테롤/해당없음'] },
  { id: 'expectation', label: '7. 효과 기대', options: ['골다공증', '치매 예방', '불면증', '해당 없음'] },
  { id: 'avoid_grains', label: '8. 기피곡물', options: ['없음', '기입', '대두 알러지', '글루텐 프리'] },
  { id: 'frequency', label: '9. 섭취 빈도', options: ['주 1~3회', '주 4~6회', '주 7~9회', '주 10회 이상'] },
];

export default function SurveyPage() {
  const [formData, setFormData] = useState<any>({});
  const [customAvoid, setCustomAvoid] = useState(''); 
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (id: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    // [유효성 검사] 필수 항목 누락 시 422 에러 방지
    const requiredFields = QUESTIONS.map(q => q.id);
    const missingFields = requiredFields.filter(id => {
      if (id === 'avoid_grains') return false; // 기피곡물은 아래에서 별도 처리
      return !formData[id]; 
    });

    if (missingFields.length > 0) {
      alert("모든 설문 항목을 선택해주세요!");
      return; 
    }

    setLoading(true);
    try {
      // 기피곡물 처리 로직
      let finalAvoid = formData.avoid_grains;
      if (finalAvoid === '기입') {
        finalAvoid = customAvoid.trim() || '없음'; 
      }

      const payload = {
        ...formData,
        avoid_grains: finalAvoid ? [finalAvoid] : ['없음']
      };

      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error('서버 통신 오류');

      const data = await res.json();
      setResult(data);

      sendResultToCuchen({
        type: 'survey',
        ...data
      })
    } catch (e) {
      alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setResult(null);      
    setFormData({});      
    setCustomAvoid('');   
  };

  return (
    // [레이아웃 수정] 전체 화면 스크롤 문제 해결 (h-full + overflow-y-auto)
    <div className="h-full overflow-y-auto bg-brand-primary text-brand-text p-4 pb-20 scroll-smooth">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8 text-center pt-4">
          <SparklesIcon className="w-6 h-6 text-blue-500"/>
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            맞춤 잡곡 진단
          </h1>
        </header>
      
        {!result ? (
          <div className="space-y-6 animate-fade-in">
            {QUESTIONS.map((q) => (
              <div key={q.id} className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl shadow-sm backdrop-blur-sm">
                <label className="block text-sm font-bold mb-3 text-blue-400">{q.label}</label>
                
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleChange(q.id, opt)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                        formData[q.id] === opt 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {q.id === 'avoid_grains' && formData['avoid_grains'] === '기입' && (
                  <div className="mt-3 animate-fade-in">
                    <input
                      type="text"
                      value={customAvoid}
                      onChange={(e) => setCustomAvoid(e.target.value)}
                      placeholder="기피하는 곡물을 직접 입력해주세요 (예: 팥, 수수)"
                      className="w-full p-3 rounded-lg bg-gray-800 border border-blue-500/50 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                )}
              </div>
            ))}
            
            <div className="pt-4">
              {/* [버튼 수정] 로딩 상태 UI 개선 */}
              <button
                onClick={handleSubmit}
                disabled={loading}
                // transition-all 제거 -> transition-colors 사용 (너비 변화 애니메이션 제거로 겹침 현상 방지)
                className={`w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-lg flex justify-center items-center gap-2
                  ${loading 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed border border-gray-600' 
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500'
                  }`}
              >
                {loading ? (
                  <>
                    {/* 회전하는 스피너 아이콘 추가 */}
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>분석 중...</span>
                  </>
                ) : (
                  '결과 보기'
                )}
              </button>
            </div>
          </div>
        ) : (
          // 결과 화면
          <div className="animate-fade-in space-y-6">
            <div className="bg-gray-800/80 border border-gray-700 p-6 rounded-xl shadow-xl backdrop-blur-md">
              <h2 className="text-xl font-bold mb-4 text-blue-400">추천 결과</h2>
              
              <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
                <h3 className="font-bold mb-3 text-white">추천 블렌드</h3>
                <ul className="space-y-2">
                  {result?.blend && Array.isArray(result.blend) ? (
                    result.blend.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-600">
                        <span className="text-gray-200">{item.곡물}</span>
                        <span className="font-bold text-blue-400">{item.비율}%</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-gray-400 text-center p-4">결과를 불러오는 중 오류가 발생했습니다.</li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-800/80 border border-gray-700 p-6 rounded-xl shadow-xl">
              <h3 className="font-bold mb-3 text-green-400">추천 이유</h3>
              <ul className="space-y-3">
                {result?.reasons && Array.isArray(result.reasons) ? (
                  result.reasons.map((r: string, idx: number) => (
                    <li key={idx} className="flex gap-3 text-gray-300 text-sm leading-relaxed bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                      <span className="text-blue-500 mt-0.5">•</span>
                      {r}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 text-sm">상세 이유를 불러오지 못했습니다.</li>
                )}
              </ul>
            </div>
            
            <button 
              onClick={handleRestart}
              className="w-full py-3 mt-4 border border-gray-600 text-gray-300 rounded-xl font-bold hover:bg-gray-800 transition-colors"
            >
              ↺ 다시 하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}