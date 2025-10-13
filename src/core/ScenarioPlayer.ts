
import { EventBus, Events } from './EventBus';

export type ScenarioAction = {
  time: number;
  type: 'SET_CAMERA' | 'SHOW_NARRATION' | 'SHOW_IMAGE' | 'PLAY_AUDIO' | 'LOAD_MODEL' | 'MOVE_MODEL';
  payload: any;
};

export type ScenarioScript = {
  id: string;
  title: string;
  totalDuration: number;
  actions: ScenarioAction[];
};

type PlayerState = 'IDLE' | 'PLAYING' | 'PAUSED';

export class ScenarioPlayer {
  private static instance: ScenarioPlayer;
  private eventBus: EventBus;

  private state: PlayerState = 'IDLE';
  private script: ScenarioScript | null = null;
  private startTime: number = 0;
  private currentIndex: number = 0;
  private animationFrameId: number | null = null;

  private constructor() {
    this.eventBus = EventBus.getInstance();
  }

  public static getInstance(): ScenarioPlayer {
    if (!ScenarioPlayer.instance) {
      ScenarioPlayer.instance = new ScenarioPlayer();
    }
    return ScenarioPlayer.instance;
  }

  public play(script: ScenarioScript) {
    if (this.state === 'PLAYING') return;

    console.log(`ScenarioPlayer: Starting scenario "${script.title}"`);
    this.script = script;
    this.state = 'PLAYING';
    this.startTime = performance.now();
    this.currentIndex = 0;

    this.eventBus.emit(Events.SCENARIO_START, { title: script.title, totalDuration: script.totalDuration });
    this._update();
  }

  public stop() {
    if (this.state === 'IDLE') return;

    console.log("ScenarioPlayer: Stopping scenario.");
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.state = 'IDLE';
    this.script = null;
    this.animationFrameId = null;
    this.eventBus.emit(Events.SCENARIO_END);
  }

  private _update() {
    if (this.state !== 'PLAYING' || !this.script) return;

    const elapsedTime = (performance.now() - this.startTime) / 1000;

    while (this.currentIndex < this.script.actions.length && elapsedTime >= this.script.actions[this.currentIndex].time) {
      const action = this.script.actions[this.currentIndex];
      this._executeAction(action);
      this.currentIndex++;
    }
    
    // Emit a progress update
    const progress = Math.min(elapsedTime / this.script.totalDuration, 1);
    this.eventBus.emit(Events.SCENARIO_UPDATE, { progress, elapsedTime });

    // Check for end of scenario
    if (elapsedTime >= this.script.totalDuration) {
      this.stop();
    } else {
      this.animationFrameId = requestAnimationFrame(this._update.bind(this));
    }
  }

  private _executeAction(action: ScenarioAction) {
    console.log(`Executing action: ${action.type} at ${action.time}s`, action.payload);
    this.eventBus.emit(action.type as keyof typeof Events, action.payload);
  }
}