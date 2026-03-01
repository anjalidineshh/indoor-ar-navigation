import React, { useState } from 'react';
import './MapPage.css';

const locations = {
  "Thermal Engineering Lab II": { x: 110, y: 70, entry: { x: 190, y: 70 } },
  "Machine Tools Lab II": { x: 110, y: 170, entry: { x: 190, y: 170 } },
  "Mech Faculty Room": { x: 110, y: 310, entry: { x: 190, y: 310 } },
  "Left Stairs": { x: 130, y: 445, entry: { x: 190, y: 445 } },
  "Mech HOD": { x: 140, y: 520, entry: { x: 190, y: 520 } },

  "Lecture Hall (A)": { x: 280, y: 70, entry: { x: 190, y: 70 } },
  "Lecture Hall (B)": { x: 280, y: 170, entry: { x: 190, y: 170 } },
  "Faculty Center": { x: 260, y: 340, entry: { x: 260, y: 280 } },
  "Girls Toilet": { x: 10, y: 395, entry: { x: 190, y: 395 } },
  "Boys Toilet (Center)": { x: 330, y: 400, entry: { x: 190, y: 400 } },
  "Right Stairs": { x: 260, y: 445, entry: { x: 190, y: 445 } },
  "AI HOD": { x: 260, y: 520, entry: { x: 190, y: 520 } },

  "Boys Toilet (North)": { x: 410, y: 90, entry: { x: 460, y: 90 } },
  "Lecture Hall (C)": { x: 560, y: 90, entry: { x: 460, y: 90 } },
  "Lecture Hall (D)": { x: 560, y: 250, entry: { x: 460, y: 250 } },
  "Stairs (East)": { x: 560, y: 360, entry: { x: 460, y: 360 } },
  "Faculty Room (Right)": { x: 560, y: 450, entry: { x: 460, y: 450 } }
};

function MapPage({ onBack, onNavigate, hasLocation }) {
  const [startVal, setStartVal] = useState('');
  const [destVal, setDestVal] = useState('');
  const [routePath, setRoutePath] = useState('');

  const calculateRoute = () => {
    if (!startVal || !destVal || !locations[startVal] || !locations[destVal]) {
      return;
    }

    const start = locations[startVal];
    const dest = locations[destVal];

    let d = `M ${start.x} ${start.y}`;
    d += ` L ${start.entry.x} ${start.entry.y}`;

    const bridgeY = 280;
    const sameColumn = Math.abs(start.entry.x - dest.entry.x) < 50;

    if (sameColumn) {
      d += ` L ${dest.entry.x} ${dest.entry.y}`;
    } else {
      if (start.entry.y !== bridgeY) d += ` L ${start.entry.x} ${bridgeY}`;
      d += ` L ${dest.entry.x} ${bridgeY}`;
      d += ` L ${dest.entry.x} ${dest.entry.y}`;
    }

    d += ` L ${dest.x} ${dest.y}`;
    setRoutePath(d);
  };

  const options = Object.keys(locations).sort().map(loc => (
    <option key={loc} value={loc}>{loc}</option>
  ));

  return (
    <div className="container animate-enter" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div className="nav-layout">
        <aside className="sidebar">
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={onNavigate} style={{ flexGrow: 1 }}>
              {hasLocation ? '← Back to AR' : '📱 AR Mode'}
            </button>
            <button className="btn btn-secondary" onClick={onBack} style={{ flexGrow: 1 }}>
              🏠 Home
            </button>
          </div>
          <div>
            <h2 style={{ marginBottom: '0.5rem' }}>Current Route</h2>
            <p className="text-muted">Select your destination to begin.</p>
          </div>

          <div className="form-group">
            <label className="form-label">Current Location (Dept / Zone)</label>
            <select className="form-select" value={startVal} onChange={e => setStartVal(e.target.value)}>
              <option value="" disabled>Select Starting Point...</option>
              {options}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Destination</label>
            <select className="form-select" value={destVal} onChange={e => setDestVal(e.target.value)}>
              <option value="" disabled>Select Destination...</option>
              {options}
            </select>
          </div>

          <div className="card" style={{ padding: '1rem', borderColor: 'var(--secondary)' }}>
            <h4 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Crowd Density</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
              <span>Low (Optimal Flow)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', opacity: 0.5 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
              <span>Medium (Moderate)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.5 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--danger)' }}></span>
              <span>High (Congested)</span>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={calculateRoute}>
            Get Optimal Route
          </button>
        </aside>

        <main className="map-container" style={{ height: '600px' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '30px 30px', opacity: 0.2 }}></div>

          <svg width="100%" height="100%" viewBox="0 0 800 600" style={{ background: 'transparent', display: 'block' }}>
            <defs>
              <marker id="arrow-optimal" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#3b82f6" />
              </marker>
            </defs>

            <text x="400" y="30" fill="var(--text-main)" fontSize="16" fontWeight="bold" textAnchor="middle" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Sri Abhinava Vidyatirtha Block</text>

            <g id="map-content" transform="translate(115, 85) scale(0.9)">
              <g stroke="#64748b" strokeWidth="20" fill="none" strokeLinecap="round" opacity="0.6">
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

              <g stroke="#334155" strokeWidth="1" fontWeight="bold" fontSize="10" fillOpacity="0.9">
                <g fill="#38bdf8">
                  <rect x="20" y="20" width="150" height="100" rx="4" />
                  <text x="95" y="65" fill="#0f172a" textAnchor="middle" stroke="none">Thermal Engineering</text>
                  <text x="95" y="80" fill="#0f172a" textAnchor="middle" stroke="none">Lab II</text>
                  <rect x="20" y="130" width="150" height="100" rx="4" />
                  <text x="95" y="180" fill="#0f172a" textAnchor="middle" stroke="none">Machine Tools Lab II</text>
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
                  <text x="95" y="310" fill="#0f172a" textAnchor="middle" stroke="none">Mech Faculty Room</text>
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
                <g fill="#c084fc">
                  <rect x="90" y="420" width="80" height="50" rx="4" />
                  <text x="130" y="450" fill="#0f172a" textAnchor="middle" stroke="none">Left Stairs</text>
                  <rect x="220" y="420" width="80" height="50" rx="4" />
                  <text x="260" y="450" fill="#0f172a" textAnchor="middle" stroke="none">Right Stairs</text>
                  <rect x="490" y="330" width="140" height="60" rx="4" />
                  <text x="560" y="360" fill="#0f172a" textAnchor="middle" stroke="none">Stairs</text>
                </g>
                <g fill="#fb923c">
                  <rect x="0" y="300" width="20" height="150" rx="2" />
                  <text x="10" y="375" fill="#0f172a" fontSize="8" textAnchor="middle" transform="rotate(-90 10 375)" stroke="none">Girls Toilet</text>
                  <rect x="320" y="300" width="20" height="150" rx="2" />
                  <text x="330" y="375" fill="#0f172a" fontSize="8" textAnchor="middle" transform="rotate(-90 330 375)" stroke="none">Boys Toilet</text>
                  <rect x="400" y="20" width="20" height="150" rx="2" />
                  <text x="410" y="95" fill="#0f172a" fontSize="8" textAnchor="middle" transform="rotate(-90 410 95)" stroke="none">Boys Toilet</text>
                </g>
              </g>

              <path id="dynamic-route-path" d={routePath} stroke="#2563eb" strokeWidth="5" fill="none" strokeDasharray="8 4" markerEnd="url(#arrow-optimal)">
                {routePath && <animate attributeName="stroke-dashoffset" from="100" to="0" dur="1s" repeatCount="indefinite" />}
              </path>
            </g>

          </svg>

          <div className="overlay-badge">
            <span role="img" aria-label="wifi">📡</span> Live Positioning
          </div>
        </main>
      </div>
    </div>
  );
}

export default MapPage;
