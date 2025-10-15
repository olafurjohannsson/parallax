
import * as THREE from 'three';
import { EventBus, Events } from './EventBus';
import { StateManager } from './StateManager';
import { planetDatabase } from '../data/planetInfo';
import { getColorForBody } from '../data/visualData';

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
    private _createAxialHighlight(bodyId: string, color: THREE.Color, isDashed: boolean = false): THREE.Object3D | null {
        const body = this.bodies.get(bodyId);
        if (!body) return null;

        const effectGroup = new THREE.Group();
        const radius = this._getBodyRadius(body);
        const planetInfo = planetDatabase[bodyId];
        const highlightColor = getColorForBody(bodyId);

        const poleLength = radius * 1.5;
        const poleGeo = new THREE.CylinderGeometry(0.02, 0.02, poleLength, 8);

        if (isDashed) {
            highlightColor.multiplyScalar(1.5); 
        }

        let poleMat;
        if (isDashed) {
            poleMat = new THREE.LineDashedMaterial({
                color: highlightColor,
                dashSize: 0.1,
                gapSize: 0.1,
            });
            const line = new THREE.Line(poleGeo, poleMat);
            line.computeLineDistances();
            effectGroup.add(line);
        } else {
            poleMat = new THREE.MeshBasicMaterial({ color: highlightColor });
            const pole = new THREE.Mesh(poleGeo, poleMat);
            effectGroup.add(pole);
        }

        if (planetInfo && planetInfo.axialTilt !== undefined) {
            const tilt = planetInfo.axialTilt * (Math.PI / 180);
            effectGroup.rotation.z = tilt;
        }

        body.add(effectGroup);
        return effectGroup;
    }
    private _createHoverEffect(bodyId: string) {
        if (this.stateManager.getState().selectedBody === bodyId) return;
        this._destroyHoverEffect();
        this.hoverEffect = this._createAxialHighlight(bodyId, true); 
    }

    private _createSelectionEffect(bodyId: string) {
        this._destroySelectionEffect();
        this.selectionEffect = this._createAxialHighlight(bodyId, false); 
    }

    private _destroyHoverEffect() {
        if (this.hoverEffect) {
            this.hoverEffect.parent?.remove(this.hoverEffect);
            (this.hoverEffect.children[0] as THREE.Line).geometry.dispose();
            ((this.hoverEffect.children[0] as THREE.Line).material as THREE.Material).dispose();
            this.hoverEffect = null;
        }
    }


    private _destroySelectionEffect() {
        if (this.selectionEffect) {
            this.selectionEffect.parent?.remove(this.selectionEffect);
            (this.selectionEffect.children[0] as THREE.Mesh).geometry.dispose();
            ((this.selectionEffect.children[0] as THREE.Mesh).material as THREE.Material).dispose();
            this.selectionEffect = null;
        }
    }


    public update(deltaTime: number) {
        if (this.hoverEffect?.userData.uniforms) {
            this.hoverEffect.userData.uniforms.time.value += deltaTime;
        }
        if (this.selectionEffect?.userData.animation) {
            const { ring } = this.selectionEffect.userData.animation;
            ring.rotation.z += deltaTime * 0.3;
        }
    }


    private _getBodyRadius(body: THREE.Object3D): number {
        const box = new THREE.Box3().setFromObject(body);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        return sphere.radius;
    }

}