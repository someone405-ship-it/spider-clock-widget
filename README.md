# 🕷️ Spider Clock Widget

Real-time Spider Clock that matches the Instagram design (orange gradient, white spider, rotating gears).

Works as a **PWA** on mobile (Add to Home Screen) and as an installable / draggable window on PC.

## ⚡ Get the COMPLETE working file (full SVG + gears)

The full SVG is large, so a **GitHub Actions workflow** downloads it and builds a production-ready `index.html` for you.

### How to run it

1. Go to the repo → **Actions** tab  
2. Select **“Build Full Spider Clock”**  
3. Click **Run workflow** → **Run workflow**  
4. Wait ~30 seconds  
5. The workflow commits a complete `index.html` with all gears + spider paths

After it finishes you can open / download the full `index.html` and it will look exactly like the picture.

You can also trigger it by pushing changes to `style.css` / `script.js`.

## Bugs fixed in this version

- Null-safety: no more crashes if SVG elements are missing
- MorphSVG gracefully degrades when the Club plugin is unavailable
- Removed undeclared `changingHr` variable
- Cleaner GSAP timelines
- Better mobile performance (no `background-attachment: fixed`)
- Touch / tap improvements

## Mobile (Add to Home Screen)

1. Open the page (after workflow has built the full index)
2. Chrome Android → ⋮ → **Add to Home screen** / Install
3. Safari iOS → Share → **Add to Home Screen**

## PC

1. Open the page
2. Install as app (address-bar install icon) → gets its own draggable window
3. Or just keep the browser window open and drag it

## Files

| File | Role |
|------|------|
| `index.html` | Built by the Actions workflow (full SVG) |
| `style.css` | Exact Instagram gradient + responsive |
| `script.js` | Fixed real-time + gear logic |
| `manifest.json` + `sw.js` | PWA / offline |
| `.github/workflows/build-full-index.yml` | Auto-downloads & patches the full clock |

## Enable free online link

Settings → Pages → Deploy from branch `main` → Save.

Repo: https://github.com/someone405-ship-it/spider-clock-widget
