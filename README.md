# AR-Based Smart Indoor Navigation System

A web-based augmented reality indoor navigation and emergency guidance system for complex indoor environments.

## Features

- **QR-Based Localization**: Uses QR codes to determine user's starting position
- **Graph-Based Pathfinding**: Implements Dijkstra and A* algorithms for optimal route calculation
- **AR Visualization**: Real-time directional guidance overlay
- **Emergency Evacuation**: Dynamic safe exit routing
- **React Frontend**: Modern, responsive UI suitable for mobile devices
- **Capacitor Support**: Ready for mobile deployment (iOS/Android)

## System Architecture

The SafeNav system is structured in seven layers. An interactive SVG diagram and full component documentation is available at the in-app **Architecture** page.

```
┌─────────────────────────────────────────────────────────────────┐
│  ① FRONTEND + MOBILE LAYER                                       │
│  React Web (PWA) · iOS/Android (Capacitor) · AR Overlay · Floor │
│  Plan UI · Camera Feed · Navigation View                         │
├─────────────────────────────────────────────────────────────────┤
│  ② MIDDLEWARE LAYER                                              │
│  REST API · WebSocket · MQTT · HTTP/2 Push · JWT Auth            │
├─────────────────────────────────────────────────────────────────┤
│  ③ CLOUD / APPLICATION LAYER                                     │
│  Node.js/Express · Auth Svc · Location Svc · Navigation Svc ·   │
│  Emergency Svc · Analytics Svc                                   │
├─────────────────────────────────────────────────────────────────┤
│  ④ CORE PROCESSING LAYER                                         │
│  A* / Dijkstra Pathfinding · Tesseract.js OCR · Three.js AR ·   │
│  Graph Engine · Sensor Fusion · ArUco / Hiro Marker Detection    │
├─────────────────────────────────────────────────────────────────┤
│  ⑤ DATA LAYER                                                    │
│  Indoor Map DB · Location Graph · User Sessions · Event Logs ·  │
│  Marker Registry · Floor Blueprints                              │
├─────────────────────────────────────────────────────────────────┤
│  ⑥ EMERGENCY SYSTEM                                             │
│  Evacuation Module · Alert Broadcast · Audio Alarm · MQTT ·     │
│  Push Notifications (FCM/APNS)                                   │
├─────────────────────────────────────────────────────────────────┤
│  ⑦ EXTERNAL INTEGRATIONS                                        │
│  Firebase · Google Maps · CDN · BLE Beacons · HVAC · PA System  │
└─────────────────────────────────────────────────────────────────┘
```

### Communication Protocols

| Protocol | Usage |
|---|---|
| REST HTTP/1.1 | Map data, session creation, route queries, event logging |
| WebSocket | Real-time position streaming, live route updates, emergency broadcast |
| MQTT | BLE beacon telemetry, smoke-detector alerts, IoT sensor feeds |
| HTTP/2 Push | Map-update and admin notifications without polling |
| JWT Bearer | API and WebSocket upgrade authentication |

### Primary Data Flow

1. Camera captures room sign / marker → OCR or ArUco detection resolves current location node
2. User selects destination → Navigation Service runs A* / Dijkstra
3. Optimal path returned → WebSocket streams step updates → AR Overlay renders directional arrow
4. Floor Plan UI highlights live route; steps are logged via REST
5. Emergency button or MQTT alert triggers Evacuation Module → nearest exit in < 50 ms
6. WebSocket broadcast + Audio Alarm + Push Notification delivered to every active client

## Project Structure

```
src/
├── components/
│   ├── QRLocalization.js      # OCR scanning and localisation
│   ├── NavigationView.js      # Navigation UI panel
│   ├── ARVisualization.js     # AR overlay visualisation
│   ├── ARThreeScene.js        # Three.js 3-D scene
│   └── FloorPlan.js           # 2-D floor map
├── logic/
│   ├── graph.js               # Graph data structure
│   ├── algorithms.js          # Dijkstra and A* algorithms
│   └── pathfinding.js         # High-level pathfinding API
├── data/
│   └── indoorMap.js           # Indoor map graph and location data
├── pages/
│   ├── HomePage.js
│   ├── NavigatePage.js
│   ├── MapPage.js
│   ├── GuidePage.js
│   ├── AboutPage.js
│   └── ArchitecturePage.js    # SVG system architecture diagram + docs
├── App.js                     # Main application component
└── index.js                   # React entry point
```

## Tech Stack

| Category | Technology |
|---|---|
| UI Framework | React 18 (hooks) |
| 3D / AR | Three.js 0.160 + AR.js |
| OCR | Tesseract.js 7 |
| Marker Detection | AR.js Hiro / ArUco |
| HTTP Client | Axios |
| Real-time | WebSocket + MQTT |
| Icons | Lucide-react |
| Mobile Deploy | Capacitor (iOS/Android) |
| Pathfinding | Custom A* + Dijkstra |
| Audio | Web Audio API |

## Getting Started

### Prerequisites
- Node.js 14+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

## Usage

1. **Localization**: App starts by prompting user to scan a room sign (OCR) or ArUco/Hiro marker
2. **Navigation**: User selects a destination and AR overlay provides directions
3. **Emergency Mode**: Press Emergency button to get evacuation route to nearest exit
4. **Architecture**: Open the Architecture page from the navbar to view the full system diagram

## QR Code Format

QR codes should contain JSON with location data:
```json
{
  "id": "location_id",
  "name": "Location Name",
  "x": 50,
  "y": 50
}
```

## Algorithms

- **Dijkstra's Algorithm**: Guaranteed shortest path, no heuristic
- **A* Algorithm**: Faster pathfinding using Euclidean distance heuristic

## Indoor Map

The system uses a graph-based indoor map where:
- **Nodes** represent locations (rooms, corridors, etc.)
- **Edges** represent connections with distances
- Each location has 2D coordinates for AR calculations

## Future Enhancements

- [ ] Three.js 3D visualization (full pass-through AR)
- [ ] Real-time multiplayer navigation
- [ ] Integration with building HVAC for emergency assistance
- [ ] Advanced sensor fusion (WiFi, BLE beacons)
- [ ] Offline map support
- [ ] Accessibility features (audio guidance)

## License

MIT License

## Contact

For questions or suggestions, please reach out to the development team.

