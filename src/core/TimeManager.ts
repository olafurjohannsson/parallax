import { EventBus, Events } from './EventBus';
import { StateManager } from './StateManager';

export class TimeManager {
  private static instance: TimeManager;
  private eventBus: EventBus;
  private stateManager: StateManager;
  
  private lastFrameTime: number = 0;
  private deltaTime: number = 0;
  private elapsedTime: number = 0;
  private simulationTime: Date;
  
  private constructor() {
    this.eventBus = EventBus.getInstance();
    this.stateManager = StateManager.getInstance();
    this.simulationTime = new Date();
  }
  
  static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
  }
  
  update(currentTime: number) {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      return;
    }
    
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000; // Convert to seconds
    this.elapsedTime += this.deltaTime;
    this.lastFrameTime = currentTime;
    
    const state = this.stateManager.getState();
    if (state.isPlaying) {
      // Update simulation time based on time scale
      const millisToAdd = this.deltaTime * state.timeScale * 1000;
      this.simulationTime = new Date(this.simulationTime.getTime() + millisToAdd);
      this.stateManager.updateDate(this.simulationTime);
      this.eventBus.emit(Events.TIME_UPDATE, {
        simulationTime: this.simulationTime,
        deltaTime: this.deltaTime,
        elapsedTime: this.elapsedTime
      });
    }
  }
  
  getDeltaTime(): number {
    return this.deltaTime;
  }
  
  getElapsedTime(): number {
    return this.elapsedTime;
  }
  
  getSimulationTime(): Date {
    return new Date(this.simulationTime);
  }
  
  setSimulationTime(date: Date) {
    this.simulationTime = new Date(date);
    this.stateManager.updateDate(this.simulationTime);
    this.eventBus.emit(Events.TIME_UPDATE, {
      simulationTime: this.simulationTime,
      deltaTime: this.deltaTime,
      elapsedTime: this.elapsedTime
    });
  }
  
  // Calculate Julian Date for orbital mechanics
  getJulianDate(date: Date = this.simulationTime): number {
    const time = date.getTime();
    const julianDate = (time / 86400000) + 2440587.5;
    return julianDate;
  }
  
  // Get centuries since J2000.0 for orbital calculations
  getCenturiesSinceJ2000(date: Date = this.simulationTime): number {
    const jd = this.getJulianDate(date);
    const j2000 = 2451545.0;
    return (jd - j2000) / 36525.0;
  }
}