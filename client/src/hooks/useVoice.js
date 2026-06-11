import { useState, useRef, useCallback } from 'react';

export default function useVoice() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [levels, setLevels] = useState(new Array(32).fill(0));
  const rec = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  const startAudioAnalysis = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      const src = ctx.createMediaStreamSource(stream);
      src.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        // map 32 frequency bins to bar heights 0-1
        const lvls = Array.from({ length: 32 }, (_, i) => {
          const val = data[i] || 0;
          return val / 255;
        });
        setLevels(lvls);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {}
  }, []);

  const stopAudio = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    setLevels(new Array(32).fill(0));
  }, []);

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    setTranscript('');
    rec.current = new SR();
    rec.current.continuous = true;
    rec.current.interimResults = true;
    rec.current.onresult = e => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
    };
    rec.current.onend = () => { setListening(false); stopAudio(); };
    rec.current.start();
    setListening(true);
    startAudioAnalysis();
  }, [startAudioAnalysis, stopAudio]);

  const stop = useCallback(() => {
    rec.current?.stop();
    stopAudio();
    setListening(false);
  }, [stopAudio]);

  const cancel = useCallback(() => {
    rec.current?.stop();
    stopAudio();
    setTranscript('');
    setListening(false);
  }, [stopAudio]);

  return { listening, transcript, levels: levels.length ? levels : new Array(32).fill(0), start, stop, cancel };
}
