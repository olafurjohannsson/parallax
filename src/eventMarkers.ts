

export class EventMarker {
  private marker: THREE.Group;
  
  constructor(event: SpaceEvent, parentBody: THREE.Mesh) {
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
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(event.title.substring(0, 15), 128, 64);
    
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
    
    parentBody.add(this.marker);
  }
  
  private positionOnSurface(planet: THREE.Mesh, coords: { lat: number, lon: number }) {
    const radius = (planet.geometry as THREE.SphereGeometry).parameters.radius;
    const lat = coords.lat * Math.PI / 180;
    const lon = coords.lon * Math.PI / 180;
    
    const x = radius * Math.cos(lat) * Math.cos(lon);
    const y = radius * Math.sin(lat);
    const z = radius * Math.cos(lat) * Math.sin(lon);
    
    this.marker.position.set(x, y, z);
    this.marker.lookAt(planet.position);
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
  
  animate() {
    this.marker.children[1].rotation.y = Math.sin(Date.now() * 0.002) * 0.2;
  }
}