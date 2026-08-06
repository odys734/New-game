import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  Lock,
  Play,
  Star,
  Trophy,
  Sparkles,
  Zap,
  Flame,
  Droplets,
  Snowflake,
  Sprout,
  Orbit,
  Sun,
  Moon,
  Atom,
  Crown,
  CheckCircle2,
  ChevronDown,
  Layers,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Level, PlayerProfile, WorldTheme } from '../types/game';
import { WORLD_THEMES, HANDCRAFTED_LEVELS } from '../data/handcraftedLevels';
import { ENERGY_PROPERTIES } from '../data/energyProperties';
import { soundEngine } from '../engine/soundEngine';

interface WorldSelectProps {
  profile: PlayerProfile;
  onSelectLevel: (level: Level) => void;
  onBack: () => void;
}

// Map world icon name to Lucide React component
const renderWorldIcon = (iconName: string, className: string = 'w-5 h-5') => {
  switch (iconName) {
    case 'Droplets': return <Droplets className={className} />;
    case 'Flame': return <Flame className={className} />;
    case 'Snowflake': return <Snowflake className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Sprout': return <Sprout className={className} />;
    case 'Orbit': return <Orbit className={className} />;
    case 'Sun': return <Sun className={className} />;
    case 'Moon': return <Moon className={className} />;
    case 'Atom': return <Atom className={className} />;
    case 'Crown': return <Crown className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export const WorldSelect: React.FC<WorldSelectProps> = ({
  profile,
  onSelectLevel,
  onBack,
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(soundEngine.isMuted);
  const [worldJumpOpen, setWorldJumpOpen] = useState<boolean>(false);

  const worldRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const activeLevelNodeRef = useRef<HTMLButtonElement | null>(null);

  // Total Statistics Calculations
  const totalLevels = HANDCRAFTED_LEVELS.length;
  const levelsCompletedCount = Object.keys(profile.stars).length;
  const totalWorldStarsEarned = profile.stats.totalStarsEarned || 0;
  const maxPossibleStars = totalLevels * 3;
  const overallCompletionPercentage = Math.round((totalWorldStarsEarned / maxPossibleStars) * 100) || 0;

  // Find highest unlocked level to auto-scroll into view on mount
  useEffect(() => {
    let defaultLevel = HANDCRAFTED_LEVELS[0];
    for (const lvl of HANDCRAFTED_LEVELS) {
      const isUnlocked =
        lvl.levelNumber === 1 ||
        profile.unlockedLevels.includes(lvl.id) ||
        profile.stars[`w${lvl.worldId}_l${lvl.levelNumber - 1}`] !== undefined;
      if (isUnlocked) {
        defaultLevel = lvl;
      }
    }
    if (defaultLevel) {
      setSelectedLevelId(defaultLevel.id);
      setTimeout(() => {
        if (activeLevelNodeRef.current) {
          activeLevelNodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
    }
  }, []);

  const handleLevelClick = (level: Level, isUnlocked: boolean) => {
    if (!isUnlocked) {
      soundEngine.playBreakObject();
      return;
    }

    soundEngine.playButtonClick();
    setSelectedLevelId(level.id);

    // Haptic feedback if supported on platform
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(25);
      } catch (e) {}
    }
  };

  const handlePlayLevel = (level: Level) => {
    soundEngine.playPortalSwoosh();
    onSelectLevel(level);
  };

  const scrollToWorld = (worldId: number) => {
    setWorldJumpOpen(false);
    const element = worldRefs.current[worldId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectedLevel = HANDCRAFTED_LEVELS.find((l) => l.id === selectedLevelId);
  const selectedLevelProp = selectedLevel ? (ENERGY_PROPERTIES[selectedLevel.energyType] || ENERGY_PROPERTIES.aqua) : ENERGY_PROPERTIES.aqua;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none relative overflow-x-hidden font-sans">
      {/* Sticky Premium Header Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 px-4 md:px-8 py-3 transition-all shadow-xl">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={() => {
              soundEngine.playButtonClick();
              onBack();
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-4 py-2 rounded-2xl text-xs font-bold text-slate-200 hover:text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-md shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Main Menu</span>
          </button>

          {/* Overall Stats Pill Bar */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1">
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-2xl text-xs font-black text-amber-400 shadow-sm shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{totalWorldStarsEarned} / {maxPossibleStars} ★</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-emerald-500/30 px-3 py-1.5 rounded-2xl text-xs font-black text-emerald-400 shadow-sm shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{levelsCompletedCount} / {totalLevels} Passed</span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-slate-900/90 border border-cyan-500/30 px-3 py-1.5 rounded-2xl text-xs font-black text-cyan-400 shadow-sm shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{overallCompletionPercentage}% World Cleared</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/30 px-3 py-1.5 rounded-2xl text-xs font-black text-amber-300 shadow-sm shrink-0">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{profile.coins}</span>
            </div>
          </div>

          {/* Quick World Jump Dropdown & Audio Toggle */}
          <div className="flex items-center gap-2 shrink-0 relative">
            <button
              onClick={() => setWorldJumpOpen(!worldJumpOpen)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-cyan-500/30 px-3.5 py-2 rounded-2xl text-xs font-extrabold text-cyan-300 transition-all cursor-pointer shadow-md"
            >
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">World Select</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${worldJumpOpen ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={() => {
                const muted = soundEngine.toggleMute();
                setIsAudioMuted(muted);
              }}
              className="p-2 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Toggle Audio"
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Quick Navigation Dropdown Menu */}
            {worldJumpOpen && (
              <div className="absolute right-0 top-12 w-64 bg-slate-900/95 border border-cyan-500/30 rounded-2xl p-2 shadow-2xl backdrop-blur-2xl z-50 animate-scale-up space-y-1 max-h-80 overflow-y-auto">
                <span className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 block tracking-wider">
                  Jump to World
                </span>
                {WORLD_THEMES.map((world) => {
                  const reqStars = world.requiredStars || 0;
                  const isUnlocked = world.unlockedByDefault || totalWorldStarsEarned >= reqStars;
                  const prop = ENERGY_PROPERTIES[world.energyType || 'aqua'] || ENERGY_PROPERTIES.aqua;

                  return (
                    <button
                      key={world.id}
                      onClick={() => isUnlocked && scrollToWorld(world.id)}
                      disabled={!isUnlocked}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs font-extrabold transition-all cursor-pointer ${
                        isUnlocked
                          ? 'hover:bg-slate-800 text-slate-200 hover:text-white'
                          : 'opacity-40 cursor-not-allowed text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-base">{world.emoji || '💧'}</span>
                        <span className="truncate">{world.name}</span>
                      </div>
                      {!isUnlocked ? (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-black shrink-0">
                          <Lock className="w-3 h-3" /> {reqStars}★
                        </span>
                      ) : (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ color: prop.color, backgroundColor: `${prop.color}15` }}>
                          W0{world.id}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Vertical Scrolling Map Timeline */}
      <main className="w-full max-w-4xl mx-auto px-4 py-8 space-y-16 pb-36">
        {WORLD_THEMES.map((world, worldIdx) => {
          const reqStars = world.requiredStars || 0;
          const isWorldUnlocked = world.unlockedByDefault || totalWorldStarsEarned >= reqStars;
          const worldLevels = HANDCRAFTED_LEVELS.filter((l) => l.worldId === world.id);
          const worldProp = ENERGY_PROPERTIES[world.energyType || 'aqua'] || ENERGY_PROPERTIES.aqua;

          // World completion metrics
          const worldStarsEarned = worldLevels.reduce((sum, lvl) => sum + (profile.stars[lvl.id] || 0), 0);
          const worldMaxStars = worldLevels.length * 3;
          const worldPercentage = Math.round((worldStarsEarned / worldMaxStars) * 100) || 0;
          const worldLevelsPassed = worldLevels.filter((lvl) => profile.stars[lvl.id] !== undefined).length;

          return (
            <section
              key={world.id}
              ref={(el) => (worldRefs.current[world.id] = el)}
              className="relative rounded-3xl transition-all"
            >
              {/* Themed World Header Card */}
              <div
                className={`relative rounded-3xl border p-6 md:p-8 backdrop-blur-2xl overflow-hidden shadow-2xl transition-all ${
                  isWorldUnlocked
                    ? 'bg-slate-900/80 border-slate-700/80'
                    : 'bg-slate-950/60 border-slate-800/40 opacity-75'
                }`}
                style={isWorldUnlocked ? { borderColor: `${worldProp.color}40` } : undefined}
              >
                {/* Ambient Themed Glow Aura */}
                <div
                  className="absolute -top-12 -right-12 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20"
                  style={{ backgroundColor: worldProp.color }}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-xl">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{world.emoji || '💧'}</span>
                      <span
                        className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border"
                        style={{ borderColor: `${worldProp.color}50`, color: worldProp.color, backgroundColor: `${worldProp.color}15` }}
                      >
                        WORLD 0{world.id}
                      </span>
                      {!isWorldUnlocked && (
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full">
                          <Lock className="w-3.5 h-3.5" /> Requires {reqStars} Total Stars
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-100">
                      {world.name}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400 leading-relaxed">
                      {world.description}
                    </p>
                  </div>

                  {/* World Star & Completion Progress Box */}
                  <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 min-w-[220px] shrink-0 space-y-2.5 shadow-inner">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400">World Star Rank:</span>
                      <span className="font-extrabold text-amber-400">{worldStarsEarned} / {worldMaxStars} ★</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 rounded-full"
                        style={{
                          width: `${worldPercentage}%`,
                          backgroundColor: worldProp.color,
                          boxShadow: `0 0 10px ${worldProp.color}`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>{worldLevelsPassed} / {worldLevels.length} Levels Passed</span>
                      <span className="font-extrabold" style={{ color: worldProp.color }}>{worldPercentage}%</span>
                    </div>
                  </div>
                </div>

                {/* Locked World Watermark Banner */}
                {!isWorldUnlocked && (
                  <div className="mt-6 bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 text-center text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Earn {reqStars - totalWorldStarsEarned} more stars in previous worlds to unlock {world.name}!</span>
                  </div>
                )}
              </div>

              {/* Serpentine Level Node Trail Section */}
              <div className="relative my-10 py-6 px-4 flex flex-col items-center gap-12">
                {/* SVG Connecting Energy Stream Line */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-visible">
                  <defs>
                    <linearGradient id={`grad_w${world.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={worldProp.color} stopOpacity="0.8" />
                      <stop offset="100%" stopColor={worldProp.secondaryColor} stopOpacity="0.4" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Render 20 Level Nodes in Winding Serpentine Pattern */}
                <div className="w-full space-y-12 relative z-10">
                  {worldLevels.map((lvl, idx) => {
                    const starsEarned = profile.stars[lvl.id] || 0;
                    const isPassed = profile.stars[lvl.id] !== undefined;
                    const isPerfect = starsEarned === 3;

                    // Unlocking logic: Level 1 of World 1 or explicit unlock or passed previous level
                    const isLevelUnlocked =
                      isWorldUnlocked &&
                      (lvl.levelNumber === 1 ||
                        profile.unlockedLevels.includes(lvl.id) ||
                        profile.stars[`w${world.id}_l${lvl.levelNumber - 1}`] !== undefined);

                    const isSelected = selectedLevelId === lvl.id;

                    // Horizontal Winding Offsets (Serpentine Path: center -> left -> center -> right -> center)
                    const offsetPattern = [
                      'justify-center',
                      'justify-start sm:pl-20',
                      'justify-center',
                      'justify-end sm:pr-20',
                    ];
                    const alignmentClass = offsetPattern[idx % offsetPattern.length];

                    return (
                      <div key={lvl.id} className={`w-full flex ${alignmentClass} relative`}>
                        <div className="flex flex-col items-center">
                          {/* Level Node Button */}
                          <button
                            ref={isSelected ? activeLevelNodeRef : undefined}
                            onClick={() => handleLevelClick(lvl, isLevelUnlocked)}
                            disabled={!isLevelUnlocked}
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 relative group cursor-pointer ${
                              isSelected
                                ? 'scale-115 shadow-[0_0_30px_rgba(0,240,255,0.6)] z-20 animate-pulse'
                                : isPerfect
                                ? 'bg-amber-950/80 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] hover:scale-108'
                                : isPassed
                                ? 'bg-slate-900/90 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:scale-108'
                                : isLevelUnlocked
                                ? 'bg-slate-900/90 border-cyan-400/80 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:scale-108'
                                : 'bg-slate-950/80 border-slate-800 opacity-40 cursor-not-allowed scale-95'
                            }`}
                            style={{
                              borderColor: isSelected
                                ? '#00f0ff'
                                : isPerfect
                                ? '#fbbf24'
                                : isPassed
                                ? '#34d399'
                                : isLevelUnlocked
                                ? worldProp.color
                                : '#334155',
                            }}
                          >
                            {/* Selected Active Glow Halo Ring */}
                            {isSelected && (
                              <span
                                className="absolute -inset-2 rounded-3xl border-2 border-cyan-400 animate-ping opacity-75 pointer-events-none"
                              />
                            )}

                            {/* Node Core Icon & Level Number */}
                            {isLevelUnlocked ? (
                              <>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-0.5">
                                  Lvl {lvl.levelNumber}
                                </span>
                                {isPerfect ? (
                                  <Crown className="w-5 h-5 text-amber-400 fill-amber-400 animate-bounce" />
                                ) : isPassed ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Play className="w-5 h-5 ml-0.5 text-cyan-400 fill-cyan-400 group-hover:scale-110 transition-transform" />
                                )}
                              </>
                            ) : (
                              <Lock className="w-5 h-5 text-slate-600" />
                            )}

                            {/* Boss Level Badge Indicator for Level 10 & 20 */}
                            {(lvl.levelNumber === 10 || lvl.levelNumber === 20) && (
                              <span className="absolute -top-2.5 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-md">
                                BOSS
                              </span>
                            )}
                          </button>

                          {/* Level Star Rating Beneath Node */}
                          {isLevelUnlocked && (
                            <div className="flex items-center gap-1 mt-2.5 bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full shadow-sm">
                              {[1, 2, 3].map((starIdx) => (
                                <Star
                                  key={starIdx}
                                  className={`w-3.5 h-3.5 transition-all ${
                                    starIdx <= starsEarned
                                      ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                                      : 'text-slate-800'
                                  }`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Title Label */}
                          <span className={`text-[11px] font-extrabold mt-1 max-w-[110px] truncate text-center ${isSelected ? 'text-cyan-300 font-black' : isLevelUnlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                            {lvl.title}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating Level Preview Drawer / Modal Bar */}
      {selectedLevel && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-900/95 border-t border-cyan-500/30 p-4 md:p-6 backdrop-blur-2xl shadow-2xl animate-slide-up">
          <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Level Info Summary */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div
                className="w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg"
                style={{ borderColor: `${selectedLevelProp.color}60`, backgroundColor: `${selectedLevelProp.color}20` }}
              >
                {renderWorldIcon(WORLD_THEMES.find((w) => w.id === selectedLevel.worldId)?.icon || 'Sparkles', 'w-7 h-7 text-cyan-300')}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: selectedLevelProp.color, borderColor: `${selectedLevelProp.color}40`, backgroundColor: `${selectedLevelProp.color}15` }}>
                    World {selectedLevel.worldId} • Level {selectedLevel.levelNumber}
                  </span>
                  <span className="text-xs font-extrabold text-amber-400">
                    Earned: {profile.stars[selectedLevel.id] || 0} / 3 ★
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-100">{selectedLevel.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-1 max-w-lg">
                  {selectedLevel.description}
                </p>
              </div>
            </div>

            {/* Action Play Button */}
            <button
              onClick={() => handlePlayLevel(selectedLevel)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 hover:from-cyan-300 hover:to-indigo-500 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-sm shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>LAUNCH PUZZLE</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
