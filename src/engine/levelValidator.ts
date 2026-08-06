import { Container, Level, Obstacle, Point2D } from '../types/game';
import { PhysicsEngine } from './physicsEngine';

export interface ValidationResult {
  isValid: boolean;
  completionRate: number; // 0 to 1
  starDifficulty: number; // 1 to 5
  estimatedLineLength: number;
  reason?: string;
  solutionPoints?: { x: number; y: number }[];
}

export class LevelValidator {
  private static cache = new Map<string, ValidationResult>();

  /**
   * Replays a candidate path in a headless PhysicsEngine instance to verify
   * that it actually completes the level (filling all target containers).
   */
  public static verifyPathInPhysics(level: Level, points: Point2D[]): boolean {
    if (!points || points.length < 2) return false;

    const engine = new PhysicsEngine(800, 600);
    engine.resetAll();
    engine.initLevel(
      level.obstacles,
      level.containers,
      level.dropCount,
      level.dropSpawn,
      level.energyType,
      level.secondaryEnergyType
    );

    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalLength += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    }

    engine.setDrawnLine({
      points,
      totalLength,
      color: '#00ffff',
      thickness: 8,
    });

    engine.startSimulation();

    // Fast-forward simulation frame-by-frame for up to 600 frames (~10s)
    const fixedDt = 1 / 60;
    for (let frame = 0; frame < 600; frame++) {
      engine.update(fixedDt);
      if (engine.isLevelComplete()) {
        return true; // Verified 100% solvable!
      }
      if (engine.isSimulationFinished()) {
        break;
      }
    }

    return engine.isLevelComplete();
  }

  /**
   * Head-less physics simulation solver that verifies if a level layout is solvable.
   * Only returns solutionPoints if the physics simulation strictly reaches 100% container target.
   */
  public static validateLevel(level: Level): ValidationResult {
    const cacheKey = `${level.id}_${level.obstacles.length}_${level.containers.length}_${level.dropCount}_${level.parLineLength}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const candidateLines = this.generateCandidateLines(level);

    for (const candidate of candidateLines) {
      if (this.verifyPathInPhysics(level, candidate)) {
        const result: ValidationResult = {
          isValid: true,
          completionRate: 1.0,
          starDifficulty: Math.min(5, Math.max(1, Math.ceil(level.obstacles.length / 1.5))),
          estimatedLineLength: level.parLineLength || 400,
          reason: 'Level solution replay verified 100% solvable in physics engine.',
          solutionPoints: candidate,
        };
        this.cache.set(cacheKey, result);
        return result;
      }
    }

    // If no candidate line achieves 100% container target completion in physics engine:
    const result: ValidationResult = {
      isValid: false,
      completionRate: 0,
      starDifficulty: Math.min(5, Math.max(1, Math.ceil(level.obstacles.length / 1.5))),
      estimatedLineLength: level.parLineLength || 400,
      reason: 'Physics simulation replay could not verify a 100% solvable line path for this level layout.',
      solutionPoints: undefined,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  private static generateCandidateLines(level: Level): Point2D[][] {
    const candidates: Point2D[][] = [];

    // 0. Pre-stored blueprint path from level design (if present)
    if (level.hintData?.guideLinePoints && level.hintData.guideLinePoints.length >= 2) {
      candidates.push(level.hintData.guideLinePoints);
    }

    const spawn = level.dropSpawn || { x: 400, y: 90 };
    const containers = level.containers || [];
    const obstacles = level.obstacles || [];

    // 1. Direct Slanted Ramps & Curved Arcs to Containers
    for (const c of containers) {
      const startXOffsets = [-140, -100, -70, -40, -20, 0, 20, 40, 70, 100, 140];
      const endXOffsets = [-25, -10, 0, 10, 25];
      const midYOffsets = [0, 15, 30];

      for (const sx of startXOffsets) {
        for (const ex of endXOffsets) {
          for (const my of midYOffsets) {
            const startPt = { x: spawn.x + sx, y: spawn.y + 65 };
            const endPt = { x: c.x + ex, y: c.y - 70 };
            const midPt = {
              x: (startPt.x + endPt.x) / 2 + (sx > 0 ? -20 : 20),
              y: (startPt.y + endPt.y) / 2 + my,
            };

            candidates.push([startPt, midPt, endPt]);
          }
        }
      }
    }

    // 2. Obstacle Bypasses & Direct Obstacle Targets (Switches, Wood, Ice, Vines, Rotators)
    for (const obs of obstacles) {
      for (const c of containers) {
        // Direct target top of obstacle then into container
        candidates.push([
          { x: spawn.x - 30, y: spawn.y + 60 },
          { x: obs.x, y: obs.y - 35 },
          { x: c.x, y: c.y - 70 },
        ]);
        // Left bypass around obstacle
        candidates.push([
          { x: spawn.x - 50, y: spawn.y + 60 },
          { x: Math.max(60, obs.x - obs.width / 2 - 40), y: obs.y },
          { x: c.x, y: c.y - 70 },
        ]);
        // Right bypass around obstacle
        candidates.push([
          { x: spawn.x + 50, y: spawn.y + 60 },
          { x: Math.min(740, obs.x + obs.width / 2 + 40), y: obs.y },
          { x: c.x, y: c.y - 70 },
        ]);
      }
    }

    // 3. Portal Entry & Exit Pairs
    const portals = obstacles.filter((o) => o.type === 'portal' || o.type === 'shadowPortal');
    if (portals.length >= 2) {
      const p1 = portals[0];
      const p2 = portals[1];
      for (const c of containers) {
        candidates.push([
          { x: spawn.x - 40, y: spawn.y + 60 },
          { x: p1.x, y: p1.y - 35 },
          { x: p2.x, y: p2.y + 35 },
          { x: c.x, y: c.y - 70 },
        ]);
        candidates.push([
          { x: spawn.x + 40, y: spawn.y + 60 },
          { x: p1.x, y: p1.y - 35 },
          { x: p2.x, y: p2.y + 35 },
          { x: c.x, y: c.y - 70 },
        ]);
      }
    }

    // 4. Multi-Container Split Ramps
    if (containers.length >= 2) {
      const c1 = containers[0];
      const c2 = containers[1];
      candidates.push([
        { x: c1.x + 10, y: c1.y - 70 },
        { x: spawn.x, y: spawn.y + 80 },
        { x: c2.x - 10, y: c2.y - 70 },
      ]);
      candidates.push([
        { x: c1.x - 20, y: c1.y - 70 },
        { x: (c1.x + spawn.x) / 2, y: spawn.y + 90 },
        { x: spawn.x, y: spawn.y + 65 },
        { x: (c2.x + spawn.x) / 2, y: spawn.y + 90 },
        { x: c2.x + 20, y: c2.y - 70 },
      ]);
    }

    return candidates;
  }
}
