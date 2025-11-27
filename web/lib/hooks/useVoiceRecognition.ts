'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRecognitionOptions {
  onStop?: (transcript: string) => void;
}

export const useVoiceRecognition = ({ onStop }: VoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // FIX: Cast window to `any` to access non-standard SpeechRecognition properties.
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';
    recognition.continuous = false; // Stop after a pause

    recognition.onresult = (event: any) => {
      let fullTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript;
      }
      setTranscript(fullTranscript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);
  
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;
  
  useEffect(() => {
    if (!isListening && transcript) {
        onStopRef.current?.(transcript);
    }
  }, [isListening, transcript]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // onend will fire and trigger the useEffect above
    }
  }, [isListening]);

  return { isListening, transcript, startListening, stopListening };
};
