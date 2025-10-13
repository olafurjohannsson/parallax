import * as THREE from 'three'; // Fixed import
import { SpaceEvent, EventType } from './types'; // Fixed import

export class EventMarker {
  private marker: THREE.Group;
  private event: SpaceEvent;
  
  constructor(event: SpaceEvent, parentBody: THREE.Mesh) {
    this.event = event;
    this.marker = new THREE.Group();
    
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3, 8);
    const poleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.y = 1.5;
    
    const flagGeometry = new THREE.PlaneGeometry(1.5, 1);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = this.getEventColor(event.eventType);
    ctx.fillRect(0, 0, 256, 128);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const title = event.title.length > 15 
      ? event.title.substring(0, 15) + '...' 
      : event.title;
    ctx.fillText(title, 128, 64);
    
    const flagTexture = new THREE.CanvasTexture(canvas);
    const flagMaterial = new THREE.MeshBasicMaterial({ 
      map: flagTexture,
      side: THREE.DoubleSide,
      transparent: true,
    });
    
    const flag = new THREE.Mesh(flagGeometry, flagMaterial);
    flag.position.set(0.75, 2.5, 0);
    
    this.marker.add(pole);
    this.marker.add(flag);
    
    if (event.location?.coords) {
      this.positionOnSurface(parentBody, event.location.coords);
    }
    
    this.marker.userData = { 
      id: `event_${event.id}`,
      eventId: event.id,
      type: 'event_marker' 
    };
    
    parentBody.add(this.marker);
  }
  
  private positionOnSurface(planet: THREE.Mesh, coords: { lat: number, lon: number }) {
    const geometry = planet.geometry as THREE.SphereGeometry;
    const radius = geometry.parameters.radius;
    
    // Convert lat/lon to radians
    const lat = coords.lat * Math.PI / 180;
    const lon = coords.lon * Math.PI / 180;
    
    // Convert to Cartesian coordinates
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    
    // Position the marker
    this.marker.position.set(x, y, z);
    
    // Orient the marker to point away from planet center
    this.marker.lookAt(planet.position.clone().multiplyScalar(2));
    this.marker.rotateX(Math.PI / 2);
  }
  
  private getEventColor(type: EventType): string {
    const colors = {
      [EventType.Landing]: '#4CAF50',
      [EventType.Launch]: '#2196F3',
      [EventType.Flyby]: '#FF9800',
      [EventType.Discovery]: '#9C27B0',
      [EventType.Collision]: '#F44336',
      [EventType.Milestone]: '#FFD700',
    };
    return colors[type] || '#666';
  }
  
  animate(time: number) {
    // Gentle flag waving animation
    if (this.marker.children[1]) {
      this.marker.children[1].rotation.y = Math.sin(time * 0.002) * 0.2;
    }
  }
  
  setHighlight(highlighted: boolean) {
    const scale = highlighted ? 1.5 : 1.0;
    this.marker.scale.setScalar(scale);
  }
  
  dispose() {
    this.marker.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    
    // Remove from parent
    if (this.marker.parent) {
      this.marker.parent.remove(this.marker);
    }
  }
}