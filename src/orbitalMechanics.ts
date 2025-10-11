import * as THREE from 'three';
import { OrbitalElements } from './orbitalData';

export function calculatePlanetPosition(
  elements: OrbitalElements,
  date: Date,
  scale: number = 100 // AU to scene units
): THREE.Vector3 {
  // Days since J2000 epoch (Jan 1, 2000, 12:00 TT)
  const j2000 = new Date('2000-01-01T12:00:00Z');
  const daysSinceEpoch = (date.getTime() - j2000.getTime()) / (1000 * 60 * 60 * 24);
  
  // Mean anomaly (degrees)
  const n = 360 / elements.period; // degrees per day
  let M = (elements.L + n * daysSinceEpoch - elements.longPeri) % 360;
  if (M < 0) M += 360;
  const MRad = M * Math.PI / 180;
  
  // Solve Kepler's equation for eccentric anomaly (iterative)
  let E = MRad;
  for (let i = 0; i < 10; i++) {
    E = MRad + elements.e * Math.sin(E);
  }
  
  // True anomaly
  const v = 2 * Math.atan2(
    Math.sqrt(1 + elements.e) * Math.sin(E / 2),
    Math.sqrt(1 - elements.e) * Math.cos(E / 2)
  );
  
  // Distance from sun (AU)
  const r = elements.a * (1 - elements.e * Math.cos(E));
  
  // Position in orbital plane
  const x = r * Math.cos(v);
  const y = r * Math.sin(v);
  
  // Convert to ecliptic coordinates
  const omega = (elements.longPeri - elements.longNode) * Math.PI / 180;
  const Omega = elements.longNode * Math.PI / 180;
  const cosOmega = Math.cos(omega);
  const sinOmega = Math.sin(omega);
  const cosOmegaCap = Math.cos(Omega);
  const sinOmegaCap = Math.sin(Omega);
  
  const xEcl = (cosOmega * cosOmegaCap - sinOmega * sinOmegaCap) * x +
               (-sinOmega * cosOmegaCap - cosOmega * sinOmegaCap) * y;
  const zEcl = (cosOmega * sinOmegaCap + sinOmega * cosOmegaCap) * x +
               (-sinOmega * sinOmegaCap + cosOmega * cosOmegaCap) * y;
  
  return new THREE.Vector3(xEcl * scale, 0, zEcl * scale);
}