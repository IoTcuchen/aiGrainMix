'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, ArrowLeftIcon } from '@/components/icons';
import { sendResultToCuchen, submitSurvey } from '@/lib/apiClient';
import { QUESTIONS } from '@/lib/constants';
import { useClientSession } from '@/lib/hooks/useClientSession';
import type { SurveyQuestionPayload, SurveySubmitData } from '@/lib/types';

type SurveyForm = Record<string, string>;

export default function SurveyPage() {
  const router = useRouter();
  const { session } = useClientSession();

  const [formData, setFormData] = useState<SurveyForm>({});
  const [customAvoid, setCustomAvoid] = useState('');
  const [result, setResult] = useState<SurveySubmitData | null>(null);
  const [loading, setLoading] = useState(false);

  const requiredFields = useMemo(() => QUESTIONS.map((q) => q.id).filter((id) => id !== 'avoid_grains'), []);

  const handleChange = useCallback((id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const buildSurveyPayload = useCallback((): SurveyQuestionPayload | null => {
    const missingFields = requiredFields.filter((id) => !formData[id]);
    if (missingFields.length > 0) {
      alert('모든 설문 항목을 선택해주세요!');
      return null;
    }

    const finalAvoid = formData.avoid_grains === '기입'
      ? (customAvoid.trim() || '없음')
      : (formData.avoid_grains || '없음');

    return {
      target_gender: formData.target_gender,
      target_age: formData.target_age,
      texture_pref: formData.texture_pref,
      disease: formData.disease,
      constitution1: formData.constitution1,
      constitution2: formData.constitution2,
      expectation1: formData.expectation1,
      expectation2: formData.expectation2,
      avoid_grains: finalAvoid ? [finalAvoid] : ['없음'],
      frequency: formData.frequency,
    };
  }, [customAvoid, formData, requiredFields]);

  const handleSubmit = useCallback(async () => {
    const payload = buildSurveyPayload();
    if (!payload) {
      return;
    }

    setLoading(true);
    try {
      const data = await submitSurvey(payload);
      setResult(data);

      await sendResultToCuchen({
        type: 'survey',
        mode: data.mode,
        blend: data.blend,
        reasons: data.reasons,
      });
    } catch (error) {
      console.error(error);
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [buildSurveyPayload]);

  const handleRestart = useCallback(() => {
    setResult(null);
    setFormData({});
    setCustomAvoid('');
  }, []);

  const goBackToCuchen = useCallback(() => {
    if (session.modelKey && session.deviceKey) {
      const targetUrl = `cuchen://start_cooking?modelKey=${session.modelKey}&deviceKey=${session.deviceKey}`;
      window.location.href = targetUrl;
      return;
    }
    router.back();
  }, [router, session.deviceKey, session.modelKey]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-1 rounded-full" aria-label="홈으로 이동">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
          </button>
          <SparklesIcon className="w-6 h-6 text-brand-accent" />
          <h1 className="text-xl font-bold text-brand-text">{session.userName ? `${session.userName}님 ` : ''}맞춤 잡곡 진단</h1>
        </div>
      </header>

      <div className="app-content pb-10">
        <div className="max-w-2xl mx-auto">
          {!result ? (
            <div className="space-y-6 animate-fade-in">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="panel-card p-5">
                  <label className="block text-sm font-bold mb-3 text-brand-text">
                    <span className="text-brand-accent mr-1">Q.</span>
                    {q.label}
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleChange(q.id, opt)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border ${
                          formData[q.id] === opt
                            ? 'bg-brand-accent border-brand-accent text-white shadow-md'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {q.id === 'avoid_grains' && formData.avoid_grains === '기입' && (
                    <div className="mt-3 animate-fade-in">
                      <input
                        type="text"
                        value={customAvoid}
                        onChange={(e) => setCustomAvoid(e.target.value)}
                        placeholder="기피하는 곡물을 직접 입력해주세요"
                        className="w-full p-3 rounded-lg bg-white border border-gray-300 text-brand-text placeholder-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
                      />
                    </div>
                  )}
                </div>
              ))}

              <div className="mt-12 pt-4">
                <button onClick={handleSubmit} disabled={loading} className="btn-primary w-full py-4 text-lg shadow-lg">
                  {loading ? '분석 중...' : '결과 보기'}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in space-y-6 pb-10">
              <div className="panel-card p-6 shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-brand-accent">추천 결과</h2>
                <div className="bg-brand-secondary p-4 rounded-xl border border-gray-100">
                  <h3 className="font-bold mb-3 text-brand-text">추천 블렌드</h3>
                  <ul className="space-y-2">
                    {result.blend.map((item, idx) => (
                      <li key={`${item.곡물}-${idx}`} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 shadow-sm">
                        <span className="text-gray-700 font-medium">{item.곡물}</span>
                        <span className="font-bold text-brand-accent">{item.비율}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="panel-card p-6 shadow-xl">
                <h3 className="font-bold mb-3 text-brand-text">추천 이유</h3>
                <ul className="space-y-3">
                  {result.reasons.map((reason, idx) => (
                    <li key={`${reason}-${idx}`} className="flex gap-3 text-gray-600 text-sm leading-relaxed bg-brand-secondary p-3 rounded-lg border border-gray-100">
                      <span className="text-brand-accent mt-0.5 font-bold">•</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={handleRestart} className="btn-secondary w-full py-3">
                  ↺ 다시 하기
                </button>
                <button onClick={goBackToCuchen} className="btn-primary w-full py-3 shadow-lg">
                  취사하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
