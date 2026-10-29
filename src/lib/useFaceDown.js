// React hook for the special feature: detects when the phone is turned face down and back up again.
import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import { nextFaceDown } from './faceDown';

/**
 * Listens to the accelerometer while `enabled` is true. The sensor is switched off otherwise to save battery.
 * @param {boolean} enabled
 * @param {() => void} onFaceDown called when the display turns face down
 * @param {() => void} [onFaceUp] called when the display turns face up again
 * @returns {{ available: boolean | null }} null while checking, false if the phone has no sensor
 */
export function useFaceDown(enabled, onFaceDown, onFaceUp) {
  const [available, setAvailable] = useState(null);
  const down = useRef(false);
  // Always call the latest callbacks without restarting the sensor on every render.
  const callbacks = useRef({ onFaceDown, onFaceUp });
  callbacks.current = { onFaceDown, onFaceUp };

  useEffect(() => {
    if (!enabled) { down.current = false; return undefined; }
    let subscription;
    let active = true;
    Accelerometer.isAvailableAsync().then((ok) => {
      if (!active) return;
      setAvailable(ok);
      if (!ok) return;
      Accelerometer.setUpdateInterval(150);
      subscription = Accelerometer.addListener(({ z }) => {
        const next = nextFaceDown(down.current, z);
        if (next !== down.current) {
          down.current = next;
          if (next) callbacks.current.onFaceDown();
          else callbacks.current.onFaceUp?.();
        }
      });
    }).catch(() => { if (active) setAvailable(false); });
    return () => { active = false; subscription?.remove(); down.current = false; };
  }, [enabled]);

  return { available };
}
