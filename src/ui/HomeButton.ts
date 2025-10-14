
import { StateManager } from '../core/StateManager';
import { EventBus } from '../core/EventBus';

export class HomeButton {
  private button: HTMLButtonElement;
  
  constructor(private scene: { transitionToOverview: () => void }) {
    this.button = document.createElement('button');
    this.button.id = 'home-button';
    this.button.innerHTML = '🏠'; // Simple Home Emoji Icon
    this._applyStyles();
    
    document.body.appendChild(this.button);
    
    this.button.addEventListener('click', this._onClick.bind(this));
  }
  
  private _applyStyles() {
    this.button.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      width: 50px;
      height: 50px;
      background: rgba(10, 15, 30, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(200, 210, 255, 0.2);
      border-radius: 50%;
      color: white;
      font-size: 24px;
      cursor: pointer;
      z-index: 4000;
      transition: background 0.2s;
    `;
    this.button.addEventListener('mouseenter', () => this.button.style.background = 'rgba(102, 126, 234, 0.5)');
    this.button.addEventListener('mouseleave', () => this.button.style.background = 'rgba(10, 15, 30, 0.7)');
  }

  private _onClick() {
    StateManager.getInstance().selectBody(null);
    this.scene.transitionToOverview();
  }
}