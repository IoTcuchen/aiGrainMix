import React, { useState } from 'react';
// FIX: Use Next.js path alias for types.
import type { Recommendation } from '@/lib/types';
import { BlendIcon, InfoIcon, TagIcon, CodeIcon, CopyIcon } from './icons';

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

      <div className="bg-brand-secondary p-3 rounded-lg">
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
