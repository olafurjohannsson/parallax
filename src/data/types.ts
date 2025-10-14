import { ScenarioScript } from './core/ScenarioPlayer';

export interface CelestialBody {
  id: string;
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  color: string;
  angle: number;
}

export interface PlanetData {
  sun: Omit<CelestialBody, 'orbitRadius' | 'orbitSpeed' | 'angle'>;
  planets: CelestialBody[];
}

export interface SpaceEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  eventType: EventType;
  location?: CelestialLocation;
  mission?: string;
  imageUrl?: string;
  documentChunkIds?: string[];
  media?: EventMedia;
  crew?: string[];
  duration?: string;
  significance?: string[];
  relatedEvents?: string[];
  script?: ScenarioScript;
}

export interface EventMedia {
  images: MediaImage[];
  videos?: MediaVideo[];
  models3D?: Model3D[];
  audio?: MediaAudio[];
}

export interface MediaImage {
  url: string;
  nasaId?: string;
  title: string;
  description?: string;
  credit?: string;
  dateCreated?: string;
  thumbnail?: string;
}

export interface Model3D {
  url: string;
  nasaId?: string;
  title: string;
  format: 'glb' | 'obj' | 'stl';
  thumbnail?: string;
}

export interface MediaVideo {
  url: string;
  title: string;
  thumbnail?: string;
}

export interface MediaAudio {
  url: string;
  title: string;
  transcript?: string;
}

export enum EventType {
  Launch = 'launch',
  Landing = 'landing',
  Flyby = 'flyby',
  Discovery = 'discovery',
  Collision = 'collision',
  Milestone = 'milestone',
}

export interface CelestialLocation {
  bodyId: string;
  coords?: { lat: number; lon: number };
}