import type { ComponentType } from "react";
import type { SvgProps } from "react-native-svg";

import Dumbbell from "@/assets/icons/dumbbell.svg";
import Scale from "@/assets/icons/scale.svg";
import Bicep from "@/assets/icons/bicep.svg";
import Runner from "@/assets/icons/runner.svg";
import Calendar from "@/assets/icons/calendar.svg";
import HeartPulse from "@/assets/icons/heart-pulse.svg";
import Sparkles from "@/assets/icons/sparkles.svg";
import Battery from "@/assets/icons/battery.svg";
import Leaf from "@/assets/icons/leaf.svg";
import Knee from "@/assets/icons/knee.svg";
import Back from "@/assets/icons/back.svg";
import Shoulder from "@/assets/icons/shoulder.svg";
import Hips from "@/assets/icons/hips.svg";
import Dots from "@/assets/icons/dots.svg";
import Pencil from "@/assets/icons/pencil.svg";
import Check from "@/assets/icons/check.svg";

import { theme } from "@/src/theme";

const icons = {
  dumbbell: Dumbbell,
  scale: Scale,
  bicep: Bicep,
  runner: Runner,
  calendar: Calendar,
  "heart-pulse": HeartPulse,
  sparkles: Sparkles,
  battery: Battery,
  leaf: Leaf,
  knee: Knee,
  back: Back,
  shoulder: Shoulder,
  hips: Hips,
  dots: Dots,
  pencil: Pencil,
  check: Check,
};

export type OnboardingIconName = keyof typeof icons;

type OnboardingIconProps = {
  name: OnboardingIconName;
  size?: number;
  color?: string;
};

export default function OnboardingIcon({
  name,
  size = 22,
  color = theme.colors.muted,
}: OnboardingIconProps) {
  const SvgIcon = icons[name] as ComponentType<SvgProps>;
  return <SvgIcon width={size} height={size} color={color} />;
}
