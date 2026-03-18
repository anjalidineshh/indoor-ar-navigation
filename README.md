# AR-Based Smart Indoor Navigation System

A web-based augmented reality indoor navigation and emergency guidance system for complex indoor environments.

## Features

- **QR-Based Localization**: Uses QR codes to determine user's starting position
- **Graph-Based Pathfinding**: Implements Dijkstra and A* algorithms for optimal route calculation
- **AR Visualization**: Real-time directional guidance overlay
- **Emergency Evacuation**: Dynamic safe exit routing
- **React Frontend**: Modern, responsive UI suitable for mobile devices
- **Capacitor Support**: Ready for mobile deployment (iOS/Android)

## Project Structure

```
src/
├── components/
│   ├── QRLocalization.js      # QR code scanning and localization
│   ├── NavigationView.js      # Navigation UI panel
│   └── ARVisualization.js     # AR overlay visualization
├── logic/
│   ├── graph.js               # Graph data structure
│   ├── algorithms.js          # Dijkstra and A* algorithms
│   └── pathfinding.js         # High-level pathfinding API
├── data/
│   └── indoorMap.js           # Indoor map graph and location data
├── ar/                        # AR-specific modules (Three.js integration)
├── App.js                     # Main application component
└── index.js                   # React entry point
```

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev) | 18.2.0 | Core UI framework — component-based SPA |
| [React DOM](https://react.dev) | 18.2.0 | DOM rendering for React components |
| [react-scripts](https://create-react-app.dev) | 5.0.1 | Build toolchain (Create React App) |
| JavaScript (ES6+) | — | Primary programming language |
| HTML5 Canvas | — | 2D floor-plan and path rendering |
| WebRTC / MediaDevices API | — | Live camera feed for AR overlay |
| CSS3 | — | Component styling and responsive layout |

### AR & Visualization
| Technology | Version | Purpose |
|---|---|---|
| [Three.js](https://threejs.org) | 0.160.0 | 3D AR scene rendering and spatial overlays |
| [Lucide React](https://lucide.dev) | 0.575.0 | Iconography used in the navigation UI |

### Localization & Detection
| Technology | Version | Purpose |
|---|---|---|
| [jsQR](https://github.com/cozmo/jsQR) | 1.4.0 | Real-time QR code scanning and decoding |
| [Tesseract.js](https://tesseract.projectnaptha.com) | 7.0.0 | OCR engine for text recognition (room plates) |

### Networking
| Technology | Version | Purpose |
|---|---|---|
| [Axios](https://axios-http.com) | 1.4.0 | HTTP client for API requests |

### Performance Monitoring
| Technology | Version | Purpose |
|---|---|---|
| [web-vitals](https://web.dev/vitals/) | 5.1.0 | Core Web Vitals performance metrics |

### Algorithms & Data Structures (Custom)
| Module | Purpose |
|---|---|
| `src/logic/graph.js` | Graph data structure representing locations and corridors |
| `src/logic/algorithms.js` | Dijkstra's algorithm and A\* with Euclidean heuristic |
| `src/logic/pathfinding.js` | High-level pathfinding and emergency evacuation API |

### Mobile Deployment
| Technology | Purpose |
|---|---|
| [Capacitor](https://capacitorjs.com) | Cross-platform wrapper for iOS/Android deployment (planned) |

### Development Tools
| Tool | Purpose |
|---|---|
| Node.js 14+ | JavaScript runtime |
| npm / yarn | Package management |
| ESLint (react-app) | Code linting |

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

1. **Localization**: App starts by prompting user to scan a QR code with their location
2. **Navigation**: User selects a destination and AR overlay provides directions
3. **Emergency Mode**: Press Emergency button to get evacuation route to nearest exit

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

- [ ] Real-time multiplayer navigation
- [ ] Integration with building HVAC for emergency assistance
- [ ] Advanced sensor fusion (WiFi, BLE beacons)
- [ ] Offline map support
- [ ] Accessibility features (audio guidance)

## License

MIT License

## Contact

For questions or suggestions, please reach out to the development team.
