import { Level, WorldTheme, EnergyType, Obstacle } from '../types/game';

export const WORLD_THEMES: WorldTheme[] = [
  {
    id: 1,
    name: 'Aqua Energy (Tutorial)',
    subtitle: 'Cyberpunk Laboratory & Flow Basics',
    bgGradient: 'from-slate-950 via-cyan-950 to-slate-900',
    accentColor: '#00f0ff',
    cardBorder: 'border-cyan-500/40',
    icon: 'Droplets',
    emoji: '🌊',
    description: 'Master the fundamentals of drawing continuous fluid physics lines, ramps, and deflections.',
    unlockedByDefault: true,
    requiredStars: 0,
    energyType: 'aqua',
  },
  {
    id: 2,
    name: 'Plasma Energy',
    subtitle: 'Thermal Ignition & Wood Burning',
    bgGradient: 'from-slate-950 via-amber-950 to-orange-950',
    accentColor: '#ff6b00',
    cardBorder: 'border-amber-500/40',
    icon: 'Flame',
    emoji: '🔥',
    description: 'Ignite plasma streams to instantly burn through organic wood barriers and obstacles.',
    requiredStars: 10,
    energyType: 'plasma',
  },
  {
    id: 3,
    name: 'Cryo Energy',
    subtitle: 'Frozen Oceans & Sub-Zero Ice',
    bgGradient: 'from-slate-950 via-blue-950 to-cyan-950',
    accentColor: '#38bdf8',
    cardBorder: 'border-blue-500/40',
    icon: 'Snowflake',
    emoji: '❄️',
    description: 'Freeze obstacles into slick sub-zero ice bridges and navigate frost channels.',
    requiredStars: 25,
    energyType: 'cryo',
  },
  {
    id: 4,
    name: 'Electric Energy',
    subtitle: 'Cyber Grid & Motorized Circuits',
    bgGradient: 'from-slate-950 via-yellow-950 to-slate-900',
    accentColor: '#eab308',
    cardBorder: 'border-yellow-500/40',
    icon: 'Zap',
    emoji: '⚡',
    description: 'Power up electric switches, motorized gear wheels, and high-tech security doors.',
    requiredStars: 45,
    energyType: 'electric',
  },
  {
    id: 5,
    name: 'Nature Energy',
    subtitle: 'Bio-Dome Vines & Growth Ramps',
    bgGradient: 'from-slate-950 via-emerald-950 to-green-950',
    accentColor: '#10b981',
    cardBorder: 'border-emerald-500/40',
    icon: 'Sprout',
    emoji: '🌿',
    description: 'Nurture living bio-vines that expand into organic eco-bridges and natural ramps.',
    requiredStars: 65,
    energyType: 'nature',
  },
  {
    id: 6,
    name: 'Gravity Energy',
    subtitle: 'Gravitational Wells & Inversion',
    bgGradient: 'from-slate-950 via-purple-950 to-slate-900',
    accentColor: '#a855f7',
    cardBorder: 'border-purple-500/40',
    icon: 'Orbit',
    emoji: '🪐',
    description: 'Manipulate quantum gravity zones to send liquid streams defying gravity upwards.',
    requiredStars: 90,
    energyType: 'gravity',
  },
  {
    id: 7,
    name: 'Light Energy',
    subtitle: 'Optical Mirrors & Refraction',
    bgGradient: 'from-slate-950 via-pink-950 to-slate-900',
    accentColor: '#ec4899',
    cardBorder: 'border-pink-500/40',
    icon: 'Sun',
    emoji: '💡',
    description: 'Reflect and refract high-energy photon beams off precision optical mirror arrays.',
    requiredStars: 115,
    energyType: 'light',
  },
  {
    id: 8,
    name: 'Shadow Energy',
    subtitle: 'Void Gates & Dark Matter',
    bgGradient: 'from-slate-950 via-indigo-950 to-slate-950',
    accentColor: '#6366f1',
    cardBorder: 'border-indigo-500/40',
    icon: 'Moon',
    emoji: '🌑',
    description: 'Phase through dark matter void gateways and navigate shadow teleportation chambers.',
    requiredStars: 140,
    energyType: 'shadow',
  },
  {
    id: 9,
    name: 'Quantum Energy',
    subtitle: 'Quantum Singularity & Portal Weaving',
    bgGradient: 'from-slate-950 via-violet-950 to-slate-950',
    accentColor: '#8b5cf6',
    cardBorder: 'border-violet-500/40',
    icon: 'Atom',
    emoji: '🌌',
    description: 'Weave through dual-energy quantum entanglement and multi-dimensional warp channels.',
    requiredStars: 170,
    energyType: 'quantum',
  },
  {
    id: 10,
    name: 'Master Challenges',
    subtitle: 'The Grandmaster Trial & Overdrive',
    bgGradient: 'from-slate-950 via-amber-950 to-purple-950',
    accentColor: '#f59e0b',
    cardBorder: 'border-amber-400/60',
    icon: 'Crown',
    emoji: '👑',
    description: 'The pinnacle of physics logic! Complex multi-receptacle, multi-obstacle master trials.',
    requiredStars: 200,
    energyType: 'plasma',
  },
];

// Helper level generator for 20 levels per world (200 levels total)
function generateWorldLevels(worldTheme: WorldTheme): Level[] {
  const levels: Level[] = [];
  const primaryEnergy: EnergyType = worldTheme.energyType || 'aqua';

  const levelTitles: Record<number, string[]> = {
    1: ['First Flow', 'Deflection Ramp', 'Curved Funnel', 'Double Fall', 'Pillar Pass', 'Split Stream', 'Chamber Slide', 'Narrow Gap', 'Bounce Angle', 'Precision Drop', 'Zig-Zag Path', 'Thermal Portal', 'Dual Catch', 'Height Drop', 'Obstacle Bypass', 'Speed Flow', 'V-Channel', 'Tight Landing', 'Gravity Slope', 'Laboratory Exam'],
    2: ['Ignition Arc', 'Wood Smelt', 'Thermal Slide', 'Barrier Melt', 'Flaming Funnel', 'Double Wood Pass', 'Plasma Spring', 'Heat Chamber', 'Combustion Wave', 'Flame Portal', 'Lava Ramp', 'Smelt Bridge', 'Dual Flame Vessel', 'Inferno Drop', 'Burn Channel', 'Fire Rotator', 'Plasma Bounce', 'Pyre Switch', 'Melt Gateway', 'Plasma Crucible'],
    3: ['Frost Solidify', 'Ice Bridge', 'Sub-Zero Slope', 'Cryo Slide', 'Frozen Basin', 'Glacier Pass', 'Ice Wall Drop', 'Cold Chamber', 'Frost Portal', 'Cryo Spring', 'Ice Funnel', 'Frost Rotator', 'Dual Frost Vessel', 'Sub-Zero Drift', 'Slick Channel', 'Cryo Gear', 'Glacier Switch', 'Frost Wind', 'Ice Gateway', 'Cryo Citadel'],
    4: ['Electric Switch', 'Circuit Gate', 'Gear Motor', 'Power Junction', 'Voltaic Slide', 'Switch Cascade', 'Gear Propel', 'Door Relay', 'Turbine Wind', 'Voltage Funnel', 'Current Portal', 'Electric Bounce', 'Dual Power Cell', 'High Current Drift', 'Gear Switch Combination', 'Circuit Rotator', 'Amp Passage', 'Overcharge Door', 'Power Matrix', 'Electric Grid Master'],
    5: ['Bio Vine Growth', 'Sprout Ramp', 'Eco Canal', 'Vine Funnel', 'Overgrown Slide', 'Flora Bridge', 'Vine Bounce', 'Bio Portal', 'Leaf Deflection', 'Sprout Switch', 'Eco Portal', 'Vine Rotator', 'Dual Eco Vessel', 'Organic Drift', 'Bio Turbine', 'Nature Magnet', 'Jungle Channel', 'Growth Gateway', 'Flora Overdrive', 'Bio-Dome Nexus'],
    6: ['Gravity Well', 'Inversion Zone', 'Upward Stream', 'Gravity Slingshot', 'Anti-G Slide', 'Zero-G Funnel', 'Vector Flip', 'Gravity Portal', 'Orbit Bounce', 'Gravity Switch', 'Anti-G Rotator', 'Upward Gate', 'Dual Gravity Well', 'Cosmic Drift', 'Gravity Wind', 'Mass Attraction', 'Inversion Bridge', 'Gravity Overdrive', 'Quantum Orbit', 'Gravitational Apex'],
    7: ['Photon Refraction', 'Prism Mirror', 'Light Deflection', 'Optics Slide', 'Solar Funnel', 'Laser Mirror Array', 'Photon Bounce', 'Light Portal', 'Prism Switch', 'Solar Rotator', 'Refraction Channel', 'Optics Gear', 'Dual Solar Core', 'Beam Divergence', 'Photon Wind', 'Light Magnet', 'Prism Gateway', 'Solar Matrix', 'Optics Overdrive', 'Prism Cathedral Boss'],
    8: ['Void Portal', 'Shadow Phase', 'Dark Pass', 'Eclipse Slide', 'Void Funnel', 'Shadow Mirror', 'Dark Bounce', 'Abyss Gateway', 'Shadow Switch', 'Void Rotator', 'Dark Passage', 'Eclipse Gear', 'Dual Void Vessel', 'Shadow Drift', 'Void Wind', 'Dark Magnet', 'Eclipse Gateway', 'Shadow Matrix', 'Void Overdrive', 'Abyss Sovereign Boss'],
    9: ['Quantum Entanglement', 'Warp Portal', 'Singularity Slide', 'Quantum Funnel', 'Dimension Warp', 'Quantum Mirror', 'Entangled Bounce', 'Quantum Gateway', 'Warp Switch', 'Quantum Rotator', 'Singularity Channel', 'Dimension Gear', 'Dual Quantum Vessel', 'Entangled Drift', 'Quantum Wind', 'Space Magnet', 'Warp Matrix', 'Quantum Overdrive', 'Multiverse Portal', 'Quantum Singularity Boss'],
    10: ['Grandmaster Exam I', 'Overdrive Crucible', 'Quad Portal Trial', 'Lava Frost Junction', 'Bio-Electric Synergy', 'Gravity Laser Matrix', 'Shadow Light Paradox', 'Gear Rotator Gauntlet', 'Triple Vessel Challenge', 'Inferno Glacier Storm', 'Anti-G Circuit', 'Optics Void Portal', 'Magnet Turbine Maze', 'Master Switch Gate', 'Elemental Synergy', 'Quantum Crucible', 'Grandmaster Exam II', 'Ultimate Trial 18', 'Ultimate Trial 19', 'The Apex Grandmaster'],
  };

  for (let l = 1; l <= 20; l++) {
    const levelId = `w${worldTheme.id}_l${l}`;
    const titles = levelTitles[worldTheme.id] || levelTitles[1];
    const title = titles[l - 1] || `Trial ${l}`;

    // Calculate spawn coordinates
    const spawnX = (l % 3 === 0) ? 250 : (l % 3 === 1) ? 400 : 550;
    const spawnY = 80 + (l % 2) * 20;

    // Build level obstacles based on world theme and level number
    const obstacles: Obstacle[] = [];

    // Progressive obstacles per world
    if (worldTheme.id === 1) { // Aqua
      if (l > 1) obstacles.push({ id: `r_${l}`, type: 'ramp', x: 350 + (l % 4) * 20, y: 240 + (l % 3) * 30, width: 180, height: 20, rotation: (l % 2 === 0 ? 0.2 : -0.2), isStatic: true, color: '#334155' });
      if (l >= 4) obstacles.push({ id: `p1_${l}`, type: 'portal', x: 200, y: 320, width: 50, height: 50, connectedId: `p2_${l}`, color: '#00f0ff' });
      if (l >= 4) obstacles.push({ id: `p2_${l}`, type: 'portal', x: 600, y: 220, width: 50, height: 50, connectedId: `p1_${l}`, color: '#00f0ff' });
      if (l >= 7) obstacles.push({ id: `sp_${l}`, type: 'spring', x: 400, y: 380, width: 80, height: 24, color: '#f59e0b' });
    } else if (worldTheme.id === 2) { // Plasma
      obstacles.push({ id: `w1_${l}`, type: 'breakableWood', x: 400, y: 260 + (l % 3) * 30, width: 160, height: 24, isStatic: true, color: '#854d0e' });
      if (l >= 5) obstacles.push({ id: `rot_${l}`, type: 'rotator', x: 400, y: 360, width: 160, height: 18, speed: 1.5, color: '#ef4444' });
    } else if (worldTheme.id === 3) { // Cryo
      obstacles.push({ id: `ice_${l}`, type: 'breakableIce', x: 400, y: 280, width: 180, height: 24, isStatic: true, color: '#38bdf8' });
      if (l >= 4) obstacles.push({ id: `f_${l}`, type: 'fan', x: 200, y: 320, width: 200, height: 80, rotation: 0, extraData: { force: 22 }, color: '#0284c7' });
    } else if (worldTheme.id === 4) { // Electric
      obstacles.push({ id: `sw_${l}`, type: 'switch', x: 220, y: 320, width: 60, height: 24, color: '#ffe600' });
      obstacles.push({ id: `dr_${l}`, type: 'door', x: 500, y: 320, width: 28, height: 180, connectedId: `sw_${l}`, color: '#fbbf24' });
      if (l >= 3) obstacles.push({ id: `g_${l}`, type: 'gear', x: 380, y: 250, width: 90, height: 90, speed: 2.2, color: '#eab308' });
    } else if (worldTheme.id === 5) { // Nature
      obstacles.push({ id: `vn_${l}`, type: 'vine', x: 350, y: 300, width: 30, height: 45, color: '#10b981' });
      if (l >= 4) obstacles.push({ id: `r_${l}`, type: 'ramp', x: 500, y: 220, width: 160, height: 20, rotation: -0.15, isStatic: true, color: '#065f46' });
    } else if (worldTheme.id === 6) { // Gravity
      obstacles.push({ id: `gz_${l}`, type: 'gravityZone', x: 400, y: 320, width: 260, height: 180, extraData: { gravityX: 0, gravityY: -15 }, color: '#a855f7' });
    } else if (worldTheme.id === 7) { // Light
      obstacles.push({ id: `m1_${l}`, type: 'mirror', x: 380, y: 280, width: 150, height: 20, rotation: -0.3, isStatic: true, color: '#ec4899' });
    } else if (worldTheme.id === 8) { // Shadow
      obstacles.push({ id: `spA_${l}`, type: 'shadowPortal', x: 220, y: 280, width: 55, height: 55, connectedId: `spB_${l}`, color: '#6366f1' });
      obstacles.push({ id: `spB_${l}`, type: 'shadowPortal', x: 580, y: 220, width: 55, height: 55, connectedId: `spA_${l}`, color: '#6366f1' });
    } else if (worldTheme.id === 9) { // Quantum
      obstacles.push({ id: `pA_${l}`, type: 'portal', x: 200, y: 260, width: 55, height: 55, connectedId: `pB_${l}`, color: '#8b5cf6' });
      obstacles.push({ id: `pB_${l}`, type: 'portal', x: 600, y: 220, width: 55, height: 55, connectedId: `pA_${l}`, color: '#8b5cf6' });
      obstacles.push({ id: `gz_${l}`, type: 'gravityZone', x: 400, y: 360, width: 220, height: 140, extraData: { gravityX: 0, gravityY: -14 }, color: '#8b5cf6' });
    } else { // Master (World 10)
      obstacles.push({ id: `w_${l}`, type: 'breakableWood', x: 250, y: 260, width: 140, height: 22, isStatic: true, color: '#854d0e' });
      obstacles.push({ id: `sw_${l}`, type: 'switch', x: 580, y: 260, width: 60, height: 22, color: '#ffe600' });
      obstacles.push({ id: `dr_${l}`, type: 'door', x: 580, y: 380, width: 26, height: 120, connectedId: `sw_${l}`, color: '#fbbf24' });
      obstacles.push({ id: `rot_${l}`, type: 'rotator', x: 400, y: 220, width: 180, height: 18, speed: 1.8, color: '#f59e0b' });
    }

    // Determine Container layout (single vs dual)
    const isDual = (l % 5 === 0);
    const containers = isDual ? [
      { id: `c1_${l}`, x: 250, y: 500, width: 85, height: 105, targetCount: 14, requiredType: primaryEnergy },
      { id: `c2_${l}`, x: 550, y: 500, width: 85, height: 105, targetCount: 14, requiredType: primaryEnergy },
    ] : [
      { id: `c1_${l}`, x: 400, y: 500, width: 90, height: 110, targetCount: 15 + Math.floor(l / 2), requiredType: primaryEnergy },
    ];

    levels.push({
      id: levelId,
      worldId: worldTheme.id,
      levelNumber: l,
      title,
      theme: worldTheme.name,
      description: `Guide ${worldTheme.energyType?.toUpperCase() || 'AQUA'} energy into the glass container(s).`,
      energyType: primaryEnergy,
      secondaryEnergyType: isDual ? (primaryEnergy === 'aqua' ? 'plasma' : 'aqua') : undefined,
      dropCount: 20 + Math.floor(l * 0.8),
      dropSpawn: { x: spawnX, y: spawnY },
      containers,
      obstacles,
      parLineLength: 320 + l * 12,
      hintText: `Draw a continuous line to funnel energy drops smoothly past obstacles into the receptacle.`,
      storyLore: `World ${worldTheme.id} - ${worldTheme.name} Sector ${l}`,
    });
  }

  return levels;
}

// Generate all 200 levels across 10 worlds
export const HANDCRAFTED_LEVELS: Level[] = WORLD_THEMES.flatMap((wt) => generateWorldLevels(wt));
