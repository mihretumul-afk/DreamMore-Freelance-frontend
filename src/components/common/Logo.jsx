import { cn } from '../../utils/cn';

/**
 * Dream More brand mark — precisely matching the official DreamMore logo:
 *  • Orange thick open D-arc (no left closing bar)
 *  • Dark navy M: two vertical leg bars + inverted-V chevron connecting their tops
 *  • Small ↗ arrow with L-shaped head at top-right, overlapping the D arc
 */
export function LogoMark({ className, ...props }) {
  return (
    <svg
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn('h-9 w-auto', className)}
      {...props}
    >
      {/*
        ── ORANGE D ARC ──
        Open D: thick stroked path starting top-left, arcing right, ending bottom-left.
        No vertical left bar — the ends are just rounded stroke caps.
      */}
      <path
        d="M22 12 H52 C80 12 95 30 95 55 C95 80 80 98 52 98 H22"
        stroke="#E8712C"
        strokeWidth="13"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/*
        ── DARK NAVY M SHAPE ──
        Composed of three parts:
        1. Left vertical bar (rect)
        2. Right vertical bar (rect)
        3. Inverted V chevron connecting the tops of both bars (points downward in center)
        All in dark navy #3D4464
      */}
      {/* Left vertical bar */}
      <rect x="22" y="22" width="12" height="68" fill="#3D4464" />
      {/* Right vertical bar */}
      <rect x="76" y="22" width="12" height="68" fill="#3D4464" />
      {/* Inverted-V chevron: from top-left bar → deep center valley → top-right bar */}
      <path
        d="M22 22 L55 62 L88 22"
        stroke="#3D4464"
        strokeWidth="12"
        fill="none"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />

      {/*
        ── UPWARD-RIGHT ARROW (↗) ──
        Diagonal shaft from lower-left to upper-right, with an L-shaped corner head.
        Positioned at the top-right, overlapping the orange D arc.
      */}
      {/* Diagonal shaft */}
      <line
        x1="84" y1="30"
        x2="104" y2="10"
        stroke="#3D4464"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* L-shaped arrowhead: top edge (horizontal) + right edge (vertical) */}
      <polyline
        points="90,10 104,10 104,24"
        stroke="#3D4464"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Full logo: mark + "DreamMore" wordmark with "Right work at right time" tagline.
 * variant="light" renders for dark surfaces (navbar, footer).
 */
export default function Logo({ variant = 'dark', tagline = true, className, markClassName }) {
  const light = variant === 'light';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className={markClassName} />
      <span className="leading-none">
        <span
          className={cn(
            'block text-lg font-extrabold tracking-tight',
            light ? 'text-white' : 'text-[#3D4464]',
          )}
        >
          DreamMore
        </span>
        {tagline && (
          <span
            className={cn(
              'mt-0.5 block text-[9px] font-normal tracking-wide',
              light ? 'text-slate-300' : 'text-slate-500',
            )}
          >
            Right work at right time
          </span>
        )}
      </span>
    </span>
  );
}
