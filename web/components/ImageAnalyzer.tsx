'use client';

import React, { useRef, useState, useEffect } from 'react';
import { analyzeImageData } from '@/lib/apiClient';
import type { ImageAnalyzeResult } from '@/lib/types';

interface ImageAnalyzerProps {
  onAnalysisResult?: (result: ImageAnalyzeResult[]) => void;
}

export default function ImageAnalyzer({ onAnalysisResult }: ImageAnalyzerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalyzeResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      setStream(mediaStream);
    } catch (err) {
      console.error('카메라 접근 에러:', err);
      setError('카메라를 켤 수 없습니다. 권한을 확인해 주세요.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
  };

  const analyzeImage = async () => {
    if (!capturedImage) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const topResults = (await analyzeImageData(capturedImage)).slice(0, 3);
      setAnalysisResult(topResults);
      onAnalysisResult?.(topResults);
    } catch (err) {
      const message = err instanceof Error ? err.message : '이미지 분석 중 오류가 발생했습니다.';
      setError(`에러: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-[90%] aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl mb-6">
        {!capturedImage ? (
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline />
        ) : (
          <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2" />
              <p>AI 분석 중...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 w-full px-8">
        {!capturedImage ? (
          <button
            onClick={capturePhoto}
            className="flex-1 py-4 bg-white text-black font-bold rounded-2xl shadow-lg active:scale-95 transition-transform"
          >
            📸 사진 촬영
          </button>
        ) : (
          <>
            <button onClick={() => setCapturedImage(null)} className="flex-1 py-4 bg-gray-200 text-gray-700 font-bold rounded-2xl">
              다시 찍기
            </button>
            <button onClick={analyzeImage} className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg">
              재료 분석하기
            </button>
          </>
        )}
      </div>

      {analysisResult && (
        <div className="mt-6 w-[90%] bg-white p-5 rounded-3xl shadow-xl animate-fade-in-up">
          <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">AI 분석 결과</h3>
          {analysisResult.map((res, i) => (
            <div key={`${res.label}-${i}`} className="flex justify-between items-center mb-2 last:mb-0">
              <span className="font-bold text-gray-800 text-lg">{res.label}</span>
              <span className="text-green-600 font-mono">{(res.score * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
