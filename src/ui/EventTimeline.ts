import { SpaceEvent, EventType } from '../data/types';
import { getEventsInRange } from '../data/eventData';
import { EventBus, Events } from '../core/EventBus'
import { ScenarioPlayer } from '../core/ScenarioPlayer';

export class EventTimeline {
  private container: HTMLDivElement;
  private eventsList: HTMLDivElement;
  private onEventClick: (event: SpaceEvent) => void;
  private eventBus: EventBus;

  constructor(onEventClick: (event: SpaceEvent) => void) {
    this.onEventClick = onEventClick;
    this.eventBus = EventBus.getInstance();

    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      right: 20px;
      top: 100px;
      width: 350px;
      max-height: calc(100vh - 220px);
      background: rgba(0, 0, 0, 0.9);
      border-radius: 12px;
      overflow: hidden;
      z-index: 1000;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 18px;
      font-weight: 600;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    `;
    header.textContent = 'Historical Events';

    this.eventsList = document.createElement('div');
    this.eventsList.style.cssText = `
      padding: 12px;
      overflow-y: auto;
      max-height: calc(100vh - 280px);
    `;

    this.container.appendChild(header);
    this.container.appendChild(this.eventsList);
    document.body.appendChild(this.container);
    this.eventBus.on(Events.TIME_UPDATE, ({ simulationTime }) => {
      this.updateEvents(simulationTime);
    });
  }

  updateEvents(currentDate: Date, windowDays: number = 365 * 5) { // Show 5 years window
    const startDate = new Date(currentDate.getTime() - windowDays * 24 * 60 * 60 * 1000);
    const endDate = new Date(currentDate.getTime() + windowDays * 24 * 60 * 60 * 1000);

    const events = getEventsInRange(startDate, endDate);

    this.eventsList.innerHTML = '';

    if (events.length === 0) {
      this.eventsList.innerHTML = '<div style="color: #888; text-align: center; padding: 20px;">No events in this period</div>';
      return;
    }

    events
      .sort((a, b) => Math.abs(a.date.getTime() - currentDate.getTime()) -
        Math.abs(b.date.getTime() - currentDate.getTime()))
      .slice(0, 10)
      .forEach(event => {
        const item = this.createEventItem(event, currentDate);
        this.eventsList.appendChild(item);
      });
  }

  private createEventItem(event: SpaceEvent, currentDate: Date): HTMLDivElement {
    const item = document.createElement('div');

    const daysDiff = Math.abs(event.date.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);
    const isActive = daysDiff < 30;
    const isPast = event.date < currentDate;

    item.style.cssText = `
      padding: 12px;
      margin-bottom: 8px;
      background: ${isActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
      border-left: 3px solid ${this.getEventColor(event.eventType)};
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
      opacity: ${isPast ? 0.7 : 1};
    `;

    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(102, 126, 234, 0.4)';
      item.style.transform = 'translateX(-2px)';
    });

    item.addEventListener('mouseleave', () => {
      item.style.background = isActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)';
      item.style.transform = 'translateX(0)';
    });

    item.addEventListener('click', () => {
      this.onEventClick(event);
    });

    const title = document.createElement('div');
    title.style.cssText = 'color: white; font-weight: 600; margin-bottom: 4px;';
    title.textContent = event.title;

    const date = document.createElement('div');
    date.style.cssText = 'color: #888; font-size: 12px; margin-bottom: 6px;';
    const relativeTime = this.getRelativeTimeString(event.date, currentDate);
    date.textContent = `${event.date.toLocaleDateString()} ${relativeTime}`;

    if (event.mission) {
      const mission = document.createElement('div');
      mission.style.cssText = `
        display: inline-block;
        background: rgba(102, 126, 234, 0.2);
        color: #667eea;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        margin-bottom: 6px;
      `;
      mission.textContent = event.mission;
      item.appendChild(mission);
    }

    const hasScript = !!event.script;

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="event-title" style="color: white; font-weight: 600; margin-bottom: 4px;">${event.title}</div>
          <div class="event-date" style="color: #888; font-size: 12px; margin-bottom: 6px;"></div>
          ${event.mission ? `<div class="event-mission" style="display: inline-block; background: rgba(102, 126, 234, 0.2); color: #667eea; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-bottom: 6px;">${event.mission}</div>` : ''}
          <div class="event-description" style="color: #ccc; font-size: 13px; line-height: 1.4;"></div>
        </div>
        ${hasScript ? `<button class="play-scenario-btn" style="background: #667eea; color: white; border: none; border-radius: 5px; padding: 5px 10px; cursor: pointer; font-size: 12px; margin-left: 10px;">▶ Play</button>` : ''}
      </div>
    `;

    
    item.querySelector('.event-date')!.textContent = `${event.date.toLocaleDateString()} ${this.getRelativeTimeString(event.date, currentDate)}`;
    const truncated = event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description;
    item.querySelector('.event-description')!.textContent = truncated;

    item.addEventListener('click', () => {
      this.onEventClick(event);
    });

    const playButton = item.querySelector('.play-scenario-btn');
    if (playButton) {
      playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (event.script) {
          ScenarioPlayer.getInstance().play(event.script);
        }
      });
    }

    return item;
  }


  private getRelativeTimeString(eventDate: Date, currentDate: Date): string {
    const diff = eventDate.getTime() - currentDate.getTime();
    const days = Math.abs(diff) / (24 * 60 * 60 * 1000);
    const years = days / 365;

    if (days < 1) return '(today)';
    if (days < 30) return `(${Math.floor(days)} days ${diff > 0 ? 'ahead' : 'ago'})`;
    if (days < 365) return `(${Math.floor(days / 30)} months ${diff > 0 ? 'ahead' : 'ago'})`;
    return `(${Math.floor(years)} years ${diff > 0 ? 'ahead' : 'ago'})`;
  }

  private getEventColor(type: EventType): string {
    const colors = {
      [EventType.Launch]: '#4CAF50',
      [EventType.Landing]: '#2196F3',
      [EventType.Flyby]: '#FF9800',
      [EventType.Discovery]: '#9C27B0',
      [EventType.Collision]: '#F44336',
      [EventType.Milestone]: '#FFD700',
    };
    return colors[type] || '#666';
  }
}