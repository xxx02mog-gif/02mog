import React, { useState } from 'react';
import { toPng, toBlob } from 'html-to-image';
import { MapProject, ViewMode } from '../types';
import { ColorScheme, generateColorScheme } from '../utils/theme';
import { SpectrumMap } from './SpectrumMap';
import { MatrixTable } from './MatrixTable';
import { X, Download, Copy, Check, Image as ImageIcon, Loader2, Share2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MapProject;
  colorScheme?: ColorScheme;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  colorScheme: passedScheme,
}) => {
  const scheme =
    passedScheme ||
    generateColorScheme(
      project.baseColor || (project.themeMode === 'light' ? '#f4f4f5' : '#121214'),
      project.cardColor || (project.themeMode === 'light' ? '#ffffff' : '#18181b')
    );
  const isDark = scheme.isDark;

  const [exportMode, setExportMode] = useState<ViewMode>('diagram');
  const [scale, setScale] = useState<number>(2);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  if (!isOpen) return null;

  const getExportElement = (): HTMLElement | null => {
    return document.getElementById('export-container-target');
  };

  const canShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof File !== 'undefined';

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const handleDownloadImage = async () => {
    const node = getExportElement();
    if (!node) {
      alert('書き出し要素が見つかりませんでした');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('PNG画像を生成中...');

    try {
      await new Promise((r) => setTimeout(r, 120));

      const blob = await toBlob(node, {
        pixelRatio: scale,
        cacheBust: true,
        backgroundColor: scheme.pageBg,
      });

      if (!blob) throw new Error('画像の生成に失敗しました');

      const safeTitle = (project.title || 'CP_Spectrum')
        .replace(/[^\w\s\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\-]/g, '_')
        .trim();
      const filename = `${safeTitle}_${Date.now()}.png`;

      // スマホ端末でWeb Shareが利用可能な場合は、直接写真アプリへ保存できる共有シートを開く
      if (isMobile && canShare) {
        const file = new File([blob], filename, { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: project.title || '攻め受け分類',
            });
            setStatusMessage('保存完了');
            setTimeout(() => setStatusMessage(''), 2000);
            return;
          } catch (shareErr: any) {
            if (shareErr.name === 'AbortError') {
              // ユーザーが共有シートをキャンセルした場合
              return;
            }
          }
        }
      }

      // PC環境またはWeb Share非対応ブラウザでは直接Blobダウンロード
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      setStatusMessage('ダウンロード完了');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err) {
      console.error('Export failed:', err);
      alert('画像の生成に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShareImage = async () => {
    const node = getExportElement();
    if (!node) return;

    setIsProcessing(true);
    setStatusMessage('画像を準備中...');

    try {
      await new Promise((r) => setTimeout(r, 120));

      const blob = await toBlob(node, {
        pixelRatio: scale,
        cacheBust: true,
        backgroundColor: scheme.pageBg,
      });

      if (!blob) throw new Error('画像の生成に失敗しました');

      const safeTitle = (project.title || 'CP_Spectrum')
        .replace(/[^\w\s\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\-]/g, '_')
        .trim();
      const filename = `${safeTitle}_${Date.now()}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: project.title || '攻め受け分類',
        });
        setStatusMessage('共有完了');
        setTimeout(() => setStatusMessage(''), 2000);
      } else {
        // Fallback: download blob
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = filename;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
        setStatusMessage('ダウンロード完了');
        setTimeout(() => setStatusMessage(''), 2000);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
        alert('共有に失敗しました');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    const node = getExportElement();
    if (!node) return;

    if (!navigator.clipboard || !window.ClipboardItem) {
      alert('クリップボードへの画像コピー非対応ブラウザです。ダウンロードをご利用ください。');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('画像をクリップボードに準備中...');

    try {
      await new Promise((r) => setTimeout(r, 120));
      const blob = await toBlob(node, {
        pixelRatio: scale,
        cacheBust: true,
        backgroundColor: scheme.pageBg,
      });

      if (!blob) throw new Error('Blob conversion failed');

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);

      setCopiedSuccess(true);
      setStatusMessage('コピーしました！');
      setTimeout(() => {
        setCopiedSuccess(false);
        setStatusMessage('');
      }, 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      alert('クリップボードへのコピーに失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-4xl my-6 rounded-xl border shadow-2xl flex flex-col max-h-[90vh] transition-colors"
        style={{
          backgroundColor: isDark ? '#141416' : '#ffffff',
          borderColor: isDark ? '#27272a' : '#e4e4e7',
          color: isDark ? '#fafafa' : '#18181b',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b shrink-0 transition-colors"
          style={{
            borderColor: isDark ? '#27272a' : '#f4f4f5',
            backgroundColor: isDark ? '#0e0e10' : '#fafafa',
          }}
        >
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" style={{ color: scheme.accent }} />
            <h3 className="text-base font-bold">画像エクスポート</h3>
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

        {/* Toolbar */}
        <div
          className="px-5 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0"
          style={{
            borderColor: isDark ? '#27272a' : '#f4f4f5',
            backgroundColor: isDark ? '#0e0e10' : '#fafafa',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="font-semibold"
              style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
            >
              形式:
            </span>
            <div
              className="inline-flex p-0.5 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                borderColor: isDark ? '#27272a' : '#e4e4e7',
              }}
            >
              {(['diagram', 'table', 'combined'] as ViewMode[]).map((mode) => {
                const isActive = exportMode === mode;
                const label = mode === 'diagram' ? '図' : mode === 'table' ? '個別' : '両方';
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setExportMode(mode)}
                    className="px-3 py-1 rounded-md font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? scheme.accent : 'transparent',
                      color: isActive ? scheme.accentText : isDark ? '#a1a1aa' : '#71717a',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="font-semibold"
              style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
            >
              倍率:
            </span>
            <div
              className="inline-flex p-0.5 rounded-lg border"
              style={{
                backgroundColor: isDark ? '#18181b' : '#f4f4f5',
                borderColor: isDark ? '#27272a' : '#e4e4e7',
              }}
            >
              {[2, 3].map((s) => {
                const isActive = scale === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className="px-2.5 py-0.5 rounded-md font-medium transition-colors"
                    style={{
                      backgroundColor: isActive ? scheme.accent : 'transparent',
                      color: isActive ? scheme.accentText : isDark ? '#a1a1aa' : '#71717a',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  >
                    {s}x {s === 2 ? '(標準)' : '(高画質)'}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Export Preview */}
        <div
          className="flex-1 p-4 sm:p-6 overflow-auto"
          style={{ backgroundColor: isDark ? '#09090b' : '#e4e4e7' }}
        >
          <div className="w-fit mx-auto min-w-full flex justify-center">
            <div
              id="export-container-target"
              className="p-4 sm:p-6 rounded-xl transition-colors shrink-0 shadow-xl"
              style={{
                backgroundColor: scheme.pageBg,
                color: scheme.textPrimary,
                minWidth: '680px',
                width: 'max-content',
                maxWidth: 'none',
              }}
            >
              {(exportMode === 'diagram' || exportMode === 'combined') && (
                <div className={exportMode === 'combined' ? 'mb-6' : ''}>
                  <SpectrumMap
                    project={project}
                    colorScheme={scheme}
                    isExportView={true}
                    hideSpecialSection={exportMode === 'combined'}
                  />
                </div>
              )}

              {(exportMode === 'table' || exportMode === 'combined') && (
                <div className="w-full">
                  <MatrixTable
                    project={project}
                    colorScheme={scheme}
                    onUpdateCharacterScore={() => {}}
                    onEditCharacter={() => {}}
                    onDeleteCharacter={() => {}}
                    isExportView={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between gap-3 shrink-0"
          style={{
            borderColor: isDark ? '#27272a' : '#f4f4f5',
            backgroundColor: isDark ? '#0e0e10' : '#fafafa',
          }}
        >
          <span
            className="text-xs font-semibold"
            style={{ color: scheme.accent }}
          >
            {statusMessage}
          </span>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={isProcessing}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors disabled:opacity-50"
              style={{
                backgroundColor: isDark ? '#18181b' : '#ffffff',
                borderColor: isDark ? '#27272a' : '#d4d4d8',
                color: isDark ? '#fafafa' : '#18181b',
              }}
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  コピー完了
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  コピー
                </>
              )}
            </button>

            {canShare && (
              <button
                type="button"
                onClick={handleShareImage}
                disabled={isProcessing}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: isDark ? '#1f2937' : '#f0fdf4',
                  borderColor: isDark ? '#374151' : '#bbf7d0',
                  color: isDark ? '#60a5fa' : '#15803d',
                }}
                title="共有メニューを開いて写真アプリに保存できます"
              >
                <Share2 className="w-3.5 h-3.5" />
                共有・保存
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadImage}
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-colors disabled:opacity-50"
              style={{
                backgroundColor: scheme.accent,
                color: scheme.accentText,
              }}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  PNG保存
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
