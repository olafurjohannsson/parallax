import * as THREE from 'three';

interface ISSPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
}

export async function getISSPosition(): Promise<ISSPosition> {
  try {
    const response = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
    const data = await response.json();
    
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      altitude: data.altitude, // km above Earth
      velocity: data.velocity,
      timestamp: data.timestamp,
    };
  } catch (error) {
    // Fallback to open-notify API
    const response = await fetch('http://api.open-notify.org/iss-now.json');
    const data = await response.json();
    
    return {
      latitude: parseFloat(data.iss_position.latitude),
      longitude: parseFloat(data.iss_position.longitude),
      altitude: 408, // Average ISS altitude
      velocity: 7.66,
      timestamp: data.timestamp,
    };
  }
}

export function issTo3D(iss: ISSPosition, earthMesh: THREE.Mesh): THREE.Vector3 {
  // Get Earth's radius from the mesh geometry
  const earthRadius = (earthMesh.geometry as THREE.SphereGeometry).parameters.radius;
  
  // The ISS orbits at about 408km above the surface.
  // Earth's actual radius is ~6371km.
  // The orbital radius is ~6779km, which is about 1.064 times the Earth's radius.
  const orbitRadius = earthRadius * 1.064;
  
  // Convert lat/lon from degrees to radians
  const latRad = (iss.latitude * Math.PI) / 180;
  const lonRad = (iss.longitude * Math.PI) / 180;
  
  // Convert spherical coordinates (lat, lon, radius) to Cartesian (x, y, z)
  const x = orbitRadius * Math.cos(latRad) * Math.cos(lonRad);
  const y = orbitRadius * Math.sin(latRad);
  const z = orbitRadius * Math.cos(latRad) * Math.sin(lonRad);
  
  // Return the position relative to the Earth's center (0,0,0)
  return new THREE.Vector3(x, y, z);
}