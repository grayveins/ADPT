/**
 * useDailyFlag — local per-day boolean toggle backed by AsyncStorage.
 * Used for self-tracked things (e.g. "I hit my macros today") that don't
 * need to round-trip the DB. Per device, per day.
 */

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const keyFor = (name: string, ymd: string) => `dailyFlag:${name}:${ymd}`;

export function useDailyFlag(name: string, ymd: string) {
  const [on, setOn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setHydrated(false);
    AsyncStorage.getItem(keyFor(name, ymd))
      .then((v) => {
        if (!cancelled) {
          setOn(v === "1");
          setHydrated(true);
        }
      })
      .catch(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [name, ymd]);

  const toggle = useCallback(async () => {
    const next = !on;
    setOn(next);
    try {
      await AsyncStorage.setItem(keyFor(name, ymd), next ? "1" : "0");
    } catch {
      // Surface state already updated optimistically; revert if needed
      setOn(!next);
    }
  }, [name, ymd, on]);

  return { on, hydrated, toggle };
}
