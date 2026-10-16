import { useEffect, useRef, useState } from 'react';
import { ReaderMusic } from './useReaderSettings';

/**
 * Мягкий сказочный генератор колыбельных переливов на Web Audio API
 * Не требует внешних mp3-файлов, работает автономно и создаёт уютную атмосферу для сна.
 */
export function useLullabyAudio(musicType: ReaderMusic, isReading: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<any>(null);

  // Мягкие пентатонические ноты (колыбельная шкала F major / D minor)
  const notesCalm = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C, D, E, G, A, C
  const notesFairy = [329.63, 392.0, 493.88, 587.33, 659.25, 783.99]; // E, G, B, D, E, G
  const notesForest = [220.0, 261.63, 329.63, 392.0, 440.0, 523.25];

  const playChime = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const notes =
        musicType === 'fairy'
          ? notesFairy
          : musicType === 'forest'
          ? notesForest
          : notesCalm;

      const freq = notes[Math.floor(Math.random() * notes.length)];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Мягкий синусоидальный колокольчик
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Очень нежная, едва заметная громкость (фоновый шепот)
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.0);
    } catch {}
  };

  useEffect(() => {
    if (!isReading || musicType === 'off') {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setIsPlaying(true);
    // Проигрываем нежный перелив каждые 3–4 секунды
    intervalRef.current = setInterval(() => {
      playChime();
    }, 3200);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [musicType, isReading]);

  const toggleMute = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      playChime();
      intervalRef.current = setInterval(() => {
        playChime();
      }, 3200);
    }
  };

  return {
    isPlaying,
    toggleMute,
  };
}
