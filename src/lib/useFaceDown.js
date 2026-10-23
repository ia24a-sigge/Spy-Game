// Erkennt beide Bewegungen: Display nach unten und danach wieder nach oben.
import { useEffect, useRef, useState } from 'react';
import { Accelerometer } from 'expo-sensors';
import { nextFaceDown } from './faceDown';

export function useFaceDown(enabled, onFaceDown, onFaceUp) {
  const [available, setAvailable] = useState(null);
  const down = useRef(false);
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
