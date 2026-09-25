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
      className={`rounded-xl border transition-colors duration-200 shadow-md ${
        isExportView ? 'w-[800px] p-6' : 'w-full p-3.5 sm:p-6'
      }`}
      style={{
        backgroundColor: scheme.cardBg,
        borderColor: scheme.borderColor,
        color: scheme.textPrimary,
        minWidth: isExportView ? '800px' : 'auto',
      }}
    >
      {/* Title Header */}
      <div
        className="pb-3 border-b flex flex-wrap items-end justify-between gap-2"
        style={{ borderColor: scheme.borderSubtle }}
      >
        <div className="min-w-0">
          <h2
            className={`font-bold tracking-tight ${
              isExportView ? 'text-xl' : 'text-lg sm:text-xl'
            }`}
          >
            {project.title || '攻め受け分類'}
          </h2>
        </div>

        {project.creator && (
          <div
            className="flex items-center text-xs shrink-0 pb-0.5"
            style={{ color: scheme.textMuted }}
          >
            <span className="font-medium">
              {project.creator}
            </span>
          </div>
        )}
      </div>

      {/* SPECTRUM CONTAINER */}
      <div className={`mt-4 ${isExportView ? 'space-y-6' : 'space-y-3 sm:space-y-6'}`}>
        {/* 1. TOP MAIN OVERALL SPECTRUM (総合軸) */}
        <div className="pt-3 sm:pt-4 pb-2">
          {/* Desktop & Image Export View */}
          <div className={`${isExportView ? 'flex' : 'hidden sm:flex'} items-center gap-3`}>
            {/* Axis Name Column: 総合 */}
            <div className="w-20 shrink-0 text-right">
              <span
                className="font-bold truncate block leading-tight text-sm"
                style={{ color: scheme.textPrimary }}
              >
                総合
              </span>
            </div>

            {/* Left Label: 攻め */}
            <span
              className="w-10 text-sm text-right shrink-0 font-bold truncate"
              style={{ color: scheme.textSecondary }}
            >
              {defaultLeft}
            </span>

            {/* Main Spectrum Track Area */}
            <div className="flex-1 px-6">
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
                {clusteredOverall.map((cluster, cIdx) => (
                  <div
                    key={`cluster-desk-${cIdx}`}
                    className="absolute top-1/2 flex items-center z-20"
                    style={{
                      left: `${cluster.pct}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
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
                            {char.isSpecial && (
                              <span className="absolute bottom-full mb-0.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                <SparkleIcon
                                  color={char.color}
                                  size={11}
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
                ))}
              </div>
            </div>

            {/* Right Label: 受け */}
            <span
              className="w-10 text-sm text-left shrink-0 font-bold truncate"
              style={{ color: scheme.textSecondary }}
            >
              {defaultRight}
            </span>

            {/* Symmetrical Right Spacer to ensure Track is centered with items */}
            <div className="w-20 shrink-0" aria-hidden="true" />
          </div>

          {/* Mobile Screen View: 完全対称・余白最小化レイアウト */}
          {!isExportView && (
            <div className="sm:hidden space-y-1 pb-1">
              <div className="px-0.5 flex items-center justify-between">
                <span
                  className="font-bold text-xs"
                  style={{ color: scheme.textPrimary }}
                >
                  総合
                </span>
              </div>

              <div className="flex items-center gap-2 pt-3 pb-1">
                {/* Left Label: 攻め */}
                <span
                  className="text-xs font-bold shrink-0 text-right min-w-[28px] truncate"
                  style={{ color: scheme.textSecondary }}
                >
                  {defaultLeft}
                </span>

                {/* Main Spectrum Track Area */}
                <div className="flex-1 px-1">
                  <div className="relative w-full h-8 flex items-center">
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
                    {clusteredOverall.map((cluster, cIdx) => (
                      <div
                        key={`cluster-mob-${cIdx}`}
                        className="absolute top-1/2 flex items-center z-20"
                        style={{
                          left: `${cluster.pct}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="flex items-center gap-1">
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
                                {char.isSpecial && (
                                  <span className="absolute bottom-full mb-0.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                    <SparkleIcon
                                      color={char.color}
                                      size={11}
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
                    ))}
                  </div>
                </div>

                {/* Right Label: 受け */}
                <span
                  className="text-xs font-bold shrink-0 text-left min-w-[28px] truncate"
                  style={{ color: scheme.textSecondary }}
                >
                  {defaultRight}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Hairline Separator */}
        <div
          className="border-t"
          style={{ borderColor: scheme.borderSubtle }}
        />

        {/* 2. INDIVIDUAL ITEM AXES (各項目) */}
        <div className="space-y-2.5 sm:space-y-3 pt-1">
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
              <React.Fragment key={axis.id}>
                {/* Desktop & Image Export View */}
                <div
                  className={`${isExportView ? 'flex' : 'hidden sm:flex'} items-center gap-3 py-3 group`}
                >
                  {/* Axis Name */}
                  <div className="w-20 shrink-0 text-right">
                    <span
                      className="font-medium truncate block leading-tight text-[11px]"
                      style={{ color: scheme.textSecondary }}
                      title={axis.name}
                    >
                      {axis.name}
                    </span>
                    {axis.includeInOverall === false && (
                      <span
                        className="block leading-tight text-[9px]"
                        style={{ color: scheme.textMuted }}
                        title="総合軸の計算には含まれません"
                      >
                        （総合外）
                      </span>
                    )}
                  </div>

                  {/* Left Label for this axis */}
                  <span
                    className="w-10 text-xs text-right shrink-0 truncate font-medium"
                    style={{ color: scheme.textSecondary }}
                  >
                    {leftTxt}
                  </span>

                  {/* Slim Track Container with perfect alignment */}
                  <div className="flex-1 px-6">
                    <div className="relative w-full h-7 flex items-center">
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
                                  {isCharSpecialForAxis && (
                                    <div className="absolute bottom-full mb-0.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                      <SparkleIcon
                                        color={char.color}
                                        size={10}
                                        withBorder={false}
                                      />
                                    </div>
                                  )}
                                  <div
                                    className="w-3.5 h-3.5 rounded-full"
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
                    className="w-10 text-xs text-left shrink-0 truncate font-medium"
                    style={{ color: scheme.textSecondary }}
                  >
                    {rightTxt}
                  </span>

                  {/* Symmetrical Right Spacer to ensure Track is centered */}
                  <div className="w-20 shrink-0" aria-hidden="true" />
                </div>

                {/* Mobile Screen View: 完全対称・余白最小化レイアウト */}
                {!isExportView && (
                  <div className="sm:hidden space-y-1.5 py-1">
                    <div className="px-0.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="font-semibold text-xs leading-tight"
                          style={{ color: scheme.textPrimary }}
                        >
                          {axis.name}
                        </span>
                        {axis.includeInOverall === false && (
                          <span
                            className="text-[10px] leading-tight"
                            style={{ color: scheme.textMuted }}
                          >
                            （総合外）
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2.5 pb-1">
                      {/* Left Label */}
                      <span
                        className="text-[11px] font-medium shrink-0 text-right min-w-[28px] truncate"
                        style={{ color: scheme.textSecondary }}
                      >
                        {leftTxt}
                      </span>

                      {/* Slim Track Container */}
                      <div className="flex-1 px-1">
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

                          {/* Character markers */}
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
                                      {isCharSpecialForAxis && (
                                        <div className="absolute bottom-full mb-0.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex items-center justify-center">
                                          <SparkleIcon
                                            color={char.color}
                                            size={10}
                                            withBorder={false}
                                          />
                                        </div>
                                      )}
                                      <div
                                        className="w-3.5 h-3.5 rounded-full"
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

                      {/* Right Label */}
                      <span
                        className="text-[11px] font-medium shrink-0 text-left min-w-[28px] truncate"
                        style={{ color: scheme.textSecondary }}
                      >
                        {rightTxt}
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
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
