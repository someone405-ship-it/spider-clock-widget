# 🕷️ Spider Clock Widget

Real-time animated Spider Clock matching the popular Instagram design — orange gradient, white spider, rotating gears.

**Works on mobile and PC.** PWA install · settings with live preview · draggable widget mode · free scale on desktop.

## Features

- Exact Instagram-style look (gradient, spider, gears)
- Real-time hour / minute / second hands
- Smooth layout transitions (no teleporting)
- **Settings** on open with **live preview**
- **PC scale**: mouse wheel over the clock · corner resize handle in widget mode · slider in settings
- **Widget mode**: small floating clock, drag anywhere, transparent background
- Preferences saved in the browser

## Quick start

### 1. Build the full clock (required once)

The complete SVG is large. Build it with GitHub Actions:

1. Open **Actions** → **Build Full Spider Clock**
2. Click **Run workflow** → **Run workflow**
3. Wait ~30 seconds — full `index.html` is committed automatically

### 2. Use it

- Open `index.html` locally, or enable **GitHub Pages** (Settings → Pages → Deploy from `main`)
- **Mobile**: browser menu → Add to Home Screen
- **PC**: Install as app, or use **Start as widget** and drag / scale

## Controls (PC)

| Action | How |
|--------|-----|
| Scale | Scroll wheel on the clock, or drag the corner handle (widget mode), or use the Scale slider in settings |
| Move | Widget mode → drag the clock |
| Settings | ⚙ button |

## Files

| File | Role |
|------|------|
| `index.html` | Built by Actions (full SVG) |
| `style.css` | Theme + responsive + widget UI |
| `script.js` | Clock, settings, drag, scale |
| `manifest.json` / `sw.js` | PWA |
| `.github/workflows/build-full-index.yml` | Downloads & patches full source |

## License / credits

Based on the classic Spider Clock community ports (e.g. ikrProjects / ps-spider-clock). Improved for PWA, settings, smooth motion, and desktop widget use.

**https://github.com/someone405-ship-it/spider-clock-widget**
