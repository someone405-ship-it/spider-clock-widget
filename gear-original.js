/* Restore original gear ticks every second — piyush-soni777 / ikrprojects spider clock */
(function () {
  function applyOriginalGears() {
    if (typeof gsap === "undefined") return false;
    var hasCogs = document.querySelector(".cw.t24") || document.querySelector(".ccw.t12");
    if (!hasCogs) return false;

    // Kill any continuous-spin tweens we may have added earlier
    try {
      gsap.killTweensOf(".cw.t24");
      gsap.killTweensOf(".cw.t20");
      gsap.killTweensOf(".ccw.t12");
    } catch (e) {}

    // Exact original timing: tick 1s, bounce, delay 1s, repeat
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
    return true;
  }

  var tries = 0;
  var t = setInterval(function () {
    tries++;
    if (applyOriginalGears() || tries > 30) clearInterval(t);
  }, 300);
})();
