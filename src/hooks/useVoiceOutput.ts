import { useState, useCallback, useRef } from "react";

interface UseVoiceOutputOptions {
  language?: string;
  rate?: number;
  pitch?: number;
}

export function useVoiceOutput(options: UseVoiceOutputOptions = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const { language = "en-IN", rate = 0.9, pitch = 1 } = options;

  const speak = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window)) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Try to find a suitable voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith(language) ||
          v.lang.startsWith("hi") ||
          v.lang.startsWith("en-IN")
      );
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      utterance.onpause = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [language, rate, pitch]
  );

  const stop = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
  }, []);

  return {
    isSpeaking,
    speak,
    stop,
    pause,
    resume,
    isSupported: "speechSynthesis" in window,
  };
}
