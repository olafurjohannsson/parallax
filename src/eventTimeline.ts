
import { SpaceEvent, EventType } from './types';
import { getEventsInRange } from './eventData';

export class EventTimeline {
  private container: HTMLDivElement;
  private eventsList: HTMLDivElement;
  
  constructor(
    onEventClick: (event: SpaceEvent) => void
  ) {
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
  }
  
  updateEvents(currentDate: Date, windowDays: number = 30) {
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
      .forEach(event => {
        const item = this.createEventItem(event, currentDate);
        this.eventsList.appendChild(item);
      });
  }
  
  private createEventItem(event: SpaceEvent, currentDate: Date): HTMLDivElement {
    const item = document.createElement('div');
    const isActive = Math.abs(event.date.getTime() - currentDate.getTime()) < 24 * 60 * 60 * 1000;
    
    item.style.cssText = `
      padding: 12px;
      margin-bottom: 8px;
      background: ${isActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
      border-left: 3px solid ${this.getEventColor(event.eventType)};
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(102, 126, 234, 0.4)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.background = isActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)';
    });
    
    const title = document.createElement('div');
    title.style.cssText = 'color: white; font-weight: 600; margin-bottom: 4px;';
    title.textContent = event.title;
    
    const date = document.createElement('div');
    date.style.cssText = 'color: #888; font-size: 12px; margin-bottom: 6px;';
    date.textContent = event.date.toLocaleDateString();
    
    const description = document.createElement('div');
    description.style.cssText = 'color: #ccc; font-size: 13px;';
    description.textContent = event.description;
    
    item.appendChild(title);
    item.appendChild(date);
    item.appendChild(description);
    
    return item;
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