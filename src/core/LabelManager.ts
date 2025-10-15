
import * as THREE from 'three';
import { getColorForBody } from '../data/visualData';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// A helper function for smooth fading
function smoothstep(min: number, max: number, value: number): number {
    const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

export class LabelManager {
    private labelRenderer: CSS2DRenderer;
    private scene: THREE.Scene;
    private camera: THREE.Camera;
    private labels: { [id: string]: { object: CSS2DObject; element: HTMLElement; body: THREE.Object3D } } = {};

    private minFadeDistance = 200;
    private maxFadeDistance = 800;

    constructor(container: HTMLElement, scene: THREE.Scene, camera: THREE.Camera, bodies: Map<string, THREE.Object3D>) {
        this.scene = scene;
        this.camera = camera;

        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = 'absolute';
        this.labelRenderer.domElement.style.top = '0px';
        this.labelRenderer.domElement.style.pointerEvents = 'none';
        container.appendChild(this.labelRenderer.domElement);

        bodies.forEach((body, id) => {
            if (id !== 'iss') { 
                this.createLabel(body, id);
            }
        });

        window.addEventListener('resize', this.onResize.bind(this));
    }

    private createLabel(body: THREE.Object3D, id: string) {
        const element = document.createElement('div');
        const labelColor = getColorForBody(id);
        element.className = 'solkerfi-label';
        element.textContent = id.charAt(0).toUpperCase() + id.slice(1);
        element.style.cssText = `
      color: #fff;
      font-family: Arial, sans-serif;
      font-size: 14px;
      padding: 4px 8px;
      background: rgba(0, 0, 0, 0.5);
      border-radius: 4px;
      border: 1px solid ${labelColor.getStyle()};
      opacity: 0;
      transition: opacity 0.3s;
    `;

        const labelObject = new CSS2DObject(element);
        labelObject.position.set(0, this._getBodyRadius(body) * 1.5, 0); // Position it above the body
        body.add(labelObject);

        this.labels[id] = { object: labelObject, element, body };
    }

    public update() {
        const cameraPosition = new THREE.Vector3();
        this.camera.getWorldPosition(cameraPosition);

        for (const id in this.labels) {
            const { element, body } = this.labels[id];

            const bodyPosition = new THREE.Vector3();
            body.getWorldPosition(bodyPosition);

            const distance = cameraPosition.distanceTo(bodyPosition);

            const opacity = smoothstep(this.minFadeDistance, this.maxFadeDistance, distance);
            element.style.opacity = `${opacity}`;
        }
    }

    public render() {
        this.labelRenderer.render(this.scene, this.camera);
    }

    private onResize() {
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    private _getBodyRadius(body: THREE.Object3D): number {
        const box = new THREE.Box3().setFromObject(body);
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        return sphere.radius;
    }
}