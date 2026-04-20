/**
 * ═══════════════════════════════════════════════════════════════
 *  SIMULADOR DE CULTIVO DE MICROALGAS
 *  script.js — Modular, organized by responsibility
 * ═══════════════════════════════════════════════════════════════
 */

(() => {
  'use strict';

  // ═══════════════════════════════════════════════════════
  // MODULE: CONFIG & CONSTANTS
  // ═══════════════════════════════════════════════════════
  const CONFIG = {
    MAX_PARTICLES: 160,
    BUBBLE_POOL: 65,
    SIM_REAL_SECONDS: 60,
    HARVEST_THRESHOLD: 60,
    FPS_TARGET: 60,
    OPTIMAL_RANGES: {
      ph: { optLo: 9, optHi: 10, warnLo: 7.5, warnHi: 11.5 },
      temp: { optLo: 28, optHi: 32, warnLo: 22, warnHi: 38 },
      luz: { optLo: 6000, optHi: 8000, warnLo: 2000, warnHi: 11000 },
      co2: { optLo: 1.5, optHi: 3, warnLo: 0.3, warnHi: 6 },
      bic: { optLo: 14, optHi: 19, warnLo: 8, warnHi: 23 },
      nit: { optLo: 2, optHi: 3.5, warnLo: 0.8, warnHi: 5.5 },
      foto: { optLo: 10, optHi: 14, warnLo: 7, warnHi: 20 },
      sal: { optLo: 10, optHi: 20, warnLo: 5, warnHi: 35 }
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: STATE
  // ═══════════════════════════════════════════════════════
  const state = {
    running: false,
    density: 0,
    days: 0,
    growthRate: 0,
    time: 0,
    lastTimestamp: 0,
    animFrameId: null,
    particles: [],
    bubbles: [],
    currentStep: 0,
    rcAnimTime: 0,
    rcAnimFrameId: null,
    activeCatES: 'all',
    activeCatEN: 'all',
    isDarkTheme: true,
    landingParticles: []
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: DOM REFERENCES
  // ═══════════════════════════════════════════════════════
  const DOM = {};

  function cacheDOMRefs() {
    DOM.landing = document.getElementById('landing');
    DOM.landingCanvas = document.getElementById('landing-canvas');
    DOM.btnStartSim = document.getElementById('btn-start-sim');
    DOM.app = document.getElementById('app');
    DOM.canvas = document.getElementById('bioreactor-canvas');
    DOM.ctx = DOM.canvas ? DOM.canvas.getContext('2d') : null;
    DOM.tabBar = document.getElementById('tab-bar');
    DOM.btnStart = document.getElementById('btn-start');
    DOM.btnHarvest = document.getElementById('btn-harvest');
    DOM.btnTheme = document.getElementById('btn-theme');
    DOM.btnReset = document.getElementById('btn-reset');
    DOM.sDensity = document.getElementById('s-density');
    DOM.sDays = document.getElementById('s-days');
    DOM.sRate = document.getElementById('s-rate');
    DOM.sSalinity = document.getElementById('s-salinity');
    DOM.sAlert = document.getElementById('s-alert');
    DOM.stepNav = document.getElementById('step-nav');
    DOM.stepContent = document.getElementById('step-content');
    DOM.rcProgress = document.getElementById('rc-progress');

    // Range inputs
    DOM.ranges = {
      ph: document.getElementById('r-ph'),
      temp: document.getElementById('r-temp'),
      luz: document.getElementById('r-luz'),
      co2: document.getElementById('r-co2'),
      bic: document.getElementById('r-bic'),
      nit: document.getElementById('r-nit'),
      foto: document.getElementById('r-foto'),
      sal: document.getElementById('r-sal')
    };

    // Value displays
    DOM.values = {
      ph: document.getElementById('v-ph'),
      temp: document.getElementById('v-temp'),
      luz: document.getElementById('v-luz'),
      co2: document.getElementById('v-co2'),
      bic: document.getElementById('v-bic'),
      nit: document.getElementById('v-nit'),
      foto: document.getElementById('v-foto'),
      sal: document.getElementById('v-sal')
    };

    // Glossary elements
    DOM.glosSearch = document.getElementById('glos-search');
    DOM.glosGrid = document.getElementById('glos-grid');
    DOM.glosFilterBar = document.getElementById('glos-filter-bar');
    DOM.glosENSearch = document.getElementById('glos-en-search');
    DOM.glosENGrid = document.getElementById('glos-en-grid');
    DOM.glosENFilterBar = document.getElementById('glos-en-filter-bar');
  }

  // ═══════════════════════════════════════════════════════
  // MODULE: SIMULATION (Mathematical logic)
  // ═══════════════════════════════════════════════════════
  const Simulation = {
    /** Score a single nutrient parameter with smooth penalty */
    nutrientScore(val, optLo, optHi, warnLo, warnHi) {
      if (val >= optLo && val <= optHi) return 1.0;
      if (val >= warnLo && val <= warnHi) {
        const d = val < optLo
          ? (optLo - val) / (optLo - warnLo)
          : (val - optHi) / (warnHi - optHi);
        return 1.0 - d * 0.7; // stronger penalty than before
      }
      return 0.08; // almost zero outside warning range
    },

    /** Get current parameter values from sliders */
    getValues() {
      return {
        ph: +DOM.ranges.ph.value,
        temp: +DOM.ranges.temp.value,
        luz: +DOM.ranges.luz.value,
        co2: +DOM.ranges.co2.value,
        bic: +DOM.ranges.bic.value,
        nit: +DOM.ranges.nit.value,
        foto: +DOM.ranges.foto.value,
        sal: +DOM.ranges.sal.value
      };
    },

    /** Calculate compound growth rate from all parameters */
    calcGrowthRate(v) {
      const ranges = CONFIG.OPTIMAL_RANGES;
      const s =
        this.nutrientScore(v.ph, ranges.ph.optLo, ranges.ph.optHi, ranges.ph.warnLo, ranges.ph.warnHi) *
        this.nutrientScore(v.temp, ranges.temp.optLo, ranges.temp.optHi, ranges.temp.warnLo, ranges.temp.warnHi) *
        this.nutrientScore(v.luz, ranges.luz.optLo, ranges.luz.optHi, ranges.luz.warnLo, ranges.luz.warnHi) *
        this.nutrientScore(v.co2, ranges.co2.optLo, ranges.co2.optHi, ranges.co2.warnLo, ranges.co2.warnHi) *
        this.nutrientScore(v.bic, ranges.bic.optLo, ranges.bic.optHi, ranges.bic.warnLo, ranges.bic.warnHi) *
        this.nutrientScore(v.nit, ranges.nit.optLo, ranges.nit.optHi, ranges.nit.warnLo, ranges.nit.warnHi) *
        this.nutrientScore(v.foto, ranges.foto.optLo, ranges.foto.optHi, ranges.foto.warnLo, ranges.foto.warnHi) *
        this.nutrientScore(v.sal, ranges.sal.optLo, ranges.sal.optHi, ranges.sal.warnLo, ranges.sal.warnHi);
      return Math.max(0.02, Math.min(1, s));
    },

    /** Get salinity status text */
    getSalinityStatus(sal) {
      if (sal >= 10 && sal <= 20) return 'Óptima';
      if (sal >= 5 && sal <= 35) return 'Aceptable';
      return 'Crítica';
    },

    /** Get biomass composition values based on density and growth rate */
    calcBiomass(density, growthRate) {
      const p = density / 100;
      const f = 0.5 + growthRate / 0.35 * 0.5;
      return {
        prot: Math.round(60 * f * p),
        aa: Math.round(8 * f * p),
        carb: Math.round(20 * f * p),
        lip: Math.round(9 * f * p),
        vit: Math.round(2 * f * p),
        pig: Math.round(2 * f * p),
        min: Math.round(1 * f * p)
      };
    },

    /** Generate alert messages from parameters */
    getAlerts(v) {
      const alerts = [];
      const r = CONFIG.OPTIMAL_RANGES;

      if (v.ph < r.ph.optLo || v.ph > r.ph.optHi) {
        if (v.ph < 8) alerts.push({ text: 'pH muy bajo → inhibición total de fotosíntesis', severity: 'danger' });
        else if (v.ph > 11) alerts.push({ text: 'pH tóxico → desnaturalización proteica', severity: 'danger' });
        else alerts.push({ text: 'pH fuera de rango óptimo (9–10)', severity: 'warn' });
      }

      if (v.temp < r.temp.optLo || v.temp > r.temp.optHi) {
        if (v.temp > 38) alerts.push({ text: 'Temperatura letal → muerte celular inminente', severity: 'danger' });
        else if (v.temp < 20) alerts.push({ text: 'Temperatura muy baja → metab. casi detenido', severity: 'danger' });
        else alerts.push({ text: 'Temperatura fuera de rango óptimo (28–32°C)', severity: 'warn' });
      }

      if (v.luz > 10000) alerts.push({ text: 'Exceso de luz → fotoinhibición activa', severity: 'danger' });
      else if (v.luz < r.luz.optLo || v.luz > r.luz.optHi) {
        alerts.push({ text: 'Luz fuera de rango óptimo (6000–8000 lux)', severity: 'warn' });
      }

      if (v.co2 > 5) alerts.push({ text: 'Exceso de CO₂ → acidificación del medio', severity: 'danger' });
      else if (v.co2 < r.co2.optLo || v.co2 > r.co2.optHi) {
        alerts.push({ text: 'CO₂ fuera de rango óptimo (1.5–3%)', severity: 'warn' });
      }

      if (v.bic < r.bic.optLo || v.bic > r.bic.optHi) {
        alerts.push({ text: 'Bicarbonato fuera de rango (14–19 g/L)', severity: 'warn' });
      }

      if (v.nit < 1) alerts.push({ text: 'Deficiencia de nitrógeno → estrés nitrogenado', severity: 'danger' });
      else if (v.nit < r.nit.optLo || v.nit > r.nit.optHi) {
        alerts.push({ text: 'Nitrato fuera de rango óptimo (2–3.5 g/L)', severity: 'warn' });
      }

      if (v.foto > 20) alerts.push({ text: 'Fotoperiodo excesivo → estrés lumínico', severity: 'warn' });
      else if (v.foto < r.foto.optLo || v.foto > r.foto.optHi) {
        alerts.push({ text: 'Fotoperiodo fuera de rango (10–14h)', severity: 'warn' });
      }

      if (v.sal < 5) alerts.push({ text: 'Baja salinidad → estrés osmótico (lisis celular)', severity: 'danger' });
      else if (v.sal > 35) alerts.push({ text: 'Alta salinidad → estrés hiperosmótico severo', severity: 'danger' });
      else if (v.sal < r.sal.optLo || v.sal > r.sal.optHi) {
        alerts.push({ text: 'Salinidad fuera de rango óptimo (10–20 g/L)', severity: 'warn' });
      }

      return alerts;
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: PARTICLES (Microalgae & bubbles)
  // ═══════════════════════════════════════════════════════
  const Particles = {
    init() {
      state.particles = [];
      for (let i = 0; i < CONFIG.MAX_PARTICLES; i++) {
        state.particles.push({
          x: Math.random(),
          y: Math.random(),
          vx: (Math.random() - 0.5) * 0.0006,
          vy: (Math.random() - 0.5) * 0.0006,
          r: 1.5 + Math.random() * 5,
          type: i % 3,
          phase: Math.random() * Math.PI * 2
        });
      }

      state.bubbles = [];
      for (let i = 0; i < CONFIG.BUBBLE_POOL; i++) {
        state.bubbles.push({
          x: Math.random(),
          progress: Math.random(),
          r: 1 + Math.random() * 3.5,
          speed: 0.12 + Math.random() * 0.28,
          wobble: Math.random() * Math.PI * 2,
          active: false
        });
      }
    },

    updateBubbles(dt) {
      const v = Simulation.getValues();
      const targetActive = Math.floor(4 + (v.co2 / 10) * 30 + (state.density / 100) * 20);
      let activeCount = state.bubbles.filter(b => b.active).length;

      for (let i = 0; i < state.bubbles.length && activeCount < targetActive; i++) {
        if (!state.bubbles[i].active) {
          const b = state.bubbles[i];
          b.active = true;
          b.progress = 0;
          b.x = 0.05 + Math.random() * 0.88;
          b.r = 1 + Math.random() * 3.2;
          b.speed = 0.10 + Math.random() * 0.30 + (state.growthRate * 0.15);
          b.wobble = Math.random() * Math.PI * 2;
          activeCount++;
        }
      }

      // Deactivate excess bubbles
      if (activeCount > targetActive) {
        let toDeactivate = activeCount - targetActive;
        for (let i = 0; i < state.bubbles.length && toDeactivate > 0; i++) {
          if (state.bubbles[i].active && state.bubbles[i].progress > 0.9) {
            state.bubbles[i].active = false;
            toDeactivate--;
          }
        }
      }

      state.bubbles.forEach(b => {
        if (!b.active) return;
        b.progress += b.speed * dt;
        if (b.progress >= 1) {
          b.progress = 0;
          b.x = 0.05 + Math.random() * 0.88;
          b.r = 1 + Math.random() * 3.2;
          b.speed = 0.10 + Math.random() * 0.30 + (state.growthRate * 0.15);
        }
      });
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: RENDERER (Canvas drawing)
  // ═══════════════════════════════════════════════════════
  const Renderer = {
    sizeCanvas(cv) {
      const W = cv.offsetWidth;
      const H = cv.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      if (cv.width !== W * dpr || cv.height !== H * dpr) {
        cv.width = W * dpr;
        cv.height = H * dpr;
        const ctx = cv.getContext('2d');
        ctx.scale(dpr, dpr);
      }
      return { w: W, h: H };
    },

    drawBioreactor() {
      if (!DOM.canvas || !DOM.ctx) return;
      const { w, h } = this.sizeCanvas(DOM.canvas);
      const ctx = DOM.ctx;
      const T = state.time;
      const v = Simulation.getValues();
      const gr = state.growthRate;
      const density = state.density;

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#040e07';
      ctx.fillRect(0, 0, w, h);

      // Liquid level
      const liquidTop = h * (1 - density / 100 * 0.90);
      const wallThick = 6;

      // Reactor walls
      ctx.fillStyle = 'rgba(93,202,165,0.18)';
      ctx.fillRect(0, liquidTop - 2, wallThick, h - liquidTop + 2);
      ctx.fillStyle = 'rgba(93,202,165,0.18)';
      ctx.fillRect(w - wallThick, liquidTop - 2, wallThick, h - liquidTop + 2);

      // Meniscus wave
      ctx.strokeStyle = 'rgba(93,202,165,0.55)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = liquidTop + Math.sin(T * 0.9 + x * 0.04) * 2.5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Liquid body — color changes dynamically based on conditions
      const salinityFactor = Simulation.nutrientScore(v.sal, 10, 20, 5, 35);
      const nutrientFactor = Simulation.nutrientScore(v.nit, 2, 3.5, 0.8, 5.5);
      const healthFactor = (gr + salinityFactor + nutrientFactor) / 3;

      // Green → yellow/brown based on health
      let algaeHue, algaeSat, algaeLit;
      if (healthFactor > 0.7) {
        // Healthy — bright green
        algaeHue = 135 + gr * 20;
        algaeSat = 35 + density * 0.55;
        algaeLit = 7 + density * 0.20;
      } else if (healthFactor > 0.4) {
        // Moderate — yellow-green
        algaeHue = 100 + healthFactor * 40;
        algaeSat = 25 + density * 0.35;
        algaeLit = 7 + density * 0.18;
      } else {
        // Poor — brownish yellow
        algaeHue = 60 + healthFactor * 50;
        algaeSat = 20 + density * 0.2;
        algaeLit = 6 + density * 0.12;
      }

      // Light intensity affects brightness
      const lightFactor = v.luz / 8000;
      algaeLit *= (0.7 + lightFactor * 0.3);

      ctx.fillStyle = `hsl(${algaeHue},${algaeSat}%,${algaeLit}%)`;
      ctx.fillRect(wallThick, liquidTop, w - wallThick * 2, h - liquidTop);

      // High density → darker overlay
      if (density > 60) {
        const darkOverlay = (density - 60) / 40 * 0.15;
        ctx.fillStyle = `rgba(0,20,0,${darkOverlay})`;
        ctx.fillRect(wallThick, liquidTop, w - wallThick * 2, h - liquidTop);
      }

      // Internal light reflections
      ctx.fillStyle = 'rgba(93,202,165,0.035)';
      for (let i = 0; i < 8; i++) {
        const y = liquidTop + Math.sin(T * 0.35 + i * 0.7) * 6 + i * (h - liquidTop) / 8;
        ctx.fillRect(wallThick, y, w - wallThick * 2, 1.5);
      }

      // Microalgae particles — speed depends on temperature
      const tempSpeed = 0.5 + (v.temp / 40) * 1.0;

      state.particles.forEach(p => {
        if (!state.running || density < 3) return;
        p.x += (p.vx + Math.sin(T * 0.25 + p.phase) * 0.00025) * tempSpeed;
        p.y += (p.vy + Math.cos(T * 0.18 + p.phase) * 0.00018) * tempSpeed;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        const px = wallThick + (p.x * (w - wallThick * 2));
        const py = liquidTop + (p.y * (h - liquidTop));
        if (py >= h - 2) return;

        // Only render proportional to density
        if (p.r * 20 > density && p.type > 0) return;

        const alpha = Math.min(1, density / 25) * (0.45 + gr * 0.55);
        ctx.globalAlpha = alpha;
        ctx.beginPath();

        // Color depends on health
        let cols;
        if (healthFactor > 0.7) {
          cols = ['#1D9E75', '#0F6E56', '#5DCAA5'];
        } else if (healthFactor > 0.4) {
          cols = ['#7a9e1d', '#5a7315', '#a5ca5d'];
        } else {
          cols = ['#9e7a1d', '#735a15', '#caaa5d'];
        }
        ctx.fillStyle = cols[p.type];

        if (p.type === 0) ctx.ellipse(px, py, p.r, p.r * 0.5, T * 0.18 + p.phase, 0, Math.PI * 2);
        else if (p.type === 1) ctx.arc(px, py, p.r * 0.65, 0, Math.PI * 2);
        else ctx.ellipse(px, py, p.r * 0.45, p.r, T * 0.12 + p.phase, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Bubbles — quantity depends on CO₂
      state.bubbles.forEach(b => {
        if (!b.active || density < 2) return;
        const bx = wallThick + (b.x * (w - wallThick * 2)) + Math.sin(T * 1.1 + b.wobble + b.progress * 8) * 3;
        const by = h - (b.progress * (h - liquidTop)) - 4;
        if (by < liquidTop + 2 || by > h - 2) return;

        const surfaceAlpha = 0.25 + b.progress * 0.45;
        const bubbleR = b.r * (0.7 + b.progress * 0.5);

        ctx.beginPath(); ctx.arc(bx, by, bubbleR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,245,230,${(surfaceAlpha * 0.35).toFixed(2)})`; ctx.fill();
        ctx.strokeStyle = `rgba(159,225,203,${(surfaceAlpha * 0.8).toFixed(2)})`; ctx.lineWidth = 0.8; ctx.stroke();
        ctx.beginPath(); ctx.arc(bx - bubbleR * 0.28, by - bubbleR * 0.28, bubbleR * 0.28, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(surfaceAlpha * 0.55).toFixed(2)})`; ctx.fill();
      });

      // Diffuser at bottom
      if (state.running && density > 1) {
        const dw = w * 0.6, dx = (w - dw) / 2, dy = h - 8;
        ctx.strokeStyle = 'rgba(93,202,165,0.35)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + dw, dy); ctx.stroke();
        for (let i = 0; i < 7; i++) {
          const ddx = dx + dw * (i / 6);
          const pulse = 0.4 + 0.4 * Math.sin(T * 3 + i * 0.8);
          ctx.fillStyle = `rgba(93,202,165,${pulse.toFixed(2)})`;
          ctx.beginPath(); ctx.arc(ddx, dy, 2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // CO₂ inlet (left)
      if (state.running) {
        const co2pulse = 0.55 + 0.45 * Math.sin(T * 2.2);
        ctx.strokeStyle = `rgba(133,183,235,${(co2pulse * 0.7).toFixed(2)})`; ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(0, h * 0.35); ctx.lineTo(wallThick + 4, h * 0.35); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = `rgba(133,183,235,${(co2pulse * 0.85).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(wallThick + 8, h * 0.35, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(133,183,235,.65)'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('CO₂', wallThick + 14, h * 0.35 + 4);
      }

      // LEDs (right) — brightness depends on light parameter
      const ledBrightness = Math.min(1, v.luz / 8000);
      const ledH = Math.min(h * 0.72, 210);
      const ledCount = 7;
      for (let i = 0; i < ledCount; i++) {
        const lx = w - wallThick - 1, ly = h * 0.10 + i * (ledH / ledCount);
        const pulse = (0.65 + 0.35 * Math.sin(T * 1.4 + i * 0.6)) * ledBrightness;
        ctx.fillStyle = `rgba(168,255,120,${(pulse * 0.95).toFixed(2)})`;
        ctx.fillRect(lx - 3, ly, 3, ledH / ledCount * 0.55);
        ctx.fillStyle = `rgba(168,255,120,${(pulse * 0.07).toFixed(2)})`;
        ctx.fillRect(lx - 20, ly - 1, 17, ledH / ledCount * 0.55 + 2);
      }
      ctx.fillStyle = `rgba(168,255,120,${(0.55 * ledBrightness).toFixed(2)})`; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'right';
      ctx.fillText('LED', w - wallThick - 5, h * 0.10 + ledH + 12);

      // Growth rate bar (right edge)
      if (state.running && density > 0) {
        const barH = h * 0.5, barX = w - 3, barY = h * 0.22;
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(barX - 2, barY, 4, barH);
        const fillH = barH * gr;
        const barCol = gr > 0.75 ? '#1D9E75' : gr > 0.45 ? '#EF9F27' : '#E24B4A';
        ctx.fillStyle = barCol; ctx.fillRect(barX - 2, barY + barH - fillH, 4, fillH);
      }

      // Top status bar
      const statuses = ['Esperando inicio', 'Inoculando...', 'Inicio de crecimiento', 'Fase exponencial', 'Cultivo denso', 'Listo para cosechar'];
      const si = state.running ? Math.min(5, Math.floor(density / 20)) : 0;
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(0, 0, w, 28, 0); ctx.fill();
      const topCol = density > 70 ? '#9FE1CB' : density > 40 ? '#FAC775' : '#85B7EB';
      ctx.fillStyle = topCol; ctx.font = '500 11px Inter, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${statuses[si]} · Crecimiento: ${Math.round(gr * 100)}% · Día ${state.days.toFixed(1)}`, w / 2, 18);

      // Bottom parameter bar
      if (density > 0) {
        ctx.fillStyle = 'rgba(0,0,0,.40)'; ctx.fillRect(0, h - 22, w, 22);
        ctx.fillStyle = '#5DCAA5'; ctx.font = '10px Inter, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText(`pH ${v.ph.toFixed(1)}  |  ${v.temp}°C  |  ${Math.round(v.luz / 1000)}k lux  |  CO₂ ${v.co2.toFixed(1)}%  |  Sal ${v.sal}g/L  |  Crec: ${Math.round(gr * 100)}%`, 8, h - 8);
      }
    },

    // Recolección step animations
    drawStepAnim(ctx, w, h, type) {
      const t = state.rcAnimTime;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#040e07'; ctx.fillRect(0, 0, w, h);

      if (type === 'monitor') {
        const cx = w / 2, cy = h / 2;
        ctx.strokeStyle = 'rgba(29,158,117,.5)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(cx - 45, 10, 90, h - 20, 8); ctx.stroke();
        ctx.fillStyle = `hsl(145,60%,${8 + 10 * Math.sin(t * 0.5 + 1)}%)`;
        ctx.fillRect(cx - 43, 30, 86, h - 40);
        for (let i = 0; i < 18; i++) {
          const px = cx - 38 + ((i * 37 + t * 20) % 76);
          const py = 35 + ((i * 19 + t * 15) % (h * 0.55));
          ctx.globalAlpha = 0.7; ctx.fillStyle = '#1D9E75';
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        const doVal = 0.5 + 0.4 * Math.sin(t * 0.3);
        ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(cx + 52, 20, w - cx - 60, h - 40);
        ctx.fillStyle = 'rgba(29,158,117,.2)'; ctx.fillRect(cx + 54, 22, w - cx - 64, (h - 44) * (1 - doVal));
        ctx.fillStyle = 'rgba(29,158,117,.8)'; ctx.fillRect(cx + 54, 22 + (h - 44) * (1 - doVal), w - cx - 64, (h - 44) * doVal);
        ctx.fillStyle = '#9FE1CB'; ctx.font = '9px Inter, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('DO', cx + 60 + (w - cx - 64) / 2, h - 10);
        ctx.fillText((doVal * 2).toFixed(2), cx + 60 + (w - cx - 64) / 2, h - 22);
      }

      else if (type === 'filtro') {
        const mY = h * 0.45;
        ctx.fillStyle = 'rgba(29,158,117,.35)'; ctx.fillRect(20, 10, w - 40, mY - 10);
        ctx.strokeStyle = 'rgba(93,202,165,.7)'; ctx.lineWidth = 0.8;
        for (let i = 0; i < (w - 40) / 6; i++) { ctx.beginPath(); ctx.moveTo(20 + i * 6, mY - 2); ctx.lineTo(20 + i * 6, mY + 4); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(20, mY); ctx.lineTo(w - 20, mY); ctx.strokeStyle = '#5DCAA5'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = 'rgba(29,158,117,.08)'; ctx.fillRect(20, mY, w - 40, h - mY - 10);
        for (let i = 0; i < 8; i++) {
          const bx = 25 + i * (w - 50) / 8; const by = mY + ((t * 60 + i * 20) % (h - mY - 10));
          ctx.fillStyle = 'rgba(93,202,165,.5)'; ctx.beginPath(); ctx.arc(bx, by, 2, 0, Math.PI * 2); ctx.fill();
        }
        for (let i = 0; i < 14; i++) { const px = 25 + i * (w - 50) / 14; ctx.fillStyle = '#1D9E75'; ctx.beginPath(); ctx.arc(px, mY - 8, 3, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#9FE1CB'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('malla 50–100 µm', w / 2, mY + 14); ctx.fillText('biomasa retenida', w / 2, mY - 16);
      }

      else if (type === 'lavado') {
        const bY = h * 0.55;
        ctx.fillStyle = 'rgba(29,158,117,.3)'; ctx.fillRect(w / 2 - 40, bY, 80, h - bY - 10);
        for (let i = 0; i < 6; i++) {
          const dx = w / 2 - 25 + i * 10; const dy = (t * 80 + i * 22) % (bY - 10);
          ctx.fillStyle = `rgba(133,183,235,${0.6 * (dy / (bY - 10))})`;
          ctx.beginPath(); ctx.arc(dx, dy + 5, 2.5, 0, Math.PI * 2); ctx.fill();
        }
        for (let i = 0; i < 3; i++) {
          const wy = bY + 6 + i * 8; const amp = 3 * Math.sin(t * 3 + i);
          ctx.beginPath(); ctx.moveTo(w / 2 - 38, wy);
          for (let xi = 0; xi < 80; xi += 4) ctx.lineTo(w / 2 - 38 + xi, wy + amp * Math.sin(xi / 8 + t * 4));
          ctx.strokeStyle = 'rgba(93,202,165,.3)'; ctx.lineWidth = 1; ctx.stroke();
        }
        ctx.fillStyle = '#85B7EB'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('H₂O destilada', w / 2, h - 12); ctx.fillText('× 2–3 lavados', w / 2, 20);
      }

      else if (type === 'secado') {
        const mid = w / 2;
        ctx.fillStyle = 'rgba(29,158,117,.15)'; ctx.fillRect(10, 20, mid - 15, h - 30);
        ctx.strokeStyle = 'rgba(29,158,117,.4)'; ctx.lineWidth = .8; ctx.strokeRect(10, 20, mid - 15, h - 30);
        for (let i = 0; i < 10; i++) {
          const px = 15 + ((i * 23 + t * 15) % (mid - 25)); const py = 30 + ((i * 17 + t * 12) % (h - 50));
          ctx.fillStyle = '#1D9E75'; ctx.globalAlpha = .7; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#9FE1CB'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Fresco', mid / 2 + 5, h - 10); ctx.fillText('4°C · 15 días', mid / 2 + 5, h);
        const pulse = 0.7 + 0.3 * Math.sin(t * 2);
        ctx.fillStyle = `rgba(239,159,39,${pulse * .2})`; ctx.fillRect(mid + 5, 20, mid - 15, h - 30);
        ctx.strokeStyle = `rgba(239,159,39,${pulse * .6})`; ctx.lineWidth = .8; ctx.strokeRect(mid + 5, 20, mid - 15, h - 30);
        for (let i = 0; i < 12; i++) {
          const px = mid + 10 + ((i * 18 + t * 8) % (mid - 20)); const py = 25 + ((i * 13 + t * 5) % (h - 40));
          ctx.fillStyle = '#EF9F27'; ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FAC775'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Seco (40°C)', mid + mid / 2, h - 10); ctx.fillText('6 meses', mid + mid / 2, h);
      }

      else if (type === 'formula') {
        const cx = w / 2, cy = h / 2;
        ctx.strokeStyle = 'rgba(29,158,117,.5)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(25, 20); ctx.lineTo(20, h - 15); ctx.lineTo(55, h - 15); ctx.lineTo(50, 20); ctx.stroke();
        const lvl1 = h - 15 - (h - 35) * 0.2;
        ctx.fillStyle = 'rgba(29,158,117,.6)'; ctx.fillRect(21, lvl1, 33, h - 15 - lvl1);
        ctx.fillStyle = '#9FE1CB'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Extracto', 37, h - 4); ctx.fillText('20%', 37, lvl1 - 4);
        const ax = 65 + 5 * Math.sin(t * 3);
        ctx.fillStyle = 'rgba(93,202,165,.7)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('+', ax, cy + 5);
        ctx.strokeStyle = 'rgba(133,183,235,.5)';
        ctx.beginPath(); ctx.moveTo(w - 50, 20); ctx.lineTo(w - 55, h - 15); ctx.lineTo(w - 20, h - 15); ctx.lineTo(w - 25, 20); ctx.stroke();
        const lvl2 = h - 15 - (h - 35) * 0.8;
        ctx.fillStyle = 'rgba(133,183,235,.5)'; ctx.fillRect(w - 54, lvl2, 33, h - 15 - lvl2);
        ctx.fillStyle = '#85B7EB'; ctx.font = '8px sans-serif';
        ctx.fillText('Agua', w - 37, h - 4); ctx.fillText('80%', w - 37, lvl2 - 4);
        const pulse = 0.8 + 0.2 * Math.sin(t * 2);
        ctx.fillStyle = `rgba(29,158,117,${pulse * .3})`;
        ctx.beginPath(); ctx.arc(cx, cy - 5, 20, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(29,158,117,.8)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy - 5, 20, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#9FE1CB'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('pH', cx, cy - 8); ctx.fillText('6.5–7.0', cx, cy + 4);
        ctx.fillText('Biofertilizante', cx, h - 4);
      }

      else if (type === 'conserva') {
        const fx = w / 2 - 20, fy = 15, fw = 40, fh = h - 30;
        ctx.fillStyle = '#1a1000'; ctx.fillRect(fx, fy, fw, fh);
        ctx.strokeStyle = 'rgba(93,202,165,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(fx, fy, fw, fh);
        ctx.fillStyle = 'rgba(93,202,165,.3)'; ctx.fillRect(fx - 4, fy - 8, fw + 8, 10);
        ctx.strokeStyle = 'rgba(93,202,165,.5)'; ctx.strokeRect(fx - 4, fy - 8, fw + 8, 10);
        const liquidH = (fh - 10) * 0.7;
        ctx.fillStyle = 'rgba(29,158,117,.4)'; ctx.fillRect(fx + 2, fy + fh - liquidH - 2, fw - 4, liquidH);
        for (let i = 0; i < 8; i++) {
          const px = fx + 5 + ((i * 11) % (fw - 10)); const py = fy + fh - liquidH + ((i * 9 + t * 3) % (liquidH - 4));
          ctx.fillStyle = '#1D9E75'; ctx.globalAlpha = .6; ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        const tx = fx + fw + 15;
        ctx.fillStyle = 'rgba(133,183,235,.2)'; ctx.fillRect(tx, 20, 12, h - 35);
        ctx.strokeStyle = 'rgba(133,183,235,.5)'; ctx.lineWidth = .8; ctx.strokeRect(tx, 20, 12, h - 35);
        ctx.fillStyle = 'rgba(133,183,235,.8)';
        const thermo = (h - 50) * 0.15;
        ctx.fillRect(tx + 2, 20 + h - 50 - thermo - 2, 8, thermo);
        ctx.fillStyle = '#85B7EB'; ctx.font = '8px sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('4°C', tx + 16, h / 2 + 4);
        ctx.fillStyle = '#9FE1CB'; ctx.textAlign = 'center';
        ctx.fillText('Ámbar', w / 2, h - 4); ctx.fillText('No congelar', w / 2, 14);
      }
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: UI (Interface & events)
  // ═══════════════════════════════════════════════════════
  const UI = {
    updateSliderValue(key, decimals) {
      const val = parseFloat(DOM.ranges[key].value).toFixed(decimals);
      const el = DOM.values[key];
      el.textContent = val;

      // Visual feedback flash
      el.classList.add('changed');
      setTimeout(() => el.classList.remove('changed'), 400);
    },

    setBio(key, barWidth, displayVal) {
      const bar = document.getElementById('bp-' + key);
      const val = document.getElementById('bv-' + key);
      if (bar) bar.style.width = Math.min(100, barWidth) + '%';
      if (val) val.textContent = displayVal + '%';
    },

    updateBiomass() {
      const bio = Simulation.calcBiomass(state.density, state.growthRate);
      this.setBio('prot', bio.prot, bio.prot);
      this.setBio('aa', bio.aa * 10, bio.aa);
      this.setBio('carb', bio.carb, bio.carb);
      this.setBio('lip', bio.lip * 8, bio.lip);
      this.setBio('vit', bio.vit * 40, bio.vit);
      this.setBio('pig', bio.pig * 40, bio.pig);
      this.setBio('min', bio.min * 80, bio.min);
    },

    updateAlert() {
      const v = Simulation.getValues();
      const gr = state.growthRate;
      const alerts = Simulation.getAlerts(v);
      const el = DOM.sAlert;

      if (alerts.length === 0) {
        el.className = 'alert-box alert-info';
        el.innerHTML = '✅ <strong>Condiciones óptimas</strong> — crecimiento máximo activo.';
      } else {
        const hasDanger = alerts.some(a => a.severity === 'danger');
        if (hasDanger) {
          el.className = 'alert-box alert-danger';
          el.innerHTML = '🔴 <strong>Crecimiento crítico (' + Math.round(gr * 100) + '%)</strong>: ' +
            alerts.filter(a => a.severity === 'danger').map(a => a.text).join(' · ');
        } else {
          el.className = 'alert-box alert-warn';
          el.innerHTML = '⚠️ <strong>Crecimiento moderado</strong>: ' +
            alerts.slice(0, 3).map(a => a.text).join(' · ');
        }
      }

      // Salinity status
      DOM.sSalinity.textContent = Simulation.getSalinityStatus(v.sal);
    },

    updateStats() {
      DOM.sDensity.textContent = Math.round(state.density) + '%';
      DOM.sDays.textContent = state.days.toFixed(1);
      DOM.sRate.textContent = Math.round(state.growthRate * 100) + '%';
    },

    showTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('tab-' + tabId).classList.add('active');

      const btn = DOM.tabBar.querySelector(`[data-tab="${tabId}"]`);
      if (btn) btn.classList.add('active');

      if (tabId === 'recoleccion') Recoleccion.renderStep(state.currentStep);
      if (tabId === 'glosario') Glossary.renderES();
      if (tabId === 'glosario-en') Glossary.renderEN();
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: RECOLECCIÓN (Collection process steps)
  // ═══════════════════════════════════════════════════════
  const Recoleccion = {
    steps: [
      {
        num: 1, title: 'Monitoreo del cultivo', subtitle: 'Verificación antes de cosechar',
        body: 'Antes de iniciar la cosecha, se realiza una evaluación exhaustiva del cultivo. Se mide la densidad óptica (DO) a 560 nm para confirmar que el crecimiento ha alcanzado la fase estacionaria. El pH debe mantenerse entre 9 y 10, el color debe ser verde intenso uniforme sin presencia de grumos o coloraciones amarillas, y la biomasa debe llevar entre 7 y 14 días de cultivo desde la inoculación.',
        params: [{ n: 'DO 560 nm', v: 'Alta absorbancia' }, { n: 'pH', v: '9.0 – 10.0' }, { n: 'Color', v: 'Verde intenso' }, { n: 'Días mínimos', v: '7 – 14 días' }],
        note: 'No cosechar si el cultivo presenta coloración amarillenta o presencia de contaminantes visibles.', noteType: 'warn', anim: 'monitor'
      },
      {
        num: 2, title: 'Filtración con malla fina', subtitle: 'Separación física de la biomasa del medio',
        body: 'La biomasa microalgal se separa del medio de cultivo pasando el contenido del biorreactor a través de una malla de 50 a 100 micras.',
        params: [{ n: 'Malla recomendada', v: '50 – 100 µm' }, { n: 'Método', v: 'Gravedad / presión' }, { n: 'Medio resultante', v: 'Descartar o reutilizar' }, { n: 'Temperatura', v: 'Ambiente (< 35°C)' }],
        note: 'Mantener la biomasa húmeda durante el proceso. Evitar exposición prolongada a luz solar directa.', noteType: 'warn', anim: 'filtro'
      },
      {
        num: 3, title: 'Lavado con agua destilada', subtitle: 'Eliminación de sales residuales del medio Zarrouk',
        body: 'La biomasa retenida en la malla se lava con agua destilada para eliminar las sales del medio Zarrouk que podrían afectar la calidad del biofertilizante.',
        params: [{ n: 'Lavados', v: '2 – 3 ciclos' }, { n: 'Agua', v: 'Destilada estéril' }, { n: 'Objetivo', v: 'Retirar sales NaHCO₃, NaNO₃' }, { n: 'pH post-lavado', v: 'Neutro (≈ 7)' }],
        note: 'El lavado es crítico para la calidad del biofertilizante final.', noteType: 'warn', anim: 'lavado'
      },
      {
        num: 4, title: 'Secado o uso en fresco', subtitle: 'Determinación del tipo de formulación',
        body: 'La biomasa lavada puede procesarse como biofertilizante fresco (uso inmediato, 1:10 en agua, 15 días a 4°C) o biomasa seca (estufa a 40°C, hasta 6 meses).',
        params: [{ n: 'Secado (estufa)', v: '40°C peso constante' }, { n: 'Formulación fresca', v: '1:10 en agua destilada' }, { n: 'Vida útil fresca', v: 'Máx. 15 días (4°C)' }, { n: 'Vida útil seca', v: 'Hasta 6 meses' }],
        note: 'Nunca secar a temperaturas superiores a 45°C.', noteType: 'warn', anim: 'secado'
      },
      {
        num: 5, title: 'Formulación del biofertilizante', subtitle: 'Preparación de la solución final para aplicación',
        body: 'Se prepara la formulación final: al suelo (dilución 20%), foliar (10%) o semillas (5%). pH final 6.5–7.0.',
        params: [{ n: 'Aplicación al suelo', v: 'Dilución 20%' }, { n: 'Aplicación foliar', v: 'Dilución 10%' }, { n: 'Semillas', v: 'Dilución 5%' }, { n: 'pH final', v: '6.5 – 7.0' }],
        note: 'Opcional: agregar melaza al 1% como estabilizante y fuente de carbono.', noteType: 'ok', anim: 'formula'
      },
      {
        num: 6, title: 'Conservación y almacenamiento', subtitle: 'Condiciones para mantener la calidad biológica',
        body: 'Conservar en recipientes oscuros herméticos a 4°C. No congelar. Vida útil máxima: 15 días refrigerado.',
        params: [{ n: 'Temperatura', v: '4°C (refrigerado)' }, { n: 'Recipiente', v: 'Ámbar / oscuro hermético' }, { n: 'Tiempo máximo', v: '15 días (fresco)' }, { n: 'Restricción', v: 'No congelar' }],
        note: 'Más allá de 15 días se produce degradación proteica y pérdida de actividad bioestimulante.', noteType: 'warn', anim: 'conserva'
      }
    ],

    renderStep(idx) {
      state.currentStep = idx;
      const s = this.steps[idx];
      const total = this.steps.length;
      DOM.rcProgress.style.width = ((idx + 1) / total * 100) + '%';

      // Dots
      DOM.stepNav.innerHTML = this.steps.map((st, i) => {
        let cls = 'step-dot';
        if (i === idx) cls += ' active';
        else if (i < idx) cls += ' done';
        return `<div class="${cls}" data-step="${i}">${i < idx ? '✓' : i + 1}</div>`;
      }).join('');

      // Bind step dot events
      DOM.stepNav.querySelectorAll('.step-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          this.renderStep(parseInt(dot.dataset.step));
        });
      });

      // Content
      const noteClass = s.noteType === 'ok' ? 'step-note note-ok' : 'step-note';
      const paramsHTML = s.params.map(p => `<div class="param-box"><div class="param-name">${p.n}</div><div class="param-val">${p.v}</div></div>`).join('');

      DOM.stepContent.innerHTML = `
        <div class="step-header">
          <div class="step-num-badge">${s.num}</div>
          <div><div class="step-title">${s.title}</div><div class="step-subtitle">${s.subtitle}</div></div>
        </div>
        <canvas class="step-anim-canvas" id="rc-canvas" height="110"></canvas>
        <p class="step-body">${s.body}</p>
        <div class="step-params">${paramsHTML}</div>
        <div class="${noteClass}"><strong>${s.noteType === 'ok' ? 'Consejo:' : 'Atención:'}</strong> ${s.note}</div>
        <div class="step-nav-btns">
          <button class="btn-step" id="btn-step-prev" ${idx === 0 ? 'disabled' : ''}>← Anterior</button>
          <button class="btn-step fwd" id="btn-step-next" ${idx === total - 1 ? 'disabled' : ''}>Siguiente →</button>
        </div>
      `;

      // Bind navigation buttons
      const prevBtn = document.getElementById('btn-step-prev');
      const nextBtn = document.getElementById('btn-step-next');
      if (prevBtn) prevBtn.addEventListener('click', () => this.renderStep(idx - 1));
      if (nextBtn) nextBtn.addEventListener('click', () => this.renderStep(idx + 1));

      this.startAnim(s.anim);
    },

    startAnim(type) {
      if (state.rcAnimFrameId) cancelAnimationFrame(state.rcAnimFrameId);
      state.rcAnimTime = 0;
      const c = document.getElementById('rc-canvas');
      if (!c) return;
      const ctx = c.getContext('2d');
      let last = 0;
      const loop = (ts) => {
        const dt = Math.min((ts - last) / 1000, 0.05); last = ts; state.rcAnimTime += dt;
        Renderer.sizeCanvas(c);
        const W = c.offsetWidth, H = c.offsetHeight;
        Renderer.drawStepAnim(ctx, W, H, type);
        state.rcAnimFrameId = requestAnimationFrame(loop);
      };
      state.rcAnimFrameId = requestAnimationFrame(loop);
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: GLOSSARY
  // ═══════════════════════════════════════════════════════
  const Glossary = {
    dataES: [
      { term: 'Spirulina platensis', en: 'Spirulina platensis', cat: 'bio', tag: 'Biología', short: 'Cianobacteria filamentosa usada como biofertilizante principal.', detail: 'Microorganismo fotosintético filamentoso. Contiene 60–70% de proteínas, vitaminas del grupo B, hierro y ficocianina. Crece óptimamente a pH 9–10, 28–32°C y 6000–8000 lux.', param: 'pH óptimo: 9–10 · Temp: 28–32°C' },
      { term: 'Chlorella minutissima', cat: 'bio', tag: 'Biología', short: 'Especie de Chlorella de menor tamaño celular con alta eficiencia.', detail: 'Microalga verde unicelular de tamaño más pequeño (~2–5 µm). Alto contenido lipídico (20–40% en estrés de nitrógeno).', param: 'Lípidos: 20–40% (estrés N)' },
      { term: 'Bioestimulante', en: 'Biostimulant', cat: 'bio', tag: 'Biología', short: 'Sustancia que mejora la tolerancia vegetal al estrés.', detail: 'Compuesto que estimula procesos naturales de la planta: absorción de nutrientes, tolerancia al estrés hídrico y térmico.', param: 'Foliar: c/10 días · 10% dilución' },
      { term: 'Ficocianina', en: 'Phycocyanin', cat: 'bio', tag: 'Biología', short: 'Pigmento azul de Spirulina con propiedades antioxidantes.', detail: 'Proteína pigmentada de las cianobacterias. Actúa como antioxidante vegetal y tiene efecto bioestimulante sobre la germinación.', param: 'Color: azul intenso λ ≈ 620 nm' },
      { term: 'Clorofila', en: 'Chlorophyll', cat: 'bio', tag: 'Biología', short: 'Pigmento fotosintético verde presente en ambas microalgas.', detail: 'Molécula responsable de la captura de energía luminosa para la fotosíntesis. Absorbe luz roja (680 nm) y azul (450 nm).', param: 'Absorción: 450 nm y 680 nm' },
      { term: 'Microalga', en: 'Microalgae', cat: 'bio', tag: 'Biología', short: 'Microorganismo fotosintético unicelular productor de biomasa bioactiva.', detail: 'Microorganismos fotosintéticos que producen biomasa rica en proteínas, lípidos, carbohidratos, pigmentos y vitaminas.', param: 'Tamaño: 1–500 µm' },
      { term: 'Fijación de nitrógeno', en: 'Nitrogen fixation', cat: 'bio', tag: 'Biología', short: 'Proceso de convertir N₂ atmosférico en formas asimilables.', detail: 'Capacidad de algunas cianobacterias de convertir N₂ en NH₃ mediante la enzima nitrogenasa.', param: 'Enzima: nitrogenasa' },
      { term: 'Densidad óptica (DO)', en: 'Optical Density (OD)', cat: 'quim', tag: 'Química', short: 'Absorbancia a 560 nm para monitorear crecimiento.', detail: 'Parámetro espectrofotométrico que mide turbidez del cultivo. DO > 1.0 indica cultivo denso listo para cosechar.', param: 'λ = 560 nm' },
      { term: 'NaHCO₃ — Bicarbonato de sodio', en: 'Sodium bicarbonate', cat: 'quim', tag: 'Química', short: 'Fuente de carbono inorgánico y tampón alcalino del medio Zarrouk.', detail: 'Componente principal del medio Zarrouk. Actúa como donador de CO₂ inorgánico y mantiene pH 9–10.', param: 'Zarrouk: 16.8 g/L' },
      { term: 'NaNO₃ — Nitrato de sodio', en: 'Sodium nitrate', cat: 'quim', tag: 'Química', short: 'Fuente primaria de nitrógeno del medio Zarrouk.', detail: 'Aporta nitrógeno para síntesis de aminoácidos, proteínas y ácidos nucleicos.', param: 'Zarrouk: 2.5 g/L · Óptimo: 2–3.5 g/L' },
      { term: 'CIC', en: 'Cation Exchange Capacity', cat: 'quim', tag: 'Química', short: 'Capacidad del suelo para retener cationes nutritivos.', detail: 'Medida de cationes que el suelo puede retener e intercambiar. 10–20 cmol(+)/kg es capacidad media-alta.', param: 'Óptimo: 10–20 cmol/kg' },
      { term: 'Conductividad eléctrica (CE)', en: 'Electrical Conductivity', cat: 'quim', tag: 'Química', short: 'Indicador de salinidad del suelo. < 2 dS/m = no salino.', detail: 'Capacidad del suelo para conducir electricidad, relacionada con sales solubles.', param: 'Límite: < 2 dS/m' },
      { term: 'pH del suelo', en: 'Soil pH', cat: 'quim', tag: 'Química', short: 'Acidez/basicidad del suelo. Óptimo ají: 6.0–7.0.', detail: 'Concentración de H⁺ en la solución del suelo. Afecta disponibilidad de nutrientes.', param: 'Óptimo ají: 6.0–7.0' },
      { term: 'Método Zarrouk', en: 'Zarrouk Medium', cat: 'proc', tag: 'Proceso', short: 'Protocolo estándar de cultivo para Spirulina (1966).', detail: 'Medio de cultivo líquido con sales inorgánicas definidas. Se esteriliza a 121°C por 15 min.', param: 'Esterilización: 121°C · 15 min' },
      { term: 'Fotoperiodo', en: 'Photoperiod', cat: 'proc', tag: 'Proceso', short: 'Ciclo luz/oscuridad. Óptimo: 12h/12h.', detail: 'Relación entre horas de luz y oscuridad en 24h. El fotoperiodo 12L/12O es óptimo para Spirulina.', param: 'Óptimo: 12h luz / 12h oscuridad' },
      { term: 'Inoculación', en: 'Inoculation', cat: 'proc', tag: 'Proceso', short: 'Adición del cultivo madre al medio Zarrouk estéril.', detail: 'Introducir 10–20% v/v del cultivo madre activo. Se realiza en campana de bioseguridad.', param: 'Inóculo: 10–20% v/v' },
      { term: 'Fase estacionaria', en: 'Stationary phase', cat: 'proc', tag: 'Proceso', short: 'Etapa donde el crecimiento se detiene por agotamiento de nutrientes.', detail: 'La tasa de crecimiento se aproxima a cero. Ideal para cosechar con máxima densidad celular.', param: 'Señal cosecha: DO máxima' },
      { term: 'Tasa específica (µ)', en: 'Specific growth rate', cat: 'proc', tag: 'Proceso', short: 'Parámetro cinético de duplicación de biomasa.', detail: 'µmax Spirulina ≈ 0.25–0.35 d⁻¹. Se calcula como µ = ln(X₂/X₁)/(t₂−t₁).', param: 'µmax: 0.25–0.35 d⁻¹' },
      { term: 'Fertilidad del suelo', en: 'Soil fertility', cat: 'agro', tag: 'Agronomía', short: 'Capacidad del suelo para suministrar nutrientes biodisponibles.', detail: 'Se evalúa con pH, materia orgánica (3–6%), CIC y NPK. El biofertilizante microalgal mejora todos estos parámetros.', param: 'M.O. óptima: 3–6%' },
      { term: 'Capsicum annuum', en: 'Chili pepper', cat: 'agro', tag: 'Agronomía', short: 'Ají — cultivo objetivo del biofertilizante.', detail: 'Especie de la familia Solanaceae. Requiere pH 6.0–7.0, buena disponibilidad de P y K.', param: 'pH suelo: 6.0–7.0' },
      { term: 'Materia orgánica', en: 'Soil organic matter', cat: 'agro', tag: 'Agronomía', short: 'Fracción orgánica que mejora fertilidad, CIC y actividad microbiana.', detail: 'Suelo con > 3% de materia orgánica se considera fértil. El biofertilizante incrementa MO en 30–45%.', param: 'Óptimo: 3–6%' },
      { term: 'Biofertilizante', en: 'Biofertilizer', cat: 'agro', tag: 'Agronomía', short: 'Insumo biológico que mejora disponibilidad de nutrientes del suelo.', detail: 'Producto con microorganismos que mejora N, P, K disponibles y actividad microbiana benéfica.', param: 'Dosis: 50–100 mL/planta' },
    ],

    dataEN: [
      { term: 'Spirulina platensis', cat: 'bio', short: 'Filamentous photosynthetic cyanobacterium; primary microalgae.', detail: 'Prokaryotic photosynthetic microorganism. 60–70% proteins, B-vitamins, iron and phycocyanin. Optimal at pH 9–10, 28–32°C.', param: 'pH: 9–10 · Temp: 28–32°C' },
      { term: 'Chlorella minutissima', cat: 'bio', short: 'Smallest Chlorella species; lipid-rich biomass.', detail: 'Cell size ~2–5 µm. 20–40% lipid content under nitrogen stress. Studied for biodiesel.', param: 'Lipids: 20–40% (N-stress)' },
      { term: 'Biostimulant', cat: 'bio', short: 'Enhances plant stress tolerance and nutrient uptake.', detail: 'Any substance that stimulates natural plant processes for improved nutrient absorption.', param: 'Foliar: every 10 days · 10%' },
      { term: 'Phycocyanin', cat: 'bio', short: 'Blue pigment from Spirulina with antioxidant properties.', detail: 'Phycobiliprotein pigment. Antioxidant and biostimulant on plant germination and growth.', param: 'Color: intense blue · λ ≈ 620 nm' },
      { term: 'Chlorophyll', cat: 'bio', short: 'Green photosynthetic pigment for light energy capture.', detail: 'Absorbs at red (680 nm) and blue (450 nm) wavelengths. Soil antioxidant when released.', param: 'Absorption: 450 nm and 680 nm' },
      { term: 'Microalgae', cat: 'bio', short: 'Microscopic photosynthetic organisms producing nutrient-rich biomass.', detail: 'Prokaryotic (cyanobacteria) or eukaryotic. Cultured controlling pH, light, temperature and CO₂.', param: 'Size: 1–500 µm' },
      { term: 'Nitrogen fixation', cat: 'bio', short: 'Biological conversion of atmospheric N₂ into ammonia.', detail: 'Cyanobacteria convert N₂ to NH₃ through nitrogenase enzyme. Reduces synthetic fertilizer need.', param: 'Enzyme: nitrogenase' },
      { term: 'Optical Density (OD)', cat: 'quim', short: 'Spectrophotometric measurement at 560 nm.', detail: 'Culture turbidity measure. OD > 1.0 = dense, harvest-ready culture.', param: 'λ = 560 nm' },
      { term: 'Sodium bicarbonate', cat: 'quim', short: 'Main carbon source and alkaline buffer (16.8 g/L).', detail: 'Provides inorganic CO₂ for photosynthesis and maintains pH 9–10.', param: 'Zarrouk: 16.8 g/L' },
      { term: 'Sodium nitrate', cat: 'quim', short: 'Primary nitrogen source for protein synthesis.', detail: 'Provides nitrogen for amino acids and proteins. Optimal 2–3.5 g/L.', param: 'Zarrouk: 2.5 g/L' },
      { term: 'CEC', cat: 'quim', short: 'Cation Exchange Capacity — soil nutrient retention.', detail: 'Amount of cations soil can hold. 10–20 cmol(+)/kg = medium-high capacity.', param: 'Optimal: 10–20 cmol/kg' },
      { term: 'Electrical Conductivity', cat: 'quim', short: 'Soil salinity measure; < 2 dS/m = non-saline.', detail: 'Related to soluble salt concentration. High EC causes osmotic stress.', param: 'Optimal limit: < 2 dS/m' },
      { term: 'Soil pH', cat: 'quim', short: 'Acidity/basicity. Optimal for pepper: 6.0–7.0.', detail: 'Governs nutrient availability. Below 5.5: Al/Mn toxicity. Above 7.5: Fe/Zn/P precipitation.', param: 'Optimal pepper: 6.0–7.0' },
      { term: 'Zarrouk Medium', cat: 'proc', short: 'Standard culture medium for Spirulina (1966).', detail: 'Contains NaHCO₃, NaNO₃, K₂HPO₄, K₂SO₄, NaCl, MgSO₄, CaCl₂, FeSO₄, EDTA.', param: 'Sterilization: 121°C · 15 min' },
      { term: 'Photoperiod', cat: 'proc', short: 'Light/dark cycle. Optimal: 12h/12h.', detail: '12L/12D is optimal. White LED at 6,000–8,000 lux recommended.', param: 'Optimal: 12h light / 12h dark' },
      { term: 'Inoculation', cat: 'proc', short: 'Addition of 10–20% v/v mother culture to sterile medium.', detail: 'Must show deep green color and elevated OD. Performed under biosafety cabinet.', param: 'Inoculum: 10–20% v/v' },
      { term: 'Stationary phase', cat: 'proc', short: 'Growth phase — max biomass, optimal harvest point.', detail: 'Division rate equals death rate. Maximum protein and pigment content.', param: 'Harvest signal: max OD' },
      { term: 'Specific growth rate (µ)', cat: 'proc', short: 'Kinetic parameter measuring biomass doubling speed.', detail: 'µmax ≈ 0.25–0.35 d⁻¹. Follows logistic curve: lag → exponential → stationary.', param: 'µmax: 0.25–0.35 d⁻¹' },
      { term: 'Soil fertility', cat: 'agro', short: 'Soil ability to supply essential nutrients.', detail: 'Evaluated by pH, organic matter (3–6%), CEC, NPK and EC.', param: 'Organic matter: 3–6%' },
      { term: 'Capsicum annuum', cat: 'agro', short: 'Chili pepper — target crop of the biofertilizer.', detail: 'Requires pH 6.0–7.0, adequate P/K supply. Responsive to biostimulants.', param: 'Soil pH: 6.0–7.0' },
      { term: 'Soil organic matter', cat: 'agro', short: 'Organic fraction improving fertility and water retention.', detail: 'Soil with > 3% organic matter is fertile. Biofertilizer increases SOM 30–45%.', param: 'Optimal: 3–6%' },
      { term: 'Biofertilizer', cat: 'agro', short: 'Biological input that improves soil nutrient availability.', detail: 'Contains live microorganisms or metabolites. Applied soil (50–100 mL/plant), foliar (10%), seeds (5%).', param: 'Soil dose: 50–100 mL/plant' },
    ],

    tagEN: { bio: 'Biology', quim: 'Chemistry', proc: 'Process', agro: 'Agronomy' },

    renderES() {
      const q = DOM.glosSearch.value.toLowerCase();
      const filtered = this.dataES.filter(g => {
        const matchCat = state.activeCatES === 'all' || g.cat === state.activeCatES;
        const matchQ = !q || g.term.toLowerCase().includes(q) || g.short.toLowerCase().includes(q) || (g.detail && g.detail.toLowerCase().includes(q));
        return matchCat && matchQ;
      });

      if (!filtered.length) {
        DOM.glosGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px;font-size:13px">No se encontraron términos para tu búsqueda.</div>';
        return;
      }

      DOM.glosGrid.innerHTML = filtered.map((g, i) => `
        <div class="glos-card" data-glos="es-${i}">
          <span class="glos-tag tag-${g.cat}">${g.tag}</span>
          <div class="glos-term">${g.term}<span class="glos-chevron">▼</span></div>
          ${g.en && g.en !== g.term ? `<div class="glos-en-name">EN: ${g.en}</div>` : ''}
          <div class="glos-short">${g.short}</div>
          <div class="glos-detail">${g.detail || ''}${g.param ? `<div><span class="glos-param">${g.param}</span></div>` : ''}</div>
        </div>
      `).join('');

      // Bind toggle events
      DOM.glosGrid.querySelectorAll('.glos-card').forEach(card => {
        card.addEventListener('click', () => card.classList.toggle('open'));
      });
    },

    renderEN() {
      if (!DOM.glosENSearch || !DOM.glosENGrid) return;
      const q = DOM.glosENSearch.value.toLowerCase();
      const filtered = this.dataEN.filter(g => {
        const mc = state.activeCatEN === 'all' || g.cat === state.activeCatEN;
        const mq = !q || g.term.toLowerCase().includes(q) || g.short.toLowerCase().includes(q) || (g.detail && g.detail.toLowerCase().includes(q));
        return mc && mq;
      });

      if (!filtered.length) {
        DOM.glosENGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:30px;font-size:13px">No terms found for your search.</div>';
        return;
      }

      DOM.glosENGrid.innerHTML = filtered.map((g, i) => `
        <div class="glos-card" data-glos="en-${i}">
          <span class="glos-tag tag-${g.cat}">${this.tagEN[g.cat]}</span>
          <div class="glos-term">${g.term}<span class="glos-chevron">▼</span></div>
          <div class="glos-short">${g.short}</div>
          <div class="glos-detail">${g.detail || ''}${g.param ? `<div><span class="glos-param">${g.param}</span></div>` : ''}</div>
        </div>
      `).join('');

      DOM.glosENGrid.querySelectorAll('.glos-card').forEach(card => {
        card.addEventListener('click', () => card.classList.toggle('open'));
      });
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: LANDING (Background animation)
  // ═══════════════════════════════════════════════════════
  const Landing = {
    init() {
      const cv = DOM.landingCanvas;
      if (!cv) return;
      const ctx = cv.getContext('2d');
      const dpr = window.devicePixelRatio || 1;

      // Create floating particles
      for (let i = 0; i < 80; i++) {
        state.landingParticles.push({
          x: Math.random(),
          y: Math.random(),
          r: 1 + Math.random() * 4,
          vx: (Math.random() - 0.5) * 0.0003,
          vy: (Math.random() - 0.5) * 0.0003,
          phase: Math.random() * Math.PI * 2,
          type: Math.floor(Math.random() * 3)
        });
      }

      let lastTs = 0;
      const loop = (ts) => {
        if (!DOM.landing || DOM.landing.classList.contains('fade-out')) return;
        const dt = Math.min((ts - lastTs) / 1000, 0.05);
        lastTs = ts;

        const W = cv.offsetWidth;
        const H = cv.offsetHeight;
        if (cv.width !== W * dpr || cv.height !== H * dpr) {
          cv.width = W * dpr;
          cv.height = H * dpr;
          ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, W, H);
        const T = ts / 1000;

        state.landingParticles.forEach(p => {
          p.x += p.vx + Math.sin(T * 0.3 + p.phase) * 0.0001;
          p.y += p.vy + Math.cos(T * 0.2 + p.phase) * 0.0001;
          if (p.x < 0) p.x = 1;
          if (p.x > 1) p.x = 0;
          if (p.y < 0) p.y = 1;
          if (p.y > 1) p.y = 0;

          const px = p.x * W;
          const py = p.y * H;
          const alpha = 0.15 + 0.15 * Math.sin(T * 0.5 + p.phase);

          ctx.globalAlpha = alpha;
          ctx.beginPath();
          const colors = ['#1D9E75', '#5DCAA5', '#0F6E56'];
          ctx.fillStyle = colors[p.type];

          if (p.type === 0) {
            ctx.ellipse(px, py, p.r * 1.5, p.r * 0.7, T * 0.1 + p.phase, 0, Math.PI * 2);
          } else if (p.type === 1) {
            ctx.arc(px, py, p.r, 0, Math.PI * 2);
          } else {
            ctx.ellipse(px, py, p.r * 0.6, p.r * 1.3, T * 0.08 + p.phase, 0, Math.PI * 2);
          }
          ctx.fill();

          // Glow effect
          ctx.globalAlpha = alpha * 0.15;
          ctx.beginPath();
          ctx.arc(px, py, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = '#1D9E75';
          ctx.fill();
        });

        ctx.globalAlpha = 1;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },

    hide() {
      DOM.landing.classList.add('fade-out');
      setTimeout(() => {
        DOM.landing.classList.add('hidden');
        DOM.app.classList.remove('hidden');
      }, 800);
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: STORAGE (localStorage persistence)
  // ═══════════════════════════════════════════════════════
  const Storage = {
    KEY: 'microalgas_sim_state',

    save() {
      const data = {};
      Object.keys(DOM.ranges).forEach(key => {
        data[key] = DOM.ranges[key].value;
      });
      data.theme = state.isDarkTheme ? 'dark' : 'light';
      try {
        localStorage.setItem(this.KEY, JSON.stringify(data));
      } catch (e) { /* ignore */ }
    },

    load() {
      try {
        const raw = localStorage.getItem(this.KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        Object.keys(DOM.ranges).forEach(key => {
          if (data[key] !== undefined) {
            DOM.ranges[key].value = data[key];
          }
        });
        if (data.theme === 'light') {
          state.isDarkTheme = false;
          document.documentElement.setAttribute('data-theme', 'light');
          DOM.btnTheme.textContent = '☀️';
        }
      } catch (e) { /* ignore */ }
    }
  };

  // ═══════════════════════════════════════════════════════
  // MODULE: GAME LOOP
  // ═══════════════════════════════════════════════════════
  function mainLoop(ts) {
    const dt = Math.min((ts - state.lastTimestamp) / 1000, 0.08);
    state.lastTimestamp = ts;
    state.time = ts / 1000;

    if (state.running) {
      const v = Simulation.getValues();
      const grMax = Simulation.calcGrowthRate(v);

      // Logistic growth curve with lag phase
      const lagFactor = Math.min(1, state.days * 1.5);
      const logistic = (state.density / 80) * (1 - state.density / 108);
      const effRate = grMax * Math.max(0, logistic) * lagFactor;
      state.growthRate = Math.max(0.02, Math.min(grMax, effRate));

      // Fill speed scales with nutrient quality (optimal → 4× faster)
      const fillSpeed = 10 + grMax * 30;
      state.density = Math.min(100, state.density + state.growthRate * dt * fillSpeed);

      // Days progress (unlimited — ~20 days per 60 seconds of real time)
      state.days += dt * (20 / CONFIG.SIM_REAL_SECONDS);

      // Enable harvest button
      if (state.density >= CONFIG.HARVEST_THRESHOLD) {
        DOM.btnHarvest.disabled = false;
      }

      UI.updateStats();
      UI.updateBiomass();
      Particles.updateBubbles(dt);
    }

    Renderer.drawBioreactor();
    state.animFrameId = requestAnimationFrame(mainLoop);
  }

  // ═══════════════════════════════════════════════════════
  // MODULE: EVENT BINDING
  // ═══════════════════════════════════════════════════════
  function bindEvents() {
    // Landing button
    DOM.btnStartSim.addEventListener('click', () => {
      Landing.hide();
    });

    // Tab navigation
    DOM.tabBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.tab-btn');
      if (btn) UI.showTab(btn.dataset.tab);
    });

    // Range sliders
    const decimalMap = { ph: 1, temp: 0, luz: 0, co2: 1, bic: 1, nit: 1, foto: 0, sal: 0 };
    Object.keys(DOM.ranges).forEach(key => {
      DOM.ranges[key].addEventListener('input', () => {
        UI.updateSliderValue(key, decimalMap[key]);
        if (state.running) {
          state.growthRate = Simulation.calcGrowthRate(Simulation.getValues());
          UI.updateAlert();
        }
        Storage.save();
      });
    });

    // Start button
    DOM.btnStart.addEventListener('click', () => {
      state.running = true;
      state.density = 0;
      state.days = 0;
      state.growthRate = 0;
      state.bubbles.forEach(b => { b.progress = Math.random(); b.active = false; });
      DOM.btnHarvest.disabled = true;
      DOM.sDays.textContent = '0.0';
      DOM.sRate.textContent = '0%';
      UI.updateAlert();
      if (state.animFrameId) cancelAnimationFrame(state.animFrameId);
      state.lastTimestamp = 0;
      requestAnimationFrame(mainLoop);
    });

    // Harvest button
    DOM.btnHarvest.addEventListener('click', () => {
      const f = state.growthRate;
      const vals = {
        prot: Math.round(60 * (0.5 + f * 0.5)),
        aa: Math.round(8 * (0.5 + f * 0.5)),
        carb: Math.round(20 * (0.5 + f * 0.5)),
        lip: Math.round(9 * (0.5 + f * 0.5)),
        vit: Math.round(2 * (0.5 + f * 0.5)),
        pig: Math.round(2 * (0.5 + f * 0.5)),
        min: Math.round(1 * (0.5 + f * 0.5))
      };
      UI.setBio('prot', vals.prot, vals.prot);
      UI.setBio('aa', vals.aa * 10, vals.aa);
      UI.setBio('carb', vals.carb, vals.carb);
      UI.setBio('lip', vals.lip * 8, vals.lip);
      UI.setBio('vit', vals.vit * 40, vals.vit);
      UI.setBio('pig', vals.pig * 40, vals.pig);
      UI.setBio('min', vals.min * 80, vals.min);
      state.density = 0;
      state.days = 0;
      DOM.btnHarvest.disabled = true;
      DOM.sAlert.className = 'alert-box alert-info';
      DOM.sAlert.innerHTML = '🎉 <strong>¡Biomasa cosechada!</strong> Composición actualizada. Lista para aplicar al cultivo de ají.';
    });

    // Theme toggle
    DOM.btnTheme.addEventListener('click', () => {
      state.isDarkTheme = !state.isDarkTheme;
      document.documentElement.setAttribute('data-theme', state.isDarkTheme ? '' : 'light');
      DOM.btnTheme.textContent = state.isDarkTheme ? '🌙' : '☀️';
      Storage.save();
    });

    // Reset button
    DOM.btnReset.addEventListener('click', () => {
      state.running = false;
      state.density = 0;
      state.days = 0;
      state.growthRate = 0;
      DOM.btnHarvest.disabled = true;

      // Reset sliders to defaults
      const defaults = { ph: '9.5', temp: '30', luz: '7000', co2: '2', bic: '16.8', nit: '2.5', foto: '12', sal: '15' };
      Object.keys(defaults).forEach(key => {
        DOM.ranges[key].value = defaults[key];
        UI.updateSliderValue(key, decimalMap[key]);
      });

      UI.updateStats();
      UI.updateBiomass();
      DOM.sAlert.className = 'alert-box alert-info';
      DOM.sAlert.innerHTML = 'Ajusta las variables y presiona <strong>Iniciar cultivo</strong>.';

      // Reset biomass bars
      ['prot', 'aa', 'carb', 'lip', 'vit', 'pig', 'min'].forEach(k => UI.setBio(k, 0, 0));
      Storage.save();
    });

    // Glossary search ES
    DOM.glosSearch.addEventListener('input', () => Glossary.renderES());

    // Glossary filters ES
    DOM.glosFilterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      state.activeCatES = btn.dataset.cat;
      DOM.glosFilterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Glossary.renderES();
    });

    // Glossary search EN
    if (DOM.glosENSearch) {
      DOM.glosENSearch.addEventListener('input', () => Glossary.renderEN());
    }

    // Glossary filters EN
    if (DOM.glosENFilterBar) {
      DOM.glosENFilterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        state.activeCatEN = btn.dataset.cat;
        DOM.glosENFilterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Glossary.renderEN();
      });
    }
  }

  // ═══════════════════════════════════════════════════════
  // INITIALIZATION
  // ═══════════════════════════════════════════════════════
  function init() {
    cacheDOMRefs();
    Particles.init();
    Storage.load();

    // Initialize all slider display values
    const decimalMap = { ph: 1, temp: 0, luz: 0, co2: 1, bic: 1, nit: 1, foto: 0, sal: 0 };
    Object.keys(DOM.ranges).forEach(key => {
      UI.updateSliderValue(key, decimalMap[key]);
    });

    bindEvents();
    Landing.init();

    // Initial renders
    Glossary.renderES();
    Glossary.renderEN();
    Recoleccion.renderStep(0);

    // Start render loop (always draws the canvas even when sim is paused)
    Renderer.drawBioreactor();
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
