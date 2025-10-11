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