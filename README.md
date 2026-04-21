# SafeNav - AR Indoor Navigation (React)

SafeNav is a web-based indoor navigation prototype for Sri Abhinava Vidyatirtha Block. It combines camera-based AR guidance, graph pathfinding (A* and Dijkstra), emergency evacuation routing, and a 2D floor map.

## Current Status (Verified)

- Architecture: Single React app (no backend service in this repo)
- Routing style: In-app page state (not react-router)
- Build status: Production build succeeds with warnings
- Last verified: April 21, 2026

## Features Implemented

- Indoor graph model with named rooms, stairs, exits, and measured edge distances
- Pathfinding:
    - A* for normal navigation
    - Dijkstra for emergency nearest-exit route
- AR navigation flow:
    - Initial marker-based localization using MindAR image targets
    - Camera overlay with direction arrow and compass-style heading
    - Step-progress movement using accelerometer pedometer fallback simulation
- Emergency mode:
    - Global emergency toggle from top navbar
    - Nearest-exit route calculation and emergency UI states
    - Alarm sound asset available in public/sounds/alarm.mp3
- 2D building map view with dynamic route drawing
- Mobile-focused guide and about pages

## Tech Stack

- React 18 (Create React App)
- JavaScript (ES6)
- Three.js (included dependency; parts are experimental)
- MindAR + A-Frame (loaded from CDN at runtime)
- Tesseract.js (legacy OCR component exists)

## Run Locally

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm start
```

App runs at http://localhost:3000

### 3) Create production build

```bash
npm run build
```

## Scripts

- npm start - Run development server
- npm run build - Create optimized production build
- npm test - Run test runner (if tests are added)

## How Navigation Works

1. Open Navigate mode.
2. Camera starts and attempts initial localization using MindAR marker targets.
3. After location detection, user selects destination.
4. Route is computed from indoor graph.
5. AR overlay guides to next waypoint, with pedometer-based progress.
6. Emergency mode can override destination and route to nearest exit.

## Project Structure (Actual)

```text
indoornav/
├── public/
│   ├── index.html
│   ├── ar.html
│   └── sounds/
│       └── alarm.mp3
├── src/
│   ├── App.js
│   ├── data/
│   │   └── indoorMap.js
│   ├── logic/
│   │   ├── graph.js
│   │   ├── algorithms.js
│   │   ├── pathfinding.js
│   │   ├── localization.js
│   │   └── pedometerNav.js
│   ├── components/
│   │   ├── ARVisualization.js
│   │   ├── ARVisualizationWebXR.js
│   │   ├── ARThreeScene.js
│   │   ├── ARThreeSceneWebXR.js
│   │   ├── QRLocalization.js
│   │   ├── FloorPlan.js
│   │   └── NavigationView.js
│   └── pages/
│       ├── HomePage.js
│       ├── NavigatePage.js
│       ├── MapPage.js
│       ├── GuidePage.js
│       └── AboutPage.js
└── package.json
```

## Important Setup Note (Markers)

Current code expects MindAR target file at:

- /markers/targets.mind

This file/folder is not present in this repository snapshot. Without it, marker-based initial localization in ARVisualization cannot complete as designed.

To enable marker localization:

1. Prepare marker images in a fixed order matching MARKER_TARGETS in src/components/ARVisualization.js.
2. Compile them using MindAR compiler tool.
3. Add generated targets.mind to public/markers/targets.mind.

## Known Gaps / Legacy Notes

- README and setup docs were previously describing frontend/backend split; this repo is currently frontend-only.
- QRLocalization.js now performs OCR-style text matching via Tesseract, but main navigation flow currently uses MindAR marker detection.
- WebXR/Three.js files exist but are not the default active flow in App.js.
- Current build shows only lint warnings, no compile errors.

## Academic Context

- Project label in UI: Dept of AI (2023-2027)
- Term shown in UI: Spring 2026
- Prototype focus: indoor safety navigation and evacuation assistance
