import React, { useState } from 'react';
import { DebugLogEntry } from '@/lib/types';

interface Props {
  logs: DebugLogEntry[];
}

export default function DebugPanel({ logs }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg text-xs font-mono hover:bg-gray-700 transition-colors"
      >
        {isOpen ? 'Close Debug' : '🔍 Debug Log'}
      </button>

      {/* 패널 본문 */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-96 max-h-[80vh] overflow-y-auto bg-white border-2 border-gray-900 rounded-lg shadow-2xl p-4 text-xs font-mono">
          <h3 className="font-bold text-sm mb-2 border-b pb-2">Orchestrator Trace</h3>
          
          <div className="space-y-4">
            {logs.map((log, idx) => (
              <div key={idx} className="border border-gray-200 rounded p-2 bg-gray-50">
                <div className="font-bold text-blue-600 mb-1">{log.step}</div>
                
                {/* 처리 내용 (JSON) */}
                <pre className="whitespace-pre-wrap bg-gray-100 p-2 rounded text-gray-700 mb-2">
                  {JSON.stringify(log.content, null, 2)}
                </pre>
                
                {/* 사용된 프롬프트 */}
                {log.prompt && (
                  <div className="mt-2">
                    <div className="font-bold text-purple-600 mb-1">Used Prompt:</div>
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-100 text-gray-600 italic whitespace-pre-wrap break-words">
                      {log.prompt}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}