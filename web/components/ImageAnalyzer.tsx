// components/ImageAnalyzer.tsx
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { HfInference } from '@huggingface/inference';
import { analyzeImageWithAI } from '@/lib/api/ai';

const HF_TOKEN = process.env.HUGGING_FACE_TOKEN;

interface ImageAnalyzerProps {
    onAnalysisResult?: (result: { label: string; score: number }[]) => void;
}

export default function ImageAnalyzer({ onAnalysisResult }: ImageAnalyzerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<any[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hf = new HfInference(HF_TOKEN);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        setError(null);
        try {
            // 후면 카메라 설정을 위해 facingMode: "environment" 추가
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment", // "user"는 전면, "environment"는 후면
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
            setStream(mediaStream);
        } catch (err: any) {
            console.error("카메라 접근 에러:", err);
            setError("카메라를 켤 수 없습니다. 권한을 확인해 주세요.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
        }
    };

    // components/ImageAnalyzer.tsx 내 analyzeImage 함수 부분만 수정

    const analyzeImage = async () => {
        if (!capturedImage) return;

        setIsLoading(true);
        setError(null);

        try {
            const data = await analyzeImageWithAI(capturedImage);

            // 성공 시 결과 표시
            setAnalysisResult(data.slice(0, 3));
            if (onAnalysisResult) onAnalysisResult(data.slice(0, 3));

        } catch (err: any) {
            // 아이폰 화면에도 에러 표시 (터미널에서도 확인 가능)
            setError(`에러: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* 카메라 뷰 영역 */}
            <div className="relative w-[90%] aspect-[3/4] bg-black rounded-3xl overflow-hidden shadow-2xl mb-6">
                {!capturedImage ? (
                    <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                    />
                ) : (
                    <img src={capturedImage} className="w-full h-full object-cover" alt="Captured" />
                )}

                {/* 분석 중 로딩 오버레이 */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
                            <p>AI 분석 중...</p>
                        </div>
                    </div>
                )}
            </div>

            {/* 컨트롤 버튼: 돋보기/확대 방지 스타일 적용 */}
            <div className="flex gap-4 w-full px-8">
                {!capturedImage ? (
                    <button
                        onClick={capturePhoto}
                        className="flex-1 py-4 bg-white text-black font-bold rounded-2xl shadow-lg active:scale-95 transition-transform select-none touch-none [-webkit-touch-callout:none]"
                    >
                        📸 사진 촬영
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => setCapturedImage(null)}
                            className="flex-1 py-4 bg-gray-200 text-gray-700 font-bold rounded-2xl select-none touch-none"
                        >
                            다시 찍기
                        </button>
                        <button
                            onClick={analyzeImage}
                            className="flex-1 py-4 bg-green-600 text-white font-bold rounded-2xl shadow-lg select-none touch-none"
                        >
                            재료 분석하기
                        </button>
                    </>
                )}
            </div>

            {/* 분석 결과 카드 */}
            {analysisResult && (
                <div className="mt-6 w-[90%] bg-white p-5 rounded-3xl shadow-xl animate-fade-in-up">
                    <h3 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">AI 분석 결과</h3>
                    {analysisResult.map((res, i) => (
                        <div key={i} className="flex justify-between items-center mb-2 last:mb-0">
                            <span className="font-bold text-gray-800 text-lg">{res.label}</span>
                            <span className="text-green-600 font-mono">{(res.score * 100).toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}