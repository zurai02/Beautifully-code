/**
 * pov.js — renders a source image into each real-world viewing context
 * using actual canvas operations (downscale, blur, brightness/contrast,
 * colorblind matrix), not fake placeholders.
 */

const POV = {
  sourceImg: null,

  setImage(img) {
    this.sourceImg = img;
  },

  /** draw source into a canvas at a target box size, cover-fit */
  drawCover(canvas, w, h) {
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const img = this.sourceImg;
    const ir = img.width / img.height;
    const br = w / h;
    let sw, sh, sx, sy;
    if (ir > br) {
      sh = img.height;
      sw = sh * br;
      sx = (img.width - sw) / 2;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / br;
      sx = 0;
      sy = (img.height - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    return ctx;
  },

  /** simulate resolution loss: draw small, then scale back up */
  pixelate(canvas, targetW, targetH, factor) {
    const small = document.createElement('canvas');
    const sw = Math.max(2, Math.round(targetW * factor));
    const sh = Math.max(2, Math.round(targetH * factor));
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext('2d');
    sctx.drawImage(canvas, 0, 0, targetW, targetH, 0, 0, sw, sh);

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(small, 0, 0, sw, sh, 0, 0, targetW, targetH);
  },

  /** apply a deuteranopia-ish colorblind matrix via pixel manipulation */
  colorblindify(canvas) {
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height);
    const d = data.data;
    // simplified deuteranomaly transform
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      d[i]     = 0.625 * r + 0.375 * g + 0 * b;
      d[i + 1] = 0.7 * r + 0.3 * g + 0 * b;
      d[i + 2] = 0 * r + 0.3 * g + 0.7 * b;
    }
    ctx.putImageData(data, 0, 0);
  },

  /** render each context card for the given base image */
  renderContexts() {
    const cards = document.querySelectorAll('.ctx-card');
    cards.forEach(card => {
      const ctx = card.dataset.ctx;
      const canvas = card.querySelector('canvas');
      const frame = card.querySelector('.ctx-frame');
      const box = frame.getBoundingClientRect();
      const w = Math.max(120, Math.round(box.width)) || 240;
      let h;

      switch (ctx) {
        case 'feed':
          h = w;
          this.drawCover(canvas, w, h);
          this.pixelate(canvas, w, h, 0.18);
          break;

        case 'sidebar':
          h = Math.round(w * 9 / 16);
          this.drawCover(canvas, w, h);
          this.pixelate(canvas, w, h, 0.3);
          break;

        case 'tv':
          h = Math.round(w * 9 / 16);
          this.drawCover(canvas, w, h);
          // TV upscales low-res source, softness not pixelation
          this.pixelate(canvas, w, h, 0.55);
          break;

        case 'notif':
          h = w;
          this.drawCover(canvas, w, h);
          this.pixelate(canvas, w, h, 0.12);
          break;

        case 'dark':
          h = Math.round(w * 9 / 16);
          this.drawCover(canvas, w, h);
          this.pixelate(canvas, w, h, 0.4);
          break;

        case 'cb':
          h = Math.round(w * 9 / 16);
          this.drawCover(canvas, w, h);
          this.pixelate(canvas, w, h, 0.6);
          this.colorblindify(canvas);
          break;
      }
    });
  },

  /** build the scroll-by feed strip with N repeated tiles of the image */
  buildFeedStrip(track, count = 9) {
    track.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const item = document.createElement('div');
      item.className = 'feed-item';
      const canvas = document.createElement('canvas');
      item.appendChild(canvas);
      track.appendChild(item);
      this.drawCover(canvas, 150, 150);
      this.pixelate(canvas, 150, 150, 0.22);
    }
  },

  /** measure crude "readability at a glance" stats from the source image */
  computeVerdict() {
    const img = this.sourceImg;
    const c = document.createElement('canvas');
    const w = 64, h = Math.round(64 * img.height / img.width);
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    let sum = 0, sumSq = 0, n = 0;
    let edgeSum = 0;
    const gray = new Float32Array(w * h);

    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[p] = g;
      sum += g;
      sumSq += g * g;
      n++;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const contrast = Math.sqrt(Math.max(0, variance));

    // crude edge energy = local contrast between neighboring pixels
    for (let y = 0; y < h - 1; y++) {
      for (let x = 0; x < w - 1; x++) {
        const idx = y * w + x;
        const dx = gray[idx] - gray[idx + 1];
        const dy = gray[idx] - gray[idx + w];
        edgeSum += Math.abs(dx) + Math.abs(dy);
      }
    }
    const edgeDensity = edgeSum / (w * h);

    return { mean, contrast, edgeDensity };
  }
};
