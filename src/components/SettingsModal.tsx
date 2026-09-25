import React, { useState, useRef } from 'react';
import { AxisDefinition, MapProject, ThemeMode } from '../types';
import {
  THEME_PRESETS,
  generateColorScheme,
  adjustLightness,
} from '../utils/theme';
import {
  X,
  Plus,
  Trash2,
  Check,
  Download,
  Upload,
  RotateCcw,
  SlidersHorizontal,
  FileJson,
  AlertTriangle,
  Palette,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  GripVertical,
  HelpCircle,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MapProject;
  onUpdateProject: (updated: Partial<MapProject>) => void;
  onImportProject: (imported: MapProject) => void;
  onResetToDefault: () => void;
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateProject,
  onImportProject,
  onResetToDefault,
  onClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for editing
  const [title, setTitle] = useState(project.title);
  const [creator, setCreator] = useState(project.creator);
  const [themeMode, setThemeMode] = useState<ThemeMode>(project.themeMode);
  const [baseColor, setBaseColor] = useState<string>(
    project.baseColor || (project.themeMode === 'light' ? '#f4f4f5' : '#121214')
  );
  const [cardColor, setCardColor] = useState<string>(
    project.cardColor || (project.themeMode === 'light' ? '#ffffff' : '#18181b')
  );
  const [axes, setAxes] = useState<AxisDefinition[]>(project.axes);

  // New axis inputs
  const [newAxisName, setNewAxisName] = useState('');
  const [newLeftLabel, setNewLeftLabel] = useState('攻め');
  const [newRightLabel, setNewRightLabel] = useState('受け');
  const [newIncludeInOverall, setNewIncludeInOverall] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Confirmation states (in-app, no window.confirm)
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Calculate live preview color scheme from [baseColor] and [cardColor]
  const previewScheme = generateColorScheme(baseColor, cardColor);
  const isDark = previewScheme.isDark;

  React.useEffect(() => {
    setTitle(project.title);
    setCreator(project.creator);
    setThemeMode(project.themeMode);
    setBaseColor(
      project.baseColor || (project.themeMode === 'light' ? '#f4f4f5' : '#121214')
    );
    setCardColor(
      project.cardColor || (project.themeMode === 'light' ? '#ffffff' : '#18181b')
    );
    setAxes(project.axes);
    setConfirmReset(false);
    setConfirmClear(false);
  }, [project, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetId: 'dark' | 'light') => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setBaseColor(preset.baseColor);
    setCardColor(preset.cardColor);
    setThemeMode(presetId);
  };

  const handleAddAxis = (name?: string, left?: string, right?: string) => {
    const finalName = (name || newAxisName).trim();
    if (!finalName) return;

    const newAxis: AxisDefinition = {
      id: `axis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      leftLabel: (left || newLeftLabel || '攻め').trim(),
      rightLabel: (right || newRightLabel || '受け').trim(),
      isSystem: false,
      includeInOverall: newIncludeInOverall,
    };

    setAxes((prev) => [...prev, newAxis]);
    setNewAxisName('');
    setNewLeftLabel('攻め');
    setNewRightLabel('受け');
    setNewIncludeInOverall(true);
  };

  const handleUpdateAxis = (
    id: string,
    field: keyof AxisDefinition,
    value: any
  ) => {
    setAxes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleDeleteAxis = (id: string) => {
    if (axes.length <= 1) {
      alert('評価軸は最低1つ必要です');
      return;
    }
    setAxes((prev) => prev.filter((a) => a.id !== id));
  };

  const handleMoveAxis = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= axes.length) return;
    const newAxes = [...axes];
    const [moved] = newAxes.splice(index, 1);
    newAxes.splice(targetIndex, 0, moved);
    setAxes(newAxes);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      return;
    }
    const newAxes = [...axes];
    const [moved] = newAxes.splice(draggedIndex, 1);
    newAxes.splice(index, 0, moved);
    setAxes(newAxes);
    setDraggedIndex(null);
  };

  const handleSaveAll = () => {
    const updatedDark = previewScheme.isDark;
    onUpdateProject({
      title: title.trim() || '攻め受け分類',
      creator: creator.trim(),
      themeMode: updatedDark ? 'dark' : 'light',
      baseColor,
      cardColor,
      axes,
      updatedAt: '',
    });
    onClose();
  };

  const handleExportJson = () => {
    const jsonString = JSON.stringify(
      {
        ...project,
        title,
        creator,
        themeMode: previewScheme.isDark ? 'dark' : 'light',
        baseColor,
        cardColor,
        axes,
      },
      null,
      2
    );
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = (title || 'CP_Spectrum')
      .replace(/[^\w\s\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\-]/g, '_')
      .trim();
    a.href = url;
    a.download = `${safeTitle}_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text !== 'string') return;
        const parsed = JSON.parse(text) as MapProject;

        if (!parsed.characters || !parsed.axes) {
          throw new Error('無効なデータ形式です。');
        }

        onImportProject(parsed);
        setStatusMsg('データを復元しました');
        setTimeout(() => {
          setStatusMsg('');
          onClose();
        }, 1000);
      } catch (err: any) {
        alert(`インポートに失敗しました: ${err?.message || 'JSONファイルを確認してください'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-lg my-6 rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
        style={{
          backgroundColor: isDark ? '#141416' : '#ffffff',
          borderColor: isDark ? '#27272a' : '#e4e4e7',
          color: isDark ? '#fafafa' : '#18181b',
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0 transition-colors"
          style={{
            borderColor: isDark ? '#27272a' : '#f4f4f5',
            backgroundColor: isDark ? '#0e0e10' : '#fafafa',
          }}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              className="w-4 h-4"
              style={{ color: previewScheme.accent }}
            />
            <h3 className="text-base font-bold">設定</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded transition-colors hover:opacity-70"
            style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-5 sm:space-y-6 overflow-y-auto text-xs flex-1">
          {statusMsg && (
            <div
              className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                isDark
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Section 1: シート基本情報 */}
          <div className="space-y-3">
            <span
              className="font-bold block text-sm pb-1 border-b"
              style={{
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                color: isDark ? '#fafafa' : '#18181b',
              }}
            >
              基本設定
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-[11px] font-semibold mb-1"
                  style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                >
                  タイトル
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="攻め受け分類"
                  className="w-full px-3 py-1.5 rounded border focus:outline-hidden text-xs font-bold transition-colors"
                  style={{
                    backgroundColor: isDark ? '#09090b' : '#fafafa',
                    borderColor: isDark ? '#27272a' : '#d4d4d8',
                    color: isDark ? '#fafafa' : '#18181b',
                  }}
                />
              </div>

              <div>
                <label
                  className="block text-[11px] font-semibold mb-1"
                  style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                >
                  作成者 / ID
                </label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  placeholder="未設定（お名前やIDを自由に入力）"
                  className="w-full px-3 py-1.5 rounded border focus:outline-hidden text-xs transition-colors"
                  style={{
                    backgroundColor: isDark ? '#09090b' : '#fafafa',
                    borderColor: isDark ? '#27272a' : '#d4d4d8',
                    color: isDark ? '#fafafa' : '#18181b',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: カラーテーマ */}
          <div className="space-y-2">
            <span
              className="font-bold block text-sm pb-1 border-b"
              style={{
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                color: isDark ? '#fafafa' : '#18181b',
              }}
            >
              カラーテーマ
            </span>

            <div className="grid grid-cols-2 gap-2.5 pt-0.5">
              <button
                type="button"
                onClick={() => handleApplyPreset('dark')}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'ring-2 ring-zinc-400 dark:ring-zinc-500 shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: '#121214',
                  borderColor: themeMode === 'dark' ? previewScheme.accent : '#27272a',
                  color: '#ffffff',
                }}
              >
                ダーク
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('light')}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'ring-2 ring-zinc-400 dark:ring-zinc-500 shadow-sm'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: '#ffffff',
                  borderColor: themeMode === 'light' ? previewScheme.accent : '#d4d4d8',
                  color: '#18181b',
                }}
              >
                ライト
              </button>
            </div>
          </div>

          {/* Section 3: 評価軸のカスタマイズ */}
          <div className="space-y-3">
            <span
              className="font-bold block text-sm pb-1 border-b"
              style={{
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                color: isDark ? '#fafafa' : '#18181b',
              }}
            >
              評価軸の管理 ({axes.length})
            </span>

            {/* Existing axes */}
            <div className="space-y-2">
              {axes.map((axis, index) => (
                <div
                  key={axis.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`p-2.5 rounded-lg border space-y-2 transition-all ${
                    draggedIndex === index ? 'opacity-40 border-dashed border-indigo-400' : ''
                  }`}
                  style={{
                    backgroundColor: isDark ? '#09090b' : '#fafafa',
                    borderColor: draggedIndex === index ? undefined : isDark ? '#27272a' : '#e4e4e7',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* 並び替えコントローラー（▲▼ボタン & 番号 & ドラッグアイコン） */}
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="flex flex-col -space-y-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveAxis(index, 'up')}
                          disabled={index === 0}
                          className="p-0.5 rounded transition-colors hover:bg-zinc-500/20 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          style={{ color: isDark ? '#d4d4d8' : '#52525b' }}
                          title="上へ移動"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveAxis(index, 'down')}
                          disabled={index === axes.length - 1}
                          className="p-0.5 rounded transition-colors hover:bg-zinc-500/20 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                          style={{ color: isDark ? '#d4d4d8' : '#52525b' }}
                          title="下へ移動"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span
                        className="text-[10px] font-mono w-3.5 text-center select-none"
                        style={{ color: isDark ? '#71717a' : '#a1a1aa' }}
                        title="ドラッグ＆ドロップでも並び替え可能"
                      >
                        {index + 1}
                      </span>
                      <span title="ドラッグして並び替え" className="flex items-center">
                        <GripVertical
                          className="w-3.5 h-3.5 cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity"
                          style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                        />
                      </span>
                    </div>

                    <input
                      type="text"
                      value={axis.name}
                      onChange={(e) =>
                        handleUpdateAxis(axis.id, 'name', e.target.value)
                      }
                      placeholder="軸名"
                      className="flex-1 min-w-0 px-2.5 py-1 text-xs font-bold rounded border focus:outline-hidden"
                      style={{
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#d4d4d8',
                        color: isDark ? '#fafafa' : '#18181b',
                      }}
                    />
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                      {/* 総合評価に加えるか切り替えるボタン */}
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateAxis(
                            axis.id,
                            'includeInOverall',
                            axis.includeInOverall === false ? true : false
                          )
                        }
                        className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-semibold rounded border transition-colors whitespace-nowrap cursor-pointer"
                        style={{
                          backgroundColor:
                            axis.includeInOverall !== false
                              ? previewScheme.accent
                              : isDark
                              ? '#18181b'
                              : '#f4f4f5',
                          borderColor:
                            axis.includeInOverall !== false
                              ? previewScheme.accent
                              : isDark
                              ? '#27272a'
                              : '#d4d4d8',
                          color:
                            axis.includeInOverall !== false
                              ? previewScheme.accentText
                              : isDark
                              ? '#a1a1aa'
                              : '#71717a',
                        }}
                        title={
                          axis.includeInOverall !== false
                            ? '総合軸の計算に反映中（クリックして除外）'
                            : '総合軸の計算から除外中（クリックして反映）'
                        }
                      >
                        {axis.includeInOverall !== false ? '総合: ON' : '総合: OFF'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteAxis(axis.id)}
                        className="p-1 rounded transition-colors hover:text-rose-500"
                        style={{ color: isDark ? '#71717a' : '#a1a1aa' }}
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Left and Right labels */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
                        左端:
                      </span>
                      <input
                        type="text"
                        value={axis.leftLabel ?? '攻め'}
                        onChange={(e) =>
                          handleUpdateAxis(axis.id, 'leftLabel', e.target.value)
                        }
                        placeholder="攻め"
                        className="w-full px-2 py-0.5 rounded border focus:outline-hidden font-medium"
                        style={{
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          borderColor: isDark ? '#27272a' : '#d4d4d8',
                          color: isDark ? '#fafafa' : '#18181b',
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
                        右端:
                      </span>
                      <input
                        type="text"
                        value={axis.rightLabel ?? '受け'}
                        onChange={(e) =>
                          handleUpdateAxis(axis.id, 'rightLabel', e.target.value)
                        }
                        placeholder="受け"
                        className="w-full px-2 py-0.5 rounded border focus:outline-hidden font-medium"
                        style={{
                          backgroundColor: isDark ? '#18181b' : '#ffffff',
                          borderColor: isDark ? '#27272a' : '#d4d4d8',
                          color: isDark ? '#fafafa' : '#18181b',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new axis (登録済みと表示を揃え、ゴミ箱アイコンのみ非表示にして追加ボタンを配置) */}
            <div
              className="p-2.5 rounded-lg border space-y-2 transition-colors"
              style={{
                backgroundColor: isDark ? '#09090b' : '#fafafa',
                borderColor: isDark ? '#27272a' : '#e4e4e7',
              }}
            >
              <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={newAxisName}
                  onChange={(e) => setNewAxisName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddAxis();
                  }}
                  placeholder="新しい軸名"
                  className="flex-1 min-w-0 px-2 sm:px-2.5 py-1 text-xs font-bold rounded border focus:outline-hidden"
                  style={{
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: isDark ? '#27272a' : '#d4d4d8',
                    color: isDark ? '#fafafa' : '#18181b',
                  }}
                />
                <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setNewIncludeInOverall(!newIncludeInOverall)}
                    className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] font-semibold rounded border transition-colors whitespace-nowrap cursor-pointer"
                    style={{
                      backgroundColor: newIncludeInOverall
                        ? previewScheme.accent
                        : isDark
                        ? '#18181b'
                        : '#f4f4f5',
                      borderColor: newIncludeInOverall
                        ? previewScheme.accent
                        : isDark
                        ? '#27272a'
                        : '#d4d4d8',
                      color: newIncludeInOverall
                        ? previewScheme.accentText
                        : isDark
                        ? '#a1a1aa'
                        : '#71717a',
                    }}
                    title={
                      newIncludeInOverall
                        ? '総合軸の計算に反映中（クリックして除外）'
                        : '総合軸の計算から除外中（クリックして反映）'
                    }
                  >
                    {newIncludeInOverall ? '総合: ON' : '総合: OFF'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddAxis()}
                    disabled={!newAxisName.trim()}
                    className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold rounded border flex items-center gap-0.5 sm:gap-1 transition-colors disabled:opacity-40 shrink-0 whitespace-nowrap cursor-pointer"
                    style={{
                      backgroundColor: previewScheme.accent,
                      borderColor: previewScheme.accent,
                      color: previewScheme.accentText,
                    }}
                    title="軸を追加"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>追加</span>
                  </button>
                </div>
              </div>

              {/* Left and Right labels */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
                    左端:
                  </span>
                  <input
                    type="text"
                    value={newLeftLabel}
                    onChange={(e) => setNewLeftLabel(e.target.value)}
                    placeholder="攻め"
                    className="w-full px-2 py-0.5 rounded border focus:outline-hidden font-medium"
                    style={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#d4d4d8',
                      color: isDark ? '#fafafa' : '#18181b',
                    }}
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="shrink-0" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
                    右端:
                  </span>
                  <input
                    type="text"
                    value={newRightLabel}
                    onChange={(e) => setNewRightLabel(e.target.value)}
                    placeholder="受け"
                    className="w-full px-2 py-0.5 rounded border focus:outline-hidden font-medium"
                    style={{
                      backgroundColor: isDark ? '#18181b' : '#ffffff',
                      borderColor: isDark ? '#27272a' : '#d4d4d8',
                      color: isDark ? '#fafafa' : '#18181b',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: データ保存・バックアップ */}
          <div className="space-y-3">
            <span
              className="font-bold block text-sm pb-1 border-b"
              style={{
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                color: isDark ? '#fafafa' : '#18181b',
              }}
            >
              データ管理・バックアップ
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors hover:opacity-80"
                style={{
                  backgroundColor: isDark ? '#09090b' : '#fafafa',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                }}
              >
                <div>
                  <span className="font-bold block">JSON書き出し</span>
                  <span className="text-[10px]" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
                    設定・キャラをファイル保存
                  </span>
                </div>
                <Download className="w-4 h-4 shrink-0" style={{ color: previewScheme.accent }} />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors hover:opacity-80"
                style={{
                  backgroundColor: isDark ? '#09090b' : '#fafafa',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                }}
              >
                <div>
                  <span className="font-bold block">JSON読み込み</span>
                  <span className="text-[10px]" style={{ color: isDark ? '#a1a1aa' : '#71717a' }}>
                    バックアップから復元
                  </span>
                </div>
                <Upload className="w-4 h-4 shrink-0" style={{ color: previewScheme.accent }} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Reset buttons (横並べ) */}
            <div className="space-y-2 pt-1">
              {!confirmReset && !confirmClear && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmReset(true);
                      setConfirmClear(false);
                    }}
                    className="px-2.5 py-1.5 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    style={{
                      backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                      borderColor: isDark ? '#27272a' : '#d4d4d8',
                      color: isDark ? '#d4d4d8' : '#52525b',
                    }}
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                    <span>初期サンプルに戻す</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConfirmClear(true);
                      setConfirmReset(false);
                    }}
                    className="px-2.5 py-1.5 rounded border text-[11px] flex items-center justify-center gap-1.5 transition-colors hover:text-rose-400"
                    style={{
                      backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                      borderColor: isDark ? '#27272a' : '#d4d4d8',
                      color: isDark ? '#a1a1aa' : '#71717a',
                    }}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>全キャラクリア</span>
                  </button>
                </div>
              )}

              {confirmReset && (
                <div
                  className="p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{
                    backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                    borderColor: isDark ? '#3f3f46' : '#d4d4d8',
                    color: isDark ? '#fafafa' : '#18181b',
                  }}
                >
                  <span className="text-xs font-semibold">
                    初期サンプルデータにリセットしますか？
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onResetToDefault();
                        setConfirmReset(false);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-zinc-900 bg-zinc-200 hover:bg-white dark:bg-zinc-200 dark:hover:bg-white dark:text-zinc-900 rounded transition-colors"
                    >
                      リセット実行
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="px-2 py-1 text-xs rounded border transition-colors"
                      style={{
                        borderColor: isDark ? '#3f3f46' : '#d4d4d8',
                        color: isDark ? '#d4d4d8' : '#52525b',
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              {confirmClear && (
                <div
                  className="p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{
                    backgroundColor: isDark ? '#1f1315' : '#fef2f2',
                    borderColor: '#ef4444',
                    color: isDark ? '#fee2e2' : '#991b1b',
                  }}
                >
                  <span className="text-xs font-semibold">
                    全キャラクターを削除して白紙にしますか？
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                        onClose();
                      }}
                      className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors"
                    >
                      全削除実行
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 text-xs rounded border transition-colors"
                      style={{
                        borderColor: isDark ? '#44403c' : '#d4d4d8',
                        color: isDark ? '#d6d3d1' : '#52525b',
                      }}
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible Usage Guide (下部に配置・「使い方」) */}
          <details
            className="group rounded-lg border overflow-hidden transition-colors"
            style={{
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              backgroundColor: isDark ? '#18181b' : '#f9fafb',
            }}
          >
            <summary
              className="flex items-center justify-between p-3 cursor-pointer list-none font-bold text-xs select-none hover:opacity-80 transition-opacity"
              style={{ color: isDark ? '#f4f4f5' : '#18181b' }}
            >
              <div className="flex items-center gap-2">
                <HelpCircle
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: previewScheme.accent }}
                />
                <span>使い方</span>
              </div>
              <ChevronDown
                className="w-4 h-4 shrink-0 transition-transform duration-200 group-open:rotate-180"
                style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
              />
            </summary>
            <div
              className="px-3.5 pb-3.5 pt-2 border-t text-[11px] leading-relaxed space-y-2"
              style={{
                borderColor: isDark ? '#27272a' : '#e4e4e7',
                color: isDark ? '#d4d4d8' : '#3f3f46',
              }}
            >
              <div className="space-y-1.5">
                <p>
                  <strong className="font-semibold" style={{ color: isDark ? '#fafafa' : '#18181b' }}>① キャラの登録：</strong>
                  右上「＋キャラ追加」から名前・カラー・各項目の攻め受け位置（5段階）を設定します。
                </p>
                <p>
                  <strong className="font-semibold" style={{ color: isDark ? '#fafafa' : '#18181b' }}>② 表示の切り替え：</strong>
                  上部タブで全体マップと個別表示を切り替えられます。
                </p>
                <p>
                  <strong className="font-semibold" style={{ color: isDark ? '#fafafa' : '#18181b' }}>③ 特例の記録：</strong>
                  特例をONにして、✦マークやメモを付けられます。
                </p>
                <p>
                  <strong className="font-semibold" style={{ color: isDark ? '#fafafa' : '#18181b' }}>④ 項目の変更：</strong>
                  この設定画面内の「評価軸」から、自認・他認以外の項目を追加・変更できます。
                </p>
                <p>
                  <strong className="font-semibold" style={{ color: isDark ? '#fafafa' : '#18181b' }}>⑤ 画像の保存：</strong>
                  右上の「画像出力」からPNG画像のダウンロードやクリップボードへのコピーができます。
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* Modal Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t shrink-0 transition-colors"
          style={{
            borderColor: isDark ? '#27272a' : '#f4f4f5',
            backgroundColor: isDark ? '#0e0e10' : '#fafafa',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-1.5 text-xs font-bold rounded-md flex items-center gap-1 shadow-sm transition-colors"
            style={{
              backgroundColor: previewScheme.accent,
              color: previewScheme.accentText,
            }}
          >
            <Check className="w-3.5 h-3.5" />
            保存して適用
          </button>
        </div>
      </div>
    </div>
  );
};
