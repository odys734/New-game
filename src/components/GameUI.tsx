import React from 'react';
import { ChevronLeft, RotateCcw, Undo2, Star, Sparkles, Video, SkipForward } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AppThemeMode, Level, PlayerProfile } from '../types/game';
import { ENERGY_PROPERTIES } from '../data/energyProperties';
import { THEME_CONFIGS } from '../data/themes';

interface GameUIProps {
  level: Level;
  profile: PlayerProfile;
  hasLine: boolean;
  isSimulating: boolean;
  onUndo: () => void;
  onRestart: () => void;
  onSkipLevel?: () => void;
  onBackToMenu: () => void;
  onNextLevel?: () => void;
  completionData?: { isSuccess: boolean; stars: number; isFirstAttempt?: boolean; claimedAdBonus?: boolean } | null;
  onWatchRewardedAd: () => void;
  appTheme?: AppThemeMode;
  leftHandedMode?: boolean;
}

export const GameUI: React.FC<GameUIProps> = ({
  level,
  profile,
  hasLine,
  isSimulating,
  onUndo,
  onRestart,
  onSkipLevel,
  onBackToMenu,
  onNextLevel,
  completionData,
  onWatchRewardedAd,
  appTheme = 'neon_dark',
  leftHandedMode = false,
}) => {
  const prop = ENERGY_PROPERTIES[level.energyType] || ENERGY_PROPERTIES.aqua;
  const themeConfig = THEME_CONFIGS[appTheme] || THEME_CONFIGS.neon_dark;
  const isMono = themeConfig.isMonochrome;

  // Trigger celebration energy burst on victory
  React.useEffect(() => {
    if (completionData?.isSuccess) {
      confetti({
        particleCount: 140,
        spread: 100,
        startVelocity: 45,
        origin: { y: 0.55 },
        shapes: ['circle', 'star'],
        colors: [prop.color, prop.secondaryColor || '#00f0ff', '#ffffff', prop.glowColor || '#00f0ff'],
      });
    }
  }, [completionData, prop]);

  // Objective text description based on Energy type
  const getObjectiveText = () => {
    switch (level.energyType) {
      case 'plasma':
        return 'Thermal Reactor Core Ignited!';
      case 'cryo':
        return 'Sub-Zero Cryo Cell Frozen & Locked!';
      case 'electric':
        return 'Voltaic Circuit Successfully Powered!';
      case 'nature':
        return 'Bio Reactor Fully Activated!';
      case 'gravity':
        return 'Quantum Gravity Core Stabilized!';
      case 'light':
        return 'Optical Prism Fully Illuminated!';
      case 'shadow':
        return 'Void Portal Fully Charged!';
      default:
        return 'Fluid Container Successfully Stabilized!';
    }
  };

  const actionButtons = (
    <div className="flex items-center gap-1.5 md:gap-2">
      {/* Undo Line */}
      <button
        onClick={onUndo}
        disabled={!hasLine || isSimulating}
        className="p-1.5 md:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
        title="Undo Line"
      >
        <Undo2 className="w-4 h-4" style={{ color: isMono ? '#ffffff' : prop.color }} />
      </button>

      {/* Restart Level */}
      <button
        onClick={onRestart}
        className="p-1.5 md:p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
        title="Restart Level"
      >
        <RotateCcw className="w-4 h-4" style={{ color: isMono ? '#ffffff' : prop.color }} />
      </button>

      {/* Skip Level Button */}
      {onSkipLevel && (
        <button
          onClick={onSkipLevel}
          className="flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
          style={{ borderColor: isMono ? '#ffffff' : `${prop.color}60`, color: isMono ? '#ffffff' : prop.color }}
          title="Skip Level"
        >
          <SkipForward className="w-4 h-4" style={{ color: isMono ? '#ffffff' : prop.color }} />
          <span className="hidden sm:inline">Skip</span>
        </button>
      )}
    </div>
  );

  const exitButton = (
    <button
      onClick={onBackToMenu}
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
    >
      <ChevronLeft className="w-4 h-4" style={{ color: isMono ? '#ffffff' : prop.color }} />
      <span>Exit</span>
    </button>
  );

  return (
    <>
      {/* Sleek Full-Width Top Header Bar */}
      <div className={`w-full border-b px-3 md:px-6 py-2 shrink-0 flex items-center justify-between shadow-lg z-30 select-none ${themeConfig.uiHeaderClass}`}>
        {leftHandedMode ? actionButtons : exitButton}

        {/* Title Badge with Active World Energy Color */}
        <div className="flex flex-col items-center text-center">
          <span className="font-black text-xs md:text-sm tracking-tight leading-tight">{level.title}</span>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: isMono ? '#a1a1aa' : prop.color }}>
            WORLD 0{level.worldId} • LEVEL #{level.levelNumber}
          </span>
        </div>

        {leftHandedMode ? exitButton : actionButtons}
      </div>

      {/* Cinematic Victory / Completion Dialog Overlay */}
      {completionData && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 select-none">
          <div className="w-full max-w-sm bg-slate-900/90 border rounded-3xl p-6 shadow-2xl text-center text-slate-100 animate-scale-up backdrop-blur-2xl" style={{ borderColor: `${prop.color}50` }}>
            {completionData.isSuccess ? (
              <>
                {(() => {
                  const starCoins = completionData.stars === 3 ? 60 : completionData.stars === 2 ? 40 : 20;
                  const firstTryCoins = completionData.isFirstAttempt ? 20 : 0;
                  const adCoins = completionData.claimedAdBonus ? 100 : 0;
                  const totalCoins = starCoins + firstTryCoins + adCoins;

                  return (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-950/50">
                        <Sparkles className="w-8 h-8 text-emerald-400 animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400 mb-1 tracking-tight">
                        LEVEL COMPLETE
                      </h3>
                      <p className="text-xs font-extrabold mb-4" style={{ color: prop.color }}>
                        {getObjectiveText()}
                      </p>

                      {/* Stars Display */}
                      <div className="flex items-center justify-center gap-2 mb-4">
                        {[1, 2, 3].map((starIdx) => (
                          <Star
                            key={starIdx}
                            className={`w-8 h-8 transition-all duration-300 ${
                              starIdx <= completionData.stars
                                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-bounce'
                                : 'text-slate-800'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Animated Coin Reward Breakdown Card */}
                      <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-3.5 mb-5 space-y-2 text-left">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-bold flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Star Rating ({completionData.stars}★):
                          </span>
                          <span className="font-extrabold text-amber-400">+{starCoins} Coins</span>
                        </div>

                        {completionData.isFirstAttempt && (
                          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> First Try Bonus:
                            </span>
                            <span className="font-extrabold text-cyan-400">+20 Coins</span>
                          </div>
                        )}

                        {completionData.claimedAdBonus && (
                          <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1.5">
                              <Video className="w-3.5 h-3.5 text-emerald-400" /> Bonus Ad Boost:
                            </span>
                            <span className="font-extrabold text-emerald-400">+100 Coins</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm border-t border-amber-500/30 pt-2 font-black">
                          <span className="text-slate-200">Total Reward:</span>
                          <span className="text-amber-400 text-base animate-pulse">+{totalCoins} Energy Coins</span>
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {!completionData.claimedAdBonus && (
                          <button
                            onClick={onWatchRewardedAd}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-lg shadow-amber-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer animate-pulse"
                          >
                            <Video className="w-4 h-4" />
                            <span>Bonus Ad (+100 Extra Coins)</span>
                          </button>
                        )}

                        {onNextLevel ? (
                          <button
                            onClick={onNextLevel}
                            className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-cyan-500/30 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                          >
                            Next Level
                          </button>
                        ) : (
                          <button
                            onClick={onBackToMenu}
                            className="w-full bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 font-bold py-3.5 rounded-2xl text-sm transition-all cursor-pointer"
                          >
                            Return to Level Map
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-950/50">
                  <RotateCcw className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-xl font-black text-slate-100 mb-1 tracking-tight">
                  SIMULATION FAILED
                </h3>
                <p className="text-xs text-slate-400 mb-6">
                  {level.energyType} drops missed target destination
                </p>

                <div className="space-y-3">
                  <button
                    onClick={onRestart}
                    className="w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black py-3.5 rounded-2xl text-sm shadow-lg shadow-cyan-500/25 transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    Try Again
                  </button>

                  {onSkipLevel && (
                    <button
                      onClick={onSkipLevel}
                      className="w-full flex items-center justify-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-cyan-300 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span>Skip Level (Watch Sponsor)</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

