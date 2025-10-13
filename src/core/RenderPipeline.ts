import * as THREE from 'three';
import { EventBus, Events } from './EventBus';
import { TimeManager } from './TimeManager';
import { StateManager } from './StateManager';

interface Updatable {
  update(deltaTime: number, elapsedTime: number): void;
}

interface Renderable {
  render(): void;
}

export class RenderPipeline {
  private updatables: Set<Updatable> = new Set();
  private renderables: Set<Renderable> = new Set();
  private timeManager: TimeManager;
  private stateManager: StateManager;
  private eventBus: EventBus;
  private isRunning: boolean = false;
  private animationId: number | null = null;
  
  constructor() {
    this.timeManager = TimeManager.getInstance();
    this.stateManager = StateManager.getInstance();
    this.eventBus = EventBus.getInstance();
  }
  
  registerUpdatable(updatable: Updatable) {
    this.updatables.add(updatable);
  }
  
  unregisterUpdatable(updatable: Updatable) {
    this.updatables.delete(updatable);
  }
  
  registerRenderable(renderable: Renderable) {
    this.renderables.add(renderable);
  }
  
  unregisterRenderable(renderable: Renderable) {
    this.renderables.delete(renderable);
  }
  
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }
  
  stop() {
    this.isRunning = false;
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  private animate = () => {
    if (!this.isRunning) return;
    
    this.animationId = requestAnimationFrame(this.animate);
    
    // Update time
    this.timeManager.update(performance.now());
    
    const deltaTime = this.timeManager.getDeltaTime();
    const elapsedTime = this.timeManager.getElapsedTime();
    
    // Update phase
    this.updatables.forEach(updatable => {
      updatable.update(deltaTime, elapsedTime);
    });
    
    // Render phase
    this.renderables.forEach(renderable => {
      renderable.render();
    });
  }
}