import { EventBus } from "../core/EventBus";
import { Events } from "../core/EventBus";

export class StoryPanel {
  private container: HTMLDivElement;
  private progressFill: HTMLDivElement;
  private titleElement: HTMLDivElement;
  private textElement: HTMLDivElement;
  private imageElement: HTMLImageElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'story-panel';
    this._applyStyles();
    
    this.container.innerHTML = `
      <div id="story-progress-bar"><div id="story-progress-fill"></div></div>
      <div id="story-content">
        <div id="story-text-content">
          <h3 id="story-title"></h3>
          <p id="story-text"></p>
        </div>
        <img id="story-image" src="" alt="Historical image" style="display: none;"/>
      </div>
    `;
    
    document.body.appendChild(this.container);

    this.progressFill = document.getElementById('story-progress-fill') as HTMLDivElement;
    this.titleElement = document.getElementById('story-title') as HTMLDivElement;
    this.textElement = document.getElementById('story-text') as HTMLDivElement;
    this.imageElement = document.getElementById('story-image') as HTMLImageElement;

    this._setupEventListeners();
  }

  private _applyStyles() {
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translate(-50%, 150%);
      width: 90%;
      max-width: 800px;
      height: 180px;
      background: rgba(15, 20, 40, 0.75);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(200, 210, 255, 0.3);
      border-radius: 12px 12px 0 0;
      z-index: 3000;
      color: #fff;
      font-family: 'Arial', sans-serif;
      transition: transform 0.5s ease-in-out;
      box-shadow: 0 -5px 25px rgba(0,0,0,0.3);
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
      #story-progress-bar { width: 100%; height: 4px; background: rgba(255,255,255,0.2); }
      #story-progress-fill { width: 0%; height: 100%; background: #667eea; transition: width 0.2s linear; }
      #story-content { display: flex; padding: 20px; align-items: center; height: calc(100% - 4px); }
      #story-text-content { flex: 1; }
      #story-text-content h3 { margin: 0 0 8px 0; color: #a6b2f7; }
      #story-text-content p { margin: 0; font-size: 16px; line-height: 1.5; }
      #story-image { display: none; width: 180px; height: 130px; object-fit: cover; border-radius: 8px; margin-left: 20px; border: 1px solid rgba(255,255,255,0.2); }
    `;
    document.head.appendChild(styleSheet);
  }

  private _setupEventListeners() {
    const eventBus = EventBus.getInstance();
    eventBus.on(Events.SCENARIO_START, (payload) => this.show(payload.title));
    eventBus.on(Events.SCENARIO_END, () => this.hide());
    eventBus.on(Events.SCENARIO_UPDATE, (payload) => this._updateProgress(payload.progress));
    eventBus.on(Events.SHOW_NARRATION, (payload) => this._updateText(payload.text));
    eventBus.on(Events.SHOW_IMAGE, (payload) => this._updateImage(payload.url));
  }

  public show(title: string) {
    this.titleElement.textContent = title;
    this.textElement.textContent = 'Scenario starting...';
    this.imageElement.style.display = 'none';
    this.container.style.transform = 'translate(-50%, 0)';
  }

  public hide() {
    this.container.style.transform = 'translate(-50%, 150%)';
  }

  private _updateProgress(progress: number) {
    this.progressFill.style.width = `${progress * 100}%`;
  }
  
  private _updateText(text: string) {
    this.textElement.textContent = text;
  }
  
  private _updateImage(url: string) {
    if (url) {
      this.imageElement.src = url;
      this.imageElement.style.display = 'block';
    } else {
      this.imageElement.style.display = 'none';
    }
  }
}
