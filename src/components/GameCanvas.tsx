import React, { useEffect, useRef, useState } from 'react';
import { AppThemeMode, Container, DrawnLine, Drop, Level, Obstacle, Point2D } from '../types/game';
import { PhysicsEngine } from '../engine/physicsEngine';
import { soundEngine } from '../engine/soundEngine';
import { ENERGY_PROPERTIES } from '../data/energyProperties';
import { THEME_CONFIGS } from '../data/themes';

interface GameCanvasProps {
  level: Level;
  physicsEngine: PhysicsEngine;
  onSimulationFinished: (isSuccess: boolean, stars: number) => void;
  onLineDrawnChange?: (hasLine: boolean) => void;
  colorblindMode?: boolean;
  particleIntensity?: 'low' | 'medium' | 'high';
  lineThickness?: number;
  selectedTrailColor?: string;
  selectedSkin?: string;
  selectedEffect?: string;
  inkCapacityLevel?: number;
  appTheme?: AppThemeMode;
}

const TRAIL_COLOR_MAP: Record<string, string> = {
  trail_default: '#00f0ff',
  trail_neon_blue: '#00bfff',
  trail_neon_red: '#ff0055',
  trail_neon_green: '#00ff66',
  trail_purple: '#a855f7',
  trail_gold: '#fbbf24',
  trail_fire: '#ff4500',
  trail_ice: '#38bdf8',
  trail_electric: '#ffe600',
  trail_galaxy: '#c084fc',
  trail_bw: '#ffffff',
};

const resolveTrailColor = (key?: string, energyType?: string, time: number = 0): string => {
  if (!key) return ENERGY_PROPERTIES[(energyType as any) || 'aqua']?.color || '#00f0ff';
  if (key === 'trail_rainbow') {
    return `hsl(${(time * 180) % 360}, 100%, 60%)`;
  }
  if (TRAIL_COLOR_MAP[key]) return TRAIL_COLOR_MAP[key];
  if (key.startsWith('#')) return key;
  return ENERGY_PROPERTIES[(energyType as any) || 'aqua']?.color || '#00f0ff';
};

const getInkCapacityMultiplier = (level: number = 0): number => {
  switch (level) {
    case 1: return 1.25;
    case 2: return 1.50;
    case 3: return 2.00;
    case 4: return 999;
    default: return 1.0;
  }
};

interface SplashParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  type: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  physicsEngine,
  onSimulationFinished,
  onLineDrawnChange,
  colorblindMode = false,
  particleIntensity = 'medium',
  lineThickness = 8,
  selectedTrailColor = 'trail_default',
  selectedSkin = 'skin_classic',
  selectedEffect = 'effect_spark',
  inkCapacityLevel = 0,
  appTheme = 'neon_dark',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentLineRef = useRef<Point2D[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const splashParticlesRef = useRef<SplashParticle[]>([]);
  const ambientParticlesRef = useRef<AmbientParticle[]>([]);

  const [hasLine, setHasLine] = useState<boolean>(false);
  const [lineLength, setLineLength] = useState<number>(0);
  const [cameraTilt, setCameraTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showPerfectBanner, setShowPerfectBanner] = useState<boolean>(false);
  const [completionScale, setCompletionScale] = useState<number>(1.0);

  // Dynamic Adaptive Level Camera Bounds & Zoom
  const cameraRef = useRef<{ centerX: number; centerY: number; autoZoom: number }>({
    centerX: 400,
    centerY: 300,
    autoZoom: 1.0,
  });
  const completionScaleRef = useRef<number>(1.0);

  const finishTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  const appThemeRef = useRef<AppThemeMode>(appTheme);
  useEffect(() => {
    appThemeRef.current = appTheme;
  }, [appTheme]);

  const lineThicknessRef = useRef<number>(lineThickness);
  useEffect(() => {
    lineThicknessRef.current = lineThickness;
  }, [lineThickness]);

  const colorblindModeRef = useRef<boolean>(colorblindMode);
  useEffect(() => {
    colorblindModeRef.current = colorblindMode;
  }, [colorblindMode]);

  useEffect(() => {
    let minX = level.dropSpawn.x - 50;
    let maxX = level.dropSpawn.x + 50;
    let minY = level.dropSpawn.y - 50;
    let maxY = level.dropSpawn.y + 50;

    level.obstacles.forEach((obs) => {
      minX = Math.min(minX, obs.x - obs.width / 2 - 30);
      maxX = Math.max(maxX, obs.x + obs.width / 2 + 30);
      minY = Math.min(minY, obs.y - obs.height / 2 - 30);
      maxY = Math.max(maxY, obs.y + obs.height / 2 + 30);
    });

    level.containers.forEach((c) => {
      minX = Math.min(minX, c.x - c.width / 2 - 35);
      maxX = Math.max(maxX, c.x + c.width / 2 + 35);
      minY = Math.min(minY, c.y - c.height / 2 - 30);
      maxY = Math.max(maxY, c.y + c.height / 2 + 50);
    });

    const boundsWidth = Math.max(260, maxX - minX);
    const boundsHeight = Math.max(220, maxY - minY);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const targetW = 800 * 0.82;
    const targetH = 600 * 0.82;

    const scaleX = targetW / boundsWidth;
    const scaleY = targetH / boundsHeight;

    const autoZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 1.0), 2.15);

    cameraRef.current = { centerX, centerY, autoZoom };
  }, [level]);

  useEffect(() => {
    completionScaleRef.current = completionScale;
  }, [completionScale]);

  // Helper: map screen event pointers accurately to transformed world coordinates
  const getScaledPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const canvasX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const { centerX, centerY, autoZoom } = cameraRef.current;
    const totalScale = autoZoom * completionScaleRef.current;

    const worldX = (canvasX - canvas.width / 2) / totalScale + centerX;
    const worldY = (canvasY - canvas.height / 2) / totalScale + centerY;

    return { x: worldX, y: worldY };
  };

  // Initialize ambient drifting particles tailored to world energy type
  useEffect(() => {
    const amb: AmbientParticle[] = [];
    const count = particleIntensity === 'low' ? 20 : particleIntensity === 'high' ? 55 : 36;
    for (let i = 0; i < count; i++) {
      amb.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 0.45,
        vy: level.energyType === 'plasma' ? -0.4 - Math.random() * 0.6 : -0.15 - Math.random() * 0.35,
        radius: 1 + Math.random() * 3,
        alpha: 0.15 + Math.random() * 0.35,
        type: level.energyType,
      });
    }
    ambientParticlesRef.current = amb;
  }, [level.energyType, particleIntensity]);

  // Register splash particle spawn callback in physics engine
  useEffect(() => {
    physicsEngine.onSplashCallback = (x, y, color, count, speed = 3) => {
      const pIntensityMultiplier = particleIntensity === 'low' ? 0.6 : particleIntensity === 'high' ? 1.5 : 1.0;
      const finalCount = Math.round(count * pIntensityMultiplier);

      for (let i = 0; i < finalCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = (0.5 + Math.random() * 1.5) * speed;
        splashParticlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - 0.8,
          radius: 1.5 + Math.random() * 3.5,
          color,
          alpha: 1.0,
          life: 0,
          maxLife: 22 + Math.random() * 28,
        });
      }
    };
  }, [physicsEngine, particleIntensity]);

  // Initialize level in physics engine cleanly
  useEffect(() => {
    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
      finishTimeoutRef.current = null;
    }

    try {
      setRenderError(null);
      physicsEngine.initLevel(
        level.obstacles,
        level.containers,
        level.dropCount,
        level.dropSpawn,
        level.energyType,
        level.secondaryEnergyType
      );
    } catch (err) {
      console.error("Failed to initialize level physics state:", err);
      setRenderError("Level physics initialization failed. Click to retry.");
    }

    splashParticlesRef.current = [];
    isDrawingRef.current = false;
    currentLineRef.current = [];
    setHasLine(false);
    setLineLength(0);
    setShowPerfectBanner(false);
    setCompletionScale(1.0);
    if (onLineDrawnChange) onLineDrawnChange(false);

    return () => {
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, [level, physicsEngine]);

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      try {
        // Update physics
        physicsEngine.update(dt);

        // Update particles
        updateParticles(dt);

        // Render graphics
        renderCanvas(ctx, canvas.width, canvas.height, time / 1000);

        // Check win / lose condition
        if (physicsEngine.isSimulating) {
          if (physicsEngine.isLevelComplete()) {
            physicsEngine.isSimulating = false;
            soundEngine.playVictoryFanfare();
            setShowPerfectBanner(true);
            setCompletionScale(1.06);

            // Spawn celebratory victory particle explosion
            physicsEngine.containers.forEach((c) => {
              const prop = ENERGY_PROPERTIES[c.requiredType || level.energyType];
              physicsEngine.onSplashCallback?.(c.x, c.y, prop.color, 75, 10);
            });

            // Calculate stars based on line length vs par
            const drawnLength = physicsEngine.drawnLine?.totalLength || 0;
            const par = level.parLineLength || 400;

            let stars = 3;
            if (drawnLength > par * 1.4) stars = 1;
            else if (drawnLength > par * 1.15) stars = 2;

            if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
            finishTimeoutRef.current = setTimeout(() => {
              onSimulationFinished(true, stars);
            }, 850);
          } else if (physicsEngine.isSimulationFinished()) {
            physicsEngine.isSimulating = false;
            if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
            finishTimeoutRef.current = setTimeout(() => {
              onSimulationFinished(false, 0);
            }, 800);
          }
        }
      } catch (err) {
        console.error("Game loop execution error:", err);
        setRenderError("A physics loop error occurred. Resetting simulation...");
        return;
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (finishTimeoutRef.current) {
        clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = null;
      }
    };
  }, [level, physicsEngine, selectedTrailColor]);

  // Update Splash and Ambient Particles
  const updateParticles = (dt: number) => {
    // 1. Splash particles
    const splash = splashParticlesRef.current;
    for (let i = splash.length - 1; i >= 0; i--) {
      const p = splash[i];
      p.life += 1;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15; // particle gravity
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);

      if (p.life >= p.maxLife || p.alpha <= 0) {
        splash.splice(i, 1);
      }
    }

    // 2. Ambient particles
    const amb = ambientParticlesRef.current;
    for (let i = 0; i < amb.length; i++) {
      const p = amb[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -10) p.y = 610;
      if (p.x < -10) p.x = 810;
      if (p.x > 810) p.x = -10;
    }
  };

  // Touch & Pointer Events with Contact Sparks (Real-Time Mid-Simulation Drawing Enabled)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate total length of already completed lines
    const existingLength = physicsEngine.drawnLines.reduce((acc, l) => acc + l.totalLength, 0);
    const par = level.parLineLength || 400;
    const inkMultiplier = getInkCapacityMultiplier(inkCapacityLevel);
    const maxBudget = inkMultiplier > 100 ? 9999999 : par * 1.35 * inkMultiplier;

    // Prevent starting new stroke if ink budget is exhausted
    if (existingLength >= maxBudget) return;

    const pt = getScaledPoint(e);

    isDrawingRef.current = true;
    currentLineRef.current = [pt];

    const resolvedColor = resolveTrailColor(selectedTrailColor, level.energyType, performance.now() / 1000);
    const drawColor = appTheme === 'monochrome' ? '#ffffff' : resolvedColor;
    physicsEngine.setActiveDrawingLine({
      points: [pt],
      totalLength: 0,
      color: drawColor,
      thickness: lineThickness,
    });

    soundEngine.playDrawStroke();

    // Spawn initial contact drawing sparks
    for (let i = 0; i < 5; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 2;
      splashParticlesRef.current.push({
        x: pt.x,
        y: pt.y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        radius: 1.5 + Math.random() * 2.5,
        color: drawColor,
        alpha: 1.0,
        life: 0,
        maxLife: 15 + Math.random() * 10,
      });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    setCameraTilt({ x: normX * 6, y: normY * 6 });

    if (!isDrawingRef.current) return;

    const pt = getScaledPoint(e);

    const pts = currentLineRef.current;
    const lastPt = pts[pts.length - 1];

    if (lastPt) {
      const dist = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y);
      if (dist >= 6) {
        let activeLineLength = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          activeLineLength += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
        }
        activeLineLength += dist;

        const existingLength = physicsEngine.drawnLines.reduce((acc, l) => acc + l.totalLength, 0);
        const candidateTotal = existingLength + activeLineLength;

        const par = level.parLineLength || 400;
        const inkMultiplier = getInkCapacityMultiplier(inkCapacityLevel);
        const maxBudget = inkMultiplier > 100 ? 9999999 : par * 1.35 * inkMultiplier;

        // Cap drawing when ink budget is exhausted
        if (candidateTotal <= maxBudget) {
          pts.push(pt);
          setLineLength(candidateTotal);

          const resolvedColor = resolveTrailColor(selectedTrailColor, level.energyType, performance.now() / 1000);
          const drawColor = appTheme === 'monochrome' ? '#ffffff' : resolvedColor;
          physicsEngine.setActiveDrawingLine({
            points: [...pts],
            totalLength: activeLineLength,
            color: drawColor,
            thickness: lineThickness,
          });

          soundEngine.playDrawStroke();

          // Haptic feedback
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(2); } catch (_) {}
          }

          // Spawn contact sparks under finger/cursor
          for (let i = 0; i < 3; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 1.2 + Math.random() * 1.8;
            splashParticlesRef.current.push({
              x: pt.x,
              y: pt.y,
              vx: Math.cos(ang) * spd,
              vy: Math.sin(ang) * spd,
              radius: 1.2 + Math.random() * 2,
              color: drawColor,
              alpha: 1.0,
              life: 0,
              maxLife: 12 + Math.random() * 8,
            });
          }
        }
      }
    }
  };

  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const pts = currentLineRef.current;
    if (pts.length > 1) {
      let total = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        total += Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
      }

      const drawColor = appTheme === 'monochrome' ? '#ffffff' : (selectedTrailColor || ENERGY_PROPERTIES[level.energyType].color);
      const drawnLine: DrawnLine = {
        points: pts,
        totalLength: total,
        color: drawColor,
        thickness: lineThickness,
      };

      physicsEngine.addDrawnLine(drawnLine);
      setHasLine(true);
      if (onLineDrawnChange) onLineDrawnChange(true);

      // Start energy drops simulation immediately on first stroke
      if (!physicsEngine.isSimulating) {
        physicsEngine.startSimulation();
      }
    } else {
      physicsEngine.setActiveDrawingLine(null);
    }
  };

  // Render Canvas Scene
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
  ) => {
    ctx.clearRect(0, 0, width, height);

    const worldProp = ENERGY_PROPERTIES[level.energyType];
    const themeConfig = THEME_CONFIGS[appTheme || 'neon_dark'] || THEME_CONFIGS.neon_dark;
    const isMonochrome = themeConfig.isMonochrome;

    // 1. Theme-Driven Atmospheric Background & Grid
    if (isMonochrome) {
      ctx.fillStyle = themeConfig.bgCanvasStart;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      ctx.strokeStyle = themeConfig.gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else {
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        20,
        width / 2,
        height / 2,
        580
      );
      bgGrad.addColorStop(0, themeConfig.bgCanvasStart);
      bgGrad.addColorStop(1, themeConfig.bgCanvasEnd);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(-20, -20, width + 40, height + 40);

      // Theme grid lines
      ctx.strokeStyle = themeConfig.gridColor;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    // Drifting Ambient Particles
    ambientParticlesRef.current.forEach((ap) => {
      ctx.save();
      ctx.globalAlpha = ap.alpha * (isMonochrome ? 0.6 : 0.85);
      const particleColor = isMonochrome ? themeConfig.particleColor : (worldProp.color || themeConfig.particleColor);
      ctx.fillStyle = particleColor;
      ctx.strokeStyle = particleColor;

      if (level.energyType === 'plasma') {
        // Fire spark diamond
        ctx.shadowColor = worldProp.glowColor;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(ap.x, ap.y - ap.radius * 1.5);
        ctx.lineTo(ap.x + ap.radius, ap.y);
        ctx.lineTo(ap.x, ap.y + ap.radius * 1.5);
        ctx.lineTo(ap.x - ap.radius, ap.y);
        ctx.closePath();
        ctx.fill();
      } else if (level.energyType === 'cryo') {
        // Frost crystal snowflake cross
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ap.x - ap.radius * 1.5, ap.y);
        ctx.lineTo(ap.x + ap.radius * 1.5, ap.y);
        ctx.moveTo(ap.x, ap.y - ap.radius * 1.5);
        ctx.lineTo(ap.x, ap.y + ap.radius * 1.5);
        ctx.stroke();
      } else if (level.energyType === 'nature') {
        // Organic leaf oval
        ctx.beginPath();
        ctx.ellipse(ap.x, ap.y, ap.radius * 1.4, ap.radius * 0.7, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (level.energyType === 'electric') {
        // Crackling voltage arc dot
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, ap.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (level.energyType === 'gravity') {
        // Floating purple quantum micro-orb
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, ap.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (level.energyType === 'light') {
        // Four-pointed star flare
        ctx.beginPath();
        ctx.moveTo(ap.x, ap.y - ap.radius * 2);
        ctx.lineTo(ap.x + ap.radius * 0.5, ap.y);
        ctx.lineTo(ap.x, ap.y + ap.radius * 2);
        ctx.lineTo(ap.x - ap.radius * 0.5, ap.y);
        ctx.closePath();
        ctx.fill();
      } else if (level.energyType === 'shadow') {
        // Void smoke cloud
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, ap.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        // Aqua default water droplet
        ctx.shadowColor = worldProp.glowColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, ap.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // Save & Apply Adaptive Level Camera Transform
    const { centerX, centerY, autoZoom } = cameraRef.current;
    const totalScale = autoZoom * completionScale;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(totalScale, totalScale);
    ctx.translate(-centerX + cameraTilt.x / totalScale, -centerY + cameraTilt.y / totalScale);

    // 2. Futuristic Drop Generator Emitter Housing
    const spawn = level.dropSpawn;
    ctx.save();
    ctx.shadowColor = worldProp.glowColor;
    ctx.shadowBlur = 18;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = worldProp.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y - 15, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner Glowing Core
    ctx.fillStyle = worldProp.color;
    ctx.shadowColor = worldProp.glowColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y - 15, 10 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Emitter Ring Pulse
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(spawn.x, spawn.y - 15, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 3. Render Obstacles with Futuristic Metallic Platform Material
    physicsEngine.obstacles.forEach((obs) => {
      if (obs.state === 'broken') return;

      ctx.save();
      ctx.translate(obs.x, obs.y);
      if (obs.rotation) ctx.rotate(obs.rotation);

      if (obs.type === 'ramp') {
        // Metallic Bevel Platform Ramp with Specular Chrome Edge
        const rampGrad = ctx.createLinearGradient(-obs.width / 2, 0, obs.width / 2, 0);
        rampGrad.addColorStop(0, '#0f172a');
        rampGrad.addColorStop(0.5, '#1e293b');
        rampGrad.addColorStop(1, '#0f172a');

        ctx.fillStyle = rampGrad;
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

        // Corner Metallic Rivets/Bolts
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(-obs.width / 2 + 5, -obs.height / 2 + 5, 2, 0, Math.PI * 2);
        ctx.arc(obs.width / 2 - 5, -obs.height / 2 + 5, 2, 0, Math.PI * 2);
        ctx.arc(-obs.width / 2 + 5, obs.height / 2 - 5, 2, 0, Math.PI * 2);
        ctx.arc(obs.width / 2 - 5, obs.height / 2 - 5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Specular Top Chrome Bevel
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, 3);

        // Glowing Top Neon Conduit Strip
        ctx.shadowColor = worldProp.glowColor;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = worldProp.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-obs.width / 2, -obs.height / 2);
        ctx.lineTo(obs.width / 2, -obs.height / 2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'portal' || obs.type === 'shadowPortal') {
        // Swirling Vortex Portal
        const pGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, obs.width / 2);
        pGlow.addColorStop(0, '#ffffff');
        pGlow.addColorStop(0.4, obs.color || worldProp.color);
        pGlow.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(0, 0, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (obs.type === 'rotator' || obs.type === 'gear') {
        // Metallic Spinning Gear Hub
        ctx.fillStyle = obs.color || '#ef4444';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);

        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (obs.type === 'breakableWood') {
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'breakableIce') {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#e0ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'switch') {
        ctx.fillStyle = obs.state === 'active' ? '#22c55e' : '#ffe600';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'door') {
        ctx.fillStyle = obs.state === 'open' ? '#334155' : '#fbbf24';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'spring') {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'fan') {
        ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'gravityZone') {
        ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
        ctx.strokeStyle = '#c084fc';
        ctx.strokeRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      } else if (obs.type === 'vine') {
        ctx.fillStyle = '#10b981';
        ctx.fillRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height);
      }

      ctx.restore();
    });

    // 4. Render Realistic Transparent Glass Containers with Unique World Mechanisms
    physicsEngine.containers.forEach((container) => {
      renderGlassContainer(ctx, container, level.energyType, time);
    });

    // 5. Render Player Drawn Physics Lines with Multi-layered Energy Glow
    const linesToRender: DrawnLine[] = [...physicsEngine.drawnLines];
    if (physicsEngine.activeDrawingLine && physicsEngine.activeDrawingLine.points.length > 1) {
      linesToRender.push(physicsEngine.activeDrawingLine);
    }

    for (const line of linesToRender) {
      const pts = line.points;
      if (pts.length < 2) continue;

      const activeTrailColor = resolveTrailColor(selectedTrailColor, level.energyType, time);
      const strokeColor = isMonochrome ? themeConfig.lineStroke : (line.color || activeTrailColor || themeConfig.lineStroke || worldProp.color);
      const glowColor = isMonochrome ? themeConfig.lineGlow : (themeConfig.lineGlow || strokeColor);

      ctx.save();
      // Outer Radiant Bloom
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isMonochrome ? 4 : 18;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineThickness + 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
      }
      ctx.stroke();

      // Bright Inner Core Beam
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isMonochrome ? '#3f3f46' : '#ffffff';
      ctx.lineWidth = Math.max(2, lineThickness - 2);
      ctx.stroke();

      // Start Node
      ctx.fillStyle = isMonochrome ? '#18181b' : '#ffffff';
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = isMonochrome ? 4 : 14;
      ctx.beginPath();
      ctx.arc(pts[0].x, pts[0].y, Math.max(4, lineThickness / 2 + 2), 0, Math.PI * 2);
      ctx.fill();

      // End Node
      ctx.beginPath();
      ctx.arc(pts[pts.length - 1].x, pts[pts.length - 1].y, Math.max(4, lineThickness / 2 + 2), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 6. Render Liquid Cohesion Bridges & Energy Liquid Droplets
    const activeDrops = physicsEngine.drops.filter((d: Drop) => d.state === 'active');
    const dropCount = activeDrops.length;
    
    // Optimized cohesion bridging (O(N) nearby check)
    for (let i = 0; i < dropCount; i++) {
      const d1 = activeDrops[i];
      const maxBridgeDist = (d1.radius + 12) * 2.0;
      const maxBridgeSq = maxBridgeDist * maxBridgeDist;

      for (let j = i + 1; j < Math.min(dropCount, i + 6); j++) {
        const d2 = activeDrops[j];
        const dx = d2.x - d1.x;
        const dy = d2.y - d1.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0 && distSq < maxBridgeSq) {
          const dist = Math.sqrt(distSq);
          ctx.save();
          const alpha = 1 - dist / maxBridgeDist;
          ctx.globalAlpha = alpha * 0.5;
          ctx.strokeStyle = isMonochrome ? themeConfig.lineStroke : d1.color;
          ctx.lineWidth = Math.max(2, (d1.radius + d2.radius) * 0.5 * alpha);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(d1.x, d1.y);
          ctx.lineTo(d2.x, d2.y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    physicsEngine.drops.forEach((drop: Drop) => {
      renderFluidDrop(ctx, drop, colorblindMode, time);
    });

    // 7. Render Splash Particles
    splashParticlesRef.current.forEach((sp) => {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.shadowColor = sp.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  };

  // Helper: Glass Container Rendering with Real Fluid Ripples, Rising Bubbles & Fill Glow
  const renderGlassContainer = (
    ctx: CanvasRenderingContext2D,
    container: Container,
    energyType: any,
    time: number
  ) => {
    ctx.save();
    const halfW = container.width / 2;
    const halfH = container.height / 2;
    const wallThickness = 8;
    const cornerRadius = 12;

    const currentCount = container.currentCount || 0;
    const fillRatio = Math.min(1, currentCount / container.targetCount);

    const reqType = container.requiredType || level.energyType;
    const reqProp = ENERGY_PROPERTIES[reqType];
    const isMono = appTheme === 'monochrome';

    const glassBorderColor = isMono ? '#18181b' : (container.isFull ? '#22c55e' : reqProp.color);
    const glassOuterBg = isMono ? '#ffffff' : 'rgba(15, 23, 42, 0.82)';
    const glassCavityBg = isMono ? '#f4f4f5' : 'rgba(2, 6, 23, 0.94)';

    // 1. Vessel Outer Glow (Glow increases dynamically as glass fills!)
    const dynamicGlowBlur = isMono ? 4 : (12 + fillRatio * 24);
    ctx.shadowColor = isMono ? 'rgba(0,0,0,0.2)' : (container.isFull ? '#22c55e' : reqProp.glowColor);
    ctx.shadowBlur = isMono ? 4 : (container.isFull ? 32 : dynamicGlowBlur);

    // Outer Double-walled Glass Shell
    ctx.fillStyle = glassOuterBg;
    ctx.strokeStyle = glassBorderColor;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.roundRect(
      container.x - halfW - wallThickness,
      container.y - halfH,
      container.width + wallThickness * 2,
      container.height + wallThickness,
      [2, 2, cornerRadius + wallThickness, cornerRadius + wallThickness]
    );
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 2. Inner Glass Cavity Area
    ctx.fillStyle = glassCavityBg;
    ctx.beginPath();
    ctx.roundRect(
      container.x - halfW,
      container.y - halfH + 2,
      container.width,
      container.height - 2,
      [0, 0, cornerRadius, cornerRadius]
    );
    ctx.fill();

    // 3. Fluid Fill Volume inside Glass
    const fluidH = (container.height - 6) * fillRatio;
    if (fluidH > 0) {
      const liquidTopY = container.y + halfH - fluidH - 3;

      let liqGrad: any;
      if (isMono) {
        liqGrad = ctx.createLinearGradient(container.x, liquidTopY, container.x, container.y + halfH - 3);
        liqGrad.addColorStop(0, '#52525b');
        liqGrad.addColorStop(1, '#18181b');
      } else {
        liqGrad = ctx.createLinearGradient(container.x, liquidTopY, container.x, container.y + halfH - 3);
        liqGrad.addColorStop(0, reqProp.glowColor);
        liqGrad.addColorStop(0.35, reqProp.color);
        liqGrad.addColorStop(1, reqProp.secondaryColor || reqProp.color);
      }

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(
        container.x - halfW + 2,
        container.y - halfH + 2,
        container.width - 4,
        container.height - 5,
        [0, 0, cornerRadius - 2, cornerRadius - 2]
      );
      ctx.clip();

      ctx.fillStyle = liqGrad;
      ctx.beginPath();
      ctx.moveTo(container.x - halfW + 2, container.y + halfH - 3);
      ctx.lineTo(container.x - halfW + 2, liquidTopY);

      // Real Fluid Waves with Multi-Harmonic Motion
      const waveFreq1 = 0.09;
      const waveFreq2 = 0.04;
      const waveAmp = container.isFull ? 1.8 : 3.5;
      for (let x = container.x - halfW + 2; x <= container.x + halfW - 2; x += 2) {
        const wy =
          liquidTopY +
          Math.sin(time * 7 + x * waveFreq1) * waveAmp +
          Math.cos(time * 5 + x * waveFreq2) * (waveAmp * 0.5);
        ctx.lineTo(x, wy);
      }

      ctx.lineTo(container.x + halfW - 2, container.y + halfH - 3);
      ctx.closePath();
      ctx.fill();

      // Bright Surface Meniscus Wave Line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = container.x - halfW + 2; x <= container.x + halfW - 2; x += 2) {
        const wy =
          liquidTopY +
          Math.sin(time * 7 + x * waveFreq1) * waveAmp +
          Math.cos(time * 5 + x * waveFreq2) * (waveAmp * 0.5);
        if (x === container.x - halfW + 2) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();

      // Rising Buoyancy Bubbles inside Liquid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      for (let b = 0; b < 6; b++) {
        const bx = container.x - halfW + 12 + ((b * 19 + time * 25) % (container.width - 24));
        const by = container.y + halfH - ((b * 15 + time * 35) % Math.max(10, fluidH));
        ctx.beginPath();
        ctx.arc(bx, by, 1.2 + (b % 3) * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 4. World-Specific Objective Visual Overlay
    if (reqType === 'plasma') {
      // Thermal Reactor Igniter Core
      const coreGlow = ctx.createRadialGradient(
        container.x,
        container.y + halfH - 12,
        1,
        container.x,
        container.y + halfH - 12,
        16
      );
      coreGlow.addColorStop(0, '#ffffff');
      coreGlow.addColorStop(0.5, '#ff3355');
      coreGlow.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(container.x, container.y + halfH - 12, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (reqType === 'electric') {
      // Copper Terminal Posts
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(container.x - halfW - wallThickness + 2, container.y - halfH - 8, 6, 8);
      ctx.fillRect(container.x + halfW + wallThickness - 8, container.y - halfH - 8, 6, 8);
    }

    // 5. Specular Highlights & Glass Refractions
    const leftGlassGrad = ctx.createLinearGradient(
      container.x - halfW - wallThickness,
      container.y - halfH,
      container.x - halfW,
      container.y - halfH
    );
    leftGlassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
    leftGlassGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
    leftGlassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
    ctx.fillStyle = leftGlassGrad;
    ctx.fillRect(
      container.x - halfW - wallThickness + 1,
      container.y - halfH + 2,
      wallThickness - 2,
      container.height
    );

    // Diagonal Refractive Glass Flare
    const diagGrad = ctx.createLinearGradient(
      container.x - halfW,
      container.y - halfH,
      container.x + halfW,
      container.y + halfH
    );
    diagGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
    diagGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
    diagGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.0)');
    ctx.fillStyle = diagGrad;
    ctx.beginPath();
    ctx.moveTo(container.x - halfW + 4, container.y - halfH + 4);
    ctx.lineTo(container.x - halfW + 18, container.y - halfH + 4);
    ctx.lineTo(container.x - halfW + 4, container.y + halfH - 12);
    ctx.closePath();
    ctx.fill();

    // Top Glass Rim Oval
    ctx.strokeStyle = container.isFull ? '#22c55e' : reqProp.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(
      container.x,
      container.y - halfH,
      halfW + wallThickness,
      4,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();

    // Target Count Pill Badge
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = container.isFull ? '#22c55e' : reqProp.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(container.x - 28, container.y + halfH + wallThickness + 6, 56, 20, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = container.isFull ? '#4ade80' : reqProp.color;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `${currentCount}/${container.targetCount}`,
      container.x,
      container.y + halfH + wallThickness + 16
    );
    ctx.restore();

    ctx.restore();
  };

  // Helper: Fluid Energy Droplets with Flame Flicker for Plasma
  const renderFluidDrop = (
    ctx: CanvasRenderingContext2D,
    drop: Drop,
    colorblindMode: boolean,
    time: number
  ) => {
    if (drop.state !== 'active') return;

    ctx.save();
    const speed = Math.hypot(drop.vx, drop.vy);
    const angle = Math.atan2(drop.vy, drop.vx);

    const isMono = appTheme === 'monochrome';
    const dropGlow = isMono ? 'rgba(255, 255, 255, 0.5)' : drop.glowColor;

    // Fluid Trail
    if (drop.trail.length > 1) {
      ctx.strokeStyle = dropGlow;
      ctx.lineWidth = drop.radius * 0.85;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.moveTo(drop.trail[0].x, drop.trail[0].y);
      for (let t = 1; t < drop.trail.length; t++) {
        ctx.lineTo(drop.trail[t].x, drop.trail[t].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1.0;
    }

    ctx.shadowColor = dropGlow;
    ctx.shadowBlur = isMono ? 8 : 14;

    ctx.translate(drop.x, drop.y);
    ctx.rotate(angle);

    const stretch = Math.min(1.75, 1.0 + speed * 0.085);
    const rx = drop.radius * stretch;
    const ry = drop.radius / Math.sqrt(stretch);

    if (isMono) {
      // Monochrome Crisp Solid Dark Energy Droplet on Light Canvas
      const monoGrad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 1, 0, 0, rx);
      monoGrad.addColorStop(0, '#ffffff');
      monoGrad.addColorStop(0.3, '#3f3f46');
      monoGrad.addColorStop(1, '#18181b');

      ctx.fillStyle = monoGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (drop.energyType === 'plasma') {
      // Plasma Droplet: Radiant Flickering Fire Flame Aura
      const flicker = Math.sin(time * 20 + drop.x) * 0.15;
      const fireGrad = ctx.createRadialGradient(-rx * 0.2, 0, 1, 0, 0, rx * (1.2 + flicker));
      fireGrad.addColorStop(0, '#ffffff');
      fireGrad.addColorStop(0.3, '#ffcc00');
      fireGrad.addColorStop(0.7, '#ff3355');
      fireGrad.addColorStop(1, '#990022');

      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 1.15, ry * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame flicker tip
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.ellipse(-rx * 0.6, 0, rx * 0.5, ry * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (drop.energyType === 'electric') {
      // Electric Droplet: Crackling Voltage Core
      const elecGrad = ctx.createRadialGradient(-rx * 0.2, 0, 1, 0, 0, rx);
      elecGrad.addColorStop(0, '#ffffff');
      elecGrad.addColorStop(0.5, '#ffe600');
      elecGrad.addColorStop(1, '#ffaa00');

      ctx.fillStyle = elecGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Arc Spark
      if (Math.random() < 0.35) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-rx, -ry);
        ctx.lineTo(0, 0);
        ctx.lineTo(rx, ry);
        ctx.stroke();
      }
    } else {
      // Aqua / Cryo / Standard Fluid Drop
      const dropGrad = ctx.createRadialGradient(-rx * 0.2, -ry * 0.2, 1, 0, 0, rx);
      dropGrad.addColorStop(0, '#ffffff');
      dropGrad.addColorStop(0.35, drop.color);
      dropGrad.addColorStop(1, drop.glowColor);

      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Specular Highlight Spot
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-rx * 0.3, -ry * 0.35, rx * 0.3, ry * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    if (colorblindMode) {
      ctx.rotate(-angle);
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(drop.energyType[0].toUpperCase(), 0, 0);
    }

    ctx.restore();
  };

  // Line Meter Ratio Calculation
  const par = level.parLineLength || 400;
  const fillPct = Math.min(100, Math.round((lineLength / par) * 100));
  const isOverPar = lineLength > par;
  const activeProp = ENERGY_PROPERTIES[level.energyType];
  const themeConfig = THEME_CONFIGS[appTheme || 'neon_dark'] || THEME_CONFIGS.neon_dark;
  const isMono = themeConfig.isMonochrome;

  return (
    <div
      className="relative w-full h-full flex-1 flex items-center justify-center overflow-hidden select-none transition-colors duration-300"
      style={{ backgroundColor: themeConfig.bgCanvasStart }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full touch-none cursor-crosshair object-contain select-none"
      />

      {/* Sleek Progress Bar Line Meter HUD */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-3 pointer-events-none z-20">
        <div className={`flex-1 max-w-xs backdrop-blur-xl border px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2.5 ${isMono ? 'bg-white/90 border-zinc-300 text-zinc-900' : 'bg-slate-900/80 border-white/10 text-slate-100'}`}>
          <div className="flex flex-col">
            <span className={`text-[9px] font-black tracking-wider uppercase ${isMono ? 'text-zinc-500' : 'text-slate-400'}`}>DRAW METER</span>
            <span className={`text-[11px] font-black ${isOverPar ? 'text-amber-500' : (isMono ? 'text-zinc-900' : 'text-cyan-300')}`}>
              {isOverPar
                ? `OVER PAR: +${Math.round(lineLength - par)} px`
                : `REMAINING: ${Math.max(0, Math.round(par - lineLength))} px`}
            </span>
          </div>

          {/* Glowing Bar Indicator */}
          <div className={`flex-1 h-2 rounded-full overflow-hidden border p-0.5 ${isMono ? 'bg-zinc-200 border-zinc-300' : 'bg-slate-950/80 border-white/5'}`}>
            <div
              className={`h-full rounded-full transition-all duration-200 shadow-sm ${
                isOverPar
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-rose-500/50'
                  : (isMono ? 'bg-zinc-900 shadow-zinc-400' : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 shadow-cyan-500/50')
              }`}
              style={{ width: `${Math.min(100, fillPct)}%` }}
            />
          </div>
        </div>

        <div
          className={`backdrop-blur-xl border px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold ${isMono ? 'bg-white/90 border-zinc-300 text-zinc-900' : 'bg-slate-900/80 text-slate-200'}`}
          style={{ borderColor: isMono ? '#18181b' : activeProp.glowColor }}
        >
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: isMono ? '#18181b' : activeProp.color }} />
          <span className={`text-[9px] uppercase font-black ${isMono ? 'text-zinc-500' : 'text-slate-400'}`}>ENERGY:</span>
          <span className="capitalize font-black text-[11px]" style={{ color: isMono ? '#18181b' : activeProp.color }}>{level.energyType}</span>
        </div>
      </div>

      {/* Perfect Flow Banner on Victory */}
      {showPerfectBanner && (
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none backdrop-blur-2xl px-8 py-4 rounded-3xl border text-center shadow-2xl animate-scale-up z-20 ${isMono ? 'bg-white/95 border-zinc-900 text-zinc-900 shadow-zinc-400' : 'bg-slate-900/90 border-emerald-400/50 text-slate-100 shadow-emerald-950/90'}`}>
          <span className={`text-2xl font-black tracking-tight ${isMono ? 'text-zinc-900' : 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-400'}`}>
            PERFECT FLOW
          </span>
          <p className={`text-xs font-bold mt-1 uppercase tracking-wider ${isMono ? 'text-zinc-700' : 'text-emerald-400'}`}>
            {level.energyType} Energy Fully Stabilized!
          </p>
        </div>
      )}

      {/* Drawing Prompt Instruction Overlay */}
      {!hasLine && !physicsEngine.isSimulating && (
        <div className={`absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none backdrop-blur-xl px-5 py-2 rounded-full border text-xs font-bold tracking-wide shadow-xl animate-bounce flex items-center gap-2 z-20 ${isMono ? 'bg-white/90 border-zinc-400 text-zinc-900 shadow-zinc-300' : 'bg-slate-900/85 border-cyan-400/30 text-cyan-200 shadow-cyan-950/60'}`}>
          <span className={`w-2 h-2 rounded-full ${isMono ? 'bg-zinc-900' : 'bg-cyan-400'}`} />
          <span>Draw lines in real-time to direct {level.energyType} drops</span>
        </div>
      )}
      {/* Friendly Error Recovery Overlay */}
      {renderError && (
        <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-rose-500/40 p-6 rounded-3xl max-w-md shadow-2xl animate-scale-up">
            <h3 className="text-lg font-black text-rose-400 mb-2">Simulation Engine Notice</h3>
            <p className="text-xs text-slate-300 mb-5">{renderError}</p>
            <button
              onClick={() => {
                setRenderError(null);
                physicsEngine.initLevel(
                  level.obstacles,
                  level.containers,
                  level.dropCount,
                  level.dropSpawn,
                  level.energyType,
                  level.secondaryEnergyType
                );
              }}
              className="px-5 py-3 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 font-bold text-xs text-slate-950 rounded-2xl shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all"
            >
              Reload Level Cleanly
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
