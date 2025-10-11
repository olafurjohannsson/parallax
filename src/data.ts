import { PlanetData } from './types';

export const solarSystemData: PlanetData = {
  sun: {
    id: 'sun',
    name: 'Sun',
    radius: 20,
    color: '#FDB813', // Keep for backwards compatibility
  },
  planets: [
    {
      id: 'mercury',
      name: 'Mercury',
      radius: 1.2,
      orbitRadius: 40,
      orbitSpeed: 0.004, // 88 days (sped up 1000x)
      color: '#8C7853',
      angle: 0,
    },
    {
      id: 'venus',
      name: 'Venus',
      radius: 2.4,
      orbitRadius: 60,
      orbitSpeed: 0.003, // 225 days
      color: '#FFC649',
      angle: Math.PI / 4,
    },
    {
      id: 'earth',
      name: 'Earth',
      radius: 2.5,
      orbitRadius: 80,
      orbitSpeed: 0.0027, // 365 days
      color: '#4169E1',
      angle: Math.PI / 2,
    },
    {
      id: 'mars',
      name: 'Mars',
      radius: 1.8,
      orbitRadius: 100,
      orbitSpeed: 0.0014, // 687 days
      color: '#CD5C5C',
      angle: Math.PI,
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      radius: 8,
      orbitRadius: 140,
      orbitSpeed: 0.00023, // 12 years
      color: '#DAA520',
      angle: Math.PI * 1.5,
    },
    {
      id: 'saturn',
      name: 'Saturn',
      radius: 7,
      orbitRadius: 180,
      orbitSpeed: 0.000091, // 29 years
      color: '#F4A460',
      angle: Math.PI * 0.75,
    },
    {
      id: 'uranus',
      name: 'Uranus',
      radius: 4,
      orbitRadius: 220,
      orbitSpeed: 0.000032, // 84 years
      color: '#4FD0E0',
      angle: Math.PI * 1.25,
    },
    {
      id: 'neptune',
      name: 'Neptune',
      radius: 3.8,
      orbitRadius: 260,
      orbitSpeed: 0.000016, // 165 years
      color: '#4169E1',
      angle: Math.PI * 0.5,
    },
  ],
};

export const specialObjects = [
  {
    id: 'iss',
    name: 'International Space Station',
    keywords: ['iss', 'space station', 'international'],
  }
];