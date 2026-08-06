import {
  Container,
  DrawnLine,
  Drop,
  EnergyType,
  Obstacle,
  Point2D,
} from '../types/game';
import { ENERGY_PROPERTIES } from '../data/energyProperties';
import { soundEngine } from './soundEngine';

export class PhysicsEngine {
  public gravity: Point2D = { x: 0, y: 9.8 };
  public drops: Drop[] = [];
  public containers: Container[] = [];
  public obstacles: Obstacle[] = [];
  public drawnLines: DrawnLine[] = [];
  public activeDrawingLine: DrawnLine | null = null;
  public simulationTime: number = 0;
  public isSimulating: boolean = false;
  public onContainerFillCallback?: (containerId: string, count: number) => void;
  public onBreakObjectCallback?: (obstacleId: string) => void;
  public onSplashCallback?: (x: number, y: number, color: string, count: number, speed?: number) => void;

  public get drawnLine(): DrawnLine | null {
    return this.drawnLines[this.drawnLines.length - 1] || this.activeDrawingLine || null;
  }

  private subSteps: number = 4;
  private canvasWidth: number = 800;
  private canvasHeight: number = 600;

  constructor(width: number = 800, height: number = 600) {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  public resetAll() {
    this.gravity = { x: 0, y: 9.8 };
    this.drops = [];
    this.containers = [];
    this.obstacles = [];
    this.drawnLines = [];
    this.activeDrawingLine = null;
    this.simulationTime = 0;
    this.isSimulating = false;
    this.onContainerFillCallback = undefined;
    this.onBreakObjectCallback = undefined;
    this.onSplashCallback = undefined;
  }

  public initLevel(
    obstacles: Obstacle[],
    containers: Container[],
    dropCount: number,
    dropSpawn: Point2D,
    energyType: EnergyType,
    secondaryEnergyType?: EnergyType
  ) {
    this.resetAll();
    this.obstacles = JSON.parse(JSON.stringify(obstacles));
    this.containers = JSON.parse(JSON.stringify(containers));
    this.containers.forEach((c) => {
      c.currentCount = 0;
      c.isFull = false;
    });
    this.drawnLines = [];
    this.activeDrawingLine = null;
    this.drops = [];
    this.simulationTime = 0;
    this.isSimulating = false;

    // Spawn Energy Drops
    for (let i = 0; i < dropCount; i++) {
      // Slight staggered offset and jitter for natural fluid flow
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = -i * 18 - Math.random() * 5;
      const type =
        secondaryEnergyType && i % 2 === 1 ? secondaryEnergyType : energyType;
      const prop = ENERGY_PROPERTIES[type];

      this.drops.push({
        id: `drop_${i}`,
        x: dropSpawn.x + offsetX,
        y: dropSpawn.y + offsetY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 1.5 + Math.random() * 0.5,
        radius: 7,
        energyType: type,
        state: 'active',
        color: prop.color,
        glowColor: prop.glowColor,
        opacity: 1,
        life: 1,
        trail: [],
      });
    }
  }

  public setDrawnLine(line: DrawnLine | null) {
    if (line) {
      this.drawnLines = [line];
    } else {
      this.drawnLines = [];
    }
    this.activeDrawingLine = null;
  }

  public addDrawnLine(line: DrawnLine) {
    this.drawnLines.push(line);
    this.activeDrawingLine = null;
  }

  public setActiveDrawingLine(line: DrawnLine | null) {
    this.activeDrawingLine = line;
  }

  public removeLastDrawnLine() {
    this.drawnLines.pop();
    this.activeDrawingLine = null;
  }

  public clearDrawnLines() {
    this.drawnLines = [];
    this.activeDrawingLine = null;
  }

  public startSimulation() {
    this.isSimulating = true;
  }

  public resetSimulation(dropSpawn: Point2D) {
    this.isSimulating = false;
    this.simulationTime = 0;

    // Reset container fill levels
    this.containers.forEach((c) => {
      c.currentCount = 0;
      c.isFull = false;
    });

    // Reset obstacle states
    this.obstacles.forEach((obs) => {
      if (obs.type === 'switch' || obs.type === 'door') {
        obs.state = 'normal';
      }
      if (obs.type === 'breakableWood' || obs.type === 'breakableIce') {
        obs.state = 'normal';
      }
      if (obs.type === 'vine') {
        obs.state = 'normal';
      }
    });

    // Reset drops back to spawn
    this.drops.forEach((drop, i) => {
      const offsetX = (Math.random() - 0.5) * 30;
      const offsetY = -i * 18 - Math.random() * 5;
      drop.x = dropSpawn.x + offsetX;
      drop.y = dropSpawn.y + offsetY;
      drop.vx = (Math.random() - 0.5) * 0.8;
      drop.vy = 1.5 + Math.random() * 0.5;
      drop.state = 'active';
      drop.trail = [];
    });
  }

  public update(dt: number) {
    if (!this.isSimulating) return;

    this.simulationTime += dt;
    const subDt = dt / this.subSteps;

    for (let step = 0; step < this.subSteps; step++) {
      this.updateObstacles(subDt);
      this.updateDrops(subDt);
    }
  }

  private updateObstacles(dt: number) {
    // Dynamic obstacles movement / rotation
    this.obstacles.forEach((obs) => {
      if (obs.state === 'broken') return;

      if (obs.type === 'rotator') {
        const rotSpeed = obs.speed || 1.2;
        obs.rotation = (obs.rotation || 0) + rotSpeed * dt;
      } else if (obs.type === 'gear') {
        const gearSpeed = obs.speed || 2.0;
        obs.rotation = (obs.rotation || 0) + gearSpeed * dt;
      }

      // Handle doors opening when switch is activated
      if (obs.type === 'door' && obs.connectedId) {
        const switchObs = this.obstacles.find((o) => o.id === obs.connectedId);
        if (switchObs && switchObs.state === 'active') {
          // Slide door upward/open
          if (obs.height > 10) {
            obs.height = Math.max(10, obs.height - 40 * dt);
            obs.state = 'open';
          }
        }
      }
    });
  }

  private updateDrops(dt: number) {
    const activeDrops = this.drops.filter((d) => d.state === 'active');

    // 1. Fluid-fluid particle interaction (stacking & pooling without merging into single point)
    for (let i = 0; i < activeDrops.length; i++) {
      for (let j = i + 1; j < activeDrops.length; j++) {
        const d1 = activeDrops[i];
        const d2 = activeDrops[j];
        const dx = d2.x - d1.x;
        const dy = d2.y - d1.y;
        const distSq = dx * dx + dy * dy;
        const minDist = d1.radius + d2.radius;

        if (distSq > 0 && distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq);
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          // Soft repulsive force for fluid layering
          const force = overlap * 0.15;
          d1.vx -= nx * force;
          d1.vy -= ny * force;
          d2.vx += nx * force;
          d2.vy += ny * force;
        }
      }
    }

    // 2. Individual drop physics & interactions
    this.drops.forEach((drop) => {
      if (drop.state !== 'active') return;

      // Update portal cooldown timer
      if (drop.portalCooldown && drop.portalCooldown > 0) {
        drop.portalCooldown -= dt;
      }

      // Trail history update
      drop.trail.push({ x: drop.x, y: drop.y });
      if (drop.trail.length > 6) drop.trail.shift();

      let currentGravity = { ...this.gravity };

      // Check environmental forces & gravity zones
      this.obstacles.forEach((obs) => {
        if (obs.state === 'broken') return;

        // Gravity Zone
        if (obs.type === 'gravityZone') {
          if (this.isPointInsideBox(drop, obs)) {
            currentGravity.x = obs.extraData?.gravityX ?? 0;
            currentGravity.y = obs.extraData?.gravityY ?? -12;
          }
        }

        // Fan wind push
        if (obs.type === 'fan') {
          if (this.isPointInsideBox(drop, obs)) {
            const windForce = obs.extraData?.force ?? 18;
            const angle = obs.rotation || 0;
            drop.vx += Math.cos(angle) * windForce * dt;
            drop.vy += Math.sin(angle) * windForce * dt;
          }
        }

        // Magnetic Field
        if (obs.type === 'magnet') {
          const dx = obs.x - drop.x;
          const dy = obs.y - drop.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 22500) {
            // 150px radius
            const dist = Math.sqrt(distSq) || 1;
            const magForce = (obs.extraData?.force ?? 2500) / (distSq + 100);
            const polarity = obs.extraData?.magneticPolarity === 'repel' ? -1 : 1;
            drop.vx += (dx / dist) * magForce * polarity;
            drop.vy += (dy / dist) * magForce * polarity;
          }
        }
      });

      // Integrate Gravity & Velocity
      drop.vx += currentGravity.x * dt;
      drop.vy += currentGravity.y * dt;

      // Apply air drag
      drop.vx *= 0.992;
      drop.vy *= 0.992;

      // Move drop position
      drop.x += drop.vx;
      drop.y += drop.vy;

      // 3. Collision with Drawn Line
      if (this.drawnLine && this.drawnLine.points.length > 1) {
        this.checkLineCollision(drop);
      }

      // 4. Collision with Obstacles
      this.obstacles.forEach((obs) => {
        if (obs.state === 'broken') return;
        this.checkObstacleCollision(drop, obs);
      });

      // 5. Container Collection Check
      this.containers.forEach((container) => {
        if (
          drop.x >= container.x - container.width / 2 &&
          drop.x <= container.x + container.width / 2 &&
          drop.y >= container.y - container.height / 2 &&
          drop.y <= container.y + container.height / 2
        ) {
          if (
            !container.requiredType ||
            container.requiredType === drop.energyType
          ) {
            drop.state = 'collected';
            container.currentCount++;

            const progress = container.currentCount / container.targetCount;
            soundEngine.playContainerFill(progress);

            if (this.onSplashCallback) {
              this.onSplashCallback(drop.x, drop.y, drop.color, 6, 3);
            }

            if (container.currentCount >= container.targetCount) {
              container.isFull = true;
              if (this.onSplashCallback) {
                this.onSplashCallback(container.x, container.y, drop.color, 24, 6);
              }
            }

            if (this.onContainerFillCallback) {
              this.onContainerFillCallback(container.id, container.currentCount);
            }
          }
        }
      });

      // Boundary cleanup (Lost drops)
      if (
        drop.y > this.canvasHeight + 50 ||
        drop.x < -50 ||
        drop.x > this.canvasWidth + 50
      ) {
        drop.state = 'lost';
      }
    });
  }

  private checkLineCollision(drop: Drop) {
    const linesToCheck: DrawnLine[] = [...this.drawnLines];
    if (this.activeDrawingLine && this.activeDrawingLine.points.length > 1) {
      linesToCheck.push(this.activeDrawingLine);
    }
    if (linesToCheck.length === 0) return;

    for (const line of linesToCheck) {
      const pts = line.points;
      const thickness = (line.thickness || 8) / 2;

      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i + 1];

        const closest = this.getClosestPointOnSegment(p1, p2, { x: drop.x, y: drop.y });
        const dx = drop.x - closest.x;
        const dy = drop.y - closest.y;
        const distSq = dx * dx + dy * dy;
        const minDist = drop.radius + thickness;

        if (distSq < minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const nx = dx / dist;
          const ny = dy / dist;

          // Reposition drop to line boundary
          drop.x = closest.x + nx * minDist;
          drop.y = closest.y + ny * minDist;

          // Reflect velocity vector along normal with bounce and friction
          const dot = drop.vx * nx + drop.vy * ny;
          if (dot < 0) {
            const restitution = 0.35; // Bounciness
            const friction = 0.85;

            drop.vx = (drop.vx - (1 + restitution) * dot * nx) * friction;
            drop.vy = (drop.vy - (1 + restitution) * dot * ny) * friction;
            soundEngine.playLiquidSplash(0.9);
            if (this.onSplashCallback && Math.abs(dot) > 0.4) {
              this.onSplashCallback(drop.x, drop.y, drop.color, 4, 3);
            }
          }
        }
      }
    }
  }

  private checkObstacleCollision(drop: Drop, obs: Obstacle) {
    // Portal teleportation (Portal Alpha / Portal Beta & Shadow Portals)
    if ((obs.type === 'portal' || obs.type === 'shadowPortal') && obs.connectedId) {
      if (!drop.portalCooldown || drop.portalCooldown <= 0) {
        const dist = Math.hypot(drop.x - obs.x, drop.y - obs.y);
        if (dist < obs.width / 2 + 6) {
          const destObs = this.obstacles.find((o) => o.id === obs.connectedId);
          if (destObs) {
            // Calculate destination exit offset below/outside destination portal
            const offsetDist = destObs.height / 2 + drop.radius + 12;
            drop.x = destObs.x + (Math.random() - 0.5) * 6;
            drop.y = destObs.y + offsetDist;

            // Preserve downward momentum or exit velocity
            drop.vy = Math.max(5, Math.abs(drop.vy));
            drop.vx *= 0.8;

            // Set portal cooldown so droplet doesn't bounce back instantly
            drop.portalCooldown = 0.35;

            soundEngine.playPortalSwoosh();

            // Particle energy burst at both entrance and exit portals
            if (this.onSplashCallback) {
              this.onSplashCallback(obs.x, obs.y, obs.color || '#a855f7', 16, 5);
              this.onSplashCallback(destObs.x, destObs.y, destObs.color || '#00f0ff', 20, 6);
            }
            return;
          }
        }
      }
    }

    // Plasma Energy burning Wood or Ice
    if (drop.energyType === 'plasma') {
      if (obs.type === 'breakableWood' || obs.type === 'breakableIce') {
        if (this.isPointInsideBox(drop, obs)) {
          obs.state = 'broken';
          soundEngine.playBreakObject();
          if (this.onBreakObjectCallback) {
            this.onBreakObjectCallback(obs.id);
          }
          return;
        }
      }
    }

    // Nature Energy growing Vine
    if (drop.energyType === 'nature' && obs.type === 'vine') {
      if (this.isPointInsideBox(drop, obs)) {
        obs.height = Math.min(200, obs.height + 15);
        obs.state = 'grown';
      }
    }

    // Switch activation
    if (obs.type === 'switch') {
      if (this.isPointInsideBox(drop, obs)) {
        if (obs.state !== 'active') {
          obs.state = 'active';
          soundEngine.playSwitchTrigger();
        }
      }
    }

    // Spring Bounce
    if (obs.type === 'spring') {
      if (this.isPointInsideBox(drop, obs)) {
        drop.vy = -Math.abs(drop.vy * 1.5) - 8;
        soundEngine.playLiquidSplash(1.5);
        return;
      }
    }

    // Standard Solid Box Collision (Ramp, Rotator, Door, etc.)
    if (
      obs.type === 'ramp' ||
      obs.type === 'rotator' ||
      obs.type === 'door' ||
      obs.type === 'breakableWood' ||
      obs.type === 'breakableIce' ||
      obs.type === 'gear' ||
      obs.type === 'vine'
    ) {
      this.checkOrientedBoxCollision(drop, obs);
    }
  }

  private checkOrientedBoxCollision(drop: Drop, obs: Obstacle) {
    // Convert drop coordinates into obstacle local rotated space
    const cos = Math.cos(-(obs.rotation || 0));
    const sin = Math.sin(-(obs.rotation || 0));

    const dx = drop.x - obs.x;
    const dy = drop.y - obs.y;

    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const halfW = obs.width / 2;
    const halfH = obs.height / 2;

    const closestX = Math.max(-halfW, Math.min(halfW, localX));
    const closestY = Math.max(-halfH, Math.min(halfH, localY));

    const distX = localX - closestX;
    const distY = localY - closestY;
    const distSq = distX * distX + distY * distY;

    if (distSq < drop.radius * drop.radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const localNx = distX / dist;
      const localNy = distY / dist;

      // Transform local normal back to world space
      const worldCos = Math.cos(obs.rotation || 0);
      const worldSin = Math.sin(obs.rotation || 0);

      const worldNx = localNx * worldCos - localNy * worldSin;
      const worldNy = localNx * worldSin + localNy * worldCos;

      // Adjust drop position out of overlap
      drop.x = obs.x + (closestX + localNx * drop.radius) * worldCos - (closestY + localNy * drop.radius) * worldSin;
      drop.y = obs.y + (closestX + localNx * drop.radius) * worldSin + (closestY + localNy * drop.radius) * worldCos;

      // Reflect velocity
      const dot = drop.vx * worldNx + drop.vy * worldNy;
      if (dot < 0) {
        const restitution = 0.4;
        const friction = 0.88;
        drop.vx = (drop.vx - (1 + restitution) * dot * worldNx) * friction;
        drop.vy = (drop.vy - (1 + restitution) * dot * worldNy) * friction;

        // If rotator or gear, transfer tangential speed
        if (obs.type === 'rotator' || obs.type === 'gear') {
          const rotSpeed = obs.speed || 1.5;
          drop.vx += -worldNy * rotSpeed * 3;
          drop.vy += worldNx * rotSpeed * 3;
        }
      }
    }
  }

  private isPointInsideBox(point: Point2D, box: Obstacle): boolean {
    return (
      point.x >= box.x - box.width / 2 &&
      point.x <= box.x + box.width / 2 &&
      point.y >= box.y - box.height / 2 &&
      point.y <= box.y + box.height / 2
    );
  }

  private getClosestPointOnSegment(p1: Point2D, p2: Point2D, pt: Point2D): Point2D {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;

    if (lenSq === 0) return { x: p1.x, y: p1.y };

    let t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));

    return {
      x: p1.x + t * dx,
      y: p1.y + t * dy,
    };
  }

  // Check overall level completion state
  public isLevelComplete(): boolean {
    if (this.containers.length === 0) return false;
    return this.containers.every((c) => c.currentCount >= c.targetCount);
  }

  // Check if simulation ended (all drops collected or lost)
  public isSimulationFinished(): boolean {
    return this.drops.every((d) => d.state !== 'active');
  }
}
