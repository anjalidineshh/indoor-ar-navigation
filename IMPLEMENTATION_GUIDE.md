# SafeNav Implementation Guide

## Overview

SafeNav is a web-based indoor navigation prototype for Sri Abhinava Vidyatirtha Block.
It provides:

- Camera-driven indoor guidance
- Graph-based shortest-path routing
- Emergency evacuation to nearest exit
- 2D map fallback and route preview

The current implementation is a single React application (frontend only).

## Current Architecture

### Application Layer

- Framework: React 18 (Create React App)
- Entry point: src/index.js
- Main controller: src/App.js
- Navigation style: in-app state (not react-router)

### Domain Layer

- Graph model: src/logic/graph.js
- Algorithms: src/logic/algorithms.js
- Routing API: src/logic/pathfinding.js
- Building map data: src/data/indoorMap.js

### UI Layer

- Home: src/pages/HomePage.js
- Navigate flow: src/pages/NavigatePage.js
- 2D map: src/pages/MapPage.js
- Help/About: src/pages/GuidePage.js, src/pages/AboutPage.js
- AR overlay and scanning pipeline: src/components/ARVisualization.js

## Routing Logic

### Normal Navigation

- Primary method: A*
- Why: Fast for single source to known destination queries
- Implementation: getRoute(startLocationId, endLocationId, useAstar = true)

### Emergency Evacuation

- Current method: Dijkstra
- Why Dijkstra here:
  - Emergency destination is not fixed beforehand.
  - System must choose nearest exit among multiple exits.
  - Dijkstra guarantees shortest weighted path without heuristic assumptions.
  - For this graph size, runtime is easily acceptable.
- Implementation: getEvacuationRoute(currentLocationId)

### Practical Note

Emergency route currently computes one Dijkstra run per exit candidate, then picks minimum distance.
This is correct and safe for the current graph size.
Future optimization can run one single-source Dijkstra and compare all exits from one pass.

## Indoor Map Model

The building is represented as a weighted, bidirectional graph.

- Node count: 19
- Undirected edge count: 29
- Exit nodes: left_stairs, right_stairs, stairs_right_side

Node metadata includes:

- id
- name
- x, y coordinates
- isExit flag

Edge metadata includes:

- from
- to
- distance (meters, currently estimated unless physically measured)

## Navigation Runtime Flow

### Phase 1: Initial Localization

- Navigate page opens ARVisualization.
- MindAR image-target scanning starts.
- On marker detection, mapped location is resolved from graph and set as current location.

### Phase 2: Destination Selection

- User selects target room.
- Route is computed via getRoute.
- System enters AR guidance mode.

### Phase 3: AR Guidance

- Camera feed is shown with canvas overlay.
- Arrow and floor guidance are rendered relative to next waypoint.
- Device orientation contributes heading updates.
- Pedometer navigator estimates progress between waypoints.

### Phase 4: Emergency Override

- User taps emergency action (or global trigger enabled).
- getEvacuationRoute computes nearest-exit route using Dijkstra.
- UI switches to emergency styling and evacuation guidance.

## Marker and Asset Dependencies

Active scanning path expects MindAR target file at:

- public/markers/targets.mind

If missing, initial marker localization cannot complete as designed.

To generate:

1. Prepare marker images in fixed order matching MARKER_TARGETS in src/components/ARVisualization.js.
2. Compile with MindAR image target compiler.
3. Place output at public/markers/targets.mind.

Additional AR page:

- public/ar.html provides a marker-based AR.js overlay view using a Hiro marker.

## Implemented Safety Features

- Emergency toggle from global navbar
- Nearest-exit route calculation
- Emergency visual state in AR and HUD
- Alarm asset available at public/sounds/alarm.mp3

## Project Structure (Relevant)

```text
src/
  App.js
  data/
    indoorMap.js
  logic/
    graph.js
    algorithms.js
    pathfinding.js
    localization.js
    pedometerNav.js
  components/
    ARVisualization.js
    ARVisualizationWebXR.js
    ARThreeScene.js
    ARThreeSceneWebXR.js
    QRLocalization.js
    FloorPlan.js
    NavigationView.js
  pages/
    HomePage.js
    NavigatePage.js
    MapPage.js
    GuidePage.js
    AboutPage.js
public/
  index.html
  ar.html
  sounds/alarm.mp3
```

## Build and Verification

### Commands

```bash
npm install
npm start
npm run build
```

### Current Verification Status

- Build compiles successfully.
- Latest lint warnings related to CameraTest and ARVisualization dependencies were addressed.

## Known Gaps and Clarifications

- No backend API service in current repository.
- Main active localization path is marker-based MindAR in ARVisualization.
- QRLocalization exists as a legacy or alternate OCR-like component and is not the default active flow.
- Some WebXR/Three.js files are experimental and not the default path in App.js.

## Extension Recommendations

1. Add single-pass evacuation optimization (single-source Dijkstra).
2. Replace estimated corridor distances with measured values.
3. Add test coverage for routing correctness and emergency exit selection.
4. Add runtime fallback if targets.mind is absent (for example OCR fallback prompt).
5. Add analytics for average evacuation path length and recalculation count.

## Version

- Document version: 2.0
- Last updated: April 21, 2026
- Status: Active prototype, frontend complete with marker asset setup pending
