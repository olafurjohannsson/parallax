import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CelestialBody } from './types';
import { atmosphereVertexShader, atmosphereFragmentShader } from './shaders/atmosphere';
import { createSunMaterials } from './shaders/sun';

import { orbitalElements } from './orbitalData';
import { calculatePlanetPosition } from './orbitalMechanics';

export class SolarSystemScene {
  private scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private textureLoader: THREE.TextureLoader;
  public bodies: Map<string, THREE.Mesh> = new Map();
  private orbits: Map<string, THREE.Line> = new Map();
  private sunLight: THREE.PointLight | null = null;
  private starSphere: THREE.Mesh | null = null;
  private bgStarSphere: THREE.Mesh | null = null;
  private fgStarSphere: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  public hoveredBody: string | null = null;
  private hoverRings: Map<string, THREE.Mesh> = new Map();
  private focusMarkers: Map<string, THREE.Mesh> = new Map();

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

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 10000;
    this.controls.target.set(0, 0, 0);

    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.manager.onLoad = () => {
      console.log('✅ All textures loaded');
    };

    this.textureLoader.manager.onError = (url: any) => {
      console.error('❌ Texture failed to load:', url);
    };


const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
this.scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 15, 0);
sunLight.position.set(0, 0, 0);
this.scene.add(sunLight);
    this.sunLight = sunLight;

    this.sunLight = sunLight;
    console.log('Sun light position:', sunLight.position);
    console.log('Sun light intensity:', sunLight.intensity);

    this.addStars();
    window.addEventListener('resize', () => this.onResize());

    setTimeout(() => {
      this.bodies.forEach((mesh, id) => {
        console.log(`${id}:`, mesh.position, 'material:', mesh.material);
      });
    }, 1000);

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
    canvas.addEventListener('click', (event) => this.onClick(event));
  }

  private onMouseMove(event: MouseEvent) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    const meshes = Array.from(this.bodies.values()).filter(
      m => m.userData.id !== 'iss'
    );
    const intersects = this.raycaster.intersectObjects(meshes, true);

    if (intersects.length > 0) {
      const object = intersects[0].object;
      const bodyId = object.userData.id || object.parent?.userData.id;

      if (bodyId && bodyId !== this.hoveredBody) {

        if (this.hoveredBody) {
          const prevId = this.hoveredBody;
          window.dispatchEvent(new CustomEvent('bodyhoverend', { detail: { id: prevId } }));
        }

        this.hoveredBody = bodyId;
        document.body.style.cursor = 'pointer';

        window.dispatchEvent(new CustomEvent('bodyhover', {
          detail: { id: bodyId, x: event.clientX, y: event.clientY }
        }));
      }
    } else {
      if (this.hoveredBody) {
        const prevId = this.hoveredBody;
        this.hoveredBody = null;
        document.body.style.cursor = 'default';
        window.dispatchEvent(new CustomEvent('bodyhoverend', { detail: { id: prevId } }));
      }
    }
  }

  private onClick(event: MouseEvent) {
    if (this.hoveredBody) {
      this.transitionToBody(this.hoveredBody);
    }
  }

  addHoverGlow(bodyId: string) {
  const body = this.bodies.get(bodyId);
  if (!body || this.hoverRings.has(bodyId)) return;
  
  const geometry = (body.geometry as THREE.SphereGeometry);
  const radius = geometry.parameters.radius;
  
  const ringGeometry = new THREE.RingGeometry(radius * 1.2, radius * 1.3, 64);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x667eea,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  
  const ring = new THREE.Mesh(ringGeometry, ringMaterial);
  ring.rotation.x = Math.PI / 2;
  
  const glowGeometry = new THREE.SphereGeometry(radius * 1.15, 32, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0x667eea,
    transparent: true,
    opacity: 0.2,
    side: THREE.BackSide,
  });
  const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
  
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesCount = 50;
  const positions = new Float32Array(particlesCount * 3);
  
  for (let i = 0; i < particlesCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const r = radius * (1.2 + Math.random() * 0.3);
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particlesMaterial = new THREE.PointsMaterial({
    color: 0x667eea,
    size: radius * 0.15,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });
  
  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  
  const hoverGroup = new THREE.Group();
  hoverGroup.add(ring);
  hoverGroup.add(glowSphere);
  hoverGroup.add(particles);
  
  body.add(hoverGroup);
  this.hoverRings.set(bodyId, hoverGroup);
  
  const startTime = Date.now();
  const animate = () => {
    if (this.hoverRings.has(bodyId)) {
      const elapsed = (Date.now() - startTime) * 0.001;
      
      ring.rotation.z += 0.02;
      ring.material.opacity = 0.6 + Math.sin(elapsed * 3) * 0.2;
      
      glowSphere.material.opacity = 0.15 + Math.sin(elapsed * 2) * 0.1;
      
      particles.rotation.y += 0.01;
      
      requestAnimationFrame(animate);
    }
  };
  animate();
}

removeHoverGlow(bodyId: string) {
  const hoverGroup = this.hoverRings.get(bodyId);
  if (hoverGroup) {
    hoverGroup.children.forEach(child => {
      if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    hoverGroup.parent?.remove(hoverGroup);
    this.hoverRings.delete(bodyId);
  }
}
  updatePlanetPositionsRealistic(date: Date) {
    this.bodies.forEach((mesh, id) => {
      if (id === 'sun' || id === 'iss') return;

      const elements = orbitalElements[id];
      if (elements) {
        const position = calculatePlanetPosition(elements, date, 100);
        mesh.position.copy(position);
      }
    });
  }
  addRealisticSun(radius: number) {
    const sunTexture = this.textureLoader.load('/textures/8k_sun.jpg');
    const { sunMat, coronaMat, uniforms } = createSunMaterials(sunTexture);

    const geometry = new THREE.SphereGeometry(radius, 128, 128);

    const sun = new THREE.Mesh(geometry, sunMat);
    sun.userData = { id: 'sun', uniforms };


    this.scene.add(sun);
    this.bodies.set('sun', sun);

    const coronaGeometry = new THREE.SphereGeometry(radius * 1.02, 64, 64);
    coronaMat.depthWrite = false;
    const corona = new THREE.Mesh(coronaGeometry, coronaMat);
    corona.layers.set(1);
    sun.add(corona);

    return sun;
  }
  updateSun(deltaTime: number) {
    const sun = this.bodies.get('sun');
    if (!sun) return;

    const uniforms = sun.userData.uniforms;
    if (uniforms) {
      uniforms.time.value += deltaTime * 0.001;
    }
  }

  private addStars() {
    const milkyWay = this.textureLoader.load('/textures/8k_stars_milky_way.jpg');
    const bgGeometry = new THREE.SphereGeometry(1500, 64, 64);
    const bgMaterial = new THREE.MeshBasicMaterial({
      map: milkyWay,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.8,
    });
    this.bgStarSphere = new THREE.Mesh(bgGeometry, bgMaterial);
    this.scene.add(this.bgStarSphere);

    const stars = this.textureLoader.load('/textures/8k_stars.jpg');
    const fgGeometry = new THREE.SphereGeometry(1200, 64, 64);
    const fgMaterial = new THREE.MeshBasicMaterial({
      map: stars,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.5,
    });
    this.fgStarSphere = new THREE.Mesh(fgGeometry, fgMaterial);
    this.fgStarSphere.rotation.y = Math.PI / 4;
    this.scene.add(this.fgStarSphere);
  }
  updateStarRotation(deltaTime: number) {
    if (this.starSphere) {
      this.starSphere.rotation.y += deltaTime * 0.00001;
    }
  }

  private addPointStars() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });

    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const radius = 1000 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);
  }

  addISS(position: THREE.Vector3) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    const iss = new THREE.Mesh(geometry, material);
    iss.position.copy(position);
    iss.userData = { id: 'iss' };

    this.scene.add(iss);
    this.bodies.set('iss', iss);

    return iss;
  }

  updateISS(position: THREE.Vector3) {
    const iss = this.bodies.get('iss');
    if (iss) {
      iss.position.copy(position);
    }
  }

  addPlanetWithTexture(planet: CelestialBody, texturePath: string, hasNormalMap: boolean = false) {
    console.log(`Loading texture for ${planet.id}:`, texturePath);

    const texture = this.textureLoader.load(
      texturePath,
      (tex: any) => {
        console.log(`✅ ${planet.id} texture loaded:`, tex.image.width, 'x', tex.image.height);
      },
      undefined,
      (err: any) => {
        console.error(`❌ Failed to load ${planet.id} texture:`, err);
      }
    );
    const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
    console.log(texturePath, planet)

    const materialOptions: THREE.MeshStandardMaterialParameters = {
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    };

    if (hasNormalMap) {
      const normalMap = this.textureLoader.load(texturePath.replace('.jpg', '_normal.jpg'));
      materialOptions.normalMap = normalMap;
      materialOptions.normalScale = new THREE.Vector2(0.5, 0.5);
    }

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,  
      metalness: 0.0,
      emissive: 0xffffff,
      emissiveMap: texture,
      emissiveIntensity: 0.15,
    });
    // const material = new THREE.MeshStandardMaterial({
    //   map: texture,
    //   roughness: 0.9,
    //   metalness: 0.1,
    //   emissive: 0xffffff,        // ← Add this
    //   emissiveMap: texture,      // ← Add this
    //   emissiveIntensity: 0.2,    // ← Add this
    // });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { id: planet.id, orbitRadius: planet.orbitRadius };

    const x = planet.orbitRadius * Math.cos(planet.angle);
    const z = planet.orbitRadius * Math.sin(planet.angle);
    mesh.position.set(x, 0, z);

    this.scene.add(mesh);
    this.bodies.set(planet.id, mesh);
    this.addOrbit(planet.id);

    return mesh;
  }

  addEarthWithClouds(planet: CelestialBody) {
    const dayTexture = this.textureLoader.load('/textures/8k_earth_daymap.jpg');
    const nightTexture = this.textureLoader.load('/textures/8k_earth_nightmap.jpg');
    const cloudsTexture = this.textureLoader.load('/textures/8k_earth_clouds.jpg');
    const normalMap = this.textureLoader.load('/textures/8k_earth_normal_map.tif');
    const specularMap = this.textureLoader.load('/textures/8k_earth_specular_map.tif');

    const geometry = new THREE.SphereGeometry(planet.radius, 128, 128);

    const earthMaterial = new THREE.MeshStandardMaterial({
      map: dayTexture,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.7,
      metalness: 0.1,
    });

    const earth = new THREE.Mesh(geometry, earthMaterial);

    const cloudGeometry = new THREE.SphereGeometry(planet.radius * 1.01, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });

    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earth.add(clouds);

    const glowGeometry = new THREE.SphereGeometry(planet.radius * 1.08, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(0x88ccff) },
        intensity: { value: 0.4 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    earth.add(glow);

    const x = planet.orbitRadius * Math.cos(planet.angle);
    const z = planet.orbitRadius * Math.sin(planet.angle);
    earth.position.set(x, 0, z);
    earth.userData = { id: planet.id, orbitRadius: planet.orbitRadius, clouds };

    this.scene.add(earth);
    this.bodies.set(planet.id, earth);
    this.addOrbit(planet.id);

    return earth;
  }

  updateEarth(deltaTime: number) {
    const earth = this.bodies.get('earth');
    if (earth && earth.userData.clouds) {
      earth.userData.clouds.rotation.y += deltaTime * 0.0001; 
    }
  }
  addMoon(earthOrbitRadius: number, earthRadius: number) {
    const moonTexture = this.textureLoader.load('/textures/8k_moon.jpg');
    const moonGeometry = new THREE.SphereGeometry(0.27 * earthRadius, 64, 64); 
    const moonMaterial = new THREE.MeshStandardMaterial({
      map: moonTexture,
      roughness: 1.0,
      metalness: 0.0,
    });

    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.userData = {
      id: 'moon',
      orbitRadius: earthRadius * 4, // Moon orbit around Earth
      angle: 0,
      orbitSpeed: 0.05,
    };

    this.bodies.set('moon', moon);
    this.scene.add(moon);

    return moon;
  }

  updateMoon(deltaTime: number) {
    const moon = this.bodies.get('moon');
    const earth = this.bodies.get('earth');

    if (moon && earth) {
      moon.userData.angle += moon.userData.orbitSpeed * deltaTime * 0.001;

      const x = earth.position.x + moon.userData.orbitRadius * Math.cos(moon.userData.angle);
      const z = earth.position.z + moon.userData.orbitRadius * Math.sin(moon.userData.angle);

      moon.position.set(x, 0, z);
    }
  }
  addPlanetWithAtmosphere(planet: CelestialBody, texturePath: string) {
    const texture = this.textureLoader.load(texturePath);
    const normalMap = this.textureLoader.load(texturePath.replace('.jpg', '_normal.jpg'));

    const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      // normalMap: normalMap,
      // normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.8,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);

    const glowGeometry = new THREE.SphereGeometry(planet.radius * 1.08, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        glowColor: { value: new THREE.Color(0x88ccff) },
        intensity: { value: 0.4 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glow);

    const x = planet.orbitRadius * Math.cos(planet.angle);
    const z = planet.orbitRadius * Math.sin(planet.angle);
    mesh.position.set(x, 0, z);
    mesh.userData = { id: planet.id, orbitRadius: planet.orbitRadius };

    this.scene.add(mesh);
    this.bodies.set(planet.id, mesh);
    this.addOrbit(planet.id);

    return mesh;
  }

  addSaturnWithRings(planet: CelestialBody) {
    const texture = this.textureLoader.load('/textures/8k_saturn.jpg');
    const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.9,
      metalness: 0.1,
    });

    const saturn = new THREE.Mesh(geometry, material);
    saturn.userData = { id: planet.id, orbitRadius: planet.orbitRadius };

    const ringTexture = this.textureLoader.load('/textures/8k_saturn_ring_alpha.png');

    const ringGeometry = new THREE.RingGeometry(
      planet.radius * 1.2,
      planet.radius * 2.0,
      128 
    );

    const pos = ringGeometry.attributes.position;
    const uv = ringGeometry.attributes.uv;
    const innerRadius = planet.radius * 1.2;
    const outerRadius = planet.radius * 2.0;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const len = Math.sqrt(x * x + y * y);
      const u = (len - innerRadius) / (outerRadius - innerRadius);
      uv.setXY(i, u, u);
    }
    uv.needsUpdate = true;

    const ringMaterial = new THREE.MeshStandardMaterial({ 
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: 0.1,
      opacity: 1.0,
      roughness: 0.8,
      metalness: 0.1,
    });

    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2;
    rings.castShadow = true;
    rings.receiveShadow = true;
    saturn.add(rings);

    const x = planet.orbitRadius * Math.cos(planet.angle);
    const z = planet.orbitRadius * Math.sin(planet.angle);
    saturn.position.set(x, 0, z);

    this.scene.add(saturn);
    this.bodies.set(planet.id, saturn);
    this.addOrbit(planet.id);

    return saturn;
  }

  private addOrbit(planetId: string) {
    const elements = orbitalElements[planetId];
    if (!elements) {
      console.warn(`No orbital elements for ${planetId}`);
      return;
    }

    const points = [];
    const segments = 256; 
    const scale = 100;

    for (let i = 0; i <= segments; i++) {
      const meanAnomaly = (i / segments) * Math.PI * 2;

      let E = meanAnomaly;
      for (let j = 0; j < 10; j++) {
        E = meanAnomaly + elements.e * Math.sin(E);
      }

      const v = 2 * Math.atan2(
        Math.sqrt(1 + elements.e) * Math.sin(E / 2),
        Math.sqrt(1 - elements.e) * Math.cos(E / 2)
      );

      const r = elements.a * (1 - elements.e * Math.cos(E));

      const x = r * Math.cos(v);
      const y = r * Math.sin(v);

      const omega = (elements.longPeri - elements.longNode) * Math.PI / 180;
      const Omega = elements.longNode * Math.PI / 180;

      const xEcl = (Math.cos(omega) * Math.cos(Omega) - Math.sin(omega) * Math.sin(Omega)) * x +
        (-Math.sin(omega) * Math.cos(Omega) - Math.cos(omega) * Math.sin(Omega)) * y;
      const zEcl = (Math.cos(omega) * Math.sin(Omega) + Math.sin(omega) * Math.cos(Omega)) * x +
        (-Math.sin(omega) * Math.sin(Omega) + Math.cos(omega) * Math.cos(Omega)) * y;

      points.push(new THREE.Vector3(xEcl * scale, 0, zEcl * scale));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x444444,
      transparent: true,
      opacity: 0.3,
    });

    const orbit = new THREE.Line(geometry, material);
    this.scene.add(orbit);
    this.orbits.set(planetId, orbit);
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
        const eased = 1 - Math.pow(1 - progress, 3);

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
    if (this.bgStarSphere) {
      this.bgStarSphere.position.copy(this.camera.position);
    }
    if (this.fgStarSphere) {
      this.fgStarSphere.position.copy(this.camera.position);
    }
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