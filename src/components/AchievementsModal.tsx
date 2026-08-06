import React from 'react';
import { Trophy, CheckCircle, Award, Star, X, Zap, Crown, Palette, Sparkles, Calendar, Droplet } from 'lucide-react';
import { Achievement, PlayerProfile } from '../types/game';
import { INITIAL_ACHIEVEMENTS } from '../data/shopAndAchievements';

interface AchievementsModalProps {
  profile: PlayerProfile;
  onClaimReward: (achievementId: string, rewardCoins: number) => void;
  onClose: () => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  profile,
  onClaimReward,
  onClose,
}) => {
  const ownedItems = profile.ownedItems || [];
  const inkCount = ownedItems.filter((i) => i.startsWith('trail_')).length;
  const themeCount = ownedItems.filter((i) =>
    ['neon_dark', 'monochrome', 'minimal_white', 'cyber', 'sunset', 'forest', 'ice', 'space', 'lava'].includes(i)
  ).length;

  const getAchievementProgress = (id: string): number => {
    switch (id) {
      case 'first_flow': return profile.stats.levelsCompleted >= 1 ? 1 : 0;
      case 'level_10': return profile.stats.levelsCompleted;
      case 'level_50': return profile.stats.levelsCompleted;
      case 'level_100': return profile.stats.levelsCompleted;
      case 'level_200': return profile.stats.levelsCompleted;
      case 'star_master_10': return profile.stats.totalStarsEarned;
      case 'star_master_30': return profile.stats.totalStarsEarned;
      case 'star_master_60': return profile.stats.totalStarsEarned;
      case 'no_retry_5': return profile.stats.perfectFirstTryLevels || 0;
      case 'ink_collector': return inkCount;
      case 'theme_collector': return themeCount;
      case 'streak_7': return profile.dailyStreak;
      default: return 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-slate-100 animate-scale-up max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">Progression Milestones</h3>
            <p className="text-xs text-slate-400">Complete gameplay goals to earn bonus Coin rewards</p>
          </div>
        </div>

        {/* Achievement List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1 flex-1">
          {INITIAL_ACHIEVEMENTS.map((ach) => {
            const isClaimed = profile.achievements[ach.id];
            const currentProg = getAchievementProgress(ach.id);
            const isCompleted = currentProg >= ach.maxProgress;

            return (
              <div
                key={ach.id}
                className={`bg-slate-950/90 border rounded-2xl p-4 flex items-center justify-between transition-all ${
                  isClaimed
                    ? 'border-slate-800/80 opacity-75'
                    : isCompleted
                    ? 'border-amber-500/50 bg-amber-950/10 ring-1 ring-amber-500/20'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center gap-3.5 pr-2">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isCompleted ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-100">{ach.title}</h4>
                    <p className="text-[11px] text-slate-400 mb-1.5">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="w-40 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (currentProg / ach.maxProgress) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isClaimed ? (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full font-black uppercase">
                      <CheckCircle className="w-3 h-3" /> Claimed
                    </span>
                  ) : isCompleted ? (
                    <button
                      onClick={() => onClaimReward(ach.id, ach.rewardCoins)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs shadow-md shadow-amber-500/20 cursor-pointer animate-pulse active:scale-95"
                    >
                      Claim +{ach.rewardCoins}
                    </button>
                  ) : (
                    <span className="text-xs font-black text-slate-500">
                      {Math.min(currentProg, ach.maxProgress)}/{ach.maxProgress}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
