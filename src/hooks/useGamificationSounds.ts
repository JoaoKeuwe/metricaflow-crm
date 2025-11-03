import { useEffect, useRef, useState } from 'react';

export type SoundType = 'sale' | 'proposal' | 'lead' | 'levelup';

export function useGamificationSounds() {
  const [isMuted, setIsMuted] = useState(() => {
    const stored = localStorage.getItem('gamification-sounds-muted');
    return stored === 'true';
  });
  
  const [volume, setVolume] = useState(() => {
    const stored = localStorage.getItem('gamification-sounds-volume');
    return stored ? parseFloat(stored) : 0.5;
  });

  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    localStorage.setItem('gamification-sounds-muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('gamification-sounds-volume', String(volume));
  }, [volume]);

  const playSound = (type: SoundType) => {
    if (isMuted) return;

    // Initialize AudioContext on first use (requires user interaction)
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContext.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);

    // Different sounds for different events
    switch (type) {
      case 'sale':
        // Victory fanfare
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;

      case 'proposal':
        // Ding sound
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        break;

      case 'lead':
        // Notification sound
        oscillator.frequency.setValueAtTime(600, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;

      case 'levelup':
        // Level up sound
        oscillator.frequency.setValueAtTime(523.25, ctx.currentTime);
        oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.45);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.7);
        break;
    }
  };

  return {
    isMuted,
    volume,
    setIsMuted,
    setVolume,
    playSound,
  };
}
