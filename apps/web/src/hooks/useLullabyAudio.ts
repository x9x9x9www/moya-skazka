import { useEffect, useRef, useState } from 'react';
import { ReaderMusic } from './useReaderSettings';

/**
 * Мягкий сказочный генератор колыбельных переливов на Web Audio API
 * Не требует внешних mp3-файлов, работает автономно и создаёт уютную атмосферу для сна.
 * Обеспечивает:
 * - Автоматический unlock Web Audio API по первому тапу
 * - Плавное затухание громкости (fade out) при выходе из читалки без щелчков
 */
export function useLullabyAudio(musicType: ReaderMusic, isReading: boolean) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<any>(null);

  // Мягкие пентатонические ноты (колыбельная шкала F major / D minor)
  const notesCalm = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25]; // C, D, E, G, A, C
  const notesFairy = [329.63, 392.0, 493.88, 587.33, 659.25, 783.99]; // E, G, B, D, E, G
  const notesForest = [220.0, 261.63, 329.63, 392.0, 440.0, 523.25];

  const getOrCreateContext = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        const master = audioCtxRef.current.createGain();
        master.gain.setValueAtTime(1, audioCtxRef.current.currentTime);
        master.connect(audioCtxRef.current.destination);
        masterGainRef.current = master;
      }
    }
    return audioCtxRef.current;
  };

  // Автоматический unlock при первом взаимодействии пользователя
  useEffect(() => {
    const unlock = () => {
      const ctx = getOrCreateContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const playChime = () => {
    try {
      const ctx = getOrCreateContext();
      if (!ctx || !masterGainRef.current) return;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
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

      // Мягкий синусоидальный перелив
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Очень нежная громкость (фоновый шёпот), линейный вход и экспоненциальный спад без щелчков
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(gain);
      gain.connect(masterGainRef.current);

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
      // Плавное затухание при выходе
      if (masterGainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.cancelScheduledValues(now);
        masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
        masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      }
      return;
    }

    // Восстанавливаем громкость при входе
    if (masterGainRef.current && audioCtxRef.current) {
      const now = audioCtxRef.current.currentTime;
      masterGainRef.current.gain.cancelScheduledValues(now);
      masterGainRef.current.gain.setValueAtTime(0, now);
      masterGainRef.current.gain.linearRampToValueAtTime(1, now + 0.3);
    }

    setIsPlaying(true);
    // Первый перелив с небольшой задержкой, чтобы страница успела отрисоваться
    const initialTimeout = setTimeout(() => {
      playChime();
    }, 400);

    intervalRef.current = setInterval(() => {
      playChime();
    }, 3200);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (masterGainRef.current && audioCtxRef.current) {
        try {
          const now = audioCtxRef.current.currentTime;
          masterGainRef.current.gain.cancelScheduledValues(now);
          masterGainRef.current.gain.setValueAtTime(masterGainRef.current.gain.value, now);
          masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.4);
        } catch {}
      }
    };
  }, [musicType, isReading]);

  const toggleMute = () => {
    if (isPlaying) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (masterGainRef.current && audioCtxRef.current) {
        const now = audioCtxRef.current.currentTime;
        masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.2);
      }
      setIsPlaying(false);
    } else {
      const ctx = getOrCreateContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (masterGainRef.current && ctx) {
        const now = ctx.currentTime;
        masterGainRef.current.gain.setValueAtTime(0, now);
        masterGainRef.current.gain.linearRampToValueAtTime(1, now + 0.2);
      }
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
