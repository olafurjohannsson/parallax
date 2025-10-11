

export class SolarSystemMinimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLDivElement;
  private hoveredPlanet: string | null = null;
  private bodies: Map<string, THREE.Mesh> = new Map();
  private scale: number = 0.5;
  private size: number = 300;
  
  constructor(onPlanetClick: (planetId: string) => void) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 140px;
      right: 20px;
      width: 320px;
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
    
    document.body.appendChild(this.container);
    
    this.ctx = this.canvas.getContext('2d')!;
    
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => {
      if (this.hoveredPlanet) {
        onPlanetClick(this.hoveredPlanet);
      }
    });
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredPlanet = null;
      this.updateTooltip('');
    });
  }
  
  private onMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = this.size / 2;
    
    let closestPlanet: string | null = null;
    let closestDist = Infinity;
    
    this.bodies.forEach((mesh, id) => {
      if (id === 'sun' || id === 'iss') return;
      
      const px = center + mesh.position.x * this.scale;
      const py = center + mesh.position.z * this.scale;
      const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
      
      if (dist < 15 && dist < closestDist) {
        closestDist = dist;
        closestPlanet = id;
      }
    });
    
    this.hoveredPlanet = closestPlanet;
    this.updateTooltip(closestPlanet ? this.getPlanetName(closestPlanet) : '');
  }
    private calculateScale(bodies: Map<string, THREE.Mesh>): number {

    let maxRadius = 0;
    bodies.forEach((mesh, id) => {
      if (id === 'sun' || id === 'iss') return;
      const orbitRadius = mesh.userData.orbitRadius || 0;
      maxRadius = Math.max(maxRadius, orbitRadius);
    });
    
    const padding = 20; // pixels
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
    };
    return names[id] || id;
  }
  
  private updateTooltip(text: string) {
    const tooltip = document.getElementById('minimap-tooltip');
    if (tooltip) {
      tooltip.textContent = text || '\u00A0'; // nbsp if empty
    }
  }
  
  update(bodies: Map<string, THREE.Mesh>, cameraPos: THREE.Vector3) {
    this.bodies = bodies;
    this.scale = this.calculateScale(bodies);
    
    const ctx = this.ctx;
    const center = this.size / 2;
    
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, center);
    gradient.addColorStop(0, 'rgba(10, 10, 30, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 10, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.size, this.size);
    
    bodies.forEach((mesh, id) => {
      if (id === 'sun' || id === 'iss') return;
      
      const orbitRadius = mesh.userData.orbitRadius * this.scale;
      ctx.strokeStyle = 'rgba(102, 126, 234, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(center, center, orbitRadius, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    const sunGradient = ctx.createRadialGradient(center, center, 0, center, center, 12);
    sunGradient.addColorStop(0, '#FDB813');
    sunGradient.addColorStop(0.5, '#FD8813');
    sunGradient.addColorStop(1, 'rgba(253, 136, 19, 0)');
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(center, center, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#FFF5E6';
    ctx.beginPath();
    ctx.arc(center, center, 5, 0, Math.PI * 2);
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
    };
    
    bodies.forEach((mesh, id) => {
      if (id === 'sun' || id === 'iss') return;
      
      const x = center + mesh.position.x * this.scale;
      const y = center + mesh.position.z * this.scale;
      const isHovered = this.hoveredPlanet === id;
      const radius = isHovered ? 5 : 4;
      
      if (isHovered) {
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = planetColors[id];
        ctx.lineWidth = 2;
        ctx.beginPath();
        const pulseRadius = 10 + Math.sin(Date.now() * 0.005) * 2;
        ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      ctx.fillStyle = planetColors[id];
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = isHovered ? 'white' : 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    const camX = center + cameraPos.x * this.scale;
    const camY = center + cameraPos.z * this.scale;
    
    const camGradient = ctx.createRadialGradient(camX, camY, 0, camX, camY, 10);
    camGradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)');
    camGradient.addColorStop(1, 'rgba(102, 126, 234, 0)');
    ctx.fillStyle = camGradient;
    ctx.beginPath();
    ctx.arc(camX, camY, 10, 0, Math.PI * 2);
    ctx.fill();
    
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