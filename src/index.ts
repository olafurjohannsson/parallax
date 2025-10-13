
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

// UI
import { TimeControls } from './ui/TimeControls';
import { EventTimeline } from './ui/EventTimeline';
import { PlanetTooltip } from './ui/Tooltip';
import { SolarSystemMinimap } from './ui/Minimap';
import { EventDetailPanel } from './ui/EventDetailPanel';
import { SearchUI } from './ui/SearchUI';
import { DetailPanel } from './ui/DetailPanel';
import { StoryPanel } from './ui/StoryPanel';

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
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    
    // UI Components
    const tooltip = new PlanetTooltip();
    const minimap = new SolarSystemMinimap(
      (planetId: string) => eventBus.emit(Events.BODY_CLICK, { id: planetId })
    );
    const scene = new SolarSystemScene(canvas, minimap);

    const scenarioPlayer = ScenarioPlayer.getInstance();
    const storyPanel = new StoryPanel();

    const eventPanel = new EventDetailPanel(
      () => {},
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
    await setupSolarSystem(scene);

    const selectionManager = new SelectionManager(scene.getScene(), scene.getBodies());

    // Setup render pipeline
    const renderPipeline = new RenderPipeline();
    renderPipeline.registerUpdatable(scene);
    renderPipeline.registerRenderable(scene);

    // Setup ISS updates
    setupISS(scene);

    // Setup keyboard shortcuts
    setupKeyboardShortcuts(scene, eventPanel);
    loadingScreen.remove();
    renderPipeline.start();
    timeManager.setSimulationTime(new Date());

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
  eventBus.on(Events.BODY_HOVER, ({ id, x, y }) => {
    const planetInfo = planetDatabase[id];
    if (planetInfo) tooltip.show(planetInfo, x, y);
  });
  
  eventBus.on(Events.BODY_HOVER_END, () => tooltip.hide());
  
  eventBus.on(Events.BODY_CLICK, ({ id }) => scene.transitionToBody(id));
  
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
      'i': 'iss',
      'm': 'moon',
    };
    
    const planetId = planetMap[e.key.toLowerCase()];
    if (planetId) {
      scene.transitionToBody(planetId);
    }
    
    if (e.key.toLowerCase() === 'a') {
      const apollo11 = spaceEvents.find(ev => ev.id === 'apollo11');
      if (apollo11) {
        eventPanel.show(apollo11);
      }
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}