
import * as THREE from 'three';
import { ResourceManager } from './ResourceManager';
import { InteractionManager } from './InteractionManager';
import { CelestialBody } from '../types';
import { createSunMaterials } from '../shaders/sun';
import { earthVertexShader, earthFragmentShader } from '../shaders/earth';
import { atmosphereVertexShader, atmosphereFragmentShader } from '../shaders/atmosphere';
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare.js';
import { getISSPosition, issTo3D } from '../components/ISS';
import { getColorForBody } from '../data/visualData';
import { planetVertexShader, planetFragmentShader } from '../shaders/planet';

export class CelestialBodyFactory {
  private scene: THREE.Scene;
  private resourceManager: ResourceManager;
  private interactionManager: InteractionManager;

  constructor(scene: THREE.Scene, resourceManager: ResourceManager, interactionManager: InteractionManager) {
    this.scene = scene;
    this.resourceManager = resourceManager;
    this.interactionManager = interactionManager;
  }

  public createSun(radius: number, sunLight: THREE.DirectionalLight): THREE.Mesh {
    const sunTexture = this.resourceManager.getTexture('sun');
    const { sunMat, coronaMat, uniforms } = createSunMaterials(sunTexture);

    const geometry = new THREE.SphereGeometry(radius, 128, 128);
    const sun = new THREE.Mesh(geometry, sunMat);
    sun.userData = { id: 'sun', uniforms };
    this.interactionManager.registerInteractable('sun', sun);

    const corona = new THREE.Mesh(geometry.clone(), coronaMat);
    sun.add(corona);

    const textureLoader = new THREE.TextureLoader();
    const flareTexture0 = textureLoader.load('/textures/lensflare0.png');
    const flareTexture1 = textureLoader.load('/textures/lensflare3.png');

    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(flareTexture0, 700, 0, sunLight.color));
    lensflare.addElement(new LensflareElement(flareTexture1, 60, 0.6));
    lensflare.addElement(new LensflareElement(flareTexture1, 70, 0.7));
    lensflare.addElement(new LensflareElement(flareTexture1, 120, 0.9));
    lensflare.addElement(new LensflareElement(flareTexture1, 70, 1.0));
    sunLight.add(lensflare);



    this.scene.add(sun);
    return sun;
  }

  public createEarth(planet: CelestialBody): THREE.Mesh {
    const dayTexture = this.resourceManager.getTexture('earth_day');
    const nightTexture = this.resourceManager.getTexture('earth_night');
    const cloudsTexture = this.resourceManager.getTexture('earth_clouds');
    const specularMap = this.resourceManager.getTexture('earth_specular');

    const geometry = new THREE.SphereGeometry(planet.radius, 128, 128);
    const earthMaterial = new THREE.ShaderMaterial({
      vertexShader: earthVertexShader,
      fragmentShader: earthFragmentShader,
      uniforms: {
        dayTexture: { value: dayTexture },
        nightTexture: { value: nightTexture },
        specularMap: { value: specularMap },
        sunDirection: { value: new THREE.Vector3(1, 0, 0) }
      }
    });

    const earth = new THREE.Mesh(geometry, earthMaterial);
    earth.castShadow = true;
    earth.receiveShadow = true;
    earth.userData.uniforms = earthMaterial.uniforms;

    const cloudGeometry = new THREE.SphereGeometry(planet.radius * 1.02, 64, 64);
    const cloudMaterial = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    clouds.castShadow = true;
    earth.add(clouds);


    earth.userData = { id: planet.id, clouds, uniforms: earthMaterial.uniforms };
    this.interactionManager.registerInteractable(planet.id, earth);
    this.scene.add(earth);
    return earth;
  }

  public createPlanet(planet: CelestialBody): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(planet.radius, 64, 64);
    
    const planetMaterial = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms: {
        dayTexture: { value: this.resourceManager.getTexture(planet.id) },
        nightTexture: { value: null }, // No night texture for other planets
        hasNightTexture: { value: false }, // Tell the shader to use the simpler lighting model
        sunDirection: { value: new THREE.Vector3(0, 0, 1) }
      }
    });

    const mesh = new THREE.Mesh(geometry, planetMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { id: planet.id, uniforms: planetMaterial.uniforms };

    this.interactionManager.registerInteractable(planet.id, mesh);
    this.scene.add(mesh);
    return mesh;
  }

  public createMoon(earthRadius: number): THREE.Mesh {
    const moonTexture = this.resourceManager.getTexture('moon');
    const moonGeometry = new THREE.SphereGeometry(earthRadius * 0.27, 32, 32);

    const moonMaterial = new THREE.ShaderMaterial({
      vertexShader: planetVertexShader,
      fragmentShader: planetFragmentShader,
      uniforms: {
        dayTexture: { value: moonTexture },
        nightTexture: { value: null },
        hasNightTexture: { value: false },
        sunDirection: { value: new THREE.Vector3(0, 0, 1) }
      }
    });

    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.userData = { id: 'moon', angle: 0, uniforms: moonMaterial.uniforms };
    moon.castShadow = true;
    moon.receiveShadow = true;

    this.interactionManager.registerInteractable('moon', moon);
    this.scene.add(moon);
    return moon;
  }

  public createMoonOrbit(earth: THREE.Object3D): void {
    const moonOrbitRadius = 10;
    const orbitColor = getColorForBody('moon');

    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta) * moonOrbitRadius, 0, Math.sin(theta) * moonOrbitRadius));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const haloMaterial = new THREE.LineBasicMaterial({ color: orbitColor, transparent: true, opacity: 0.3 });
    const orbitHalo = new THREE.Line(geometry, haloMaterial);

    const coreMaterial = new THREE.LineBasicMaterial({ color: orbitColor, transparent: true, opacity: 0.8 });
    const orbitCore = new THREE.Line(geometry, coreMaterial);

    earth.add(orbitHalo);
    earth.add(orbitCore);
  }

  public createSaturn(planet: CelestialBody): THREE.Mesh {
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
    saturn.userData = { id: planet.id };

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

    this.interactionManager.registerInteractable(planet.id, saturn);
    this.scene.add(saturn);
    return saturn;
  }

  public async createISS(earth: THREE.Mesh): Promise<THREE.Group | null> {
    try {
      const initialPositionData = await getISSPosition();
      const initialPosition = issTo3D(initialPositionData, earth);

      const gltf = await this.resourceManager.loadModel('iss', '/models/iss.glb');
      const issModel = gltf.scene;

      const earthRadius = (earth.geometry as THREE.SphereGeometry).parameters.radius;
      const issScale = earthRadius * 0.005;

      issModel.scale.setScalar(issScale);
      issModel.position.copy(initialPosition);
      issModel.userData = { id: 'iss' };

      issModel.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const material = child.material as THREE.MeshStandardMaterial;
          material.metalness = 0.8;
          material.roughness = 0.4;
        }
      });

      earth.add(issModel);
      this.interactionManager.registerInteractable('iss', issModel);
      return issModel;
    } catch (error) {
      console.error('Failed to create and add ISS model:', error);
      return null;
    }
  }
}