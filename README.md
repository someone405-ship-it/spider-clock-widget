# 🕷️ Spider Clock Widget — Real Mobile + PC Widget

Looks **exactly** like the Instagram Spider Clock (orange gradient, white spider, rotating gears).

## Mobile (Android / iOS) — “Long press → find & place” style

Because Android home-screen widgets cannot run full GSAP/SVG animations, we made a **PWA** that behaves as close as possible:

1. Open the live page (or host this repo with GitHub Pages).
2. On **Android Chrome**:  
   - Menu (⋮) → **Add to Home screen** / **Install app**  
   - Or long-press the page → Add to Home screen.
3. On **iPhone Safari**: Share → **Add to Home Screen**.
4. The Spider Clock now appears as an app icon on your home screen. Tap it to open the full animated clock (fullscreen, no browser bars).

This is the standard way to get a “widget-like” experience for complex animated clocks.

## PC / Desktop — Drag & place the clock

1. Open `index.html` (or the GitHub Pages link) in Chrome / Edge / Firefox.
2. Click the **Install** / **App available** icon in the address bar (or menu → Install Spider Clock).
3. It opens in its own window.  
   - You can **drag** the window anywhere on your desktop.  
   - Resize it freely.  
   - Pin it / keep it always on top if your OS supports it.

Alternatively just keep the browser tab open and drag the browser window.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Main page + PWA meta (add the full SVG paths from original for complete gears) |
| `style.css` | Exact Instagram gradient + perfect mobile/PC responsive sizing |
| `script.js` | Real-time clock + gear rotation + spider logic |
| `manifest.json` | PWA install config |
| `sw.js` | Offline / install support |

## Get the complete animated SVG (gears + spider)

The full path data is large.  
1. Download: https://raw.githubusercontent.com/piyush-soni777/ps-spider-clock/main/index.html  
2. Copy the entire `<svg id="watchSVG"> ... </svg>` and the hidden `<svg>` with `<defs>` into our `index.html`.  
3. Keep our improved `<head>` (viewport + PWA) and the bottom scripts.

Or use the live demo of the original and view-source.

## Enable free online link (GitHub Pages)

Repo → Settings → Pages → Source = Deploy from a branch → `main` → Save.  
Then share the Pages URL so anyone can Add to Home Screen or Install on PC.

## Credits

Based on the classic Spider Clock / Halloween Spider Time (ikrProjects CodePen + community ports).  
Improved for exact visual match, mobile PWA install, and desktop window experience.

**Repo**: https://github.com/someone405-ship-it/spider-clock-widget
