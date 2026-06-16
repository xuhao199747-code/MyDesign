class Ribbons {
  constructor(options = {}) {
    this.colors = options.colors || ['#5227FF'];
    this.baseSpring = options.baseSpring || 0.03;
    this.baseFriction = options.baseFriction || 0.9;
    this.baseThickness = options.baseThickness || 3;
    this.offsetFactor = options.offsetFactor || 0.02;
    this.maxAge = options.maxAge || 600;
    this.pointCount = options.pointCount || 50;
    this.speedMultiplier = options.speedMultiplier || 0.5;
    this.enableFade = options.enableFade !== undefined ? options.enableFade : true;
    this.enableShaderEffect = options.enableShaderEffect !== undefined ? options.enableShaderEffect : true;
    this.effectAmplitude = options.effectAmplitude || 2;
    
    this.ribbons = [];
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.lastMouseX = this.mouseX;
    this.lastMouseY = this.mouseY;
    this.animationId = null;
    this.time = 0;
    
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.id = 'ribbons-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9998;
    `;
    document.body.appendChild(this.canvas);
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    
    this.animate();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  onMouseMove(e) {
    this.lastMouseX = this.mouseX;
    this.lastMouseY = this.mouseY;
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    
    const dx = this.mouseX - this.lastMouseX;
    const dy = this.mouseY - this.lastMouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 5) {
      this.createRibbon();
    }
  }
  
  createRibbon() {
    const ribbon = {
      points: [],
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      offset: (Math.random() - 0.5) * 2 * this.offsetFactor * this.canvas.width
    };
    
    for (let i = 0; i < this.pointCount; i++) {
      ribbon.points.push({
        x: this.mouseX,
        y: this.mouseY,
        vx: 0,
        vy: 0,
        age: i * (this.maxAge / this.pointCount)
      });
    }
    
    this.ribbons.push(ribbon);
  }
  
  updateRibbon(ribbon) {
    const head = ribbon.points[0];
    head.x += (this.mouseX - head.x) * this.speedMultiplier;
    head.y += (this.mouseY - head.y) * this.speedMultiplier;
    
    for (let i = 1; i < ribbon.points.length; i++) {
      const point = ribbon.points[i];
      const prev = ribbon.points[i - 1];
      
      const dx = prev.x - point.x;
      const dy = prev.y - point.y;
      
      point.vx += dx * this.baseSpring;
      point.vy += dy * this.baseSpring;
      point.vx *= this.baseFriction;
      point.vy *= this.baseFriction;
      
      point.x += point.vx;
      point.y += point.vy;
      point.age += 1;
    }
  }
  
  drawRibbon(ribbon) {
    const points = ribbon.points.filter(p => p.age < this.maxAge);
    if (points.length < 2) return;
    
    this.ctx.beginPath();
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const progress = point.age / this.maxAge;
      const alpha = this.enableFade ? (1 - progress) : 1;
      const thickness = this.baseThickness * (1 - progress * 0.5);
      
      let offsetX = 0;
      let offsetY = 0;
      
      if (this.enableShaderEffect) {
        const wave = Math.sin(this.time * 0.01 + progress * 10) * this.effectAmplitude;
        const perpX = points[i + 1] ? points[i + 1].y - point.y : 0;
        const perpY = points[i + 1] ? point.x - points[i + 1].x : 0;
        const len = Math.sqrt(perpX * perpX + perpY * perpY);
        if (len > 0) {
          offsetX = (perpX / len) * wave;
          offsetY = (perpY / len) * wave;
        }
      }
      
      const x = point.x + offsetX + ribbon.offset * progress;
      const y = point.y + offsetY;
      
      this.ctx.globalAlpha = alpha;
      this.ctx.strokeStyle = ribbon.color;
      this.ctx.lineWidth = thickness;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        const prevPoint = points[i - 1];
        const prevProgress = prevPoint.age / this.maxAge;
        let prevOffsetX = 0;
        let prevOffsetY = 0;
        
        if (this.enableShaderEffect) {
          const prevWave = Math.sin(this.time * 0.01 + prevProgress * 10) * this.effectAmplitude;
          const prevPerpX = points[i] ? points[i].y - prevPoint.y : 0;
          const prevPerpY = points[i] ? prevPoint.x - points[i].x : 0;
          const prevLen = Math.sqrt(prevPerpX * prevPerpX + prevPerpY * prevPerpY);
          if (prevLen > 0) {
            prevOffsetX = (prevPerpX / prevLen) * prevWave;
            prevOffsetY = (prevPerpY / prevLen) * prevWave;
          }
        }
        
        const prevX = prevPoint.x + prevOffsetX + ribbon.offset * prevProgress;
        const prevY = prevPoint.y + prevOffsetY;
        
        const cpX = (prevX + x) / 2;
        const cpY = (prevY + y) / 2;
        
        this.ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
      }
    }
    
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.time++;
    
    this.ribbons = this.ribbons.filter(ribbon => {
      this.updateRibbon(ribbon);
      this.drawRibbon(ribbon);
      return ribbon.points[ribbon.points.length - 1].age < this.maxAge;
    });
    
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener('resize', () => this.resize());
    window.removeEventListener('mousemove', (e) => this.onMouseMove(e));
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reducedMotion) {
    new Ribbons({
      colors: ['#5227FF', '#7C3AED', '#A855F7', '#C084FC'],
      baseSpring: 0.03,
      baseFriction: 0.9,
      baseThickness: 3,
      maxAge: 600,
      pointCount: 50,
      speedMultiplier: 0.5,
      enableFade: true,
      enableShaderEffect: true,
      effectAmplitude: 2
    });
  }
});
