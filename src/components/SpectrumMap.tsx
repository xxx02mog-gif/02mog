import React from 'react';
import { AxisDefinition, Character, MapProject, StageLevel } from '../types';
import { calcAveragePosition, stageToPercent, getCharacterShortName, getMatchingSparkleColor } from '../utils/calc';
import { ColorScheme, generateColorScheme } from '../utils/theme';
import { CharacterAvatar } from './CharacterAvatar';
import { SparkleIcon } from './SparkleIcon';

interface SpectrumMapProps {
  project: MapProject;
  colorScheme?: ColorScheme;
  isExportView?: boolean;
  onEditCharacter?: (char: Character) => void;
  hideSpecialSection?: boolean;
}

export const SpectrumMap: React.FC<SpectrumMapProps> = ({
  project,
  colorScheme: passedScheme,
  isExportView = false,
  onEditCharacter,
  hideSpecialSection = false,
}) => {
  const scheme =
    passedScheme ||
    generateColorScheme(
      project.baseColor || (project.themeMode === 'light' ? '#f4f4f5' : '#121214'),
      project.cardColor || (project.themeMode === 'light' ? '#ffffff' : '#18181b')
    );
  const isDark = scheme.isDark;

  // Standard characters plotted on the spectrum track
  const standardCharacters = project.characters.filter((c) => !c.excludeFromStandardMap);

  // All characters marked as special (always displayed in the bottom 特例 section)
  const specialCharacters = project.characters.filter((c) => c.isSpecial);

  // 5 stage levels (0%, 25%, 50%, 75%, 100%)
  const stages: StageLevel[] = [1, 2, 3, 4, 5];

  // Default labels for the overall bar
  const defaultLeft = project.axes[0]?.leftLabel || '攻め';
  const defaultRight = project.axes[0]?.rightLabel || '受け';

  // Group characters on overall track that are within ~4% of each other to prevent complete occlusion
  const clusteredOverall: { pct: number; chars: Character[] }[] = [];
  const sortedByPos = [...standardCharacters].sort((a, b) => {
    return calcAveragePosition(a, project.axes) - calcAveragePosition(b, project.axes);
  });

  sortedByPos.forEach((char) => {
    const avgPos = calcAveragePosition(char, project.axes);
    const pct = stageToPercent(avgPos);

    const existingCluster = clusteredOverall.find(
      (c) => Math.abs(c.pct - pct) <= 4.5
    );

    if (existingCluster) {
      existingCluster.chars.push(char);
      // Average the percentage for the cluster center
      existingCluster.pct =
        (existingCluster.pct * (existingCluster.chars.length - 1) + pct) /
        existingCluster.chars.length;
    } else {
      clusteredOverall.push({ pct, chars: [char] });
    }
  });

  return (
    <div
      id="spectrum-map-card"
      className="w-full rounded-xl border p-4 sm:p-6 transition-colors duration-200 shadow-md"
      style={{
        backgroundColor: scheme.cardBg,
        borderColor: scheme.borderColor,
        color: scheme.textPrimary,
        minWidth: isExportView ? '680px' : 'auto',
      }}
    >
      {/* Title Header */}
      <div
        className="pb-3 border-b flex flex-wrap items-end justify-between gap-2"
        style={{ borderColor: scheme.borderSubtle }}
      >
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">
            {project.title || '攻め受け分類'}
          </h2>
        </div>

        {(project.creator || project.updatedAt) && (
          <div
            className="flex items-center gap-2 text-xs shrink-0 pb-0.5"
            style={{ color: scheme.textMuted }}
          >
            {project.creator && (
              <span className="font-medium">
                {project.creator.startsWith('@') ? project.creator : `@${project.creator}`}
              </span>
            )}
            {project.creator && project.updatedAt && <span aria-hidden="true">·</span>}
            {project.updatedAt && <span>{project.updatedAt}</span>}
          </div>
        )}
      </div>

      {/* SPECTRUM CONTAINER */}
      <div className="mt-4 space-y-4 sm:space-y-6">
        {/* 1. TOP MAIN OVERALL SPECTRUM (総合軸) */}
        <div className="pt-3.5 pb-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Axis Name Column: 総合 */}
            <div className="w-14 sm:w-20 shrink-0 text-right">
              <span
                className="font-bold text-xs sm:text-sm truncate block leading-tight"
                style={{ color: scheme.textPrimary }}
              >
                総合
              </span>
            </div>

            {/* Left Label: 攻め */}
            <span
              className="w-8 sm:w-10 text-right shrink-0 text-xs sm:text-sm font-bold truncate"
              style={{ color: scheme.textSecondary }}
            >
              {defaultLeft}
            </span>

            {/* Main Spectrum Track Area */}
            <div className="flex-1 px-4 sm:px-6">
              <div className="relative w-full h-10 flex items-center">
                {/* Slim Bar Track */}
                <div
                  className="absolute inset-y-0 my-auto -inset-x-1 h-1 rounded-full pointer-events-none"
                  style={{ backgroundColor: scheme.trackBg }}
                />

                {/* 5 Dots: ・ ・ ・ ・ ・ inside the track */}
                {stages.map((lvl) => (
                  <div
                    key={lvl}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-10"
                    style={{ left: `${stageToPercent(lvl)}%` }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: scheme.dotBg }}
                    />
                  </div>
                ))}

                {/* Plotted Characters */}
                {clusteredOverall.map((cluster, cIdx) => {
                  return (
                    <div
                      key={`cluster-${cIdx}`}
                      className="absolute top-1/2 flex items-center z-20"
                      style={{
                        left: `${cluster.pct}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {/* Avatars placed side by side with gap if clustered */}
                      <div className="flex items-center gap-1.5">
                        {cluster.chars.map((char) => {
                          const hasSpecialNote = char.isSpecial && Boolean(char.specialNote);

                          return (
                            <div
                              key={char.id}
                              className="relative cursor-pointer hover:scale-110 transition-transform"
                              onClick={() => onEditCharacter && onEditCharacter(char)}
                              title={`${char.name}${
                                hasSpecialNote ? ` [特例: ${char.specialNote}]` : ''
                              }`}
                            >
                              {/* Separated ✦ mark floating above the avatar */}
                              {char.isSpecial && (
                                <span className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                  <SparkleIcon
                                    color={char.color}
                                    size={12}
                                    withBorder={false}
                                  />
                                </span>
                              )}

                              <CharacterAvatar character={char} size="sm" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Label: 受け */}
            <span
              className="w-8 sm:w-10 text-left shrink-0 text-xs sm:text-sm font-bold truncate"
              style={{ color: scheme.textSecondary }}
            >
              {defaultRight}
            </span>

            {/* Symmetrical Right Spacer to ensure Track is centered with items */}
            <div className="w-14 sm:w-20 shrink-0" aria-hidden="true" />
          </div>
        </div>

        {/* Hairline Separator */}
        <div
          className="border-t"
          style={{ borderColor: scheme.borderSubtle }}
        />

        {/* 2. INDIVIDUAL ITEM AXES (各項目) */}
        <div className="space-y-3 pt-1">
          {project.axes.map((axis) => {
            const leftTxt = axis.leftLabel || '攻め';
            const rightTxt = axis.rightLabel || '受け';

            // Group characters by stage level (1..5)
            const grouped: Record<StageLevel, Character[]> = {
              1: [],
              2: [],
              3: [],
              4: [],
              5: [],
            };

            standardCharacters.forEach((char) => {
              const lvl = (char.scores[axis.id] ?? 3) as StageLevel;
              grouped[lvl].push(char);
            });

            return (
              <div
                key={axis.id}
                className="flex items-center gap-2 sm:gap-3 py-2 sm:py-2.5 group"
              >
                {/* Axis Name */}
                <div className="w-14 sm:w-20 shrink-0 text-right">
                  <span
                    className="font-medium text-[10px] sm:text-[11px] truncate block leading-tight"
                    style={{ color: scheme.textSecondary }}
                    title={axis.name}
                  >
                    {axis.name}
                  </span>
                  {axis.includeInOverall === false && (
                    <span
                      className="text-[8px] sm:text-[9px] block leading-tight"
                      style={{ color: scheme.textMuted }}
                      title="総合軸の計算には含まれません"
                    >
                      （総合外）
                    </span>
                  )}
                </div>

                {/* Left Label for this axis */}
                <span
                  className="text-[10px] sm:text-xs w-8 sm:w-10 text-right shrink-0 truncate font-medium"
                  style={{ color: scheme.textSecondary }}
                >
                  {leftTxt}
                </span>

                {/* Slim Track Container with perfect alignment */}
                <div className="flex-1 px-4 sm:px-6">
                  <div className="relative w-full h-6 flex items-center">
                    {/* Slim Bar Track */}
                    <div
                      className="absolute inset-y-0 my-auto -inset-x-1 h-1 rounded-full pointer-events-none"
                      style={{ backgroundColor: scheme.trackBg }}
                    />

                    {/* 5 Tick dots: ・ ・ ・ ・ ・ */}
                    {stages.map((lvl) => (
                      <div
                        key={lvl}
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-10"
                        style={{ left: `${stageToPercent(lvl)}%` }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: scheme.dotBg }}
                        />
                      </div>
                    ))}

                    {/* Character markers: Color-Only Small Beads with gap */}
                    {stages.map((lvl) => {
                      const charsAtStage = grouped[lvl];
                      if (charsAtStage.length === 0) return null;
                      const pct = stageToPercent(lvl);

                      return (
                        <div
                          key={lvl}
                          className="absolute top-1/2 flex items-center gap-1 z-20"
                          style={{
                            left: `${pct}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          {charsAtStage.map((char) => {
                            const isCharSpecialForAxis =
                              char.isSpecial && Boolean(char.specialAxes?.includes(axis.id));

                            return (
                              <div
                                key={char.id}
                                className="relative cursor-pointer hover:scale-125 transition-transform"
                                onClick={() => onEditCharacter && onEditCharacter(char)}
                                title={`${char.name}: ${axis.name}`}
                              >
                                {/* Floating ✦ mark placed above the bead with matching character color */}
                                {isCharSpecialForAxis && (
                                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                    <SparkleIcon
                                      color={char.color}
                                      size={11}
                                      withBorder={false}
                                    />
                                  </div>
                                )}
                                {/* Color-only bead/dot */}
                                <div
                                  className="w-3.5 h-3.5 rounded-full shadow-xs"
                                  style={{
                                    backgroundColor: char.color,
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Label for this axis */}
                <span
                  className="text-[10px] sm:text-xs w-8 sm:w-10 text-left shrink-0 truncate font-medium"
                  style={{ color: scheme.textSecondary }}
                >
                  {rightTxt}
                </span>

                {/* Symmetrical Right Spacer to ensure Track is centered */}
                <div className="w-14 sm:w-20 shrink-0" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </div>

      {/* SPECIAL EXCEPTIONS BOTTOM SECTION */}
      {!hideSpecialSection && specialCharacters.length > 0 && (
        <div
          className="mt-6 pt-3.5 border-t"
          style={{ borderColor: scheme.borderSubtle }}
        >
          <div
            className="flex items-center gap-1.5 mb-2 text-xs font-bold select-none"
            style={{ color: scheme.textPrimary }}
          >
            <SparkleIcon color={scheme.textPrimary} size={12} withBorder={false} />
            <span>特例</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {specialCharacters.map((char) => (
              <div
                key={char.id}
                onClick={() => onEditCharacter && onEditCharacter(char)}
                className="p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-colors"
                style={{
                  backgroundColor: scheme.subtleBg,
                  borderColor: scheme.borderSubtle,
                }}
                title="クリックして編集"
              >
                <CharacterAvatar character={char} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="font-bold text-xs"
                      style={{ color: scheme.textPrimary }}
                    >
                      {char.name}
                    </span>
                    {char.excludeFromStandardMap && (
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium border"
                        style={{
                          backgroundColor: scheme.cardBg,
                          borderColor: scheme.borderSubtle,
                          color: scheme.textMuted,
                        }}
                      >
                        特例枠のみ
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[11px] mt-0.5 leading-tight"
                    style={{ color: scheme.textSecondary }}
                  >
                    {char.specialNote || '（特例メモ未記入）'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
