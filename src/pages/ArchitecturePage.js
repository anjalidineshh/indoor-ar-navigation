import React, { useState } from 'react';

/* ─────────────────────────────────────────────
   Layer colour palette (matches global.css vars)
───────────────────────────────────────────── */
const C = {
  bg: '#0B0F19',
  surface: '#121A2F',
  border: 'rgba(255,255,255,0.08)',
  primary: '#3B82F6',
  secondary: '#10B981',
  danger: '#EF4444',
  amber: '#F59E0B',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  text: '#E8D8C4',
  muted: '#64748B',
};

/* ─────────────────────────────────────────────
   Reusable SVG primitives
───────────────────────────────────────────── */
function Arrow({ x1, y1, x2, y2, color = C.muted, dashed = false, label = '' }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return (
    <g>
      <defs>
        <marker id={`ah-${x1}-${y1}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L8,3 z" fill={color} />
        </marker>
      </defs>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color} strokeWidth="1.5"
        strokeDasharray={dashed ? '5,4' : undefined}
        markerEnd={`url(#ah-${x1}-${y1})`}
        opacity="0.75" />
      {label && (
        <text x={mx} y={my - 6} textAnchor="middle" fontSize="9"
          fill={color} fontFamily="'Outfit', sans-serif" opacity="0.9">
          {label}
        </text>
      )}
    </g>
  );
}

/* ─────────────────────────────────────────────
   Component box inside a layer
───────────────────────────────────────────── */
function CompBox({ x, y, w = 110, h = 42, label, sublabel, fill, stroke, icon = '' }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} ry={8}
        fill={fill} stroke={stroke} strokeWidth={1.2} />
      <text x={x + w / 2} y={sublabel ? y + h / 2 - 7 : y + h / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fill={C.text} fontWeight="600"
        fontFamily="'Space Grotesk', sans-serif">
        {icon} {label}
      </text>
      {sublabel && (
        <text x={x + w / 2} y={y + h / 2 + 8}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={8.5} fill={C.muted}
          fontFamily="'Outfit', sans-serif">
          {sublabel}
        </text>
      )}
    </g>
  );
}

/* ─────────────────────────────────────────────
   Layer header banner
───────────────────────────────────────────── */
function LayerBanner({ x, y, w, h = 22, label, fill, stroke }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6} ry={6}
        fill={fill} stroke={stroke} strokeWidth={1} opacity={0.9} />
      <text x={x + w / 2} y={y + h / 2}
        textAnchor="middle" dominantBaseline="middle"
        fontSize={10} fill="#fff" fontWeight="700" letterSpacing="0.5"
        fontFamily="'Space Grotesk', sans-serif">
        {label}
      </text>
    </g>
  );
}

/* ─────────────────────────────────────────────
   Full architecture SVG diagram
   Viewbox: 0 0 860 780
───────────────────────────────────────────── */
function ArchDiagram() {
  const VW = 860;

  /* ── Layer bounding boxes ── */
  const layers = [
    { y: 10, h: 100, label: '① FRONTEND + MOBILE LAYER', fill: 'rgba(59,130,246,0.08)', stroke: `${C.primary}55` },
    { y: 122, h: 60, label: '② MIDDLEWARE LAYER  (REST · WebSocket · MQTT)', fill: 'rgba(6,182,212,0.08)', stroke: `${C.cyan}55` },
    { y: 194, h: 110, label: '③ CLOUD / APPLICATION LAYER', fill: 'rgba(139,92,246,0.08)', stroke: `${C.purple}55` },
    { y: 316, h: 110, label: '④ CORE PROCESSING LAYER', fill: 'rgba(16,185,129,0.08)', stroke: `${C.secondary}55` },
    { y: 438, h: 80, label: '⑤ DATA LAYER', fill: 'rgba(245,158,11,0.08)', stroke: `${C.amber}55` },
    { y: 530, h: 110, label: '⑥ EMERGENCY SYSTEM', fill: 'rgba(239,68,68,0.08)', stroke: `${C.danger}55` },
    { y: 652, h: 110, label: '⑦ EXTERNAL INTEGRATIONS', fill: 'rgba(100,116,139,0.08)', stroke: `${C.muted}55` },
  ];

  return (
    <svg viewBox={`0 0 ${VW} 780`} width="100%" style={{ display: 'block', maxWidth: 860 }}
      xmlns="http://www.w3.org/2000/svg">

      {/* ── Background ── */}
      <rect width={VW} height={780} fill={C.bg} rx={16} />

      {/* ── Title ── */}
      <text x={VW / 2} y={770} textAnchor="middle" fontSize={10} fill={C.muted}
        fontFamily="'Outfit', sans-serif">SafeNav · System Architecture</text>

      {/* ══════════════════════════════════════════
          LAYER RECTANGLES
      ══════════════════════════════════════════ */}
      {layers.map((l, i) => (
        <g key={i}>
          <rect x={8} y={l.y} width={VW - 16} height={l.h} rx={10} ry={10}
            fill={l.fill} stroke={l.stroke} strokeWidth={1.2} />
        </g>
      ))}

      {/* ══════════════════════════════════════════
          LAYER 1 — FRONTEND + MOBILE  (y:10, h:100)
      ══════════════════════════════════════════ */}
      <LayerBanner x={16} y={14} w={220} label="① FRONTEND + MOBILE LAYER"
        fill={C.primary} stroke={C.primary} />

      {/* React Web App */}
      <CompBox x={16} y={42} w={130} h={60} label="React Web App"
        sublabel="SafeNav PWA" icon="🌐"
        fill="rgba(59,130,246,0.18)" stroke={C.primary} />
      {/* Mobile: iOS */}
      <CompBox x={158} y={42} w={100} h={60} label="iOS App"
        sublabel="Capacitor" icon="🍎"
        fill="rgba(59,130,246,0.12)" stroke={`${C.primary}88`} />
      {/* Mobile: Android */}
      <CompBox x={270} y={42} w={110} h={60} label="Android App"
        sublabel="Capacitor" icon="🤖"
        fill="rgba(59,130,246,0.12)" stroke={`${C.primary}88`} />
      {/* Camera Feed */}
      <CompBox x={392} y={42} w={110} h={60} label="Camera Feed"
        sublabel="getUserMedia" icon="📷"
        fill="rgba(6,182,212,0.12)" stroke={`${C.cyan}88`} />
      {/* AR Overlay */}
      <CompBox x={514} y={42} w={110} h={60} label="AR Overlay"
        sublabel="Three.js / AR.js" icon="🔭"
        fill="rgba(139,92,246,0.12)" stroke={`${C.purple}88`} />
      {/* Floor Plan */}
      <CompBox x={636} y={42} w={100} h={60} label="Floor Plan UI"
        sublabel="2-D SVG Map" icon="🗺️"
        fill="rgba(16,185,129,0.12)" stroke={`${C.secondary}88`} />
      {/* Navigation View */}
      <CompBox x={748} y={42} w={104} h={60} label="Nav View"
        sublabel="Route Panel" icon="🧭"
        fill="rgba(16,185,129,0.12)" stroke={`${C.secondary}88`} />

      {/* ══════════════════════════════════════════
          LAYER 2 — MIDDLEWARE  (y:122, h:60)
      ══════════════════════════════════════════ */}
      <LayerBanner x={16} y={126} w={200} label="② MIDDLEWARE LAYER"
        fill={C.cyan} stroke={C.cyan} />

      <CompBox x={16} y={150} w={120} h={26} label="REST API  /api/v1"
        fill="rgba(6,182,212,0.18)" stroke={C.cyan} />
      <CompBox x={148} y={150} w={130} h={26} label="WebSocket  ws://nav"
        fill="rgba(6,182,212,0.14)" stroke={`${C.cyan}88`} />
      <CompBox x={290} y={150} w={120} h={26} label="MQTT  iot/alerts"
        fill="rgba(6,182,212,0.14)" stroke={`${C.cyan}88`} />
      <CompBox x={422} y={150} w={130} h={26} label="HTTP/2  Push Notif."
        fill="rgba(6,182,212,0.10)" stroke={`${C.cyan}66`} />
      <CompBox x={564} y={150} w={130} h={26} label="Event Bus (Pub/Sub)"
        fill="rgba(6,182,212,0.10)" stroke={`${C.cyan}66`} />
      <CompBox x={706} y={150} w={146} h={26} label="Auth  (JWT / OAuth 2)"
        fill="rgba(245,158,11,0.14)" stroke={`${C.amber}88`} />

      {/* ══════════════════════════════════════════
          LAYER 3 — APPLICATION  (y:194, h:110)
      ══════════════════════════════════════════ */}
      <LayerBanner x={16} y={198} w={220} label="③ CLOUD / APPLICATION LAYER"
        fill={C.purple} stroke={C.purple} />

      <CompBox x={16} y={224} w={130} h={72} label="Node.js API"
        sublabel="Express Server" icon="⚙️"
        fill="rgba(139,92,246,0.18)" stroke={C.purple} />
      <CompBox x={158} y={224} w={120} h={72} label="Auth Service"
        sublabel="JWT / Sessions" icon="🔐"
        fill="rgba(139,92,246,0.12)" stroke={`${C.purple}88`} />
      <CompBox x={290} y={224} w={130} h={72} label="Location Svc"
        sublabel="Localization Engine" icon="📍"
        fill="rgba(139,92,246,0.12)" stroke={`${C.purple}88`} />
      <CompBox x={432} y={224} w={130} h={72} label="Navigation Svc"
        sublabel="Route Calculator" icon="🗺️"
        fill="rgba(16,185,129,0.12)" stroke={`${C.secondary}88`} />
      <CompBox x={574} y={224} w={130} h={72} label="Emergency Svc"
        sublabel="Evacuation Router" icon="🚨"
        fill="rgba(239,68,68,0.14)" stroke={`${C.danger}88`} />
      <CompBox x={716} y={224} w={136} h={72} label="Analytics Svc"
        sublabel="Crowd & Telemetry" icon="📊"
        fill="rgba(139,92,246,0.10)" stroke={`${C.purple}66`} />

      {/* ══════════════════════════════════════════
          LAYER 4 — CORE PROCESSING  (y:316, h:110)
      ══════════════════════════════════════════ */}
      <LayerBanner x={16} y={320} w={200} label="④ CORE PROCESSING LAYER"
        fill={C.secondary} stroke={C.secondary} />

      <CompBox x={16} y={344} w={130} h={72} label="Pathfinding"
        sublabel="A* / Dijkstra" icon="🔀"
        fill="rgba(16,185,129,0.18)" stroke={C.secondary} />
      <CompBox x={158} y={344} w={130} h={72} label="OCR Engine"
        sublabel="Tesseract.js" icon="🔤"
        fill="rgba(16,185,129,0.14)" stroke={`${C.secondary}88`} />
      <CompBox x={300} y={344} w={130} h={72} label="AR Renderer"
        sublabel="Three.js 3D" icon="✨"
        fill="rgba(139,92,246,0.14)" stroke={`${C.purple}88`} />
      <CompBox x={442} y={344} w={130} h={72} label="Graph Engine"
        sublabel="Node / Edge Mgr" icon="🕸️"
        fill="rgba(16,185,129,0.12)" stroke={`${C.secondary}88`} />
      <CompBox x={584} y={344} w={130} h={72} label="Sensor Fusion"
        sublabel="Gyro + Compass" icon="🧲"
        fill="rgba(6,182,212,0.12)" stroke={`${C.cyan}88`} />
      <CompBox x={726} y={344} w={126} h={72} label="Image Marker"
        sublabel="ArUco / Hiro" icon="🖼️"
        fill="rgba(245,158,11,0.12)" stroke={`${C.amber}88`} />

      {/* ══════════════════════════════════════════
          LAYER 5 — DATA  (y:438, h:80)
      ══════════════════════════════════════════ */}
      <LayerBanner x={16} y={442} w={140} label="⑤ DATA LAYER"
        fill={C.amber} stroke={C.amber} />

      <CompBox x={16} y={466} w={130} h={44} label="Indoor Map DB"
        sublabel="indoorMap.js / JSON" icon="🏢"
        fill="rgba(245,158,11,0.18)" stroke={C.amber} />
      <CompBox x={158} y={466} w={130} h={44} label="Location Graph"
        sublabel="graph.js (nodes)" icon="🕸️"
        fill="rgba(245,158,11,0.14)" stroke={`${C.amber}88`} />
      <CompBox x={300} y={466} w={130} h={44} label="User Sessions"
        sublabel="Redis / LocalStorage" icon="👤"
        fill="rgba(245,158,11,0.12)" stroke={`${C.amber}88`} />
      <CompBox x={442} y={466} w={130} h={44} label="Event Logs"
        sublabel="Navigation History" icon="📋"
        fill="rgba(245,158,11,0.10)" stroke={`${C.amber}66`} />
      <CompBox x={584} y={466} w={130} h={44} label="Marker Registry"
        sublabel="ArUco IDs ↔ Rooms" icon="🏷️"
        fill="rgba(245,158,11,0.10)" stroke={`${C.amber}66`} />
      <CompBox x={726} y={466} w={126} h={44} label="Floor Blueprints"
        sublabel="SVG / GeoJSON" icon="📐"
        fill="rgba(245,158,11,0.08)" stroke={`${C.amber}55`} />

      {/* ══════════════════════════════════════════
          LAYER 6 — EMERGENCY  (y:530, h:110)
      ══════════════════════════════════════════ */}
      <LayerBanner x={16} y={534} w={180} label="⑥ EMERGENCY SYSTEM"
        fill={C.danger} stroke={C.danger} />

      <CompBox x={16} y={558} w={140} h={72} label="Evacuation Module"
        sublabel="Nearest Exit Route" icon="🚨"
        fill="rgba(239,68,68,0.20)" stroke={C.danger} />
      <CompBox x={168} y={558} w={130} h={72} label="Alert Broadcast"
        sublabel="WebSocket Push" icon="📣"
        fill="rgba(239,68,68,0.14)" stroke={`${C.danger}88`} />
      <CompBox x={310} y={558} w={130} h={72} label="Audio Alarm"
        sublabel="Web Audio API" icon="🔊"
        fill="rgba(239,68,68,0.12)" stroke={`${C.danger}88`} />
      <CompBox x={452} y={558} w={130} h={72} label="Emergency DB"
        sublabel="Exit Locations" icon="🗄️"
        fill="rgba(239,68,68,0.12)" stroke={`${C.danger}88`} />
      <CompBox x={594} y={558} w={130} h={72} label="MQTT Alerts"
        sublabel="IoT Sensor Feed" icon="📡"
        fill="rgba(239,68,68,0.10)" stroke={`${C.danger}66`} />
      <CompBox x={736} y={558} w={116} h={72} label="Push Notif."
        sublabel="FCM / APNS" icon="📲"
        fill="rgba(239,68,68,0.08)" stroke={`${C.danger}55`} />

      {/* ══════════════════════════════════════════
          LAYER 7 — EXTERNAL  (y:652, h:110)
      ══════════════════════════════════════════ */}
      <LayerBanner x={16} y={656} w={200} label="⑦ EXTERNAL INTEGRATIONS"
        fill={C.muted} stroke={C.muted} />

      <CompBox x={16} y={680} w={130} h={72} label="Firebase"
        sublabel="Auth + Firestore" icon="🔥"
        fill="rgba(245,158,11,0.12)" stroke={`${C.amber}88`} />
      <CompBox x={158} y={680} w={130} h={72} label="Google Maps"
        sublabel="Building Geocoding" icon="🗺️"
        fill="rgba(59,130,246,0.12)" stroke={`${C.primary}88`} />
      <CompBox x={300} y={680} w={130} h={72} label="Cloud Storage"
        sublabel="Map Assets CDN" icon="☁️"
        fill="rgba(100,116,139,0.14)" stroke={`${C.muted}88`} />
      <CompBox x={442} y={680} w={130} h={72} label="BLE Beacons"
        sublabel="Precise Indoor Pos." icon="📶"
        fill="rgba(6,182,212,0.12)" stroke={`${C.cyan}88`} />
      <CompBox x={584} y={680} w={130} h={72} label="Building HVAC"
        sublabel="Sensor Integration" icon="🏗️"
        fill="rgba(100,116,139,0.12)" stroke={`${C.muted}66`} />
      <CompBox x={726} y={680} w={126} h={72} label="Emergency PA"
        sublabel="PA System Bridge" icon="🔔"
        fill="rgba(239,68,68,0.10)" stroke={`${C.danger}55`} />

      {/* ══════════════════════════════════════════
          INTER-LAYER ARROWS (simplified key flows)
      ══════════════════════════════════════════ */}

      {/* L1 → L2: Frontend calls Middleware */}
      <Arrow x1={81} y1={102} x2={81} y2={150} color={C.primary} label="HTTP/WS" />
      <Arrow x1={213} y1={102} x2={213} y2={150} color={C.cyan} label="MQTT" />
      <Arrow x1={324} y1={102} x2={324} y2={150} color={C.primary} label="REST" />
      <Arrow x1={590} y1={102} x2={590} y2={150} color={C.purple} label="events" />

      {/* L2 → L3: Middleware routes to App Services */}
      <Arrow x1={81} y1={176} x2={81} y2={224} color={C.purple} label="route" />
      <Arrow x1={213} y1={176} x2={225} y2={224} color={C.purple} />
      <Arrow x1={355} y1={176} x2={355} y2={224} color={C.purple} />
      <Arrow x1={487} y1={176} x2={497} y2={224} color={C.secondary} />
      <Arrow x1={629} y1={176} x2={639} y2={224} color={C.danger} />

      {/* L3 → L4: App Services call Core Processing */}
      <Arrow x1={81} y1={296} x2={81} y2={344} color={C.secondary} label="compute" />
      <Arrow x1={355} y1={296} x2={223} y2={344} color={C.secondary} />
      <Arrow x1={497} y1={296} x2={365} y2={344} color={C.purple} />
      <Arrow x1={639} y1={296} x2={519} y2={344} color={C.cyan} />
      <Arrow x1={784} y1={296} x2={649} y2={344} color={C.amber} />

      {/* L4 → L5: Processing reads/writes Data */}
      <Arrow x1={81} y1={416} x2={81} y2={466} color={C.amber} label="R/W" />
      <Arrow x1={223} y1={416} x2={223} y2={466} color={C.amber} />
      <Arrow x1={365} y1={416} x2={365} y2={466} color={C.amber} />
      <Arrow x1={507} y1={416} x2={507} y2={466} color={C.amber} />
      <Arrow x1={649} y1={416} x2={649} y2={466} color={C.amber} />

      {/* Emergency module links */}
      <Arrow x1={639} y1={296} x2={86} y2={558} color={C.danger} dashed label="trigger" />
      <Arrow x1={86} y1={630} x2={234} y2={630} color={C.danger} />
      <Arrow x1={234} y1={630} x2={375} y2={630} color={C.danger} />

      {/* External ↔ Application */}
      <Arrow x1={81} y1={752} x2={81} y2={296} color={`${C.muted}`} dashed />
      <Arrow x1={223} y1={752} x2={497} y2={296} color={`${C.muted}`} dashed />

      {/* ══════════════════════════════════════════
          LEGEND
      ══════════════════════════════════════════ */}
      <g transform="translate(16, 762)">
        <text x={0} y={0} fontSize={9} fill={C.muted} fontFamily="'Outfit', sans-serif"
          fontWeight="700">LEGEND:</text>
        {[
          { x: 60, color: C.primary, label: 'HTTP / REST' },
          { x: 160, color: C.cyan, label: 'WebSocket' },
          { x: 250, color: C.secondary, label: 'Processing' },
          { x: 340, color: C.danger, label: 'Emergency' },
          { x: 430, color: C.amber, label: 'Data I/O' },
          { x: 515, color: C.muted, label: 'External (dashed)' },
        ].map(({ x, color, label }) => (
          <g key={x}>
            <line x1={x} y1={-2} x2={x + 18} y2={-2} stroke={color} strokeWidth={2} />
            <text x={x + 22} y={1} fontSize={8.5} fill={C.muted}
              fontFamily="'Outfit', sans-serif">{label}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────
   Documentation sections
───────────────────────────────────────────── */
const sections = [
  {
    icon: '🌐',
    title: 'Frontend + Mobile Layer',
    color: C.primary,
    items: [
      { name: 'React Web App (PWA)', desc: 'Core SafeNav interface — camera access, AR overlay, floor plan, and emergency UI. Deployed as a Progressive Web App for mobile browser access.' },
      { name: 'iOS App (Capacitor)', desc: 'Native iOS wrapper around the React PWA, giving access to device sensors, push notifications, and the App Store distribution channel.' },
      { name: 'Android App (Capacitor)', desc: 'Native Android wrapper with the same capabilities as iOS, supporting Google Play distribution.' },
      { name: 'Camera Feed', desc: 'Accesses device back-camera via getUserMedia. Feeds live video frames into the OCR and AR rendering pipelines.' },
      { name: 'AR Overlay (Three.js)', desc: 'Renders 3-D directional arrows, waypoint orbs, and animated path lines on top of the live camera canvas using Three.js and AR.js.' },
      { name: 'Floor Plan UI', desc: 'Interactive 2-D SVG floor map showing the user position, selected destination, and shortest-path highlight in real time.' },
      { name: 'Navigation View', desc: 'Bottom-sheet panel for destination selection, step-by-step distance readout, and quick-action buttons (Emergency, 2-D Map toggle, Change Destination).' },
    ],
  },
  {
    icon: '🔌',
    title: 'Middleware Layer',
    color: C.cyan,
    items: [
      { name: 'REST API  /api/v1', desc: 'Standard HTTP endpoints for map data, user sessions, and route queries. Used for non-real-time requests.' },
      { name: 'WebSocket  ws://nav', desc: 'Persistent bidirectional channel for real-time position updates, live route recalculation, and emergency broadcasts.' },
      { name: 'MQTT  iot/alerts', desc: 'Lightweight publish-subscribe protocol for IoT sensor data (smoke detectors, BLE beacons, occupancy sensors).' },
      { name: 'HTTP/2 Push', desc: 'Server-push notifications for map updates and administrative announcements without the overhead of polling.' },
      { name: 'Event Bus (Pub/Sub)', desc: 'Internal message broker decoupling services; enables the Emergency Service to fan-out alerts to all connected clients instantly.' },
      { name: 'Auth (JWT / OAuth 2)', desc: 'Stateless token authentication for the API and WebSocket upgrade. OAuth 2 used for third-party login (Google, etc.).' },
    ],
  },
  {
    icon: '☁️',
    title: 'Cloud / Application Layer',
    color: C.purple,
    items: [
      { name: 'Node.js API (Express)', desc: 'Central backend orchestrating all service calls, session management, and business logic validation.' },
      { name: 'Auth Service', desc: 'Issues and validates JWT tokens; manages user roles (visitor, admin, emergency-responder).' },
      { name: 'Location Service', desc: 'Accepts OCR/ArUco scan results, maps them to graph nodes, and maintains per-user last-known position.' },
      { name: 'Navigation Service', desc: 'Wraps the pathfinding engine; exposes route-request API and streams step updates over WebSocket.' },
      { name: 'Emergency Service', desc: 'Triggered by Simulate Alert or IoT event. Immediately recalculates nearest exit, activates audio alarm, and broadcasts evacuation route to all clients.' },
      { name: 'Analytics Service', desc: 'Collects anonymised crowd density, popular destinations, and navigation completion metrics for building-management dashboards.' },
    ],
  },
  {
    icon: '⚙️',
    title: 'Core Processing Layer',
    color: C.secondary,
    items: [
      { name: 'Pathfinding Engine (A* / Dijkstra)', desc: 'Graph-based shortest-path computation. A* uses Euclidean heuristic for speed; Dijkstra guarantees optimality. Both implemented in src/logic/algorithms.js.' },
      { name: 'OCR Engine (Tesseract.js)', desc: 'Reads room-name text boards from camera frames to determine the user\'s current room. Point the camera at any sign that says the room name — no physical marker installation needed.' },
      { name: 'AR Renderer (Three.js)', desc: 'Projects 3-D objects onto the 2-D camera canvas. Uses device gyroscope/compass data for heading-aligned arrow display.' },
      { name: 'Graph Engine', desc: 'Manages the in-memory graph of nodes (rooms) and weighted edges (corridors). Handles dynamic edge removal during emergencies (blocked exits).' },
      { name: 'Sensor Fusion', desc: 'Combines device gyroscope, accelerometer, and (optionally) BLE RSSI data to improve localisation accuracy beyond camera-only OCR.' },
      { name: 'Image Marker Detection', desc: 'Detects Hiro (AR.js) or ArUco fiducial markers in the camera frame, providing a fast, reliable localisation fallback when OCR is ambiguous.' },
    ],
  },
  {
    icon: '🗄️',
    title: 'Data Layer',
    color: C.amber,
    items: [
      { name: 'Indoor Map DB (indoorMap.js)', desc: 'Static JSON graph shipped with the app. Defines all location nodes (id, name, x, y, isExit) and weighted edges between them.' },
      { name: 'Location Graph (graph.js)', desc: 'Runtime graph object built from indoorMap.js. Supports adjacency queries, BFS/DFS traversal, and dynamic edge weight updates.' },
      { name: 'User Sessions (Redis)', desc: 'Fast key-value store for active user sessions, current position cache, and WebSocket client registry.' },
      { name: 'Event Logs', desc: 'Persistent log of navigation events (scan timestamp, route taken, exit used) for analytics and post-incident auditing.' },
      { name: 'Marker Registry', desc: 'Maps ArUco marker IDs and OCR room-name patterns to canonical location node IDs.' },
      { name: 'Floor Blueprints (SVG/GeoJSON)', desc: 'Vector floor-plan assets served from the CDN. Rendered by the Floor Plan UI component.' },
    ],
  },
  {
    icon: '🚨',
    title: 'Emergency System',
    color: C.danger,
    items: [
      { name: 'Evacuation Module', desc: 'On emergency trigger, removes non-exit edges, runs Dijkstra from current node to nearest isExit node, and immediately sends the evacuation path.' },
      { name: 'Alert Broadcast', desc: 'Pushes a JSON alert payload to every active WebSocket client. Clients render the evacuation overlay and start the pulsing danger animation.' },
      { name: 'Audio Alarm (Web Audio API)', desc: 'Synthesises a piercing 400–800 Hz square-wave siren directly in the browser without requiring an audio file download.' },
      { name: 'Emergency DB', desc: 'Dedicated store for exit coordinates, hazard zones, and capacity limits used by the evacuation router.' },
      { name: 'MQTT Alerts', desc: 'Subscribes to iot/emergency MQTT topic. When a smoke sensor or fire panel publishes, the service auto-triggers the evacuation flow.' },
      { name: 'Push Notifications (FCM/APNS)', desc: 'Sends a native push to all registered mobile devices even when the app is in the background, ensuring maximum evacuation coverage.' },
    ],
  },
  {
    icon: '🔗',
    title: 'External Integrations',
    color: C.muted,
    items: [
      { name: 'Firebase', desc: 'Provides optional cloud Authentication (Google sign-in) and Firestore for syncing user-saved locations across devices.' },
      { name: 'Google Maps API', desc: 'Geocoding of building address and outdoor-to-indoor handoff — helps users find the building entrance from an outdoor map.' },
      { name: 'Cloud Storage (CDN)', desc: 'Hosts floor-plan SVGs, ArUco marker images, and audio assets with global edge caching for fast mobile loads.' },
      { name: 'BLE Beacons', desc: 'Optional Bluetooth Low-Energy hardware giving sub-meter positioning accuracy without relying on camera or OCR.' },
      { name: 'Building HVAC / Sensors', desc: 'Planned integration to ingest real-time temperature, air-quality, and occupancy sensor streams for hazard-aware routing.' },
      { name: 'Emergency PA System', desc: 'Future bridge to announce evacuation instructions over the building\'s public-address speakers when an alert is triggered.' },
    ],
  },
];

/* ─────────────────────────────────────────────
   Main page component
───────────────────────────────────────────── */
function ArchitecturePage({ onBack }) {
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0B0F19 0%, #121A2F 100%)',
      paddingBottom: '6rem',
    }}>
      {/* ── Page Header ── */}
      <div style={{
        padding: '5rem 1.5rem 2rem',
        textAlign: 'center',
        background: 'linear-gradient(to bottom, rgba(59,130,246,0.08), transparent)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🏗️</div>
        <h1 style={{
          color: '#fff', fontSize: 'clamp(1.4rem, 5vw, 2rem)',
          fontWeight: '700', marginBottom: '0.5rem',
        }}>
          System Architecture
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto' }}>
          End-to-end architecture of the SafeNav Indoor AR Navigation system — from mobile
          camera feed to pathfinding engine and emergency evacuation broadcast.
        </p>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>

        {/* ── SVG Diagram ── */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '1rem',
          marginBottom: '2rem',
          overflowX: 'auto',
        }}>
          <p style={{
            color: '#64748b', fontSize: '0.78rem', textAlign: 'center',
            marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            Interactive System Architecture Diagram — scroll horizontally on small screens
          </p>
          <ArchDiagram />
        </div>

        {/* ── Data-flow summary ── */}
        <div style={{
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '2rem',
        }}>
          <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            🔄 Primary Data Flow
          </div>
          {[
            '① Camera captures room-name sign → Tesseract.js OCR reads the text → location node resolved (e.g. "AI HOD ROOM" → ai_hod)',
            '② Location node resolved → user selects destination → Navigation Service invokes A* / Dijkstra',
            '③ Optimal path returned → WebSocket streams step updates → AR Overlay renders directional arrow',
            '④ Floor Plan UI highlights live route; each step triggers a REST call to log the event',
            '⑤ Emergency button or MQTT alert fires Evacuation Module → nearest exit recalculated in < 50 ms',
            '⑥ WebSocket broadcast + Audio Alarm + Push Notification deliver alert to every active client',
          ].map((step, i) => (
            <div key={i} style={{
              color: '#94a3b8', fontSize: '0.82rem', padding: '0.3rem 0',
              borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              lineHeight: 1.6,
            }}>
              {step}
            </div>
          ))}
        </div>

        {/* ── Layer documentation ── */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{
            color: '#fff', fontSize: '1.05rem', fontWeight: '700',
            marginBottom: '1rem', letterSpacing: '-0.01em',
          }}>
            Layer Documentation
          </h2>
          {sections.map((sec, si) => (
            <div key={si}
              onClick={() => setActiveSection(activeSection === si ? null : si)}
              style={{
                background: activeSection === si
                  ? `rgba(${hexToRgb(sec.color)},0.10)`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${activeSection === si ? sec.color + '55' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '14px',
                padding: '1rem 1.25rem',
                marginBottom: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}>
              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.4rem' }}>{sec.icon}</span>
                <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.9rem', flex: 1 }}>
                  {sec.title}
                </span>
                <span style={{ color: sec.color, fontSize: '0.75rem' }}>
                  {activeSection === si ? '▲ collapse' : '▼ expand'}
                </span>
              </div>

              {/* Expandable items */}
              {activeSection === si && (
                <div style={{ marginTop: '1rem' }}>
                  {sec.items.map((item, ii) => (
                    <div key={ii} style={{
                      padding: '0.6rem 0',
                      borderBottom: ii < sec.items.length - 1
                        ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    }}>
                      <div style={{
                        color: sec.color, fontSize: '0.82rem',
                        fontWeight: '700', marginBottom: '3px',
                      }}>
                        {item.name}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6 }}>
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Tech stack grid ── */}
        <div style={{
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '2rem',
        }}>
          <div style={{ color: '#10b981', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            🛠️ Technology Stack Summary
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '0.6rem',
          }}>
            {[
              { cat: 'UI Framework', val: 'React 18 (hooks)' },
              { cat: '3D / AR', val: 'Three.js 0.160 + AR.js' },
              { cat: 'OCR', val: 'Tesseract.js 7' },
              { cat: 'Marker Detection', val: 'AR.js Hiro / ArUco' },
              { cat: 'HTTP Client', val: 'Axios' },
              { cat: 'Real-time', val: 'WebSocket + MQTT' },
              { cat: 'Icons', val: 'Lucide-react' },
              { cat: 'Mobile Deploy', val: 'Capacitor (iOS/Android)' },
              { cat: 'Pathfinding', val: 'Custom A* + Dijkstra' },
              { cat: 'Audio', val: 'Web Audio API' },
              { cat: 'Styling', val: 'CSS Variables + glass-morphism' },
              { cat: 'Fonts', val: 'Space Grotesk + Outfit' },
            ].map(({ cat, val }) => (
              <div key={cat} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '8px',
                padding: '0.5rem 0.75rem',
              }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '2px' }}>{cat}</div>
                <div style={{ color: '#e8d8c4', fontSize: '0.82rem', fontWeight: '600' }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Communication protocols ── */}
        <div style={{
          background: 'rgba(6,182,212,0.06)',
          border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: '14px',
          padding: '1.25rem',
          marginBottom: '2rem',
        }}>
          <div style={{ color: '#06b6d4', fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            📡 Communication Protocols
          </div>
          {[
            { proto: 'REST (HTTP/1.1)', use: 'Map data fetch, session creation, route query, event logging' },
            { proto: 'WebSocket', use: 'Real-time position streaming, live route recalculation, emergency alert broadcast' },
            { proto: 'MQTT (IoT)', use: 'BLE beacon telemetry, smoke-detector alerts, occupancy sensor data' },
            { proto: 'HTTP/2 Push', use: 'Map-update notifications and admin announcements without polling' },
            { proto: 'JWT Bearer', use: 'API authentication; WebSocket upgrade authorisation header' },
          ].map(({ proto, use }, i) => (
            <div key={i} style={{
              display: 'flex', gap: '1rem', alignItems: 'flex-start',
              padding: '0.4rem 0',
              borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <span style={{
                background: 'rgba(6,182,212,0.2)', color: '#06b6d4',
                fontSize: '0.75rem', fontWeight: '700', borderRadius: '6px',
                padding: '2px 8px', whiteSpace: 'nowrap', flexShrink: 0,
              }}>{proto}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.6 }}>{use}</span>
            </div>
          ))}
        </div>

        {/* ── Back button ── */}
        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onBack}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

/* Helper: convert hex colour to "r,g,b" string for rgba() */
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
}

export default ArchitecturePage;
