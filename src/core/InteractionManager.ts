import * as THREE from 'three';
import { EventBus, Events } from './EventBus';
import { StateManager } from './StateManager';

export class InteractionManager {
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private mouseDown: THREE.Vector2;
  private isDragging: boolean = false;
  private dragThreshold: number = 5; // pixels
  
  private eventBus: EventBus;
  private stateManager: StateManager;
  private canvas: HTMLCanvasElement;
  private camera: THREE.Camera;
  private interactables: Map<string, THREE.Object3D>;
  
  constructor(canvas: HTMLCanvasElement, camera: THREE.Camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.mouseDown = new THREE.Vector2();
    this.interactables = new Map();
    
    this.eventBus = EventBus.getInstance();
    this.stateManager = StateManager.getInstance();
    
    this.setupEventListeners();
  }
  
  private setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
    
    // Touch support
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
  }
  
  registerInteractable(id: string, object: THREE.Object3D) {
    this.interactables.set(id, object);
  }
  
  unregisterInteractable(id: string) {
    this.interactables.delete(id);
  }
  
  private onMouseDown(event: MouseEvent) {
    this.mouseDown.x = event.clientX;
    this.mouseDown.y = event.clientY;
    this.isDragging = false;
  }
  
  private onMouseMove(event: MouseEvent) {
    // Check if dragging
    if (this.mouseDown.x !== undefined) {
      const dx = Math.abs(event.clientX - this.mouseDown.x);
      const dy = Math.abs(event.clientY - this.mouseDown.y);
      if (dx > this.dragThreshold || dy > this.dragThreshold) {
        this.isDragging = true;
      }
    }
    
    this.mouse.x = (event.clientX / this.canvas.width) * 2 - 1;
    this.mouse.y = -(event.clientY / this.canvas.height) * 2 + 1;
    
    this.checkHover(event.clientX, event.clientY);
  }
  
  private onMouseUp(event: MouseEvent) {
    if (!this.isDragging) {
      this.handleClick();
    }
    this.isDragging = false;
    this.mouseDown.x = undefined;
    this.mouseDown.y = undefined;
  }
  
  private onMouseLeave() {
    const currentHover = this.stateManager.getState().hoveredBody;
    if (currentHover) {
      this.stateManager.hoverBody(null);
      this.eventBus.emit(Events.BODY_HOVER_END, { id: currentHover });
    }
    this.canvas.style.cursor = 'default';
  }
  
private checkHover(clientX: number, clientY: number) {
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const objects = Array.from(this.interactables.values());
    const intersects = this.raycaster.intersectObjects(objects, true);

    let hoveredBodyId: string | null = null;

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      const userData = intersectedObject.userData;

      if (userData.type === 'orbit') {
        hoveredBodyId = userData.id;
      } else if (userData.id) {
        hoveredBodyId = userData.id;
      } else if (intersectedObject.parent?.userData.id) {
        hoveredBodyId = intersectedObject.parent.userData.id;
      }
    }
    const currentHover = this.stateManager.getState().hoveredBody;

    if (hoveredBodyId !== currentHover) {
      if (currentHover) {
        this.eventBus.emit(Events.BODY_HOVER_END, { id: currentHover });
      }
      
      if (hoveredBodyId) {
        this.stateManager.hoverBody(hoveredBodyId);
        this.eventBus.emit(Events.BODY_HOVER, { id: hoveredBodyId, x: clientX, y: clientY });
        this.canvas.style.cursor = 'pointer';
      } else {
        this.stateManager.hoverBody(null);
        this.canvas.style.cursor = 'default';
      }
    }
  }

  private handleClick() {
    const hoveredBody = this.stateManager.getState().hoveredBody;
    if (hoveredBody) {
      this.stateManager.selectBody(hoveredBody);
      this.eventBus.emit(Events.BODY_CLICK, { id: hoveredBody });
    }
  }
  
  private onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.mouseDown.x = touch.clientX;
      this.mouseDown.y = touch.clientY;
      this.isDragging = false;
    }
  }
  
  private onTouchMove(event: TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      const dx = Math.abs(touch.clientX - this.mouseDown.x);
      const dy = Math.abs(touch.clientY - this.mouseDown.y);
      if (dx > this.dragThreshold || dy > this.dragThreshold) {
        this.isDragging = true;
      }
    }
  }
  
  private onTouchEnd(event: TouchEvent) {
    if (!this.isDragging && event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      this.mouse.x = (touch.clientX / this.canvas.width) * 2 - 1;
      this.mouse.y = -(touch.clientY / this.canvas.height) * 2 + 1;
      this.handleClick();
    }
    this.isDragging = false;
  }
  
  update() {
    
  }
  
  dispose() {
    this.canvas.removeEventListener('mousedown', this.onMouseDown);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseup', this.onMouseUp);
    this.canvas.removeEventListener('mouseleave', this.onMouseLeave);
    this.canvas.removeEventListener('touchstart', this.onTouchStart);
    this.canvas.removeEventListener('touchmove', this.onTouchMove);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
  }
}