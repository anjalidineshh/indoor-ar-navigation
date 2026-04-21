/**
 * ARVisualization.js
 *
 * FULL NAVIGATION FLOW (like Google Maps indoors):
 * ─────────────────────────────────────────────────
 * PHASE 1 — SCAN (once at start)
 *   • Mind AR watches camera for any room nameboard
 *   • When detected → location is set automatically
 *
 * PHASE 2 — WALK (no more scanning needed)
 *   • Accelerometer counts steps → estimates distance walked
 *   • Arrow points toward next waypoint, updates as user turns
 *   • When walked distance >= edge distance → auto advance to next node
 *   • At corridor junctions → passive Mind AR marker corrects position if seen
 *
 * PHASE 3 — ARRIVED
 *   • Green celebration shown when destination reached
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { getGraph } from '../data/indoorMap';
import { PedometerNavigator } from '../logic/pedometerNav';
import './ARVisualization.css';

// ─── Marker index → location ID ───────────────────────────────────────────────
// ORDER must match the order you uploaded images to Mind AR compiler tool
// https://hiukim.github.io/mind-ar-js-doc/tools/compile
export const MARKER_TARGETS = [
  { index: 0, locationId: 'thermal_lab', name: 'Thermal Engineering Lab II' },
  { index: 1, locationId: 'machine_tools_lab', name: 'Machine Tools Lab II' },
  { index: 2, locationId: 'mech_faculty', name: 'Mech Faculty Room' },
  { index: 3, locationId: 'lecture_a', name: 'Lecture Hall A' },
  { index: 4, locationId: 'lecture_b', name: 'Lecture Hall B' },
  { index: 5, locationId: 'lecture_c', name: 'Lecture Hall C' },
  { index: 6, locationId: 'lecture_d', name: 'Lecture Hall D' },
  { index: 7, locationId: 'faculty_center', name: 'Faculty Center' },
  { index: 8, locationId: 'faculty_room', name: 'Faculty Room' },
  { index: 9, locationId: 'mech_hod', name: 'Mech HOD' },
  { index: 10, locationId: 'ai_hod', name: 'AI HOD' },
  { index: 11, locationId: 'left_stairs', name: 'Left Stairs' },
  { index: 12, locationId: 'right_stairs', name: 'Right Stairs' },
  { index: 13, locationId: 'stairs_right_side', name: 'Stairs (Right Side)' },
];

// ─── Load Mind AR + A-Frame once ──────────────────────────────────────────────
let mindARLoaded = false;
function loadMindAR() {
  if (mindARLoaded) return Promise.resolve();
  return new Promise(resolve => {
    const aframe = document.createElement('script');
    aframe.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
    aframe.onload = () => {
      const mindar = document.createElement('script');
      mindar.src = 'https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js';
      mindar.onload = () => { mindARLoaded = true; resolve(); };
      document.head.appendChild(mindar);
    };
    document.head.appendChild(aframe);
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ARVisualization({
  currentLocation,
  destination,
  route,
  onLocationFound,
  isEmergency,
  active = false,
  scanningOnly = false,
  viewMode = 'ar',
}) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const sceneContainerRef = useRef(null);
  const videoRef = useRef(null);
  const pedNavRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [heading, setHeading] = useState(0);
  const [scanStatus, setScanStatus] = useState('idle');
  const [detectedLabel, setDetectedLabel] = useState('');
  const [scriptsReady, setScriptsReady] = useState(false);

  // Navigation state — updated by pedometer
  const [activeLocation, setActiveLocation] = useState(null);  // current node while walking
  const [activeNext, setActiveNext] = useState(null);  // next node
  const [arrived, setArrived] = useState(false);
  const [navProgress, setNavProgress] = useState(null);

  const headingRef = useRef(0);
  const activeLocRef = useRef(null);
  const activeNextRef = useRef(null);
  useEffect(() => { headingRef.current = heading; }, [heading]);
  useEffect(() => { activeLocRef.current = activeLocation; }, [activeLocation]);
  useEffect(() => { activeNextRef.current = activeNext; }, [activeNext]);

  // ── Load Mind AR scripts ─────────────────────────────────────────────────
  useEffect(() => {
    if (!active || scriptsReady) return;
    loadMindAR().then(() => setScriptsReady(true));
  }, [active, scriptsReady]);

  // ── PHASE 1: Mind AR scene — scan initial marker ─────────────────────────
  useEffect(() => {
    if (!active || !scriptsReady || currentLocation) return;
    const container = sceneContainerRef.current;
    if (!container) return;

    container.innerHTML = '';
    setScanStatus('scanning');

    const entities = MARKER_TARGETS.map(t => `
      <a-entity
        mindar-image-target="targetIndex: ${t.index}"
        id="target-${t.index}"
        data-location-id="${t.locationId}"
        data-location-name="${t.name}">
        <a-plane width="1" height="0.5"
          material="opacity:0;transparent:true;"></a-plane>
      </a-entity>`).join('');

    container.innerHTML = `
      <a-scene id="mindar-scene"
        mindar-image="imageTargetSrc:/markers/targets.mind;
                      autoStart:true;uiLoading:no;uiError:no;uiScanning:no;"
        embedded vr-mode-ui="enabled:false"
        renderer="logarithmicDepthBuffer:true;precision:medium;"
        style="width:100%;height:100%;position:absolute;top:0;left:0;z-index:1;">
        <a-camera position="0 0 0" look-controls="enabled:false"></a-camera>
        ${entities}
      </a-scene>`;

    const scene = container.querySelector('#mindar-scene');
    const attach = () => {
      setCameraActive(true);
      MARKER_TARGETS.forEach(t => {
        const el = container.querySelector(`#target-${t.index}`);
        if (!el) return;
        el.addEventListener('targetFound', () => {
          const loc = getGraph().getNode(t.locationId);
          if (!loc) return;
          setDetectedLabel(t.name);
          setScanStatus('found');
          if (onLocationFound) onLocationFound(loc);
        });
        el.addEventListener('targetLost', () => {
          setScanStatus('scanning');
          setDetectedLabel('');
        });
      });
    };
    if (scene.hasLoaded) attach();
    else scene.addEventListener('loaded', attach);

    return () => {
      try {
        const s = container.querySelector('#mindar-scene');
        if (s?.components?.['mindar-image']) s.components['mindar-image'].pause();
      } catch (_) { }
      container.innerHTML = '';
      setCameraActive(false);
    };
  }, [active, scriptsReady, currentLocation, onLocationFound]);

  // ── PHASE 2: Start pedometer when route is ready ─────────────────────────
  useEffect(() => {
    if (!active || !route?.waypoints?.length || !currentLocation) return;

    // Stop any previous navigator
    if (pedNavRef.current) { pedNavRef.current.stop(); pedNavRef.current = null; }

    setActiveLocation(route.waypoints[0]);
    setActiveNext(route.waypoints[1] || null);
    setArrived(false);

    const nav = new PedometerNavigator(
      route,
      // onWaypointReached — auto advance to next node
      (newNode, remaining) => {
        setActiveLocation(newNode);
        setActiveNext(remaining[1] || null);
        setNavProgress(nav.getProgress());
      },
      // onArrived
      () => {
        setArrived(true);
        setNavProgress(nav.getProgress());
      }
    );

    pedNavRef.current = nav;
    nav.start();

    // Update progress display every second
    const progressTimer = setInterval(() => {
      if (pedNavRef.current) setNavProgress(pedNavRef.current.getProgress());
    }, 1000);

    return () => {
      nav.stop();
      clearInterval(progressTimer);
      pedNavRef.current = null;
    };
  }, [active, route, currentLocation]);


  // ── Plain camera for AR overlay while navigating ─────────────────────────
  useEffect(() => {
    if (!active || !currentLocation) return;
    const videoEl = videoRef.current;
    if (!videoEl) return;
    let stream = null;

    const start = async () => {
      const cfgs = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } },
        { video: { facingMode: 'environment' } },
        { video: true },
      ];
      for (const cfg of cfgs) {
        try { stream = await navigator.mediaDevices.getUserMedia(cfg); break; }
        catch (_) { stream = null; }
      }
      if (stream && videoEl) {
        videoEl.srcObject = stream;
        try { await videoEl.play(); } catch (_) { }
        setCameraActive(true);
      } else {
        setCameraError('Camera unavailable — use HTTPS and allow camera access.');
      }
    };

    if (navigator.mediaDevices?.getUserMedia) start();
    else setCameraError('Camera not supported — use HTTPS in Chrome or Safari.');

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoEl) { videoEl.pause(); videoEl.srcObject = null; }
    };
  }, [active, currentLocation]);

  // ── Compass ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    let fallback;
    const onOri = e => {
      if (e.alpha !== null && typeof e.alpha === 'number') {
        const h = (360 - e.alpha + 360) % 360;
        setHeading(h); headingRef.current = h;
        if (fallback) { clearInterval(fallback); fallback = null; }
      }
    };
    window.addEventListener('deviceorientation', onOri, true);
    fallback = setInterval(() => {
      setHeading(h => { const n = (h + 0.4) % 360; headingRef.current = n; return n; });
    }, 50);
    return () => {
      window.removeEventListener('deviceorientation', onOri, true);
      if (fallback) clearInterval(fallback);
    };
  }, [active]);

  // ── Canvas draw loop ─────────────────────────────────────────────────────
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    }
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Use activeLocation (pedometer-tracked) not static currentLocation
    const navLoc = activeLocRef.current || currentLocation;
    const navNext = activeNextRef.current || destination;

    if (viewMode === '2d') {
      draw2DMap(ctx, W, H, navLoc, destination, route, isEmergency);
    } else if (!scanningOnly && navLoc && destination) {
      if (arrived) {
        drawArrived(ctx, W, H, destination);
      } else {
        drawFloorPath(ctx, W, H, navLoc, navNext || destination,
          route, headingRef.current, isEmergency, navProgress);
      }
    } else if (!scanningOnly && navLoc && !destination) {
      drawLocationFound(ctx, W, H, navLoc);
    }

    if (viewMode === 'ar' && !scanningOnly) {
      drawCompassHUD(ctx, W, H, headingRef.current, cameraActive);
    }

    animRef.current = requestAnimationFrame(drawLoop);
  }, [currentLocation, destination, route, isEmergency, viewMode,
    scanningOnly, cameraActive, arrived, navProgress]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawLoop]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ar-visualization"
      style={{
        position: 'relative', width: '100%', height: '100%',
        overflow: 'hidden', background: '#050a10'
      }}>

      {/* Phase 1 — Mind AR scanning scene */}
      {!currentLocation && (
        <div ref={sceneContainerRef}
          style={{ position: 'absolute', inset: 0, zIndex: 1 }} />
      )}

      {/* Phase 2 — Plain camera for arrow overlay */}
      {currentLocation && (
        <video ref={videoRef} autoPlay playsInline muted
          webkit-playsinline="true"
          onCanPlay={e => e.target.play().catch(() => { })}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
            display: cameraActive ? 'block' : 'none'
          }} />
      )}

      {!cameraActive && !currentLocation && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse at center,#0d1b2a 0%,#050a10 100%)'
        }} />
      )}

      {/* AR canvas overlay */}
      <canvas ref={canvasRef} className="ar-canvas"
        style={{
          position: 'absolute', inset: 0, zIndex: 5,
          pointerEvents: 'none', width: '100%', height: '100%'
        }} />

      {/* Camera error */}
      {cameraError && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 10,
          background: 'rgba(0,0,0,0.92)', borderRadius: 16, padding: '1.5rem',
          textAlign: 'center', border: '1px solid rgba(245,158,11,0.4)',
          maxWidth: '85vw'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📷</div>
          <div style={{
            color: '#f59e0b', fontWeight: 'bold', fontSize: 14,
            marginBottom: 6
          }}>Camera blocked</div>
          <div style={{
            color: '#94a3b8', fontSize: 11, marginBottom: 12,
            wordBreak: 'break-word'
          }}>{cameraError}</div>
          <div style={{ color: '#64748b', fontSize: 10, lineHeight: 1.8 }}>
            1. Open <b style={{ color: '#38bdf8' }}>https://</b> not http://<br />
            2. Accept SSL warning<br />3. Tap "Allow" for camera
          </div>
          <button onClick={() => window.location.reload()} style={{
            marginTop: 12, background: '#f59e0b', color: '#000', border: 'none',
            borderRadius: 8, padding: '8px 20px', fontWeight: 'bold',
            cursor: 'pointer', fontSize: 13
          }}>🔄 Retry</button>
        </div>
      )}

      {/* Phase 1 — Scanning frame UI */}
      {!currentLocation && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-55%)', width: 'min(78vw,300px)',
          height: 'min(48vw,170px)',
          border: `2px solid ${scanStatus === 'found'
            ? 'rgba(16,185,129,0.9)' : 'rgba(16,185,129,0.5)'}`,
          borderRadius: 16,
          boxShadow: `0 0 30px ${scanStatus === 'found'
            ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.2)'}`,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-end', paddingBottom: 14,
          pointerEvents: 'none', zIndex: 10
        }}>

          {[{ t: 0, l: 0 }, { t: 0, r: 0 }, { b: 0, l: 0 }, { b: 0, r: 0 }].map((p, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: p.t !== undefined ? -1 : undefined, bottom: p.b !== undefined ? -1 : undefined,
              left: p.l !== undefined ? -1 : undefined, right: p.r !== undefined ? -1 : undefined,
              width: 14, height: 14, borderColor: '#10b981',
              borderStyle: 'solid', borderWidth: 0,
              ...(i === 0 ? { borderTopWidth: 2.5, borderLeftWidth: 2.5, borderTopLeftRadius: 4 } :
                i === 1 ? { borderTopWidth: 2.5, borderRightWidth: 2.5, borderTopRightRadius: 4 } :
                  i === 2 ? { borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderBottomLeftRadius: 4 } :
                    { borderBottomWidth: 2.5, borderRightWidth: 2.5, borderBottomRightRadius: 4 })
            }} />
          ))}

          <div style={{
            background: 'rgba(0,0,0,0.88)', padding: '8px 18px',
            borderRadius: 12, border: '1px solid rgba(16,185,129,0.5)',
            textAlign: 'center'
          }}>
            <p style={{
              margin: '0 0 4px', fontSize: 10, color: '#64748b',
              textTransform: 'uppercase', letterSpacing: '0.08em'
            }}>
              {scanStatus === 'found' ? '✅ Location Found!' :
                scanStatus === 'scanning' ? '🔍 Scanning...' : 'Loading...'}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: '#10b981', fontWeight: 'bold' }}>
              {detectedLabel ||
                (scanStatus === 'scanning' ? 'Point at any room nameboard' : 'Please wait...')}
            </p>
          </div>
        </div>
      )}

      {/* Phase 2 — Step counter HUD (bottom left) */}
      {currentLocation && navProgress && (
        <div style={{
          position: 'absolute', bottom: 14, left: 14, zIndex: 10,
          background: 'rgba(0,8,20,0.88)', border: '1px solid #00f5ff22',
          borderRadius: 10, padding: '6px 12px'
        }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a8a9a' }}>
            STEPS · {navProgress.distanceWalked}m walked
          </div>
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#00f5ff' }}>
            {navProgress.distanceToNext}m to next point
          </div>
          <div style={{
            marginTop: 4, height: 3, background: '#ffffff10',
            borderRadius: 2, overflow: 'hidden'
          }}>
            <div style={{
              height: '100%', background: '#00f5ff',
              width: `${navProgress.progressPercent}%`,
              transition: 'width 0.5s', borderRadius: 2
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AR Floor Path ────────────────────────────────────────────────────────────
function drawFloorPath(ctx, W, H, currentNode, nextNode, route, heading, isEmergency, progress) {
  if (!currentNode || !nextNode) return;
  const color = isEmergency ? '#ff4444' : '#00f5ff';
  const glow = isEmergency ? 'rgba(255,68,68,' : 'rgba(0,245,255,';
  const t = Date.now() / 1000;

  // Bearing to next node
  const dx = (nextNode.x - currentNode.x);
  const dy = -(nextNode.y - currentNode.y);
  let bearing = Math.atan2(dx, dy) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  const relative = ((bearing - heading) + 360) % 360;
  const angleRad = (relative * Math.PI) / 180;

  // Turn label
  let turnLabel, turnEmoji;
  if (relative < 30 || relative > 330) { turnLabel = 'STRAIGHT AHEAD'; turnEmoji = '↑'; }
  else if (relative < 75) { turnLabel = 'SLIGHT RIGHT'; turnEmoji = '↗'; }
  else if (relative < 135) { turnLabel = 'TURN RIGHT'; turnEmoji = '→'; }
  else if (relative < 180) { turnLabel = 'SHARP RIGHT'; turnEmoji = '↘'; }
  else if (relative < 210) { turnLabel = 'U-TURN'; turnEmoji = '↩'; }
  else if (relative < 255) { turnLabel = 'SHARP LEFT'; turnEmoji = '↙'; }
  else if (relative < 285) { turnLabel = 'TURN LEFT'; turnEmoji = '←'; }
  else { turnLabel = 'SLIGHT LEFT'; turnEmoji = '↖'; }

  // Floor path points — perspective projection
  const spread = Math.sin(angleRad);
  const pts = [];
  for (let i = 0; i <= 5; i++) {
    const p = i / 5;
    pts.push({ x: (0.5 + spread * p * 0.35) * W, y: (0.98 - p * 0.52) * H });
  }

  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // Glow
  for (let pass = 3; pass >= 1; pass--) {
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      if (i < pts.length - 1) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
      } else ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.strokeStyle = `${glow}${0.12 * pass})`; ctx.lineWidth = 6 + pass * 10;
    ctx.shadowColor = color; ctx.shadowBlur = 20 * pass; ctx.stroke();
  }

  // Main line
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    if (i < pts.length - 1) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    } else ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.shadowColor = color; ctx.shadowBlur = 15; ctx.stroke();

  // Travelling dash
  const dashOff = (t * 80) % 40;
  ctx.setLineDash([18, 22]); ctx.lineDashOffset = -dashOff;
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);

  // Arrows
  [{ pt: pts[1], size: 22, a: 1.0 }, { pt: pts[2], size: 16, a: 0.75 }, { pt: pts[3], size: 11, a: 0.5 }]
    .forEach(({ pt, size, a }, idx) => {
      const pulse = 0.88 + Math.sin(t * 3 + idx * 1.2) * 0.12;
      ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(angleRad); ctx.scale(pulse, pulse);
      ctx.shadowColor = color; ctx.shadowBlur = 14;
      ctx.fillStyle = `${glow}${a})`; drawChevron(ctx, 0, 0, size); ctx.fill();
      ctx.strokeStyle = `rgba(255,255,255,${a * 0.7})`; ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0; drawChevron(ctx, 0, 0, size); ctx.stroke();
      ctx.restore();
    });

  // Footprint
  const fp = pts[0], fpP = 0.5 + Math.sin(t * 2.5) * 0.5;
  ctx.beginPath();
  ctx.ellipse(fp.x, fp.y, 28 + fpP * 6, (28 + fpP * 6) * 0.3, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `${glow}${fpP * 0.5})`; ctx.lineWidth = 2;
  ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.stroke();
  ctx.beginPath(); ctx.ellipse(fp.x, fp.y, 8, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.shadowBlur = 20; ctx.fill();
  ctx.restore();

  // Turn badge
  const bY = H * 0.14;
  ctx.font = 'bold 14px Rajdhani,sans-serif';
  const bw = ctx.measureText(`${turnEmoji}  ${turnLabel}`).width + 40;
  ctx.fillStyle = isEmergency ? 'rgba(100,0,0,0.92)' : 'rgba(0,15,40,0.92)';
  ctx.strokeStyle = isEmergency ? 'rgba(255,68,68,0.6)' : 'rgba(0,245,255,0.6)';
  ctx.lineWidth = 1.5; roundRect(ctx, W / 2 - bw / 2, bY - 18, bw, 38, 20);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = isEmergency ? '#ffaaaa' : '#e0f9ff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(`${turnEmoji}  ${turnLabel}`, W / 2, bY + 1);

  // Distance to next node (from pedometer)
  if (progress?.distanceToNext !== undefined) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    roundRect(ctx, W / 2 - 55, bY + 28, 110, 28, 14); ctx.fill();
    ctx.fillStyle = '#00ff88'; ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`${progress.distanceToNext}m to next point`, W / 2, bY + 42);
  }

  // Destination card
  const cY = H - 130;
  ctx.fillStyle = isEmergency ? 'rgba(60,0,0,0.92)' : 'rgba(4,10,28,0.92)';
  ctx.strokeStyle = isEmergency ? 'rgba(255,68,68,0.3)' : 'rgba(0,245,255,0.2)';
  ctx.lineWidth = 1; roundRect(ctx, W / 2 - 155, cY, 310, 112, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = isEmergency ? '#ff8888' : '#00f5ff';
  ctx.font = 'bold 15px Rajdhani,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText((isEmergency ? '🚨 ' : '📍 ') + (route?.waypoints?.[route.waypoints.length - 1]?.name || ''), W / 2, cY + 28);
  ctx.fillStyle = '#7aabb8'; ctx.font = '11px sans-serif';
  ctx.fillText(`→ Next: ${nextNode.name}`, W / 2, cY + 52);
  if (route?.distance) {
    ctx.fillStyle = isEmergency ? '#ff8888' : '#00ff88';
    ctx.font = 'bold 20px Rajdhani,sans-serif';
    ctx.fillText(route.distance.toFixed(0) + 'm total', W / 2, cY + 82);
  }

  // Progress bar
  if (progress) {
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, W / 2 - 155, cY + 100, 310, 8, 4); ctx.fill();
    ctx.fillStyle = isEmergency ? '#ff4444' : '#00f5ff';
    roundRect(ctx, W / 2 - 155, cY + 100, (310 * (progress.progressPercent / 100)), 8, 4); ctx.fill();
  }
}

// ─── Arrived screen ───────────────────────────────────────────────────────────
function drawArrived(ctx, W, H, destination) {
  const cx = W / 2, cy = H / 2, t = Date.now() / 1000;
  for (let i = 3; i >= 1; i--) {
    ctx.beginPath(); ctx.arc(cx, cy, (60 + i * 25) + Math.sin(t * 2) * 8, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(0,255,136,${0.08 * i})`; ctx.lineWidth = 3;
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 20; ctx.stroke();
  }
  ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 30;
  ctx.fillStyle = 'rgba(0,255,136,0.9)';
  ctx.font = 'bold 52px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('✓', cx, cy - 10); ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(0,255,136,0.9)';
  ctx.font = 'bold 18px Rajdhani,sans-serif';
  ctx.fillText('YOU HAVE ARRIVED', cx, cy + 50);
  ctx.fillStyle = '#4a8a8a'; ctx.font = '13px sans-serif';
  ctx.fillText(destination?.name || '', cx, cy + 76);
}

function drawChevron(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.85);
  ctx.lineTo(cx + s * 0.5, cy + s * 0.15); ctx.lineTo(cx + s * 0.18, cy + s * 0.15);
  ctx.lineTo(cx + s * 0.18, cy + s * 0.7); ctx.lineTo(cx - s * 0.18, cy + s * 0.7);
  ctx.lineTo(cx - s * 0.18, cy + s * 0.15); ctx.lineTo(cx - s * 0.5, cy + s * 0.15);
  ctx.closePath();
}

function drawLocationFound(ctx, W, H, loc) {
  const cx = W / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  roundRect(ctx, cx - 155, H / 2 - 50, 310, 95, 16); ctx.fill();
  ctx.fillStyle = '#10b981'; ctx.font = 'bold 16px Rajdhani,sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('📍 ' + loc.name, cx, H / 2 - 16);
  ctx.fillStyle = '#64748b'; ctx.font = '13px sans-serif';
  ctx.fillText('Select a destination below', cx, H / 2 + 16);
}

function draw2DMap(ctx, W, H, currentLocation, destination, route, isEmergency) {
  const graph = getGraph(), nodes = graph.getAllNodes();
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
  }
  const pad = 40, sc = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1));
  const toS = (x, y) => ({ sx: pad + (x - minX) * sc, sy: pad + (y - minY) * sc });
  ctx.fillStyle = 'rgba(11,15,25,0.97)'; ctx.fillRect(0, 0, W, H);
  for (const node of nodes) {
    for (const { to } of (graph.getNeighbors(node.id) || [])) {
      const nb = nodes.find(n => n.id === to); if (!nb) continue;
      const a = toS(node.x, node.y), b = toS(nb.x, nb.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }
  }
  if (route?.path?.length > 1) {
    const col = isEmergency ? '#ef4444' : '#3b82f6';
    ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.beginPath(); let started = false;
    for (const id of route.path) {
      const n = nodes.find(x => x.id === id); if (!n) continue;
      const { sx, sy } = toS(n.x, n.y);
      if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }
  for (const node of nodes) {
    const { sx, sy } = toS(node.x, node.y);
    ctx.fillStyle = node.isExit ? '#f59e0b' : 'rgba(255,255,255,0.18)';
    ctx.beginPath(); ctx.arc(sx, sy, node.isExit ? 6 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '8px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText(node.name.split(' ')[0], sx, sy - 7);
  }
  if (currentLocation) {
    const { sx, sy } = toS(currentLocation.x, currentLocation.y);
    ctx.fillStyle = '#10b981'; ctx.shadowColor = '#10b981'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('YOU', sx, sy + 3);
  }
  if (destination) {
    const { sx, sy } = toS(destination.x ?? 0, destination.y ?? 0);
    const dc = isEmergency ? '#ef4444' : '#f59e0b';
    ctx.fillStyle = dc; ctx.shadowColor = dc; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center'; ctx.fillText('DEST', sx, sy + 3);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.font = '11px sans-serif';
  ctx.textAlign = 'left'; ctx.fillText('2D Map View', 12, 20);
}

function drawCompassHUD(ctx, W, H, heading, cameraActive) {
  const cx = W - 50, cy = H - 160, r = 28;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  roundRect(ctx, W - 88, H - 196, 80, 80, 10); ctx.fill();
  ctx.strokeStyle = cameraActive ? '#10b981' : '#f59e0b'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-heading * (Math.PI / 180));
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -(r - 8)); ctx.fillStyle = '#fff'; ctx.fillText('S', 0, r - 8);
  ctx.restore();
  ctx.fillStyle = cameraActive ? '#10b981' : '#f59e0b'; ctx.font = '8px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(cameraActive ? '● LIVE' : '● SIM', cx, H - 120);
  ctx.textBaseline = 'alphabetic';
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default ARVisualization;