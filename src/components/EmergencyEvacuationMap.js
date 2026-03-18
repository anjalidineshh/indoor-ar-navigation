import React, { useState, useEffect, useRef } from 'react';
import { EMERGENCY_EXITS, ASSEMBLY_POINTS, getAssemblyPointForExit, estimateEvacuationTime } from '../data/emergencyData';
import './EmergencyEvacuationMap.css';

/** Transform constants matching MapPage.js SVG group: translate(115, 85) scale(0.9) */
const MAP_TRANSLATE_X = 115;
const MAP_TRANSLATE_Y = 85;
const MAP_SCALE = 0.9;

/** Convert absolute SVG coordinates to the local coordinate space of the building group */
function toLocal(x, y) {
  return {
    lx: (x - MAP_TRANSLATE_X) / MAP_SCALE,
    ly: (y - MAP_TRANSLATE_Y) / MAP_SCALE,
  };
}

/**
 * SVG floor plan coordinates for each room (matches MapPage.js viewBox 0 0 800 600,
 * with transform="translate(115, 85) scale(0.9)" applied in the parent group).
 * We draw everything in the same coordinate space as MapPage for consistency.
 */
const ROOM_POSITIONS = {
  left_stairs:        { x: 244, y: 490, label: 'Left Stairs' },
  right_stairs:       { x: 349, y: 490, label: 'Right Stairs' },
  stairs_right_side:  { x: 620, y: 409, label: 'East Stairs' },
  thermal_lab:        { x: 200, y: 113, label: 'Thermal Lab II' },
  machine_tools_lab:  { x: 200, y: 238, label: 'Machine Tools Lab' },
  mech_faculty:       { x: 200, y: 374, label: 'Mech Faculty' },
  lecture_a:          { x: 369, y: 113, label: 'Lecture Hall A' },
  lecture_b:          { x: 369, y: 238, label: 'Lecture Hall B' },
  lecture_c:          { x: 619, y: 166, label: 'Lecture Hall C' },
  lecture_d:          { x: 619, y: 310, label: 'Lecture Hall D' },
  faculty_center:     { x: 349, y: 385, label: 'Faculty Center' },
  faculty_room:       { x: 619, y: 492, label: 'Faculty Room' },
  mech_hod:           { x: 240, y: 554, label: 'Mech HOD' },
  ai_hod:             { x: 349, y: 554, label: 'AI HOD' },
  main_hall:          { x: 187, y: 348, label: 'Main Hall' },
  right_hall:         { x: 532, y: 348, label: 'Right Hall' },
  girls_toilet:       { x: 132, y: 482, label: "Girls' Toilet" },
  boys_toilet_center: { x: 419, y: 455, label: 'Boys Toilet' },
  boys_toilet_north:  { x: 485, y: 166, label: 'Boys Toilet N' },
};

function EmergencyEvacuationMap({ currentLocation, evacuationRoute, onClose }) {
  const [animationStep, setAnimationStep] = useState(0);
  const animRef = useRef(null);

  // Animate the route arrows by cycling through steps
  useEffect(() => {
    animRef.current = setInterval(() => {
      setAnimationStep(s => (s + 1) % 10);
    }, 300);
    return () => clearInterval(animRef.current);
  }, []);

  const path = evacuationRoute?.path || [];
  const totalDist = evacuationRoute?.distance || 0;
  const exitId = path[path.length - 1];
  const exitInfo = EMERGENCY_EXITS.find(e => e.id === exitId);
  const assemblyPoint = exitInfo ? getAssemblyPointForExit(exitId) : ASSEMBLY_POINTS[0];
  const etaSec = estimateEvacuationTime(totalDist);

  /**
   * Render directional arrows along the route path segments.
   */
  const renderRouteArrows = () => {
    if (path.length < 2) return null;
    const arrows = [];
    for (let i = 0; i < path.length - 1; i++) {
      const from = ROOM_POSITIONS[path[i]];
      const to   = ROOM_POSITIONS[path[i + 1]];
      if (!from || !to) continue;

      const { lx: fromLx, ly: fromLy } = toLocal(from.x, from.y);
      const { lx: toLx, ly: toLy }     = toLocal(to.x, to.y);
      const mx = (fromLx + toLx) / 2;
      const my = (fromLy + toLy) / 2;
      const angle = Math.atan2(toLy - fromLy, toLx - fromLx) * (180 / Math.PI);
      const opacity = i === animationStep % (path.length - 1) ? 1 : 0.4;

      arrows.push(
        <g key={`arrow-${i}`} transform={`translate(${mx},${my}) rotate(${angle})`} opacity={opacity}>
          <polygon points="-10,-6 10,0 -10,6" fill="#ef4444" />
        </g>
      );
    }
    return arrows;
  };

  return (
    <div className="evac-map-overlay" role="dialog" aria-modal="true" aria-label="Emergency Evacuation Map">
      {/* Header */}
      <div className="evac-map-header">
        <div className="evac-map-title">
          <span className="evac-map-icon">🗺️</span>
          <span>Evacuation Map</span>
          <span className="evac-map-badge">EMERGENCY</span>
        </div>
        <button className="evac-map-close" onClick={onClose} aria-label="Close map">✕</button>
      </div>

      {/* ETA + exit info bar */}
      <div className="evac-map-info-bar">
        <div className="evac-info-chip evac-info-time">
          ⏱️ ETA: ~{etaSec}s
        </div>
        <div className="evac-info-chip evac-info-dist">
          📏 {Math.round(totalDist)}m
        </div>
        {exitInfo && (
          <div className="evac-info-chip evac-info-exit">
            🚪 {exitInfo.name}
          </div>
        )}
      </div>

      {/* SVG Floor Plan */}
      <div className="evac-map-svg-wrapper">
        <svg
          viewBox="0 0 800 640"
          className="evac-map-svg"
          aria-label="Building floor plan with evacuation route"
        >
          {/* Background grid */}
          <rect width="800" height="640" fill="#0a0f1c" />
          <defs>
            <pattern id="evac-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M30 0 L0 0 0 30" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <marker id="evac-arrow-marker" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ef4444" />
            </marker>
            <filter id="glow-red">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          <rect width="800" height="640" fill="url(#evac-grid)" />

          {/* Title */}
          <text x="400" y="28" fill="#e8d8c4" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            Sri Abhinava Vidyatirtha Block — Evacuation Plan
          </text>

          {/* Building corridors (same as MapPage) */}
          <g transform="translate(115, 85) scale(0.9)">
            <g stroke="#334155" strokeWidth="18" fill="none" strokeLinecap="round" opacity="0.5">
              <path d="M190 40 L190 520" />
              <path d="M460 40 L460 500" />
              <path d="M170 280 L460 280" />
              <path d="M190 520 L260 520" />
              <path d="M170 445 L220 445" />
              <path d="M170 310 L190 310" />
              <path d="M170 70 L220 70" />
              <path d="M170 170 L220 170" />
              <path d="M260 280 L260 300" />
              <path d="M190 400 L320 400" strokeLinecap="butt" />
              <path d="M190 395 L20 395" strokeLinecap="butt" />
              <path d="M460 90 L420 90" strokeLinecap="butt" />
              <path d="M460 90 L490 90" />
              <path d="M460 250 L490 250" />
              <path d="M460 360 L490 360" />
              <path d="M460 455 L490 455" />
              <path d="M190 520 L140 520" />
            </g>

            {/* Rooms — dimmed during emergency */}
            <g opacity="0.45" fontSize="9" fontWeight="bold" fillOpacity="0.9">
              <g fill="#38bdf8">
                <rect x="20" y="20" width="150" height="100" rx="4" />
                <text x="95" y="65" fill="#0f172a" textAnchor="middle" stroke="none">Thermal Lab II</text>
                <rect x="20" y="130" width="150" height="100" rx="4" />
                <text x="95" y="180" fill="#0f172a" textAnchor="middle" stroke="none">Machine Tools Lab</text>
              </g>
              <g fill="#facc15">
                <rect x="220" y="20" width="120" height="100" rx="4" />
                <text x="280" y="70" fill="#0f172a" textAnchor="middle" stroke="none">Lecture Hall A</text>
                <rect x="220" y="130" width="120" height="100" rx="4" />
                <text x="280" y="180" fill="#0f172a" textAnchor="middle" stroke="none">Lecture Hall B</text>
                <rect x="490" y="20" width="140" height="140" rx="4" />
                <text x="560" y="90" fill="#0f172a" textAnchor="middle" stroke="none">Lecture Hall C</text>
                <rect x="490" y="180" width="140" height="140" rx="4" />
                <text x="560" y="250" fill="#0f172a" textAnchor="middle" stroke="none">Lecture Hall D</text>
              </g>
              <g fill="#4ade80">
                <rect x="20" y="240" width="150" height="140" rx="4" />
                <text x="95" y="310" fill="#0f172a" textAnchor="middle" stroke="none">Mech Faculty</text>
                <rect x="220" y="300" width="80" height="80" rx="4" />
                <text x="260" y="340" fill="#0f172a" textAnchor="middle" stroke="none">Faculty Center</text>
                <rect x="490" y="420" width="140" height="70" rx="4" />
                <text x="560" y="455" fill="#0f172a" textAnchor="middle" stroke="none">Faculty Room</text>
              </g>
              <g fill="#f87171">
                <rect x="100" y="490" width="80" height="60" rx="4" />
                <text x="140" y="520" fill="#0f172a" textAnchor="middle" stroke="none">Mech HOD</text>
                <rect x="220" y="490" width="80" height="60" rx="4" />
                <text x="260" y="520" fill="#0f172a" textAnchor="middle" stroke="none">AI HOD</text>
              </g>
            </g>

            {/* Evacuation route polyline */}
            {path.length > 1 && (
              <polyline
                points={path
                  .map(id => ROOM_POSITIONS[id])
                  .filter(Boolean)
                  .map(pos => {
                    const { lx, ly } = toLocal(pos.x, pos.y);
                    return `${lx},${ly}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#ef4444"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="14 6"
                filter="url(#glow-red)"
                opacity="0.9"
              >
                <animate attributeName="stroke-dashoffset" from="200" to="0" dur="1.2s" repeatCount="indefinite" />
              </polyline>
            )}

            {/* Route arrows */}
            {renderRouteArrows()}

            {/* Emergency exit markers */}
            {EMERGENCY_EXITS.map(exit => {
              const pos = ROOM_POSITIONS[exit.id];
              if (!pos) return null;
              const { lx, ly } = toLocal(pos.x, pos.y);
              const isTarget = exit.id === exitId;
              return (
                <g key={exit.id}>
                  <circle
                    cx={lx} cy={ly} r={isTarget ? 18 : 12}
                    fill={isTarget ? '#ef4444' : '#f97316'}
                    opacity="0.9"
                    filter={isTarget ? 'url(#glow-red)' : undefined}
                  >
                    {isTarget && (
                      <animate attributeName="r" values="16;22;16" dur="1s" repeatCount="indefinite" />
                    )}
                  </circle>
                  <text cx={lx} cy={ly + 1} x={lx} y={ly + 4} textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">🚪</text>
                  <text x={lx} y={ly + 28} textAnchor="middle" fontSize="8" fill="#fca5a5" fontWeight="600">EXIT</text>
                </g>
              );
            })}

            {/* Current location marker */}
            {currentLocation && ROOM_POSITIONS[currentLocation.id] && (() => {
              const pos = ROOM_POSITIONS[currentLocation.id];
              const { lx, ly } = toLocal(pos.x, pos.y);
              return (
                <g>
                  <circle cx={lx} cy={ly} r="14" fill="#3b82f6" opacity="0.85">
                    <animate attributeName="r" values="12;17;12" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={lx} cy={ly} r="5" fill="white" />
                  <text x={lx} y={ly - 18} textAnchor="middle" fontSize="8" fill="#93c5fd" fontWeight="600">YOU</text>
                </g>
              );
            })()}
          </g>
        </svg>
      </div>

      {/* Assembly point info */}
      <div className="evac-map-assembly">
        <span className="evac-assembly-icon">🏁</span>
        <div className="evac-assembly-text">
          <div className="evac-assembly-label">Assembly Point</div>
          <div className="evac-assembly-name">{assemblyPoint.name}</div>
          <div className="evac-assembly-desc">{assemblyPoint.description}</div>
        </div>
        <div className="evac-assembly-cap">Cap: {assemblyPoint.capacity}</div>
      </div>
    </div>
  );
}

export default EmergencyEvacuationMap;
