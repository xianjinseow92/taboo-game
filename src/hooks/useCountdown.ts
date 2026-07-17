import { useEffect, useRef, useState } from 'react';

// counts down from totalSeconds starting on mount, calls onExpire once at zero
export function useCountdown(totalSeconds: number, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(totalSeconds);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    const endAt = Date.now() + totalSeconds * 1000;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        expireRef.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [totalSeconds]);

  return remaining;
}
