import React, { useRef, useState } from 'react';
import { MapProject } from '../types';
import { DEFAULT_PROJECT } from '../data/defaultData';
import { X, Download, Upload, RotateCcw, FileJson, Check, AlertTriangle } from 'lucide-react';

interface DataBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MapProject;
  onImportProject: (imported: MapProject) => void;
  onResetToDefault: () => void;
  onClearAll: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  isOpen,
  onClose,
  project,
  onImportProject,
  onResetToDefault,
  onClearAll,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleExportJson = () => {
    const jsonString = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = (project.title || 'CP_Spectrum_Backup')
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
          throw new Error('無効なデータ形式です。characters と axes が必要です。');
        }

        onImportProject(parsed);
        setImportStatus('インポートが成功しました！');
        setTimeout(() => {
          setImportStatus('');
          onClose();
        }, 1200);
      } catch (err: any) {
        alert(`インポートに失敗しました: ${err?.message || 'JSONファイルを確認してください'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-zinc-300" />
            <h3 className="text-lg font-bold">データ管理・バックアップ</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {importStatus && (
            <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Export JSON */}
          <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-zinc-200 text-sm block">
                JSON形式でエクスポート
              </span>
              <p className="text-zinc-400 mt-0.5">
                現在のキャラクター設定・評価軸をファイルに書き出してバックアップします
              </p>
            </div>
            <button
              type="button"
              onClick={handleExportJson}
              className="px-4 py-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              ダウンロード
            </button>
          </div>

          {/* Import JSON */}
          <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4">
            <div>
              <span className="font-bold text-zinc-200 text-sm block">
                JSONファイルから復元
              </span>
              <p className="text-zinc-400 mt-0.5">
                過去に書き出したJSONバックアップを読み込みます
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-white rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Upload className="w-4 h-4" />
              ファイルを選択
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Reset options */}
          <div className="pt-2 border-t border-zinc-800 space-y-2">
            <span className="font-bold text-zinc-300 block">データ初期化オプション</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('初期サンプルデータ（4名）にリセットしますか？')) {
                    onResetToDefault();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                初期サンプルに戻す
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('全キャラクターを削除して白紙のシートにしますか？')) {
                    onClearAll();
                    onClose();
                  }
                }}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-rose-950/50 border border-zinc-700 hover:border-rose-800 text-zinc-400 hover:text-rose-300 transition-colors flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                全キャラクリア（白紙）
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/40 text-right">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
