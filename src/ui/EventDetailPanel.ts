import { SpaceEvent, MediaImage } from './types';

export class EventDetailPanel {
  private container: HTMLDivElement;
  private onClose: () => void;
  private onNavigate: (bodyId: string) => void;
  private onSearchDocs: (query: string) => void;
  
  constructor(
    onClose: () => void,
    onNavigate: (bodyId: string) => void,
    onSearchDocs: (query: string) => void
  ) {
    this.onClose = onClose;
    this.onNavigate = onNavigate;
    this.onSearchDocs = onSearchDocs;
    
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      z-index: 10000;
      display: none;
      overflow-y: auto;
    `;
    document.body.appendChild(this.container);
  }
  
  show(event: SpaceEvent) {
    this.container.innerHTML = '';
    this.container.style.display = 'block';
    
    const content = document.createElement('div');
    content.style.cssText = `
      max-width: 1200px;
      margin: 40px auto;
      padding: 40px;
      background: linear-gradient(135deg, rgba(10, 10, 30, 0.98), rgba(20, 20, 40, 0.98));
      border-radius: 16px;
      border: 2px solid rgba(102, 126, 234, 0.4);
      position: relative;
    `;
    
    content.innerHTML = `
      <button id="close-event" style="
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
      ">✕ Close</button>
      
      <div style="margin-bottom: 30px;">
        <h1 style="
          color: white;
          font-size: 42px;
          margin: 0 0 10px 0;
          font-weight: 700;
        ">${event.title}</h1>
        <div style="
          color: #667eea;
          font-size: 18px;
          margin-bottom: 10px;
        ">${event.date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</div>
        <div style="color: #888; font-size: 16px;">
          Mission: ${event.mission || 'N/A'}
        </div>
      </div>
      
      <div style="
        color: white;
        font-size: 18px;
        line-height: 1.8;
        margin-bottom: 30px;
      ">${event.description}</div>
      
      ${event.crew ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">Crew</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
            ${event.crew.map(member => `
              <div style="
                background: rgba(102, 126, 234, 0.1);
                padding: 12px;
                border-radius: 6px;
                color: white;
              ">${member}</div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${event.significance ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">Significance</h3>
          <ul style="color: white; line-height: 1.8;">
            ${event.significance.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      
      ${event.media?.images ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">Images</h3>
          <div id="image-gallery" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          ">
            ${event.media.images.map((img, i) => `
              <div class="gallery-item" data-index="${i}" style="
                cursor: pointer;
                border-radius: 8px;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.3);
                transition: transform 0.2s;
              ">
                <img src="${img.thumbnail || img.url}" 
                     alt="${img.title}"
                     style="width: 100%; height: 250px; object-fit: cover;" />
                <div style="padding: 15px;">
                  <div style="color: white; font-weight: 600; margin-bottom: 5px;">
                    ${img.title}
                  </div>
                  ${img.description ? `
                    <div style="color: #aaa; font-size: 13px; line-height: 1.5;">
                      ${img.description}
                    </div>
                  ` : ''}
                  ${img.credit ? `
                    <div style="color: #667eea; font-size: 12px; margin-top: 8px;">
                      Credit: ${img.credit}
                    </div>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${event.media?.models3D ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #667eea; margin-bottom: 15px;">3D Models</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            ${event.media.models3D.map(model => `
              <a href="${model.url}" target="_blank" style="
                display: block;
                background: rgba(102, 126, 234, 0.1);
                padding: 20px;
                border-radius: 8px;
                text-decoration: none;
                color: white;
                border: 1px solid rgba(102, 126, 234, 0.3);
                transition: all 0.2s;
              ">
                <div style="font-weight: 600; margin-bottom: 5px;">
                  🎨 ${model.title}
                </div>
                <div style="color: #888; font-size: 13px;">
                  Download ${model.format.toUpperCase()} model
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <!-- Actions -->
      <div style="
        display: flex;
        gap: 15px;
        margin-top: 40px;
        padding-top: 30px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      ">
        <button id="goto-location" style="
          flex: 1;
          background: #667eea;
          color: white;
          padding: 15px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        ">🚀 Fly to Location</button>
        
        <button id="search-docs" style="
          flex: 1;
          background: rgba(102, 126, 234, 0.2);
          color: white;
          padding: 15px;
          border: 1px solid rgba(102, 126, 234, 0.5);
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        ">📄 View Mission Documents</button>
      </div>
    `;
    
    this.container.appendChild(content);
    
    // Event listeners
    document.getElementById('close-event')?.addEventListener('click', () => {
      this.hide();
      this.onClose();
    });
    
    document.getElementById('goto-location')?.addEventListener('click', () => {
      if (event.location) {
        this.hide();
        this.onNavigate(event.location.bodyId);
      }
    });
    
    document.getElementById('search-docs')?.addEventListener('click', () => {
      if (event.mission) {
        this.hide();
        this.onSearchDocs(event.mission);
      }
    });
    
    document.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt((item as HTMLElement).dataset.index || '0');
        if (event.media?.images) {
          this.showFullscreenImage(event.media.images[index]);
        }
      });
    });
  }
  
  private showFullscreenImage(image: MediaImage) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.98);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;
    
    overlay.innerHTML = `
      <img src="${image.url}" style="
        max-width: 90vw;
        max-height: 90vh;
        object-fit: contain;
      " />
    `;
    
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
  }
  
  hide() {
    this.container.style.display = 'none';
  }
  
  destroy() {
    this.container.remove();
  }
}