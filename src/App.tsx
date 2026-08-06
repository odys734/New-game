import React, { useEffect, useState } from 'react';
import {
  Play,
  Trophy,
  Calendar,
  Bot,
  ShoppingBag,
  Sliders,
  Award,
  Sparkles,
  User,
  Flame,
  Star,
  Zap,
} from 'lucide-react';
import { GameSettings, Level, PlayerProfile } from './types/game';
import { PhysicsEngine } from './engine/physicsEngine';
import { soundEngine } from './engine/soundEngine';
import { ENERGY_PROPERTIES } from './data/energyProperties';
import { HANDCRAFTED_LEVELS } from './data/handcraftedLevels';
import { GameCanvas } from './components/GameCanvas';
import { GameUI } from './components/GameUI';
import { WorldSelect } from './components/WorldSelect';
import { DailyWeeklyModal } from './components/DailyWeeklyModal';
import { EndlessModeModal } from './components/EndlessModeModal';
import { ShopModal } from './components/ShopModal';
import { AchievementsModal } from './components/AchievementsModal';
import { SettingsModal } from './components/SettingsModal';
import { ProfileModal } from './components/ProfileModal';
import { RewardedAdModal } from './components/RewardedAdModal';
import { OfflineOverlay } from './components/OfflineOverlay';

const DEFAULT_PROFILE: PlayerProfile = {
  coins: 500,
  unlockedLevels: ['w1_l1'],
  stars: {},
  highScores: {},
  selectedTrail: 'trail_default',
  selectedTheme: 'neon_dark',
  selectedSkin: 'skin_classic',
  ownedItems: ['trail_default', 'skin_classic', 'theme_neon_dark', 'effect_spark'],
  achievements: {},
  dailyStreak: 1,
  lastDailyDate: '',
  stats: {
    totalDropsGuided: 0,
    levelsCompleted: 0,
    totalLinesDrawn: 0,
    totalStarsEarned: 0,
    highestStreak: 1,
    totalRetries: 0,
    totalDrawDistance: 0,
    totalPlayTime: 0,
    perfectFirstTryLevels: 0,
  },
};

const DEFAULT_SETTINGS: GameSettings = {
  sfxVolume: 0.8,
  musicVolume: 0.4,
  hapticsEnabled: true,
  colorblindMode: false,
  particleIntensity: 'medium',
  lineThickness: 8,
  appTheme: 'neon_dark',
  fpsTarget: 60,
  batterySaver: false,
  language: 'en',
  leftHandedMode: false,
};

export default function App() {
  const [view, setView] = useState<
    'menu' | 'world_select' | 'game' | 'daily_weekly' | 'endless' | 'shop' | 'achievements' | 'settings' | 'profile'
  >('menu');

  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('liquid_logic_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          stats: {
            ...DEFAULT_PROFILE.stats,
            ...(parsed.stats || {}),
          },
        };
      } catch (e) {
        console.error('Failed parsing profile', e);
      }
    }
    return DEFAULT_PROFILE;
  });

  const [settings, setSettings] = useState<GameSettings>(() => {
    const saved = localStorage.getItem('liquid_logic_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [currentLevel, setCurrentLevel] = useState<Level | null>(null);
  const [physicsEngine] = useState<PhysicsEngine>(() => new PhysicsEngine(800, 600));

  const [hasLine, setHasLine] = useState<boolean>(false);
  const [levelAttemptCount, setLevelAttemptCount] = useState<number>(1);
  const [completionData, setCompletionData] = useState<{
    isSuccess: boolean;
    stars: number;
    isFirstAttempt?: boolean;
    claimedAdBonus?: boolean;
  } | null>(null);

  // Active Modals
  const [showRewardedAdModal, setShowRewardedAdModal] = useState<boolean>(false);
  const [adRewardConfig, setAdRewardConfig] = useState<{ title: string; amount: number; unit?: string; callback: () => void } | null>(null);

  // Lifetime Play Time Accumulator
  useEffect(() => {
    const interval = setInterval(() => {
      setProfile((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalPlayTime: (prev.stats.totalPlayTime || 0) + 5,
        },
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Keep settings.appTheme synced instantly with profile.selectedTheme when changed from Shop
  useEffect(() => {
    if (profile.selectedTheme && settings.appTheme !== profile.selectedTheme) {
      setSettings((prev) => ({ ...prev, appTheme: profile.selectedTheme }));
    }
  }, [profile.selectedTheme]);

  // Save profile to localStorage
  useEffect(() => {
    localStorage.setItem('liquid_logic_profile', JSON.stringify(profile));
  }, [profile]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('liquid_logic_settings', JSON.stringify(settings));
    soundEngine.setVolumes(settings.sfxVolume, settings.musicVolume);
  }, [settings]);

  const handleStartLevel = (level: Level) => {
    if (!isOnline) {
      alert('An active internet connection is required to play.');
      return;
    }

    setCurrentLevel(level);
    setCompletionData(null);
    setHasLine(false);
    setLevelAttemptCount(1);
    setView('game');
  };

  const handleSimulationFinished = (isSuccess: boolean, stars: number) => {
    if (!isSuccess) {
      soundEngine.playBreakObject();
      setCompletionData({ isSuccess: false, stars: 0 });
      setProfile((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalRetries: (prev.stats.totalRetries || 0) + 1,
        },
      }));
      return;
    }

    if (isSuccess && currentLevel) {
      soundEngine.playVictoryFanfare();
      const isFirstAttempt = levelAttemptCount === 1;

      // Reward Calculation: 3 Stars = 60 Coins, 2 Stars = 40 Coins, 1 Star = 20 Coins
      const starCoins = stars === 3 ? 60 : stars === 2 ? 40 : 20;
      const firstTryBonus = isFirstAttempt ? 20 : 0;
      const earnedCoins = starCoins + firstTryBonus;

      const prevStars = profile.stars[currentLevel.id] || 0;
      const newStars = Math.max(prevStars, stars);
      const starDiff = newStars - prevStars;

      setCompletionData({
        isSuccess: true,
        stars,
        isFirstAttempt,
        claimedAdBonus: false,
      });

      const updatedProfile = {
        ...profile,
        coins: profile.coins + earnedCoins,
        stars: {
          ...profile.stars,
          [currentLevel.id]: newStars,
        },
        unlockedLevels: Array.from(new Set([...profile.unlockedLevels, currentLevel.id])),
        stats: {
          ...profile.stats,
          levelsCompleted: profile.stats.levelsCompleted + 1,
          totalStarsEarned: profile.stats.totalStarsEarned + starDiff,
          totalLinesDrawn: profile.stats.totalLinesDrawn + 1,
          perfectFirstTryLevels: (profile.stats.perfectFirstTryLevels || 0) + (isFirstAttempt ? 1 : 0),
        },
      };
      setProfile(updatedProfile);
    }
  };

  const handleNextLevel = () => {
    if (!currentLevel) return;
    const currentIdx = HANDCRAFTED_LEVELS.findIndex((l) => l.id === currentLevel.id);
    if (currentIdx !== -1 && currentIdx < HANDCRAFTED_LEVELS.length - 1) {
      const nextLvl = HANDCRAFTED_LEVELS[currentIdx + 1];
      handleStartLevel(nextLvl);
    } else {
      setView('world_select');
    }
  };

  const handleRestartLevel = () => {
    setLevelAttemptCount((prev) => prev + 1);
    physicsEngine.clearDrawnLines();
    if (currentLevel) {
      physicsEngine.resetSimulation(currentLevel.dropSpawn);
    }
    setCompletionData(null);
    setHasLine(false);
    setProfile((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        totalRetries: (prev.stats.totalRetries || 0) + 1,
      },
    }));
  };

  const handleSkipLevel = () => {
    if (!currentLevel) return;
    setAdRewardConfig({
      title: `Watch Sponsor Stream to Skip ${currentLevel.title}`,
      amount: 1,
      unit: 'Level Skip',
      callback: () => {
        const updatedProfile = {
          ...profile,
          unlockedLevels: Array.from(new Set([...profile.unlockedLevels, currentLevel.id])),
        };
        setProfile(updatedProfile);
        handleNextLevel();
      },
    });
    setShowRewardedAdModal(true);
  };

  const handleTriggerRewardedAd = (title: string, amount: number, callback: () => void) => {
    setAdRewardConfig({ title, amount, unit: 'Coins', callback });
    setShowRewardedAdModal(true);
  };

  const handleClaimDailyReward = (coins: number, streakDay: number, rewardItemId?: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newStreak = streakDay + 1;

    setProfile((prev) => ({
      ...prev,
      coins: prev.coins + coins,
      dailyStreak: newStreak,
      lastDailyDate: todayStr,
      ownedItems: rewardItemId && !prev.ownedItems.includes(rewardItemId)
        ? [...prev.ownedItems, rewardItemId]
        : prev.ownedItems,
      stats: {
        ...prev.stats,
        highestStreak: Math.max(prev.stats.highestStreak || 1, newStreak),
      },
    }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 font-sans antialiased select-none flex flex-col justify-between overflow-x-hidden relative">
      {/* Background Animated Glow Spheres Tailored to Active World Energy */}
      <div
        className="fixed -top-40 -left-40 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 animate-pulse-glow"
        style={{
          backgroundColor: currentLevel
            ? ENERGY_PROPERTIES[currentLevel.energyType]?.glowColor || 'rgba(0, 240, 255, 0.15)'
            : 'rgba(0, 240, 255, 0.15)',
        }}
      />
      <div
        className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-colors duration-700 animate-pulse-glow"
        style={{
          backgroundColor: currentLevel
            ? ENERGY_PROPERTIES[currentLevel.energyType]?.secondaryColor || 'rgba(59, 130, 246, 0.15)'
            : 'rgba(59, 130, 246, 0.15)',
        }}
      />
      {/* Offline Alert Overlay */}
      {!isOnline && <OfflineOverlay onRetry={() => setIsOnline(navigator.onLine)} />}

      {/* MAIN MENU VIEW */}
      {view === 'menu' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto w-full my-auto">
          {/* Hero Branding Badge */}
          <div className="inline-flex items-center gap-2 bg-slate-900/90 border border-cyan-500/30 px-4 py-1.5 rounded-full text-xs font-bold text-cyan-400 mb-6 shadow-lg shadow-cyan-950/50 animate-pulse">
            <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span>Liquid Physics Puzzle Engine</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 mb-3 tracking-tight">
            Liquid Logic
          </h1>
          <p className="text-sm font-medium text-slate-400 max-w-sm mb-8 leading-relaxed">
            Guide futuristic Energy Liquids into glass receptacles by drawing continuous physics lines.
          </p>

          {/* Stats Bar with Profile Career Button */}
          <div className="w-full grid grid-cols-4 items-center bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl mb-8 divide-x divide-slate-800">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-extrabold text-slate-400">Stars</span>
              <span className="font-extrabold text-sm text-amber-400">{profile.stats.totalStarsEarned} ★</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-extrabold text-slate-400">Coins</span>
              <span className="font-extrabold text-sm text-cyan-400">{profile.coins}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-extrabold text-slate-400">Streak</span>
              <span className="font-extrabold text-sm text-emerald-400">{profile.dailyStreak}d</span>
            </div>
            <button
              onClick={() => setView('profile')}
              className="flex flex-col items-center hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <span className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-cyan-400" /> Career
              </span>
              <span className="font-extrabold text-xs text-cyan-400">Profile</span>
            </button>
          </div>

          {/* Main Action Buttons */}
          <div className="w-full space-y-3.5">
            <button
              onClick={() => {
                soundEngine.startAmbientPad();
                setView('world_select');
              }}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black py-4 rounded-2xl text-base shadow-xl shadow-cyan-500/25 active:scale-98 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>Story Campaign</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setView('daily_weekly')}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3.5 rounded-2xl text-xs transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Live Events</span>
              </button>

              <button
                onClick={() => setView('endless')}
                className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold py-3.5 rounded-2xl text-xs transition-all cursor-pointer"
              >
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Endless AI</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setView('shop')}
                className="flex flex-col items-center justify-center gap-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-3 rounded-2xl text-xs text-slate-300 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                <span>Shop</span>
              </button>

              <button
                onClick={() => setView('achievements')}
                className="flex flex-col items-center justify-center gap-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-3 rounded-2xl text-xs text-slate-300 cursor-pointer"
              >
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Trophies</span>
              </button>

              <button
                onClick={() => setView('settings')}
                className="flex flex-col items-center justify-center gap-1 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 p-3 rounded-2xl text-xs text-slate-300 cursor-pointer"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORLD SELECT CAMPAIGN VIEW */}
      {view === 'world_select' && (
        <WorldSelect
          profile={profile}
          onSelectLevel={handleStartLevel}
          onBack={() => setView('menu')}
        />
      )}

      {/* GAMEPLAY VIEW - TRUE FULLSCREEN EXPERIENCE */}
      {view === 'game' && currentLevel && (
        <div className="fixed inset-0 z-20 flex flex-col w-screen h-screen overflow-hidden bg-slate-950 select-none">
          <GameUI
            level={currentLevel}
            profile={profile}
            hasLine={hasLine}
            isSimulating={physicsEngine.isSimulating}
            onUndo={() => {
              physicsEngine.removeLastDrawnLine();
              setHasLine(physicsEngine.drawnLines.length > 0);
            }}
            onRestart={handleRestartLevel}
            onSkipLevel={handleSkipLevel}
            onBackToMenu={() => setView('world_select')}
            onNextLevel={handleNextLevel}
            completionData={completionData}
            onWatchRewardedAd={() =>
              handleTriggerRewardedAd('Completion Bonus Ad Boost', 100, () => {
                setProfile((prev) => ({ ...prev, coins: prev.coins + 100 }));
                setCompletionData((prev) => (prev ? { ...prev, claimedAdBonus: true } : null));
              })
            }
            appTheme={settings.appTheme}
            leftHandedMode={settings.leftHandedMode}
          />

          <GameCanvas
            key={currentLevel.id}
            level={currentLevel}
            physicsEngine={physicsEngine}
            onSimulationFinished={handleSimulationFinished}
            onLineDrawnChange={setHasLine}
            colorblindMode={settings.colorblindMode}
            particleIntensity={settings.batterySaver ? 'low' : settings.particleIntensity}
            lineThickness={settings.lineThickness}
            selectedTrailColor={profile.selectedTrail}
            selectedSkin={profile.selectedSkin}
            selectedEffect={profile.selectedEffect}
            inkCapacityLevel={profile.inkCapacityLevel || 0}
            appTheme={settings.appTheme}
          />
        </div>
      )}

      {/* DAILY & WEEKLY EVENTS MODAL */}
      {view === 'daily_weekly' && (
        <DailyWeeklyModal
          profile={profile}
          onSelectDailyLevel={(lvl) => handleStartLevel(lvl)}
          onSelectWeeklyLevel={(lvl) => handleStartLevel(lvl)}
          onClaimDailyReward={handleClaimDailyReward}
          onClose={() => setView('menu')}
        />
      )}

      {/* PLAYER CAREER PROFILE MODAL */}
      {view === 'profile' && (
        <ProfileModal
          profile={profile}
          onClose={() => setView('menu')}
        />
      )}

      {/* ENDLESS AI MODE MODAL */}
      {view === 'endless' && (
        <EndlessModeModal
          onStartEndlessLevel={(lvl) => handleStartLevel(lvl)}
          onClose={() => setView('menu')}
        />
      )}

      {/* SHOP MODAL */}
      {view === 'shop' && (
        <ShopModal
          profile={profile}
          onUpdateProfile={(updated) => setProfile((prev) => ({ ...prev, ...updated }))}
          onClose={() => setView('menu')}
        />
      )}

      {/* ACHIEVEMENTS MODAL */}
      {view === 'achievements' && (
        <AchievementsModal
          profile={profile}
          onClaimReward={(achId, rewardCoins) => {
            setProfile((prev) => ({
              ...prev,
              coins: prev.coins + rewardCoins,
              achievements: { ...prev.achievements, [achId]: true },
            }));
          }}
          onClose={() => setView('menu')}
        />
      )}

      {/* SETTINGS MODAL */}
      {view === 'settings' && (
        <SettingsModal
          settings={settings}
          profile={profile}
          onUpdateSettings={(updated) => setSettings((prev) => ({ ...prev, ...updated }))}
          onImportCloudSave={(jsonStr) => {
            const data = JSON.parse(jsonStr);
            if (data.profile) setProfile(data.profile);
            if (data.settings) setSettings(data.settings);
          }}
          onClose={() => setView('menu')}
        />
      )}

      {/* REWARDED AD MODAL */}
      {showRewardedAdModal && adRewardConfig && (
        <RewardedAdModal
          rewardTitle={adRewardConfig.title}
          rewardAmount={adRewardConfig.amount}
          rewardUnit={adRewardConfig.unit || 'Coins'}
          onComplete={() => {
            adRewardConfig.callback();
            setShowRewardedAdModal(false);
            setAdRewardConfig(null);
          }}
          onCancel={() => {
            setShowRewardedAdModal(false);
            setAdRewardConfig(null);
          }}
        />
      )}
    </div>
  );
}
