import React from 'react';
import { Character, MapProject, STAGE_DEFINITIONS, StageLevel } from '../types';
import { calcAveragePosition, getPositionLabel, stageToPercent, getMatchingSparkleColor } from '../utils/calc';
import { ColorScheme, generateColorScheme } from '../utils/theme';
import { CharacterAvatar } from './CharacterAvatar';
import { SparkleIcon } from './SparkleIcon';
import { Edit2, Trash2 } from 'lucide-react';

interface MatrixTableProps {
  project: MapProject;
  colorScheme?: ColorScheme;
  onUpdateCharacterScore: (charId: string, axisId: string, newScore: StageLevel) => void;
  onEditCharacter: (char: Character) => void;
  onDeleteCharacter: (charId: string) => void;
  isExportView?: boolean;
}

const STAGES: StageLevel[] = [1, 2, 3, 4, 5];

export const MatrixTable: React.FC<MatrixTableProps> = ({
  project,
  colorScheme: passedScheme,
  onUpdateCharacterScore,
  onEditCharacter,
  onDeleteCharacter,
  isExportView = false,
}) => {
  const scheme =
    passedScheme ||
    generateColorScheme(
      project.baseColor || (project.themeMode === 'light' ? '#f4f4f5' : '#121214'),
      project.cardColor || (project.themeMode === 'light' ? '#ffffff' : '#18181b')
    );
  const isDark = scheme.isDark;
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  return (
    <div id="character-records-container" className="w-full space-y-4">
      {/* Top Bar (Interactive Mode Only) */}
      {!isExportView && (
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2
              className="text-sm font-bold tracking-tight"
              style={{ color: scheme.textPrimary }}
            >
              個別表示
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: scheme.subtleBg,
                color: scheme.textSecondary,
                borderColor: scheme.borderSubtle,
              }}
            >
              {project.characters.length}人
            </span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {project.characters.length === 0 ? (
        <div
          className="w-full rounded-xl border p-8 text-center transition-colors"
          style={{
            backgroundColor: scheme.cardBg,
            borderColor: scheme.borderColor,
            color: scheme.textMuted,
          }}
        >
          <p className="text-sm">キャラクターがまだ登録されていません。</p>
        </div>
      ) : (
        /* Vertical Cards Grid (カルテ風レイアウト) */
        <div
          className={
            project.characters.length === 1
              ? 'flex justify-center w-full'
              : project.characters.length === 2
              ? isExportView
                ? 'grid grid-cols-2 gap-4 max-w-2xl mx-auto w-full justify-center'
                : 'grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl sm:max-w-3xl mx-auto w-full justify-center'
              : isExportView
              ? 'grid grid-cols-3 gap-4 w-full'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full'
          }
        >
          {project.characters.map((char) => {
            const avgPos = calcAveragePosition(char, project.axes);
            const summary = getPositionLabel(avgPos);

            return (
              <div
                key={char.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors shadow-sm ${
                  project.characters.length === 1 ? 'w-full max-w-md' : 'w-full'
                }`}
                style={{
                  backgroundColor: scheme.cardBg,
                  borderColor: scheme.borderColor,
                  color: scheme.textPrimary,
                }}
              >
                <div>
                  {/* Card Header: Avatar, Name, and Position Badge */}
                  <div
                    className="flex items-center justify-between gap-2 pb-3 border-b"
                    style={{ borderColor: scheme.borderSubtle }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CharacterAvatar character={char} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: char.color }}
                            title={`テーマ色: ${char.color}`}
                          />
                          <h3 className="font-bold text-sm truncate leading-tight">
                            {char.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* Overall Summary & Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded border whitespace-nowrap"
                        style={{
                          borderColor: scheme.borderSubtle,
                          color: scheme.textSecondary,
                          backgroundColor: scheme.subtleBg,
                        }}
                      >
                        {summary.label}
                      </span>

                      {!isExportView && (
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => onEditCharacter(char)}
                            className="p-1 rounded transition-colors"
                            style={{ color: scheme.textMuted }}
                            title="編集"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {confirmDeleteId === char.id ? (
                            <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/30 px-1.5 py-0.5 rounded text-[10px]">
                              <span className="text-rose-500 font-bold whitespace-nowrap">削除？</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteCharacter(char.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-1.5 py-0.5 bg-rose-600 text-white rounded font-bold hover:bg-rose-500 transition-colors"
                              >
                                はい
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-1 py-0.5 rounded"
                                style={{ color: scheme.textMuted }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(char.id)}
                              className="p-1 rounded transition-colors hover:text-rose-500"
                              style={{ color: scheme.textMuted }}
                              title="削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body: Individual Axes (各項目スコア一覧) */}
                  <div className="py-3 space-y-2.5">
                    {project.axes.map((axis) => {
                      const currentLevel = (char.scores[axis.id] ?? 3) as StageLevel;
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

                          {/* 5-Dot Bar without box border */}
                          <div className="flex items-center gap-1.5 py-0.5">
                            <span
                              className="text-[10px] w-7 shrink-0 text-right truncate font-medium"
                              style={{ color: scheme.textSecondary }}
                            >
                              {leftLabel}
                            </span>

                            <div className="flex-1 px-2">
                              <div className="relative w-full h-6 flex items-center">
                                {/* Slim Bar Track */}
                                <div
                                  className="absolute inset-y-0 my-auto -inset-x-1 h-1 rounded-full pointer-events-none"
                                  style={{ backgroundColor: scheme.trackBg }}
                                />

                                {/* 5 Tick dots & Colored bead for selected position */}
                                {STAGES.map((lvl) => {
                                  const isSelected = lvl === currentLevel;
                                  const pct = stageToPercent(lvl);
                                  const isCharSpecialForAxis =
                                    char.isSpecial && Boolean(char.specialAxes?.includes(axis.id));

                                  return (
                                    <div
                                      key={lvl}
                                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none"
                                      style={{ left: `${pct}%` }}
                                    >
                                      {isSelected ? (
                                        <div className="relative flex items-center justify-center">
                                          {isCharSpecialForAxis && (
                                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                              <SparkleIcon
                                                color={char.color}
                                                size={11}
                                                withBorder={false}
                                              />
                                            </div>
                                          )}
                                          <div
                                            className="w-3.5 h-3.5 rounded-full shadow-xs z-10 transition-transform"
                                            style={{
                                              backgroundColor: char.color || '#52525b',
                                            }}
                                            title={`${axis.name}: ${STAGE_DEFINITIONS[lvl].label}`}
                                          />
                                        </div>
                                      ) : (
                                        <div
                                          className="w-1.5 h-1.5 rounded-full"
                                          style={{ backgroundColor: scheme.dotBg }}
                                        />
                                      )}
                                    </div>
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

                {/* Card Footer: 特例メモ */}
                {char.isSpecial && (
                  <div
                    className="mt-2.5 pt-2 border-t space-y-1"
                    style={{ borderColor: scheme.borderSubtle }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className="flex items-center gap-1 font-bold shrink-0 leading-tight text-[10px] sm:text-[11px]"
                        style={{ color: scheme.textPrimary }}
                      >
                        <SparkleIcon color={scheme.textPrimary} size={10} withBorder={false} />
                        <span>特例</span>
                      </div>
                      {char.excludeFromStandardMap && (
                        <span
                          className="text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-medium border shrink-0 leading-normal"
                          style={{
                            backgroundColor: scheme.subtleBg,
                            borderColor: scheme.borderSubtle,
                            color: scheme.textMuted,
                          }}
                        >
                          特例枠のみ
                        </span>
                      )}
                    </div>
                    <p
                      className="text-[9px] sm:text-[9.5px] leading-relaxed break-words whitespace-pre-wrap pl-0.5"
                      style={{ color: scheme.textSecondary }}
                    >
                      {char.specialNote || '（特例メモ未記入）'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
