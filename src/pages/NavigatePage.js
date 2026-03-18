import React, { useState, useEffect } from 'react';
import ARVisualization from '../components/ARVisualization';
import EmergencyHUD from '../components/EmergencyHUD';
import EmergencyEvacuationMap from '../components/EmergencyEvacuationMap';
import { getRoute, getEvacuationRoute } from '../logic/pathfinding';
import { getLocationNames, getLocationById } from '../data/indoorMap';

const PHASE = {
  START: 'start',        // Intro screen with "Start Navigation" button
  SCANNING: 'scanning',  // Back camera live, scanning room markers
  DESTINATION: 'destination', // Location detected, pick destination
  AR: 'ar',              // Full AR navigation mode
};

function NavigatePage({
  currentLocation, setCurrentLocation,
  destination, setDestination,
  onBack, onMapView,
  globalEmergency, setGlobalEmergency,
}) {
  const [locations, setLocations] = useState([]);
  const [route, setRoute] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [showEmergencyHUD, setShowEmergencyHUD] = useState(false);
  const [showEvacMap, setShowEvacMap] = useState(false);
  // waypointIndex = index in route.path of the NEXT room to head toward
  // 0 = current location, 1 = first stop, path.length-1 = destination
  const [waypointIndex, setWaypointIndex] = useState(1);
  // Restore correct phase when returning from 2D Map
  const [phase, setPhase] = useState(() => {
    if (currentLocation && destination) return PHASE.AR;
    if (currentLocation) return PHASE.DESTINATION;
    return PHASE.SCANNING; // skip intro, go straight to camera
  });


  useEffect(() => { setIsEmergency(globalEmergency || false); }, [globalEmergency]);
  useEffect(() => { setLocations(getLocationNames()); }, []);

  // When emergency triggers from global, jump to AR mode and show HUD
  useEffect(() => {
    if (globalEmergency && phase !== PHASE.AR) setPhase(PHASE.AR);
    if (globalEmergency) setShowEmergencyHUD(true);
  }, [globalEmergency, phase]);

  // Advance from scanning → destination once location is found
  useEffect(() => {
    if (currentLocation && phase === PHASE.SCANNING) {
      setPhase(PHASE.DESTINATION);
    }
  }, [currentLocation, phase]);

  // Calculate route whenever source / dest / emergency changes
  useEffect(() => {
    if (isEmergency && currentLocation) {
      const r = getEvacuationRoute(currentLocation.id);
      setRoute(r);
      setWaypointIndex(1); // reset to first step
    } else if (currentLocation && destination) {
      const r = getRoute(currentLocation.id, destination.id);
      setRoute(r);
      setWaypointIndex(1); // reset to first step
    }
  }, [currentLocation, destination, isEmergency]);


  const handleLocationFound = (loc) => {
    if (!loc) return;
    if (phase === PHASE.SCANNING) {
      setCurrentLocation(loc);
      return;
    }
    // During AR navigation — if camera sees a room that's in the route path,
    // auto-advance the waypoint to the NEXT step after that room
    if (phase === PHASE.AR && route?.path) {
      const idxInPath = route.path.indexOf(loc.id);
      if (idxInPath >= 0) {
        const newIdx = Math.min(idxInPath + 1, route.path.length - 1);
        setWaypointIndex(newIdx);
        setCurrentLocation(loc);
      }
    }
  };

  const handleSelectDestination = (loc) => {
    setDestination(loc);
    const startId = currentLocation?.id || 'left_stairs';
    setRoute(getRoute(startId, loc.id));
    setPhase(PHASE.AR);
  };

  const handleEmergency = () => {
    if (setGlobalEmergency) setGlobalEmergency(true);
    setIsEmergency(true);
    setShowEmergencyHUD(true);
    if (phase !== PHASE.AR) setPhase(PHASE.AR);
  };

  const handleCancelEmergency = () => {
    if (setGlobalEmergency) setGlobalEmergency(false);
    setIsEmergency(false);
    setShowEmergencyHUD(false);
    setShowEvacMap(false);
    if (currentLocation && destination) setRoute(getRoute(currentLocation.id, destination.id));
    else setRoute(null);
  };


  // ────────────────────────────────────────────────────────
  // PHASE: SCANNING — camera live, reading markers
  // ────────────────────────────────────────────────────────
  if (phase === PHASE.SCANNING) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
        <ARVisualization
          currentLocation={null}
          destination={null}
          route={null}
          onLocationFound={handleLocationFound}
          isEmergency={false}
          active={true}
          scanningOnly={true}
          viewMode="ar"
        />

        {/* Scanning status banner */}
        <div style={{
          position: 'absolute', top: '1.25rem', left: '50%',
          transform: 'translateX(-50%)', zIndex: 30, whiteSpace: 'nowrap',
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
          borderRadius: '24px', padding: '0.6rem 1.5rem',
          border: '1px solid rgba(16,185,129,0.4)',
          color: '#10b981', fontWeight: 'bold', fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%',
            background: '#10b981', display: 'inline-block',
            animation: 'pulse-danger 1.5s infinite',
          }} />
          Scanning room marker...
        </div>

        {/* Hint text */}
        <div style={{
          position: 'absolute', top: '5rem', left: '50%',
          transform: 'translateX(-50%)', zIndex: 30,
          color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem',
          textAlign: 'center', whiteSpace: 'nowrap',
        }}>
          Point camera at a room name / door sign
        </div>

        {/* Cancel */}
        <button
          onClick={onBack}
          style={{
            position: 'absolute', bottom: '2.5rem', left: '50%',
            transform: 'translateX(-50%)', zIndex: 30,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '24px', padding: '0.75rem 2.5rem',
            cursor: 'pointer', fontSize: '1rem',
          }}
        >
          ✕ Cancel
        </button>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // PHASE: DESTINATION — location found, pick where to go
  // ────────────────────────────────────────────────────────
  if (phase === PHASE.DESTINATION) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
        {/* Live AR camera background */}
        <ARVisualization
          currentLocation={currentLocation}
          destination={null}
          route={null}
          onLocationFound={handleLocationFound}
          isEmergency={false}
          active={true}
          scanningOnly={false}
          viewMode="ar"
        />

        {/* Bottom sheet */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
          background: 'rgba(11, 15, 25, 0.97)', backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '24px 24px 0 0',
          padding: '1.75rem 1.5rem 2.25rem',
        }}>
          {/* Current location pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '1.25rem', padding: '0.875rem 1rem',
            background: 'rgba(16,185,129,0.08)', borderRadius: '14px',
            border: '1px solid rgba(16,185,129,0.25)',
          }}>
            <span style={{ fontSize: '1.4rem' }}>📍</span>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>You are here</div>
              <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1rem' }}>{currentLocation.name}</div>
            </div>
            <button
              onClick={() => { setCurrentLocation(null); setPhase(PHASE.SCANNING); }}
              style={{
                background: 'none', color: '#64748b',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                padding: '5px 12px', cursor: 'pointer', fontSize: '12px',
              }}
            >
              Rescan
            </button>
          </div>

          <label style={{
            color: '#94a3b8', fontSize: '0.85rem',
            display: 'block', marginBottom: '0.75rem', fontWeight: '500',
          }}>
            🎯 Where do you want to go?
          </label>

          <select
            style={{
              width: '100%', padding: '0.9rem 1rem', borderRadius: '14px',
              background: '#1e293b', color: '#fff',
              border: '1px solid rgba(255,255,255,0.12)',
              fontSize: '1rem', marginBottom: '1rem', cursor: 'pointer',
              appearance: 'none', WebkitAppearance: 'none',
            }}
            value=""
            onChange={(e) => {
              const loc = locations.find(l => l.id === e.target.value);
              if (loc) handleSelectDestination(loc);
            }}
          >
            <option value="">— Select a destination —</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>

          <button
            className="btn btn-danger"
            style={{ width: '100%', fontSize: '0.95rem' }}
            onClick={handleEmergency}
          >
            🚨 Emergency Exit
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // PHASE: AR — full navigation view
  // ────────────────────────────────────────────────────────
  const path = route?.path || [];
  const totalSteps = Math.max(path.length - 1, 1);
  const safeWpIdx = Math.min(waypointIndex, path.length - 1);
  const nextWaypointId = path[safeWpIdx];
  const nextWaypoint = nextWaypointId ? getLocationById(nextWaypointId) : null;
  const isLastStep = safeWpIdx >= path.length - 1;
  const hasArrived = isLastStep && path.length > 1;

  // Arrow points to NEXT WAYPOINT in path, not straight to final destination
  const arrowTarget = isEmergency
    ? { name: 'EMERGENCY EXIT', id: path[path.length - 1], x: 0, y: 0 }
    : (nextWaypoint || destination);

  // ── Open AR.js WebAR page ──────────────────────────────────────────────────
  const openARjsView = () => {
    const dest = destination || arrowTarget;
    const next = nextWaypoint || destination;

    // Calculate compass-relative bearing to next waypoint
    // so the AR arrow points in roughly the right horizontal direction
    let angleDeg = 0;
    if (currentLocation && next) {
      const dx = next.x - currentLocation.x;
      const dy = next.y - currentLocation.y;
      // Bearing: 0 = up (north on map), clockwise
      let bearing = Math.atan2(dx, -dy) * (180 / Math.PI);
      bearing = (bearing + 360) % 360;
      angleDeg = Math.round(bearing);
    }

    const p = new URLSearchParams({
      dest: encodeURIComponent(dest?.name || 'Destination'),
      next: encodeURIComponent(next?.name || dest?.name || ''),
      step: String(safeWpIdx),
      total: String(totalSteps),
      dist: route?.distance ? String(Math.round(route.distance)) : '',
      angle: String(angleDeg),
      emergency: isEmergency ? '1' : '0',
      return: window.location.pathname,
    });

    window.open(`/ar.html?${p.toString()}`, '_blank');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', background: '#000' }}>
      <ARVisualization
        currentLocation={currentLocation}
        destination={arrowTarget}
        route={route}
        onLocationFound={handleLocationFound}
        isEmergency={isEmergency}
        active={true}
        scanningOnly={false}
        viewMode="ar"
      />

      {/* ── Top HUD bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0.75rem 1rem',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, transparent 100%)',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '12px', padding: '8px 16px',
            cursor: 'pointer', fontSize: '0.85rem',
          }}
        >
          ← Home
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {/* 3D WebAR button — opens ar.html with AR.js */}
          <button
            onClick={openARjsView}
            style={{
              background: 'linear-gradient(135deg, rgba(56,189,248,0.9), rgba(14,165,233,0.9))',
              backdropFilter: 'blur(12px)',
              color: '#fff', border: '1px solid rgba(56,189,248,0.5)',
              borderRadius: '12px', padding: '8px 14px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
              boxShadow: '0 0 16px rgba(56,189,248,0.35)',
            }}
          >
            🔮 3D AR
          </button>
          {/* Open the existing 2D map page */}
          <button
            onClick={onMapView}
            style={{
              background: 'rgba(59,130,246,0.85)', backdropFilter: 'blur(12px)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px', padding: '8px 14px',
              cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold',
            }}
          >
            🗺️ 2D Map
          </button>
        </div>
      </div>

      {/* ── Emergency banner ── */}
      {isEmergency && (
        <div style={{
          position: 'absolute', top: '4rem', left: '1rem', right: '1rem', zIndex: 30,
          background: '#ef4444', color: 'white', padding: '12px', borderRadius: '12px',
          textAlign: 'center', fontWeight: 'bold', animation: 'pulse-danger 1.5s infinite',
        }}>
          ⚠️ EMERGENCY — Follow AR arrow to nearest Exit
        </div>
      )}

      {/* ── Bottom info / action bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 60%, transparent 100%)',
        padding: '1.5rem 1.5rem 2rem',
      }}>

        {/* Arrived banner */}
        {hasArrived && (
          <div style={{
            background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)',
            borderRadius: '14px', padding: '0.875rem 1rem',
            marginBottom: '0.875rem', textAlign: 'center',
          }}>
            <div style={{ color: '#10b981', fontWeight: '700', fontSize: '1.1rem' }}>✅ You have arrived!</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>{destination?.name}</div>
          </div>
        )}

        {/* Step counter + next room */}
        {!hasArrived && nextWaypoint && (
          <div style={{
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: '14px', padding: '0.75rem 1rem',
            marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step {safeWpIdx} of {totalSteps}
              </div>
              <div style={{ color: '#3b82f6', fontWeight: '700', fontSize: '1rem', marginTop: '2px' }}>
                → Head to: {nextWaypoint.name}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: '#10b981', fontSize: '1.4rem', fontWeight: '800', lineHeight: 1 }}>
                {route?.distance ? route.distance.toFixed(0) : '—'}m
              </div>
              <div style={{ color: '#64748b', fontSize: '0.7rem' }}>total</div>
            </div>
          </div>
        )}

        {/* Final destination label */}
        <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
          🎯 Destination: <span style={{ color: '#fff' }}>{destination?.name || arrowTarget?.name}</span>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          {isEmergency ? (
            <button className="btn btn-secondary" onClick={() => setShowEmergencyHUD(true)} style={{ flex: 1 }}>
              🚨 Emergency Guide
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleEmergency} style={{ flex: 1, fontSize: '0.85rem' }}>
              🚨 Emergency
            </button>
          )}

          {/* Manual advance button — tap when you physically reach the waypoint */}
          {!hasArrived && !isEmergency && (
            <button
              onClick={() => setWaypointIndex(v => Math.min(v + 1, path.length - 1))}
              style={{
                background: 'rgba(16,185,129,0.2)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px',
                padding: '0.75rem 0.875rem', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap',
              }}
            >
              ✓ Reached
            </button>
          )}

          <button
            onClick={() => setPhase(PHASE.DESTINATION)}
            style={{
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px',
              padding: '0.75rem 0.875rem', cursor: 'pointer',
              fontSize: '0.8rem', whiteSpace: 'nowrap',
            }}
          >
            Change
          </button>
        </div>
      </div>
      {/* ── Emergency HUD overlay ── */}
      {isEmergency && showEmergencyHUD && (
        <EmergencyHUD
          evacuationRoute={route}
          currentLocation={currentLocation}
          waypointIndex={waypointIndex}
          onShowMap={() => { setShowEmergencyHUD(false); setShowEvacMap(true); }}
          onCancelEmergency={handleCancelEmergency}
          onAdvanceWaypoint={() => setWaypointIndex(v => Math.min(v + 1, (route?.path?.length ?? 1) - 1))}
        />
      )}

      {/* ── Evacuation map overlay ── */}
      {isEmergency && showEvacMap && (
        <EmergencyEvacuationMap
          currentLocation={currentLocation}
          evacuationRoute={route}
          onClose={() => { setShowEvacMap(false); setShowEmergencyHUD(true); }}
        />
      )}

      {/* ── Emergency mode: quick-open HUD button (when map is hidden) ── */}
      {isEmergency && !showEmergencyHUD && !showEvacMap && (
        <button
          onClick={() => setShowEmergencyHUD(true)}
          style={{
            position: 'absolute', top: '4.5rem', left: '50%',
            transform: 'translateX(-50%)', zIndex: 50,
            background: '#ef4444', color: '#fff',
            border: 'none', borderRadius: '99px',
            padding: '0.6rem 1.4rem', cursor: 'pointer',
            fontSize: '0.85rem', fontWeight: '700',
            boxShadow: '0 4px 20px rgba(239,68,68,0.5)',
          }}
        >
          🚨 Open Emergency Guide
        </button>
      )}
    </div>
  );
}

export default NavigatePage;
