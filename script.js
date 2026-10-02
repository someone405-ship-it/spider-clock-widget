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
  try { gsap.registerPlugin(MorphSVGPlugin); } catch (e) { console.warn("MorphSVG not available"); }
}

const STORAGE_KEY = "spiderClockSettings_v2";
const defaultSettings = {
  size: "full",
  widgetMode: false,
  openSettingsOnLaunch: true,
  posX: null,
  posY: null,
  scale: 1
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
let isAnimatingLayout = false;

function clampScale(v) {
  return Math.min(2.5, Math.max(0.35, Number(v) || 1));
}

function applyScale(scale, animate) {
  settings.scale = clampScale(scale);
  const body = select("#wBody");
  if (!body) return;
  if (animate) {
    gsap.to(body, { duration: 0.25, scale: settings.scale, transformOrigin: "50% 50%", ease: "power2.out" });
  } else {
    gsap.set(body, { scale: settings.scale, transformOrigin: "50% 50%" });
  }
  const slider = select("#scaleSlider");
  const label = select("#scaleLabel");
  if (slider) slider.value = settings.scale;
  if (label) label.textContent = Math.round(settings.scale * 100) + "%";
  saveSettings(settings);
}

function applySize(size) {
  document.body.classList.remove("size-small", "size-medium", "size-large", "size-full");
  document.body.classList.add("size-" + (size || "full"));
  settings.size = size || "full";
  saveSettings(settings);
}

function setWidgetMode(on, animate) {
  settings.widgetMode = !!on;
  const wrap = select(".gsapWrapper");
  const body = document.body;

  if (on) {
    applySize("small");
    body.classList.add("widget-mode");
    if (wrap) {
      const targetX = settings.posX != null ? settings.posX : 40;
      const targetY = settings.posY != null ? settings.posY : 40;
      wrap.style.position = "fixed";
      wrap.style.zIndex = "50";
      wrap.style.pointerEvents = "";
      if (animate) {
        const rect = wrap.getBoundingClientRect();
        gsap.fromTo(wrap,
          { left: rect.left, top: rect.top },
          {
            duration: 0.5,
            ease: "power3.inOut",
            left: targetX,
            top: targetY,
            onComplete: () => {
              wrap.style.left = targetX + "px";
              wrap.style.top = targetY + "px";
            }
          }
        );
      } else {
        wrap.style.left = targetX + "px";
        wrap.style.top = targetY + "px";
      }
    }
  } else {
    body.classList.remove("widget-mode");
    applySize(settings.size === "small" ? "full" : settings.size);
    if (wrap) {
      if (animate) {
        gsap.to(wrap, {
          duration: 0.45,
          ease: "power3.inOut",
          left: window.innerWidth / 2 - 100,
          top: window.innerHeight / 2 - 100,
          onComplete: () => {
            wrap.style.position = "";
            wrap.style.left = "";
            wrap.style.top = "";
            wrap.style.zIndex = "";
          }
        });
      } else {
        wrap.style.position = "";
        wrap.style.left = "";
        wrap.style.top = "";
        wrap.style.zIndex = "";
      }
    }
  }
  saveSettings(settings);
  const wc = select("#widgetCheck");
  if (wc) wc.checked = !!on;
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

    const handle = document.createElement("div");
    handle.className = "resize-handle";
    handle.title = "Drag to scale";
    wrap.appendChild(handle);
    initResize(handle);
  }

  const overlay = document.createElement("div");
  overlay.className = "settings-overlay";
  overlay.id = "settingsOverlay";
  overlay.innerHTML = `
    <div class="settings-card" id="settingsCard">
      <h1>🕷️ Spider Clock</h1>
      <p class="subtitle">Settings & live preview</p>
      <div class="preview-box" id="previewBox">
        <div class="preview-label">Live preview</div>
      </div>
      <div class="setting-row">
        <label for="sizeSelect">Preset size</label>
        <select id="sizeSelect">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="full">Full</option>
        </select>
      </div>
      <div class="setting-row scale-row">
        <label for="scaleSlider">Scale <span id="scaleLabel">100%</span></label>
        <input type="range" id="scaleSlider" min="0.35" max="2.5" step="0.05" value="1">
      </div>
      <div class="setting-row">
        <label for="widgetCheck">Widget mode (drag + scale on PC)</label>
        <input type="checkbox" id="widgetCheck">
      </div>
      <div class="setting-row">
        <label for="launchCheck">Show settings on open</label>
        <input type="checkbox" id="launchCheck">
      </div>
      <div class="btn-row">
        <button type="button" class="btn btn-primary" id="btnFull">Open full clock</button>
        <button type="button" class="btn btn-widget" id="btnWidget">Start as widget</button>
        <button type="button" class="btn btn-secondary" id="btnClose">Close</button>
      </div>
      <p class="hint">PC: Scroll wheel over the clock to scale · drag corner handle in widget mode · drag to move.<br>
      Mobile: Add to Home Screen for an app-like experience.</p>
    </div>
  `;
  document.body.appendChild(overlay);

  const sizeSelect = select("#sizeSelect");
  const widgetCheck = select("#widgetCheck");
  const launchCheck = select("#launchCheck");
  const scaleSlider = select("#scaleSlider");

  sizeSelect.value = settings.size || "full";
  widgetCheck.checked = !!settings.widgetMode;
  launchCheck.checked = settings.openSettingsOnLaunch !== false;
  scaleSlider.value = settings.scale || 1;
  select("#scaleLabel").textContent = Math.round((settings.scale || 1) * 100) + "%";

  sizeSelect.addEventListener("change", () => {
    if (!settings.widgetMode) applySize(sizeSelect.value);
    else settings.size = sizeSelect.value;
    saveSettings(settings);
  });
  scaleSlider.addEventListener("input", () => applyScale(scaleSlider.value, false));
  widgetCheck.addEventListener("change", () => setWidgetMode(widgetCheck.checked, true));
  launchCheck.addEventListener("change", () => {
    settings.openSettingsOnLaunch = launchCheck.checked;
    saveSettings(settings);
  });

  select("#btnFull").addEventListener("click", () => {
    closeSettings(true, () => {
      setWidgetMode(false, true);
      applySize(sizeSelect.value);
    });
  });
  select("#btnWidget").addEventListener("click", () => {
    closeSettings(true, () => setWidgetMode(true, true));
  });
  select("#btnClose").addEventListener("click", () => closeSettings(true));
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeSettings(true);
  });

  if (wrap) {
    wrap.addEventListener("wheel", (e) => {
      if (document.body.classList.contains("settings-open")) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.06 : 0.06;
      applyScale((settings.scale || 1) + delta, true);
    }, { passive: false });
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
    gsap.fromTo(overlay, { autoAlpha: 0 }, { duration: 0.3, autoAlpha: 1, ease: "power2.out" });
    overlay.classList.add("open");
  }
  if (card) {
    gsap.fromTo(card,
      { scale: 0.94, y: 20, autoAlpha: 0 },
      { duration: 0.4, scale: 1, y: 0, autoAlpha: 1, ease: "power3.out" }
    );
  }

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
        duration: 0.5,
        ease: "power3.inOut",
        left: to.left,
        top: to.top,
        width: to.width,
        height: to.height,
        onComplete: () => { isAnimatingLayout = false; }
      });
      gsap.set(wrap, { autoAlpha: 1 });
    });
  } else {
    isAnimatingLayout = false;
  }
}

function closeSettings(force, after) {
  if (isAnimatingLayout && !force) return;
  isAnimatingLayout = true;

  const overlay = select("#settingsOverlay");
  const card = select("#settingsCard");
  const wrap = select(".gsapWrapper");

  if (card) gsap.to(card, { duration: 0.22, scale: 0.96, y: 10, autoAlpha: 0, ease: "power2.in" });
  if (overlay) {
    gsap.to(overlay, {
      duration: 0.28,
      autoAlpha: 0,
      ease: "power2.in",
      onComplete: () => {
        overlay.classList.remove("open");
        document.body.classList.remove("settings-open");
      }
    });
  }

  if (wrap) {
    let targetLeft, targetTop, targetW;

    if (settings.widgetMode) {
      targetLeft = settings.posX != null ? settings.posX : 40;
      targetTop = settings.posY != null ? settings.posY : 40;
      targetW = Math.min(window.innerWidth, window.innerHeight) * 0.22 * (settings.scale || 1);
      targetW = Math.max(80, Math.min(targetW, 220));
    } else {
      const sizeMap = { small: 180, medium: 280, large: 420, full: 500 };
      targetW = Math.min(sizeMap[settings.size] || 500, window.innerWidth * 0.85, window.innerHeight * 0.85);
      targetLeft = (window.innerWidth - targetW) / 2;
      targetTop = (window.innerHeight - targetW) / 2;
    }

    gsap.to(wrap, {
      duration: 0.5,
      ease: "power3.inOut",
      left: targetLeft,
      top: targetTop,
      width: targetW,
      height: targetW,
      onComplete: () => {
        if (settings.widgetMode) {
          wrap.style.position = "fixed";
          wrap.style.left = targetLeft + "px";
          wrap.style.top = targetTop + "px";
          wrap.style.width = "auto";
          wrap.style.height = "auto";
          wrap.style.zIndex = "50";
          wrap.style.pointerEvents = "";
        } else {
          wrap.style.position = "";
          wrap.style.left = "";
          wrap.style.top = "";
          wrap.style.width = "";
          wrap.style.height = "";
          wrap.style.zIndex = "";
          wrap.style.pointerEvents = "";
        }
        isAnimatingLayout = false;
        if (typeof after === "function") after();
      }
    });
  } else {
    isAnimatingLayout = false;
    if (typeof after === "function") after();
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
    if (e.target && e.target.classList && e.target.classList.contains("resize-handle")) return;
    if (isAnimatingLayout) return;
    dragging = true;
    wrap.classList.add("dragging");
    gsap.killTweensOf(wrap);
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
    nx = Math.max(0, Math.min(window.innerWidth - 48, nx));
    ny = Math.max(0, Math.min(window.innerHeight - 48, ny));
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

function initResize(handle) {
  let resizing = false;
  let startY = 0;
  let startScale = 1;

  function onDown(e) {
    if (!document.body.classList.contains("widget-mode")) return;
    if (document.body.classList.contains("settings-open")) return;
    resizing = true;
    const pt = e.touches ? e.touches[0] : e;
    startY = pt.clientY;
    startScale = settings.scale || 1;
    e.preventDefault();
    e.stopPropagation();
  }

  function onMove(e) {
    if (!resizing) return;
    const pt = e.touches ? e.touches[0] : e;
    const dy = startY - pt.clientY;
    applyScale(startScale + dy / 120, false);
  }

  function onUp() {
    resizing = false;
  }

  handle.addEventListener("mousedown", onDown);
  handle.addEventListener("touchstart", onDown, { passive: false });
  window.addEventListener("mousemove", onMove);
  window.addEventListener("touchmove", onMove, { passive: false });
  window.addEventListener("mouseup", onUp);
  window.addEventListener("touchend", onUp);
}

window.onload = function () {
  createUI();
  initDrag();
  applyScale(settings.scale || 1, false);

  if (settings.widgetMode) setWidgetMode(true, false);
  else applySize(settings.size || "full");

  requestAnimationFrame(() => {
    startAnimation();
    const wrap = select(".gsapWrapper");
    if (wrap) {
      gsap.fromTo(wrap, { autoAlpha: 0, scale: 0.96 }, {
        duration: 0.65,
        autoAlpha: 1,
        scale: 1,
        ease: "power3.out",
        delay: 0.05
      });
    }
    if (settings.openSettingsOnLaunch !== false) {
      setTimeout(() => openSettings(), 500);
    }
  });
};

function startAnimation() {
  if (!sec || !min || !hr) {
    console.warn("Spider Clock: run Actions → Build Full Spider Clock for the complete SVG.");
    gsap.set([".gsapWrapper", ".vline"], { autoAlpha: 1 });
    return;
  }

  setTimeSec();
  setTimeMinHr();
  gsap.set(".vline", { autoAlpha: 1 });

  gsap.to(".cw.t24", {
    duration: 1.2, rotation: "-=15", transformOrigin: "50% 50%", ease: "power1.inOut",
    onComplete: function () { this.invalidate().delay(0.8).restart(true); }
  });
  gsap.to(".cw.t20", {
    duration: 1.2, rotation: "-=18", transformOrigin: "50% 50%", ease: "power1.inOut",
    onComplete: function () { this.invalidate().delay(0.8).restart(true); }
  });
  gsap.to(".ccw.t12", {
    duration: 1.2, rotation: "+=30", transformOrigin: "50% 50%", ease: "power1.inOut",
    onComplete: function () { this.invalidate().delay(0.8).restart(true); }
  });

  gsap.to(min, {
    duration: 0.6, rotation: getMinRotation, transformOrigin: "50% 50%", ease: "power1.out",
    onComplete: function () {
      if (gsap.getProperty(min, "rotation") >= 360)
        gsap.set(min, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(4).restart(true);
    }
  });

  gsap.to(hr, {
    duration: 0.6, rotation: getHrRotation, transformOrigin: "50% 50%", ease: "power1.out",
    onComplete: function () {
      if (gsap.getProperty(hr, "rotation") >= 360)
        gsap.set(hr, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(4).restart(true);
    }
  });

  gsap.to(sec, {
    duration: 0.35, rotation: geSecRotation, transformOrigin: "50% 50%", ease: "power1.out",
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
      repeat: -1, repeatDelay: 5, defaults: { duration: 1.5, ease: "power2.inOut" }
    }).delay(delaySec)
      .call(() => {
        let rotation = parseFloat(gsap.getProperty(handEl, "rotation").toFixed(1));
        const inRange =
          (rotation > ranges[0] && rotation < ranges[1]) ||
          (rotation > ranges[2] && rotation < ranges[3]);
        if (inRange) {
          gsap.timeline({ defaults: { duration: 0.3, ease: "power2.inOut" } })
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
    const rot = geSecRotation();
    const cur = gsap.getProperty(sec, "rotation") || 0;
    if (Math.abs(cur - rot) > 15) {
      gsap.to(sec, { duration: 0.4, rotation: rot, transformOrigin: "50% 50%", ease: "power2.out" });
    } else {
      gsap.set(sec, { rotation: rot, transformOrigin: "50% 50%" });
    }
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
    if (difference >= 12) {
      gsap.to(sec, { duration: 0.35, rotation: rotation, transformOrigin: "50% 50%", ease: "power2.out" });
    }
    if ((rotation >= 180 && rotation < 360) && scaleXSec == 1)
      gsap.to(sec, { scaleX: -1, duration: 0.3, ease: "power1.inOut" });
    else if ((rotation < 180 || rotation >= 360) && scaleXSec == -1)
      gsap.to(sec, { scaleX: 1, duration: 0.3, ease: "power1.inOut" });
    return rotation;
  }

  function getMinRotation() {
    let newDateTime = new Date();
    let rotation = newDateTime.getMinutes() * 6 + newDateTime.getSeconds() * 6 / 59;
    let scaleXMin = gsap.getProperty(min, "scaleX") || 1;
    let difference = Math.abs((gsap.getProperty(min, "rotation") || 0) - rotation);
    if (difference >= 5)
      gsap.to(min, { duration: 0.4, rotation: rotation, transformOrigin: "50% 50%", ease: "power2.out" });
    if ((rotation >= 180 && rotation < 360) && scaleXMin == 1)
      gsap.to(min, { scaleX: -1, duration: 0.3, ease: "power1.inOut" });
    else if ((rotation < 180 || rotation >= 360) && scaleXMin == -1)
      gsap.to(min, { scaleX: 1, duration: 0.3, ease: "power1.inOut" });
    return rotation;
  }

  function getHrRotation() {
    let newDateTime = new Date();
    let rotation = (newDateTime.getHours() % 12) * 30 + newDateTime.getMinutes() * 0.5;
    let scaleHr = gsap.getProperty(hr, "scaleX") || 1;
    let difference = Math.abs((gsap.getProperty(hr, "rotation") || 0) - rotation);
    if (difference >= 5)
      gsap.to(hr, { duration: 0.4, rotation: rotation, transformOrigin: "50% 50%", ease: "power2.out" });
    if ((rotation >= 180 && rotation < 360) && scaleHr == 1)
      gsap.to(hr, { scaleX: -1, duration: 0.3, ease: "power1.inOut" });
    else if ((rotation < 180 || rotation >= 360) && scaleHr == -1)
      gsap.to(hr, { scaleX: 1, duration: 0.3, ease: "power1.inOut" });
    return rotation;
  }
}
