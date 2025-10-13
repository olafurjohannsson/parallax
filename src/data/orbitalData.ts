export interface OrbitalElements {
  a: number;      // Semi-major axis (AU)
  e: number;      // Eccentricity
  i: number;      // Inclination (degrees)
  L: number;      // Mean longitude at epoch (degrees)
  longPeri: number; // Longitude of perihelion (degrees)
  longNode: number; // Longitude of ascending node (degrees)
  period: number;   // Orbital period (days)
}

export const orbitalElements: Record<string, OrbitalElements> = {
  mercury: {
    a: 0.38709927,
    e: 0.20563593,
    i: 7.00497902,
    L: 252.25032350,
    longPeri: 77.45779628,
    longNode: 48.33076593,
    period: 87.969,
  },
  venus: {
    a: 0.72333566,
    e: 0.00677672,
    i: 3.39467605,
    L: 181.97909950,
    longPeri: 131.60246718,
    longNode: 76.67984255,
    period: 224.701,
  },
  earth: {
    a: 1.00000261,
    e: 0.01671123,
    i: -0.00001531,
    L: 100.46457166,
    longPeri: 102.93768193,
    longNode: 0.0,
    period: 365.256,
  },
  mars: {
    a: 1.52371034,
    e: 0.09339410,
    i: 1.84969142,
    L: -4.55343205,
    longPeri: -23.94362959,
    longNode: 49.55953891,
    period: 686.980,
  },
  jupiter: {
    a: 5.20288700,
    e: 0.04838624,
    i: 1.30439695,
    L: 34.39644051,
    longPeri: 14.72847983,
    longNode: 100.47390909,
    period: 4332.589,
  },
  saturn: {
    a: 9.53667594,
    e: 0.05386179,
    i: 2.48599187,
    L: 49.95424423,
    longPeri: 92.59887831,
    longNode: 113.66242448,
    period: 10759.22,
  },
  uranus: {
    a: 19.18916464,
    e: 0.04725744,
    i: 0.77263783,
    L: 313.23810451,
    longPeri: 170.95427630,
    longNode: 74.01692503,
    period: 30688.5,
  },
  neptune: {
    a: 30.06992276,
    e: 0.00859048,
    i: 1.77004347,
    L: -55.12002969,
    longPeri: 44.96476227,
    longNode: 131.78422574,
    period: 60182.0,
  },
};