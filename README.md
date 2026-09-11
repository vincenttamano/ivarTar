# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

IVARtar

IVARtar is a React turn-based elemental battle game controlled by webcam hand gestures. It uses a Teachable Machine image classification model to recognize battle moves.

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

## Gameplay Defaults

- Players start at Level 1 with 100 HP and 3 Energy.
- Energy regenerates by 1 after each turn, up to the level maximum.
- Basic Attack costs 1 Energy and deals 10 base damage.
- Special Attack costs 2 Energy and deals 20 base damage.
- Basic Defend reduces incoming damage by 50% for the turn.
- Special Defend reduces incoming damage by 80% for the turn.
- Ultimate costs 3 Energy, deals 35 damage, and ignores defense.
- Fire, Water, Air, and Earth use the configured elemental matchups.
- IVARtar is currently neutral against every element.

## Production Build

Build the app:

```bash
npm run build
```

The generated files are placed in `dist/`. Deploy that folder with HTTPS so browsers can grant webcam access.

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
