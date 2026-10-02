# How to get the full working Spider Clock

The **style.css** and **script.js** are already uploaded and optimized for mobile + PC with the exact Instagram orange gradient.

## To complete the widget (2 main files + SVG)

1. Download the full `index.html` from the original high-quality source:
   - https://raw.githubusercontent.com/piyush-soni777/ps-spider-clock/main/index.html
   or from the CodePen export of https://codepen.io/ikrprojects/pen/zxrwywy

2. Replace the `<head>` section with this improved version (already includes viewport for mobile):

```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="description" content="Spider Clock Widget - Real-time animated spider clock with gears. Perfect on mobile and desktop.">
    <title>Spider Clock Widget</title>
    <link rel="stylesheet" href="./style.css">
</head>
```

3. Make sure the scripts at the bottom point to our `script.js` and use the CDN for GSAP.

4. The `style.css` already has perfect responsive rules for phone and PC.

Then open `index.html` — it will look exactly like the picture and work on both mobile and desktop.

You can also enable **GitHub Pages** in the repo settings (Settings → Pages → Deploy from main) for an online link.
