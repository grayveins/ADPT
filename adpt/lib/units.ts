export type UnitsPreference = {
  weight: "lb" | "kg";
  height: "ft" | "cm";
  distance: "mi" | "km";
  measurements: boolean;
};

export const defaultUnits: UnitsPreference = {
  weight: "lb",
  height: "ft",
  distance: "mi",
  measurements: false,
};

export function lbsToKg(lbs: number) {
  return lbs / 2.20462;
}

export function kgToLbs(kg: number) {
  return kg * 2.20462;
}

export function inchesToCm(inches: number) {
  return inches * 2.54;
}

export function cmToInches(cm: number) {
  return cm / 2.54;
}

export function feetInchesToCm(feet: number, inches: number) {
  return inchesToCm(feet * 12 + inches);
}

export function cmToFeetInches(cm: number) {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  return { feet, inches };
}

export function formatHeight(cm: number, units: UnitsPreference) {
  if (units.height === "cm") {
    return `${Math.round(cm)} cm`;
  }
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet} ft ${inches} in`;
}

export function roundTo(value: number, step: number) {
  return Math.round(value / step) * step;
}
