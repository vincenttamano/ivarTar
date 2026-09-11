## IVARtar Arena

IVARtar Arena is a React turn-based elemental battle game controlled by webcam hand gestures. Choose an elemental attunement, read the opponent's state, and chain moves through the camera or the on-screen controls.

The battle HUD keeps the camera, fighter panels, move controls, stickman arena, and combat log inside the browser viewport.

## Requirements

- Node.js 20.19+ or Node.js 22.12+
- npm
- A webcam
- A browser with webcam support, such as Chrome or Edge

Camera access works on `localhost` during development. A deployed version must use HTTPS.

## Installation

Clone the repository and enter the project folder:

```bash
git clone https://github.com/vincenttamano/ivarTar.git
cd ivarTar
```

Install all dependencies:

```bash
npm install
```

The main runtime dependencies are:

- `react` and `react-dom` for the interface
- `@teachablemachine/image` for loading and predicting with the TensorFlow.js model

Development tooling includes Vite, the React Vite plugin, and Oxlint.

## Model Files

The app loads the model from `/model/`. Confirm these files exist in `public/model/`:

```text
public/model/
├── metadata.json
├── model.json
└── weights.bin
```

The current model classes are:

```text
None
Attack
Defend
Ultimate
Special Deffend
Special Attack
```

`None` is treated as neutral and will not lock in a battle move. The app requires a prediction above the confidence threshold to begin its debounce timer.

If gesture detection becomes stuck, use the `Reset` control in the camera header. Manual move buttons remain available when camera access or model loading fails.

## Start Development Server

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

Allow camera access when the browser asks. If the camera is blocked, open the browser site permissions and enable the camera for the local app.

## Available Commands

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build in dist/
npm run preview   # Preview the production build locally
npm run lint      # Run Oxlint
```

## Gameplay

- Spin the attunement wheel to choose Fire, Water, Air, Earth, or the rare IVARtar profile.
- Each element provides Attack, Defend, Special Attack, Special Defend, and Ultimate moves.
- IVARtar can choose one move for each slot from all elemental skill sets before entering the arena.
- Energy is spent when a move is executed and restored at the start of the fighter's turn.
- The Ultimate costs 3 Energy, then recharges over three turns before it can be used again.
- Using an Ultimate automatically ends the current turn after its effects resolve.
- End Turn is available beside the move controls when no further action is needed.

## Responsive Layout

The battle screen is fitted to the browser viewport rather than the document flow. On desktop and tablet, the camera sits beside the User/VS/Enemy stack. On narrow screens, the sections stack vertically and the move controls remain usable without page scrolling.

## Production Build

Build the app:

```bash
npm run build
```

The generated files are placed in `dist/`. Deploy that folder with HTTPS so browsers can grant webcam access.
