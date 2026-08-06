export type EnergyType =
  | 'aqua'
  | 'plasma'
  | 'cryo'
  | 'electric'
  | 'nature'
  | 'gravity'
  | 'light'
  | 'shadow'
  | 'quantum';

export interface EnergyProperty {
  type: EnergyType;
  name: string;
  color: string;
  glowColor: string;
  secondaryColor: string;
  description: string;
  particleEffect: string;
}

export type ObstacleType =
  | 'ramp'
  | 'portal'
  | 'rotator'
  | 'fan'
  | 'gravityZone'
  | 'magnet'
  | 'laser'
  | 'mirror'
  | 'lightSensor'
  | 'switch'
  | 'door'
  | 'breakableWood'
  | 'breakableIce'
  | 'spring'
  | 'gear'
  | 'vine'
  | 'shadowPortal';

export interface Point2D {
  x: number;
  y: number;
}

export interface Obstacle {
  id: string;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // radians
  isStatic?: boolean;
  speed?: number;
  targetX?: number;
  targetY?: number;
  connectedId?: string; // e.g. Portal B ID or Switch target Door ID
  color?: string;
  state?: 'normal' | 'active' | 'broken' | 'open' | 'frozen' | 'grown';
  extraData?: {
    force?: number;
    angle?: number;
    gravityX?: number;
    gravityY?: number;
    magneticPolarity?: 'attract' | 'repel';
    laserAngle?: number;
    isPowered?: boolean;
    vineLength?: number;
  };
}

export interface Container {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  targetCount: number;
  currentCount?: number;
  requiredType?: EnergyType;
  color?: string;
  isFull?: boolean;
}

export interface Drop {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  energyType: EnergyType;
  state: 'active' | 'collected' | 'lost' | 'frozen';
  color: string;
  glowColor: string;
  opacity: number;
  life: number;
  trail: Point2D[];
  portalCooldown?: number;
}

export interface DrawnLine {
  points: Point2D[];
  totalLength: number;
  color: string;
  thickness: number;
  trailStyle?: string;
}

export interface LevelHint {
  targetArea?: { x: number; y: number; radius: number; label?: string };
  directionArrow?: { from: Point2D; to: Point2D; label?: string };
  guideLinePoints?: Point2D[];
}

export interface Level {
  id: string;
  title: string;
  worldId: number;
  levelNumber: number;
  theme: string;
  description: string;
  energyType: EnergyType;
  secondaryEnergyType?: EnergyType;
  dropCount: number;
  dropSpawn: Point2D;
  containers: Container[];
  obstacles: Obstacle[];
  parLineLength: number; // for star calculation
  hintText?: string;
  hintData?: LevelHint;
  storyLore?: string;
}

export interface WorldTheme {
  id: number;
  name: string;
  subtitle: string;
  bgGradient: string;
  accentColor: string;
  cardBorder: string;
  icon: string;
  emoji?: string;
  description: string;
  unlockedByDefault?: boolean;
  requiredStars?: number;
  energyType?: EnergyType;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  category: 'trail' | 'skin' | 'theme' | 'effect' | 'ink_capacity';
  price: number;
  previewColor: string;
  description: string;
  isOwned: boolean;
  isSelected: boolean;
}

export interface PlayerProfile {
  coins: number;
  unlockedLevels: string[];
  stars: Record<string, number>; // levelId -> stars (1-3)
  highScores: Record<string, number>; // levelId -> score
  selectedTrail: string;
  selectedTheme: AppThemeMode;
  selectedSkin: string;
  selectedEffect?: string;
  inkCapacityLevel?: number; // 0 = standard, 1 = +25%, 2 = +50%, 3 = +100%, 4 = infinite
  ownedItems: string[];
  achievements: Record<string, boolean>;
  dailyStreak: number;
  lastDailyDate: string;
  stats: {
    totalDropsGuided: number;
    levelsCompleted: number;
    totalLinesDrawn: number;
    totalStarsEarned: number;
    highestStreak?: number;
    totalRetries?: number;
    totalDrawDistance?: number;
    totalPlayTime?: number;
    perfectFirstTryLevels?: number;
  };
}

export type AppThemeMode =
  | 'neon_dark'
  | 'monochrome'
  | 'minimal_white'
  | 'cyber'
  | 'sunset'
  | 'forest'
  | 'ice'
  | 'space'
  | 'lava';

export interface GameSettings {
  sfxVolume: number;
  musicVolume: number;
  hapticsEnabled: boolean;
  colorblindMode: boolean;
  particleIntensity: 'low' | 'medium' | 'high';
  lineThickness: number;
  appTheme: AppThemeMode;
  fpsTarget: 60 | 120;
  batterySaver: boolean;
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh';
  leftHandedMode: boolean;
}
