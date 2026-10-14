/**
 * Theme-aware colour helpers.
 *
 * Many status/KPI configs store a deep text colour designed for a pastel light-mode background
 * (e.g. `{ color: '#166534', bg: '#DCFCE7' }`). In dark mode the pastel becomes a translucent
 * tint, so the deep colour must be lifted to stay readable. Use inside `sx` callbacks:
 *
 *   sx={{ bgcolor: cfg.bg, color: (theme) => themeText(theme, cfg.color) }}
 */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const hexToHsl = (hex) => {
  const full = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const r = parseInt(full.slice(1, 3), 16) / 255;
  const g = parseInt(full.slice(3, 5), 16) / 255;
  const b = parseInt(full.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100), chroma: d * 255 };
};

const cache = new Map();

/** Returns a dark-mode-readable variant of a deep text colour; other values pass through unchanged. */
export const toDarkModeText = (color) => {
  if (typeof color !== 'string' || !HEX.test(color)) return color;
  if (cache.has(color)) return cache.get(color);
  const { h, s, l, chroma } = hexToHsl(color);
  let out = color;
  if (l < 50) {
    out = chroma < 15 ? '#E2E8F0' : `hsl(${h}, ${Math.min(Math.max(s, 45), 90)}%, 74%)`;
  }
  cache.set(color, out);
  return out;
};

/** sx helper: original colour in light mode, readable variant in dark mode. */
export const themeText = (theme, color) => (theme.palette.mode === 'dark' ? toDarkModeText(color) : color);
