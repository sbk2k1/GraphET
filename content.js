class GraffitiTab {
  constructor() {
    this.isEnabled = false;
    this.canvas = null;
    this.ctx = null;
    this.toolbar = null;
    this.isDrawing = false;
    this.currentTool = 'pen';
    this.brushSize = 5;
    this.brushColor = '#ffffff';
    this.isMinimized = false;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.drawingHistory = [];
    this.maxHistoryLength = 50;
    this.historyPointer = -1;

    this.init();
  }

  init() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'enable') {
        this.enable();
        sendResponse({ enabled: true });
      } else if (message.action === 'disable') {
        this.disable();
        sendResponse({ enabled: false });
      } else if (message.action === 'getState') {
        sendResponse({ enabled: this.isEnabled });
      }
      return true; // Keep message channel open for async response
    });
  }

  enable() {
    if (this.isEnabled) return;

    this.isEnabled = true;
    this.createCanvas();
    this.createToolbar();
    this.addEventListeners();
  }

  disable() {
    if (!this.isEnabled) return;

    this.isEnabled = false;
    this.removeCanvas();
    this.removeToolbar();
    this.removeEventListeners();
  }

  restoreToolbarState(display, wasMinimized) {
    this.toolbar.style.display = display;
    if (wasMinimized && !this.isMinimized) {
      this.toggleMinimize();
    }
  }

  createCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'graffitiCanvas';
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.canvas.className = 'drawing-enabled';

    this.ctx = this.canvas.getContext('2d');
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.brushColor;
    this.ctx.lineWidth = this.brushSize;

    document.body.appendChild(this.canvas);
    this.saveState();
  }

  removeCanvas() {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
    this.drawingHistory = [];
    this.historyPointer = -1;
  }

  // createToolbar() {
  //   this.toolbar = document.createElement('div');
  //   this.toolbar.className = 'graffiti-toolbar';
  //   this.toolbar.innerHTML = `
  //     <button class="graffiti-minimize-btn" title="Minimize">−</button>
  //     <div class="graffiti-toolbar-header">🎨 GraffitiTab</div>
  //     <div class="graffiti-toolbar-content">
  //       <button class="graffiti-tool-btn active" data-tool="pen" title="Pen">✏️</button>
  //       <button class="graffiti-tool-btn" data-tool="eraser" title="Eraser"></button>
        
  //       <div class="graffiti-divider"></div>
        
  //       <input type="color" class="graffiti-color-picker" value="#ffffff" title="Color">
        
  //       <div class="graffiti-size-container">
  //         <div class="graffiti-size-label">Size: <span class="size-value">5</span>px</div>
  //         <input type="range" class="graffiti-size-slider" min="1" max="50" value="5">
  //       </div>
        
  //       <div class="graffiti-brush-preview">
  //         <div class="graffiti-brush-dot" style="width: 5px; height: 5px;"></div>
  //       </div>
        
  //       <div class="graffiti-divider"></div>
        
  //       <div class="graffiti-actions">
  //         <button class="graffiti-action-btn" id="undoBtn" title="Undo (Ctrl+Z)">↩️ Undo</button>
  //         <button class="graffiti-action-btn success" id="saveBtn">💾 Save PNG</button>
  //         <button class="graffiti-action-btn danger" id="clearBtn">🗑️ Clear All</button>
  //       </div>
  //     </div>
  //   `;

  //   document.body.appendChild(this.toolbar);
  //   this.addToolbarListeners();
  // }

  // Enhanced createToolbar method with premium styling
createToolbar() {
  this.toolbar = document.createElement('div');
  this.toolbar.className = 'graffiti-toolbar';
  this.toolbar.innerHTML = `
    <button class="graffiti-minimize-btn" title="Minimize">−</button>
    <div class="graffiti-toolbar-header">✨ GraffitiTab</div>
    <div class="graffiti-toolbar-content">
      <div style="display: flex; gap: 8px; align-items: center;">
        <button class="graffiti-tool-btn active" data-tool="pen" title="Pen Tool">✏️</button>
        <button class="graffiti-tool-btn" data-tool="eraser" title="Eraser Tool"></button>
      </div>
      
      <div class="graffiti-divider"></div>
      
      <input type="color" class="graffiti-color-picker" value="#ffffff" title="Choose Color">
      
      <div class="graffiti-size-container">
        <div class="graffiti-size-label">Size: <span class="size-value">5</span>px</div>
        <input type="range" class="graffiti-size-slider" min="1" max="50" value="5" title="Brush Size">
      </div>
      
      <div class="graffiti-brush-preview">
        <div class="graffiti-brush-dot" style="width: 5px; height: 5px;"></div>
      </div>
      
      <div class="graffiti-divider"></div>
      
      <div class="graffiti-actions">
        <button class="graffiti-action-btn" id="undoBtn" title="Undo Last Action (Ctrl+Z)">↶ Undo</button>
        <button class="graffiti-action-btn success" id="saveBtn" title="Save as PNG">💾 Save PNG</button>
        <button class="graffiti-action-btn danger" id="clearBtn" title="Clear All Drawings">🗑️ Clear All</button>
      </div>
    </div>
  `;

  document.body.appendChild(this.toolbar);
  this.addToolbarListeners();
  
  // Add premium entrance animation
  requestAnimationFrame(() => {
    this.toolbar.style.transform = 'translateY(-20px) scale(0.95)';
    this.toolbar.style.opacity = '0';
    
    setTimeout(() => {
      this.toolbar.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      this.toolbar.style.transform = 'translateY(0) scale(1)';
      this.toolbar.style.opacity = '1';
    }, 50);
  });
}

// Enhanced toggleMinimize with smoother animations
toggleMinimize() {
  this.isMinimized = !this.isMinimized;
  const minimizeBtn = this.toolbar.querySelector('.graffiti-minimize-btn');
  const content = this.toolbar.querySelector('.graffiti-toolbar-content');
  const header = this.toolbar.querySelector('.graffiti-toolbar-header');

  if (this.isMinimized) {
    // Minimize animation
    content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    header.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    content.style.opacity = '0';
    header.style.opacity = '0';
    content.style.transform = 'scale(0.8)';
    header.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      this.toolbar.classList.add('minimized');
      minimizeBtn.innerHTML = '✨';
      minimizeBtn.title = 'Expand Toolbar';

      // Hide content & header
      if (content) content.style.display = 'none';
      if (header) header.style.display = 'none';

      // Add elegant logo
      if (!this.logoEl) {
        this.logoEl = document.createElement('img');
        this.logoEl.src = chrome.runtime.getURL('icons/icon48.png');
        this.logoEl.style.cssText = `
          width: 32px;
          height: 32px;
          cursor: pointer;
          transition: all 0.3s ease;
          opacity: 0;
          transform: scale(0.5);
          border-radius: 6px;
        `;
        this.logoEl.title = 'Expand GraffitiTab';
        this.logoEl.addEventListener('click', () => this.toggleMinimize());
        this.toolbar.appendChild(this.logoEl);
        
        // Animate logo appearance
        setTimeout(() => {
          this.logoEl.style.opacity = '1';
          this.logoEl.style.transform = 'scale(1)';
        }, 100);
      }
    }, 300);
  } else {
    // Expand animation
    this.toolbar.classList.remove('minimized');
    minimizeBtn.innerHTML = '−';
    minimizeBtn.title = 'Minimize';

    // Remove logo with animation
    if (this.logoEl) {
      this.logoEl.style.transition = 'all 0.2s ease';
      this.logoEl.style.opacity = '0';
      this.logoEl.style.transform = 'scale(0.5)';
      
      setTimeout(() => {
        if (this.logoEl) {
          this.logoEl.remove();
          this.logoEl = null;
        }
      }, 200);
    }

    // Show content & header with animation
    setTimeout(() => {
      if (content) {
        content.style.display = '';
        content.style.opacity = '0';
        content.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          content.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          content.style.opacity = '1';
          content.style.transform = 'scale(1)';
        }, 50);
      }
      
      if (header) {
        header.style.display = '';
        header.style.opacity = '0';
        header.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
          header.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
          header.style.opacity = '1';
          header.style.transform = 'scale(1)';
        }, 100);
      }
    }, 150);
  }
}

// Enhanced updateBrushPreview with premium styling
updateBrushPreview() {
  const preview = this.toolbar.querySelector('.graffiti-brush-dot');
  if (preview) {
    const size = Math.min(this.brushSize, 24);
    preview.style.width = size + 'px';
    preview.style.height = size + 'px';
    preview.style.backgroundColor = this.brushColor;
    
    // Add subtle animation
    preview.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    preview.style.transform = 'scale(1.1)';
    
    setTimeout(() => {
      preview.style.transform = 'scale(1)';
    }, 150);
  }
}

// Enhanced updateCursor with premium cursor styling
updateCursor() {
  if (this.currentTool === 'pen') {
    this.canvas.style.cursor = 'crosshair';
  } else if (this.currentTool === 'eraser') {
    const size = Math.max(8, Math.min(this.brushSize + 4, 32));
    this.canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${(size - 4) / 2}" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/><circle cx="${size / 2}" cy="${size / 2}" r="${(size - 8) / 2}" fill="rgba(0,0,0,0.1)"/></svg>') ${size / 2} ${size / 2}, auto`;
  }
}

  removeToolbar() {
    if (this.toolbar) {
      this.toolbar.remove();
      this.toolbar = null;
    }
  }

  addToolbarListeners() {
    // Tool selection
    this.toolbar.querySelectorAll('.graffiti-tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.toolbar.querySelectorAll('.graffiti-tool-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentTool = btn.dataset.tool;
        this.updateCursor();
      });
    });

    // Color picker
    const colorPicker = this.toolbar.querySelector('.graffiti-color-picker');
    colorPicker.addEventListener('change', (e) => {
      this.brushColor = e.target.value;
      this.ctx.strokeStyle = this.brushColor;
      this.updateBrushPreview();
    });

    // Size slider
    const sizeSlider = this.toolbar.querySelector('.graffiti-size-slider');
    const sizeValue = this.toolbar.querySelector('.size-value');
    sizeSlider.addEventListener('input', (e) => {
      this.brushSize = parseInt(e.target.value);
      this.ctx.lineWidth = this.brushSize;
      sizeValue.textContent = this.brushSize;
      this.updateBrushPreview();
    });

    // Action buttons
    this.toolbar.querySelector('#saveBtn').addEventListener('click', () => this.saveDrawing());
    this.toolbar.querySelector('#clearBtn').addEventListener('click', () => this.clearCanvas());
    this.toolbar.querySelector('#undoBtn').addEventListener('click', () => this.undo());

    // Minimize/Maximize
    const minimizeBtn = this.toolbar.querySelector('.graffiti-minimize-btn');
    minimizeBtn.addEventListener('click', () => this.toggleMinimize());

    // Dragging functionality
    this.toolbar.addEventListener('mousedown', (e) => this.startDrag(e));
    document.addEventListener('mousemove', (e) => this.drag(e));
    document.addEventListener('mouseup', () => this.stopDrag());
  }

  updateBrushPreview() {
    const preview = this.toolbar.querySelector('.graffiti-brush-dot');
    if (preview) {
      preview.style.width = Math.min(this.brushSize, 30) + 'px';
      preview.style.height = Math.min(this.brushSize, 30) + 'px';
      preview.style.backgroundColor = this.brushColor;
    }
  }

  updateCursor() {
    if (this.currentTool === 'pen') {
      this.canvas.style.cursor = 'crosshair';
    } else if (this.currentTool === 'eraser') {
      this.canvas.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="${this.brushSize + 8}" height="${this.brushSize + 8}" viewBox="0 0 ${this.brushSize + 8} ${this.brushSize + 8}"><circle cx="${(this.brushSize + 8) / 2}" cy="${(this.brushSize + 8) / 2}" r="${this.brushSize / 2}" fill="none" stroke="black" stroke-width="2"/></svg>') ${(this.brushSize + 8) / 2} ${(this.brushSize + 8) / 2}, auto`;
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    const minimizeBtn = this.toolbar.querySelector('.graffiti-minimize-btn');
    const content = this.toolbar.querySelector('.graffiti-toolbar-content');
    const header = this.toolbar.querySelector('.graffiti-toolbar-header');

    if (this.isMinimized) {
      this.toolbar.classList.add('minimized');
      minimizeBtn.textContent = '+';
      minimizeBtn.title = 'Maximize';

      // Hide content & header
      if (content) content.style.display = 'none';
      if (header) header.style.display = 'none';

      // Add logo
      if (!this.logoEl) {
        this.logoEl = document.createElement('img');
        this.logoEl.src = chrome.runtime.getURL('icons/icon48.png');
        this.logoEl.style.width = '40px';
        this.logoEl.style.height = '40px';
        this.logoEl.style.cursor = 'pointer';
        this.logoEl.title = 'Open GraffitiTab';
        this.logoEl.addEventListener('click', () => this.toggleMinimize());
        this.toolbar.appendChild(this.logoEl);
      }
    } else {
      this.toolbar.classList.remove('minimized');
      minimizeBtn.textContent = '−';
      minimizeBtn.title = 'Minimize';

      // Restore content & header
      if (content) content.style.display = '';
      if (header) header.style.display = '';

      // Remove logo
      if (this.logoEl) {
        this.logoEl.remove();
        this.logoEl = null;
      }
    }
  }


  startDrag(e) {
    if (e.target.closest('.graffiti-tool-btn') ||
      e.target.closest('.graffiti-action-btn') ||
      e.target.closest('.graffiti-color-picker') ||
      e.target.closest('.graffiti-size-slider') ||
      e.target.closest('.graffiti-minimize-btn')) {
      return;
    }

    this.isDragging = true;
    this.toolbar.classList.add('dragging');

    // Store original position for boundary checking
    this.originalPosition = {
      left: parseInt(this.toolbar.style.left) || window.innerWidth - this.toolbar.offsetWidth - 20,
      top: parseInt(this.toolbar.style.top) || 20
    };

    const rect = this.toolbar.getBoundingClientRect();
    this.dragOffset.x = e.clientX - rect.left;
    this.dragOffset.y = e.clientY - rect.top;

    e.preventDefault();
  }

  drag(e) {
    if (!this.isDragging) return;

    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;

    // Keep toolbar within viewport with proper boundaries
    const maxX = window.innerWidth - this.toolbar.offsetWidth;
    const maxY = window.innerHeight - this.toolbar.offsetHeight;

    this.toolbar.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
    this.toolbar.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
    this.toolbar.style.right = 'auto';
  }


  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;
      this.toolbar.classList.remove('dragging');
    }
  }

  addEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e));
    this.canvas.addEventListener('touchmove', (e) => this.draw(e));
    this.canvas.addEventListener('touchend', () => this.stopDrawing());

    // Resize handler
    window.addEventListener('resize', () => this.handleResize());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
  }

  removeEventListeners() {
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', (e) => this.startDrawing(e));
      this.canvas.removeEventListener('mousemove', (e) => this.draw(e));
      this.canvas.removeEventListener('mouseup', () => this.stopDrawing());
      this.canvas.removeEventListener('mouseout', () => this.stopDrawing());
      this.canvas.removeEventListener('touchstart', (e) => this.startDrawing(e));
      this.canvas.removeEventListener('touchmove', (e) => this.draw(e));
      this.canvas.removeEventListener('touchend', () => this.stopDrawing());
    }

    document.removeEventListener('keydown', (e) => this.handleKeydown(e));
  }

  handleKeydown(e) {
    // Ctrl+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    }
  }

  getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  startDrawing(e) {
    e.preventDefault();
    this.isDrawing = true;

    const pos = this.getEventPos(e);
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);

    if (this.currentTool === 'eraser') {
      this.ctx.globalCompositeOperation = 'destination-out';
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
    }
  }

  draw(e) {
    if (!this.isDrawing) return;

    e.preventDefault();
    const pos = this.getEventPos(e);

    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
  }

  stopDrawing() {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.ctx.beginPath();
    this.saveState();
  }

  saveState() {
    // Remove any future states if we're not at the end of history
    if (this.historyPointer < this.drawingHistory.length - 1) {
      this.drawingHistory = this.drawingHistory.slice(0, this.historyPointer + 1);
    }

    // Save current canvas state
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.drawingHistory.push(imageData);

    // Limit history size
    if (this.drawingHistory.length > this.maxHistoryLength) {
      this.drawingHistory.shift();
    }

    this.historyPointer = this.drawingHistory.length - 1;

    // Update undo button state
    this.updateUndoButton();
  }

  undo() {
    if (this.historyPointer <= 0) return;

    this.historyPointer--;
    const imageData = this.drawingHistory[this.historyPointer];
    this.ctx.putImageData(imageData, 0, 0);

    this.updateUndoButton();
  }

  updateUndoButton() {
    const undoBtn = this.toolbar?.querySelector('#undoBtn');
    if (undoBtn) {
      undoBtn.disabled = this.historyPointer <= 0;
      undoBtn.style.opacity = this.historyPointer <= 0 ? '0.5' : '1';
    }
  }

  clearCanvas() {
    if (confirm('Are you sure you want to clear all drawings?')) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
    }
  }

 saveDrawing() {
  const toolbar = this.toolbar;
  const wasMinimized = this.isMinimized;
  const toolbarParent = toolbar.parentNode;
  
  // If minimized, expand first so we can hide it properly
  if (this.isMinimized) this.toggleMinimize();
  
  // Completely remove toolbar from DOM
  toolbar.remove();
  
  // Force a reflow to ensure the removal is applied
  document.body.offsetHeight;

  setTimeout(() => {
    chrome.runtime.sendMessage({action: 'captureVisibleTab'}, (dataUrl) => {
      // Re-add toolbar to DOM
      toolbarParent.appendChild(toolbar);
      
      // Restore minimized state if it was minimized before
      if (wasMinimized && !this.isMinimized) this.toggleMinimize();

      if (!dataUrl) {
        console.warn("captureVisibleTab failed, using drawings only");
        this.fallbackSave();
        return;
      }

      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = window.innerWidth;
        tempCanvas.height = window.innerHeight;
        const ctx = tempCanvas.getContext('2d');

        // Draw the background (webpage screenshot)
        ctx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the graffiti drawings on top
        ctx.drawImage(this.canvas, 0, 0);

        // Download the combined image
        const link = document.createElement('a');
        link.download = `graffiti-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      };
      img.onerror = () => this.fallbackSave();
      img.src = dataUrl;
    });
  }, 150); // Slightly longer timeout to ensure DOM updates
}


  fallbackSave() {
    // Fallback: just save the drawings with a transparent background
    const link = document.createElement('a');
    link.download = `graffiti-drawings-${new Date().getTime()}.png`;
    link.href = this.canvas.toDataURL('image/png');
    link.click();
  }

  handleResize() {
    if (!this.canvas) return;

    // Save current drawing
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

    // Resize canvas
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Restore drawing
    this.ctx.putImageData(imageData, 0, 0);

    // Reset context properties
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.strokeStyle = this.brushColor;
    this.ctx.lineWidth = this.brushSize;

    // Update history with resized canvas
    this.saveState();
  }
}

// Initialize GraffitiTab
try {
  // Check if we're already initialized to prevent duplicates
  if (!window.graffitiTabInstance) {
    window.graffitiTabInstance = new GraffitiTab();
    console.log('GraffitiTab initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize GraffitiTab:', error);
}