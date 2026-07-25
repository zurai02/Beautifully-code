/**
 * app.js — wires up the UI. No fake AI calls: the POV lab does real
 * canvas image processing, the code bench does real js-beautify
 * formatting and real static checks.
 */

(function () {
  // ---------- Mode switching ----------
  const modeBtns = document.querySelectorAll('.mode-btn');
  const povMode = document.getElementById('pov-mode');
  const codeMode = document.getElementById('code-mode');

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const mode = btn.dataset.mode;
      povMode.classList.toggle('hidden', mode !== 'pov');
      codeMode.classList.toggle('hidden', mode !== 'code');
    });
  });

  // ---------- Toast ----------
  const toastEl = document.getElementById('toast');
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  // ================= THUMBNAIL POV LAB =================
  const dropzone = document.getElementById('dropzone');
  const dropzoneInner = document.getElementById('dropzoneInner');
  const fileInput = document.getElementById('fileInput');
  const lab = document.getElementById('lab');
  const feedTrack = document.getElementById('feedTrack');
  const scrollSpeed = document.getElementById('scrollSpeed');
  const speedReadout = document.getElementById('speedReadout');
  const replayBtn = document.getElementById('replayBtn');
  const resetBtn = document.getElementById('resetBtn');
  const verdictGrid = document.getElementById('verdictGrid');

  let feedAnimation = null;

  dropzoneInner.addEventListener('click', () => fileInput.click());
  ['dragover', 'dragenter'].forEach(evt =>
    dropzone.addEventListener(evt, e => {
      e.preventDefault();
      dropzoneInner.classList.add('drag');
    })
  );
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, e => {
      e.preventDefault();
      dropzoneInner.classList.remove('drag');
    })
  );
  dropzone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
  fileInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  });

  function handleFile(file) {
    if (!file.type.startsWith('image/')) {
      toast('That\'s not an image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        POV.setImage(img);
        lab.classList.remove('hidden');
        dropzone.classList.add('hidden');
        renderEverything();
        toast('Loaded. Rendering viewer contexts…');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function renderEverything() {
    // slight delay so layout has real widths for canvases
    requestAnimationFrame(() => {
      POV.renderContexts();
      POV.buildFeedStrip(feedTrack, 9);
      startScrollAnimation();
      renderVerdict();
    });
  }

  function speedLabel(v) {
    if (v < 20) return 'Barely moving';
    if (v < 45) return 'Casual scroll';
    if (v < 70) return 'Actively bored';
    if (v < 90) return 'Doomscrolling';
    return 'Thumb of fury';
  }

  scrollSpeed.addEventListener('input', () => {
    speedReadout.textContent = speedLabel(+scrollSpeed.value);
    if (POV.sourceImg) startScrollAnimation();
  });

  function startScrollAnimation() {
    if (feedAnimation) cancelAnimationFrame(feedAnimation);
    const track = feedTrack;
    const totalWidth = track.scrollWidth;
    const containerWidth = track.parentElement.clientWidth;
    const distance = totalWidth - containerWidth + containerWidth * 0.4;
    const speed = +scrollSpeed.value; // 0-100
    const pxPerSec = 40 + speed * 9; // slow -> fast
    let start = null;
    let pos = 0;

    function step(ts) {
      if (start === null) start = ts;
      const elapsed = (ts - start) / 1000;
      pos = Math.min(distance, elapsed * pxPerSec);
      track.style.transform = `translateX(${-pos}px)`;
      if (pos < distance) {
        feedAnimation = requestAnimationFrame(step);
      }
    }
    track.style.transform = 'translateX(0px)';
    feedAnimation = requestAnimationFrame(step);
  }

  replayBtn.addEventListener('click', () => {
    if (POV.sourceImg) startScrollAnimation();
  });

  resetBtn.addEventListener('click', () => {
    lab.classList.add('hidden');
    dropzone.classList.remove('hidden');
    fileInput.value = '';
  });

  function renderVerdict() {
    const { mean, contrast, edgeDensity } = POV.computeVerdict();

    const brightnessScore = mean < 60 ? 'bad' : mean < 100 ? 'warn' : 'good';
    const brightnessNote = mean < 60
      ? 'Dark overall — will vanish in dark mode and sidebars.'
      : mean < 100
        ? 'On the dim side. Fine on a bright screen, risky elsewhere.'
        : 'Bright enough to survive a dim, low-attention glance.';

    const contrastScore = contrast < 35 ? 'bad' : contrast < 55 ? 'warn' : 'good';
    const contrastNote = contrast < 35
      ? 'Flat tonal range — shapes will blur together at small sizes.'
      : contrast < 55
        ? 'Moderate contrast. Key elements may still soften at a glance.'
        : 'Strong contrast — should hold its shape even shrunk down.';

    const edgeScore = edgeDensity < 8 ? 'warn' : edgeDensity > 26 ? 'warn' : 'good';
    const edgeNote = edgeDensity < 8
      ? 'Very few strong edges — nothing anchors the eye at a glance.'
      : edgeDensity > 26
        ? 'Extremely busy — likely to read as noise once pixelated.'
        : 'A clear focal shape that should still register when tiny.';

    const items = [
      { label: 'Brightness', value: Math.round(mean) + ' / 255', note: brightnessNote, score: brightnessScore },
      { label: 'Contrast', value: contrast.toFixed(1), note: contrastNote, score: contrastScore },
      { label: 'Focal clarity', value: edgeDensity.toFixed(1), note: edgeNote, score: edgeScore },
    ];

    verdictGrid.innerHTML = items.map(it => `
      <div class="verdict-item ${it.score}">
        <div class="v-label">${it.label}</div>
        <div class="v-value">${it.value}</div>
        <div class="v-note">${it.note}</div>
      </div>
    `).join('');
  }

  // re-render context canvases on resize (debounced)
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (POV.sourceImg) POV.renderContexts();
    }, 200);
  });

  // ================= CODE BENCH =================
  const codeInput = document.getElementById('codeInput');
  const codeOutput = document.getElementById('codeOutput');
  const langSelect = document.getElementById('langSelect');
  const formatBtn = document.getElementById('formatBtn');
  const checkBtn = document.getElementById('checkBtn');
  const clearCodeBtn = document.getElementById('clearCodeBtn');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const checksPanel = document.getElementById('checksPanel');

  formatBtn.addEventListener('click', () => {
    const code = codeInput.value;
    if (!code.trim()) {
      toast('Paste some code first.');
      return;
    }
    const lang = langSelect.value;
    let formatted;
    try {
      if (lang === 'js' || lang === 'json') {
        formatted = window.js_beautify(code, { indent_size: 2 });
      } else if (lang === 'css') {
        formatted = window.css_beautify(code, { indent_size: 2 });
      } else if (lang === 'html') {
        formatted = window.html_beautify(code, { indent_size: 2 });
      }
      codeOutput.textContent = formatted;
      toast('Formatted.');
    } catch (err) {
      toast('Could not format — check for syntax errors.');
    }
  });

  checkBtn.addEventListener('click', () => {
    const code = codeInput.value;
    if (!code.trim()) {
      toast('Paste some code first.');
      return;
    }
    const results = runStaticChecks(code, langSelect.value);
    renderChecks(results);
    toast('Checks complete.');
  });

  function runStaticChecks(code, lang) {
    const results = [];
    const lines = code.split('\n');

    // bracket balance
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const stack = [];
    let mismatchLine = null;
    lines.forEach((line, idx) => {
      for (const ch of line) {
        if ('([{'.includes(ch)) stack.push({ ch, line: idx + 1 });
        if (')]}'.includes(ch)) {
          const last = stack.pop();
          if (!last || pairs[last.ch] !== ch) {
            mismatchLine = idx + 1;
          }
        }
      }
    });
    if (mismatchLine) {
      results.push({ level: 'bad', msg: `Unmatched bracket near line ${mismatchLine}.` });
    } else if (stack.length > 0) {
      results.push({ level: 'bad', msg: `Unclosed ${stack[0].ch} opened at line ${stack[0].line}.` });
    } else {
      results.push({ level: 'pass', msg: 'Brackets are balanced.' });
    }

    // long lines
    const longLines = lines.filter(l => l.length > 100).length;
    if (longLines > 0) {
      results.push({ level: 'warn', msg: `${longLines} line(s) over 100 characters — consider wrapping.` });
    } else {
      results.push({ level: 'pass', msg: 'No excessively long lines.' });
    }

    if (lang === 'js') {
      if (/\beval\s*\(/.test(code)) {
        results.push({ level: 'bad', msg: 'Uses eval() — arbitrary code execution risk.' });
      }
      if (/\.innerHTML\s*=/.test(code)) {
        results.push({ level: 'warn', msg: 'Assigns innerHTML directly — XSS risk if input is untrusted.' });
      }
      if (/console\.log/.test(code)) {
        const count = (code.match(/console\.log/g) || []).length;
        results.push({ level: 'warn', msg: `${count} console.log call(s) — remove before shipping.` });
      }
      const missingSemi = lines.filter(l => {
        const t = l.trim();
        return t && !t.endsWith('{') && !t.endsWith('}') && !t.endsWith(';') &&
               !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*') &&
               !/^(if|else|for|while|function|class|try|catch|finally)\b/.test(t);
      }).length;
      if (missingSemi > 0) {
        results.push({ level: 'warn', msg: `${missingSemi} line(s) may be missing a semicolon.` });
      }
    }

    if (lang === 'json') {
      try {
        JSON.parse(code);
        results.push({ level: 'pass', msg: 'Valid JSON.' });
      } catch (e) {
        results.push({ level: 'bad', msg: `Invalid JSON — ${e.message}` });
      }
    }

    return results;
  }

  function renderChecks(results) {
    checksPanel.innerHTML = results.map(r =>
      `<div class="check-item ${r.level}">${r.msg}</div>`
    ).join('');
  }

  clearCodeBtn.addEventListener('click', () => {
    codeInput.value = '';
    codeOutput.textContent = '// formatted code appears here';
    checksPanel.innerHTML = '<p class="muted-note">Run checks to see results here.</p>';
  });

  copyCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(codeOutput.textContent).then(() => toast('Copied.'));
  });
})();
