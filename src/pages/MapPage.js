import React, { useState, useEffect } from 'react';
import FloorPlan from '../components/FloorPlan';
import { getRoute, getEvacuationRoute } from '../logic/pathfinding';
import { getLocationNames } from '../data/indoorMap';
// styling handled by global.css


function MapPage({ currentLocation, destination, setDestination, onBack, onNavigate }) {
  const [locations, setLocations] = useState([]);
  const [route, setRoute] = useState(null);
  const [showDestinations, setShowDestinations] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    const locs = getLocationNames();
    setLocations(locs);
  }, []);

  useEffect(() => {
    if (isEmergency && currentLocation) {
      const evacuationRoute = getEvacuationRoute(currentLocation.id);
      setRoute(evacuationRoute);
    } else if (currentLocation && destination) {
      const calculatedRoute = getRoute(currentLocation.id, destination.id);
      setRoute(calculatedRoute);
    }
  }, [currentLocation, destination, isEmergency]);

  const handleSelectDestination = (loc) => {
    setDestination(loc);
    setIsEmergency(false);
    // Immediately calculate and show route from current location (fallback to left_stairs)
    const startId = currentLocation?.id || 'left_stairs';
    const calculated = getRoute(startId, loc.id);
    setRoute(calculated);
  };

  const handleEmergency = () => {
    setIsEmergency(true);
  };

  return (
    <div className="container nav-layout">
      <div className="sidebar">
        <button className="btn btn-secondary" onClick={onBack}>← Home</button>
        <button className="btn btn-secondary" onClick={onNavigate}>📱 AR View</button>

        <div style={{ marginTop: '1rem' }}>
          <label style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '0.5rem' }}>Choose Destination:</label>
          <select 
            style={{ 
              width: '100%', 
              padding: '10px', 
              borderRadius: '6px',
              background: '#1e293b',
              color: '#fff',
              border: '1px solid #475569',
              fontSize: '14px'
            }}
            value={destination?.id || ''}
            onChange={(e) => {
              const loc = locations.find(l => l.id === e.target.value);
              if (loc) handleSelectDestination(loc);
            }}
          >
            <option value="">-- Select a location --</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        {destination && (
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
            📍 Destination: {destination.name}
          </button>
        )}

        {route && !isEmergency && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '8px', border: '1px solid #3b82f6' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>📊 Route Info</h3>
            <p style={{ margin: '0.25rem 0' }}><strong>Distance:</strong> {route.distance.toFixed(1)}m</p>
            <p style={{ margin: '0.25rem 0', fontSize: '12px', opacity: 0.8 }}>via {route.path.length} locations</p>
          </div>
        )}

        {route && isEmergency && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: '8px', border: '1px solid #ef4444' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#ef4444' }}>⚠️ Emergency Route</h3>
            <p style={{ margin: '0.25rem 0' }}>Fastest exit: {route.distance.toFixed(1)}m away</p>
            <button className="btn btn-secondary" onClick={() => { setIsEmergency(false); setRoute(null); }} style={{ marginTop: '0.5rem', width: '100%' }}>
              ← Back
            </button>
          </div>
        )}

        <button className="btn btn-danger" onClick={handleEmergency} style={{ marginTop: '1rem', width: '100%' }}>
          🚨 Emergency Exit
        </button>
      </div>

      <div className="map-container">
        <FloorPlan currentLocation={currentLocation} destination={destination} route={route} />
      </div>
    </div>
  );
}

export default MapPage;
