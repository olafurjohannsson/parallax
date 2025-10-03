interface ISSPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
}

export async function getISSPosition(): Promise<ISSPosition> {
  const response = await fetch('http://api.open-notify.org/iss-now.json');
  const data = await response.json();
  
  return {//good start
    latitude: parseFloat(data.iss_position.latitude),
    longitude: parseFloat(data.iss_position.longitude),
    altitude: 408,
    velocity: 7.66,
    timestamp: data.timestamp,
  };
}

export function issTo3D(iss: ISSPosition, earthOrbitRadius: number): THREE.Vector3 {
  const earthRadius = 6371; // ca 6400km around equator
  const orbitRadius = earthRadius + iss.altitude;
  const scale = earthOrbitRadius / earthRadius;
  
  const lat = (iss.latitude * Math.PI) / 180;
  const lon = (iss.longitude * Math.PI) / 180;
  
  const x = orbitRadius * Math.cos(lat) * Math.cos(lon) * scale;
  const y = orbitRadius * Math.sin(lat) * scale;
  const z = orbitRadius * Math.cos(lat) * Math.sin(lon) * scale;
  
  return new THREE.Vector3(x, y, z);
}