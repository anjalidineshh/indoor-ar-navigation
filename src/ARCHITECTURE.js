/**
 * ARCHITECTURE: Model-View-Presenter Pattern (Adapted for React)
 * 
 * This follows the MVP architecture similar to ARIndoorNav but optimized for web
 * 
 * MODEL (Data Layer)
 * ├── indoorMap.js        - Building graph structure
 * ├── graph.js            - Location nodes and connections
 * └── algorithms.js       - Pathfinding (NavMesh equivalent)
 * 
 * PRESENTER (Business Logic)
 * ├── pathfinding.js      - Route calculations
 * └── localization.js     - OCR-based user positioning via room-sign scanning
 * 
 * VIEW (UI Components)
 * ├── OCRLocalization.js  - Camera OCR scanning of room name signs (Tesseract.js)
 * ├── ARVisualization.js  - AR line guidance on camera feed
 * ├── FloorPlan.js        - 2D floor overview
 * └── NavigationView.js   - Destination selection & route info
 * 
 * DATA FLOW
 * Scan Room Sign (OCR) → Localization → Get Current Position → 
 * Select Destination → Pathfinding Calculation → 
 * AR Visualization (Line/Arrow) + Floor Plan Update
 */

// ====================
// 1. MODEL LAYER (Data)
// ====================
// Location: src/data/indoorMap.js
// Defines building structure similar to Unity NavMesh
// - Locations = Walkable areas
// - Connections = Corridors/Passages
// - isExit = Emergency exits

// ====================
// 2. PRESENTER LAYER (Logic)
// ====================
// Location: src/logic/pathfinding.js
// Calculates optimal routes (A* / Dijkstra)
// Similar to Unity's NavMesh pathfinding

// Location: src/logic/localization.js (TO CREATE)
// Processes QR codes to determine user position
// Similar to OCR detection in original project

// ====================
// 3. VIEW LAYER (UI)
// ====================
// Location: src/components/
// - OCRLocalization.js    → Room-sign OCR scanning interface
// - ARVisualization.js   → AR overlay with directional line
// - FloorPlan.js         → 2D floor map visualization
// - NavigationView.js    → User interaction & routing

export const ARCHITECTURE = {
  model: ['indoorMap.js', 'graph.js', 'algorithms.js'],
  presenter: ['pathfinding.js', 'localization.js'],
  view: ['OCRLocalization', 'ARVisualization', 'FloorPlan', 'NavigationView'],
  dataFlow: [
    'OCR Room Sign Scan',
    'Localization',
    'Destination Selection',
    'Pathfinding',
    'AR Guidance + Map Update'
  ]
};
