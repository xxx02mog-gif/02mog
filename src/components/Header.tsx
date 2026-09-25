import React from 'react';
import { ViewMode, ThemeMode } from '../types';
import { ColorScheme } from '../utils/theme';
import { Plus, Download, Settings } from 'lucide-react';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  themeMode: ThemeMode;
  colorScheme?: ColorScheme;
  onOpenSettings: () => void;
  onOpenAddCharacter: () => void;
  onOpenExportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  themeMode,
  colorScheme,
  onOpenSettings,
  onOpenAddCharacter,
  onOpenExportModal,
}) => {
  const isDark = colorScheme ? colorScheme.isDark : themeMode === 'dark';

  return (
    <header
      className="w-full border-b backdrop-blur-md sticky top-0 z-40 transition-colors"
      style={{
        backgroundColor: colorScheme ? `${colorScheme.pageBg}ee` : undefined,
        borderColor: colorScheme ? colorScheme.borderColor : undefined,
        color: colorScheme ? colorScheme.textPrimary : undefined,
      }}
    >
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2">
        {/* Title Wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/"
            className="text-sm sm:text-base font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <span className="hidden sm:inline">SEME &amp; UKE POSITION MAP</span>
            <span className="sm:hidden">SEME &amp; UKE MAP</span>
          </a>
        </div>

        {/* View Switcher Tabs */}
        <div
          className="flex items-center p-0.5 sm:p-1 rounded-lg border transition-colors"
          style={{
            backgroundColor: colorScheme ? colorScheme.cardBg : undefined,
            borderColor: colorScheme ? colorScheme.borderSubtle : undefined,
          }}
        >
          {(['diagram', 'table', 'combined'] as ViewMode[]).map((mode) => {
            const isActive = viewMode === mode;
            const label = mode === 'diagram' ? '図' : mode === 'table' ? '個別' : '両方';
            const hideCombined = mode === 'combined' ? 'hidden md:inline-block' : '';

            return (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors ${hideCombined}`}
                style={{
                  backgroundColor: isActive
                    ? colorScheme
                      ? colorScheme.isDark
                        ? colorScheme.borderColor
                        : '#ffffff'
                      : undefined
                    : 'transparent',
                  color: isActive
                    ? colorScheme
                      ? colorScheme.textPrimary
                      : undefined
                    : colorScheme
                    ? colorScheme.textMuted
                    : undefined,
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.08)' : undefined,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5"
            style={{
              backgroundColor: colorScheme ? colorScheme.cardBg : undefined,
              borderColor: colorScheme ? colorScheme.borderColor : undefined,
              color: colorScheme ? colorScheme.textPrimary : undefined,
            }}
            title="設定（タイトル・カラーテーマ・軸・データ保存）"
          >
            <Settings
              className="w-3.5 h-3.5"
              style={{ color: colorScheme ? colorScheme.textPrimary : undefined }}
            />
            <span className="hidden sm:inline">設定</span>
          </button>

          {/* Add Character */}
          <button
            type="button"
            onClick={onOpenAddCharacter}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1"
            style={{
              backgroundColor: colorScheme ? colorScheme.cardBg : undefined,
              borderColor: colorScheme ? colorScheme.borderColor : undefined,
              color: colorScheme ? colorScheme.textPrimary : undefined,
            }}
          >
            <Plus
              className="w-3.5 h-3.5"
              style={{ color: colorScheme ? colorScheme.textPrimary : undefined }}
            />
            <span className="hidden xs:inline sm:inline">キャラ追加</span>
          </button>

          {/* Image Export */}
          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-sm"
            style={{
              backgroundColor: colorScheme ? colorScheme.accent : '#18181b',
              color: colorScheme ? colorScheme.accentText : '#ffffff',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">画像出力</span>
            <span className="sm:hidden">出力</span>
          </button>
        </div>
      </div>
    </header>
  );
};
