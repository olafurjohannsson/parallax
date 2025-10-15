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
  [BodyType.STAR]: new THREE.Color('#FFD700'),      
  [BodyType.PLANET]: new THREE.Color('#87CEEB'),    
  [BodyType.DWARF_PLANET]: new THREE.Color('#A9A9A9'), 
  [BodyType.MOON]: new THREE.Color('#CCCCCC'),       
  [BodyType.SPACECRAFT]: new THREE.Color('#39FF14'), 
  [BodyType.ASTEROID]: new THREE.Color('#D2B48C'),   
};

export const individualBodyColors: { [id: string]: THREE.Color } = {
  'mercury': new THREE.Color('#A9A9A9'), // Dark Grey / Silver
  'venus': new THREE.Color('#D2B48C'),   // Tan / Gold
  'earth': new THREE.Color('#87CEEB'),   // Sky Blue
  'mars': new THREE.Color('#CD5C5C'),    // Martian Red
  'jupiter': new THREE.Color('#DAA520'), // Goldenrod
  'saturn': new THREE.Color('#F4A460'),  // Sandy Brown
  'uranus': new THREE.Color('#4FD0E0'),  // Light Cyan
  'neptune': new THREE.Color('#4169E1'),  // Royal Blue
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
  'pluto': BodyType.DWARF_PLANET,
  'iss': BodyType.SPACECRAFT,
};

// Helper function to get the color for a specific body ID
export function getColorForBody(id: string): THREE.Color {
  // 1. Check for a specific, individual color first. This is top priority.
  if (individualBodyColors[id]) {
    return individualBodyColors[id];
  }
  
  // 2. If no individual color is found, fall back to the category color.
  const type = bodyTypeMap[id];
  if (type && typeColors[type]) {
    return typeColors[type];
  }

  // 3. If all else fails, return a default color.
  return new THREE.Color('#FFFFFF'); // Default to white
}