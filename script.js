let select = e => document.querySelector(e);
let selectAll = e => document.querySelectorAll(e);

// Safe getters – won't crash if SVG not fully loaded yet
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

// Only set if elements exist
if (face01) gsap.set("#face", { attr: { d: face01 } });
if (handSec01) gsap.set("#hand-sec", { attr: { d: handSec01 } });
if (handMin01) gsap.set("#hand-min", { attr: { d: handMin01 } });
if (handHr01) gsap.set("#hand-hr", { attr: { d: handHr01 } });

// MorphSVG is a Club GreenSock plugin – register only if available
const hasMorph = typeof MorphSVGPlugin !== "undefined";
if (hasMorph) {
  try { gsap.registerPlugin(MorphSVGPlugin); } catch (e) { console.warn("MorphSVG not available"); }
}

window.onload = function () {
  // Wait a tick so SVG is fully parsed
  requestAnimationFrame(() => startAnimation());
};

function startAnimation() {
  if (!sec || !min || !hr) {
    console.warn("Spider Clock: clock hand elements not found. Make sure full SVG is present.");
    // Still show the wrapper so user sees something
    gsap.set([".gsapWrapper", ".vline"], { autoAlpha: 1 });
    return;
  }

  setTimeSec();
  setTimeMinHr();
  gsap.set([".gsapWrapper", ".vline"], { autoAlpha: 1 });

  // Rotating gears
  gsap.to(".cw.t24", {
    duration: 1,
    rotation: "-=15",
    transformOrigin: "50% 50%",
    ease: "bounce",
    onComplete: function () {
      this.invalidate().delay(1).restart(true);
    }
  });
  gsap.to(".cw.t20", {
    duration: 1,
    rotation: "-=18",
    transformOrigin: "50% 50%",
    ease: "bounce",
    onComplete: function () {
      this.invalidate().delay(1).restart(true);
    }
  });
  gsap.to(".ccw.t12", {
    duration: 1,
    rotation: "+=30",
    transformOrigin: "50% 50%",
    ease: "bounce",
    onComplete: function () {
      this.invalidate().delay(1).restart(true);
    }
  });

  // Minute hand
  gsap.to(min, {
    duration: 0.5,
    rotation: getMinRotation,
    transformOrigin: "50% 50%",
    ease: "none",
    onComplete: function () {
      if (gsap.getProperty(min, "rotation") >= 360)
        gsap.set(min, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(5).restart(true);
    }
  });

  // Hour hand
  gsap.to(hr, {
    duration: 0.5,
    rotation: getHrRotation,
    transformOrigin: "50% 50%",
    ease: "none",
    onComplete: function () {
      if (gsap.getProperty(hr, "rotation") >= 360)
        gsap.set(hr, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(5).restart(true);
    }
  });

  // Second hand
  gsap.to(sec, {
    duration: 0.5,
    rotation: geSecRotation,
    transformOrigin: "50% 50%",
    ease: "bounce",
    onComplete: function () {
      setTimeSec();
      if (gsap.getProperty(sec, "rotation") >= 360)
        gsap.set(sec, { rotation: 0, transformOrigin: "50% 50%" });
      this.invalidate().delay(0).restart(true);
    }
  });

  // Face morph (only if MorphSVG available)
  if (hasMorph && face01 && face02) {
    let tg0 = gsap.timeline({
      repeat: -1,
      repeatDelay: 5,
      defaults: { duration: 0.5, ease: "power1.out" }
    }).to("#face", {
      morphSVG: "#face02",
      repeat: 4,
      yoyo: true,
      onComplete() {
        tg0.repeatDelay(gsap.utils.random(4, 8, 0.25));
      }
    });
  }

  // Occasional hand morphs
  if (hasMorph) {
    createHandMorphTimeline(sec, "#hand-sec", "#handSec01", "#handSec02", 1, [30, 150, 210, 330]);
    createHandMorphTimeline(min, "#hand-min", "#handMin01", "#handMin02", 5, [5, 175, 185, 355]);
    createHandMorphTimeline(hr, "#hand-hr", "#handHr01", "#handHr02", 7, [2, 178, 182, 358]);
  }

  function createHandMorphTimeline(handEl, handSel, path1, path2, delaySec, ranges) {
    let tg = gsap.timeline({
      repeat: -1,
      repeatDelay: 5,
      defaults: { duration: 1.5, ease: "bounce" }
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
    if (difference >= 12)
      gsap.set(sec, { rotation: rotation, transformOrigin: "50% 50%" });

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
    if (difference >= 5)
      gsap.set(min, { rotation: rotation, transformOrigin: "50% 50%" });

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
    if (difference >= 5)
      gsap.set(hr, { rotation: rotation, transformOrigin: "50% 50%" });

    if ((rotation >= 180 && rotation < 360) && scaleHr == 1)
      gsap.to(hr, { scaleX: -1, duration: 0.25 });
    else if ((rotation < 180 || rotation >= 360) && scaleHr == -1)
      gsap.to(hr, { scaleX: 1, duration: 0.25 });

    return rotation;
  }
}
