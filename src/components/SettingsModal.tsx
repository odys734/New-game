import React, { useState } from 'react';
import { Download, Eye, HardDriveUpload, Palette, Sliders, Volume2, VolumeX, X, BatteryCharging, Zap, Globe, Hand } from 'lucide-react';
import { GameSettings, PlayerProfile } from '../types/game';
import { soundEngine } from '../engine/soundEngine';
import { THEME_CONFIGS } from '../data/themes';

interface SettingsModalProps {
  settings: GameSettings;
  profile: PlayerProfile;
  onUpdateSettings: (updated: Partial<GameSettings>) => void;
  onImportCloudSave: (jsonString: string) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  profile,
  onUpdateSettings,
  onImportCloudSave,
  onClose,
}) => {
  const [importString, setImportString] = useState<string>('');

  const handleExport = () => {
    const dataStr = JSON.stringify({ profile, settings });
    navigator.clipboard.writeText(dataStr);
    alert('Cloud save state copied to clipboard! Keep this JSON code safe to sync across devices.');
  };

  const handleImport = () => {
    if (!importString.trim()) return;
    try {
      onImportCloudSave(importString);
      alert('Cloud save imported successfully!');
      setImportString('');
    } catch (e) {
      alert('Invalid cloud save JSON code format.');
    }
  };

  const languages = [
    { code: 'en', label: 'English 🇺🇸' },
    { code: 'es', label: 'Español 🇪🇸' },
    { code: 'fr', label: 'Français 🇫🇷' },
    { code: 'de', label: 'Deutsch 🇩🇪' },
    { code: 'ja', label: '日本語 🇯🇵' },
    { code: 'zh', label: '中文 🇨🇳' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-slate-100 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-100">Settings & Preferences</h3>
            <p className="text-xs text-slate-400">Themes, audio, performance, controls, and language</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6 max-h-[28rem] overflow-y-auto pr-1">
          {/* Visual Theme Selector */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">UI Theme ({Object.keys(THEME_CONFIGS).length} Themes)</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(THEME_CONFIGS).map((theme) => {
                const isActive = settings.appTheme === theme.id || (!settings.appTheme && theme.id === 'neon_dark');
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onUpdateSettings({ appTheme: theme.id })}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-400 text-white shadow-lg shadow-cyan-950/60 ring-2 ring-cyan-400/50'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-lg leading-none">{theme.icon}</div>
                    <span className="text-xs font-extrabold text-center leading-tight truncate w-full">{theme.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio Controls */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Audio & Sound Effects</h4>
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>Sound Effects (SFX) Volume</span>
                  <span>{Math.round(settings.sfxVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateSettings({ sfxVolume: val });
                    soundEngine.setVolumes(val, settings.musicVolume);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>Ambient Music Volume</span>
                  <span>{Math.round(settings.musicVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    onUpdateSettings({ musicVolume: val });
                    soundEngine.setVolumes(settings.sfxVolume, val);
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Performance & Display */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Performance & Graphics</h4>
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200">FPS Mode Target</span>
                </div>
                <div className="flex gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fpsTarget: 60 })}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      (settings.fpsTarget ?? 60) === 60
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    60 FPS
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fpsTarget: 120 })}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold cursor-pointer transition-all ${
                      settings.fpsTarget === 120
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    120 FPS
                  </button>
                </div>
              </div>

              <label className="flex items-center justify-between cursor-pointer pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Battery Saver Mode</span>
                    <span className="text-[10px] text-slate-400 block">Reduces background particles & saves battery</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.batterySaver ?? false}
                  onChange={(e) => onUpdateSettings({ batterySaver: e.target.checked })}
                  className="w-4 h-4 accent-emerald-400 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Controls & Layout */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Accessibility & Layout</h4>
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Hand className="w-4 h-4 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Left-Handed Mode</span>
                    <span className="text-[10px] text-slate-400 block">Flips layout for easy left-thumb access</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.leftHandedMode ?? false}
                  onChange={(e) => onUpdateSettings({ leftHandedMode: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-800/80 pt-2.5">
                <span className="text-xs font-bold text-slate-200">Colorblind High-Contrast Labels</span>
                <input
                  type="checkbox"
                  checked={settings.colorblindMode}
                  onChange={(e) => onUpdateSettings({ colorblindMode: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer border-t border-slate-800/80 pt-2.5">
                <span className="text-xs font-bold text-slate-200">Haptic Feedback Simulation</span>
                <input
                  type="checkbox"
                  checked={settings.hapticsEnabled}
                  onChange={(e) => onUpdateSettings({ hapticsEnabled: e.target.checked })}
                  className="w-4 h-4 accent-cyan-400 cursor-pointer"
                />
              </label>

              <div className="border-t border-slate-800/80 pt-2.5">
                <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                  <span>Drawing Line Thickness</span>
                  <span>{settings.lineThickness}px</span>
                </div>
                <input
                  type="range"
                  min={4}
                  max={16}
                  value={settings.lineThickness}
                  onChange={(e) => onUpdateSettings({ lineThickness: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Language</h4>
            <div className="grid grid-cols-3 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              {languages.map((lang) => {
                const isActive = (settings.language ?? 'en') === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => onUpdateSettings({ language: lang.code as any })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cloud Save Sync */}
          <div>
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-3">Cloud Save Sync</h4>
            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-colors border border-slate-700"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export Save to Clipboard</span>
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste Cloud Save JSON..."
                  value={importString}
                  onChange={(e) => setImportString(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
                <button
                  onClick={handleImport}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

