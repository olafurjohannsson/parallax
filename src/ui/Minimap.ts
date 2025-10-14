import * as THREE from 'three';
import { EventBus, Events } from '../core/EventBus';

export class SolarSystemMinimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private hoveredPlanet: string | null = null;
  private bodies: Map<string, THREE.Mesh | THREE.Group> = new Map();
  private scale: number = 0.4;
  private size: number = 340;
  private zoomLevel: number = 1.0;
  private eventBus: EventBus;
  private prevHoveredPlanet: string | null = null;

  constructor(private onPlanetClick: (planetId: string) => void) {
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
    
    // Add zoom controls
    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 10px;
      margin-top: 8px;
    `;
    
    const zoomOut = document.createElement('button');
    zoomOut.textContent = '−';
    zoomOut.style.cssText = `
      width: 30px;
      height: 30px;
      background: rgba(102, 126, 234, 0.2);
      border: 1px solid rgba(102, 126, 234, 0.5);
      color: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 18px;
    `;
    zoomOut.onclick = () => this.setZoom(Math.min(this.zoomLevel * 1.5, 5));
    
    const zoomIn = document.createElement('button');
    zoomIn.textContent = '+';
    zoomIn.style.cssText = zoomOut.style.cssText;
    zoomIn.onclick = () => this.setZoom(Math.max(this.zoomLevel * 0.7, 0.1));
    
    const resetZoom = document.createElement('button');
    resetZoom.textContent = '⟲';
    resetZoom.style.cssText = zoomOut.style.cssText;
    resetZoom.onclick = () => this.setZoom(1.0);
    
    controls.appendChild(zoomOut);
    controls.appendChild(resetZoom);
    controls.appendChild(zoomIn);
    this.container.appendChild(controls);
    
    document.body.appendChild(this.container);
    
    this.ctx = this.canvas.getContext('2d')!;
    
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredPlanet) {
        this.onPlanetClick(this.hoveredPlanet);
      }
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredPlanet = null;
      this.updateTooltip('');
    });
    
    // Mouse wheel zoom
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 1.1 : 0.9;
      
      this.setZoom(Math.min(5, this.zoomLevel * delta));
    });
  }
  
  private setZoom(level: number) {
    console.log('zoom', level)
    this.zoomLevel = level;
    // Force redraw by calling update with current bodies and camera
    const lastBodies = this.bodies;
    if (lastBodies.size > 0) {
      const camBody = lastBodies.get('earth') || lastBodies.get('sun');
      if (camBody) {
        this.update(lastBodies, camBody.position);
      }
    }
  }
  
private onMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = this.size / 2;
    
    let closestPlanet: string | null = null;
    let closestDist = Infinity;
    
    this.bodies.forEach((mesh, id) => {
      if (id === 'sun') {
        // Check sun separately
        const dist = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (dist < 12) {
          closestDist = dist;
          closestPlanet = 'sun';
        }
        return;
      }
      
      if (id === 'iss' || id === 'moon' || id.startsWith('event_')) return;
      
      const px = center + mesh.position.x * this.scale * this.zoomLevel;
      const py = center + mesh.position.z * this.scale * this.zoomLevel;
      
      // Skip if outside canvas
      if (px < 0 || px > this.size || py < 0 || py > this.size) return;
      
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      
      if (dist < 15 && dist < closestDist) {
        closestDist = dist;
        closestPlanet = id;
      }
    });
    if (closestPlanet !== this.prevHoveredPlanet) {
      // If we were hovering something before, fire the hover_end event
      if (this.prevHoveredPlanet) {
        this.eventBus.emit(Events.BODY_HOVER_END, { id: this.prevHoveredPlanet });
      }
      // If we are hovering something new, fire the hover event
      if (closestPlanet) {
        this.eventBus.emit(Events.BODY_HOVER, { id: closestPlanet });
      }
      
      this.prevHoveredPlanet = closestPlanet;
    }
    
    this.hoveredPlanet = closestPlanet;
    this.updateTooltip(closestPlanet ? this.getPlanetName(closestPlanet) : '');
  }
  
  private calculateScale(bodies: Map<string, THREE.Mesh | THREE.Group>): number {
    const neptune = bodies.get('neptune');
    const maxRadius = neptune?.userData.orbitRadius || 260;
    
    if (maxRadius === 0) return 0.5;
    
    const padding = 30;
    const usableRadius = (this.size / 2) - padding;
    return usableRadius / maxRadius;
  }
  
  private getPlanetName(id: string): string {
    const names: Record<string, string> = {
      mercury: 'Mercury',
      venus: 'Venus',
      earth: 'Earth',
      mars: 'Mars',
      jupiter: 'Jupiter',
      saturn: 'Saturn',
      uranus: 'Uranus',
      neptune: 'Neptune',
      sun: 'Sun',
      moon: 'Moon',
      iss: 'ISS',
    };
    return names[id] || id;
  }
  
  private updateTooltip(text: string) {
    const tooltip = document.getElementById('minimap-tooltip');
    if (tooltip) {
      tooltip.textContent = text || '\u00A0';
    }
  }
  
  update(bodies: Map<string, THREE.Mesh | THREE.Group>, cameraPos: THREE.Vector3) {
    this.bodies = bodies;
    this.scale = this.calculateScale(bodies);
    
    const ctx = this.ctx;
    const center = this.size / 2;
    
    // Clear and draw background
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(10, 10, 30, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 10, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.size, this.size);
    
    const orbitAlpha = Math.max(0.05, 0.2 / this.zoomLevel);
    bodies.forEach((mesh, id) => {
      if (id === 'sun' || id === 'iss' || id === 'moon' || id.startsWith('event_')) return;
      
      const orbitRadius = mesh.userData.orbitRadius * this.scale * this.zoomLevel;
      if (orbitRadius > 0 && orbitRadius < this.size) {
        ctx.strokeStyle = `rgba(102, 126, 234, ${orbitAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(center, center, orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    
    // Draw sun (always centered)
    const sunSize = Math.max(8, 12 / Math.sqrt(this.zoomLevel));
    const sunGradient = ctx.createRadialGradient(center, center, 0, center, center, sunSize);
    sunGradient.addColorStop(0, '#FDB813');
    sunGradient.addColorStop(0.5, '#FD8813');
    sunGradient.addColorStop(1, 'rgba(253, 136, 19, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(center, center, sunSize, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF5E6';
    ctx.beginPath();
    ctx.arc(center, center, sunSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    const planetColors: Record<string, string> = {
      mercury: '#8C7853',
      venus: '#FFC649',
      earth: '#4169E1',
      mars: '#CD5C5C',
      jupiter: '#DAA520',
      saturn: '#F4A460',
      uranus: '#4FD0E0',
      neptune: '#4169E1',
      moon: '#CCCCCC',
      iss: '#FFFFFF',
    };
    
    const planetSizes: Record<string, number> = {
      mercury: 2,
      venus: 3.5,
      earth: 3.5,
      mars: 3,
      jupiter: 6,
      saturn: 5.5,
      uranus: 4,
      neptune: 4,
      moon: 2,
      iss: 1.5,
    };
    
    bodies.forEach((mesh, id) => {
      if (id === 'sun' || id.startsWith('event_')) return;
      
      const x = center + mesh.position.x * this.scale * this.zoomLevel;
      const y = center + mesh.position.z * this.scale * this.zoomLevel;
      
      if (x < -20 || x > this.size + 20 || y < -20 || y > this.size + 20) return;
      
      const isHovered = this.hoveredPlanet === id;
      const baseSize = planetSizes[id] || 3;
      const radius = isHovered ? baseSize + 1 : baseSize;
      
      if (isHovered) {
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        glowGradient.addColorStop(0, 'rgba(102, 126, 234, 0.3)');
        glowGradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.fillStyle = planetColors[id] || '#FFFFFF';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      if (id === 'saturn') {
        ctx.strokeStyle = '#F4A460';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(x, y, radius * 2.2, radius * 0.8, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.strokeStyle = isHovered ? 'white' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isHovered ? 1.5 : 0.5;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    
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