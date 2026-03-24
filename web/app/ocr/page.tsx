'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CameraIcon, SparklesIcon, XIcon } from '@/components/icons';

export default function OCRPage() {
    const router = useRouter();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Camera states
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        // Cleanup on unmount
        return () => stopCamera();
    }, []);

    // Attach stream to video element when it renders
    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const startCamera = async () => {
        setImagePreview(null);
        setResult(null);
        setError(null);
        try {
            let stream: MediaStream;
            try {
                // Try environment (rear) camera first
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' },
                });
            } catch (fallbackError) {
                // Fallback to any available camera (e.g., desktop webcam)
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                });
            }
            streamRef.current = stream;
            setIsCameraOpen(true);
        } catch (err) {
            console.error('Camera access denied:', err);
            setError('카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                const base64Data = dataUrl.split(',')[1];

                setImagePreview(dataUrl);
                stopCamera();
                processImage(base64Data);
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImagePreview(null);
        setResult(null);
        setError(null);

        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64Data = dataUrl.split(',')[1];
            setImagePreview(dataUrl);
            processImage(base64Data);
        };
        reader.readAsDataURL(file);

        // Clear the input so selecting the same file triggers onChange again
        e.target.value = '';
    };

    const processImage = async (base64Data: string) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await fetch('/api/ocr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ inputs: base64Data }),
            });

            if (!response.ok) {
                throw new Error('API Request Failed');
            }

            const data = await response.json();
            setResult(data);
        } catch (err: any) {
            console.error(err);
            setError(err.message || '잡곡 분석 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center bg-brand-primary text-brand-text relative overflow-x-hidden p-6 pb-24">
            {/* Header */}
            <header className="w-full flex items-center justify-between mb-8 z-20">
                <button
                    onClick={() => router.back()}
                    className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                    aria-label="뒤로가기"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold flex-1 text-center mr-8">잡곡 패키지 분석</h1>
            </header>

            <div className="z-10 max-w-2xl w-full flex flex-col items-center space-y-8">
                <div className="text-center space-y-4">
                    <div className="p-4 bg-white rounded-2xl shadow-md border border-brand-accent/20 inline-block">
                        <CameraIcon className="w-10 h-10 text-brand-accent" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold">잡곡 패키지 촬영</h2>
                    <p className="text-gray-500 text-base md:text-lg whitespace-pre-line">
                        {'쌀이나 잡곡 패키지의 성분표나 전면을 촬영하면\n어떤 잡곡이 들어있는지 AI가 분석해 드립니다.'}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-gray-100 p-6 flex flex-col items-center gap-4">

                    {/* Camera View Area */}
                    <div className="w-full relative rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
                        {isCameraOpen ? (
                            <div className="relative w-full aspect-[4/3] bg-black">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={stopCamera}
                                    className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : imagePreview ? (
                            <div className="relative w-full aspect-[4/3]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imagePreview} alt="Preview" className="object-cover w-full h-full" />
                            </div>
                        ) : (
                            <div className="w-full aspect-[4/3] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                                <CameraIcon className="w-12 h-12 mb-2 opacity-50" />
                                <p>카메라 또는 갤러리를 선택해주세요</p>
                            </div>
                        )}
                    </div>

                    {/* Hidden Canvas for capture */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
                        {isCameraOpen ? (
                            <button
                                onClick={capturePhoto}
                                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-md transition-colors flex items-center justify-center gap-2"
                            >
                                <div className="w-6 h-6 rounded-full border-4 border-white/40 flex items-center justify-center">
                                    <div className="w-full h-full bg-white rounded-full"></div>
                                </div>
                                사진 촬영하기
                            </button>
                        ) : (
                            <button
                                onClick={startCamera}
                                className="flex-1 py-3 bg-brand-accent hover:bg-orange-600 text-white rounded-2xl font-bold shadow-md transition-colors text-center flex items-center justify-center gap-2"
                            >
                                <CameraIcon className="w-5 h-5" />
                                카메라 켜기
                            </button>
                        )}

                        {!isCameraOpen && (
                            <label
                                htmlFor="file-upload"
                                className="flex-1 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-2xl font-bold shadow-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                갤러리 선택
                            </label>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            id="file-upload"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-blue-100 p-8 flex flex-col items-center text-center animate-pulse">
                        <SparklesIcon className="w-12 h-12 text-blue-500 mb-4 animate-spin-slow" />
                        <h3 className="text-xl font-bold text-gray-800 mb-2">AI가 분석 중입니다...</h3>
                        <p className="text-gray-500">잠시만 기다려 주세요.</p>
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div className="w-full max-w-md bg-red-50 rounded-3xl shadow-sm border border-red-200 p-6 text-center">
                        <p className="text-red-600 font-medium">{error}</p>
                    </div>
                )}

                {/* Result Analysis */}
                {result && !loading && (
                    <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-green-200 p-6 animate-fade-in-up">
                        <div className="flex items-center gap-2 mb-4">
                            <SparklesIcon className="w-6 h-6 text-green-500" />
                            <h3 className="text-xl font-bold text-gray-800">분석 결과</h3>
                        </div>
                        {result.analysis ? (
                            <div className="space-y-4">
                                <div className="text-center">
                                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full mb-2">
                                        {result.analysis.type || "분석 완료"}
                                    </span>
                                    <h4 className="text-lg font-bold text-gray-800">{result.analysis.title}</h4>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center mt-4">
                                    {result.analysis.items && result.analysis.items.map((item: string, idx: number) => (
                                        <span key={idx} className="px-4 py-2 bg-gray-100 border border-gray-200 rounded-xl text-gray-800 font-medium shadow-sm">
                                            {item}
                                        </span>
                                    ))}
                                    {(!result.analysis.items || result.analysis.items.length === 0) && (
                                        <p className="text-gray-500 text-sm">성분을 찾을 수 없습니다.</p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-xl p-4 overflow-x-auto text-sm text-gray-700">
                                <pre>{JSON.stringify(result, null, 2)}</pre>
                            </div>
                        )}
                        <p className="mt-4 text-sm text-gray-500 text-center">
                            * AI 분석 결과는 참조용이며 실제와 다를 수 있습니다.
                        </p>
                    </div>
                )}
            </div>

        </main>
    );
}
