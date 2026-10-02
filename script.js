let select = e => document.querySelector(e);
let selectAll = e => document.querySelectorAll(e);

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
  try { gsap.registerPlugin(MorphSVGPlugin); } catch (e) { console.warn("MorphSVG not available"); }
}

const STORAGE_KEY = "spiderClockSettings";
const defaultSettings = {
  size: "full",
  widgetMode: false,
  openSettingsOnLaunch: true,
  posX: null,
  posY: null
};

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(s) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

let settings = loadSettings();

function applySize(size) {
  document.body.classList.remove("size-small", "size-medium", "size-large", "size-full");
  document.body.classList.add("size-" + (size || "full"));
  settings.size = size || "full";
  saveSettings(settings);
}

function setWidgetMode(on) {
  settings.widgetMode = !!on;
  document.body.classList.toggle("widget-mode", !!on);
  if (on) {
    applySize("small");
    const wrap = select(".gsapWrapper");
    if (wrap && settings.posX != null && settings.posY != null) {
      wrap.style.left = settings.posX + "px";
      wrap.style.top = settings.posY + "px";
    }
  } else {
    applySize(settings.size === "small" ? "full" : settings.size);
    const wrap = select(".gsapWrapper");
    if (wrap) {
      wrap.style.left = "";
      wrap.style.top = "";
    }
  }
  saveSettings(settings);
}

function createUI() {
  const btn = document.createElement("button");
  btn.className = "settings-btn";
  btn.title = "Settings";
  btn.setAttribute("aria-label", "Settings");
  btn.innerHTML = "⚙";
  btn.addEventListener("click", () => openSettings());
  document.body.appendChild(btn);

  const wrap = select(".gsapWrapper");
  if (wrap) {
    const bar = document.createElement("div");
    bar.className = "drag-bar";
    wrap.appendChild(bar);
  }

  const overlay = document.createElement("div");
  overlay.className = "settings-overlay";
  overlay.id = "settingsOverlay";
  overlay.innerHTML = `
    <div class="settings-card">
      <h1>🕷️ Spider Clock</h1>
      <p class="subtitle">Settings & live preview</p>
      <div class="preview-box" id="previewBox">
        <div class="preview-label">Live preview</div>
      </div>
      <div class="setting-row">
        <label for="sizeSelect">Clock size</label>
        <select id="sizeSelect">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="full">Full</option>
        </select>
      </div>
      <div class="setting-row">
        <label for="widgetCheck">Widget mode (small + drag on PC)</label>
        <input type="checkbox" id="widgetCheck">
      </div>
      <div class="setting-row">
        <label for="launchCheck">Show settings when opening app</label>
        <input type="checkbox" id="launchCheck">
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btnFull">Open full clock</button>
        <button class="btn btn-widget" id="btnWidget">Start as widget</button>
        <button class="btn btn-secondary" id="btnClose">Close</button>
      </div>
      <p class="hint">PC: Widget mode lets you drag the small clock around the screen.<br>
      Mobile: Add to Home Screen, then use settings for size.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const sizeSelect = select("#sizeSelect");
  const widgetCheck = select("#widgetCheck");
  const launchCheck = select("#launchCheck");

  sizeSelect.value = settings.size || "full";
  widgetCheck.checked = !!settings.widgetMode;
  launchCheck.checked = settings.openSettingsOnLaunch !== false;

  sizeSelect.addEventListener("change", () => {
    if (!settings.widgetMode) applySize(sizeSelect.value);
    else settings.size = sizeSelect.value;
    saveSettings(settings);
  });
  widgetCheck.addEventListener("change", () => setWidgetMode(widgetCheck.checked));
  launchCheck.addEventListener("change", () => {
    settings.openSettingsOnLaunch = launchCheck.checked;
    saveSettings(settings);
  });

  select("#btnFull").addEventListener("click", () => {
    setWidgetMode(false);
    applySize(sizeSelect.value);
    closeSettings();
  });
  select("#btnWidget").addEventListener("click", () => {
    setWidgetMode(true);
    closeSettings();
  });
  select("#btnClose").addEventListener("click", () => closeSettings());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSettings();
  });
}

function openSettings() {
  document.body.classList.add("settings-open");
  const overlay = select("#settingsOverlay");
  if (overlay) overlay.classList.add("open");

  const box = select("#previewBox");
  const wrap = select(".gsapWrapper");
  if (box && wrap) {
    const r = box.getBoundingClientRect();
    wrap.style.position = "fixed";
    wrap.style.width = r.width + "px";
    wrap.style.height = r.height + "px";
    wrap.style.left = r.left + "px";
    wrap.style.top = r.top + "px";
    wrap.style.zIndex = "210";
    wrap.style.pointerEvents = "none";
    gsap.set(wrap, { autoAlpha: 1 });
  }
}

function closeSettings() {
  document.body.classList.remove("settings-open");
  const overlay = select("#settingsOverlay");
  if (overlay) overlay.classList.remove("open");

  const wrap = select(".gsapWrapper");
  if (wrap) {
    if (settings.widgetMode) {
      wrap.style.position = "fixed";
      wrap.style.width = "auto";
      wrap.style.height = "auto";
      wrap.style.zIndex = "50";
      wrap.style.pointerEvents = "";
      if (settings.posX != null) wrap.style.left = settings.posX + "px";
      if (settings.posY != null) wrap.style.top = settings.posY + "px";
    } else {
      wrap.style.position = "";
      wrap.style.width = "";
      wrap.style.height = "";
      wrap.style.left = "";
      wrap.style.top = "";
      wrap.style.zIndex = "";
      wrap.style.pointerEvents = "";
    }
  }
}

function initDrag() {
  const wrap = select(".gsapWrapper");
  if (!wrap) return;

  let dragging = false;
  let startX = 0, startY = 0, origLeft = 0, origTop = 0;

  function onDown(e) {
    if (!document.body.classList.contains("widget-mode")) return;
    if (document.body.classList.contains("settings-open")) return;
    dragging = true;
    wrap.classList.add("dragging");
    const pt = e.touches ? e.touches[0] : e;
    startX = pt.clientX;
    startY = pt.clientY;
    const rect = wrap.getBoundingClientRect();
    origLeft = rect.left;
    origTop = rect.top;
    e.preventDefault();
  }

  function onMove(e) {
    if (!dragging) return;
    const pt = e.touches ? e.touches[0] : e;
    let nx = origLeft + (pt.clientX - startX);
    let ny = origTop + (pt.clientY - startY);
    nx = Math.max(0, Math.min(window.innerWidth - 40, nx));
    ny = Math.max(0, Math.min(window.innerHeight - 40, ny));
    wrap.style.left = nx + "px";
    wrap.style.top = ny + "px";
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove("dragging");
    settings.posX = parseInt(wrap.style.left, 10) || 0;
    settings.posY = parseInt(wrap.style.top, 10) || 0;
    saveSettings(settings);
  }

  wrap.addEventListener("mousedown", onDown);
  wrap.addEventListener("touchstart", onDown, { passive: false });
  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchend", onUp);
}

window.onload = function () {
  createUI();
  initDrag();

  if (settings.widgetMode) setWidgetMode(true);
  else applySize(settings.size || "full");

  requestAnimationFrame(() => {
    startAnimation();
    if (settings.openSettingsOnLaunch !== false) {
      setTimeout(() => openSettings(), 400);
    }
  });
};

function startAnimation() {
  if (!sec || !min || !hr) {
    console.warn("Spider Clock: clock hand elements not found. Run the Actions workflow to build full index.html.");
    gsap.set([".gsapWrapper", ".vline"], { autoAlpha: 1 });
    return;
  }

  setTimeSec();
  setTimeMinHr();
  gsap.set([".gsapWrapper", ".vline"], { autoAlpha: 1 });

  gsap.to(".cw.t24", {
    duration: 1, rotation: "-=15", transformOrigin: "50% 50%", ease: "bounce",
    onComplete: function () { this.invalidate().delay(1).restart(true); }
  });
  gsap.to(".cw.t20", {
    duration: 1, rotation: "-=18", transformOrigin: "50% 50%", ease: "bounce",
    onComplete: function () { this.invalidate().delay(1).restart(true); }
  });
  gsap.to(".ccw.t12", {
    duration: 1, rotation: "+=30", transformOrigin: "50% 50%", ease: "bounce",
    onComplete: function () { this.invalidate().delay(1).restart(true); }
  });

  gsap.to(min, {
    duration: 0.5, rotation: getMinRotation, transformOrigin: "50% 50%", ease: "none",
    onComplete: function () {
      if (gsap.getProperty(min, "rotation") >= 360)
        gsap.set(min, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(5).restart(true);
    }
  });

  gsap.to(hr, {
    duration: 0.5, rotation: getHrRotation, transformOrigin: "50% 50%", ease: "none",
    onComplete: function () {
      if (gsap.getProperty(hr, "rotation") >= 360)
        gsap.set(hr, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(5).restart(true);
    }
  });

  gsap.to(sec, {
    duration: 0.5, rotation: geSecRotation, transformOrigin: "50% 50%", ease: "bounce",
    onComplete: function () {
      setTimeSec();
      if (gsap.getProperty(sec, "rotation") >= 360)
        gsap.set(sec, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(0).restart(true);
    }
  });

  if (hasMorph && face01 && face02) {
    let tg0 = gsap.timeline({
      repeat: -1, repeatDelay: 5, defaults: { duration: 0.5, ease: "power1.out" }
    }).to("#face", {
      morphSVG: "#face02", repeat: 4, yoyo: true,
      onComplete() { tg0.repeatDelay(gsap.utils.random(4, 8, 0.25)); }
    });
  }

  if (hasMorph) {
    createHandMorphTimeline(sec, "#hand-sec", "#handSec01", "#handSec02", 1, [30, 150, 210, 330]);
    createHandMorphTimeline(min, "#hand-min", "#handMin01", "#handMin02", 5, [5, 175, 185, 355]);
    createHandMorphTimeline(hr, "#hand-hr", "#handHr01", "#handHr02", 7, [2, 178, 182, 358]);
  }

  function createHandMorphTimeline(handEl, handSel, path1, path2, delaySec, ranges) {
    let tg = gsap.timeline({
      repeat: -1, repeatDelay: 5, defaults: { duration: 1.5, ease: "bounce" }
    }).delay(delaySec)
      .call(() => {
        let rotation = parseFloat(gsap.getProperty(handEl, "rotation").toFixed(1));
        const inRange =
          (rotation > ranges[0] && rotation < ranges[1]) ||
          (rotation > ranges[2] && rotation < ranges[3]);
        if (inRange) {
          gsap.timeline({ defaults: { duration: 0.25, ease: "bounce.in" } })
            .to(handSel, { morphSVG: path2 })
            .to(handSel, { morphSVG: path1 });
        }
      })
      .set(handEl, {
        onComplete() {
          tg.repeatDelay(gsap.utils.random(6, 10, 0.25));
          tg.delay(0);
        }
      });
  }

  function setTimeSec() {
    gsap.set(sec, { rotation: geSecRotation, transformOrigin: "50% 50%" });
  }
  function setTimeMinHr() {
    gsap.set(min, { rotation: getMinRotation, transformOrigin: "50% 50%" });
    gsap.set(hr, { rotation: getHrRotation, transformOrigin: "50% 50%" });
  }

  function geSecRotation() {
    let seconds = new Date().getSeconds();
    let rotation = seconds * 6;
    let scaleXSec = gsap.getProperty(sec, "scaleX") || 1;
    let difference = Math.abs((gsap.getProperty(sec, "rotation") || 0) - rotation);
    if (difference >= 12) gsap.set(sec, { rotation: rotation, transformOrigin: "50% 50%" });
    if ((rotation >= 180 && rotation < 360) && scaleXSec == 1)
      gsap.to(sec, { scaleX: -1, duration: 0.25 });
    else if ((rotation < 180 || rotation >= 360) && scaleXSec == -1)
      gsap.to(sec, { scaleX: 1, duration: 0.25 });
    return rotation;
  }

  function getMinRotation() {
    let newDateTime = new Date();
    let rotation = newDateTime.getMinutes() * 6 + newDateTime.getSeconds() * 6 / 59;
    let scaleXMin = gsap.getProperty(min, "scaleX") || 1;
    let difference = Math.abs((gsap.getProperty(min, "rotation") || 0) - rotation);
    if (difference >= 5) gsap.set(min, { rotation: rotation, transformOrigin: "50% 50%" });
    if ((rotation >= 180 && rotation < 360) && scaleXMin == 1)
      gsap.to(min, { scaleX: -1, duration: 0.25 });
    else if ((rotation < 180 || rotation >= 360) && scaleXMin == -1)
      gsap.to(min, { scaleX: 1, duration: 0.25 });
    return rotation;
  }

  function getHrRotation() {
    let newDateTime = new Date();
    let rotation = (newDateTime.getHours() % 12) * 30 + newDateTime.getMinutes() * 0.5;
    let scaleHr = gsap.getProperty(hr, "scaleX") || 1;
    let difference = Math.abs((gsap.getProperty(hr, "rotation") || 0) - rotation);
    if (difference >= 5) gsap.set(hr, { rotation: rotation, transformOrigin: "50% 50%" });
    if ((rotation >= 180 && rotation < 360) && scaleHr == 1)
      gsap.to(hr, { scaleX: -1, duration: 0.25 });
    else if ((rotation < 180 || rotation >= 360) && scaleHr == -1)
      gsap.to(hr, { scaleX: 1, duration: 0.25 });
    return rotation;
  }
}
