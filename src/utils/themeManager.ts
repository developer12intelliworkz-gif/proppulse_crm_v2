function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function darkenColor(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.min(255, Math.floor(rgb.r * (1 - percent / 100))));
  const g = Math.max(0, Math.min(255, Math.floor(rgb.g * (1 - percent / 100))));
  const b = Math.max(0, Math.min(255, Math.floor(rgb.b * (1 - percent / 100))));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function updateThemeColor(hexColor: string) {
  if (!hexColor.startsWith('#')) {
    hexColor = `#${hexColor}`;
  }
  
  const rgb = hexToRgb(hexColor);
  if (!rgb) return;

  const hoverColor = darkenColor(hexColor, 10);
  const rgbString = `${rgb.r}, ${rgb.g}, ${rgb.b}`;

  // Store in localStorage
  localStorage.setItem('theme-color', hexColor);

  // Set CSS variables on the document element
  document.documentElement.style.setProperty('--theme-color', hexColor);
  document.documentElement.style.setProperty('--theme-color-hover', hoverColor);
  document.documentElement.style.setProperty('--theme-color-rgb', rgbString);

  // Calculate HSL and update Tailwind/Shadcn HSL variable tokens
  const hsl = hexToHsl(hexColor);
  if (hsl) {
    const hslString = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
    document.documentElement.style.setProperty('--primary', hslString);
    document.documentElement.style.setProperty('--sidebar-primary', hslString);
    document.documentElement.style.setProperty('--ring', hslString);

    // Calculate a soft matching theme background color wash (HSL)
    const currentMode = localStorage.getItem('theme-mode') || 'light';
    if (currentMode === 'dark') {
      document.documentElement.style.removeProperty('--background');
    } else {
      const bgHslString = `${hsl.h} ${Math.min(hsl.s, 45)}% 97.5%`;
      document.documentElement.style.setProperty('--background', bgHslString);
    }
  }
}

export function initThemeColor() {
  const savedColor = localStorage.getItem('theme-color') || '#6366F1';
  updateThemeColor(savedColor);
}

export function updateThemeMode(mode: 'light' | 'dark') {
  localStorage.setItem('theme-mode', mode);
  
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  // Re-run color updates to adapt mode-dependent variables (like --background wash)
  const savedColor = localStorage.getItem('theme-color') || '#6366F1';
  updateThemeColor(savedColor);
}

export function initThemeMode() {
  const savedMode = localStorage.getItem('theme-mode') as 'light' | 'dark' | null;
  if (savedMode) {
    updateThemeMode(savedMode);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    updateThemeMode(prefersDark ? 'dark' : 'light');
  }
}

