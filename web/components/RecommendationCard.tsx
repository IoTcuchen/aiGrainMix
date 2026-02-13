import React, { useState } from 'react';
import type { Recommendation } from '@/lib/types';
import { BlendIcon, InfoIcon, TagIcon, CodeIcon, CopyIcon } from './icons';
import ExportButton from './ExportButton'; // [추가] ExportButton 가져오기

interface RecommendationCardProps {
  recommendation: Recommendation;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const [showJson, setShowJson] = useState(false);
  const [copyStatus, setCopyStatus] = useState('복사');

  const modeText = {
    'own_only': '보유 잡곡 활용',
    'hybrid': '보유 잡곡 + 추천',
    'catalog': '전체 추천'
  };

  const recommendationJson = JSON.stringify({ recommendation }, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(recommendationJson).then(() => {
      setCopyStatus('복사 완료!');
      setTimeout(() => setCopyStatus('복사'), 2000);
    }, () => {
      setCopyStatus('실패!');
      setTimeout(() => setCopyStatus('복사'), 2000);
    });
  };

  // Recommendation 데이터를 쿠첸 전송용 AiResult 타입으로 변환
  const exportData = {
    title: `AI 추천: ${recommendation.blend.map(b => b.곡물).slice(0, 2).join('+')} 블렌드`, // 예: 현미+귀리 블렌드
    description: recommendation.reasons[0] || "AI가 분석한 최적의 잡곡 비율입니다.",

    // ingredients 매핑: { 곡물: '현미', 비율: 30 } -> { name: '현미', amount: '30%' }
    ingredients: recommendation.blend.map(item => ({
      name: item.곡물,
      amount: `${item.비율}%`
    })),

    // steps 생성: 간단한 조리 단계 자동 생성
    steps: [
      {
        action: "계량 및 씻기",
        desc: `추천 비율(${recommendation.blend.map(b => `${b.곡물} ${b.비율}%`).join(', ')})대로 잡곡을 준비하여 깨끗이 씻어주세요.`,
        time: 5
      },
      {
        action: "불리기",
        desc: "부드러운 식감을 위해 30분 정도 불려주세요.",
        time: 30
      },
      {
        action: "취사",
        desc: "쿠첸 밥솥의 [잡곡] 모드로 취사해주세요.",
        time: 40
      }
    ]
  };

  return (
    <div className="p-1 space-y-4 text-brand-text">
      <h3 className="text-lg font-bold text-brand-text">잡곡 블렌드 추천</h3>

      <div className="bg-brand-secondary p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <TagIcon className="w-5 h-5 text-brand-accent" />
          <h4 className="font-semibold">추천 모드</h4>
        </div>
        <p className="text-sm font-medium bg-user-bubble/20 text-user-bubble py-1 px-2 rounded-md inline-block">{modeText[recommendation.mode]}</p>
      </div>

      <div className="bg-brand-secondary p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <BlendIcon className="w-5 h-5 text-brand-accent" />
          <h4 className="font-semibold">추천 블렌드</h4>
        </div>
        <ul className="space-y-1 text-sm">
          {recommendation.blend.map((item, index) => (
            <li key={index} className="flex justify-between items-center">
              <span>{item.곡물}</span>
              <span className="font-mono font-semibold">{item.비율}%</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-brand-secondary p-3 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <InfoIcon className="w-5 h-5 text-brand-accent" />
          <h4 className="font-semibold">추천 이유</h4>
        </div>
        <ul className="space-y-2 text-sm list-disc list-inside">
          {recommendation.reasons.map((reason, index) => (
            <li key={index}>{reason}</li>
          ))}
        </ul>
      </div>

      {/* [추가] 쿠첸온 앱으로 전송 버튼 */}
      <div className="pt-2">
        <ExportButton aiResult={exportData} />
      </div>

      <div className="bg-brand-secondary p-3 rounded-lg mt-4">
        <button
          onClick={() => setShowJson(!showJson)}
          className="w-full flex items-center justify-between gap-2 text-left font-semibold"
          aria-expanded={showJson}
          aria-controls="json-panel"
        >
          <div className="flex items-center gap-2">
            <CodeIcon className="w-5 h-5 text-brand-accent" />
            <h4>API 응답 (JSON)</h4>
          </div>
          <span className="text-sm text-gray-400">{showJson ? '숨기기' : '보기'}</span>
        </button>
        {showJson && (
          <div id="json-panel" className="mt-3 relative">
            <pre className="bg-gray-900 text-gray-200 p-3 rounded-md text-xs overflow-x-auto">
              <code>
                {recommendationJson}
              </code>
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1.5 bg-user-bubble/80 text-white px-2 py-1 text-xs rounded-md hover:bg-user-bubble transition-colors"
              aria-label="Copy JSON to clipboard"
            >
              <CopyIcon className="w-3 h-3" />
              {copyStatus}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationCard;