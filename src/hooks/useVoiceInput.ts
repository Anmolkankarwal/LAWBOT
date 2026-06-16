import { useState, useCallback, useRef, useEffect } from "react";

// Web Speech API type declarations
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface ExtendedWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface UseVoiceInputOptions {
  onResult?: (text: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const { onResult, onError, language = "auto" } = options;

  const getRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
    const win = window as unknown as ExtendedWindow;
    return win.SpeechRecognition || win.webkitSpeechRecognition || null;
  };

  useEffect(() => {
    const SpeechRecognitionCtor = getRecognitionConstructor();
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    if (language === "hi" || language === "hindi") {
      recognition.lang = "hi-IN";
    } else if (language === "auto") {
      recognition.lang = "hi-IN";
    } else {
      recognition.lang = "en-IN";
    }

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setInterimTranscript("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = "";
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        setTranscript((prev) => prev + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      if (event.error !== "aborted" && event.error !== "no-speech") {
        onError?.(event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language, onError]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      onError?.("Speech recognition not supported in this browser");
      return;
    }
    try {
      recognitionRef.current.start();
    } catch {
      // Already started
    }
  }, [onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    const finalText = transcript + (interimTranscript ? " " + interimTranscript : "");
    if (finalText.trim()) {
      onResult?.(finalText.trim());
    }
    setTranscript("");
    setInterimTranscript("");
    return finalText.trim();
  }, [transcript, interimTranscript, onResult]);

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
    setTranscript("");
    setInterimTranscript("");
  }, []);

  const isSupported = getRecognitionConstructor() !== null;

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    cancelListening,
    isSupported,
  };
}
