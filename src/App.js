import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import ScanPage from './pages/ScanPage';
import NavigatePage from './pages/NavigatePage';
import MapPage from './pages/MapPage';
import AboutPage from './pages/AboutPage';
import './global.css';
import './App.css';

function App() {
  const [page, setPage] = useState('home'); // 'home', 'scan', 'navigate', 'map', 'about'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const handleQRScan = (location) => {
    setCurrentLocation(location);
    setPage('navigate');
  };

  const goToHome = () => setPage('home');
  const goToScan = () => setPage('scan');
  const goToNavigate = () => setPage('navigate');
  const goToMap = () => setPage('map');
  const goToAbout = () => setPage('about');

  return (
    <div className="App">
      {/* global navbar */}
      <header className="navbar glass-panel">
        <div className="container nav-content">
          <div className="nav-logo">SafeNav</div>
          <div className="nav-links">
            <span className={`nav-link ${page === 'home' ? 'active' : ''}`} onClick={goToHome}>Home</span>
            <span className={`nav-link ${(page === 'scan' || page === 'navigate' || page === 'map') ? 'active' : ''}`} onClick={goToScan}>Navigation</span>
            <span className={`nav-link ${page === 'about' ? 'active' : ''}`} onClick={goToAbout}>About</span>
          </div>
        </div>
      </header>

      {page === 'home' && (
        <HomePage onScan={goToScan} onMap={goToMap} onNavigate={goToNavigate} onAbout={goToAbout} onHome={goToHome} />
      )}
      {page === 'scan' && (
        <ScanPage onLocalize={handleQRScan} onBack={goToHome} />
      )}
      {page === 'navigate' && currentLocation && (
        <NavigatePage 
          currentLocation={currentLocation} 
          destination={destination}
          setDestination={setDestination}
          onBack={goToHome}
          onMapView={goToMap}
        />
      )}
      {page === 'map' && (
        <MapPage 
          currentLocation={currentLocation}
          destination={destination}
          setDestination={setDestination}
          onBack={goToHome}
          onNavigate={() => currentLocation && goToNavigate()}
        />
      )}
      {page === 'about' && <AboutPage onBack={goToHome} />}
    </div>
  );
}

export default App;
