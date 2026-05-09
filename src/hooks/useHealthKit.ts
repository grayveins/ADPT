/**
 * iOS HealthKit consumer hook. Fetches today's steps + active energy and
 * the latest weight / body fat samples; upserts the body metrics into
 * `body_stats` so the rest of the app reads from one source.
 *
 * Cache + refetch strategy mirrors `app/(app)/(tabs)/index.tsx:170-176` —
 * a 30-second `lastFetchedAt` ref-gated `useFocusEffect`.
 *
 * Auth-status heuristic: iOS hides whether READ access was denied. We
 * persist a "@adpt/healthkit/asked" flag the first time the system sheet
 * is shown; combined with whether queries return non-null we infer
 * `not_asked` / `likely_granted` / `likely_denied`. Callers (Permission
 * Card, Settings row) react off this state.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import {
  getActiveEnergyTodayKcal,
  getLatestBodyFatPct,
  getLatestBodyMassKg,
  getStepsToday,
  isHealthKitAvailable,
  requestHealthKitAuthorization,
} from "@/src/lib/healthkit";

const ASKED_KEY = "@adpt/healthkit/asked";
const STALE_MS = 30_000;
/** Don't auto-fill `body_stats` from samples older than this — Health
 * sometimes returns last-week's weigh-in as "most recent" if the user
 * hasn't logged in a while, and we don't want to plant stale rows in DB. */
const RECENT_SAMPLE_MS = 7 * 24 * 60 * 60 * 1000;

export type HealthKitPermissionState =
  | "unsupported"
  | "not_asked"
  | "likely_granted"
  | "likely_denied";

export type HealthKitState = {
  permissionState: HealthKitPermissionState;
  weight: number | null;
  bodyFat: number | null;
  steps: number | null;
  activeEnergy: number | null;
  /** Force re-read from HealthKit + re-upsert to Supabase. */
  refresh: () => Promise<void>;
  /** Show the system permission sheet for our read scopes. */
  requestAuth: () => Promise<void>;
};

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function useHealthKit(userId: string | null): HealthKitState {
  const supported = Platform.OS === "ios" && isHealthKitAvailable();
  const [permissionState, setPermissionState] =
    useState<HealthKitPermissionState>(
      supported ? "not_asked" : "unsupported",
    );
  const [weight, setWeight] = useState<number | null>(null);
  const [bodyFat, setBodyFat] = useState<number | null>(null);
  const [steps, setSteps] = useState<number | null>(null);
  const [activeEnergy, setActiveEnergy] = useState<number | null>(null);

  const lastFetchedAt = useRef(0);
  // Avoid repeated upserts for the same (date, value) — the user may
  // refocus Home many times in a session and we don't want to spam
  // Supabase with no-op writes.
  const lastWeightUpsert = useRef<{ date: string; value: number } | null>(null);
  const lastFatUpsert = useRef<{ date: string; value: number } | null>(null);

  const upsertBodyStat = useCallback(
    async (
      clientId: string,
      date: string,
      patch: { weight_kg?: number | null; body_fat_pct?: number | null },
    ) => {
      // Match log-progress.tsx's literal-shape upsert. Mobile supabase
      // singleton isn't typed with <Database>, so the upsert overload
      // resolution chokes on `{ ...patch }` spreads — listing fields
      // explicitly (with undefined for absent ones) keeps TS happy.
      // Mobile supabase singleton isn't typed with <Database> (Sprint A
       // pending), so .from() returns `never` and the upsert overload
       // can't pick the right shape. Cast through `any` to mirror the
       // pattern used by other untyped writes in the repo.
      const { error } = await (supabase.from("body_stats") as any).upsert(
        {
          client_id: clientId,
          date,
          weight_kg: patch.weight_kg ?? null,
          body_fat_pct: patch.body_fat_pct ?? null,
          source: "healthkit",
        },
        { onConflict: "client_id,date,source" },
      );
      if (error) {
        console.warn("[useHealthKit] upsert failed", error.message);
      }
    },
    [],
  );

  const sync = useCallback(async () => {
    if (!supported) return;

    // Pull all four in parallel — no inter-dependency.
    const [w, f, s, k] = await Promise.all([
      getLatestBodyMassKg(),
      getLatestBodyFatPct(),
      getStepsToday(),
      getActiveEnergyTodayKcal(),
    ]);

    setWeight(w?.value ?? null);
    setBodyFat(f?.value ?? null);
    setSteps(s);
    setActiveEnergy(k);

    // Permission heuristic: any non-null reading means we have at least
    // one of the four read scopes. All-null after the user was prompted
    // is our best "denied / no data" signal.
    const asked = (await AsyncStorage.getItem(ASKED_KEY)) === "1";
    const anySignal =
      w != null || f != null || (s != null && s > 0) || (k != null && k > 0);
    if (!asked) {
      setPermissionState("not_asked");
    } else if (anySignal) {
      setPermissionState("likely_granted");
    } else {
      setPermissionState("likely_denied");
    }

    // Body-metric upserts — gated on (a) fresh sample (within 7 days)
    // and (b) value/date differing from last write.
    if (userId && w) {
      const ageMs = Date.now() - w.date.getTime();
      if (ageMs <= RECENT_SAMPLE_MS) {
        const date = isoDate(w.date);
        const last = lastWeightUpsert.current;
        if (!last || last.date !== date || last.value !== w.value) {
          await upsertBodyStat(userId, date, { weight_kg: w.value });
          lastWeightUpsert.current = { date, value: w.value };
        }
      }
    }
    if (userId && f) {
      const ageMs = Date.now() - f.date.getTime();
      if (ageMs <= RECENT_SAMPLE_MS) {
        const date = isoDate(f.date);
        const last = lastFatUpsert.current;
        if (!last || last.date !== date || last.value !== f.value) {
          await upsertBodyStat(userId, date, { body_fat_pct: f.value });
          lastFatUpsert.current = { date, value: f.value };
        }
      }
    }
  }, [supported, userId, upsertBodyStat]);

  const refresh = useCallback(async () => {
    lastFetchedAt.current = Date.now();
    await sync();
  }, [sync]);

  // Initial fetch when userId resolves.
  useEffect(() => {
    if (!supported || !userId) return;
    refresh();
  }, [supported, userId, refresh]);

  // Refocus refetch — same 30s gate as the Home tab's data hook.
  useFocusEffect(
    useCallback(() => {
      if (!supported) return;
      if (Date.now() - lastFetchedAt.current > STALE_MS) {
        refresh();
      }
    }, [supported, refresh]),
  );

  const requestAuth = useCallback(async () => {
    if (!supported) return;
    await requestHealthKitAuthorization();
    // Mark "asked" regardless of outcome — iOS doesn't tell us if the
    // user denied, and the system sheet only appears once per scope.
    await AsyncStorage.setItem(ASKED_KEY, "1");
    await refresh();
  }, [supported, refresh]);

  return {
    permissionState,
    weight,
    bodyFat,
    steps,
    activeEnergy,
    refresh,
    requestAuth,
  };
}
