import { AxisDefinition, Character, StageLevel } from '../types';
import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from './theme';

/**
 * Calculate the overall average position along 1..5 for a character.
 */
export function calcAveragePosition(character: Character, axes: AxisDefinition[]): number {
  const activeAxes = axes.filter((a) => a.includeInOverall !== false);
  const activeAxisIds = activeAxes.map((a) => a.id);
  const scoredValues = activeAxisIds
    .map((id) => character.scores[id])
    .filter((v): v is StageLevel => typeof v === 'number' && v >= 1 && v <= 5);

  if (scoredValues.length === 0) return 3;
  const sum = scoredValues.reduce((acc, curr) => acc + curr, 0);
  return sum / scoredValues.length;
}

/**
 * Maps a stage level or float [1, 5] to a percentage [0, 100]
 */
export function stageToPercent(level: number): number {
  const clamped = Math.max(1, Math.min(5, level));
  return ((clamped - 1) / 4) * 100;
}

/**
 * Returns qualitative position name without numerical score.
 */
export function getPositionLabel(position: number): { label: string; color: string } {
  if (position <= 1.4) {
    return { label: '攻め', color: '#71717a' };
  }
  if (position <= 2.4) {
    return { label: '攻め寄り', color: '#71717a' };
  }
  if (position <= 3.6) {
    return { label: '中間', color: '#71717a' };
  }
  if (position <= 4.6) {
    return { label: '受け寄り', color: '#71717a' };
  }
  return { label: '受け', color: '#71717a' };
}

/**
 * Get color-coordinated sparkle (✦) color based on character's color.
 * If overlaid on avatar: deeper shade for light avatar, lighter shade for dark avatar.
 * If above tick bead: luminous tint on dark theme, deep shade on light theme.
 */
export function getMatchingSparkleColor(
  hexColor: string,
  isDarkTheme: boolean,
  isOverAvatar: boolean = false
): string {
  if (!hexColor) return isDarkTheme ? '#fafafa' : '#18181b';
  const { r, g, b } = hexToRgb(hexColor);
  const { h, s, l } = rgbToHsl(r, g, b);

  // If achromatic (gray, black, white)
  if (s < 0.12) {
    if (isOverAvatar) {
      return l > 0.5 ? '#18181b' : '#fafafa';
    }
    return isDarkTheme ? '#e4e4e7' : '#27272a';
  }

  if (isOverAvatar) {
    // Overlaid on the avatar (uses character's color as background)
    if (l >= 0.52) {
      const darkRgb = hslToRgb(h, Math.min(1, Math.max(0.85, s)), 0.22);
      return rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b);
    } else {
      const lightRgb = hslToRgb(h, Math.min(1, Math.max(0.8, s)), 0.82);
      return rgbToHex(lightRgb.r, lightRgb.g, lightRgb.b);
    }
  } else {
    // Floating above the tick bead on the card background
    if (isDarkTheme) {
      // In dark theme, card is dark, so a brighter/luminous shade of the character's hue
      const targetL = Math.max(0.68, Math.min(0.86, l + 0.18));
      const brightRgb = hslToRgb(h, Math.max(0.75, s), targetL);
      return rgbToHex(brightRgb.r, brightRgb.g, brightRgb.b);
    } else {
      // In light theme, card is light, so a deeper shade of the character's hue
      const targetL = Math.min(0.36, Math.max(0.18, l - 0.18));
      const deepRgb = hslToRgb(h, Math.max(0.8, s), targetL);
      return rgbToHex(deepRgb.r, deepRgb.g, deepRgb.b);
    }
  }
}

/**
 * Get contrast text color for avatar background.
 * When the background color is bright (making white text hard to read),
 * instead of harsh black, returns a deeper, richer shade of that same color.
 * (Maintains readability while optimizing aesthetics).
 */
export function getContrastTextColor(hexColor: string): string {
  if (!hexColor) return '#ffffff';
  const { r, g, b } = hexToRgb(hexColor);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Dark or medium background: crisp white text
  if (yiq < 148) {
    return '#ffffff';
  }

  // Bright background: compute a deeper, richer shade of the same color
  const { h, s } = rgbToHsl(r, g, b);

  // If achromatic (grayscale, silver, pale white)
  if (s < 0.12) {
    return '#27272a'; // Deep zinc charcoal
  }

  // Chromatic: retain exact hue, deepen lightness to 0.22 and keep saturation rich
  const darkL = 0.22;
  const richS = Math.min(1, Math.max(0.75, s * 1.1));
  const darkRgb = hslToRgb(h, richS, darkL);
  return rgbToHex(darkRgb.r, darkRgb.g, darkRgb.b);
}

/**
 * Extract initials or 2-3 char short name (max 3 characters)
 */
export function getCharacterShortName(character: { name: string; shortName?: string }): string {
  if (character.shortName && character.shortName.trim()) {
    return character.shortName.trim().slice(0, 3);
  }
  const cleanName = character.name.replace(/\s+/g, '');
  return cleanName.slice(0, 2) || '?';
}

export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).substring(0, 2);
  }
  return trimmed.substring(0, 2);
}
