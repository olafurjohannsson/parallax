
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
  const MRad = M * (Math.PI / 180);
  
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
  const x_orb = r * Math.cos(v);
  const y_orb = r * Math.sin(v);
  
  // Convert orbital elements from degrees to radians for transformation
  const omega = (elements.longPeri - elements.longNode) * (Math.PI / 180); // Argument of Perihelion
  const Omega = elements.longNode * (Math.PI / 180); // Longitude of Ascending Node
  const i = elements.i * (Math.PI / 180); // Inclination
  
  // Rotate by argument of perihelion (in-plane rotation)
  const x_rot1 = x_orb * Math.cos(omega) - y_orb * Math.sin(omega);
  const y_rot1 = x_orb * Math.sin(omega) + y_orb * Math.cos(omega);
  
  // Rotate by inclination (out-of-plane rotation)
  // This gives us position relative to the ascending node line
  const x_rot2 = x_rot1;
  const z_rot2 = y_rot1 * Math.sin(i);
  const y_rot2 = y_rot1 * Math.cos(i);
  
  // Rotate by longitude of ascending node (rotation in the ecliptic plane)
  const xEcl = x_rot2 * Math.cos(Omega) - y_rot2 * Math.sin(Omega);
  const zEcl = x_rot2 * Math.sin(Omega) + y_rot2 * Math.cos(Omega); // Mapped to Z for THREE.js
  const yEcl = z_rot2; // Mapped to Y for THREE.js
  
  // In our 3D scene, the solar system orbits on the X-Z plane, with Y being "up"
  return new THREE.Vector3(xEcl * scale, yEcl * scale, zEcl * scale);
}