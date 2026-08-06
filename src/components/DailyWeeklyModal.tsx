import React, { useState } from 'react';
import { Calendar, Flame, Play, Sparkles, Trophy, X, Check, Gift, Zap } from 'lucide-react';
import { Level, PlayerProfile } from '../types/game';
import { soundEngine } from '../engine/soundEngine';

interface DailyWeeklyModalProps {
  profile: PlayerProfile;
  onClaimDailyReward?: (coins: number, streakDay: number, rewardItemId?: string) => void;
  onSelectDailyLevel: (level: Level) => void;
  onSelectWeeklyLevel: (level: Level) => void;
  onClose: () => void;
}

const STREAK_REWARDS = [
  { day: 1, coins: 50, label: '50 Coins', item: null },
  { day: 2, coins: 100, label: '100 Coins', item: null },
  { day: 3, coins: 150, label: '150 Coins + Spark Trail', item: 'effect_spark' },
  { day: 4, coins: 200, label: '200 Coins', item: null },
  { day: 5, coins: 300, label: '300 Coins', item: null },
  { day: 6, coins: 500, label: '500 Coins', item: null },
  { day: 7, coins: 1000, label: '1,000 Coins + Royal Gold Ink', item: 'trail_gold' },
];

export const DailyWeeklyModal: React.FC<DailyWeeklyModalProps> = ({
  profile,
  onClaimDailyReward,
  onSelectDailyLevel,
  onSelectWeeklyLevel,
  onClose,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isClaimedToday = profile.lastDailyDate === todayStr;

  const currentStreakDay = ((profile.dailyStreak - 1) % 7) + 1;

  const handleClaim = () => {
    if (isClaimedToday) return;
    const reward = STREAK_REWARDS[currentStreakDay - 1];
    soundEngine.playVictoryFanfare();
    if (onClaimDailyReward) {
      onClaimDailyReward(reward.coins, currentStreakDay, reward.item || undefined);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // Generate deterministic Daily Level
  const dailyLevel: Level = {
    id: `daily_${Date.now()}`,
    worldId: 1,
    levelNumber: 999,
    title: `Daily Seed (${formattedDate})`,
    theme: 'Cyberpunk Laboratory',
    description: 'Special AI-validated daily puzzle. Complete for +250 Bonus Coins and streak progression.',
    energyType: 'electric',
    dropCount: 28,
    dropSpawn: { x: 350, y: 90 },
    containers: [
      { id: 'dc1', x: 450, y: 500, width: 90, height: 110, targetCount: 18, requiredType: 'electric' },
    ],
    obstacles: [
      { id: 'd_sw', type: 'switch', x: 250, y: 300, width: 60, height: 24, color: '#ffe600' },
      { id: 'd_dr', type: 'door', x: 450, y: 350, width: 30, height: 180, connectedId: 'd_sw', color: '#fbbf24' },
      { id: 'd_rot', type: 'rotator', x: 350, y: 220, width: 160, height: 20, speed: 1.6, color: '#ef4444' },
    ],
    parLineLength: 420,
    hintText: 'Guide electric drops onto the left switch to lift the central door.',
  };

  const weeklyLevel: Level = {
    id: `weekly_${Date.now()}`,
    worldId: 4,
    levelNumber: 888,
    title: 'Weekly Quantum Master Challenge',
    theme: 'Quantum Sanctuary',
    description: 'High-difficulty master puzzle with dual containers, portals, and gravity zones. Reward: +1,000 Coins!',
    energyType: 'plasma',
    secondaryEnergyType: 'gravity',
    dropCount: 35,
    dropSpawn: { x: 400, y: 80 },
    containers: [
      { id: 'wc1', x: 200, y: 500, width: 85, height: 105, targetCount: 15, requiredType: 'plasma' },
      { id: 'wc2', x: 600, y: 180, width: 85, height: 105, targetCount: 15, requiredType: 'gravity' },
    ],
    obstacles: [
      { id: 'w_wood', type: 'breakableWood', x: 200, y: 300, width: 140, height: 24, isStatic: true, color: '#854d0e' },
      { id: 'w_gz', type: 'gravityZone', x: 600, y: 380, width: 180, height: 180, extraData: { gravityX: 0, gravityY: -16 }, color: '#a855f7' },
    ],
    parLineLength: 550,
    hintText: 'Split the stream to burn the wood on the left while sending gravity drops up into the right container.',
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative text-slate-100 animate-scale-up max-h-[90vh] flex flex-col overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-100">7-Day Daily Rewards & Events</h3>
            <p className="text-xs text-slate-400">Claim daily login bonuses and play live challenge seeds</p>
          </div>
        </div>

        {/* 7-Day Reward Grid */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="font-black text-sm text-slate-100">Streak: Day {profile.dailyStreak}</span>
            </div>
            {isClaimedToday ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Claimed Today
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full animate-bounce">
                Reward Ready!
              </span>
            )}
          </div>

          {/* 7 Day Cards */}
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {STREAK_REWARDS.map((r) => {
              const isPast = r.day < currentStreakDay || (r.day === currentStreakDay && isClaimedToday);
              const isCurrent = r.day === currentStreakDay && !isClaimedToday;

              return (
                <div
                  key={r.day}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all ${
                    isPast
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : isCurrent
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/50 scale-105 shadow-md shadow-amber-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">D{r.day}</span>
                  <div className="my-1.5">
                    {isPast ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : r.item ? (
                      <Gift className="w-4 h-4 text-amber-400 mx-auto animate-pulse" />
                    ) : (
                      <Trophy className="w-3.5 h-3.5 text-amber-400/80 mx-auto" />
                    )}
                  </div>
                  <span className="text-[9px] font-extrabold leading-tight">+{r.coins}</span>
                </div>
              );
            })}
          </div>

          {/* Claim Button */}
          {!isClaimedToday ? (
            <button
              onClick={handleClaim}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all cursor-pointer animate-pulse active:scale-98 flex items-center justify-center gap-2"
            >
              <Gift className="w-4 h-4" />
              <span>Claim Day {currentStreakDay} Bonus ({STREAK_REWARDS[currentStreakDay - 1].label})</span>
            </button>
          ) : (
            <p className="text-center text-xs font-bold text-slate-400 py-1">
              🎉 Next daily reward unlocks tomorrow!
            </p>
          )}
        </div>

        {/* Challenge Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Daily Challenge Card */}
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider">Daily Seed</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-100 mb-1">{dailyLevel.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{dailyLevel.description}</p>
            </div>

            <button
              onClick={() => onSelectDailyLevel(dailyLevel)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-slate-950" />
              <span>Play Daily Challenge</span>
            </button>
          </div>

          {/* Weekly Master Challenge Card */}
          <div className="bg-slate-950/90 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between hover:border-purple-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Weekly Master</span>
                <Trophy className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="font-extrabold text-sm text-slate-100 mb-1">{weeklyLevel.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{weeklyLevel.description}</p>
            </div>

            <button
              onClick={() => onSelectWeeklyLevel(weeklyLevel)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-slate-100 font-black py-2.5 rounded-xl text-xs transition-all cursor-pointer active:scale-98"
            >
              <Play className="w-3.5 h-3.5 fill-slate-100" />
              <span>Play Master Challenge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

