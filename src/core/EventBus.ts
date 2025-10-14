type EventCallback = (data?: any) => void;

export class EventBus {
  private static instance: EventBus;
  private events: Map<string, Set<EventCallback>>;

  private constructor() {
    this.events = new Map();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(event);
      }
    }
  }

  emit(event: string, data?: any) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  once(event: string, callback: EventCallback) {
    const wrapper = (data?: any) => {
      callback(data);
      this.off(event, wrapper);
    };
    this.on(event, wrapper);
  }

  clear() {
    this.events.clear();
  }
}

export const Events = {
  BODY_HOVER: 'body:hover',
  BODY_HOVER_END: 'body:hoverEnd',
  BODY_CLICK: 'body:click',
  BODY_SELECT: 'body:select',
  TIME_UPDATE: 'time:update',
  CAMERA_TRANSITION: 'camera:transition',
  EVENT_CLICK: 'event:click',
  RESOURCE_LOADED: 'resource:loaded',
  RESOURCE_ERROR: 'resource:error',
  SCENARIO_START: 'scenario:start',
  SCENARIO_UPDATE: 'scenario:update',
  SCENARIO_END: 'scenario:end',
  SET_CAMERA: 'action:setCamera',
  SHOW_NARRATION: 'action:showNarration',
  SHOW_IMAGE: 'action:showImage',
  PLAY_AUDIO: 'action:playAudio',
  LOAD_MODEL: 'action:loadModel',
  MOVE_MODEL: 'action:moveModel',
  ANIMATE_MODEL: 'action:animateModel',
  DESTROY_MODEL: 'action:destroyModel',
  
} as const;