/**
 * Apple HealthKit wrapper — read-only, iOS-only.
 *
 * Every export early-returns null/false when:
 *   • Platform.OS !== 'ios'
 *   • the runtime is Expo Go (Nitro Modules require a custom dev client; the
 *     library throws synchronously at import in Expo Go and that crash
 *     cascades through every file that imports this one — including the
 *     Home tab and Settings, which then lose their default export)
 *
 * The library is lazy-required inside each function so the static import
 * never runs in Expo Go. In a dev client / standalone build it loads on
 * first use exactly once.
 *
 * iOS auth-status caveat: HealthKit deliberately hides whether the user
 * denied READ access (`getRequestStatusForAuthorization` distinguishes only
 * `unnecessary` vs `shouldRequest`). We don't try to detect denial directly
 * here — `useHealthKit` derives a `not_asked` / `likely_granted` /
 * `likely_denied` heuristic from an AsyncStorage flag plus query results.
 */

import { Platform } from "react-native";
import Constants from "expo-constants";

const READ_TYPES = [
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierBodyFatPercentage",
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
] as const;

export type LatestSample = {
  value: number;
  /** End date of the sample — what HealthKit treats as "when this happened". */
  date: Date;
};

const isExpoGo = Constants.executionEnvironment === "storeClient";

function canUseHealthKit(): boolean {
  return Platform.OS === "ios" && !isExpoGo;
}

// Lazy module loader. The native HealthKit dependency is intentionally
// NOT in package.json right now — until we re-enable it on the Apple
// Developer portal (HealthKit capability + provisioning profile), the
// require() below will throw "module not found", be caught, and every
// exported wrapper resolves to null/false. UI gracefully degrades.
//
// Typed as `any` so this file compiles without the dep installed; once
// the dep is back, swap to `typeof import("@kingstinct/react-native-healthkit")`.
let cachedModule: any | null = null;
function loadHealthKit(): any | null {
  if (!canUseHealthKit()) return null;
  if (cachedModule) return cachedModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require("@kingstinct/react-native-healthkit");
    return cachedModule;
  } catch {
    return null;
  }
}

/**
 * Whether HealthKit is available on this device + this build.
 * Returns false in Expo Go even on iOS — the module physically can't load.
 */
export function isHealthKitAvailable(): boolean {
  const hk = loadHealthKit();
  if (!hk) return false;
  try {
    return hk.isHealthDataAvailable();
  } catch (err) {
    console.warn("[healthkit] availability check failed", err);
    return false;
  }
}

/**
 * Prompt the user with the system permission sheet for our read scopes.
 * Resolves with `granted: true` only when the library reports success —
 * note iOS does not actually tell us which read scopes were granted, so
 * downstream code must still tolerate empty queries.
 */
export async function requestHealthKitAuthorization(): Promise<{
  granted: boolean;
}> {
  const hk = loadHealthKit();
  if (!hk) return { granted: false };
  try {
    const ok = await hk.requestAuthorization({ toRead: [...READ_TYPES] });
    return { granted: !!ok };
  } catch (err) {
    console.warn("[healthkit] requestAuthorization failed", err);
    return { granted: false };
  }
}

/** Latest weight sample, returned in kilograms. */
export async function getLatestBodyMassKg(): Promise<LatestSample | null> {
  const hk = loadHealthKit();
  if (!hk) return null;
  try {
    const sample = await hk.getMostRecentQuantitySample(
      "HKQuantityTypeIdentifierBodyMass",
      "kg",
    );
    if (!sample) return null;
    return { value: sample.quantity, date: sample.endDate };
  } catch (err) {
    console.warn("[healthkit] getLatestBodyMassKg failed", err);
    return null;
  }
}

/** Latest body fat percentage sample, returned as 0–100 (not 0–1). */
export async function getLatestBodyFatPct(): Promise<LatestSample | null> {
  const hk = loadHealthKit();
  if (!hk) return null;
  try {
    // Apple stores body fat as a fraction (0–1). Asking for unit '%' returns
    // it scaled by 100 so callers can use the value directly.
    const sample = await hk.getMostRecentQuantitySample(
      "HKQuantityTypeIdentifierBodyFatPercentage",
      "%",
    );
    if (!sample) return null;
    return { value: sample.quantity, date: sample.endDate };
  } catch (err) {
    console.warn("[healthkit] getLatestBodyFatPct failed", err);
    return null;
  }
}

function startOfTodayLocal(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Cumulative step count for today (local TZ midnight → now). */
export async function getStepsToday(): Promise<number | null> {
  const hk = loadHealthKit();
  if (!hk) return null;
  try {
    const res = await hk.queryStatisticsForQuantity(
      "HKQuantityTypeIdentifierStepCount",
      ["cumulativeSum"],
      {
        unit: "count",
        filter: { date: { startDate: startOfTodayLocal(), endDate: new Date() } },
      },
    );
    return res.sumQuantity ? Math.round(res.sumQuantity.quantity) : 0;
  } catch (err) {
    console.warn("[healthkit] getStepsToday failed", err);
    return null;
  }
}

/** Cumulative active energy for today, in kilocalories. */
export async function getActiveEnergyTodayKcal(): Promise<number | null> {
  const hk = loadHealthKit();
  if (!hk) return null;
  try {
    const res = await hk.queryStatisticsForQuantity(
      "HKQuantityTypeIdentifierActiveEnergyBurned",
      ["cumulativeSum"],
      {
        unit: "kcal",
        filter: { date: { startDate: startOfTodayLocal(), endDate: new Date() } },
      },
    );
    return res.sumQuantity ? Math.round(res.sumQuantity.quantity) : 0;
  } catch (err) {
    console.warn("[healthkit] getActiveEnergyTodayKcal failed", err);
    return null;
  }
}
