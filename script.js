let select = e => document.querySelector(e);

function safeAttr(id, attr) {
  const el = select(id);
  return el ? el.getAttribute(attr) : null;
}

const face01 = safeAttr("#face01", "d"),
  face02 = safeAttr("#face02", "d"),
  handSec01 = safeAttr("#handSec01", "d"),
  handSec02 = safeAttr("#handSec02", "d"),
  handMin01 = safeAttr("#handMin01", "d"),
  handMin02 = safeAttr("#handMin02", "d"),
  handHr01 = safeAttr("#handHr01", "d"),
  handHr02 = safeAttr("#handHr02", "d");

const sec = select("#sec"),
  min = select("#min"),
  hr = select("#hr");

if (face01) gsap.set("#face", { attr: { d: face01 } });
if (handSec01) gsap.set("#hand-sec", { attr: { d: handSec01 } });
if (handMin01) gsap.set("#hand-min", { attr: { d: handMin01 } });
if (handHr01) gsap.set("#hand-hr", { attr: { d: handHr01 } });

const hasMorph = typeof MorphSVGPlugin !== "undefined";
if (hasMorph) {
  try { gsap.registerPlugin(MorphSVGPlugin); } catch (e) {}
}

const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const STORAGE_KEY = "spiderClockSettings_v4";
const defaultSettings = {
  size: "full",
  widgetMode: false,
  editMode: false,
  openSettingsOnLaunch: false,
  posX: null,
  posY: null,
  scale: 1,
  clockPx: null,
  showDigital: false,
  pauseWhenHidden: true
};

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}
function saveSettings(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (_) {}
}

let settings = loadSettings();
let isAnimatingLayout = false;

function clampScale(v) {
  return Math.min(2.5, Math.max(0.35, Number(v) || 1));
}
function clampPx(px) {
  return Math.min(Math.min(window.innerWidth, window.innerHeight) * 0.95, Math.max(80, px));
}

function applyScale(scale, animate) {
  settings.scale = clampScale(scale);
  const body = select("#wBody");
  if (!body) return;
  if (settings.editMode || settings.widgetMode) {
    gsap.set(body, { scale: 1, transformOrigin: "50% 50%" });
  } else {
    const dur = reduceMotion ? 0 : (animate ? 0.25 : 0);
    if (dur) gsap.to(body, { duration: dur, scale: settings.scale, transformOrigin: "50% 50%", ease: "power2.out" });
    else gsap.set(body, { scale: settings.scale, transformOrigin: "50% 50%" });
  }
  const slider = select("#scaleSlider");
  const label = select("#scaleLabel");
  if (slider) slider.value = settings.scale;
  if (label) label.textContent = Math.round(settings.scale * 100) + "%";
  saveSettings(settings);
}

function applyClockPx(px, animate) {
  const body = select("#wBody");
  if (!body) return;
  const size = clampPx(px);
  settings.clockPx = size;
  body.style.transition = animate && !reduceMotion ? "width 0.2s ease" : "none";
  body.style.width = size + "px";
  body.style.maxWidth = "none";
  gsap.set(body, { scale: 1 });
  saveSettings(settings);
  const label = select("#scaleLabel");
  if (label) label.textContent = Math.round(size) + "px";
}

function applySize(size) {
  document.body.classList.remove("size-small", "size-medium", "size-large", "size-full");
  document.body.classList.add("size-" + (size || "full"));
  settings.size = size || "full";
  if (!settings.editMode && !settings.widgetMode) {
    const body = select("#wBody");
    if (body) { body.style.width = ""; body.style.maxWidth = ""; }
  }
  saveSettings(settings);
}

function setDigital(on) {
  settings.showDigital = !!on;
  const el = select("#digitalTime");
  if (el) el.classList.toggle("visible", !!on);
  const chk = select("#digitalCheck");
  if (chk) chk.checked = !!on;
  saveSettings(settings);
}

function updateDigital() {
  const el = select("#digitalTime");
  if (!el || !settings.showDigital) return;
  const d = new Date();
  el.textContent =
    String(d.getHours()).padStart(2, "0") + ":" +
    String(d.getMinutes()).padStart(2, "0") + ":" +
    String(d.getSeconds()).padStart(2, "0");
}

function ensureFloating(wrap) {
  if (!wrap) return;
  wrap.style.position = "fixed";
  wrap.style.zIndex = "50";
  wrap.style.pointerEvents = "";
  if (settings.posX != null && settings.posY != null) {
    wrap.style.left = settings.posX + "px";
    wrap.style.top = settings.posY + "px";
  } else {
    const rect = wrap.getBoundingClientRect();
    const x = Math.max(20, (window.innerWidth - rect.width) / 2);
    const y = Math.max(20, (window.innerHeight - rect.height) / 2);
    wrap.style.left = x + "px";
    wrap.style.top = y + "px";
    settings.posX = x;
    settings.posY = y;
  }
}

function setEditMode(on) {
  settings.editMode = !!on;
  const body = document.body;
  const wrap = select(".gsapWrapper");
  body.classList.toggle("edit-mode", !!on);
  if (on) {
    if (!settings.widgetMode) body.classList.add("widget-mode");
    ensureFloating(wrap);
    const bodyEl = select("#wBody");
    let px = settings.clockPx;
    if (!px && bodyEl) px = bodyEl.getBoundingClientRect().width || 200;
    applyClockPx(px || 200, false);
    showToast("Edit mode: drag to move · drag corners to resize · E or Esc to exit");
  } else {
    body.classList.remove("edit-mode");
    if (!settings.widgetMode) {
      body.classList.remove("widget-mode");
      const w = select(".gsapWrapper");
      if (w) {
        w.style.position = "";
        w.style.left = "";
        w.style.top = "";
        w.style.zIndex = "";
      }
      applySize(settings.size || "full");
      applyScale(settings.scale || 1, true);
    }
    showToast("Edit mode off");
  }
  saveSettings(settings);
  const chk = select("#editCheck");
  if (chk) chk.checked = !!on;
  const editBtn = select("#editModeBtn");
  if (editBtn) editBtn.classList.toggle("active", !!on);
}

function setWidgetMode(on, animate) {
  settings.widgetMode = !!on;
  const wrap = select(".gsapWrapper");
  const body = document.body;
  if (on) {
    applySize("small");
    body.classList.add("widget-mode");
    if (wrap) {
      ensureFloating(wrap);
      applyClockPx(settings.clockPx || 160, false);
    }
  } else {
    if (!settings.editMode) {
      body.classList.remove("widget-mode");
      applySize(settings.size === "small" ? "full" : settings.size);
      if (wrap) {
        wrap.style.position = "";
        wrap.style.left = "";
        wrap.style.top = "";
        wrap.style.zIndex = "";
      }
      applyScale(settings.scale || 1, false);
    }
  }
  saveSettings(settings);
  const wc = select("#widgetCheck");
  if (wc) wc.checked = !!on;
}

function showToast(msg, ms) {
  let t = select("#scToast");
  if (!t) {
    t = document.createElement("div");
    t.id = "scToast";
    t.className = "sc-toast";
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), ms || 2800);
}

function createUI() {
  const btn = document.createElement("button");
  btn.className = "settings-btn";
  btn.title = "Settings (S)";
  btn.setAttribute("aria-label", "Open settings");
  btn.innerHTML = "⚙";
  btn.addEventListener("click", () => openSettings());
  document.body.appendChild(btn);

  const editBtn = document.createElement("button");
  editBtn.id = "editModeBtn";
  editBtn.className = "edit-mode-btn";
  editBtn.title = "Edit mode (E)";
  editBtn.setAttribute("aria-label", "Toggle edit mode");
  editBtn.innerHTML = "⛶";
  editBtn.addEventListener("click", () => setEditMode(!settings.editMode));
  document.body.appendChild(editBtn);

  const digital = document.createElement("div");
  digital.id = "digitalTime";
  digital.className = "digital-time";
  document.body.appendChild(digital);

  const wrap = select(".gsapWrapper");
  if (wrap) {
    const bar = document.createElement("div");
    bar.className = "drag-bar";
    wrap.appendChild(bar);
    ["nw", "ne", "sw", "se"].forEach((pos) => {
      const h = document.createElement("div");
      h.className = "resize-handle rh-" + pos;
      h.dataset.corner = pos;
      wrap.appendChild(h);
      initCornerResize(h, pos);
    });
    wrap.addEventListener("dblclick", (e) => {
      if (document.body.classList.contains("settings-open")) return;
      if (e.target.classList && e.target.classList.contains("resize-handle")) return;
      if (settings.editMode) { setEditMode(false); return; }
      setWidgetMode(!settings.widgetMode, true);
      showToast(settings.widgetMode ? "Widget mode on" : "Full clock");
    });
    wrap.addEventListener("wheel", (e) => {
      if (document.body.classList.contains("settings-open")) return;
      e.preventDefault();
      if (settings.editMode || settings.widgetMode) {
        const body = select("#wBody");
        const cur = (body && body.getBoundingClientRect().width) || settings.clockPx || 200;
        applyClockPx(cur + (e.deltaY > 0 ? -12 : 12), false);
      } else {
        applyScale((settings.scale || 1) + (e.deltaY > 0 ? -0.06 : 0.06), true);
      }
    }, { passive: false });
  }

  const overlay = document.createElement("div");
  overlay.className = "settings-overlay";
  overlay.id = "settingsOverlay";
  overlay.innerHTML = `
    <div class="settings-card" id="settingsCard">
      <h1>🕷️ Spider Clock</h1>
      <p class="subtitle">Settings · live preview</p>
      <div class="preview-box" id="previewBox"><div class="preview-label">Live preview</div></div>
      <div class="setting-row"><label for="sizeSelect">Preset size</label>
        <select id="sizeSelect"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option><option value="full">Full</option></select></div>
      <div class="setting-row scale-row"><label for="scaleSlider">Scale <span id="scaleLabel">100%</span></label>
        <input type="range" id="scaleSlider" min="0.35" max="2.5" step="0.05" value="1"></div>
      <div class="setting-row"><label for="editCheck">Edit mode</label><input type="checkbox" id="editCheck"></div>
      <div class="setting-row"><label for="widgetCheck">Widget mode</label><input type="checkbox" id="widgetCheck"></div>
      <div class="setting-row"><label for="digitalCheck">Show digital time</label><input type="checkbox" id="digitalCheck"></div>
      <div class="setting-row"><label for="launchCheck">Show settings on open</label><input type="checkbox" id="launchCheck"></div>
      <div class="setting-row"><label for="pauseCheck">Pause when tab hidden</label><input type="checkbox" id="pauseCheck"></div>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" id="btnFull">Open full clock</button>
        <button type="button" class="btn btn-widget" id="btnWidget">Start as widget</button>
        <button type="button" class="btn btn-edit" id="btnEdit">Edit mode</button>
        <button type="button" class="btn btn-secondary" id="btnClose">Close</button>
        <button type="button" class="btn btn-ghost" id="btnReset">Reset</button>
      </div>
      <p class="hint">E edit · S settings · W widget · F full · drag corners to resize</p>
    </div>`;
  document.body.appendChild(overlay);

  const sizeSelect = select("#sizeSelect");
  const widgetCheck = select("#widgetCheck");
  const launchCheck = select("#launchCheck");
  const scaleSlider = select("#scaleSlider");
  const digitalCheck = select("#digitalCheck");
  const pauseCheck = select("#pauseCheck");
  const editCheck = select("#editCheck");

  sizeSelect.value = settings.size || "full";
  widgetCheck.checked = !!settings.widgetMode;
  launchCheck.checked = !!settings.openSettingsOnLaunch;
  scaleSlider.value = settings.scale || 1;
  select("#scaleLabel").textContent = Math.round((settings.scale || 1) * 100) + "%";
  digitalCheck.checked = !!settings.showDigital;
  pauseCheck.checked = settings.pauseWhenHidden !== false;
  editCheck.checked = !!settings.editMode;

  sizeSelect.addEventListener("change", () => {
    if (!settings.widgetMode && !settings.editMode) applySize(sizeSelect.value);
    else { settings.size = sizeSelect.value; saveSettings(settings); }
  });
  scaleSlider.addEventListener("input", () => {
    if (settings.editMode || settings.widgetMode)
      applyClockPx(80 + (Number(scaleSlider.value) - 0.35) * (400 / 2.15), false);
    else applyScale(scaleSlider.value, false);
  });
  widgetCheck.addEventListener("change", () => setWidgetMode(widgetCheck.checked, true));
  editCheck.addEventListener("change", () => setEditMode(editCheck.checked));
  launchCheck.addEventListener("change", () => { settings.openSettingsOnLaunch = launchCheck.checked; saveSettings(settings); });
  digitalCheck.addEventListener("change", () => setDigital(digitalCheck.checked));
  pauseCheck.addEventListener("change", () => { settings.pauseWhenHidden = pauseCheck.checked; saveSettings(settings); });

  select("#btnFull").addEventListener("click", () => {
    closeSettings(true, () => { setEditMode(false); setWidgetMode(false, true); applySize(sizeSelect.value); });
  });
  select("#btnWidget").addEventListener("click", () => closeSettings(true, () => setWidgetMode(true, true)));
  select("#btnEdit").addEventListener("click", () => closeSettings(true, () => setEditMode(true)));
  select("#btnClose").addEventListener("click", () => closeSettings(true));
  select("#btnReset").addEventListener("click", () => {
    settings = { ...defaultSettings };
    saveSettings(settings);
    setEditMode(false);
    setWidgetMode(false, true);
    applyScale(1, true);
    applySize("full");
    setDigital(false);
    sizeSelect.value = "full";
    widgetCheck.checked = false;
    editCheck.checked = false;
    launchCheck.checked = false;
    digitalCheck.checked = false;
    pauseCheck.checked = true;
    showToast("Settings reset");
  });
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeSettings(true); });
  document.addEventListener("keydown", onKeyDown);
}

function onKeyDown(e) {
  const tag = (e.target && e.target.tagName) || "";
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
  if (e.key === "Escape") {
    if (document.body.classList.contains("settings-open")) closeSettings(true);
    else if (settings.editMode) setEditMode(false);
    return;
  }
  if (e.key === "e" || e.key === "E") { setEditMode(!settings.editMode); return; }
  if (e.key === "s" || e.key === "S") {
    if (!document.body.classList.contains("settings-open")) openSettings();
    return;
  }
  if (e.key === "w" || e.key === "W") { setWidgetMode(!settings.widgetMode, true); return; }
  if (e.key === "f" || e.key === "F") {
    setEditMode(false);
    setWidgetMode(false, true);
    applySize(settings.size || "full");
  }
}

function openSettings() {
  if (isAnimatingLayout) return;
  isAnimatingLayout = true;
  const overlay = select("#settingsOverlay");
  const card = select("#settingsCard");
  const box = select("#previewBox");
  const wrap = select(".gsapWrapper");
  document.body.classList.add("settings-open");
  if (overlay) {
    gsap.fromTo(overlay, { autoAlpha: 0 }, { duration: reduceMotion ? 0 : 0.3, autoAlpha: 1, ease: "power2.out" });
    overlay.classList.add("open");
  }
  if (card && !reduceMotion)
    gsap.fromTo(card, { scale: 0.94, y: 20, autoAlpha: 0 }, { duration: 0.4, scale: 1, y: 0, autoAlpha: 1, ease: "power3.out" });
  else if (card) gsap.set(card, { autoAlpha: 1, scale: 1, y: 0 });
  if (box && wrap) {
    requestAnimationFrame(() => {
      const from = wrap.getBoundingClientRect();
      const to = box.getBoundingClientRect();
      wrap.style.position = "fixed";
      wrap.style.zIndex = "210";
      wrap.style.pointerEvents = "none";
      wrap.style.left = from.left + "px";
      wrap.style.top = from.top + "px";
      wrap.style.width = from.width + "px";
      wrap.style.height = from.height + "px";
      gsap.to(wrap, {
        duration: reduceMotion ? 0 : 0.5, ease: "power3.inOut",
        left: to.left, top: to.top, width: to.width, height: to.height,
        onComplete: () => { isAnimatingLayout = false; }
      });
      gsap.set(wrap, { autoAlpha: 1 });
    });
  } else isAnimatingLayout = false;
}

function closeSettings(force, after) {
  if (isAnimatingLayout && !force) return;
  isAnimatingLayout = true;
  const overlay = select("#settingsOverlay");
  const card = select("#settingsCard");
  const wrap = select(".gsapWrapper");
  if (card) gsap.to(card, { duration: reduceMotion ? 0 : 0.22, scale: 0.96, y: 10, autoAlpha: 0, ease: "power2.in" });
  if (overlay) {
    gsap.to(overlay, {
      duration: reduceMotion ? 0 : 0.28, autoAlpha: 0, ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("open");
        document.body.classList.remove("settings-open");
      }
    });
  }
  if (wrap) {
    let targetW = settings.clockPx || 200;
    let left = settings.posX != null ? settings.posX : 40;
    let top = settings.posY != null ? settings.posY : 40;
    if (!settings.widgetMode && !settings.editMode) {
      wrap.style.position = "";
      wrap.style.left = "";
      wrap.style.top = "";
      wrap.style.width = "";
      wrap.style.height = "";
      wrap.style.zIndex = "";
      wrap.style.pointerEvents = "";
      isAnimatingLayout = false;
      if (after) after();
      return;
    }
    gsap.to(wrap, {
      duration: reduceMotion ? 0 : 0.45, ease: "power3.out",
      left: left, top: top, width: targetW, height: targetW,
      onComplete: () => {
        wrap.style.pointerEvents = "";
        isAnimatingLayout = false;
        if (after) after();
      }
    });
  } else {
    isAnimatingLayout = false;
    if (after) after();
  }
}

function isHandle(el) {
  return el && el.classList && el.classList.contains("resize-handle");
}

function initDrag() {
  const wrap = select(".gsapWrapper");
  if (!wrap) return;
  let dragging = false, ox = 0, oy = 0;
  function down(e) {
    if (!settings.editMode && !settings.widgetMode) return;
    if (document.body.classList.contains("settings-open")) return;
    if (isHandle(e.target)) return;
    dragging = true;
    wrap.classList.add("dragging");
    const pt = e.touches ? e.touches[0] : e;
    const r = wrap.getBoundingClientRect();
    ox = pt.clientX - r.left;
    oy = pt.clientY - r.top;
    e.preventDefault();
  }
  function move(e) {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    let left = pt.clientX - ox;
    let top = pt.clientY - oy;
    left = Math.max(0, Math.min(window.innerWidth - 40, left));
    top = Math.max(0, Math.min(window.innerHeight - 40, top));
    wrap.style.left = left + "px";
    wrap.style.top = top + "px";
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("dragging");
    settings.posX = parseInt(wrap.style.left, 10) || 0;
    settings.posY = parseInt(wrap.style.top, 10) || 0;
    saveSettings(settings);
  }
  wrap.addEventListener("mousedown", down);
  wrap.addEventListener("touchstart", down, { passive: false });
  window.addEventListener("mousemove", move);
  window.addEventListener("touchmove", move, { passive: false });
  window.addEventListener("mouseup", up);
  window.addEventListener("touchend", up);
}

function initCornerResize(handle, corner) {
  let resizing = false;
  let centerX = 0, centerY = 0;
  function onDown(e) {
    if (!settings.editMode && !settings.widgetMode) return;
    if (document.body.classList.contains("settings-open")) return;
    resizing = true;
    document.body.classList.add("is-resizing");
    const wrap = select(".gsapWrapper");
    if (wrap) {
      const r = wrap.getBoundingClientRect();
      centerX = r.left + r.width / 2;
      centerY = r.top + r.height / 2;
    }
    e.preventDefault();
    e.stopPropagation();
  }
  function onMove(e) {
    if (!resizing) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - centerX;
    const dy = pt.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const newSize = clampPx(dist * 2);
    applyClockPx(newSize, false);
    const wrap = select(".gsapWrapper");
    if (wrap) {
      const half = newSize / 2;
      wrap.style.left = Math.max(0, Math.min(window.innerWidth - 40, centerX - half)) + "px";
      wrap.style.top = Math.max(0, Math.min(window.innerHeight - 40, centerY - half)) + "px";
    }
  }
  function onUp() {
    if (!resizing) return;
    resizing = false;
    document.body.classList.remove("is-resizing");
    const wrap = select(".gsapWrapper");
    if (wrap) {
      settings.posX = parseInt(wrap.style.left, 10) || 0;
      settings.posY = parseInt(wrap.style.top, 10) || 0;
      saveSettings(settings);
    }
  }
  handle.addEventListener("mousedown", onDown);
  handle.addEventListener("touchstart", onDown, { passive: false });
  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchend", onUp);
}

function initVisibility() {
  document.addEventListener("visibilitychange", () => {
    if (settings.pauseWhenHidden === false) return;
    if (document.hidden) gsap.globalTimeline.pause();
    else gsap.globalTimeline.resume();
  });
}

window.onload = function () {
  createUI();
  initDrag();
  initVisibility();
  applyScale(settings.scale || 1, false);
  setDigital(!!settings.showDigital);
  if (settings.editMode) setEditMode(true);
  else if (settings.widgetMode) setWidgetMode(true, false);
  else applySize(settings.size || "full");
  requestAnimationFrame(() => {
    startAnimation();
    const wrap = select(".gsapWrapper");
    if (wrap && !reduceMotion) {
      gsap.fromTo(wrap, { autoAlpha: 0, scale: 0.96 }, {
        duration: 0.65, autoAlpha: 1, scale: 1, ease: "power3.out", delay: 0.05
      });
    } else if (wrap) gsap.set(wrap, { autoAlpha: 1 });
    if (settings.openSettingsOnLaunch === true) setTimeout(() => openSettings(), 500);
    if (!sec || !min || !hr) showToast("Full SVG missing — run Actions → Build Full Spider Clock", 6000);
  });
  setInterval(updateDigital, 1000);
  updateDigital();
};

function startAnimation() {
  if (!sec || !min || !hr) {
    gsap.set([".gsapWrapper", ".vline"], { autoAlpha: 1 });
    return;
  }
  setTimeSec();
  setTimeMinHr();
  gsap.set(".vline", { autoAlpha: 1 });

  gsap.to(".cw.t24", {
    duration: 24, rotation: "-=360", transformOrigin: "50% 50%", ease: "none", repeat: -1
  });
  gsap.to(".cw.t20", {
    duration: 18, rotation: "-=360", transformOrigin: "50% 50%", ease: "none", repeat: -1
  });
  gsap.to(".ccw.t12", {
    duration: 12, rotation: "+=360", transformOrigin: "50% 50%", ease: "none", repeat: -1
  });
  if (select("#body")) {
    gsap.to("#body", {
      duration: 1.8, scale: 1.06, transformOrigin: "50% 50%",
      yoyo: true, repeat: -1, ease: "sine.inOut"
    });
  }
  if (select("#face")) {
    gsap.to("#face", {
      duration: 0.12, scaleY: 0.82, transformOrigin: "50% 60%",
      yoyo: true, repeat: 1, repeatDelay: 4.5, ease: "power1.inOut",
      onComplete: function () { this.delay(gsap.utils.random(3, 7)).restart(true); }
    });
  }
  gsap.to(min, {
    duration: 0.55, rotation: getMinRotation, transformOrigin: "50% 50%", ease: "power2.out",
    onComplete: function () {
      if (gsap.getProperty(min, "rotation") >= 360) gsap.set(min, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(2).restart(true);
    }
  });
  gsap.to(hr, {
    duration: 0.55, rotation: getHrRotation, transformOrigin: "50% 50%", ease: "power2.out",
    onComplete: function () {
      if (gsap.getProperty(hr, "rotation") >= 360) gsap.set(hr, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(2).restart(true);
    }
  });
  gsap.to(sec, {
    duration: 0.42, rotation: geSecRotation, transformOrigin: "50% 50%", ease: "elastic.out(1, 0.55)",
    onComplete: function () {
      setTimeSec();
      if (gsap.getProperty(sec, "rotation") >= 360) gsap.set(sec, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(0).restart(true);
    }
  });

  if (hasMorph && face01 && face02) {
    let tg0 = gsap.timeline({ repeat: -1, repeatDelay: 5, defaults: { duration: 0.5, ease: "power1.out" } })
      .to("#face", {
        morphSVG: "#face02", repeat: 4, yoyo: true,
        onComplete() { tg0.repeatDelay(gsap.utils.random(4, 8, 0.25)); }
      });
  }

  function setTimeSec() {
    const rot = geSecRotation();
    const cur = gsap.getProperty(sec, "rotation") || 0;
    if (Math.abs(cur - rot) > 15)
      gsap.to(sec, { duration: 0.4, rotation: rot, transformOrigin: "50% 50%", ease: "power2.out" });
    else gsap.set(sec, { rotation: rot, transformOrigin: "50% 50%" });
  }
  function setTimeMinHr() {
    gsap.set(min, { rotation: getMinRotation, transformOrigin: "50% 50%" });
    gsap.set(hr, { rotation: getHrRotation, transformOrigin: "50% 50%" });
  }
  function geSecRotation() {
    let rotation = new Date().getSeconds() * 6;
    let scaleXSec = gsap.getProperty(sec, "scaleX") || 1;
    if (Math.abs((gsap.getProperty(sec, "rotation") || 0) - rotation) >= 12)
      gsap.to(sec, { duration: 0.35, rotation: rotation, transformOrigin: "50% 50%", ease: "power2.out" });
    if ((rotation >= 180 && rotation < 360) && scaleXSec == 1)
      gsap.to(sec, { scaleX: -1, duration: 0.3, ease: "power1.inOut" });
    else if ((rotation < 180 || rotation >= 360) && scaleXSec == -1)
      gsap.to(sec, { scaleX: 1, duration: 0.3, ease: "power1.inOut" });
    return rotation;
  }
  function getMinRotation() {
    let d = new Date();
    let rotation = d.getMinutes() * 6 + d.getSeconds() * 6 / 59;
    let scaleXMin = gsap.getProperty(min, "scaleX") || 1;
    if (Math.abs((gsap.getProperty(min, "rotation") || 0) - rotation) >= 5)
      gsap.to(min, { duration: 0.4, rotation: rotation, transformOrigin: "50% 50%", ease: "power2.out" });
    if ((rotation >= 180 && rotation < 360) && scaleXMin == 1)
      gsap.to(min, { scaleX: -1, duration: 0.3, ease: "power1.inOut" });
    else if ((rotation < 180 || rotation >= 360) && scaleXMin == -1)
      gsap.to(min, { scaleX: 1, duration: 0.3, ease: "power1.inOut" });
    return rotation;
  }
  function getHrRotation() {
    let d = new Date();
    let rotation = (d.getHours() % 12) * 30 + d.getMinutes() * 0.5;
    let scaleHr = gsap.getProperty(hr, "scaleX") || 1;
    if (Math.abs((gsap.getProperty(hr, "rotation") || 0) - rotation) >= 5)
      gsap.to(hr, { duration: 0.4, rotation: rotation, transformOrigin: "50% 50%", ease: "power2.out" });
    if ((rotation >= 180 && rotation < 360) && scaleHr == 1)
      gsap.to(hr, { scaleX: -1, duration: 0.3, ease: "power1.inOut" });
    else if ((rotation < 180 || rotation >= 360) && scaleHr == -1)
      gsap.to(hr, { scaleX: 1, duration: 0.3, ease: "power1.inOut" });
    return rotation;
  }
}
