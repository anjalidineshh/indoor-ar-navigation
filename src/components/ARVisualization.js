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
  active = false,
  scanningOnly = false,
  viewMode = 'ar',
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const workerRef = useRef(null);       // Tesseract persistent worker

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [heading, setHeading] = useState(0);
  const [detectedText, setDetectedText] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'scanning' | 'found'

  const headingRef = useRef(0);
  useEffect(() => { headingRef.current = heading; }, [heading]);

  // ─── Tesseract persistent worker (created once, reused for speed) ──────────
  useEffect(() => {
    if (!active) return;
    let worker;

    const initWorker = async () => {
      worker = await Tesseract.createWorker('eng', 1, {
        logger: () => { },
      });
      await worker.setParameters({
        tessedit_pageseg_mode: '11',   // PSM 11 = sparse text, fastest for signs
        tessedit_char_whitelist:
          'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ()-./',
      });
      workerRef.current = worker;
    };

    initWorker().catch(console.error);

    return () => {
      if (worker) worker.terminate();
      workerRef.current = null;
    };
  }, [active]);

  // ─── Camera startup (progressive fallback for mobile) ─────────────────────
  useEffect(() => {
    if (!active) return;

    let stream = null;
    const videoEl = videoRef.current;

    const startCamera = async () => {
      const attempts = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        { video: { facingMode: 'environment' } },
        { video: true },
      ];

      let lastErr = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastErr = err;
          stream = null;
        }
      }

      if (stream && videoEl) {
        videoEl.srcObject = stream;
        try { await videoEl.play(); } catch (e) { }
        setCameraActive(true);
        setCameraError('');
      } else {
        const msg = lastErr ? `${lastErr.name}: ${lastErr.message}` : 'Camera unavailable';
        setCameraActive(false);
        setCameraError(msg);
      }
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('getUserMedia not supported — must use HTTPS in Chrome/Firefox');
      return;
    }

    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (videoEl) { videoEl.pause(); videoEl.srcObject = null; }
      setCameraActive(false);
    };
  }, [active]);

  // ─── Device orientation / compass ─────────────────────────────────────────
  useEffect(() => {
    if (!active) return;
    let fallback;

    const handleOrientation = (e) => {
      if (e.alpha !== null && typeof e.alpha === 'number') {
        const h = (360 - e.alpha + 360) % 360;
        setHeading(h);
        headingRef.current = h;
        if (fallback) { clearInterval(fallback); fallback = null; }
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);
    fallback = setInterval(() => {
      setHeading(h => { const n = (h + 0.4) % 360; headingRef.current = n; return n; });
    }, 50);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      if (fallback) clearInterval(fallback);
    };
  }, [active]);

  // ─── OCR scanning loop (fast: 350ms, persistent worker, PSM 11) ───────────
  useEffect(() => {
    if (!active || !cameraActive || currentLocation) return;

    let isScanning = false;
    const locations = getLocationNames();
    const allKeywords = locations
      .map(l => l.name.toLowerCase().split(' '))
      .flat()
      .filter(w => w.length > 2);
    allKeywords.push('hod');

    const scanInterval = setInterval(async () => {
      if (isScanning || !workerRef.current) return;
      const video = videoRef.current;
      if (!video || video.readyState < video.HAVE_ENOUGH_DATA) return;

      isScanning = true;
      setScanStatus('scanning');

      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        // Smaller canvas = faster OCR (400px instead of 600px)
        const cropW = Math.floor(vw * 0.65);
        const cropH = Math.floor(vh * 0.50);
        const cropX = Math.floor((vw - cropW) / 2);
        const cropY = Math.floor((vh - cropH) / 2);

        const targetW = 400;
        const targetH = Math.floor(cropH * (targetW / cropW));

        const tc = document.createElement('canvas');
        tc.width = targetW; tc.height = targetH;
        const tCtx = tc.getContext('2d');
        tCtx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);

        // Preprocessing: grayscale + high contrast
        const imgData = tCtx.getImageData(0, 0, targetW, targetH);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          let gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          gray = Math.min(255, gray + 20);
          let c = ((gray - 128) * 2.5) + 128;
          c = Math.max(0, Math.min(255, c));
          d[i] = d[i + 1] = d[i + 2] = c;
        }
        tCtx.putImageData(imgData, 0, 0);

        // Use persistent worker (much faster than creating new worker each time)
        const { data: { text } } = await workerRef.current.recognize(tc);

        const rawText = text.toLowerCase().trim();
        const rawTextClean = rawText.replace(/[^a-z0-9]/gi, '');
        const displaySafe = rawText
          .replace(/[\r\n]+/g, ' ')
          .replace(/\s+/g, ' ')
          .replace(/[^a-z0-9\s]/gi, '')
          .trim();

        const hasKeyword = allKeywords.some(kw => rawTextClean.includes(kw));
        if (rawTextClean.length > 3 && hasKeyword) {
          setDetectedText(displaySafe.substring(0, 30));
        } else {
          setDetectedText('');
        }

        // Match to a known location
        let bestMatch = null, highestScore = 0;
        for (const loc of locations) {
          let score = 0;
          if (rawText.includes(loc.id.replace(/_/g, ' '))) score += 100;
          const nameKws = loc.name.toLowerCase().split(' ').filter(w => w.length > 3);
          for (const kw of nameKws) {
            if (rawText.includes(kw)) score += 10;
            else if (rawTextClean.includes(kw.substring(0, 4))) score += 4;
          }
          if (loc.id === 'mech_hod' && rawTextClean.includes('hod') && !rawTextClean.includes('ai')) score += 50;
          if (loc.id === 'ai_hod' && rawTextClean.includes('ai') && rawTextClean.includes('hod')) score += 50;
          if (score > highestScore) { highestScore = score; bestMatch = loc; }
        }

        if (bestMatch && highestScore >= 5) {
          setScanStatus('found');
          if (onLocationFound) onLocationFound(bestMatch);
        } else {
          setScanStatus('idle');
        }

      } catch (e) {
        console.error('OCR error:', e);
      } finally {
        isScanning = false;
      }
    }, 350); // ← 350ms (was 700ms) — 2× faster

    return () => clearInterval(scanInterval);
  }, [active, cameraActive, currentLocation, onLocationFound]);

  // ─── Canvas draw loop: AR overlay + 2D map + compass ──────────────────────
  const drawLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (canvas.width !== canvas.offsetWidth || canvas.height !== canvas.offsetHeight) {
      canvas.width = canvas.offsetWidth || window.innerWidth;
      canvas.height = canvas.offsetHeight || window.innerHeight;
    }
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (viewMode === '2d') {
      draw2DMap(ctx, W, H, currentLocation, destination, route, isEmergency);
    } else if (!scanningOnly && currentLocation && destination) {
      drawARNavOverlay(ctx, W, H, currentLocation, destination, route, headingRef.current, isEmergency);
    } else if (!scanningOnly && currentLocation && !destination) {
      drawLocationFound(ctx, W, H, currentLocation);
    }

    if (viewMode === 'ar' && !scanningOnly) {
      drawCompassHUD(ctx, W, H, headingRef.current, cameraActive);
    }

    animRef.current = requestAnimationFrame(drawLoop);
  }, [currentLocation, destination, route, isEmergency, viewMode, scanningOnly, cameraActive]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawLoop);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawLoop]);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ar-visualization" ref={containerRef}>
      <video
        ref={videoRef}
        className="ar-video"
        autoPlay playsInline muted
        webkit-playsinline="true"
        onCanPlay={(e) => { e.target.play().catch(() => { }); }}
        style={{ display: cameraActive ? 'block' : 'none' }}
      />

      {!cameraActive && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, #0d1b2a 0%, #050a10 100%)',
        }} />
      )}

      <canvas ref={canvasRef} className="ar-canvas" />

      {/* Camera error */}
      {cameraError && !cameraActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', zIndex: 10,
          background: 'rgba(0,0,0,0.92)', borderRadius: '16px',
          padding: '1.5rem', textAlign: 'center',
          border: '1px solid rgba(245,158,11,0.4)', maxWidth: '85vw',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📷</div>
          <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '14px', marginBottom: '6px' }}>Camera blocked</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '12px', wordBreak: 'break-word' }}>{cameraError}</div>
          <div style={{ color: '#64748b', fontSize: '10px', lineHeight: 1.8 }}>
            1. Open <b style={{ color: '#38bdf8' }}>https://</b> not http://<br />
            2. Accept the SSL warning<br />
            3. Tap "Allow" for camera
          </div>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '12px', background: '#f59e0b', color: '#000',
            border: 'none', borderRadius: '8px', padding: '8px 20px',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '13px',
          }}>🔄 Retry</button>
        </div>
      )}

      {/* Scanning frame */}
      {!currentLocation && cameraActive && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -55%)',
          width: 'min(78vw, 300px)', height: 'min(48vw, 170px)',
          border: `2px solid ${scanStatus === 'found' ? 'rgba(16,185,129,0.9)' : 'rgba(16,185,129,0.5)'}`,
          borderRadius: '16px',
          boxShadow: `0 0 30px ${scanStatus === 'found' ? 'rgba(16,185,129,0.5)' : 'rgba(16,185,129,0.2)'}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          paddingBottom: '14px', pointerEvents: 'none', zIndex: 10,
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}>
          {/* Corner marks */}
          {[['top:0;left:0', 'borderTop', 'borderLeft'],
          ['top:0;right:0', 'borderTop', 'borderRight'],
          ['bottom:0;left:0', 'borderBottom', 'borderLeft'],
          ['bottom:0;right:0', 'borderBottom', 'borderRight']
          ].map(([pos], idx) => (
            <div key={idx} style={{
              position: 'absolute',
              ...Object.fromEntries(pos.split(';').map(p => p.split(':'))),
              width: 20, height: 20,
              borderColor: '#10b981', borderStyle: 'solid', borderWidth: 0,
              ...(idx === 0 ? { borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 } :
                idx === 1 ? { borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 } :
                  idx === 2 ? { borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 } :
                    { borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 }),
            }} />
          ))}

          <div style={{
            background: 'rgba(0,0,0,0.88)', padding: '8px 18px',
            borderRadius: '12px', border: '1px solid rgba(16,185,129,0.5)',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {scanStatus === 'scanning' ? '⚡ Reading...' : 'Scan Room Sign'}
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>
              {detectedText ? `"${detectedText}"` : scanStatus === 'scanning' ? '...' : 'Point at door sign'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AR Navigation Overlay — compass-based directional arrow with turn guidance
// ─────────────────────────────────────────────────────────────────────────────
function drawARNavOverlay(ctx, W, H, currentLocation, destination, route, heading, isEmergency) {
  const cx = W / 2;
  const alert = isEmergency;

  // ── Compute bearing to NEXT waypoint (not just destination) ──────────────
  let targetNode = destination;
  if (route?.waypoints && route.waypoints.length > 1) {
    targetNode = route.waypoints[1]; // next step in route
  }

  const dx = targetNode.x - currentLocation.x;
  const dy = targetNode.y - currentLocation.y;
  // Map Y is top-down; convert to compass bearing
  let bearing = Math.atan2(dx, -dy) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  const relative = ((bearing - heading) + 360) % 360;
  const angleRad = (relative * Math.PI) / 180;

  // ── Turn direction label ──────────────────────────────────────────────────
  let turnLabel, turnEmoji;
  if (relative < 30 || relative > 330) { turnLabel = 'STRAIGHT'; turnEmoji = '↑'; }
  else if (relative < 75) { turnLabel = 'SLIGHT RIGHT'; turnEmoji = '↗'; }
  else if (relative < 135) { turnLabel = 'TURN RIGHT'; turnEmoji = '→'; }
  else if (relative < 180) { turnLabel = 'SHARP RIGHT'; turnEmoji = '↘'; }
  else if (relative < 210) { turnLabel = 'U-TURN'; turnEmoji = '↩'; }
  else if (relative < 255) { turnLabel = 'SHARP LEFT'; turnEmoji = '↙'; }
  else if (relative < 285) { turnLabel = 'TURN LEFT'; turnEmoji = '←'; }
  else { turnLabel = 'SLIGHT LEFT'; turnEmoji = '↖'; }

  const t = Date.now() / 1000;
  const pulse = 0.94 + Math.sin(t * 2.5) * 0.06;
  const hoverY = Math.sin(t * 1.8) * 10;

  const arrowCenterY = H * 0.38 + hoverY;

  // ── Draw glowing arrow ────────────────────────────────────────────────────
  ctx.save();
  ctx.translate(cx, arrowCenterY);
  ctx.rotate(angleRad);
  ctx.scale(pulse, pulse);

  const arrowColor = alert ? '#ef4444' : '#38bdf8';
  const glowColor = alert ? 'rgba(239,68,68,' : 'rgba(56,189,248,';

  // Outer glow rings (2 rings for depth)
  for (let i = 2; i >= 1; i--) {
    ctx.shadowColor = arrowColor;
    ctx.shadowBlur = 30 * i;
    ctx.strokeStyle = `${glowColor}${0.15 * i})`;
    ctx.lineWidth = 4 * i;
    drawArrowPath(ctx, 0, 0, 70);
    ctx.stroke();
  }

  // Main arrow fill
  ctx.shadowColor = arrowColor;
  ctx.shadowBlur = 25;
  ctx.fillStyle = alert
    ? 'rgba(239,68,68,0.92)'
    : 'rgba(14,165,233,0.92)';
  drawArrowPath(ctx, 0, 0, 70);
  ctx.fill();

  // White stroke outline
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 0;
  drawArrowPath(ctx, 0, 0, 70);
  ctx.stroke();

  // Inner highlight (top face shimmer)
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  drawArrowPath(ctx, 0, 0, 60);
  ctx.fill();

  ctx.restore();

  // ── Turn direction badge ──────────────────────────────────────────────────
  const badgeY = arrowCenterY + 110;
  const badgePad = 18;
  ctx.font = 'bold 14px "Outfit", Arial';
  const textW = ctx.measureText(turnLabel).width;
  const badgeW = textW + badgePad * 2 + 32;

  ctx.fillStyle = alert ? 'rgba(127,29,29,0.92)' : 'rgba(0,20,60,0.92)';
  ctx.strokeStyle = alert ? 'rgba(239,68,68,0.7)' : 'rgba(56,189,248,0.7)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - badgeW / 2, badgeY - 18, badgeW, 38, 10);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = alert ? '#fca5a5' : '#e0f2fe';
  ctx.font = 'bold 14px "Outfit", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${turnEmoji}  ${turnLabel}`, cx, badgeY + 1);

  // ── Distance + destination card (bottom) ──────────────────────────────────
  const cardY = H - 130;
  ctx.fillStyle = alert ? 'rgba(69,10,10,0.92)' : 'rgba(5,12,30,0.92)';
  ctx.strokeStyle = alert ? 'rgba(239,68,68,0.4)' : 'rgba(56,189,248,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, cx - 160, cardY, 320, 108, 16);
  ctx.fill(); ctx.stroke();

  // Dest name
  ctx.fillStyle = alert ? '#fca5a5' : '#38bdf8';
  ctx.font = 'bold 15px "Space Grotesk", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const destName = destination?.name || '';
  ctx.fillText((alert ? '🚨 ' : '📍 ') + destName, cx, cardY + 28);

  // Next waypoint (if different from destination)
  if (route?.waypoints?.length > 1 && targetNode !== destination) {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText(`→ Next: ${targetNode.name}`, cx, cardY + 52);
  }

  // Distance badge
  if (route?.distance) {
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 20px "Space Grotesk", Arial';
    ctx.fillText(route.distance.toFixed(0) + 'm total', cx, cardY + 82);
  }

  // ── Step dots (progress indicator) ───────────────────────────────────────
  if (route?.waypoints?.length > 1) {
    const total = route.waypoints.length;
    const dotSpacing = Math.min(18, (W - 60) / total);
    const dotStartX = cx - ((total - 1) * dotSpacing) / 2;

    for (let i = 0; i < total; i++) {
      const dotX = dotStartX + i * dotSpacing;
      const dotY = cardY - 14;
      const isCurrent = i === 0;
      const isNext = i === 1;

      ctx.beginPath();
      ctx.arc(dotX, dotY, isCurrent ? 5 : isNext ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#10b981' : isNext ? '#38bdf8' : 'rgba(255,255,255,0.2)';
      ctx.fill();

      if (i < total - 1) {
        ctx.beginPath();
        ctx.moveTo(dotX + (isCurrent ? 5 : 3), dotY);
        ctx.lineTo(dotX + dotSpacing - (isNext ? 4 : 3), dotY);
        ctx.strokeStyle = i === 0 ? '#38bdf8' : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }
}

// Reusable arrow path (centered at 0,0, pointing UP, scaled by size)
function drawArrowPath(ctx, cx, cy, size) {
  const s = size;
  ctx.beginPath();
  // Arrow tip at top, pointing up
  ctx.moveTo(cx, cy - s * 0.9);          // tip
  ctx.lineTo(cx + s * 0.55, cy + s * 0.1); // right wing outer
  ctx.lineTo(cx + s * 0.22, cy + s * 0.1); // right wing inner
  ctx.lineTo(cx + s * 0.22, cy + s * 0.75);// right base
  ctx.lineTo(cx - s * 0.22, cy + s * 0.75);// left base
  ctx.lineTo(cx - s * 0.22, cy + s * 0.1); // left wing inner
  ctx.lineTo(cx - s * 0.55, cy + s * 0.1); // left wing outer
  ctx.closePath();
}

// ─── "Location found" hint (no destination yet) ───────────────────────────
function drawLocationFound(ctx, W, H, currentLocation) {
  const cx = W / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  roundRect(ctx, cx - 160, H / 2 - 50, 320, 95, 16);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 16px "Outfit", Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('📍 ' + currentLocation.name, cx, H / 2 - 16);
  ctx.fillStyle = '#64748b';
  ctx.font = '13px Arial';
  ctx.fillText('Select a destination below', cx, H / 2 + 16);
}

// ─── 2D minimap ───────────────────────────────────────────────────────────
function draw2DMap(ctx, W, H, currentLocation, destination, route, isEmergency) {
  const graph = getGraph();
  const nodes = graph.getAllNodes();

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of nodes) {
    if (n.x < minX) minX = n.x; if (n.x > maxX) maxX = n.x;
    if (n.y < minY) minY = n.y; if (n.y > maxY) maxY = n.y;
  }

  const padding = 40;
  const scale = Math.min(
    (W - padding * 2) / (maxX - minX || 1),
    (H - padding * 2) / (maxY - minY || 1)
  );
  const toScreen = (x, y) => ({
    sx: padding + (x - minX) * scale,
    sy: padding + (y - minY) * scale,
  });

  ctx.fillStyle = 'rgba(11,15,25,0.97)';
  ctx.fillRect(0, 0, W, H);

  for (const node of nodes) {
    for (const { to } of (graph.getNeighbors(node.id) || [])) {
      const nb = nodes.find(n => n.id === to);
      if (!nb) continue;
      const a = toScreen(node.x, node.y), b = toScreen(nb.x, nb.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.sx, a.sy); ctx.lineTo(b.sx, b.sy); ctx.stroke();
    }
  }

  if (route?.path?.length > 1) {
    const col = isEmergency ? '#ef4444' : '#3b82f6';
    ctx.strokeStyle = col; ctx.lineWidth = 5;
    ctx.shadowColor = col; ctx.shadowBlur = 12;
    ctx.beginPath();
    let started = false;
    for (const id of route.path) {
      const n = nodes.find(x => x.id === id); if (!n) continue;
      const { sx, sy } = toScreen(n.x, n.y);
      if (!started) { ctx.moveTo(sx, sy); started = true; } else ctx.lineTo(sx, sy);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
  }

  for (const node of nodes) {
    const { sx, sy } = toScreen(node.x, node.y);
    ctx.fillStyle = node.isExit ? '#f59e0b' : 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(sx, sy, node.isExit ? 6 : 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '8px Arial'; ctx.textAlign = 'center';
    ctx.fillText(node.name.split(' ')[0], sx, sy - 7);
  }

  if (currentLocation) {
    const { sx, sy } = toScreen(currentLocation.x, currentLocation.y);
    ctx.fillStyle = '#10b981'; ctx.shadowColor = '#10b981'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center'; ctx.fillText('YOU', sx, sy + 3);
  }

  if (destination) {
    const { sx, sy } = toScreen(destination.x ?? 0, destination.y ?? 0);
    const dc = isEmergency ? '#ef4444' : '#f59e0b';
    ctx.fillStyle = dc; ctx.shadowColor = dc; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff'; ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center'; ctx.fillText('DEST', sx, sy + 3);
  }

  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '11px Arial';
  ctx.textAlign = 'left'; ctx.fillText('2D Map View', 12, 20);
}

// ─── Compass HUD ──────────────────────────────────────────────────────────
function drawCompassHUD(ctx, W, H, heading, cameraActive) {
  const cx = W - 50, cy = H - 160, r = 28;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  roundRect(ctx, W - 88, H - 196, 80, 80, 10); ctx.fill();

  ctx.strokeStyle = cameraActive ? '#10b981' : '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-heading * (Math.PI / 180));
  ctx.fillStyle = '#ef4444'; ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -(r - 8));
  ctx.fillStyle = '#fff'; ctx.fillText('S', 0, r - 8);
  ctx.restore();

  ctx.fillStyle = cameraActive ? '#10b981' : '#f59e0b';
  ctx.font = '8px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(cameraActive ? '● LIVE' : '● SIM', cx, H - 120);
  ctx.textBaseline = 'alphabetic';
}

// ─── Round rect utility ───────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default ARVisualization;
