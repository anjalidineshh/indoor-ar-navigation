import React, { useState } from 'react';
import HomePage from './pages/HomePage';
import NavigatePage from './pages/NavigatePage';
import MapPage from './pages/MapPage';
import AboutPage from './pages/AboutPage';
import './global.css';
import './App.css';

function App() {
  const [page, setPage] = useState('home'); // 'home', 'scan', 'navigate', 'map', 'about'
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState(null);

  const goToHome = () => setPage('home');
  const goToNavigation = () => setPage('navigate');
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
            <span className={`nav-link ${(page === 'navigate' || page === 'map') ? 'active' : ''}`} onClick={goToMap}>Navigation</span>
            <span className={`nav-link ${page === 'about' ? 'active' : ''}`} onClick={goToAbout}>About</span>
          </div>
        </div>
      </header>

      {page === 'home' && (
        <HomePage onScan={goToNavigation} onMap={goToMap} onNavigate={goToNavigate} onAbout={goToAbout} onHome={goToHome} />
      )}
      {page === 'navigate' && (
        <NavigatePage
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
          destination={destination}
          setDestination={setDestination}
          onBack={goToHome}
          onMapView={goToMap}
        />
      )}
      {page === 'map' && (
        <MapPage
          onBack={goToHome}
          onNavigate={() => goToNavigation()}
          hasLocation={!!currentLocation}
        />
      )}
      {page === 'about' && <AboutPage onBack={goToHome} />}
    </div>
  );
}

export default App;
