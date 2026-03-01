import React, { useState, useEffect } from 'react';
import ARVisualization from '../components/ARVisualization';
import FloorPlan from '../components/FloorPlan';
import { getRoute, getEvacuationRoute } from '../logic/pathfinding';
import { getLocationNames } from '../data/indoorMap';
// global.css supplies layout styling


function NavigatePage({ currentLocation, setCurrentLocation, destination, setDestination, onBack, onMapView }) {
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
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ flexGrow: 1 }}>
            🏠 Home
          </button>
          <button className="btn btn-secondary" onClick={onMapView} style={{ flexGrow: 1 }}>
            🗺️ Map
          </button>
        </div>
        <div style={{ marginTop: '1rem' }}>
          {!currentLocation ? (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '0.5rem' }}>📷 Current Location (Simulated AR Marker):</label>
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
                value=""
                onChange={(e) => {
                  const loc = locations.find(l => l.id === e.target.value);
                  if (loc) setCurrentLocation(loc);
                }}
              >
                <option value="" disabled>-- Point camera at a room marker --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><strong>Current:</strong> {currentLocation.name}</div>
              <button
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={() => { setCurrentLocation(null); setRoute(null); }}>
                Rescan
              </button>
            </div>
          )}
          {destination && (
            <div style={{ marginTop: '0.5rem' }}>
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

      <div className="map-container" style={{ position: 'relative' }}>
        <ARVisualization currentLocation={currentLocation} destination={destination} route={route} />
        {currentLocation && destination && route && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '240px',
            height: '180px',
            border: '2px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#0f172a',
            boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}>
            <FloorPlan currentLocation={currentLocation} destination={destination} route={route} />
          </div>
        )}
      </div>
    </div >
  );
}

export default NavigatePage;
