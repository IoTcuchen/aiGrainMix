'use client';

import { useState, useRef, useEffect } from 'react';
import { MicIcon } from './icons';
import { transcribeAudio } from '@/lib/apiClient';

interface Props {
  onResult: (text: string) => void;
  isProcessing: boolean;
  onStatusChange?: (status: 'recording' | 'processing' | 'idle') => void;
}

export default function VoiceRecorder({ onResult, isProcessing: parentProcessing, onStatusChange }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isRecordingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const maxVolumeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const globalProcessing = isProcessing || parentProcessing;

  useEffect(() => {
    if (!onStatusChange) {
      return;
    }

    if (globalProcessing) {
      onStatusChange('processing');
      return;
    }
    if (isRecording) {
      onStatusChange('recording');
      return;
    }
    onStatusChange('idle');
  }, [globalProcessing, isRecording, onStatusChange]);

  const monitorVolume = () => {
    if (!analyserRef.current || !isRecordingRef.current) {
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i += 1) {
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

      const AudioContextConstructor = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextConstructor();
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

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (maxVolumeRef.current < 10) {
          return;
        }

        setIsProcessing(true);
        try {
          const audioBlob = new Blob(chunksRef.current, { type: mimeType });
          const formData = new FormData();
          formData.append('file', audioBlob, `voice.${mimeType.split('/')[1]}`);

          const data = await transcribeAudio(formData);
          if (data.text) {
            onResult(data.text);
          }
        } catch (error) {
          console.error('STT 전송 실패:', error);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error('마이크 권한 거부됨:', error);
      alert('마이크 사용 권한이 필요합니다.');
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    isRecordingRef.current = false;
    setIsRecording(false);
  };

  const handleToggle = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    if (globalProcessing) {
      return;
    }

    if (isRecordingRef.current) {
      stopRecording();
      return;
    }

    startRecording();
  };

  return (
    <div className="relative flex flex-col items-center">
      <button
        onClick={handleToggle}
        disabled={globalProcessing}
        aria-label={isRecording ? '녹음 중지' : '녹음 시작'}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-2xl relative z-20 outline-none ${
          isRecording ? 'bg-red-500 scale-110 ring-8 ring-red-100' : 'bg-white border-4 border-orange-50'
        } ${globalProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-90'}`}
      >
        {isRecording && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-50 animate-ping" />
        )}

        {globalProcessing ? (
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        ) : (
          <span className={`text-4xl ${isRecording ? 'text-white' : 'text-orange-500'}`}>
            {isRecording ? '■' : <MicIcon className="w-5 h-5 text-orange-500" />}
          </span>
        )}
      </button>
    </div>
  );
}
