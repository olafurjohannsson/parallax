import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { earthVertexShader, earthFragmentShader } from '../shaders/earth';
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
import { CelestialBodyFactory } from '../core/CelestialBodyFactory';
import { getColorForBody } from '../data/visualData';

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
  private sunLight: THREE.DirectionalLight | null = null;
  public factory: CelestialBodyFactory;
  private cameraFollowOffset = new THREE.Vector3();
  private isFollowingTarget: boolean = false;

  private starfieldInner: THREE.Mesh | null = null;
  private starfieldOuter: THREE.Mesh | null = null;

  constructor(canvas: HTMLCanvasElement, minimap: SolarSystemMinimap) {
    // Initialize core systems
    this.eventBus = EventBus.getInstance();
    this.stateManager = StateManager.getInstance();
    this.resourceManager = ResourceManager.getInstance();
    this.timeManager = TimeManager.getInstance();
    this.minimap = minimap;
    this.canvas = canvas;

    
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

    this.factory = new CelestialBodyFactory(this.scene, this.resourceManager, this.interactionManager);

    // Setup event listeners
    this.setupEventListeners();

    // Add lights and stars
    this.setupLighting();
    this.addStars();

    this.canvas.addEventListener('mousedown', this._onCanvasClick.bind(this));
    this.canvas.addEventListener('dblclick', this._onDeselect.bind(this));

    this._setupScenarioListeners();
  }

  public async initializeBodies(solarSystemData: any) {
    const sun = this.factory.createSun(solarSystemData.sun.radius, this.sunLight!);
    this.bodies.set('sun', sun);

    for (const planetData of solarSystemData.planets) {
      let planetMesh: THREE.Object3D;
      if (planetData.id === 'earth') {
        planetMesh = this.factory.createEarth(planetData);
      } else if (planetData.id === 'saturn') {
        planetMesh = this.factory.createSaturn(planetData);
      } else {
        planetMesh = this.factory.createPlanet(planetData);
      }
      this.bodies.set(planetData.id, planetMesh);
      this.addOrbit(planetData.id);
    }

    const earth = this.bodies.get('earth') as THREE.Mesh;
    if (earth) {
      const moon = this.factory.createMoon((earth.geometry as THREE.SphereGeometry).parameters.radius);
      this.bodies.set('moon', moon);
      this.iss = await this.factory.createISS(earth);
    }
  }

  private _getWorldCoordinates(targetId: string, lat: number, lon: number): THREE.Vector3 {
    const planet = this.bodies.get(targetId);
    if (!planet) return new THREE.Vector3();

    const planetRadius = this._getBodyRadius(planet);
    const latRad = (lat * Math.PI) / 180;
    const lonRad = -(lon * Math.PI) / 180;

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
        this.scenarioCameraTarget = null;
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

        const planet = this.bodies.get(payload.targetId);
        if (planet) model.lookAt(planet.position);
        model.rotateX(Math.PI / 2);

        this.scene.add(model);
        this.scenarioObjects.set(payload.modelId, model);
      } catch (e) { console.error("Failed to load scenario model:", e); }
    });

    this.eventBus.on(Events.ANIMATE_MODEL, (payload) => {
      const model = this.scenarioObjects.get(payload.modelId);
      if (!model) return;

      const startPosition = model.position.clone();
      const pathVectors = payload.path.map((p: THREE.Vector3) => startPosition.clone().add(p));

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
      }
    });

    this.eventBus.on(Events.SCENARIO_END, () => {
      this.scenarioCameraTarget = null;
    });
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }

  public getBodies(): Map<string, THREE.Object3D> {
    return this.bodies;
  }

  private addOrbit(planetId: string) {
    const elements = orbitalElements[planetId];
    if (!elements) return;
    const points = [];
    const segments = 256;
    const startDate = new Date('2000-01-01T12:00:00Z');

    for (let i = 0; i <= segments; i++) {
      const progress = i / segments;
      const futureDate = new Date(startDate.getTime() + progress * elements.period * 24 * 60 * 60 * 1000);
      points.push(calculatePlanetPosition(elements, futureDate, 100));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const orbitGroup = new THREE.Group();
    const orbitColor = getColorForBody(planetId);

    const haloMaterial = new THREE.LineBasicMaterial({
        color: orbitColor,
        transparent: true,
        opacity: 0.3,
        linewidth: 3,
    });
    const orbitHalo = new THREE.Line(geometry, haloMaterial);
    orbitHalo.renderOrder = 1;
    const coreMaterial = new THREE.LineBasicMaterial({
        color: orbitColor,
        transparent: true,
        opacity: 0.9,
        linewidth: 1,
    });
    const orbitCore = new THREE.Line(geometry, coreMaterial);
    orbitCore.renderOrder = 2;

    orbitGroup.add(orbitHalo);
    orbitGroup.add(orbitCore);
    
    this.scene.add(orbitGroup);
    this.orbits.set(planetId, orbitGroup as any);

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 256, 2, 8, false);
    const tubeMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const orbitTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
    orbitTube.userData = { id: planetId, type: 'orbit' };
    this.scene.add(orbitTube);
    this.interactionManager.registerInteractable(`orbit_${planetId}`, orbitTube);
  }

  private setupEventListeners() {
    this.eventBus.on(Events.TIME_UPDATE, ({ simulationTime }) => {
      this.updatePlanetPositions(simulationTime);
    });
    window.addEventListener('resize', () => this.onResize());
  }

  private setupLighting() {
    // Reduce ambient light for high contrast. This makes shadows deep and dramatic.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.05);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 3.0);
    sunLight.position.set(0, 0, 0); // Position at the center of the scene

    // Configure the light to cast shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096; // High-resolution shadow map
    sunLight.shadow.mapSize.height = 4096;

    // Define the area (an orthographic "box") where shadows will be rendered.
    // This needs to be large enough to contain the orbits you want shadows on.
    const shadowFrustumSize = 500;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.camera.left = -shadowFrustumSize;
    sunLight.shadow.camera.right = shadowFrustumSize;
    sunLight.shadow.camera.top = shadowFrustumSize;
    sunLight.shadow.camera.bottom = -shadowFrustumSize;

    this.scene.add(sunLight);

    this.sunLight = sunLight;
  }

  private addStars() {
    const starsTexture = this.resourceManager.getTexture('stars');
    const innerGeometry = new THREE.SphereGeometry(20000, 64, 64);
    const innerMaterial = new THREE.MeshBasicMaterial({
      map: starsTexture,
      side: THREE.BackSide,
    });
    this.starfieldInner = new THREE.Mesh(innerGeometry, innerMaterial);
    this.scene.add(this.starfieldInner);

    const milkyWayTexture = this.resourceManager.getTexture('stars_milky_way');
    const outerGeometry = new THREE.SphereGeometry(40000, 64, 64);
    const outerMaterial = new THREE.MeshBasicMaterial({
      map: milkyWayTexture,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.3,
    });
    this.starfieldOuter = new THREE.Mesh(outerGeometry, outerMaterial);
    this.scene.add(this.starfieldOuter);
  }

  public update(deltaTime: number, elapsedTime: number) {
    TWEEN.update();
    const state = this.stateManager.getState();
    const earth = this.bodies.get('earth');
    const sun = this.bodies.get('sun');
    if (earth && earth.userData.uniforms && sun) {
        const sunWorldPos = new THREE.Vector3();
        sun.getWorldPosition(sunWorldPos);

        const earthWorldPos = new THREE.Vector3();
        earth.getWorldPosition(earthWorldPos);

        const sunDirection = new THREE.Vector3().subVectors(sunWorldPos, earthWorldPos).normalize();
        
        earth.userData.uniforms.sunDirection.value.copy(sunDirection);
    }

    if (state.isPlaying) {
      this.bodies.forEach((body, id) => {
        if (id === 'sun' && body.userData.uniforms) {
          body.userData.uniforms.time.value = elapsedTime;
        }
        if (id !== 'sun' && id !== 'iss') {
          body.rotation.y += 0.05 * deltaTime;
        }
        if (id === 'earth' && body.userData.clouds) {
          body.userData.clouds.rotation.y += 0.02 * deltaTime;
        }
      });
    }

    if (this.starfieldInner) this.starfieldInner.rotation.y += 0.002 * deltaTime;
    if (this.starfieldOuter) this.starfieldOuter.rotation.y += 0.001 * deltaTime;

    const moon = this.bodies.get('moon');
    if (moon && earth && state.isPlaying) {
      const moonOrbitSpeed = 0.5;
      const simulationDays = (state.currentDate.getTime() - new Date('2000-01-01').getTime()) / (1000 * 3600 * 24);
      const moonAngle = (simulationDays * moonOrbitSpeed) % (2 * Math.PI);
      const moonOrbitRadius = 10;
      moon.position.set(
        earth.position.x + Math.cos(moonAngle) * moonOrbitRadius,
        earth.position.y,
        earth.position.z + Math.sin(moonAngle) * moonOrbitRadius
      );
    }

    if (this.iss && earth) {
      const orbitSpeed = (2 * Math.PI) / (90 * 60);
      const orbitRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), elapsedTime * orbitSpeed);
      if (!this.iss.userData.initialPosition) {
        this.iss.userData.initialPosition = this.iss.position.clone();
      }
      this.iss.position.copy(this.iss.userData.initialPosition).applyQuaternion(orbitRotation);
    }

    if (this.scenarioCameraTarget) {
      const targetPosition = new THREE.Vector3();
      this.scenarioCameraTarget.getWorldPosition(targetPosition);
      this.controls.target.lerp(targetPosition, 0.1);
    } else if (this.isFollowingTarget && state.selectedBody) {
      const targetBody = this.bodies.get(state.selectedBody);
      if (targetBody) {
        const targetPosition = new THREE.Vector3();
        targetBody.getWorldPosition(targetPosition);
        this.camera.position.copy(targetPosition).add(this.cameraFollowOffset);
        this.controls.target.copy(targetPosition);
      }
    }

    this.controls.update();
    this.minimap.update(this.bodies, this.camera.position);
  }
  transitionToBody(id: string, duration: number = 2000): Promise<void> {
    return new Promise((resolve) => {
      this.isFollowingTarget = false;
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
        this.controls.target.lerpVectors(startTarget, targetPos, eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.cameraFollowOffset.subVectors(this.camera.position, targetPos);
          this.isFollowingTarget = true;
          this.eventBus.emit(Events.CAMERA_TRANSITION, { target: id });
          resolve();
        }
      };
      animate();
    });
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
      this.isFollowingTarget = false; // Stop following
      this.transitionToOverview();
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
    this.isFollowingTarget = false;
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

  private _getBodyRadius(body: THREE.Object3D): number {
    const box = new THREE.Box3().setFromObject(body);
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    return sphere.radius;
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