import React from "react";
import { Settings } from "lucide-react"; // <-- Импорт нормальной шестеренки

type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
};

const baseStyle = "pointer-events-none";

// PLAY — математически центрированный треугольник
export function IPlay({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} {...props}>
      <path d="M 8 4 L 20 12 L 8 20 Z" fill="currentColor" />
    </svg>
  );
}

// PAUSE
export function IPause({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} {...props}>
      <rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor" />
    </svg>
  );
}

// SKIP BACK
export function ISkipBack({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} {...props}>
      <path d="M19 4L7 12L19 20V4Z" fill="currentColor" />
      <rect x="3" y="4" width="2.5" height="16" fill="currentColor" />
    </svg>
  );
}

// SKIP FORWARD
export function ISkipForward({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} {...props}>
      <path d="M5 4L17 12L5 20V4Z" fill="currentColor" />
      <rect x="18.5" y="4" width="2.5" height="16" fill="currentColor" />
    </svg>
  );
}

// MORE — круглые точки
export function IMore({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <circle cx="5" cy="12" r="2.5" fill="currentColor" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <circle cx="19" cy="12" r="2.5" fill="currentColor" />
    </svg>
  );
}

// HEART (Оставляем как было, но с толстым контуром)
export function IHeart({ size = 24, className = "", filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <path
        d="M12 20L4 12.5C2.5 11 2.5 8.5 4 7C5.5 5.5 8 5.5 9.5 7L12 9.5L14.5 7C16 5.5 18.5 5.5 20 7C21.5 8.5 21.5 11 20 12.5L12 20Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="miter"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

// SEARCH
export function ISearch({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

// SETTINGS — Используем идеальную шестеренку из Lucide
export function ISettings({ size = 24, className = "", ...props }: IconProps) {
  return <Settings size={size} className={className} strokeWidth={2.5} {...props} />;
}

// VOLUME
export function IVolume({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <path d="M3 9H7L12 4V20L7 15H3V9Z" fill="currentColor" />
      <path d="M16 8C18 10 18 14 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M19 5C23 9 23 15 19 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

// MUTE
export function IMute({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <path d="M3 9H7L12 4V20L7 15H3V9Z" fill="currentColor" />
      <path d="M16 9L22 15M22 9L16 15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

// CHEVRON DOWN
export function IChevronDown({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <path d="M4 8L12 16L20 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

// MUSIC
export function IMusic({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <circle cx="7" cy="18" r="3" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="17" cy="16" r="3" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 18V6L20 4V16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

// PIN
export function IPin({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <path d="M9 3H15L14 9L18 12V14H6V12L10 9L9 3Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="miter" />
      <path d="M12 14V21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

// RADIO
export function IRadio({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M7 7C5 9 5 15 7 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M17 7C19 9 19 15 17 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M4 4C1 7 1 17 4 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M20 4C23 7 23 17 20 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

// SHARE
export function IShare({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M8 11L16 7M8 13L16 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}

// SHUFFLE
export function IShuffle({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <path d="M3 7H7L17 17H21M21 17L18 14M21 17L18 20M3 17H7L17 7H21M21 7L18 4M21 7L18 10" 
        stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

// REPEAT
export function IRepeat({ size = 24, className = "", ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseStyle} ${className}`} fill="none" {...props}>
      <path d="M16 3L21 7L16 11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M3 12V9C3 7.3 4.3 6 6 6H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
      <path d="M8 21L3 17L8 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
      <path d="M21 12V15C21 16.7 19.7 18 18 18H4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" />
    </svg>
  );
}