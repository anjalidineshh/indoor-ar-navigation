import React, { useState } from 'react';
import './EmergencyAlert.css';

/**
 * EmergencyAlert — floating emergency button overlay.
 * Can be placed in any screen and triggers global emergency mode.
 * Shows a confirmation dialog before activating to prevent accidental triggers.
 */
function EmergencyAlert({ onActivate, onCancel, isActive }) {
  const [confirming, setConfirming] = useState(false);

  const handleButtonClick = () => {
    if (isActive) {
      // Already active — offer to cancel
      setConfirming(true);
    } else {
      setConfirming(true);
    }
  };

  const handleConfirm = () => {
    setConfirming(false);
    if (isActive) {
      onCancel();
    } else {
      onActivate();
    }
  };

  const handleDismiss = () => {
    setConfirming(false);
  };

  return (
    <>
      {/* Floating emergency button */}
      <button
        className={`emergency-fab ${isActive ? 'emergency-fab-active' : ''}`}
        onClick={handleButtonClick}
        aria-label={isActive ? 'Cancel emergency alert' : 'Activate emergency evacuation'}
        title={isActive ? 'Cancel Emergency' : 'Emergency Evacuation'}
      >
        <span className="emergency-fab-icon">🚨</span>
        <span className="emergency-fab-label">{isActive ? 'CANCEL' : 'SOS'}</span>
      </button>

      {/* Confirmation dialog */}
      {confirming && (
        <div className="emergency-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="emergency-dialog">
            <div className="emergency-dialog-icon">{isActive ? '❌' : '🚨'}</div>
            <div className="emergency-dialog-title">
              {isActive ? 'Cancel Emergency Alert?' : 'Activate Emergency Evacuation?'}
            </div>
            <div className="emergency-dialog-body">
              {isActive
                ? 'This will stop the evacuation alert and return to normal navigation.'
                : 'This will start emergency evacuation mode and guide you to the nearest exit.'}
            </div>
            <div className="emergency-dialog-actions">
              <button
                className={`emergency-dialog-btn ${isActive ? 'emergency-dialog-btn-danger' : 'emergency-dialog-btn-confirm'}`}
                onClick={handleConfirm}
              >
                {isActive ? 'Yes, Cancel Alert' : '🚨 Activate Now'}
              </button>
              <button className="emergency-dialog-btn emergency-dialog-btn-secondary" onClick={handleDismiss}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EmergencyAlert;
