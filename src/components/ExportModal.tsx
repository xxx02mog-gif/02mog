import React, { useState, useEffect } from 'react';
import { toBlob } from 'html-to-image';
import { MapProject, ViewMode } from '../types';
import { ColorScheme, generateColorScheme } from '../utils/theme';
import { SpectrumMap } from './SpectrumMap';
import { MatrixTable } from './MatrixTable';
import {
  X,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  Loader2,
  Share2,
  ArrowLeft,
  Smartphone,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: MapProject;
  colorScheme?: ColorScheme;
}

interface GeneratedImageResult {
  dataUrl: string;
  blob: Blob;
  file: File;
  filename: string;
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
  const [generatedResult, setGeneratedResult] = useState<GeneratedImageResult | null>(null);

  // スマホ端末判定（iOS, Android, iPad等）
  const isMobile =
    typeof navigator !== 'undefined' &&
    (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
      (typeof navigator.maxTouchPoints === 'number' &&
        navigator.maxTouchPoints > 1 &&
        /Macintosh/i.test(navigator.userAgent)));

  const canShare =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof File !== 'undefined';

  // モーダルが閉じられたり設定が切り替わったら生成済み画像をクリア
  useEffect(() => {
    if (!isOpen) {
      if (generatedResult) {
        URL.revokeObjectURL(generatedResult.dataUrl);
      }
      setGeneratedResult(null);
      setStatusMessage('');
    }
  }, [isOpen]);

  const handleModeOrScaleChange = (newMode?: ViewMode, newScale?: number) => {
    if (generatedResult) {
      URL.revokeObjectURL(generatedResult.dataUrl);
      setGeneratedResult(null);
    }
    if (newMode) setExportMode(newMode);
    if (newScale) setScale(newScale);
  };

  if (!isOpen) return null;

  const getExportElement = (): HTMLElement | null => {
    return document.getElementById('export-container-target');
  };

  /**
   * 画像Blobを生成する共通ヘルパー
   */
  const createExportBlob = async (): Promise<{ blob: Blob; filename: string; file: File } | null> => {
    const node = getExportElement();
    if (!node) {
      alert('書き出し対象が見つかりませんでした');
      return null;
    }

    await new Promise((r) => setTimeout(r, 150));

    const blob = await toBlob(node, {
      pixelRatio: scale,
      cacheBust: true,
      backgroundColor: scheme.pageBg,
    });

    if (!blob) throw new Error('画像の変換に失敗しました');

    const safeTitle = (project.title || '攻め受け分類')
      .replace(/[^\w\s\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\-]/g, '_')
      .trim();
    const filename = `${safeTitle}_${Date.now()}.png`;
    const file = new File([blob], filename, { type: 'image/png' });

    return { blob, filename, file };
  };

  /**
   * PC向け：ワンクリックで直接PNGダウンロード
   */
  const handlePcDownload = async () => {
    setIsProcessing(true);
    setStatusMessage('画像を生成中...');

    try {
      const result = await createExportBlob();
      if (!result) return;

      const blobUrl = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.download = result.filename;
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

  /**
   * スマホ向け：画像を生成して完了画面を開く（2段階保存の第1ステップ）
   */
  const handleMobilePrepareImage = async () => {
    setIsProcessing(true);
    setStatusMessage('画像を生成中...');

    try {
      const result = await createExportBlob();
      if (!result) return;

      const dataUrl = URL.createObjectURL(result.blob);
      setGeneratedResult({
        dataUrl,
        blob: result.blob,
        file: result.file,
        filename: result.filename,
      });

      setStatusMessage('画像が完成しました！');
    } catch (err) {
      console.error('Mobile export preparation failed:', err);
      alert('画像の生成に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * スマホ向け：完成した画像を端末（写真アプリ/カメラロール）へ保存する（第2ステップ）
   * ※ すでに画像Fileがメモリ上にあるため、ユーザー操作の直後に非同期遅延なくnavigator.shareを即時実行可能！
   */
  const handleImmediateShare = async () => {
    if (!generatedResult) return;

    if (canShare && navigator.canShare && navigator.canShare({ files: [generatedResult.file] })) {
      try {
        await navigator.share({
          files: [generatedResult.file],
          title: project.title || '攻め受け分類',
        });
        setStatusMessage('保存メニューを呼び出しました');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
          // 共有シートがブロックされた場合は直接ダウンロードへフォールバック
          handleDirectDownloadFallback();
        }
      }
    } else {
      // 非対応の場合は通常ダウンロード
      handleDirectDownloadFallback();
    }
  };

  /**
   * 通常ダウンロード（フォールバック）
   */
  const handleDirectDownloadFallback = () => {
    if (!generatedResult) return;
    const link = document.createElement('a');
    link.download = generatedResult.filename;
    link.href = generatedResult.dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMessage('ダウンロードを開始しました');
  };

  /**
   * クリップボードへコピー
   */
  const handleCopyToClipboard = async () => {
    const node = getExportElement();
    if (!node) return;

    if (!navigator.clipboard || !window.ClipboardItem) {
      alert('クリップボードへの画像コピー非対応ブラウザです。保存ボタンをご利用ください。');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('クリップボードに準備中...');

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
      setStatusMessage('画像をコピーしました！');
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
            <h3 className="text-base font-bold">
              {generatedResult ? '画像の保存' : '画像エクスポート'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded transition-colors hover:opacity-70 cursor-pointer"
            style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar (画像生成前のみ表示) */}
        {!generatedResult && (
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
                      onClick={() => handleModeOrScaleChange(mode, undefined)}
                      className="px-3 py-1 rounded-md font-medium transition-colors cursor-pointer"
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
                      onClick={() => handleModeOrScaleChange(undefined, s)}
                      className="px-2.5 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
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
        )}

        {/* Content Area */}
        <div
          className="flex-1 p-4 sm:p-6 overflow-auto"
          style={{ backgroundColor: isDark ? '#09090b' : '#f4f4f5' }}
        >
          {generatedResult ? (
            /* スマホ向け：画像完成・保存ステップ */
            <div className="max-w-md mx-auto space-y-4 flex flex-col items-center">
              {/* タイトル（カラーなし・説明文なし） */}
              <div
                className="w-full py-2.5 px-3 rounded-lg border text-center shadow-xs"
                style={{
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                  color: isDark ? '#fafafa' : '#18181b',
                }}
              >
                <span className="font-bold text-sm">画像が完成しました</span>
              </div>

              {/* 完成画像の表示（長押し保存可能） */}
              <div
                className="w-full p-2 rounded-xl border flex justify-center overflow-hidden shadow-md"
                style={{
                  backgroundColor: isDark ? '#121214' : '#ffffff',
                  borderColor: isDark ? '#27272a' : '#e4e4e7',
                }}
              >
                <img
                  src={generatedResult.dataUrl}
                  alt="完成画像プレビュー"
                  className="max-h-[46vh] w-auto object-contain rounded-lg select-auto cursor-pointer"
                  title="長押しして画像を保存できます"
                />
              </div>

              {/* 保存アクション（「保存」のみ・他のボタンと統一カラー） */}
              <div className="w-full flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={canShare && isMobile ? handleImmediateShare : handleDirectDownloadFallback}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
                  style={{
                    backgroundColor: scheme.accent,
                    color: scheme.accentText,
                  }}
                >
                  <Download className="w-4 h-4" />
                  <span>保存</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(generatedResult.dataUrl);
                    setGeneratedResult(null);
                  }}
                  className="text-xs py-1.5 text-center flex items-center justify-center gap-1 hover:underline cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                  style={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>プレビューに戻る</span>
                </button>
              </div>
            </div>
          ) : (
            /* 通常のLive Export Preview（PC・スマホで完全に一致する固定840pxレイアウト） */
            <div className="w-fit mx-auto min-w-full flex justify-center">
              <div
                id="export-container-target"
                className="p-6 rounded-xl transition-colors shrink-0 shadow-xl"
                style={{
                  backgroundColor: scheme.pageBg,
                  color: scheme.textPrimary,
                  width: '840px',
                  minWidth: '840px',
                  maxWidth: '840px',
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
          )}
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
            {!isMobile && !generatedResult && (
              <button
                type="button"
                onClick={handleCopyToClipboard}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
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
            )}

            {/* PCの場合は「PNG保存」、スマホの場合は「保存」（画像生成画面へ移行） */}
            {!generatedResult && (
              <button
                type="button"
                onClick={isMobile ? handleMobilePrepareImage : handlePcDownload}
                disabled={isProcessing}
                className="px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-md transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: scheme.accent,
                  color: scheme.accentText,
                }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>画像生成中...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>保存</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
