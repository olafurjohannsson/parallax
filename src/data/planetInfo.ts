

export interface PlanetInfo {
  id: string;
  name: string;
  diameter: number; // km
  mass: number; // Earth masses
  gravity: number; // m/s²
  dayLength: number; // hours
  yearLength: number; // Earth days
  moons: number;
  description: string;
  discoveredBy?: string;
  discoveredDate?: string;
  temperature?: { min: number; max: number }; // Celsius
  atmosphere?: string;
  funFact?: string;
}

export const planetDatabase: Record<string, PlanetInfo> = {
  mercury: {
    id: 'mercury',
    name: 'Mercury',
    diameter: 4879,
    mass: 0.055,
    gravity: 3.7,
    dayLength: 4222.6,
    yearLength: 88,
    moons: 0,
    temperature: { min: -173, max: 427 },
    atmosphere: 'None (trace amounts)',
    description: 'The smallest planet and closest to the Sun',
    funFact: 'A year on Mercury is shorter than its day!',
  },
  venus: {
    id: 'venus',
    name: 'Venus',
    diameter: 12104,
    mass: 0.815,
    gravity: 8.9,
    dayLength: 2802,
    yearLength: 225,
    moons: 0,
    temperature: { min: 462, max: 462 },
    atmosphere: '96% CO₂, thick clouds of sulfuric acid',
    description: 'The hottest planet with a runaway greenhouse effect',
    funFact: 'Venus rotates backwards compared to most planets',
  },
  earth: {
    id: 'earth',
    name: 'Earth',
    diameter: 12742,
    mass: 1.0,
    gravity: 9.8,
    dayLength: 24,
    yearLength: 365.25,
    moons: 1,
    temperature: { min: -88, max: 58 },
    atmosphere: '78% N₂, 21% O₂',
    description: 'The only known planet with life',
    funFact: 'Earth is the only planet not named after a god',
  },
  mars: {
    id: 'mars',
    name: 'Mars',
    diameter: 6779,
    mass: 0.107,
    gravity: 3.7,
    dayLength: 24.6,
    yearLength: 687,
    moons: 2,
    temperature: { min: -87, max: -5 },
    atmosphere: '95% CO₂, very thin',
    description: 'The Red Planet with evidence of ancient water',
    funFact: 'Mars has the largest volcano in the solar system: Olympus Mons',
  },
  jupiter: {
    id: 'jupiter',
    name: 'Jupiter',
    diameter: 139820,
    mass: 317.8,
    gravity: 23.1,
    dayLength: 9.9,
    yearLength: 4333,
    moons: 95,
    temperature: { min: -108, max: -108 },
    atmosphere: '90% H₂, 10% He',
    description: 'The largest planet, a gas giant with a Great Red Spot storm',
    funFact: 'Jupiter has the shortest day of all planets despite its size',
  },
  saturn: {
    id: 'saturn',
    name: 'Saturn',
    diameter: 116460,
    mass: 95.2,
    gravity: 9.0,
    dayLength: 10.7,
    yearLength: 10759,
    moons: 146,
    temperature: { min: -139, max: -139 },
    atmosphere: '96% H₂, 3% He',
    description: 'Famous for its spectacular ring system',
    funFact: 'Saturn could float in water due to its low density',
  },
  uranus: {
    id: 'uranus',
    name: 'Uranus',
    diameter: 50724,
    mass: 14.5,
    gravity: 8.7,
    dayLength: 17.2,
    yearLength: 30687,
    moons: 27,
    temperature: { min: -197, max: -197 },
    atmosphere: '83% H₂, 15% He, 2% CH₄',
    description: 'An ice giant that rotates on its side',
    discoveredBy: 'William Herschel',
    discoveredDate: '1781',
    funFact: 'Uranus rotates at 98° tilt - it rolls like a ball',
  },
  neptune: {
    id: 'neptune',
    name: 'Neptune',
    diameter: 49244,
    mass: 17.1,
    gravity: 11.0,
    dayLength: 16.1,
    yearLength: 60190,
    moons: 14,
    temperature: { min: -201, max: -201 },
    atmosphere: '80% H₂, 19% He, 1% CH₄',
    description: 'The windiest planet with supersonic storms',
    discoveredBy: 'Johann Galle',
    discoveredDate: '1846',
    funFact: 'Neptune has the strongest winds in the solar system at 2,100 km/h',
  },
  sun: {
    id: 'sun',
    name: 'Sun',
    diameter: 1392700,
    mass: 333000, // Earth masses
    gravity: 274,
    dayLength: 609.12, // Surface rotation at equator
    yearLength: 0,
    moons: 8, // planets
    temperature: { min: 5500, max: 15000000 }, // Surface to core
    atmosphere: 'Hydrogen plasma',
    description: 'The star at the center of our solar system',
    funFact: 'The Sun contains 99.86% of all mass in the solar system',
  },
  iss: {
    id: 'iss',
    name: 'International Space Station',
    diameter: 0.109, // in km (109 meters)
    mass: 4.5e-19, // in Earth masses (450,000 kg)
    gravity: 0, // Microgravity environment
    dayLength: 0.0000001, // Not applicable, orbits Earth
    yearLength: 0.0000001, // Not applicable
    moons: 0,
    description: 'A modular space station in low Earth orbit. A multinational collaborative project involving five space agencies, serving as a microgravity and space environment research laboratory.',
    funFact: 'The ISS travels at a speed of 7.66 km/s, completing 15.5 orbits around Earth per day.'
  }
};