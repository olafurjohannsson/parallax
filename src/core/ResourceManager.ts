import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EventBus, Events } from './EventBus';

interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class ResourceManager {
  private static instance: ResourceManager;
  private textureLoader: THREE.TextureLoader;
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private eventBus: EventBus;
  
  private textures: Map<string, THREE.Texture> = new Map();
  private models: Map<string, any> = new Map();
  private loadingQueue: Set<string> = new Set();
  
  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.textureLoader = new THREE.TextureLoader();
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    this.setupLoadingManager();
  }
  
  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }
  
  private setupLoadingManager() {
    const manager = new THREE.LoadingManager(
      () => {
        console.log('All resources loaded');
        this.eventBus.emit(Events.RESOURCE_LOADED, { type: 'all' });
      },
      (url, loaded, total) => {
        const progress: LoadingProgress = {
          loaded,
          total,
          percentage: (loaded / total) * 100
        };
        this.eventBus.emit('resource:progress', progress);
      },
      (url) => {
        console.error('Failed to load:', url);
        this.eventBus.emit(Events.RESOURCE_ERROR, { url });
      }
    );
    
    this.textureLoader.manager = manager;
  }
  
  async loadTexture(id: string, url: string): Promise<THREE.Texture> {
    if (this.textures.has(id)) {
      return this.textures.get(id)!;
    }

    this.loadingQueue.add(id);

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          this.textures.set(id, texture);
          this.loadingQueue.delete(id);
          this.eventBus.emit(Events.RESOURCE_LOADED, { type: 'texture', id, url });
          resolve(texture);
        },
        undefined,
        (errorEvent) => {
          console.error(`ResourceManager Error: Failed to load texture with id '${id}' from URL: ${url}`);
          this.loadingQueue.delete(id);
          this.eventBus.emit(Events.RESOURCE_ERROR, { type: 'texture', id, url, error: errorEvent });
          reject(new Error(`Failed to load texture: ${url}`));
        }
      );
    });
  }
  
  async loadModel(id: string, url: string): Promise<any> {
    if (this.models.has(id)) {
      return this.models.get(id)!;
    }
    
    this.loadingQueue.add(id);
    
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          this.models.set(id, gltf);
          this.loadingQueue.delete(id);
          this.eventBus.emit(Events.RESOURCE_LOADED, { type: 'model', id, url });
          resolve(gltf);
        },
        (progress) => {
          const percentage = (progress.loaded / progress.total) * 100;
          this.eventBus.emit('resource:progress', { 
            type: 'model', 
            id, 
            percentage 
          });
        },
        (error) => {
          this.loadingQueue.delete(id);
          this.eventBus.emit(Events.RESOURCE_ERROR, { type: 'model', id, url, error });
          reject(error);
        }
      );
    });
  }
  
  async preloadPlanetTextures(): Promise<void> {
    const textures = [
      { id: 'sun', url: '/textures/8k_sun.jpg' },
      { id: 'mercury', url: '/textures/8k_mercury.jpg' },
      { id: 'venus', url: '/textures/2k_venus_atmosphere.jpg' },
      { id: 'earth_day', url: '/textures/8k_earth_daymap.jpg' },
      { id: 'earth_night', url: '/textures/8k_earth_nightmap.jpg' },
      { id: 'earth_clouds', url: '/textures/8k_earth_clouds.jpg' },
      { id: 'earth_normal', url: '/textures/8k_earth_normal_map.png' },
      { id: 'earth_specular', url: '/textures/8k_earth_specular_map.png' },
      { id: 'moon', url: '/textures/8k_moon.jpg' },
      { id: 'mars', url: '/textures/8k_mars.jpg' },
      { id: 'jupiter', url: '/textures/8k_jupiter.jpg' },
      { id: 'saturn', url: '/textures/8k_saturn.jpg' },
      { id: 'saturn_ring', url: '/textures/8k_saturn_ring_alpha.png' },
      { id: 'uranus', url: '/textures/2k_uranus.jpg' },
      { id: 'neptune', url: '/textures/2k_neptune.jpg' },
      { id: 'stars', url: '/textures/8k_stars.jpg' },
      { id: 'stars_milky_way', url: '/textures/8k_stars_milky_way.jpg' },
    ];
    
    await Promise.all(textures.map(t => this.loadTexture(t.id, t.url)));
  }
  
  getTexture(id: string): THREE.Texture | undefined {
    return this.textures.get(id);
  }
  
  getModel(id: string): any | undefined {
    return this.models.get(id);
  }
  
  isLoading(): boolean {
    return this.loadingQueue.size > 0;
  }
  
  dispose() {
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();
    this.models.clear();
    this.dracoLoader.dispose();
  }
}