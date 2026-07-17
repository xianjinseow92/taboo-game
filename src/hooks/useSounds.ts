import { useRef } from 'react';

// synthesized beeps via web audio, no audio assets needed
export function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  function beep(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.08) {
    try {
      const ac = (ctxRef.current ??= new AudioContext());
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = volume;
      osc.connect(gain).connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch {
      // audio blocked or unsupported, play silently
    }
  }

  return {
    tick: () => beep(880, 0.04),
    buzzer: () => beep(140, 0.7, 'sawtooth', 0.15),
    ding: () => beep(1320, 0.12, 'sine', 0.1),
  };
}
