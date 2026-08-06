import React from 'react';
import { User, Trophy, Star, Flame, RotateCcw, PenTool, Clock, Shield, Sparkles, X, Palette, Zap } from 'lucide-react';
import { PlayerProfile } from '../types/game';

interface ProfileModalProps {
  profile: PlayerProfile;
  onClose: () => void;
}

const getPlayerRank = (stars: number, levels: number) => {
  if (stars >= 50 || levels >= 30) return { title: 'Master Physics Architect', badge: '👑', color: 'text-amber-400' };
  if (stars >= 30 || levels >= 15) return { title: 'Quantum Fluid Engineer', badge: '💎', color: 'text-cyan-400' };
  if (stars >= 10 || levels >= 5) return { title: 'Energy Technician', badge: '⚡', color: 'text-blue-400' };
  return { title: 'Fluid Novice', badge: '💧', color: 'text-emerald-400' };
};

const formatPlayTime = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '0 mins';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins} mins`;
};

export const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose }) => {
  const rank = getPlayerRank(profile.stats.totalStarsEarned, profile.stats.levelsCompleted);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-slate-100 animate-scale-up max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6 shrink-0 bg-slate-950/80 border border-slate-800 p-4 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-950/50 shrink-0">
            {rank.badge}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-lg text-slate-100">Quantum Player</h3>
              <span className={`text-xs font-black px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 ${rank.color}`}>
                {rank.title}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Liquid Logic Progression & Lifetime Career Stats</p>
          </div>
        </div>

        {/* Core Currency Summary Bar */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Total Stars</span>
              <span className="text-lg font-black text-amber-400">{profile.stats.totalStarsEarned} ★</span>
            </div>
          </div>

          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Energy Coins</span>
              <span className="text-lg font-black text-cyan-400">{profile.coins}</span>
            </div>
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Lifetime Statistics</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-extrabold uppercase">Levels Completed</span>
            </div>
            <span className="text-base font-black text-slate-100">{profile.stats.levelsCompleted}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-extrabold uppercase">Highest Streak</span>
            </div>
            <span className="text-base font-black text-amber-400">{profile.stats.highestStreak || profile.dailyStreak} Days</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[10px] font-extrabold uppercase">Total Retries</span>
            </div>
            <span className="text-base font-black text-slate-100">{profile.stats.totalRetries || 0}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <PenTool className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-extrabold uppercase">Draw Distance</span>
            </div>
            <span className="text-base font-black text-slate-100">{Math.round(profile.stats.totalDrawDistance || (profile.stats.totalLinesDrawn * 35))}m</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] font-extrabold uppercase">Total Play Time</span>
            </div>
            <span className="text-base font-black text-slate-100">{formatPlayTime(profile.stats.totalPlayTime)}</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] font-extrabold uppercase">Drops Guided</span>
            </div>
            <span className="text-base font-black text-slate-100">{profile.stats.totalDropsGuided || 0}</span>
          </div>
        </div>

        {/* Equipped Loadout Summary */}
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Equipped Cosmetics</h4>
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" /> Active Ink Trail:
            </span>
            <span className="font-extrabold text-cyan-300 capitalize">{profile.selectedTrail.replace('trail_', '').replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" /> Glass Vessel Skin:
            </span>
            <span className="font-extrabold text-purple-300 capitalize">{profile.selectedSkin.replace('skin_', '').replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-2">
            <span className="text-slate-400 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" /> Theme Mode:
            </span>
            <span className="font-extrabold text-amber-300 capitalize">{profile.selectedTheme.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
