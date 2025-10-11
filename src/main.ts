import { TimeControls } from './timeControls';
import { EventTimeline } from './eventTimeline';
import { SolarSystemScene } from './scene';
import { solarSystemData } from './data';
import { SearchUI } from './ui';
import { simpleSearch } from './search';
import { getISSPosition, issTo3D } from './iss';
import { PlanetTooltip } from './tooltip';
import { planetDatabase } from './planetInfo';

import { SolarSystemMinimap } from './minimap';




const tooltip = new PlanetTooltip();
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const scene = new SolarSystemScene(canvas);
const minimap = new SolarSystemMinimap((planetId) => {
  console.log(`Minimap clicked: ${planetId}`);
  scene.transitionToBody(planetId);
});
const searchUI = new SearchUI((query) => {
  const results = simpleSearch(query);
  searchUI.showResults(results);
});
window.addEventListener('bodyhover', ((e: CustomEvent) => {
  const planetInfo = planetDatabase[e.detail.id];
  if (planetInfo) {
    tooltip.show(planetInfo, e.detail.x, e.detail.y);
    scene.addHoverGlow(e.detail.id);
  }
}) as EventListener);

window.addEventListener('bodyhoverend', ((e: CustomEvent) => {
  tooltip.hide();
  if (e.detail?.id) {
    scene.removeHoverGlow(e.detail.id);
  }
}) as EventListener);
window.addEventListener('navigate', ((e: CustomEvent) => {
  scene.transitionToBody(e.detail);
}) as EventListener);

// Add sun
scene.addRealisticSun(solarSystemData.sun.radius);
const earth = solarSystemData.planets.find(p => p.id === 'earth')!;
scene.addMoon(earth.orbitRadius, earth.radius);

// Texture map
const textureMap: Record<string, string> = {
  mercury: '/textures/8k_mercury.jpg',
  venus: '/textures/2k_venus_atmosphere.jpg',  
  earth: '/textures/8k_earth_daymap.jpg',      
  mars: '/textures/8k_mars.jpg',
  jupiter: '/textures/8k_jupiter.jpg',
  saturn: '/textures/8k_saturn.jpg',
  uranus: '/textures/2k_uranus.jpg',           
  neptune: '/textures/2k_neptune.jpg',         
};

// Add planets
solarSystemData.planets.forEach((planet) => {
  if (planet.id === 'saturn') {
    scene.addSaturnWithRings(planet);
  } else if (planet.id === 'earth') {
    scene.addEarthWithClouds(planet);
  } else {
    scene.addPlanetWithTexture(planet, textureMap[planet.id]);
  }
});

// ISS updates
async function updateISS() {
  const issData = await getISSPosition();
  const earthOrbitRadius = solarSystemData.planets.find(p => p.id === 'earth')!.orbitRadius;
  const position = issTo3D(issData, earthOrbitRadius);

  if (!scene.bodies.has('iss')) {
    scene.addISS(position);
    console.log('ISS added at', issData.latitude, issData.longitude);
  } else {
    scene.updateISS(position);
  }
}



let isPlaying = true;
let currentDate = new Date();
let timeScale = 86400 * 1;
let lastTime = Date.now();

const timeControls = new TimeControls(
  (date) => {
    currentDate = date;
    scene.updatePlanetPositionsRealistic(date);
    eventTimeline.updateEvents(date);
  },
  (playing) => {
    isPlaying = playing;
  },
  (speed) => {
    timeScale = speed;
  }
);

const eventTimeline = new EventTimeline((event) => {
  currentDate = event.date;
  timeControls.setDate(currentDate);
  scene.updatePlanetPositionsRealistic(currentDate);
  
  if (event.location) {
    scene.transitionToBody(event.location.bodyId);
  }
});

const animate = () => {
  const now = Date.now();
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  
  if (isPlaying && timeControls.getIsPlaying()) {
    currentDate = new Date(currentDate.getTime() + timeScale * delta * 1000);
    timeControls.setDate(currentDate);
    eventTimeline.updateEvents(currentDate);
  }
  
  scene.updatePlanetPositionsRealistic(currentDate);
  scene.updateSun(delta * 1000);
  scene.updateEarth(delta);
  scene.updateMoon(delta);
  scene.updateStarRotation(delta * 1000);
  minimap.update(scene.bodies, scene.camera.position);
  scene.render();
  requestAnimationFrame(animate);
};

animate();

document.addEventListener('keydown', (e) => {
  const planetMap: Record<string, string> = {
    '1': 'mercury',
    '2': 'venus',
    '3': 'earth',
    '4': 'mars',
    '5': 'jupiter',
    '6': 'saturn',
    '7': 'uranus',
    '8': 'neptune',
    '0': 'sun',
  };

  const planetId = planetMap[e.key];
  if (planetId) {
    console.log(`Transitioning to ${planetId}`);
    scene.transitionToBody(planetId);
  }
});

updateISS();
setInterval(updateISS, 5000);