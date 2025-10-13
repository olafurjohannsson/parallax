export class SearchUI {
  private container: HTMLDivElement;
  private input: HTMLInputElement;
  private results: HTMLDivElement;
  
  constructor(onSearch: (query: string) => void) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      width: 600px;
    `;
    
    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.placeholder = 'Search solar system...';
    this.input.style.cssText = `
      width: 100%;
      padding: 12px 16px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      font-size: 16px;
    `;
    
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        onSearch(this.input.value);
      }
    });
    
    this.results = document.createElement('div');
    this.results.style.cssText = `
      margin-top: 10px;
      background: rgba(0, 0, 0, 0.9);
      border-radius: 8px;
      max-height: 400px;
      overflow-y: auto;
      display: none;
    `;
    
    this.container.appendChild(this.input);
    this.container.appendChild(this.results);
    document.body.appendChild(this.container);
  }
  
  showResults(results: Array<{id: string, name: string, score: number}>) {
    this.results.innerHTML = '';
    this.results.style.display = results.length > 0 ? 'block' : 'none';
    
    results.forEach(r => {
      const item = document.createElement('div');
      item.style.cssText = `
        padding: 12px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        cursor: pointer;
        color: white;
      `;
      item.innerHTML = `
        <strong>${r.name}</strong>
        <span style="float: right; opacity: 0.6;">${(r.score * 100).toFixed(0)}%</span>
      `;
      item.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: r.id }));
        this.results.style.display = 'none';
      });
      this.results.appendChild(item);
    });
  }
}