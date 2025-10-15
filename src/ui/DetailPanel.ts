import { RAGService, DocumentChunk } from '../core/RAGService';
import { EventBus } from '../core/EventBus';
import { StateManager } from '../core/StateManager';
import { planetDatabase } from '../data/planetInfo';
import { PlanetInfo } from '../data/planetInfo';
import { documentRegistry } from '../core/DocumentRegistry';

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

    if (this.currentDocumentId) {
      const searchForm = document.getElementById('rag-form') as HTMLFormElement;
      const searchInput = document.getElementById('rag-input') as HTMLInputElement;
      const searchButton = document.getElementById('rag-submit-btn') as HTMLButtonElement;

      // Initialize the RAG service for this specific document
      console.log('initializing ', this.currentDocumentId)
      let doc = documentRegistry[this.currentDocumentId];

      RAGService.getInstance().initialize(doc).then(() => {
        // Once initialized, enable the search bar
        searchInput.placeholder = `Ask about the ${info.name}...`;
        searchInput.disabled = false;
        searchButton.disabled = false;
      });

      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value;
        if (query) {
          this._handleSearch(query);
        }
      });
    }

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
    const searchInput = document.getElementById('rag-input') as HTMLInputElement;
    const searchButton = document.getElementById('rag-submit-btn') as HTMLButtonElement;

    if (!resultsContainer || !searchInput || !searchButton) return;

    // Disable the form and show a loading state
    searchInput.disabled = true;
    searchButton.disabled = true;
    resultsContainer.innerHTML = `<div class="rag-status">Searching knowledge base...</div>`;

    try {
      // 1. Find the most relevant chunks using the RAGService
      const chunks = await RAGService.getInstance().search(query);
      if (!chunks || chunks.length === 0) {
        resultsContainer.innerHTML = `<div class="rag-status">No relevant information found in the documents for that query.</div>`;
        return;
      }

      // 2. Create a context string from the text of the chunks for the summarizer
      const context = chunks
        .map(c => c.content.text?.text || c.content.image?.caption || '')
        .filter(Boolean)
        .join('\n\n');

      resultsContainer.innerHTML = `<div class="rag-status">Found relevant excerpts. Generating summary...</div>`;

      // 3. Get an AI-generated summary of the context
      const summary = await RAGService.getInstance().summarize(context);

      // 4. Render the final results
      let html = `<h4>AI Summary:</h4><p class="rag-summary">${summary}</p><h4>Relevant Excerpts:</h4>`;
      html += chunks.map(chunk => this._renderChunk(chunk)).join('');
      resultsContainer.innerHTML = html;

    } catch (error) {
      console.error('RAG search failed:', error);
      resultsContainer.innerHTML = `<div class="rag-status">An error occurred during the search. Please try again.</div>`;
    } finally {
      // Re-enable the form
      searchInput.disabled = false;
      searchButton.disabled = false;
    }
  }

  // [NEW] Method to render a single rich chunk
  private _renderChunk(chunk: DocumentChunk): string {
    let contentHtml = '';
    const cachePath = `/cache/${this.currentDocumentId}`;

    switch (chunk.content.type) {
      case 'text':
        contentHtml = chunk.content.text?.html || '[No text content]';
        break;
      case 'image':
        if (chunk.content.image?.image_path) {
          contentHtml = `<img src="${cachePath}/images/${chunk.content.image.image_path}" alt="${chunk.content.image.caption || 'Document Image'}" style="max-width: 100%; border-radius: 4px;"/>`;
        }
        if (chunk.content.image?.caption) {
          contentHtml += `<p><em>${chunk.content.image.caption}</em></p>`;
        }
        break;
      case 'table':
        contentHtml = chunk.content.table?.html || '[No table content]';
        break;
    }

    return `
      <div class="rag-chunk">
        ${contentHtml}
        <div class="rag-chunk-meta">
          Source: ${chunk.metadata.document_title || 'N/A'} (Page ${chunk.metadata.page_number})
        </div>
      </div>
    `;
  }

  // [MODIFIED] Update the HTML to include a proper form and styles
  private _createPanelHTML(info: PlanetInfo): string {
    const canSearch = !!this.currentDocumentId;
    const createStat = (label: string, value: string) => `
        <div>
            <div style="font-size: 12px; color: #8992bf; margin-bottom: 4px; text-transform: uppercase;">${label}</div>
            <div style="font-size: 16px; font-weight: 600;">${value}</div>
        </div>
    `;
    return `
      <style>
        #rag-form { display: flex; gap: 8px; margin-bottom: 16px; }
        #rag-input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid #444; color: white; padding: 8px; border-radius: 4px; }
        #rag-input:disabled { opacity: 0.5; }
        #rag-submit-btn { background: #667eea; border: none; color: white; padding: 8px 12px; border-radius: 4px; cursor: pointer; }
        #rag-submit-btn:disabled { background: #555; }
        .rag-status { color: #8992bf; font-style: italic; }
        .rag-summary { background: rgba(102, 126, 234, 0.1); padding: 12px; border-radius: 4px; line-height: 1.6; }
        .rag-chunk { border: 1px solid #333; border-radius: 4px; padding: 12px; margin-bottom: 12px; }
        .rag-chunk-meta { font-size: 11px; color: #777; margin-top: 8px; text-align: right; }
      </style>
      <div style="padding: 24px; overflow-y: auto; max-height: 90vh;">
        <button id="detail-panel-close" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; color: #fff; cursor: pointer; opacity: 0.7;">&times;</button>
        
        <div style="width: 100%; height: 180px; background: #000 url('/textures/${info.id}.jpg') center center / cover; border-radius: 8px; margin-bottom: 16px;"></div>

        <h2 style="margin: 0 0 12px 0; font-size: 28px; color: #667eea; font-weight: bold;">${info.name}</h2>
        <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cdd6f4;">
          ${info.description}.
        </p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
          ${createStat('Diameter', `${info.diameter.toLocaleString()} km`)}
          ${createStat('Mass', `${info.mass.toExponential(2)} Earths`)}
          ${createStat('Gravity', `${info.gravity} m/s²`)}
          ${createStat('Day Length', `${info.dayLength.toLocaleString()} hours`)}
          ${createStat('Year Length', `${info.yearLength.toLocaleString()} Earth days`)}
          ${createStat('Moons', `${info.moons}`)}
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
              <input type="text" id="rag-input" placeholder="Initializing AI..." disabled />
              <button type="submit" id="rag-submit-btn" disabled>Ask</button>
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