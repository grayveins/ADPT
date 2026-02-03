/**
 * Equipment Icons
 * Simple line-art SVG icons for gym equipment
 */

import React from "react";
import Svg, { Path, Circle, Rect, Line, Ellipse } from "react-native-svg";

type IconProps = {
  size?: number;
  color?: string;
};

// Barbell - classic weightlifting bar with plates
export const BarbellIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="8" width="4" height="8" rx="1" stroke={color} strokeWidth="1.5" />
    <Rect x="18" y="8" width="4" height="8" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="6" y1="12" x2="18" y2="12" stroke={color} strokeWidth="1.5" />
    <Rect x="5" y="9" width="2" height="6" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Rect x="17" y="9" width="2" height="6" rx="0.5" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Dumbbell - single dumbbell
export const DumbbellIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="9" width="4" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    <Rect x="17" y="9" width="4" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// Cable Machine - pulley system
export const CableMachineIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="4" rx="1" stroke={color} strokeWidth="1.5" />
    <Circle cx="12" cy="4" r="1.5" stroke={color} strokeWidth="1.5" />
    <Path d="M12 5.5V18" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
    <Rect x="9" y="18" width="6" height="3" rx="1" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Pull-up Bar
export const PullupBarIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="5" y1="6" x2="5" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="19" y1="6" x2="19" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
    <Line x1="12" y1="15" x2="12" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="9" y1="18" x2="12" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="15" y1="18" x2="12" y2="15" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Bench
export const BenchIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="10" width="20" height="4" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="5" y1="14" x2="5" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="19" y1="14" x2="19" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="3" y1="20" x2="7" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="17" y1="20" x2="21" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Squat Rack
export const SquatRackIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="2" x2="4" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="20" y1="2" x2="20" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="2" y="8" width="4" height="2" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Rect x="18" y="8" width="4" height="2" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Line x1="6" y1="9" x2="18" y2="9" stroke={color} strokeWidth="1.5" />
    <Line x1="2" y1="22" x2="6" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="18" y1="22" x2="22" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Leg Press Machine
export const LegPressIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 20L10 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="8" y="4" width="12" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    <Circle cx="6" cy="18" r="2" stroke={color} strokeWidth="1.5" />
    <Line x1="10" y1="10" x2="10" y2="14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="6" y="14" width="8" height="3" rx="1" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Lat Pulldown
export const LatPulldownIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="3" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="12" y1="5" x2="12" y2="10" stroke={color} strokeWidth="1.5" />
    <Path d="M6 10H18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M6 10L4 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M18 10L20 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="8" y="16" width="8" height="4" rx="1" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Smith Machine
export const SmithMachineIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="2" x2="4" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="20" y1="2" x2="20" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="4" y1="2" x2="20" y2="2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="2" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Rect x="19" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="2" />
  </Svg>
);

// Kettlebell
export const KettlebellIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M9 6C9 4.34315 10.3431 3 12 3C13.6569 3 15 4.34315 15 6V8H9V6Z" 
      stroke={color} 
      strokeWidth="1.5" 
    />
    <Circle cx="12" cy="15" r="6" stroke={color} strokeWidth="1.5" />
    <Circle cx="12" cy="15" r="2" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Resistance Bands
export const ResistanceBandsIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M4 12C4 8 8 4 12 4C16 4 20 8 20 12C20 16 16 20 12 20C8 20 4 16 4 12Z" 
      stroke={color} 
      strokeWidth="1.5"
      fill="none"
    />
    <Path 
      d="M7 12C7 9.5 9.5 7 12 7C14.5 7 17 9.5 17 12C17 14.5 14.5 17 12 17C9.5 17 7 14.5 7 12Z" 
      stroke={color} 
      strokeWidth="1.5"
      fill="none"
    />
    <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Bodyweight (person icon)
export const BodyweightIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="3" stroke={color} strokeWidth="1.5" />
    <Path 
      d="M12 8V14" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <Path 
      d="M12 14L8 22" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <Path 
      d="M12 14L16 22" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
    <Path 
      d="M8 11L12 10L16 11" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round" 
    />
  </Svg>
);

// EZ Curl Bar
export const EZCurlBarIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Rect x="19" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Path 
      d="M5 12H8L10 10L14 14L16 12H19" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Trap Bar / Hex Bar
export const TrapBarIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M6 8L12 4L18 8V16L12 20L6 16V8Z" 
      stroke={color} 
      strokeWidth="1.5" 
      strokeLinejoin="round"
    />
    <Line x1="2" y1="12" x2="6" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="18" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="1" y="10" width="2" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
    <Rect x="21" y="10" width="2" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Dip Station
export const DipStationIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="4" y1="6" x2="4" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="20" y1="6" x2="20" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="4" y1="10" x2="8" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="16" y1="10" x2="20" y2="10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="2" y1="20" x2="6" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="18" y1="20" x2="22" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Rowing Machine
export const RowingMachineIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M2 18L20 14" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="6" cy="17" r="2" stroke={color} strokeWidth="1.5" />
    <Rect x="10" y="12" width="6" height="4" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="16" y1="14" x2="22" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="20" y="10" width="3" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Chest Fly Machine / Pec Deck
export const ChestFlyMachineIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="10" y="4" width="4" height="16" rx="1" stroke={color} strokeWidth="1.5" />
    <Path d="M10 8L4 6V14L10 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M14 8L20 6V14L14 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// Leg Curl / Extension Machine
export const LegCurlIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="8" width="12" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="4" y1="14" x2="4" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="16" y1="14" x2="16" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M16 11H20C21 11 22 12 22 13V17" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="20" y="17" width="3" height="4" rx="0.5" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Cable Crossover
export const CableCrossoverIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="2" width="4" height="20" rx="1" stroke={color} strokeWidth="1.5" />
    <Rect x="18" y="2" width="4" height="20" rx="1" stroke={color} strokeWidth="1.5" />
    <Circle cx="4" cy="6" r="1.5" stroke={color} strokeWidth="1" />
    <Circle cx="20" cy="6" r="1.5" stroke={color} strokeWidth="1" />
    <Path d="M5.5 6L12 14L18.5 6" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
  </Svg>
);

// Preacher Curl Bench
export const PreacherCurlIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 20V12L12 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Rect x="10" y="6" width="8" height="4" rx="1" stroke={color} strokeWidth="1.5" />
    <Rect x="16" y="10" width="4" height="8" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="2" y1="20" x2="8" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

// Adjustable Dumbbells
export const AdjustableDumbbellIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="9" width="4" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    <Rect x="17" y="9" width="4" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="7" y1="12" x2="17" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Line x1="5" y1="7" x2="5" y2="9" stroke={color} strokeWidth="1" />
    <Line x1="5" y1="15" x2="5" y2="17" stroke={color} strokeWidth="1" />
    <Line x1="19" y1="7" x2="19" y2="9" stroke={color} strokeWidth="1" />
    <Line x1="19" y1="15" x2="19" y2="17" stroke={color} strokeWidth="1" />
  </Svg>
);

// Olympic Plates
export const OlympicPlatesIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="2" stroke={color} strokeWidth="1.5" />
  </Svg>
);

// Foam Roller
export const FoamRollerIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Ellipse cx="12" cy="12" rx="10" ry="4" stroke={color} strokeWidth="1.5" />
    <Line x1="4" y1="12" x2="4" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="20" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M6 10V14" stroke={color} strokeWidth="1" />
    <Path d="M10 9V15" stroke={color} strokeWidth="1" />
    <Path d="M14 9V15" stroke={color} strokeWidth="1" />
    <Path d="M18 10V14" stroke={color} strokeWidth="1" />
  </Svg>
);

// Treadmill
export const TreadmillIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="14" width="18" height="6" rx="1" stroke={color} strokeWidth="1.5" />
    <Line x1="18" y1="14" x2="20" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Line x1="18" y1="4" x2="22" y2="4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Circle cx="5" cy="17" r="1.5" stroke={color} strokeWidth="1" />
    <Circle cx="17" cy="17" r="1.5" stroke={color} strokeWidth="1" />
  </Svg>
);

// Medicine Ball
export const MedicineBallIcon: React.FC<IconProps> = ({ size = 24, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
    <Path d="M12 3V21" stroke={color} strokeWidth="1" />
    <Path d="M3 12H21" stroke={color} strokeWidth="1" />
    <Path d="M5.5 5.5L18.5 18.5" stroke={color} strokeWidth="1" />
    <Path d="M18.5 5.5L5.5 18.5" stroke={color} strokeWidth="1" />
  </Svg>
);

// Export all icons
export const EquipmentIcons = {
  barbell: BarbellIcon,
  dumbbells: DumbbellIcon,
  cables: CableMachineIcon,
  pullup_bar: PullupBarIcon,
  bench: BenchIcon,
  squat_rack: SquatRackIcon,
  leg_press: LegPressIcon,
  lat_pulldown: LatPulldownIcon,
  smith_machine: SmithMachineIcon,
  kettlebells: KettlebellIcon,
  resistance_bands: ResistanceBandsIcon,
  bodyweight: BodyweightIcon,
  ez_curl_bar: EZCurlBarIcon,
  trap_bar: TrapBarIcon,
  dip_station: DipStationIcon,
  rowing_machine: RowingMachineIcon,
  chest_fly: ChestFlyMachineIcon,
  leg_curl: LegCurlIcon,
  cable_crossover: CableCrossoverIcon,
  preacher_curl: PreacherCurlIcon,
  adjustable_dumbbells: AdjustableDumbbellIcon,
  olympic_plates: OlympicPlatesIcon,
  foam_roller: FoamRollerIcon,
  treadmill: TreadmillIcon,
  medicine_ball: MedicineBallIcon,
};

export type EquipmentIconKey = keyof typeof EquipmentIcons;
