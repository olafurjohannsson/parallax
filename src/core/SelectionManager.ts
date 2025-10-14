
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
        if (this.stateManager.getState().selectedBody === bodyId) return;
        const body = this.bodies.get(bodyId);
        if (!body) return;

        this._destroyHoverEffect();

        const effectGroup = new THREE.Group();
        const radius = this._getBodyRadius(body) * 1.2;

        const geometry = new THREE.TorusGeometry(radius, 0.05, 8, 100);
        // [FIX] Use a dashed line material for hover
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7,
        });
        // This is a trick to make it look dashed without complex shaders
        const segments = 100;
        const points = [];
        for (let i = 0; i < segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            if (i % 4 < 2) { // Create dashes by skipping segments
                points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
            }
        }
        const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
        const ringMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 });
        const ring = new THREE.Line(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;

        effectGroup.add(ring);
        this.hoverEffect = effectGroup;
        body.add(this.hoverEffect);
    }

    private _createSelectionEffect(bodyId: string) {
        const body = this.bodies.get(bodyId);
        if (!body) return;

        this._destroySelectionEffect();

        const effectGroup = new THREE.Group();
        const radius = this._getBodyRadius(body) * 1.3;

        // [FIX] Use a single, thicker, solid ring for selection
        const ringGeo = new THREE.TorusGeometry(radius, 0.1, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x667eea, transparent: true, opacity: 0.9 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;

        effectGroup.add(ring);
        effectGroup.userData.animation = { ring };

        this.selectionEffect = effectGroup;
        body.add(this.selectionEffect);
    }

    private _destroyHoverEffect() {
        if (this.hoverEffect) {
            this.hoverEffect.parent?.remove(this.hoverEffect);
            (this.hoverEffect.children[0] as THREE.Mesh).geometry.dispose();
            ((this.hoverEffect.children[0] as THREE.Mesh).material as THREE.Material).dispose();
            this.hoverEffect = null;
        }
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
            const { ring } = this.selectionEffect.userData.animation;
            ring.rotation.z += deltaTime * 0.3;
        }
    }
}