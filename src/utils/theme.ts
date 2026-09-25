// Color calculation and theme generator utilities
// Generates complete harmonious UI styling from 2 user-selected colors: [Background Color] and [Card Color]
// All other colors (text, borders, tracks, dots, and highlights) are computed automatically for maximum readability and aesthetics.

export interface ColorScheme {
  isDark: boolean;
  pageBg: string;       // 背景色（全体のベース背景）
  cardBg: string;       // カード色（図・カルテカードの背景）
  cardBgElevated: string;
  subtleBg: string;     // 特例枠などの薄い背景
  borderColor: string;  // 自動調整されるカード枠線
  borderSubtle: string; // 自動調整される区切り線・ヘアライン
  textPrimary: string;  // 自動調整される高コントラスト主要文字
  textSecondary: string;// 自動調整される副次文字（攻め/受けラベル等）
  textMuted: string;    // 自動調整される補助文字（日付、注釈等）
  accent: string;       // 自動設定されるハイライト色
  accentHover: string;
  accentText: string;
  accentSubtle: string;
  trackBg: string;      // 自動調整される目盛りバー色
  dotBg: string;        // 自動調整される目盛りドット色（・・・・・）
}

export interface ThemePreset {
  id: 'dark' | 'light';
  name: string;
  description: string;
  baseColor: string; // 背景色
  cardColor: string; // カード色
}

// プリセットはダークとライトのみ（青みのない低彩度ニュートラルダーク & クリーンライト）
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'dark',
    name: 'ダーク',
    description: '青みのない低彩度ニュートラルダーク',
    baseColor: '#121214',
    cardColor: '#18181b',
  },
  {
    id: 'light',
    name: 'ライト',
    description: '清潔感のあるクリーンライト',
    baseColor: '#f4f4f5',
    cardColor: '#ffffff',
  },
];

// Helper: parse hex color to RGB
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (clean.length !== 6) {
    return { r: 18, g: 18, b: 20 };
  }
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return {
    r: isNaN(r) ? 18 : r,
    g: isNaN(g) ? 18 : g,
    b: isNaN(b) ? 20 : b,
  };
}

// Helper: RGB to hex
export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toH = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toH(r)}${toH(g)}${toH(b)}`;
}

// Helper: RGB to HSL
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
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
  return { h: h * 360, s, l };
}

// Helper: HSL to RGB
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  h /= 360;
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

// Adjust lightness of hex
export function adjustLightness(hex: string, deltaL: number): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newL = Math.max(0, Math.min(1, l + deltaL));
  const newRgb = hslToRgb(h, s, newL);
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

// Relative luminance
export function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

/**
 * ユーザーが選んだ【背景色】と【カード色】の2色から、
 * それ以外の文字・枠線・目盛線・目盛ドット・ハイライトを
 * 最も見やすく・綺麗になるよう自動調整して調和パレットを生成する
 */
export function generateColorScheme(pageBg: string, rawCardBg?: string): ColorScheme {
  // cardBgが未指定の場合は背景色から自動判定
  let cardBg = rawCardBg;
  const pageLum = getLuminance(pageBg);

  if (!cardBg) {
    if (pageLum < 0.4) {
      cardBg = adjustLightness(pageBg, 0.05);
    } else {
      cardBg = '#ffffff';
    }
  }

  const cardLum = getLuminance(cardBg);
  const isDark = cardLum < 0.42; // カードが暗い色か明るい色かでダーク/ライトを決定

  const cardRgb = hexToRgb(cardBg);
  const cardHsl = rgbToHsl(cardRgb.r, cardRgb.g, cardRgb.b);

  if (isDark) {
    // === ダーク調和（カードが暗い色の場合） ===

    // 枠線: カード色より適度に明るくして、暗所でもカード境界がしっかり見えるように調整
    const borderColor = adjustLightness(cardBg, 0.09);
    const borderSubtle = adjustLightness(cardBg, 0.045);

    // ポップアップ・エレベーテッド
    const cardBgElevated = adjustLightness(cardBg, 0.04);
    const subtleBg = adjustLightness(cardBg, 0.025);

    // 文字色: 高コントラストで読みやすい純白〜ニュートラルシルバー（彩度を抑えて目に優しく）
    const textPrimary = '#fafafa';
    const textSecondary = '#a1a1aa';
    const textMuted = '#71717a';

    // 目盛バー（トラック）とドット（・・・・・）
    // カード色に馴染みつつ目盛りがはっきり視認できるコントラスト
    const trackBg = adjustLightness(cardBg, 0.08);
    const dotBg = adjustLightness(cardBg, 0.28);

    // ハイライト色: 無彩色で統一
    const accent = '#fafafa';
    const accentHover = '#e4e4e7';
    const accentText = '#18181b';
    const accentSubtle = 'rgba(255, 255, 255, 0.08)';

    return {
      isDark: true,
      pageBg,
      cardBg,
      cardBgElevated,
      subtleBg,
      borderColor,
      borderSubtle,
      textPrimary,
      textSecondary,
      textMuted,
      accent,
      accentHover,
      accentText,
      accentSubtle,
      trackBg,
      dotBg,
    };
  } else {
    // === ライト調和（カードが明るい色の場合） ===

    // 枠線: カード色より自然に落ち着いた境界線
    const borderColor = adjustLightness(cardBg, -0.13);
    const borderSubtle = adjustLightness(cardBg, -0.065);

    // ポップアップ・エレベーテッド
    const cardBgElevated = '#ffffff';
    const subtleBg = adjustLightness(cardBg, -0.035);

    // 文字色: 視認性抜群のディープチャコール（完全な黒より自然）
    const textPrimary = '#18181b';
    const textSecondary = '#52525b';
    const textMuted = '#71717a';

    // 目盛バー（トラック）とドット（・・・・・）
    const trackBg = adjustLightness(cardBg, -0.10);
    const dotBg = adjustLightness(cardBg, -0.32);

    // ハイライト色: 無彩色で統一
    const accent = '#18181b';
    const accentHover = '#27272a';
    const accentText = '#ffffff';
    const accentSubtle = 'rgba(0, 0, 0, 0.06)';

    return {
      isDark: false,
      pageBg,
      cardBg,
      cardBgElevated,
      subtleBg,
      borderColor,
      borderSubtle,
      textPrimary,
      textSecondary,
      textMuted,
      accent,
      accentHover,
      accentText,
      accentSubtle,
      trackBg,
      dotBg,
    };
  }
}
