import { useCallback, useEffect, useRef, useState } from 'react';

/* Voice input for the quick-add field, on the Web Speech API.

   Support is uneven — Chrome, Edge and Safari implement it (Safari and older
   Chrome behind the `webkit` prefix), Firefox does not ship it at all. The mic
   is therefore only rendered when `supported` is true: a mic button that cannot
   listen is worse than no mic button, which is exactly what was reported.

   Recognition is *interim* so the field fills in as the user speaks, and the
   last final transcript is what survives. */

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  readonly length: number;
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    readonly length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function ctor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Browser strings are raw; these are what the field shows. */
function friendly(code: string | undefined): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked — allow it in your browser settings.';
    case 'no-speech':
      return "Didn't catch that — try again.";
    case 'audio-capture':
      return 'No microphone found.';
    case 'network':
      return 'Speech recognition needs a connection.';
    case 'aborted':
      return '';
    default:
      return 'Voice input stopped unexpectedly.';
  }
}

export interface Dictation {
  /** False on browsers without the API — render no mic at all. */
  supported: boolean;
  listening: boolean;
  error: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
}

/**
 * @param onText Receives the transcript so far while speaking, and the final
 *               text when a phrase completes.
 */
export function useDictation(onText: (text: string, final: boolean) => void): Dictation {
  const [supported] = useState(() => ctor() !== null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  // The callback is re-created on every keystroke of the field it writes to, so
  // hold it in a ref rather than re-binding recognition each render.
  const sink = useRef(onText);
  sink.current = onText;

  const stop = useCallback(() => {
    recognition.current?.stop();
    setListening(false);
    setError('');
  }, []);

  const start = useCallback(() => {
    const Ctor = ctor();
    if (!Ctor) return;
    setError('');

    // A second start() on a live instance throws — always begin from a fresh one.
    recognition.current?.abort();

    const r = new Ctor();
    r.lang = navigator.language || 'en-US';
    r.continuous = false;
    r.interimResults = true;

    r.onresult = (e) => {
      let text = '';
      let final = false;
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i];
        text += result[0]?.transcript ?? '';
        if (result.isFinal) final = true;
      }
      if (text.trim()) sink.current(text.trim(), final);
    };
    r.onerror = (e) => {
      const message = friendly(e.error);
      if (message) setError(message);
      setListening(false);
    };
    r.onend = () => setListening(false);

    recognition.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setError('Could not start the microphone.');
      setListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  // Never leave the mic open behind a closed sheet.
  useEffect(() => () => recognition.current?.abort(), []);

  return { supported, listening, error, start, stop, toggle };
}
