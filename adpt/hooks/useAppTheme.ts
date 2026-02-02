import { useMemo } from "react";

import {
  createAppColors,
  opacity,
  radius,
  shadows,
  spacing,
  typography,
} from "@/constants/Colors";
export function useAppTheme() {
  let scheme: "light" | "dark" = "light";
  const colors = useMemo(() => createAppColors(scheme), [scheme]);

  return {
    scheme,
    colors,
    spacing,
    radius,
    typography,
    opacity,
    shadows,
  };
}
