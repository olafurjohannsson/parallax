import * as THREE from 'three';

// Define our categories
export enum BodyType {
  STAR = 'star',
  PLANET = 'planet',
  DWARF_PLANET = 'dwarf_planet',
  MOON = 'moon',
  SPACECRAFT = 'spacecraft',
  ASTEROID = 'asteroid'
}

// Define the color scheme for each category
export const typeColors: { [key in BodyType]: THREE.Color } = {
  [BodyType.STAR]: new THREE.Color('#FFD700'),       // Gold
  [BodyType.PLANET]: new THREE.Color('#87CEEB'),     // Sky Blue
  [BodyType.DWARF_PLANET]: new THREE.Color('#A9A9A9'), // Dark Grey
  [BodyType.MOON]: new THREE.Color('#FFFFFF'),       // White
  [BodyType.SPACECRAFT]: new THREE.Color('#39FF14'), // Neon Green
  [BodyType.ASTEROID]: new THREE.Color('#D2B48C'),   // Tan
};

// Map each body ID to its type. This is our master list.
export const bodyTypeMap: { [id: string]: BodyType } = {
  'sun': BodyType.STAR,
  'mercury': BodyType.PLANET,
  'venus': BodyType.PLANET,
  'earth': BodyType.PLANET,
  'mars': BodyType.PLANET,
  'jupiter': BodyType.PLANET,
  'saturn': BodyType.PLANET,
  'uranus': BodyType.PLANET,
  'neptune': BodyType.PLANET,
  'moon': BodyType.MOON,
  'iss': BodyType.SPACECRAFT,
};

// Helper function to get the color for a specific body ID
export function getColorForBody(id: string): THREE.Color {
  const type = bodyTypeMap[id] || BodyType.PLANET; // Default to planet
  return typeColors[type];
}