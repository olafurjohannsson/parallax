import { SolarSystemScene } from './scene';
import { solarSystemData } from './data';
import { SearchUI } from './ui';
import { simpleSearch } from './search';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const scene = new SolarSystemScene(canvas);

const searchUI = new SearchUI((query) => {
  const results = simpleSearch(query);
  searchUI.showResults(results);
});

window.addEventListener('navigate', ((e: CustomEvent) => {
  scene.transitionToBody(e.detail);
}) as EventListener);

scene.addSun(solarSystemData.sun.radius, solarSystemData.sun.color);

solarSystemData.planets.forEach((planet) => {
  scene.addPlanet(planet);
});

let lastTime = Date.now();
const animate = () => {
  const now = Date.now();
  const delta = now - lastTime;
  lastTime = now;

  scene.updatePlanetPositions(solarSystemData.planets);

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