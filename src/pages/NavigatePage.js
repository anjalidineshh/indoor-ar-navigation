import React, { useState, useEffect } from 'react';
import ARVisualization from '../components/ARVisualization';
import { getRoute, getEvacuationRoute } from '../logic/pathfinding';
import { getLocationNames } from '../data/indoorMap';
// global.css supplies layout styling


function NavigatePage({ currentLocation, destination, setDestination, onBack, onMapView }) {
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
    setShowDestinations(false);
    setIsEmergency(false);
    // Calculate route immediately (fallback start: left_stairs)
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
        <button className="btn btn-secondary" onClick={onMapView}>🗺️ Map</button>
        <div style={{ marginTop: '1rem' }}>
          <div>
            <strong>Current:</strong> {currentLocation?.name || 'Unknown'}
          </div>
          {destination && (
            <div>
              <strong>Destination:</strong> {destination.name}
            </div>
          )}
        </div>

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

        <button className="btn btn-danger" onClick={handleEmergency} style={{ marginTop: 'auto' }}>
          🚨 Emergency Exit
        </button>
      </div>

      <div className="map-container">
        <ARVisualization currentLocation={currentLocation} destination={destination} />
      </div>
    </div>
  );
}

export default NavigatePage;
