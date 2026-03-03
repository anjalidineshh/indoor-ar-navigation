import React, { useEffect, useRef, useState, useCallback } from 'react';
import Tesseract from 'tesseract.js';
import { getLocationNames, getGraph } from '../data/indoorMap';
import './ARVisualization.css';

function ARVisualization({
  currentLocation,
  destination,
  route,
  onLocationFound,
  isEmergency,
  active = false,       // Only starts camera when true
  scanningOnly = false, // Skip AR overlays, just camera + scan frame
  viewMode = 'ar',      // 'ar' | '2d'
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [heading, setHeading] = useState(0);
  const [detectedText, setDetectedText] = useState('');

  // ─── Camera startup (only when active=true) ───────────────────────
  useEffect(() => {
    if (!active) return;

    let stream = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' }, // prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          setCameraError(false);
        }
      } catch (err) {
        console.warn('Camera unavailable:', err.message);
        setCameraActive(false);
        setCameraError(true);
      }
    };

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
    };
  }, [active]);

  // ─── Device orientation / compass ─────────────────────────────────
  useEffect(() => {
    if (!active) return;
    let fallback;

    const handleOrientation = (e) => {
      if (e.alpha !== null && typeof e.alpha === 'number') {
        setHeading((360 - e.alpha + 360) % 360);
        if (fallback) { clearInterval(fallback); fallback = null; }
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);

    // Fallback animation on desktop (no real compass)
    fallback = setInterval(() => setHeading(h => (h + 0.5) % 360), 50);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (fallback) clearInterval(fallback);
    };
  }, [active]);

  // ─── OCR scanning loop ─────────────────────────────────────────────
  useEffect(() => {
    if (!active || !cameraActive || currentLocation) return;

    let isScanning = false;
    const locations = getLocationNames();
    const allKeywords = locations.map(l => l.name.toLowerCase().split(' ')).flat().filter(w => w.length > 2);
    allKeywords.push('hod');

    const scanInterval = setInterval(async () => {
      if (isScanning || !videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) return;
      isScanning = true;

      try {
        const tc = document.createElement('canvas');
        tc.width = videoRef.current.videoWidth;
        tc.height = videoRef.current.videoHeight;
        tc.getContext('2d').drawImage(videoRef.current, 0, 0, tc.width, tc.height);

        const { data: { text } } = await Tesseract.recognize(tc, 'eng', { logger: () => { } });
        const rawText = text.toLowerCase().trim();
        const rawTextClean = rawText.replace(/[^a-z0-9]/gi, '');
        const displaySafe = rawText.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').replace(/[^a-z0-9\s]/gi, '').trim();

        const hasValidKeyword = allKeywords.some(kw => rawTextClean.includes(kw));
        if (rawTextClean.length > 4 && displaySafe.length > 4 && hasValidKeyword) {
          setDetectedText(displaySafe.substring(0, 30));
        } else {
          setDetectedText('');
        }

        let bestMatch = null;
        let highestScore = 0;
        for (const loc of locations) {
          let score = 0;
          if (rawText.includes(loc.id.replace(/_/g, ' '))) score += 100;
          const nameKws = loc.name.toLowerCase().split(' ').filter(w => w.length > 4);
          for (const kw of nameKws) {
            if (rawText.includes(kw)) score += 10;
            else if (kw.length > 4 && rawTextClean.includes(kw.substring(0, 4))) score += 5;
          }
          if (loc.id === 'mech_hod' && (rawTextClean.includes('mechhod') || rawTextClean.includes('hod')) && !rawTextClean.includes('ai')) score += 50;
          if (loc.id === 'ai_hod' && (rawTextClean.includes('aihod') || (rawTextClean.includes('ai') && rawTextClean.includes('hod')))) score += 50;
          if (score > highestScore) { highestScore = score; bestMatch = loc; }
        }
        if (bestMatch && highestScore >= 5 && onLocationFound) onLocationFound(bestMatch);
      } catch (e) {
        console.error(e);
      } finally {
        isScanning = false;
      }
    }, 1500);

    return () => clearInterval(scanInterval);
  }, [active, cameraActive, currentLocation, onLocationFound]);

  // ─── Canvas drawing loop ───────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Match canvas size to its CSS display size
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (viewMode === '2d') {
      draw2DMap(ctx, W, H, currentLocation, destination, route, isEmergency);
    } else if (!scanningOnly && currentLocation && destination) {
      drawAROverlay(ctx, W, H, currentLocation, destination, route, heading, isEmergency);
    } else if (!scanningOnly && currentLocation && !destination) {
      // Show "you are here" hint
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      roundRect(ctx, W / 2 - 150, H / 2 - 40, 300, 80, 12);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('📍 ' + currentLocation.name, W / 2, H / 2 - 8);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '13px Arial';
      ctx.fillText('Select a destination to navigate', W / 2, H / 2 + 18);
    }

    // Compass HUD — bottom-right corner (away from all buttons)
    if (viewMode === 'ar' && !scanningOnly) drawCompassHUD(ctx, W, H, heading, cameraActive);

    animRef.current = requestAnimationFrame(drawLoop);
  }, [currentLocation, destination, route, heading, isEmergency, viewMode, scanningOnly, cameraActive]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawLoop]);

  // ─── Render ────────────────────────────────────────────────────────
  return (
    <div className="ar-visualization">
      {/* Live camera feed */}
      <video
        ref={videoRef}
        className="ar-video"
        autoPlay
        playsInline
        muted
        style={{ display: cameraActive ? 'block' : 'none' }}
      />

      {/* Dark background when no camera */}
      {!cameraActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, #0d1b2a 0%, #050a10 100%)',
        }} />
      )}

      {/* Canvas AR overlay */}
      <canvas ref={canvasRef} className="ar-canvas" />

      {/* Camera error message */}
      {cameraError && !cameraActive && (
        <div style={{
          position: 'absolute', bottom: '40%', left: '50%',
          transform: 'translateX(-50%)', zIndex: 10,
          background: 'rgba(0,0,0,0.85)', borderRadius: '12px',
          padding: '1rem 1.5rem', textAlign: 'center', color: '#f59e0b',
          border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap',
        }}>
          ⚠️ Camera unavailable — AR mode simulation
        </div>
      )}

      {/* Scanning frame overlay */}
      {!currentLocation && cameraActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -55%)',
          width: 'min(75vw, 280px)', height: 'min(45vw, 160px)',
          border: '2px solid rgba(16,185,129,0.5)',
          borderRadius: '16px',
          boxShadow: '0 0 30px rgba(16,185,129,0.2), inset 0 0 20px rgba(16,185,129,0.1)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: '14px', pointerEvents: 'none', zIndex: 10,
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.88)', padding: '8px 18px',
            borderRadius: '12px', border: '1px solid rgba(16,185,129,0.5)',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Scan Room Sign
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>
              {detectedText ? `"${detectedText}"` : 'Scanning...'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Helper: AR overlay drawing (3D arrow + compass + distance)
// ──────────────────────────────────────────────────────────────────────
function drawAROverlay(ctx, W, H, currentLocation, destination, route, heading, isEmergency) {
  const cx = W / 2;
  const isAlert = isEmergency;

  const dx = destination.x - currentLocation.x;
  const dy = destination.y - currentLocation.y;
  let bearing = Math.atan2(dy, dx) * (180 / Math.PI);
  bearing = (90 - bearing + 360) % 360;
  const relative = ((bearing - heading) + 360) % 360;

  render3DArrow(ctx, cx, H, relative * (Math.PI / 180), isAlert);

  // Destination info box
  ctx.fillStyle = isAlert ? 'rgba(69,10,10,0.85)' : 'rgba(0,0,0,0.82)';
  ctx.strokeStyle = isAlert ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  roundRect(ctx, cx - 130, H - 105, 260, 82, 12);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = isAlert ? '#fca5a5' : '#10b981';
  ctx.font = 'bold 17px "Space Grotesk", Arial';
  ctx.textAlign = 'center';
  ctx.fillText((isAlert ? '🚨 ' : '📍 ') + destination.name, cx, H - 66);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px "Outfit", Arial';
  ctx.fillText(isAlert ? 'EVACUATE IMMEDIATELY' : 'Follow the AR arrow', cx, H - 43);

  // Distance badge
  if (route?.distance) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    roundRect(ctx, 16, H / 2 - 44, 90, 88, 12);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 22px "Space Grotesk", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(route.distance.toFixed(0) + 'm', 61, H / 2 + 2);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText('Distance', 61, H / 2 + 22);
  }
}

function render3DArrow(ctx, cx, H, angle3D, isAlert) {
  const cy = H - 165;
  const scale = 1.2;
  const w1 = 15 * scale, w2 = 40 * scale;
  const l1 = -50 * scale, l2 = 20 * scale, l3 = 80 * scale;
  const depth = 25 * scale;

  const pts = [
    { x: 0, z: l3 }, { x: -w2, z: l2 }, { x: -w1, z: l2 },
    { x: -w1, z: l1 }, { x: w1, z: l1 }, { x: w1, z: l2 }, { x: w2, z: l2 },
  ];

  const t = Date.now() / 300;
  const hoverY = Math.sin(t) * 12 - 20;
  const pitch = Math.PI / 5;
  const cosP = Math.cos(pitch), sinP = Math.sin(pitch);
  const cosA = Math.cos(angle3D), sinA = Math.sin(angle3D);

  const project = (x, y, z) => {
    let rx = x * cosA + z * sinA;
    let rz = -x * sinA + z * cosA;
    let ry = y + hoverY;
    rz += 50;
    let px = rx;
    let py = ry * cosP - rz * sinP;
    let pz = ry * sinP + rz * cosP;
    const fov = 400, dist = 350;
    let s = fov / (dist + pz);
    return { x: cx + px * s, y: cy + py * s };
  };

  const top = pts.map(p => project(p.x, -depth / 2, p.z));
  const bot = pts.map(p => project(p.x, depth / 2, p.z));

  const light = isAlert ? '#b91c1c' : '#38bdf8';
  const mid = isAlert ? '#991b1b' : '#0ea5e9';
  const dark = isAlert ? '#7f1d1d' : '#0284c7';
  ctx.lineWidth = 1;

  for (let i = 0; i < pts.length; i++) {
    const next = (i + 1) % pts.length;
    const dx = top[next].x - top[i].x, dy = top[next].y - top[i].y;
    const dx2 = bot[i].x - top[i].x, dy2 = bot[i].y - top[i].y;
    if (dx * dy2 - dy * dx2 > 0) {
      ctx.beginPath();
      ctx.moveTo(top[i].x, top[i].y);
      ctx.lineTo(top[next].x, top[next].y);
      ctx.lineTo(bot[next].x, bot[next].y);
      ctx.lineTo(bot[i].x, bot[i].y);
      ctx.closePath();
      ctx.fillStyle = (i === 1 || i === 4) ? light : (i === 0 || i === 6) ? mid : dark;
      ctx.fill();
      ctx.strokeStyle = isAlert ? '#450a0a' : '#0c4a6e';
      ctx.stroke();
    }
  }

  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  for (let i = 1; i < top.length; i++) ctx.lineTo(top[i].x, top[i].y);
  ctx.closePath();
  ctx.shadowColor = isAlert ? 'rgba(239,68,68,1)' : 'rgba(56,189,248,1)';
  ctx.shadowBlur = 25;
  ctx.fillStyle = isAlert ? '#ef4444' : '#0ea5e9';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ──────────────────────────────────────────────────────────────────────
// Helper: 2D top-down minimap
// ──────────────────────────────────────────────────────────────────────
function draw2DMap(ctx, W, H, currentLocation, destination, route, isEmergency) {
  const graph = getGraph();
  const nodes = graph.getAllNodes();

  // Compute bounding box of all nodes
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x;
    if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.y > maxY) maxY = n.y;
  }

  const padding = 40;
  const scaleX = (W - padding * 2) / (maxX - minX || 1);
  const scaleY = (H - padding * 2) / (maxY - minY || 1);
  const scale = Math.min(scaleX, scaleY);

  const toScreen = (x, y) => ({
    sx: padding + (x - minX) * scale,
    sy: padding + (y - minY) * scale,
  });

  // Background
  ctx.fillStyle = 'rgba(11,15,25,0.95)';
  ctx.fillRect(0, 0, W, H);

  // Draw all edges
  for (const node of nodes) {
    const neighbors = graph.getNeighbors(node.id);
    if (!neighbors || neighbors.length === 0) continue;
    for (const { to } of neighbors) {
      const nb = nodes.find(n => n.id === to);
      if (!nb) continue;
      const a = toScreen(node.x, node.y);
      const b = toScreen(nb.x, nb.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }
  }

  // Draw route path highlighted
  if (route?.path && route.path.length > 1) {
    const pathColor = isEmergency ? '#ef4444' : '#3b82f6';
    ctx.strokeStyle = pathColor;
    ctx.lineWidth = 5;
    ctx.shadowColor = pathColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    let started = false;
    for (const id of route.path) {
      const n = nodes.find(x => x.id === id);
      if (!n) continue;
      const { sx, sy } = toScreen(n.x, n.y);
      if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Draw all nodes as dots
  for (const node of nodes) {
    const { sx, sy } = toScreen(node.x, node.y);
    const isExit = node.isExit;

    ctx.fillStyle = isExit ? '#f59e0b' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(sx, sy, isExit ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '9px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(node.name.split(' ')[0], sx, sy - 8);
  }

  // Current location dot
  if (currentLocation) {
    const { sx, sy } = toScreen(currentLocation.x, currentLocation.y);
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOU', sx, sy + 4);
  }

  // Destination dot
  if (destination) {
    const { sx, sy } = toScreen(destination.x ?? 0, destination.y ?? 0);
    const destColor = isEmergency ? '#ef4444' : '#f59e0b';
    ctx.fillStyle = destColor;
    ctx.shadowColor = destColor;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(sx, sy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('DEST', sx, sy + 4);
  }

  // 2D mode label
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('2D Map View', 12, 20);
}

// ──────────────────────────────────────────────────────────────────────
// Helper: small top-left compass HUD
// ──────────────────────────────────────────────────────────────────────
function drawCompassHUD(ctx, W, H, heading, cameraActive) {
  // Position: bottom-right, above the action bar (~160px from bottom)
  const cx = W - 55;
  const cy = H - 160;
  const r = 32;

  // Background
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  roundRect(ctx, W - 100, H - 200, 90, 90, 10);
  ctx.fill();

  // Compass ring
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // North marker (rotates with heading)
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-heading * (Math.PI / 180));
  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -(r - 8));
  ctx.fillStyle = '#fff';
  ctx.fillText('S', 0, r - 8);
  ctx.restore();

  // Camera status
  ctx.fillStyle = cameraActive ? '#00ff00' : '#f59e0b';
  ctx.font = '9px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cameraActive ? '● CAM' : '● SIM', cx, H - 118);
  ctx.textBaseline = 'alphabetic';
}

// ──────────────────────────────────────────────────────────────────────
// Utility: rounded rectangle path
// ──────────────────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default ARVisualization;
