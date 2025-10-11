

import { PlanetInfo } from './planetInfo';

export class PlanetTooltip {
  private container: HTMLDivElement;
  
  constructor() {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.95);
      padding: 16px;
      border-radius: 8px;
      border: 2px solid rgba(102, 126, 234, 0.5);
      color: white;
      font-size: 14px;
      pointer-events: none;
      z-index: 10000;
      max-width: 350px;
      display: none;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);
    `;
    document.body.appendChild(this.container);
  }
  
  show(planetInfo: PlanetInfo, x: number, y: number) {
    this.container.innerHTML = `
      <div style="font-size: 20px; font-weight: 700; margin-bottom: 12px; color: #667eea;">
        ${planetInfo.name}
      </div>
      <div style="display: grid; grid-template-columns: auto 1fr; gap: 8px; margin-bottom: 12px;">
        <span style="color: #888;">Diameter:</span>
        <span>${planetInfo.diameter.toLocaleString()} km</span>
        
        <span style="color: #888;">Mass:</span>
        <span>${planetInfo.mass.toFixed(2)} Earth masses</span>
        
        <span style="color: #888;">Gravity:</span>
        <span>${planetInfo.gravity} m/s²</span>
        
        <span style="color: #888;">Day:</span>
        <span>${planetInfo.dayLength.toFixed(1)} hours</span>
        
        <span style="color: #888;">Year:</span>
        <span>${planetInfo.yearLength.toFixed(0)} Earth days</span>
        
        <span style="color: #888;">Moons:</span>
        <span>${planetInfo.moons}</span>
      </div>
      <div style="color: #bbb; font-size: 13px; line-height: 1.5; margin-bottom: 8px;">
        ${planetInfo.description}
      </div>
      ${planetInfo.funFact ? `
        <div style="color: #667eea; font-size: 12px; font-style: italic; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
          💡 ${planetInfo.funFact}
        </div>
      ` : ''}
      <div style="color: #666; font-size: 11px; margin-top: 8px; text-align: center;">
        Click to explore
      </div>
    `;
    
    this.container.style.left = `${x + 20}px`;
    this.container.style.top = `${y + 20}px`;
    this.container.style.display = 'block';
  }
  
  hide() {
    this.container.style.display = 'none';
  }
}