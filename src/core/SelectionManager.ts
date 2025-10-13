
import * as THREE from 'three';
import { EventBus, Events } from './EventBus';
import { StateManager } from './StateManager';

export class SelectionManager {
  private scene: THREE.Scene;
  private bodies: Map<string, THREE.Object3D>;
  private eventBus: EventBus;
  private stateManager: StateManager;

  private hoverEffect: THREE.Group | null = null;
  private selectionEffect: THREE.Group | null = null;

  constructor(scene: THREE.Scene, bodies: Map<string, THREE.Object3D>) {
    this.scene = scene;
    this.bodies = bodies;
    this.eventBus = EventBus.getInstance();
    this.stateManager = StateManager.getInstance();
    this._setupEventListeners();
  }

  private _setupEventListeners() {
    this.eventBus.on(Events.BODY_HOVER, ({ id }) => this._createHoverEffect(id));
    this.eventBus.on(Events.BODY_HOVER_END, () => this._destroyHoverEffect());
    
    // Listen for changes to the global selectedBody state
    this.eventBus.on('state:selectedBody', ({ newValue }) => {
      this._destroySelectionEffect();
      if (newValue) {
        this._createSelectionEffect(newValue);
      }
    });
  }

  private _createHoverEffect(bodyId: string) {
    // Don't show hover effect if the body is already selected
    if (this.stateManager.getState().selectedBody === bodyId) {
      this._destroyHoverEffect();
      return;
    }
      
    const body = this.bodies.get(bodyId);
    if (!body) return;

    this._destroyHoverEffect();

    const effectGroup = new THREE.Group();
    const radius = this._getBodyRadius(body) * 1.2; // 20% 

    const geometry = new THREE.TorusGeometry(radius, 0.1, 8, 100);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff, // Cyan
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2; // algin equator
    
    effectGroup.add(ring);
    this.hoverEffect = effectGroup;
    body.add(this.hoverEffect);
  }

  private _destroyHoverEffect() {
    if (this.hoverEffect) {
      this.hoverEffect.parent?.remove(this.hoverEffect);
      (this.hoverEffect.children[0] as THREE.Mesh).geometry.dispose();
      ((this.hoverEffect.children[0] as THREE.Mesh).material as THREE.Material).dispose();
      this.hoverEffect = null;
    }
  }

  private _createSelectionEffect(bodyId: string) {
    const body = this.bodies.get(bodyId);
    if (!body) return;

    this._destroySelectionEffect();

    const effectGroup = new THREE.Group();
    const radius = this._getBodyRadius(body) * 1.3;

    // first ring
    const ring1Geo = new THREE.TorusGeometry(radius, 0.08, 8, 100);
    const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x667eea, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.9 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 2;

    // second rotated ring
    const ring2 = ring1.clone();
    ring2.rotation.y = Math.PI / 2;
    
    effectGroup.add(ring1, ring2);
    effectGroup.userData.animation = { ring1, ring2 };

    this.selectionEffect = effectGroup;
    body.add(this.selectionEffect);
  }

  private _destroySelectionEffect() {
    if (this.selectionEffect) {
      this.selectionEffect.parent?.remove(this.selectionEffect);
      this.selectionEffect.children.forEach(child => {
        (child as THREE.Mesh).geometry.dispose();
        ((child as THREE.Mesh).material as THREE.Material).dispose();
      });
      this.selectionEffect = null;
    }
  }

  private _getBodyRadius(body: THREE.Object3D): number {
    const box = new THREE.Box3().setFromObject(body);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return sphere.radius;
  }

  public update(deltaTime: number) {
    if (this.selectionEffect?.userData.animation) {
      const { ring1, ring2 } = this.selectionEffect.userData.animation;
      ring1.rotation.z += deltaTime * 0.5;
      ring2.rotation.z -= deltaTime * 0.3;
    }
  }
}