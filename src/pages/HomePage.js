import React from 'react';
import './HomePage.css';

function HomePage({ onScan, onMap, onNavigate, onAbout, onHome }) {
  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-content">
          <p className="text-gradient">Next Gen Indoor Safety</p>
          <h1 className="hero-title">Navigate Indoors with Intelligent Safety</h1>
          <p className="hero-subtitle">
            Real-time pathfinding optimized for crowd density and emergency hazards. Get where you need to go, safely.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onScan}>Start Navigation</button>
            <button className="btn btn-secondary" onClick={scrollToFeatures}>Learn More</button>
          </div>
        </div>
      </section>

      <section id="features" className="container grid-3">
        <div className="card animate-enter stagger-1">
          <h3 className="text-gradient">AI Route Optimization</h3>
          <p>Advanced A* algorithms calculate the fastest path.</p>
        </div>
        <div className="card animate-enter stagger-2">
          <h3 className="text-gradient">Crowd-Aware</h3>
          <p>Real-time density monitoring via BLE beacons.</p>
        </div>
        <div className="card animate-enter stagger-3">
          <h3 className="text-gradient">Emergency Protocol</h3>
          <p>Instant hazard detection triggers automated evacuation.</p>
        </div>
      </section>

      <footer className="container" style={{ padding: '2rem 0', textAlign: 'center' }}>
        <h4>SafeNav</h4>
        <p>
          Next-generation indoor navigation ensuring safety through real-time crowd analytics and hazard detection.
        </p>
        <p>Dept of AI (2023-2027) • Spring 2026</p>
        <p>© 2026 Smart Indoor Safety Navigation System. Academic Prototype.</p>
        <div className="nav-links" style={{ justifyContent: 'center' }}>
          <span className="nav-link" onClick={onHome}>Home</span>
          <span className="nav-link" onClick={onScan}>Navigation</span>
          <span className="nav-link" onClick={onAbout}>About</span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
