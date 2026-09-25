import { AxisDefinition, Character, MapProject } from '../types';

export const DEFAULT_AXES: AxisDefinition[] = [
  {
    id: 'self',
    name: '自認',
    leftLabel: '攻め',
    rightLabel: '受け',
    description: '自己認識',
    isSystem: false,
    includeInOverall: true,
  },
  {
    id: 'others',
    name: '他認',
    leftLabel: '攻め',
    rightLabel: '受け',
    description: '周囲の認識',
    isSystem: false,
    includeInOverall: true,
  },
];

export const DEFAULT_CHARACTERS: Character[] = [
  {
    id: 'char-1',
    name: 'サンプル１',
    shortName: 'サ１',
    color: '#3b82f6',
    avatarUrl: '',
    scores: {
      self: 1, // 攻め
      others: 2, // 攻め寄り
    },
    isSpecial: false,
    specialNote: '',
    excludeFromStandardMap: false,
  },
  {
    id: 'char-2',
    name: 'サンプル２',
    shortName: 'サ２',
    color: '#ec4899',
    avatarUrl: '',
    scores: {
      self: 3, // 中間
      others: 5, // 受け
    },
    isSpecial: true,
    specialNote: 'サンプル１の前でのみ受け化',
    specialAxes: ['others'],
    excludeFromStandardMap: false,
  },
  {
    id: 'char-3',
    name: 'サンプル３',
    shortName: 'サ３',
    color: '#10b981',
    avatarUrl: '',
    scores: {
      self: 4, // 受け寄り
      others: 3, // 中間
    },
    isSpecial: false,
    specialNote: '',
    excludeFromStandardMap: false,
  },
];

export const DEFAULT_PROJECT: MapProject = {
  title: '攻め受け分類',
  creator: '@creator',
  note: '',
  updatedAt: new Date().toISOString().split('T')[0],
  themeMode: 'dark',
  baseColor: '#121214', // 背景色: 青みのない低彩度ニュートラルダーク
  cardColor: '#18181b', // カード色
  axes: DEFAULT_AXES,
  characters: DEFAULT_CHARACTERS,
};

// 色相順・多様な彩度・無彩色を含み、1行に収まる厳選11色
export const COLOR_PALETTE = [
  '#e11d48', // ローズ赤
  '#f472b6', // パステルピンク
  '#f97316', // オレンジ
  '#f59e0b', // アンバー
  '#fde047', // ペールイエロー
  '#10b981', // エメラルド緑
  '#06b6d4', // シアン
  '#3b82f6', // コバルト青
  '#8b5cf6', // バイオレット紫
  '#52525b', // スレートグレー
  '#18181b', // チャコール黒
];
