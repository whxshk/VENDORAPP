/**
 * Inline SVG icon components matching the SharkBand design system.
 * Uses react-native-svg for crisp rendering on all densities.
 */
import React from 'react';
import Svg, { Path, Circle, Polyline, Line, Polygon, Rect } from 'react-native-svg';

type IconProps = { color?: string; size?: number; strokeWidth?: number };

const DEFAULTS = { color: '#9CA3AF', size: 20, strokeWidth: 1.9 };

export function WalletIcon({ color = DEFAULTS.color, size = DEFAULTS.size, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M17 12h1a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-1a2 2 0 0 1 0-4z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function CompassIcon({ color = DEFAULTS.color, size = DEFAULTS.size, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
      <Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function ClockIcon({ color = DEFAULTS.color, size = DEFAULTS.size, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
      <Polyline points="12 6 12 12 16 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function UserIcon({ color = DEFAULTS.color, size = DEFAULTS.size, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function SearchIcon({ color = '#9CA3AF', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </Svg>
  );
}

export function ChevronRightIcon({ color = '#D1D5DB', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 18 15 12 9 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function LocationIcon({ color = '#9CA3AF', size = 12 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polygon points="3 11 22 2 13 21 11 13 3 11" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

export function StarIcon({ color = '#f59e0b', size = 12 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </Svg>
  );
}

/** Custom QR code icon for the center nav button */
export function QRNavIcon({ color = 'white', size = 26 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 26 26" fill="none">
      <Rect x="2" y="2" width="9" height="9" rx="1.5" fill={color}/>
      <Rect x="3.5" y="3.5" width="6" height="6" rx="0.8" fill="transparent"/>
      <Rect x="5" y="5" width="3" height="3" rx="0.4" fill="transparent"/>
      <Rect x="15" y="2" width="9" height="9" rx="1.5" fill={color}/>
      <Rect x="16.5" y="3.5" width="6" height="6" rx="0.8" fill="transparent"/>
      <Rect x="18" y="5" width="3" height="3" rx="0.4" fill="transparent"/>
      <Rect x="2" y="15" width="9" height="9" rx="1.5" fill={color}/>
      <Rect x="3.5" y="16.5" width="6" height="6" rx="0.8" fill="transparent"/>
      <Rect x="5" y="18" width="3" height="3" rx="0.4" fill="transparent"/>
      <Rect x="15" y="15" width="2.5" height="2.5" rx="0.4" fill={color}/>
      <Rect x="19" y="15" width="2.5" height="2.5" rx="0.4" fill={color}/>
      <Rect x="15" y="19" width="2.5" height="2.5" rx="0.4" fill={color}/>
      <Rect x="19" y="19" width="2.5" height="2.5" rx="0.4" fill={color}/>
      <Rect x="23" y="15" width="1" height="5.5" rx="0.3" fill={color}/>
      <Rect x="15" y="23" width="5.5" height="1" rx="0.3" fill={color}/>
      <Rect x="21" y="21" width="3" height="3" rx="0.4" fill={color}/>
    </Svg>
  );
}
