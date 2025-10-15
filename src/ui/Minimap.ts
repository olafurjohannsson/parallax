import * as THREE from 'three';
import { EventBus, Events } from '../core/EventBus';
import { orbitalElements } from '../data/orbitalData';
import { getColorForBody } from '../data/visualData';

export class SolarSystemMinimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private hoveredPlanet: string | null = null;
  private bodies: Map<string, THREE.Object3D> = new Map();
  private scale: number = 1.0;
  private size: number = 340;
  private zoomLevel: number = 1.0;
  private eventBus: EventBus;
  private prevHoveredPlanet: string | null = null;
  private scene: { transitionToBody: (id: string) => void } | null = null;

  constructor() {
    this.eventBus = EventBus.getInstance();
    
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 140px;
      right: 20px;
      width: 360px;
      background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 40, 0.95));
      border: 2px solid rgba(102, 126, 234, 0.6);
      border-radius: 12px;
      padding: 10px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
      z-index: 1000;
    `;
    
    const title = document.createElement('div');
    title.style.cssText = `
      color: white;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #667eea;
    `;
    title.textContent = 'Solar System Map';
    this.container.appendChild(title);
    
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size;
    this.canvas.height = this.size;
    this.canvas.style.cssText = `
      display: block;
      cursor: pointer;
      border-radius: 8px;
    `;
    this.container.appendChild(this.canvas);
    
    const tooltip = document.createElement('div');
    tooltip.id = 'minimap-tooltip';
    tooltip.style.cssText = `
      color: white;
      font-size: 12px;
      text-align: center;
      margin-top: 8px;
      height: 20px;
      color: #667eea;
    `;
    this.container.appendChild(tooltip);
    
    const controls = document.createElement('div');
    controls.style.cssText = `display: flex; justify-content: center; gap: 10px; margin-top: 8px;`;
    
    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    const zoomOut = document.createElement('button');
    zoomOut.textContent = '−';
    const resetZoom = document.createElement('button');
    resetZoom.textContent = '⟲';

    [zoomIn, zoomOut, resetZoom].forEach(btn => {
      btn.style.cssText = `
        width: 30px; height: 30px; background: rgba(102, 126, 234, 0.2);
        border: 1px solid rgba(102, 126, 234, 0.5); color: white; border-radius: 4px;
        cursor: pointer; font-size: 18px;
      `;
    });

    zoomIn.onclick = () => this.setZoom(Math.max(this.zoomLevel * 0.7, 0.1));
    zoomOut.onclick = () => this.setZoom(Math.min(this.zoomLevel * 1.5, 5));
    resetZoom.onclick = () => this.setZoom(1.0);
    
    controls.appendChild(zoomOut);
    controls.appendChild(resetZoom);
    controls.appendChild(zoomIn);
    this.container.appendChild(controls);
    
    document.body.appendChild(this.container);
    
    this.ctx = this.canvas.getContext('2d')!;
    
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', () => {
      if (this.hoveredPlanet && this.scene) {
        this.scene.transitionToBody(this.hoveredPlanet);
      }
    });
    this.canvas.addEventListener('mouseleave', () => {
      if(this.prevHoveredPlanet) {
          this.eventBus.emit(Events.BODY_HOVER_END, { id: this.prevHoveredPlanet });
      }
      this.hoveredPlanet = null;
      this.prevHoveredPlanet = null;
      this.updateTooltip('');
    });
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1.1 : 0.9;
      this.setZoom(this.zoomLevel * delta);
    });
  }
  
  public setScene(scene: { transitionToBody: (id: string) => void }) {
    this.scene = scene;
  }

  private setZoom(level: number) {
    this.zoomLevel = Math.max(0.1, Math.min(level, 10));
  }
  
  private onMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = this.size / 2;
    
    let closestPlanet: string | null = null;
    let closestDist = Infinity;
    
    this.bodies.forEach((mesh, id) => {
      if (id === 'iss' || id.startsWith('event_')) return;
      
      const px = center + mesh.position.x * this.scale * this.zoomLevel;
      const py = center + mesh.position.z * this.scale * this.zoomLevel;
      
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      
      const hitRadius = (id === 'sun') ? 12 : 15;
      if (dist < hitRadius && dist < closestDist) {
        closestDist = dist;
        closestPlanet = id;
      }
    });

    if (closestPlanet !== this.prevHoveredPlanet) {
      if (this.prevHoveredPlanet) {
        this.eventBus.emit(Events.BODY_HOVER_END, { id: this.prevHoveredPlanet });
      }
      if (closestPlanet) {
        this.eventBus.emit(Events.BODY_HOVER, { id: closestPlanet });
      }
      this.prevHoveredPlanet = closestPlanet;
    }
    
    this.hoveredPlanet = closestPlanet;
    this.updateTooltip(closestPlanet ? this.getPlanetName(closestPlanet) : '');
  }
  
  private getPlanetName(id: string): string {
    const names: Record<string, string> = {
      mercury: 'Mercury', venus: 'Venus', earth: 'Earth', mars: 'Mars',
      jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune',
      sun: 'Sun', moon: 'Moon', iss: 'ISS',
    };
    return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
  }
  
  private updateTooltip(text: string) {
    const tooltip = document.getElementById('minimap-tooltip');
    if (tooltip) {
      tooltip.textContent = text || '\u00A0';
    }
  }
  
  update(bodies: Map<string, THREE.Object3D>, cameraPos: THREE.Vector3) {
    this.bodies = bodies;
    const neptuneOrbitRadiusAU = orbitalElements['neptune'].a;
    this.scale = (this.size / 2 - 20) / (neptuneOrbitRadiusAU * 100);

    const ctx = this.ctx;
    const center = this.size / 2;
    
    ctx.clearRect(0, 0, this.size, this.size);
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, this.size / 2);
    gradient.addColorStop(0, 'rgba(10, 10, 30, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 10, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.size, this.size);
    
    // Draw orbital paths
    const orbitAlpha = Math.max(0.1, 0.4 / this.zoomLevel);
    for (const id in orbitalElements) {
      const elements = orbitalElements[id];
      if (elements) {
        const orbitRadiusPixels = elements.a * 100 * this.scale * this.zoomLevel;
        if (orbitRadiusPixels > 1 && orbitRadiusPixels < this.size * 1.5) {
          const color = getColorForBody(id);
          ctx.strokeStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${orbitAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(center, center, orbitRadiusPixels, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    // Draw sun
    const sunSize = Math.max(6, 10 / Math.sqrt(this.zoomLevel));
    const sunColor = getColorForBody('sun');
    ctx.fillStyle = sunColor.getStyle();
    ctx.beginPath();
    ctx.arc(center, center, sunSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Planet sizes
    const planetSizes: Record<string, number> = {
      mercury: 2, venus: 3.5, earth: 3.5, mars: 3, jupiter: 6,
      saturn: 5.5, uranus: 4, neptune: 4, moon: 2, iss: 1.5,
    };
    
    // Draw planets
    bodies.forEach((mesh, id) => {
      if (id === 'sun' || id.startsWith('event_')) return;
      
      const x = center + mesh.position.x * this.scale * this.zoomLevel;
      const y = center + mesh.position.z * this.scale * this.zoomLevel;
      
      if (x < -20 || x > this.size + 20 || y < -20 || y > this.size + 20) return;
      
      const isHovered = this.hoveredPlanet === id;
      const baseSize = (planetSizes[id] || 3) / Math.sqrt(this.zoomLevel);
      const radius = isHovered ? baseSize + 2 : baseSize;
      
      if (isHovered) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const color = getColorForBody(id);
      ctx.fillStyle = color.getStyle();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Draw camera position
    const camX = center + cameraPos.x * this.scale * this.zoomLevel;
    const camY = center + cameraPos.z * this.scale * this.zoomLevel;
    if (camX > -10 && camX < this.size + 10 && camY > -10 && camY < this.size + 10) {
      ctx.strokeStyle = '#667eea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(camX - 6, camY - 6);
      ctx.lineTo(camX + 6, camY + 6);
      ctx.moveTo(camX + 6, camY - 6);
      ctx.lineTo(camX - 6, camY + 6);
      ctx.stroke();
    }
  }
  
  destroy() {
    this.container.remove();
  }
}