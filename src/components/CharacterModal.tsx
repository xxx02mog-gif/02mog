import React, { useState, useEffect, useRef } from 'react';
import { AxisDefinition, Character, StageLevel, STAGE_DEFINITIONS } from '../types';
import { COLOR_PALETTE } from '../data/defaultData';
import { CharacterAvatar } from './CharacterAvatar';
import { SparkleIcon } from './SparkleIcon';
import { getCharacterShortName, calcAveragePosition, getPositionLabel, stageToPercent, getMatchingSparkleColor } from '../utils/calc';
import { ColorScheme, generateColorScheme } from '../utils/theme';
import { X, Upload, Trash2, Check } from 'lucide-react';

interface CharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Character) => void;
  initialCharacter?: Character | null;
  axes: AxisDefinition[];
  isDark?: boolean;
  colorScheme?: ColorScheme;
}

const STAGES: StageLevel[] = [1, 2, 3, 4, 5];

export const CharacterModal: React.FC<CharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCharacter,
  axes,
  isDark: passedDark,
  colorScheme: passedScheme,
}) => {
  const scheme =
    passedScheme ||
    generateColorScheme(
      passedDark === false ? '#f4f4f5' : '#121214',
      passedDark === false ? '#ffffff' : '#18181b'
    );
  const isDark = scheme.isDark;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [isShortNameCustomized, setIsShortNameCustomized] = useState(false);
  const [color, setColor] = useState('#3b82f6');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [scores, setScores] = useState<Record<string, StageLevel>>({});
  const [isSpecial, setIsSpecial] = useState(false);
  const [specialNote, setSpecialNote] = useState('');
  const [specialAxes, setSpecialAxes] = useState<string[]>([]);
  const [excludeFromStandardMap, setExcludeFromStandardMap] = useState(false);

  useEffect(() => {
    if (initialCharacter) {
      setName(initialCharacter.name);
      setShortName(initialCharacter.shortName || initialCharacter.name.slice(0, 2));
      setIsShortNameCustomized(Boolean(initialCharacter.shortName));
      setColor(initialCharacter.color);
      setAvatarUrl(initialCharacter.avatarUrl || '');
      setScores({ ...initialCharacter.scores });
      setIsSpecial(initialCharacter.isSpecial);
      setSpecialNote(initialCharacter.specialNote || '');
      setSpecialAxes(initialCharacter.specialAxes || []);
      setExcludeFromStandardMap(initialCharacter.excludeFromStandardMap || false);
    } else {
      setName('');
      setShortName('');
      setIsShortNameCustomized(false);
      const randomColor = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      setColor(randomColor);
      setAvatarUrl('');
      const defaultScores: Record<string, StageLevel> = {};
      axes.forEach((a) => {
        defaultScores[a.id] = 3; // default to middle
      });
      setScores(defaultScores);
      setIsSpecial(false);
      setSpecialNote('');
      setSpecialAxes([]);
      setExcludeFromStandardMap(false);
    }
  }, [initialCharacter, isOpen, axes]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!val.trim()) {
      setShortName('');
      setIsShortNameCustomized(false);
    } else if (!isShortNameCustomized) {
      const autoShort = val.replace(/\s+/g, '').slice(0, 2);
      setShortName(autoShort);
    }
  };

  const handleShortNameChange = (val: string) => {
    setShortName(val.slice(0, 3));
    setIsShortNameCustomized(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      alert('画像サイズは3MB以下にしてください');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setAvatarUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleScoreChange = (axisId: string, level: StageLevel) => {
    setScores((prev) => ({
      ...prev,
      [axisId]: level,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('キャラクター名を入力してください');
      return;
    }

    const finalShort =
      (shortName.trim() || name.trim().replace(/\s+/g, '').slice(0, 2)).slice(0, 3);

    const charToSave: Character = {
      id: initialCharacter ? initialCharacter.id : `char-${Date.now()}`,
      name: name.trim(),
      shortName: finalShort,
      color,
      avatarUrl,
      scores,
      isSpecial,
      specialNote: isSpecial ? specialNote.trim() : '',
      specialAxes: isSpecial ? specialAxes : [],
      excludeFromStandardMap: isSpecial ? excludeFromStandardMap : false,
    };

    onSave(charToSave);
    onClose();
  };

  const previewChar: Character = {
    id: 'preview',
    name: name || '名前',
    shortName: shortName || (name ? name.replace(/\s+/g, '').slice(0, 2) : '名前'),
    color,
    avatarUrl,
    scores,
    isSpecial,
    specialNote,
    specialAxes,
    excludeFromStandardMap,
  };

  const isCustomColor = !COLOR_PALETTE.some((c) => c.toLowerCase() === color.toLowerCase());
  const avgPos = calcAveragePosition(previewChar, axes);
  const posLabel = getPositionLabel(avgPos).label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto overflow-x-hidden">
      <div
        className={`relative w-full max-w-lg my-auto rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark
            ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
            : 'bg-white border-stone-300 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b shrink-0 ${
            isDark
              ? 'border-zinc-800 bg-zinc-950/70'
              : 'border-stone-200 bg-stone-50'
          }`}
        >
          <h3 className="text-base font-bold">
            {initialCharacter ? 'キャラクターの編集' : 'キャラクターの追加'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto overflow-x-hidden flex-1 text-xs">
          {/* Avatar & Name & Color */}
          <div
            className={`flex items-start gap-3 sm:gap-4 pb-4 border-b ${
              isDark ? 'border-zinc-800' : 'border-stone-200'
            }`}
          >
            <div className="flex flex-col items-center gap-1.5 shrink-0 pt-0.5">
              <CharacterAvatar character={previewChar} size="lg" />
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-2 py-0.5 text-[11px] rounded border flex items-center gap-1 transition-colors ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                  }`}
                >
                  <Upload className="w-2.5 h-2.5" />
                  画像
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setAvatarUrl('');
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className={`p-1 rounded border transition-colors ${
                      isDark
                        ? 'bg-zinc-800 text-zinc-400 hover:text-rose-400 border-zinc-700'
                        : 'bg-stone-100 text-stone-400 hover:text-rose-600 border-stone-300'
                    }`}
                    title="写真を削除"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0 space-y-2.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 min-w-0">
                  <label
                    className={`block text-[11px] font-semibold mb-1 ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}
                  >
                    名前
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="例: サンプル１"
                    required
                    className={`w-full min-w-0 px-2.5 sm:px-3 py-1.5 rounded border focus:outline-hidden focus:border-indigo-500 text-xs font-bold ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder-zinc-600'
                        : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
                    }`}
                  />
                </div>

                <div className="min-w-0">
                  <label
                    className={`block text-[11px] font-semibold mb-1 truncate ${
                      isDark ? 'text-zinc-300' : 'text-stone-700'
                    }`}
                    title="カプ名の略称（最大3文字。未入力なら名前の上2文字を使用）"
                  >
                    略称
                  </label>
                  <input
                    type="text"
                    value={shortName}
                    onChange={(e) => handleShortNameChange(e.target.value)}
                    placeholder="サ１"
                    maxLength={3}
                    className={`w-full min-w-0 px-1.5 sm:px-2 py-1.5 rounded border focus:outline-hidden focus:border-indigo-500 text-xs font-bold text-center ${
                      isDark
                        ? 'bg-zinc-950 border-zinc-700 text-zinc-100 placeholder-zinc-600'
                        : 'bg-stone-50 border-stone-300 text-stone-900 placeholder-stone-400'
                    }`}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label
                  className={`block text-[11px] font-semibold mb-1 ${
                    isDark ? 'text-zinc-300' : 'text-stone-700'
                  }`}
                >
                  テーマカラー
                </label>
                <div className="flex items-center gap-1 sm:gap-1.5 py-1.5 px-0.5 flex-nowrap overflow-visible">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full shrink-0 transition-transform border border-black/15 dark:border-white/20 cursor-pointer ${
                        color.toLowerCase() === c.toLowerCase()
                          ? 'scale-125 ring-2 ring-zinc-400 dark:ring-zinc-500 z-10'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                  <label
                    className={`relative w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 rounded-full shrink-0 cursor-pointer overflow-hidden border border-black/20 dark:border-white/20 flex items-center justify-center transition-transform ${
                      isCustomColor
                        ? 'scale-125 ring-2 ring-zinc-400 dark:ring-zinc-500 z-10'
                        : 'hover:scale-110'
                    }`}
                    style={{
                      background: isCustomColor
                        ? color
                        : 'linear-gradient(135deg, #ef4444, #eab308, #10b981, #3b82f6, #8b5cf6)',
                    }}
                    title="カスタム色を選択"
                  >
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 5-Dot Spectrum Selector: 個別表示・図表示と完全に同一のデザイン */}
          <div className="space-y-3">
            <div
              className={`flex items-center justify-between pb-1.5 border-b ${
                isDark ? 'border-zinc-800' : 'border-stone-200'
              }`}
            >
              <span
                className={`font-bold text-sm ${
                  isDark ? 'text-zinc-200' : 'text-stone-800'
                }`}
              >
                ポジション設定
              </span>
              <div className="flex items-center gap-1.5 text-xs">
                <span
                  className={`font-medium ${
                    isDark ? 'text-zinc-400' : 'text-stone-500'
                  }`}
                >
                  総合判定:
                </span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap"
                  style={{
                    borderColor: scheme.borderSubtle,
                    color: scheme.textSecondary,
                    backgroundColor: scheme.subtleBg,
                  }}
                >
                  {posLabel}
                </span>
              </div>
            </div>

            {/* 個別表示カードと同一のカードコンテナ＆軸リスト */}
            <div
              className="p-3.5 rounded-xl border space-y-3 transition-colors"
              style={{
                backgroundColor: scheme.subtleBg,
                borderColor: scheme.borderSubtle,
              }}
            >
              {axes.map((axis) => {
                const currentLevel = (scores[axis.id] ?? 3) as StageLevel;
                const leftLabel = axis.leftLabel || '攻め';
                const rightLabel = axis.rightLabel || '受け';

                return (
                  <div key={axis.id} className="space-y-1">
                    <div className="text-xs flex items-center">
                      <span
                        className="font-semibold"
                        style={{ color: scheme.textPrimary }}
                      >
                        {axis.name}
                      </span>
                      {axis.includeInOverall === false && (
                        <span
                          className="text-[10px] ml-1 font-normal"
                          style={{ color: scheme.textMuted }}
                        >
                          （総合外）
                        </span>
                      )}
                    </div>

                    {/* 5-Dot Bar (個別表示・図表示と完全に同一のデザイン・目盛り線・ドット) */}
                    <div className="flex items-center gap-1.5 pt-2.5 pb-1">
                      <span
                        className="text-[10px] w-7 shrink-0 text-right truncate font-medium"
                        style={{ color: scheme.textSecondary }}
                      >
                        {leftLabel}
                      </span>

                      <div className="flex-1 px-2">
                        <div className="relative w-full h-6 flex items-center">
                          {/* Slim Bar Track: 個別表示・図表示と同一 */}
                          <div
                            className="absolute inset-y-0 my-auto -inset-x-1 h-1 rounded-full pointer-events-none"
                            style={{ backgroundColor: scheme.trackBg }}
                          />

                          {/* 5 Interactive Clickable Positions */}
                          {STAGES.map((lvl) => {
                            const isSelected = lvl === currentLevel;
                            const pct = stageToPercent(lvl);
                            const isSpecialForThisAxis =
                              isSpecial && specialAxes.includes(axis.id);

                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleScoreChange(axis.id, lvl)}
                                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center cursor-pointer group focus:outline-none z-10"
                                style={{ left: `${pct}%` }}
                                title={`${axis.name}: ${STAGE_DEFINITIONS[lvl].label}`}
                              >
                                {isSelected ? (
                                  <div className="relative flex items-center justify-center">
                                    {isSpecialForThisAxis && (
                                      <div className="absolute bottom-full mb-0.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                        <SparkleIcon
                                          color={color}
                                          size={10}
                                          withBorder={false}
                                        />
                                      </div>
                                    )}
                                    <div
                                      className="w-3.5 h-3.5 rounded-full shadow-xs z-10 transition-transform scale-110"
                                      style={{
                                        backgroundColor: color || '#52525b',
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className="w-1.5 h-1.5 rounded-full transition-transform group-hover:scale-150"
                                    style={{ backgroundColor: scheme.dotBg }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <span
                        className="text-[10px] w-7 shrink-0 text-left truncate font-medium"
                        style={{ color: scheme.textSecondary }}
                      >
                        {rightLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: 「特例」のみ */}
          <div
            className={`p-3 rounded-lg border space-y-2.5 ${
              isDark
                ? 'bg-zinc-950/60 border-zinc-800'
                : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <SparkleIcon
                  color={isDark ? '#fafafa' : '#18181b'}
                  size={12}
                  withBorder={false}
                />
                <span
                  className={`text-xs font-bold ${
                    isDark ? 'text-zinc-100' : 'text-zinc-900'
                  }`}
                >
                  特例
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSpecial}
                  onChange={(e) => setIsSpecial(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-zinc-300 dark:peer-checked:bg-zinc-200"></div>
              </label>
            </div>

            {isSpecial && (
              <div className="pt-1 space-y-2">
                <textarea
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  rows={2}
                  placeholder="例: 「〇〇の前でのみ受け」「年下相手にのみ主導」など"
                  className={`w-full px-2.5 py-1.5 text-xs rounded border focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-500 ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-600'
                      : 'bg-white border-zinc-300 text-stone-900 placeholder-stone-400'
                  }`}
                />

                {/* 記載欄の下に表示。□項目名　のみ */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
                  {axes.map((axis) => {
                    const isChecked = specialAxes.includes(axis.id);
                    return (
                      <label
                        key={axis.id}
                        className={`inline-flex items-center gap-1.5 text-xs cursor-pointer select-none ${
                          isDark ? 'text-zinc-300' : 'text-stone-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSpecialAxes((prev) => [...prev, axis.id]);
                            } else {
                              setSpecialAxes((prev) => prev.filter((id) => id !== axis.id));
                            }
                          }}
                          className="rounded border-zinc-700 text-zinc-900 dark:text-zinc-100 accent-zinc-800 dark:accent-zinc-200 focus:ring-0"
                        />
                        <span>{axis.name}</span>
                      </label>
                    );
                  })}
                </div>

                <label
                  className={`flex items-center gap-2 text-[11px] cursor-pointer pt-1 ${
                    isDark ? 'text-zinc-300' : 'text-stone-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={excludeFromStandardMap}
                    onChange={(e) => setExcludeFromStandardMap(e.target.checked)}
                    className="rounded border-zinc-700 text-zinc-900 dark:text-zinc-100 accent-zinc-800 dark:accent-zinc-200 focus:ring-0"
                  />
                  <span>特例枠のみに表示</span>
                </label>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div
            className={`flex items-center justify-end gap-2 pt-2 border-t ${
              isDark ? 'border-zinc-800' : 'border-stone-200'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold rounded-md transition-colors flex items-center gap-1 shadow-sm"
              style={{
                backgroundColor: scheme.accent,
                color: scheme.accentText,
              }}
            >
              <Check className="w-3.5 h-3.5" />
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
