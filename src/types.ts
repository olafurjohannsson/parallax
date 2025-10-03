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