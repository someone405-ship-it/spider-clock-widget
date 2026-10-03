/* Mobile native bridge — full spider clock as floating widget / PiP */
(function () {
  function native() {
    return typeof window.SpiderNative !== "undefined" ? window.SpiderNative : null;
  }

  function addMobileButtons() {
    var n = native();
    if (!n) return;

    var row = document.querySelector(".btn-row");
    if (!row || document.getElementById("btnFloat")) return;

    var floatBtn = document.createElement("button");
    floatBtn.type = "button";
    floatBtn.className = "btn btn-widget";
    floatBtn.id = "btnFloat";
    floatBtn.textContent = "Float full clock";
    floatBtn.title = "Open animated spider+gears in a floating window";
    floatBtn.addEventListener("click", function () {
      try {
        n.openFloatingWidget();
        if (typeof showToast === "function") showToast("Floating spider clock opened");
      } catch (e) {
        console.error(e);
      }
    });
    row.appendChild(floatBtn);

    var pipBtn = document.createElement("button");
    pipBtn.type = "button";
    pipBtn.className = "btn btn-edit";
    pipBtn.id = "btnPip";
    pipBtn.textContent = "Picture-in-picture";
    pipBtn.title = "Shrink the full animated clock to a corner";
    pipBtn.addEventListener("click", function () {
      try {
        n.enterPip();
        if (typeof showToast === "function") showToast("PiP — full animation stays on screen");
      } catch (e) {
        console.error(e);
      }
    });
    row.appendChild(pipBtn);
  }

  function tryAdd() {
    addMobileButtons();
  }

  if (document.readyState === "complete") setTimeout(tryAdd, 600);
  else window.addEventListener("load", function () { setTimeout(tryAdd, 800); });
  // Settings may open later — observe
  setInterval(tryAdd, 2000);
})();
