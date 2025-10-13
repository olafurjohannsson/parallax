

export class TimeControls {
  private container: HTMLDivElement;
  private slider: HTMLInputElement;
  private dateDisplay: HTMLDivElement;
  private playButton: HTMLButtonElement;
  private speedControl: HTMLInputElement;
  
  private minDate: Date;
  private maxDate: Date;
  private currentDate: Date;
  private isPlaying: boolean = false;
  
  constructor(
    onDateChange: (date: Date) => void,
    onPlayToggle: (playing: boolean) => void,
    onSpeedChange: (speed: number) => void
  ) {
    this.minDate = new Date('1957-10-04'); // Sputnik 1
    this.maxDate = new Date('2030-01-01');
    this.currentDate = new Date();
    
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 80%;
      max-width: 1200px;
      background: rgba(0, 0, 0, 0.9);
      padding: 20px;
      border-radius: 12px;
      z-index: 1000;
    `;
    
    this.dateDisplay = document.createElement('div');
    this.dateDisplay.style.cssText = `
      color: white;
      font-size: 24px;
      text-align: center;
      margin-bottom: 12px;
      font-weight: 600;
    `;
    this.updateDateDisplay();
    
    this.slider = document.createElement('input');
    this.slider.type = 'range';
    this.slider.min = '0';
    this.slider.max = '1000';
    this.slider.value = this.dateToSliderValue(this.currentDate).toString();
    this.slider.style.cssText = `
      width: 100%;
      height: 8px;
      margin: 12px 0;
      cursor: pointer;
    `;
    
    this.slider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      this.currentDate = this.sliderValueToDate(value);
      this.updateDateDisplay();
      onDateChange(this.currentDate);
    });
    
    const controlsRow = document.createElement('div');
    controlsRow.style.cssText = `
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: center;
      margin-top: 12px;
    `;
    
    this.playButton = document.createElement('button');
    this.playButton.textContent = '▶ Play';
    this.playButton.style.cssText = `
      padding: 8px 20px;
      background: #667eea;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
    `;
    this.playButton.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.playButton.textContent = this.isPlaying ? '⏸ Pause' : '▶ Play';
      onPlayToggle(this.isPlaying);
    });
    
    const speedLabel = document.createElement('label');
    speedLabel.style.cssText = 'color: white; font-size: 14px;';
    speedLabel.textContent = 'Speed: ';
    
    this.speedControl = document.createElement('input');
    this.speedControl.type = 'range';
    this.speedControl.min = '1';
    this.speedControl.max = '365';
    this.speedControl.value = '30';
    this.speedControl.style.cssText = 'width: 150px;';
    
    const speedValue = document.createElement('span');
    speedValue.style.cssText = 'color: white; font-size: 14px; min-width: 80px;';
    speedValue.textContent = '30 days/sec';
    
    this.speedControl.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value);
      speedValue.textContent = `${value} days/sec`;
      onSpeedChange(value * 86400); 
    });
    
    controlsRow.appendChild(this.playButton);
    controlsRow.appendChild(speedLabel);
    controlsRow.appendChild(this.speedControl);
    controlsRow.appendChild(speedValue);
    
    this.container.appendChild(this.dateDisplay);
    this.container.appendChild(this.slider);
    this.container.appendChild(controlsRow);
    document.body.appendChild(this.container);
  }
  
  private dateToSliderValue(date: Date): number {
    const total = this.maxDate.getTime() - this.minDate.getTime();
    const current = date.getTime() - this.minDate.getTime();
    return Math.round((current / total) * 1000);
  }
  
  private sliderValueToDate(value: number): Date {
    const total = this.maxDate.getTime() - this.minDate.getTime();
    const offset = (value / 1000) * total;
    return new Date(this.minDate.getTime() + offset);
  }
  
  private updateDateDisplay() {
    this.dateDisplay.textContent = this.currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  setDate(date: Date) {
    this.currentDate = date;
    this.slider.value = this.dateToSliderValue(date).toString();
    this.updateDateDisplay();
  }
  
  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}