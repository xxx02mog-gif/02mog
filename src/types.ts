export type StageLevel = 1 | 2 | 3 | 4 | 5;

export interface StageMeta {
  level: StageLevel;
  label: string;
  symbol: string;
  color: string;
}

// 5段階: 攻め ・・ 中間 ・・ 受け
export const STAGE_DEFINITIONS: Record<StageLevel, StageMeta> = {
  1: { level: 1, label: '攻め', symbol: '・', color: '#6366f1' },
  2: { level: 2, label: '攻め寄り', symbol: '・', color: '#0ea5e9' },
  3: { level: 3, label: '中間', symbol: '・', color: '#14b8a6' },
  4: { level: 4, label: '受け寄り', symbol: '・', color: '#f59e0b' },
  5: { level: 5, label: '受け', symbol: '・', color: '#f43f5e' },
};

export interface AxisDefinition {
  id: string;
  name: string;
  leftLabel?: string; // e.g. "攻め"
  rightLabel?: string; // e.g. "受け"
  description?: string;
  isSystem?: boolean;
  includeInOverall?: boolean; // 数値を総合軸の計算に使うか（デフォルト: true）
}

export interface Character {
  id: string;
  name: string;
  shortName?: string; // カプ略称・2〜3文字表記（最大3文字。未設定時は名前の上2文字）
  color: string; // Hex color
  avatarUrl?: string;
  scores: Record<string, StageLevel>; // axisId -> 1..5
  isSpecial: boolean; // 特例・除外枠 toggle
  specialNote: string; // 特例メモ
  specialAxes?: string[]; // 特例の対象項目 (axisId[])
  excludeFromStandardMap: boolean; // 通常マップ除外
}

export type ViewMode = 'diagram' | 'table' | 'combined';
export type ThemeMode = 'dark' | 'light';

export interface MapProject {
  title: string;
  creator: string;
  note: string;
  updatedAt: string;
  themeMode: ThemeMode;
  baseColor?: string; // 背景色 (Page background)
  cardColor?: string; // カード色 (Card background)
  accentColor?: string; // (内部自動調整)
  axes: AxisDefinition[];
  characters: Character[];
}
