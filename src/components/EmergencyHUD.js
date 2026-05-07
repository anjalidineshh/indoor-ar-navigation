import React, { useState, useEffect, useCallback } from 'react';
import {
  EVACUATION_INSTRUCTIONS,
  EMERGENCY_CONTACTS,
  estimateEvacuationTime,
  getExitById,
  getAssemblyPointForExit,
} from '../data/emergencyData';
import './EmergencyHUD.css';

/**
 * Format a location ID (snake_case) into a human-readable name.
 */
function formatLocationName(id) {
  if (!id) return 'EXIT';
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * EmergencyHUD — full-screen overlay displayed when emergency mode is active.
 * Shows countdown timer, step-by-step evacuation directions, exit details,
 * assembly point info, and emergency contacts.
 */
function EmergencyHUD({
  evacuationRoute,
  currentLocation,
  waypointIndex,
  onShowMap,
  onCancelEmergency,
  onAdvanceWaypoint,
}) {
  const path = evacuationRoute?.path || [];
  const totalDist = evacuationRoute?.distance || 0;
  const exitId = path[path.length - 1];
  const exitInfo = getExitById(exitId);
  const assemblyPoint = exitInfo ? getAssemblyPointForExit(exitId) : null;

  const etaSec = estimateEvacuationTime(totalDist);

  // Countdown starts at estimated evacuation time and counts down
  const [countdown, setCountdown] = useState(etaSec > 0 ? etaSec : 120);
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [showContacts, setShowContacts] = useState(false);

  // Reset countdown when route changes
  useEffect(() => {
    setCountdown(etaSec > 0 ? etaSec : 120);
  }, [etaSec]);

  // Countdown tick
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Cycle through evacuation instructions every 4 seconds
  useEffect(() => {
    const t = setInterval(() => {
      setInstructionIndex(i => (i + 1) % EVACUATION_INSTRUCTIONS.length);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const safeWpIdx = Math.min(waypointIndex, path.length - 1);
  const nextNodeId = path[safeWpIdx];
  const totalSteps = Math.max(path.length - 1, 1);
  const hasArrived = safeWpIdx >= path.length - 1 && path.length > 1;

  const formatCountdown = useCallback((secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  const countdownUrgent = countdown <= 30;

  return (
    <div className="ehud-overlay" role="alert" aria-live="assertive" aria-label="Emergency evacuation HUD">
      {/* Top banner */}
      <div className="ehud-top-banner">
        <span className="ehud-siren">🚨</span>
        <span className="ehud-title">EMERGENCY EVACUATION</span>
        <span className="ehud-siren">🚨</span>
      </div>

      {/* Countdown + exit info */}
      <div className="ehud-main-row">
        <div className={`ehud-countdown ${countdownUrgent ? 'ehud-countdown-urgent' : ''}`}>
          <div className="ehud-countdown-label">Evacuate in</div>
          <div className="ehud-countdown-value">{formatCountdown(countdown)}</div>
        </div>

        <div className="ehud-exit-info">
          {exitInfo ? (
            <>
              <div className="ehud-exit-label">Nearest Exit</div>
              <div className="ehud-exit-name">🚪 {exitInfo.name}</div>
              <div className="ehud-exit-desc">{exitInfo.description}</div>
            </>
          ) : (
            <div className="ehud-exit-name">Follow green arrows</div>
          )}
          <div className="ehud-dist">📏 {Math.round(totalDist)}m total</div>
        </div>
      </div>

      {/* Step-by-step directions */}
      <div className="ehud-directions">
        <div className="ehud-dir-header">
          <span>📍 Step-by-Step Directions</span>
          <span className="ehud-step-counter">{safeWpIdx} / {totalSteps}</span>
        </div>

        {hasArrived ? (
          <div className="ehud-arrived">
            ✅ You have reached the exit!
            {assemblyPoint && (
              <div className="ehud-assembly-hint">Proceed to: {assemblyPoint.name}</div>
            )}
          </div>
        ) : (
          <>
            <div className="ehud-next-step">
              → Head to: <strong>{formatLocationName(nextNodeId)}</strong>
            </div>
            <div className="ehud-progress-bar">
              <div
                className="ehud-progress-fill"
                style={{ width: `${(safeWpIdx / totalSteps) * 100}%` }}
              />
            </div>
          </>
        )}
      </div>

      {/* Rotating evacuation instruction */}
      <div className="ehud-instruction-ticker">
        <span className="ehud-instruction-icon">⚠️</span>
        <span className="ehud-instruction-text">{EVACUATION_INSTRUCTIONS[instructionIndex]}</span>
      </div>

      {/* Assembly point */}
      {assemblyPoint && (
        <div className="ehud-assembly">
          <span className="ehud-assembly-icon">🏁</span>
          <div>
            <div className="ehud-assembly-label">Assembly Point</div>
            <div className="ehud-assembly-name">{assemblyPoint.name}</div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="ehud-actions">
        {!hasArrived && (
          <button className="ehud-btn ehud-btn-advance" onClick={onAdvanceWaypoint}>
            ✓ Reached Waypoint
          </button>
        )}
        <button className="ehud-btn ehud-btn-map" onClick={onShowMap}>
          🗺️ View Map
        </button>
        <button
          className="ehud-btn ehud-btn-contacts"
          onClick={() => setShowContacts(v => !v)}
        >
          📞 Contacts
        </button>
      </div>

      {/* Emergency contacts panel */}
      {showContacts && (
        <div className="ehud-contacts-panel">
          <div className="ehud-contacts-title">Emergency Contacts</div>
          {EMERGENCY_CONTACTS.map(c => (
            <a key={c.name} href={`tel:${c.number}`} className="ehud-contact-item">
              <span className="ehud-contact-icon">{c.icon}</span>
              <span className="ehud-contact-name">{c.name}</span>
              <span className="ehud-contact-number">{c.number}</span>
            </a>
          ))}
        </div>
      )}

      {/* Cancel emergency */}
      <button className="ehud-cancel" onClick={onCancelEmergency}>
        Cancel Emergency Alert
      </button>
    </div>
  );
}

export default EmergencyHUD;
