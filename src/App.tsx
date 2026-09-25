/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Character,
  MapProject,
  StageLevel,
  ViewMode,
} from './types';
import { DEFAULT_PROJECT } from './data/defaultData';
import { generateColorScheme } from './utils/theme';
import { Header } from './components/Header';
import { SpectrumMap } from './components/SpectrumMap';
import { MatrixTable } from './components/MatrixTable';
import { CharacterModal } from './components/CharacterModal';
import { SettingsModal } from './components/SettingsModal';
import { ExportModal } from './components/ExportModal';

const STORAGE_KEY = 'cp_position_spectrum_project_v6';

export default function App() {
  const [project, setProject] = useState<MapProject>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.characters && parsed.axes) {
          if (parsed.title === '攻め受け属性スペクトラム') {
            parsed.title = '攻め受け分類';
          }
          if (
            parsed.creator === '@creator' ||
            parsed.creator === '@Creator' ||
            parsed.creator?.toLowerCase() === '@creator'
          ) {
            parsed.creator = '';
          }
          parsed.axes = parsed.axes.map((a: any) =>
            a.name === '他人' ? { ...a, name: '他認' } : a
          );
          parsed.characters = parsed.characters.map((c: any) =>
            c.specialNote === 'サンプル１の前でのみ受け化'
              ? { ...c, specialNote: '', isSpecial: false, specialAxes: [] }
              : c
          );
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load from storage:', e);
    }
    return DEFAULT_PROJECT;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('diagram');
  const [isCharModalOpen, setIsCharModalOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Compute active colorScheme from 2-color settings (baseColor and cardColor)
  const colorScheme = generateColorScheme(
    project.baseColor || (project.themeMode === 'light' ? '#f4f4f5' : '#121214'),
    project.cardColor || (project.themeMode === 'light' ? '#ffffff' : '#18181b')
  );
  const isDark = colorScheme.isDark;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    } catch (e) {
      console.error('Failed to save to storage:', e);
    }
  }, [project]);

  // Unified Project update from Settings modal
  const handleUpdateProject = (updatedFields: Partial<MapProject>) => {
    setProject((prev) => ({
      ...prev,
      ...updatedFields,
      updatedAt: new Date().toISOString().split('T')[0],
    }));
  };

  // Character handlers
  const handleOpenAddCharacter = () => {
    setEditingCharacter(null);
    setIsCharModalOpen(true);
  };

  const handleOpenEditCharacter = (char: Character) => {
    setEditingCharacter(char);
    setIsCharModalOpen(true);
  };

  const handleSaveCharacter = (character: Character) => {
    setProject((prev) => {
      const existingIdx = prev.characters.findIndex((c) => c.id === character.id);
      let updatedChars: Character[];
      if (existingIdx >= 0) {
        updatedChars = [...prev.characters];
        updatedChars[existingIdx] = character;
      } else {
        updatedChars = [...prev.characters, character];
      }
      return {
        ...prev,
        characters: updatedChars,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });
  };

  const handleDeleteCharacter = (charId: string) => {
    setProject((prev) => ({
      ...prev,
      characters: prev.characters.filter((c) => c.id !== charId),
      updatedAt: new Date().toISOString().split('T')[0],
    }));
  };

  const handleUpdateCharacterScore = (
    charId: string,
    axisId: string,
    newScore: StageLevel
  ) => {
    setProject((prev) => {
      const updatedChars = prev.characters.map((c) => {
        if (c.id === charId) {
          return {
            ...c,
            scores: {
              ...c.scores,
              [axisId]: newScore,
            },
          };
        }
        return c;
      });
      return {
        ...prev,
        characters: updatedChars,
        updatedAt: new Date().toISOString().split('T')[0],
      };
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col transition-colors duration-200"
      style={{
        backgroundColor: colorScheme.pageBg,
        color: colorScheme.textPrimary,
      }}
    >
      {/* Top Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        themeMode={project.themeMode}
        colorScheme={colorScheme}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAddCharacter={handleOpenAddCharacter}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        {viewMode === 'diagram' && (
          <SpectrumMap
            project={project}
            colorScheme={colorScheme}
            onEditCharacter={handleOpenEditCharacter}
          />
        )}

        {viewMode === 'table' && (
          <MatrixTable
            project={project}
            colorScheme={colorScheme}
            onUpdateCharacterScore={handleUpdateCharacterScore}
            onEditCharacter={handleOpenEditCharacter}
            onDeleteCharacter={handleDeleteCharacter}
          />
        )}

        {viewMode === 'combined' && (
          <div className="space-y-4">
            <SpectrumMap
              project={project}
              colorScheme={colorScheme}
              onEditCharacter={handleOpenEditCharacter}
              hideSpecialSection={true}
            />
            <MatrixTable
              project={project}
              colorScheme={colorScheme}
              onUpdateCharacterScore={handleUpdateCharacterScore}
              onEditCharacter={handleOpenEditCharacter}
              onDeleteCharacter={handleDeleteCharacter}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="w-full border-t py-3 text-center text-[10px] transition-colors"
        style={{
          borderColor: colorScheme.borderSubtle,
          color: colorScheme.textMuted,
        }}
      >
        <span>SEME &amp; UKE POSITION MAP</span>
      </footer>

      {/* Modals */}
      <CharacterModal
        isOpen={isCharModalOpen}
        onClose={() => {
          setIsCharModalOpen(false);
          setEditingCharacter(null);
        }}
        onSave={handleSaveCharacter}
        initialCharacter={editingCharacter}
        axes={project.axes}
        isDark={isDark}
        colorScheme={colorScheme}
      />

      {/* Unified Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        project={project}
        onUpdateProject={handleUpdateProject}
        onImportProject={(imported) => setProject(imported)}
        onResetToDefault={() => {
          const fresh = JSON.parse(JSON.stringify(DEFAULT_PROJECT));
          fresh.updatedAt = new Date().toISOString().split('T')[0];
          setProject(fresh);
        }}
        onClearAll={() =>
          setProject((prev) => ({
            ...prev,
            characters: [],
            updatedAt: new Date().toISOString().split('T')[0],
          }))
        }
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        colorScheme={colorScheme}
      />
    </div>
  );
}
