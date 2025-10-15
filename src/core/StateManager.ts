import { EventBus } from './EventBus';

interface AppState {
  currentDate: Date;
  selectedBody: string | null;
  hoveredBody: string | null;
  isPlaying: boolean;
  timeScale: number;
  cameraTarget: string | null;
  showOrbits: boolean;
  showLabels: boolean;
  showEvents: boolean;
}

export class StateManager {
  private static instance: StateManager;
  private state: AppState;
  private eventBus: EventBus;
  
  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.state = {
      currentDate: new Date(),
      selectedBody: null,
      hoveredBody: null,
      isPlaying: true,
      timeScale: 86400,
      cameraTarget: null,
      showOrbits: true,
      showLabels: false,
      showEvents: true,
    };
  }
  
  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }
  
  getState(): Readonly<AppState> {
    return { ...this.state };
  }
  
  setState<K extends keyof AppState>(key: K, value: AppState[K]) {
    const oldValue = this.state[key];
    this.state[key] = value;
    this.eventBus.emit(`state:${key}`, { oldValue, newValue: value });
  }
  
  updateDate(date: Date) {
    this.setState('currentDate', date);
  }
  
  selectBody(bodyId: string | null) {
    this.setState('selectedBody', bodyId);
  }
  
  hoverBody(bodyId: string | null) {
    this.setState('hoveredBody', bodyId);
  }
  
  togglePlay() {
    this.setState('isPlaying', !this.state.isPlaying);
  }
  
  setTimeScale(scale: number) {
    this.setState('timeScale', scale);
  }
  
  setCameraTarget(bodyId: string | null) {
    this.setState('cameraTarget', bodyId);
  }
}