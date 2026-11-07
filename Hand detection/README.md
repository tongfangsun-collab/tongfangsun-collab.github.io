# Origami Pokémon — Hand Gesture & Two-Hand Zoom Prototype

An interactive web prototype powered by **Google MediaPipe HandLandmarker** (`@mediapipe/tasks-vision`) with a real-time 2D/3D Origami Unfold & Step-by-Step Fold animation engine.

## Files in this Folder (`/Users/SamuelSun/Downloads/Hand detection`)

- `index.html` — Self-contained entry page (also works standalone).
- `style.css` — Stylesheet for the origami stage and minimal HUD.
- `app.js` — MediaPipe HandLandmarker logic & multi-stage origami folding engine.
- `start.command` — Double-click launcher for macOS (starts a local server on port `8080` and opens your browser).
- `图1.jpg` / `图1.png` / `pikachu.jpg` — Origami Pikachu image.
- `图2.jpg` / `图2.png` / `raichu.jpg` — Origami Raichu image.
- `图3.jpg` / `图3.png` / `eevee.jpg` — Origami Eevee image.

## How to Run Locally

### Option 1: Double-Click Launcher (macOS)
Double-click **`start.command`** in Finder. It will automatically start a local server at `http://localhost:8080` and open your browser.

### Option 2: Terminal Command
Run the following in Terminal from this folder:
```bash
python3 -m http.server 8080
```
Then open **http://localhost:8080** in Chrome, Edge, or Safari.

## Hand Gesture Controls
- **✊ Rock (Fist)** — Fold into **Pikachu** (`图1.jpg`)
- **✌️ Scissors** — Fold into **Eevee** (`图3.jpg`)
- **🖐️ Paper (Open Palm)** — Fold into **Raichu** (`图2.jpg`)
- **🙌 Two Hands (Spread / Pinch)** — **Zoom In / Out** (`50%` – `175%`)
- **Press `H`** — Hide/Show the bottom legend bar for a pure image view.
