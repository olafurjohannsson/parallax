import { RAGService, DocumentChunk } from '../core/RAGService';
import { EventBus } from '../core/EventBus';
import { StateManager } from '../core/StateManager';
import { planetDatabase } from '../data/planetInfo';
import { PlanetInfo } from '../data/planetInfo';

export class DetailPanel {
  private container: HTMLDivElement;
  private stateManager: StateManager;
  private eventBus: EventBus;
  private currentDocumentId: string | null = null;

  constructor() {
    this.stateManager = StateManager.getInstance();
    this.eventBus = EventBus.getInstance();

    this.container = document.createElement('div');
    this.container.id = 'detail-panel';
    this._applyBaseStyles();
    document.body.appendChild(this.container);

    this._setupEventListeners();
  }

  private _applyBaseStyles() {
    this.container.style.cssText = `
      position: fixed;
      left: 20px;
      top: 400px;
      transform: none;
      width: 400px;
      max-height: 80vh;
      background: rgba(10, 15, 30, 0.7);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid rgba(200, 210, 255, 0.2);
      border-radius: 16px;
      z-index: 2000;
      color: #ffffff;
      font-family: 'Arial', sans-serif;
      overflow: hidden;
      display: none;
      opacity: 0;
      transition: opacity 0.4s ease, transform 0.4s ease;
      box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    `;
  }

  private _setupEventListeners() {
    this.eventBus.on('state:selectedBody', ({ newValue }) => {
      if (newValue) {
        this.show(newValue);
      } else {
        this.hide();
      }
    });
  }

  public show(bodyId: string, documentId?: string) {
    const info = planetDatabase[bodyId];
    if (!info) return;

    this.currentDocumentId = documentId || null;
    this.container.innerHTML = this._createPanelHTML(info);

    document.getElementById('detail-panel-close')?.addEventListener('click', () => {
      this.stateManager.selectBody(null);
    });
    const searchForm = document.getElementById('rag-form');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = (document.getElementById('rag-input') as HTMLInputElement);
        if (input.value) {
          this._handleSearch(input.value);
        }
      });
    }

    this.container.style.display = 'block';
    setTimeout(() => {
      this.container.style.opacity = '1';
      this.container.style.transform = 'translateY(-50%) scale(1)';
    }, 10);
  }

  public hide() {
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateY(-50%) scale(0.95)';

    setTimeout(() => {
      this.container.style.display = 'none';
      this.container.innerHTML = '';
    }, 400);
  }
  private async _handleSearch(query: string) {
    const resultsContainer = document.getElementById('rag-results');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `<div class="rag-status">Searching for answers...</div>`;

    try {
      // 1. Find the most relevant chunks
      const chunks = await RAGService.getInstance().search(query);
      if (!chunks || chunks.length === 0) {
        resultsContainer.innerHTML = `<div class="rag-status">No relevant information found in the documents.</div>`;
        return;
      }

      // 2. Create a context string from the text chunks for summarization
      const context = chunks
        .filter(c => c.content.type === 'text' && c.content.text)
        .map(c => c.content.text!.html.replace(/<[^>]+>/g, '')) // Strip HTML tags for the summarizer
        .join('\n\n');

      // 3. Get a summarized answer
      const summary = await RAGService.getInstance().summarize(context);

      // 4. Render the results
      let html = `<h4>AI Generated Summary:</h4><p>${summary}</p><h4>Relevant Document Excerpts:</h4>`;
      html += chunks.map(chunk => this._renderChunk(chunk)).join('');
      resultsContainer.innerHTML = html;

    } catch (error) {
      console.error('RAG search failed:', error);
      resultsContainer.innerHTML = `<div class="rag-status">An error occurred during the search.</div>`;
    }
  }

  private _renderChunk(chunk: DocumentChunk): string {
    let contentHtml = '';
    switch (chunk.content.type) {
      case 'text':
        contentHtml = chunk.content.text?.html || '';
        break;
      case 'image':
        // Assuming your images are in the /cache/images/ folder
        contentHtml = `<img src="/cache/images/${chunk.content.image?.image_path}" alt="${chunk.content.image?.caption}" style="max-width: 100%; border-radius: 4px;"/><p><em>${chunk.content.image?.caption}</em></p>`;
        break;
      case 'table':
        contentHtml = chunk.content.table?.html || '';
        break;
    }
    return `
      <div class="rag-chunk">
        ${contentHtml}
        <div class="rag-chunk-meta">Source: ${chunk.metadata.document_title} (Page ${chunk.metadata.page_number})</div>
      </div>
    `;
  }
  private _createPanelHTML(info: PlanetInfo): string {
    const canSearch = !!this.currentDocumentId;
    return `
      <div style="padding: 24px; overflow-y: auto; max-height: 80vh;">
        <button id="detail-panel-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; color: #fff; cursor: pointer; opacity: 0.7;">&times;</button>
        
        <div style="width: 100%; height: 180px; background: #000 url('/textures/${info.id}.jpg') center center / cover; border-radius: 8px; margin-bottom: 16px;"></div>

        <h2 style="margin: 0 0 12px 0; font-size: 28px; color: #667eea; font-weight: bold;">${info.name}</h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cdd6f4;">
          ${info.description}. Discovered by ${info.discoveredBy || 'N/A'} in ${info.discoveredDate || 'N/A'}. 
          It has an atmosphere composed primarily of ${info.atmosphere || 'N/A'}.
        </p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          ${this._createStat('Diameter', `${info.diameter.toLocaleString()} km`)}
          ${this._createStat('Mass', `${info.mass.toExponential(2)} Earths`)}
          ${this._createStat('Gravity', `${info.gravity} m/s²`)}
          ${this._createStat('Day Length', `${info.dayLength.toLocaleString()} hours`)}
          ${this._createStat('Year Length', `${info.yearLength.toLocaleString()} Earth days`)}
          ${this._createStat('Moons', `${info.moons}`)}
        </div>

        ${info.funFact ? `
          <div style="background: rgba(102, 126, 234, 0.1); padding: 12px; border-radius: 8px; font-style: italic; color: #a6b2f7;">
            💡 ${info.funFact}
          </div>
        ` : ''}

<div id="rag-section" style="margin-top: 24px; border-top: 1px solid rgba(200, 210, 255, 0.2); padding-top: 20px;">
          <h3 style="color: #667eea; margin: 0 0 12px 0;">Explore Further</h3>
          ${canSearch ? `
            <form id="rag-form">
              <input type="text" id="rag-input" placeholder="Ask about the ${this.currentDocumentId}..." />
              <button type="submit">Ask</button>
            </form>
            <div id="rag-results"></div>
          ` : `
            <p style="color: #8992bf; font-size: 14px;">No specific mission documents are linked to this object.</p>
          `}
        </div>
      </div>
    `;
  }

  private _createStat(label: string, value: string): string {
    return `
      <div>
        <div style="font-size: 12px; color: #8992bf; margin-bottom: 4px; text-transform: uppercase;">${label}</div>
        <div style="font-size: 16px; font-weight: 600;">${value}</div>
      </div>
    `;
  }
}