import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CelestialBody } from './types';

export class SolarSystemScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private bodies: Map<string, THREE.Mesh> = new Map();
  private orbits: Map<string, THREE.Line> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      2000
    );
    this.camera.position.set(0, 150, 300);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 800;
    this.controls.target.set(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0x333333);
    this.scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffffff, 2, 1000);
    sunLight.position.set(0, 0, 0);
    this.scene.add(sunLight);
    this.addStars();
    window.addEventListener('resize', () => this.onResize());
  }

  private addStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.7,
      sizeAttenuation: true,
    });

    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  addSun(radius: number, color: string) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.8,
    });

    const sun = new THREE.Mesh(geometry, material);
    sun.userData = { id: 'sun' };
    this.scene.add(sun);
    this.bodies.set('sun', sun);
  }

  addPlanet(planet: CelestialBody) {
    // meshymesh
    const geometry = new THREE.SphereGeometry(planet.radius, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: planet.color,
      roughness: 0.8,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { id: planet.id, orbitRadius: planet.orbitRadius };
//pos
    const x = planet.orbitRadius * Math.cos(planet.angle);
    const z = planet.orbitRadius * Math.sin(planet.angle);
    mesh.position.set(x, 0, z);

    this.scene.add(mesh);
    this.bodies.set(planet.id, mesh);
    this.addOrbit(planet.orbitRadius);
  }

  private addOrbit(radius: number) {
    const points = [];
    const segments = 128;

    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = radius * Math.cos(angle);
      const z = radius * Math.sin(angle);
      points.push(new THREE.Vector3(x, 0, z));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3,
    });

    const orbit = new THREE.Line(geometry, material);
    this.scene.add(orbit);
  }

  updatePlanetPositions(planets: CelestialBody[]) {
    planets.forEach((planet) => {
      const mesh = this.bodies.get(planet.id);
      if (mesh) {
        planet.angle += planet.orbitSpeed;
        const x = planet.orbitRadius * Math.cos(planet.angle);
        const z = planet.orbitRadius * Math.sin(planet.angle);

        mesh.position.set(x, 0, z);
      }
    });
  }

  transitionToBody(id: string, duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      const body = this.bodies.get(id);
      if (!body) {
        console.warn(`Body ${id} not found`);
        resolve();
        return;
      }

      const targetPos = body.position.clone();
      const distance = id === 'sun' ? 80 : body.userData.orbitRadius * 0.4;

      const cameraTarget = targetPos.clone().add(
        new THREE.Vector3(distance, distance * 0.3, distance)
      );

      const startPos = this.camera.position.clone();
      const startTarget = this.controls.target.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic

        this.camera.position.lerpVectors(startPos, cameraTarget, eased);
        this.controls.target.lerpVectors(startTarget, targetPos, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onResize());
  }
}