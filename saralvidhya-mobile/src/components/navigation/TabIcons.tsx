import React from 'react';
import { ColorValue } from 'react-native';
import Svg, { Path, Rect, Polygon, Line } from 'react-native-svg';

interface TabIconProps {
  color: string | ColorValue | any;
  size?: number;
  focused?: boolean;
}

/**
 * 1. Learn Icon - Exactly matching user screenshot media_1791971037380.png:
 * Vertical rounded booklet with open top-right for a 4-point sparkle star,
 * and a bottom fold line/loop.
 */
export function LearnIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 4-Point Diamond Sparkle at Top-Right */}
      <Path
        d="M17.5 1 C17.5 3.2 19.3 5 21.5 5 C19.3 5 17.5 6.8 17.5 9 C17.5 6.8 15.7 5 13.5 5 C15.7 5 17.5 3.2 17.5 1 Z"
        fill={color}
      />
      {/* Booklet Outline with top-right cutout for sparkle and bottom page divider */}
      {/* Top line to cutout */}
      <Path
        d="M6 3 H13 M6 3 C4.343 3 3 4.343 3 6 V18 C3 19.657 4.343 21 6 21 H17 C18.657 21 20 19.657 20 18 V10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom fold line (shelf / inner page loop) */}
      <Path
        d="M3 15 H17 C18.657 15 20 16.343 20 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 2. Practice Icon - Exactly matching user screenshot media_1791971032338.png:
 * Diagonal pencil pointing to bottom-left with eraser band collar,
 * and a 4-point sparkle star at the top-left.
 */
export function PracticeIcon({ color, size = 24 }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* 4-Point Diamond Sparkle at Top-Left */}
      <Path
        d="M7 1 C7 2.8 8.8 4.2 10.5 4.2 C8.8 4.2 7 5.6 7 7.4 C7 5.6 5.2 4.2 3.5 4.2 C5.2 4.2 7 2.8 7 1 Z"
        fill={color}
      />

      {/* Diagonal Pencil Body angled at 45 degrees */}
      {/* Eraser Top (rounded cap) */}
      <Path
        d="M17.8 4.8 L20.2 7.2 C20.9 7.9 20.9 9 20.2 9.7 L18.8 11.1 L14 6.3 L15.4 4.9 C16.1 4.2 17.1 4.2 17.8 4.8 Z"
        fill={color}
      />

      {/* Pencil Shaft */}
      <Path
        d="M12.8 7.5 L17.5 12.2 L9.7 20 C9.4 20.3 8.9 20.5 8.5 20.5 L5 20.5 L5 17 C5 16.6 5.2 16.1 5.5 15.8 Z"
        fill={color}
      />

      {/* Collar Separation Band (Negative space cut) */}
      <Path
        d="M14.5 5.8 L18.2 9.5"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinecap="round"
      />

      {/* Sharp Lead Tip */}
      <Polygon
        points="5,17 3.5,21.5 8,20"
        fill={color}
      />
    </Svg>
  );
}

/**
 * 3. Home Icon - Classic house contour matching screenshot
 */
export function HomeIcon({ color, size = 24, focused }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5 L12 3 L21 10.5 V19.5 C21 20.328 20.328 21 19.5 21 H4.5 C3.672 21 3 20.328 3 19.5 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? color : 'none'}
        fillOpacity={focused ? 0.15 : 0}
      />
      <Path
        d="M9 21 V12 H15 V21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * 4. Prepare Icon - Open book contour matching screenshot
 */
export function PrepareIcon({ color, size = 24, focused }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 6 C5 5 8.5 5 12 7 C15.5 5 19 5 22 6 V19 C18.5 18 15.5 18 12 20 C8.5 18 5 18 2 19 Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={focused ? color : 'none'}
        fillOpacity={focused ? 0.15 : 0}
      />
      <Path
        d="M12 7 V20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * 5. Resources Icon - Spiral / binder document with lines matching screenshot
 */
export function ResourcesIcon({ color, size = 24, focused }: TabIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Tilted / bounded notebook */}
      <Rect
        x="5"
        y="3"
        width="15"
        height="18"
        rx="2.5"
        stroke={color}
        strokeWidth="2"
        fill={focused ? color : 'none'}
        fillOpacity={focused ? 0.15 : 0}
      />
      {/* Spiral binder notches on left */}
      <Line x1="3" y1="7" x2="6" y2="7" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="12" x2="6" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="3" y1="17" x2="6" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Content lines inside */}
      <Line x1="9.5" y1="8" x2="16.5" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="9.5" y1="12" x2="16.5" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="9.5" y1="16" x2="14" y2="16" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}
