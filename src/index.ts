import * as THREE from 'three';

// Scene
import { SolarSystemScene } from './scene/SolarSystemScene';

// Core
import { RenderPipeline } from './core/RenderPipeline';
import { ResourceManager } from './core/ResourceManager';
import { EventBus, Events } from './core/EventBus';
import { StateManager } from './core/StateManager';
import { TimeManager } from './core/TimeManager';
import { SelectionManager } from './core/SelectionManager';
import { ScenarioPlayer } from './core/ScenarioPlayer';
import { LabelManager } from './core/LabelManager';
import { RAGService } from './core/RAGService';

// UI
import { TimeControls } from './ui/TimeControls';
import { EventTimeline } from './ui/EventTimeline';
import { PlanetTooltip } from './ui/Tooltip';
import { SolarSystemMinimap } from './ui/Minimap';
import { EventDetailPanel } from './ui/EventDetailPanel';
import { SearchUI } from './ui/SearchUI';
import { DetailPanel } from './ui/DetailPanel';
import { StoryPanel } from './ui/StoryPanel';
import { HomeButton } from './ui/HomeButton';

// Data
import { solarSystemData } from './data/solarSystemData';
import { planetDatabase } from './data/planetInfo';
import { spaceEvents } from './data/eventData';
import { SpaceEvent, EventType } from './data/types';

// Components
import { getISSPosition, issTo3D } from './components/ISS';

// Utils
import { simpleSearch } from './utils/search';

async function init() {
  RAGService.getInstance().initialize('iss');
  const loadingScreen = createLoadingScreen();

  try {
    // Initialize
    const eventBus = EventBus.getInstance();
    const stateManager = StateManager.getInstance();
    const resourceManager = ResourceManager.getInstance();
    const timeManager = TimeManager.getInstance();

    // Preload
    await resourceManager.preloadPlanetTextures();

    // Initialize scene
    const container = document.getElementById('app-container')!;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;

    // UI Components
    const tooltip = new PlanetTooltip();
    const minimap = new SolarSystemMinimap();
    const scene = new SolarSystemScene(canvas, minimap);
    await scene.initializeBodies(solarSystemData);

    minimap.setScene(scene);

    const labelManager = new LabelManager(container, scene.getScene(), scene.camera, scene.getBodies());

    const scenarioPlayer = ScenarioPlayer.getInstance();
    const storyPanel = new StoryPanel();
    const homeButton = new HomeButton(scene);



    const eventPanel = new EventDetailPanel(
      () => { },
      (bodyId: string) => scene.transitionToBody(bodyId),
      (query: string) => console.log(`Search docs for: ${query}`)
    );

    const searchUI = new SearchUI((query: string) => {
      const results = simpleSearch(query);
      searchUI.showResults(results);
    });

    const timeControls = new TimeControls(
      (date: Date) => timeManager.setSimulationTime(date),
      (playing: boolean) => stateManager.setState('isPlaying', playing),
      (speed: number) => stateManager.setState('timeScale', speed)
    );

    const eventTimeline = new EventTimeline(
      (event: SpaceEvent) => eventPanel.show(event)
    );

    const detailPanel = new DetailPanel();

    // Setup event listeners
    setupEventListeners(eventBus, scene, tooltip);


    // Add celestial bodies
    // await setupSolarSystem(scene);

    const selectionManager = new SelectionManager(scene.getScene(), scene.getBodies());
    const movementHandler = setupKeyboardShortcuts(scene, eventPanel);

    // Setup render pipeline
    const renderPipeline = new RenderPipeline();
    renderPipeline.registerUpdatable(scene);
    renderPipeline.registerRenderable(scene);
    renderPipeline.registerRenderable(labelManager);
    renderPipeline.registerUpdatable(selectionManager);
    renderPipeline.registerUpdatable(movementHandler);
    renderPipeline.registerUpdatable(labelManager);


    // Setup ISS updates
    // setupISS(scene);

    // Setup keyboard shortcuts

    loadingScreen.remove();
    renderPipeline.start();
    timeManager.setSimulationTime(new Date());

    await scene.transitionToBody('earth', 3000);
    stateManager.selectBody('earth');

    console.log('Solar System initialized successfully');

  } catch (error) {
    loadingScreen.innerHTML = `
      <div style="text-align: center; color: #F44336;">
        <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px;">
          Error Initializing Solar System
        </div>
        <div style="color: #FFCDD2; font-size: 18px; max-width: 600px; line-height: 1.5;">
          A critical error occurred while loading resources. Please check the browser's developer console (F12) for more details. This is often caused by missing texture or model files.
        </div>
        <div style="color: #FFCDD2; font-size: 18px; max-width: 600px; line-height: 1.5;">
          ${error}
        </div>
      </div>
    `;
  }
}

function createLoadingScreen(): HTMLDivElement {
  const screen = document.createElement('div');
  screen.id = 'loading-screen';
  screen.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #0a0a1e, #14141f);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  screen.innerHTML = `
    <div style="text-align: center;">
      <div style="color: #667eea; font-size: 48px; font-weight: bold; margin-bottom: 20px;">
        Loading Solar System
      </div>
      <div style="color: #888; font-size: 18px;">
        Preparing your journey through space...
      </div>
    </div>
  `;
  document.body.appendChild(screen);
  return screen;
}

function setupEventListeners(
  eventBus: EventBus,
  scene: SolarSystemScene,
  tooltip: PlanetTooltip
) {
  const stateManager = StateManager.getInstance();

  eventBus.on(Events.BODY_HOVER, ({ id, x, y }) => {
    const planetInfo = planetDatabase[id];
    if (planetInfo) tooltip.show(planetInfo, x, y);
  });

  eventBus.on(Events.BODY_HOVER_END, () => tooltip.hide());

  eventBus.on(Events.BODY_CLICK, ({ id }) => {

    scene.transitionToBody(id);

    stateManager.selectBody(id);

  });

}


async function setupSolarSystem(scene: SolarSystemScene) {
  await scene.addSun(solarSystemData.sun.radius);

  for (const planet of solarSystemData.planets) {
    if (planet.id === 'saturn') await scene.addSaturnWithRings(planet);
    else if (planet.id === 'earth') await scene.addEarthWithClouds(planet);
    else await scene.addPlanet(planet);
  }

  const earth = solarSystemData.planets.find(p => p.id === 'earth');
  if (earth) await scene.addMoon(earth.radius);
}

async function setupISS(scene: SolarSystemScene) {
  const earth = scene.bodies.get('earth');
  if (earth) {
    await scene.addISS(earth as THREE.Mesh);
  } else {
    console.error("Could not setup ISS because Earth mesh was not found.");
  }
}

function setupKeyboardShortcuts(scene: SolarSystemScene, eventPanel: EventDetailPanel) {
  const stateManager = StateManager.getInstance();
  const keyStates: { [key: string]: boolean } = {};
  document.addEventListener('keydown', (e) => {
    keyStates[e.code] = true;

    if (e.code === 'Space') {
      e.preventDefault(); // Prevent the page from scrolling
      const currentState = stateManager.getState();
      stateManager.setState('isPlaying', !currentState.isPlaying);
    }
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
      'i': 'iss',
      'm': 'moon',
    };

    const planetId = planetMap[e.key.toLowerCase()];
    if (planetId) {
      scene.transitionToBody(planetId);
    }


  });
  document.addEventListener('keyup', (e) => {
    keyStates[e.code] = false;
  });

  const handleMovement = (deltaTime: number) => {
    const moveSpeed = 50 * deltaTime; // Scene units per second
    const panSpeed = 15.0 * deltaTime;

    const cameraDirection = new THREE.Vector3();
    scene.camera.getWorldDirection(cameraDirection);

    if (keyStates['KeyW']) { // Move forward
      scene.camera.position.addScaledVector(cameraDirection, moveSpeed);
    }
    if (keyStates['KeyS']) { // Move backward
      scene.camera.position.addScaledVector(cameraDirection, -moveSpeed);
    }

    // For panning (left/right, up/down), we need the camera's local axes.
    const right = new THREE.Vector3().crossVectors(cameraDirection, scene.camera.up);
    const up = new THREE.Vector3().crossVectors(right, cameraDirection);

    if (keyStates['KeyD']) { // Pan right
      scene.camera.position.addScaledVector(right, -panSpeed);
    }
    if (keyStates['KeyA']) { // Pan left
      scene.camera.position.addScaledVector(right, panSpeed);
    }
  };

  // We need to hook this movement handler into the main render loop.
  // The easiest way is to register it as a simple updatable with the pipeline.
  return { update: handleMovement };
}



if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}