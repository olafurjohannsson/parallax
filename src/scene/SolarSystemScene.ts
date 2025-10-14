import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CelestialBody } from '../types';
import { EventBus, Events } from '../core/EventBus';
import { StateManager } from '../core/StateManager';
import { ResourceManager } from '../core/ResourceManager';
import { InteractionManager } from '../core/InteractionManager';
import { TimeManager } from '../core/TimeManager';
import { orbitalElements } from '../data/orbitalData';
import { calculatePlanetPosition } from '../data/orbitalMechanics';
import { atmosphereVertexShader, atmosphereFragmentShader } from '../shaders/atmosphere';
import { createSunMaterials } from '../shaders/sun'; // Import sun shaders
import { SolarSystemMinimap } from '../ui/Minimap'; // Import minimap for updates
import { getISSPosition, issTo3D } from '../components/ISS';

export class SolarSystemScene {
  private scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  public bodies: Map<string, THREE.Mesh | THREE.Group> = new Map();
  private orbits: Map<string, THREE.Line> = new Map();
  private eventBus: EventBus;
  private stateManager: StateManager;
  private resourceManager: ResourceManager;
  private interactionManager: InteractionManager;
  private timeManager: TimeManager;
  private minimap: SolarSystemMinimap;
  private iss: THREE.Group | null = null;
  private canvas: HTMLCanvasElement;
  private scenarioObjects = new Map<string, THREE.Object3D>();
  private scenarioCameraTarget: THREE.Object3D | null = null;

  constructor(canvas: HTMLCanvasElement, minimap: SolarSystemMinimap) { // Pass minimap instance
    // Initialize core systems
    this.eventBus = EventBus.getInstance();
    this.stateManager = StateManager.getInstance();
    this.resourceManager = ResourceManager.getInstance();
    this.timeManager = TimeManager.getInstance();
    this.minimap = minimap;
    this.canvas = canvas;

    // Three.js scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      50000 // far plane 
    );
    this.camera.position.set(0, 150, 300);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;

    // Initialize interaction manager
    this.interactionManager = new InteractionManager(canvas, this.camera);

    // Setup event listeners
    this.setupEventListeners();

    // Add lights and stars
    this.setupLighting();
    this.addStars();

    this.canvas.addEventListener('mousedown', this._onCanvasClick.bind(this));
    this.canvas.addEventListener('dblclick', this._onDeselect.bind(this));

    this._setupScenarioListeners();
  }

  private _getWorldCoordinates(targetId: string, lat: number, lon: number): THREE.Vector3 {
    const planet = this.bodies.get(targetId);
    if (!planet) return new THREE.Vector3();

    const planetRadius = this._getBodyRadius(planet);
    const latRad = (lat * Math.PI) / 180;
    const lonRad = -(lon * Math.PI) / 180; // Adjust for coordinate system

    // Get position relative to planet center
    const localPos = new THREE.Vector3(
      planetRadius * Math.cos(latRad) * Math.cos(lonRad),
      planetRadius * Math.sin(latRad),
      planetRadius * Math.cos(latRad) * Math.sin(lonRad)
    );

    // Add planet's current world position
    const worldPos = new THREE.Vector3();
    planet.getWorldPosition(worldPos);
    return localPos.add(worldPos);
  }

  private _setupScenarioListeners() {
    this.eventBus.on(Events.SET_CAMERA, async (payload) => {
      if (payload.track) {
        this.scenarioCameraTarget = this.scenarioObjects.get(payload.track) || null;
      } else if (payload.targetId && payload.position) {
        this.scenarioCameraTarget = null; // Stop tracking dynamic objects
        const targetBody = this.bodies.get(payload.targetId);
        if (!targetBody) return;

        const targetPosition = this._getWorldCoordinates(payload.targetId, payload.position.lat, payload.position.lon);
        const cameraPosition = targetPosition.clone().add(new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(payload.distance || 5));
        this.transitionCamera(cameraPosition, targetPosition);
      }
    });

    this.eventBus.on(Events.LOAD_MODEL, async (payload) => {
      try {
        const gltf = await this.resourceManager.loadModel(payload.modelId, payload.url);
        const model = gltf.scene;

        const position = this._getWorldCoordinates(payload.targetId, payload.position.lat, payload.position.lon);
        model.position.copy(position);

        // Orient the model to point "up" away from the planet's center
        const planet = this.bodies.get(payload.targetId);
        if (planet) model.lookAt(planet.position);
        model.rotateX(Math.PI / 2); // Correct orientation after lookAt

        this.scene.add(model);
        this.scenarioObjects.set(payload.modelId, model);
      } catch (e) { console.error("Failed to load scenario model:", e); }
    });

    this.eventBus.on(Events.ANIMATE_MODEL, (payload) => {
      const model = this.scenarioObjects.get(payload.modelId);
      if (!model) return;

      const startPosition = model.position.clone();
      const pathVectors = payload.path.map((p: THREE.Vector3) => startPosition.clone().add(p));

      // Use a simple tween to animate along the path
      new TWEEN.Tween({ t: 0 })
        .to({ t: 1 }, payload.duration * 1000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onUpdate(({ t }) => {
          const curve = new THREE.CatmullRomCurve3(pathVectors);
          const position = curve.getPointAt(t);
          model.position.copy(position);
        })
        .start();
    });

    this.eventBus.on(Events.DESTROY_MODEL, (payload) => {
      const model = this.scenarioObjects.get(payload.modelId);
      if (model) {
        this.scene.remove(model);
        this.scenarioObjects.delete(payload.modelId);
        // Add cleanup for geometries/materials if needed
      }
    });

    // Clean up when a scenario ends
    this.eventBus.on(Events.SCENARIO_END, () => {
      this.scenarioCameraTarget = null;
    });
  }

  async addISS(earth: THREE.Mesh) {
    try {
      const initialPositionData = await getISSPosition();
      const initialPosition = issTo3D(initialPositionData, earth);

      const gltf = await this.resourceManager.loadModel('iss', '/models/iss.glb');
      const issModel = gltf.scene;

      const earthRadius = (earth.geometry as THREE.SphereGeometry).parameters.radius;
      const issScale = earthRadius * 0.02;

      issModel.scale.setScalar(issScale);
      issModel.position.copy(initialPosition);
      issModel.userData = { id: 'iss' };

      earth.add(issModel);
      this.iss = issModel;

      this.interactionManager.registerInteractable('iss', issModel);


    } catch (error) {
      console.error('Failed to create and add ISS model:', error);
    }
  }

  async addSun(radius: number) {
    const sunTexture = this.resourceManager.getTexture('sun');
    const { sunMat, coronaMat, uniforms } = createSunMaterials(sunTexture);

    const geometry = new THREE.SphereGeometry(radius, 128, 128);

    const sun = new THREE.Mesh(geometry, sunMat);
    sun.userData = { id: 'sun', uniforms };

    this.scene.add(sun);
    this.bodies.set('sun', sun);
    this.interactionManager.registerInteractable('sun', sun);

    const corona = new THREE.Mesh(geometry.clone(), coronaMat);
    sun.add(corona);

    return sun;
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getBodies(): Map<string, THREE.Object3D> {
    return this.bodies;
  }

  addSaturnWithRings(planet: CelestialBody) {
    const texture = this.resourceManager.getTexture('saturn');
    const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    });

    const saturn = new THREE.Mesh(geometry, material);
    saturn.castShadow = true;
    saturn.receiveShadow = true;
    saturn.userData = { id: planet.id, orbitRadius: planet.orbitRadius };

    // Rings
    const ringTexture = this.resourceManager.getTexture('saturn_ring');
    const ringGeometry = new THREE.RingGeometry(planet.radius * 1.2, planet.radius * 2.0, 128);
    const pos = ringGeometry.attributes.position;
    const uv = ringGeometry.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const len = Math.sqrt(x * x + y * y);
      uv.setXY(i, (len - planet.radius * 1.2) / (planet.radius * 0.8), 1);
    }
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    rings.receiveShadow = true;
    saturn.add(rings);

    // Position will be set by updatePlanetPositions
    this.scene.add(saturn);
    this.bodies.set(planet.id, saturn);
    this.interactionManager.registerInteractable(planet.id, saturn);
    this.addOrbit(planet.id);
    return saturn;
  }

  addEarthWithClouds(planet: CelestialBody) {
    const dayTexture = this.resourceManager.getTexture('earth_day');
    const cloudsTexture = this.resourceManager.getTexture('earth_clouds');

    const geometry = new THREE.SphereGeometry(planet.radius, 128, 128);
    const earthMaterial = new THREE.MeshStandardMaterial({ map: dayTexture });
    const earth = new THREE.Mesh(geometry, earthMaterial);
    earth.castShadow = true;
    earth.receiveShadow = true;

    const cloudGeometry = new THREE.SphereGeometry(planet.radius * 1.01, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.4,
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earth.add(clouds);

    const glowGeometry = new THREE.SphereGeometry(planet.radius * 1.08, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: { glowColor: { value: new THREE.Color(0x88ccff) }, intensity: { value: 0.4 } },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    earth.add(glow);

    earth.userData = { id: planet.id, orbitRadius: planet.orbitRadius, clouds };

    // Position will be set by updatePlanetPositions
    this.scene.add(earth);
    this.bodies.set(planet.id, earth);
    this.interactionManager.registerInteractable(planet.id, earth);
    this.addOrbit(planet.id);
    return earth;
  }

  private addOrbit(planetId: string) {
    const elements = orbitalElements[planetId];
    if (!elements) return;

    const points = [];
    const segments = 256;
    const dummyDate = new Date('2000-01-01T12:00:00Z');

    for (let i = 0; i <= segments; i++) {
      const futureDate = new Date(dummyDate.getTime() + (i / segments) * elements.period * 24 * 60 * 60 * 1000);
      points.push(calculatePlanetPosition(elements, futureDate, 100));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.5 });
    const orbit = new THREE.Line(geometry, material);
    this.scene.add(orbit);
    this.orbits.set(planetId, orbit);
  }

  private setupEventListeners() {
    this.eventBus.on(Events.TIME_UPDATE, ({ simulationTime }) => {
      this.updatePlanetPositions(simulationTime);
    });
    window.addEventListener('resize', () => this.onResize());
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);
    const sunLight = new THREE.PointLight(0xffffff, 2, 0);
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);
  }

  private addStars() {
    const starsTexture = this.resourceManager.getTexture('stars_milky_way');
    const starsGeometry = new THREE.SphereGeometry(40000, 64, 64);
    const starsMaterial = new THREE.MeshBasicMaterial({
      map: starsTexture,
      side: THREE.BackSide
    });
    const starField = new THREE.Mesh(starsGeometry, starsMaterial);
    this.scene.add(starField);
  }

  public update(deltaTime: number, elapsedTime: number) {
    TWEEN.update();
    const state = this.stateManager.getState();

    this.controls.update();

    this.bodies.forEach((body, id) => {
      if (id === 'earth' && body.userData.clouds) body.userData.clouds.rotation.y += deltaTime * 0.05;
      if (id === 'sun' && body.userData.uniforms) body.userData.uniforms.time.value = elapsedTime;
      if (id !== 'sun' && id !== 'iss') body.rotation.y += deltaTime * 0.1;
    });

    const moon = this.bodies.get('moon');
    const earth = this.bodies.get('earth');
    if (moon && earth) {
      if (state.isPlaying) {
        const moonOrbitSpeed = 0.5; // Radians per day (approx)
        const simulationDays = (state.currentDate.getTime() - new Date('2000-01-01').getTime()) / (1000 * 60 * 60 * 24);
        const moonAngle = (simulationDays * moonOrbitSpeed) % (2 * Math.PI);

        const moonOrbitRadius = 10;
        moon.position.set(
          earth.position.x + Math.cos(moonAngle) * moonOrbitRadius,
          earth.position.y,
          earth.position.z + Math.sin(moonAngle) * moonOrbitRadius
        );
      }
    }

    if (this.iss && earth) {
      // The ISS completes an orbit in ~90 minutes.
      const timeScale = this.stateManager.getState().timeScale;
      const orbitSpeed = (2 * Math.PI) / (90 * 60); // Radians per second for a 90-min orbit

      // We need to rotate the ISS's parent (the Earth) to get the correct axis
      // then apply the orbital rotation.
      const orbitRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0), // Simple Y-axis orbit for visuals
        elapsedTime * orbitSpeed
      );

      // Apply the rotation to its initial position vector
      if (!this.iss.userData.initialPosition) {
        this.iss.userData.initialPosition = this.iss.position.clone();
      }
      this.iss.position.copy(this.iss.userData.initialPosition).applyQuaternion(orbitRotation);
    }
    if (this.scenarioCameraTarget) {
      const targetPosition = new THREE.Vector3();
      this.scenarioCameraTarget.getWorldPosition(targetPosition);
      this.controls.target.lerp(targetPosition, 0.1);
    } else if (state.selectedBody) {
      const targetBody = this.bodies.get(state.selectedBody) || (this.iss?.userData.id === state.selectedBody ? this.iss : null);
      if (targetBody) {
        const targetPosition = new THREE.Vector3();
        targetBody.getWorldPosition(targetPosition);

        // Make the lerp factor adaptive to the time scale. Faster time = less smoothing.
        const baseLerp = 0.08;
        const timeScaleFactor = Math.min(state.timeScale / 86400, 10); // Cap the effect
        const adaptiveLerp = baseLerp * (1 + timeScaleFactor);

        this.controls.target.lerp(targetPosition, Math.min(adaptiveLerp, 1)); // Ensure it doesn't exceed 1
      }
    }

    this.controls.update();
    this.minimap.update(this.bodies, this.camera.position);
  }

  private _onCanvasClick(event: MouseEvent) {
    setTimeout(() => {
      if (!this.stateManager.getState().hoveredBody && this.stateManager.getState().selectedBody) {
        this.stateManager.selectBody(null);
      }
    }, 10);
  }

  private _onDeselect() {
    if (this.stateManager.getState().selectedBody) {
      this.stateManager.selectBody(null);
      this.transitionToOverview(); // Animate camera back to a wide shot
    }
  }
  public transitionCamera(newPosition: THREE.Vector3, newTarget: THREE.Vector3, duration = 2000) {
    new TWEEN.Tween(this.camera.position)
      .to(newPosition, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();
    new TWEEN.Tween(this.controls.target)
      .to(newTarget, duration)
      .easing(TWEEN.Easing.Cubic.InOut)
      .start();
  }
  public transitionToOverview(duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      const overviewPosition = new THREE.Vector3(0, 150, 300); // Default starting position
      const overviewTarget = new THREE.Vector3(0, 0, 0); // Look at the sun

      const startPos = this.camera.position.clone();
      const startTarget = this.controls.target.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI); // Smooth ease-in-out

        this.camera.position.lerpVectors(startPos, overviewPosition, eased);
        this.controls.target.lerpVectors(startTarget, overviewTarget, eased);

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
    this.renderer.render(this.scene, this.camera);
  }

  private updatePlanetPositions(date: Date) {
    this.bodies.forEach((mesh, id) => {
      if (id === 'sun' || id === 'iss' || id === 'moon') return;
      const elements = orbitalElements[id];
      if (elements) {
        const position = calculatePlanetPosition(elements, date, 100);
        mesh.position.copy(position);
      }
    });
  }

  async addPlanet(planet: CelestialBody) {
    const texture = this.resourceManager.getTexture(planet.id);
    const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
      metalness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { id: planet.id };

    this.interactionManager.registerInteractable(planet.id, mesh);
    this.scene.add(mesh);
    this.bodies.set(planet.id, mesh);
    this.addOrbit(planet.id);
    return mesh;
  }

  async addMoon(earthRadius: number) {
    const moonTexture = this.resourceManager.getTexture('moon');
    const moonGeometry = new THREE.SphereGeometry(earthRadius * 0.27, 32, 32);
    const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.userData = { id: 'moon', angle: 0 };

    this.interactionManager.registerInteractable('moon', moon);
    this.scene.add(moon);
    this.bodies.set('moon', moon);
    return moon;
  }
  private _getBodyRadius(body: THREE.Object3D): number {
    const box = new THREE.Box3().setFromObject(body);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return sphere.radius;
  }
  transitionToBody(id: string, duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      const body = this.bodies.get(id) || (this.iss?.userData.id === id ? this.iss : null);
      if (!body) return resolve();

      const targetPos = new THREE.Vector3();
      body.getWorldPosition(targetPos);

      const radius = this._getBodyRadius(body);
      const distance = radius * 3;

      const cameraTargetPos = targetPos.clone().add(
        new THREE.Vector3(1, 0.5, 1).normalize().multiplyScalar(distance)
      );

      const startPos = this.camera.position.clone();
      const startTarget = this.controls.target.clone();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);

        this.camera.position.lerpVectors(startPos, cameraTargetPos, eased);
        this.controls.target.lerpVectors(startTarget, body.position, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.eventBus.emit(Events.CAMERA_TRANSITION, { target: id });
          resolve();
        }
      };
      animate();
    });
  }

  private onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.interactionManager.dispose();
    this.renderer.dispose();
    this.controls.dispose();
  }
}