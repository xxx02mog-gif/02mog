import React, { useState } from 'react';
import { AxisDefinition } from '../types';
import { X, Plus, Trash2, Check } from 'lucide-react';

interface AxisModalProps {
  isOpen: boolean;
  onClose: () => void;
  axes: AxisDefinition[];
  onSaveAxes: (axes: AxisDefinition[]) => void;
}

export const AxisModal: React.FC<AxisModalProps> = ({
  isOpen,
  onClose,
  axes,
  onSaveAxes,
}) => {
  const [localAxes, setLocalAxes] = useState<AxisDefinition[]>(axes);
  const [newAxisName, setNewAxisName] = useState('');
  const [newLeftLabel, setNewLeftLabel] = useState('攻め');
  const [newRightLabel, setNewRightLabel] = useState('受け');

  React.useEffect(() => {
    setLocalAxes(axes);
  }, [axes, isOpen]);

  if (!isOpen) return null;

  const handleAddAxis = (name?: string, left?: string, right?: string) => {
    const finalName = (name || newAxisName).trim();
    if (!finalName) return;

    const newAxis: AxisDefinition = {
      id: `axis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      leftLabel: (left || newLeftLabel || '攻め').trim(),
      rightLabel: (right || newRightLabel || '受け').trim(),
      isSystem: false,
    };

    setLocalAxes((prev) => [...prev, newAxis]);
    setNewAxisName('');
    setNewLeftLabel('攻め');
    setNewRightLabel('受け');
  };

  const handleUpdateAxis = (
    id: string,
    field: 'name' | 'leftLabel' | 'rightLabel',
    value: string
  ) => {
    setLocalAxes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleDeleteAxis = (id: string) => {
    if (localAxes.length <= 1) {
      alert('評価軸は最低1つ必要です');
      return;
    }
    setLocalAxes((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSave = () => {
    onSaveAxes(localAxes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl text-zinc-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60">
          <h3 className="text-base font-bold">評価軸のカスタマイズ</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Current axes list */}
          <div className="space-y-2.5">
            <span className="font-semibold text-zinc-300 block">
              設定中の軸一覧
            </span>

            {localAxes.map((axis) => (
              <div
                key={axis.id}
                className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    value={axis.name}
                    onChange={(e) =>
                      handleUpdateAxis(axis.id, 'name', e.target.value)
                    }
                    placeholder="軸名"
                    className="flex-1 px-2.5 py-1 text-xs font-bold bg-zinc-900 border border-zinc-700 rounded text-zinc-100 focus:outline-hidden focus:border-zinc-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteAxis(axis.id)}
                    className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Left and Right labels for this axis */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 shrink-0">左端:</span>
                    <input
                      type="text"
                      value={axis.leftLabel ?? '攻め'}
                      onChange={(e) =>
                        handleUpdateAxis(axis.id, 'leftLabel', e.target.value)
                      }
                      placeholder="攻め"
                      className="w-full px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-400"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400 shrink-0">右端:</span>
                    <input
                      type="text"
                      value={axis.rightLabel ?? '受け'}
                      onChange={(e) =>
                        handleUpdateAxis(axis.id, 'rightLabel', e.target.value)
                      }
                      placeholder="受け"
                      className="w-full px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-400"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add custom axis */}
          <div className="p-3 rounded-lg bg-zinc-950/70 border border-zinc-800 space-y-2 pt-3">
            <span className="font-bold text-zinc-200 block">
              + 新しい軸を追加
            </span>
            <input
              type="text"
              value={newAxisName}
              onChange={(e) => setNewAxisName(e.target.value)}
              placeholder="軸名（例: 体格差、精神的リード）"
              className="w-full px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-400"
            />
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <input
                type="text"
                value={newLeftLabel}
                onChange={(e) => setNewLeftLabel(e.target.value)}
                placeholder="左端ラベル（デフォルト: 攻め）"
                className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-400"
              />
              <input
                type="text"
                value={newRightLabel}
                onChange={(e) => setNewRightLabel(e.target.value)}
                placeholder="右端ラベル（デフォルト: 受け）"
                className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-700 rounded text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-zinc-400"
              />
            </div>
            <button
              type="button"
              onClick={() => handleAddAxis()}
              disabled={!newAxisName.trim()}
              className="w-full py-1.5 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 rounded border border-zinc-700 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              追加する
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold text-zinc-900 bg-zinc-100 hover:bg-white rounded-md flex items-center gap-1 shadow-sm"
          >
            <Check className="w-3.5 h-3.5" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
