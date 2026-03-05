'use client';

import { useState, useRef, useEffect } from 'react';
import { MicIcon } from './icons';

interface Props {
    // 부모 컴포넌트(page.tsx)의 함수와 명칭을 맞춥니다.
    onResult: (text: string) => void;
    isProcessing: boolean;
    onStatusChange?: (status: 'recording' | 'processing' | 'idle') => void;
}

export default function VoiceRecorder({ onResult, isProcessing: parentProcessing, onStatusChange }: Props) {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 로직 충돌 방지를 위한 상태 참조값
    const isRecordingRef = useRef(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // 데시벨 분석용 Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const maxVolumeRef = useRef<number>(0);
    const animationFrameRef = useRef<number | null>(null);

    // 내부 처리 상태와 부모 처리 상태를 통합
    const globalProcessing = isProcessing || parentProcessing;

    // 상태 변경 알림
    useEffect(() => {
        if (onStatusChange) {
            if (globalProcessing) onStatusChange('processing');
            else if (isRecording) onStatusChange('recording');
            else onStatusChange('idle');
        }
    }, [isRecording, globalProcessing, onStatusChange]);

    // 실시간 볼륨 체크 (RMS 방식)
    const monitorVolume = () => {
        if (!analyserRef.current || !isRecordingRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const amplitude = (dataArray[i] - 128) / 128;
            sum += amplitude * amplitude;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const volume = rms * 100;

        if (volume > maxVolumeRef.current) {
            maxVolumeRef.current = volume;
        }
        animationFrameRef.current = requestAnimationFrame(monitorVolume);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            isRecordingRef.current = true;
            setIsRecording(true);
            chunksRef.current = [];
            maxVolumeRef.current = 0;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            monitorVolume();

            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                // 목소리 크기 임계값 체크 (10 미만은 무시)
                if (maxVolumeRef.current < 10) {
                    console.log("🔊 목소리가 감지되지 않아 전송을 취소합니다.");
                    return;
                }

                setIsProcessing(true);
                try {
                    const audioBlob = new Blob(chunksRef.current, { type: mimeType });
                    const formData = new FormData();
                    formData.append('file', audioBlob, `voice.${mimeType.split('/')[1]}`);

                    // 서버의 STT 엔드포인트 호출
                    const res = await fetch('/api/stt', { method: 'POST', body: formData });
                    const data = await res.json();

                    if (data.text) {
                        onResult(data.text); // 부모에게 텍스트 전달
                    }
                } catch (err) {
                    console.error("STT 전송 실패:", err);
                } finally {
                    setIsProcessing(false);
                }
            };

            mediaRecorder.start();
        } catch (err) {
            console.error("마이크 권한 거부됨:", err);
            alert("마이크 사용 권한이 필요합니다.");
            setIsRecording(false);
            isRecordingRef.current = false;
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (audioContextRef.current) audioContextRef.current.close();

        isRecordingRef.current = false;
        setIsRecording(false);
    };

    const handleToggle = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if (globalProcessing) return;

        if (isRecordingRef.current) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="relative flex flex-col items-center">
            {/* 메인 마이크 버튼 */}
            <button
                onClick={handleToggle}
                disabled={globalProcessing}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-20 outline-none
                        ${isRecording ? 'bg-red-500 scale-110 ring-8 ring-red-100' : 'bg-white border-4 border-orange-50'} 
                        ${globalProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
            >
                {/* 녹음 중 퍼지는 파동 효과 */}
                {isRecording && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50 animate-ping"></span>
                )}

                {globalProcessing ? (
                    <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <span className={`text-4xl ${isRecording ? 'text-white' : 'text-orange-500'}`}>
                        {isRecording ? "■" : <MicIcon className="w-5 h-5 text-orange-500" />}
                    </span>
                )}
            </button>
        </div>
    );
}