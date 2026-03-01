import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import './HomePage.css';

function HomePage({ onScan, onMap, onNavigate, onAbout, onHome }) {
  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home-page">
      <section className="hero">
        <div className="container hero-content-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div className="hero-content" style={{ maxWidth: '600px' }}>

            <div className="hero-badge" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              padding: '6px 16px',
              borderRadius: '99px',
              color: '#3B82F6',
              fontSize: '0.875rem',
              fontWeight: '500',
              marginBottom: '1.5rem',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <Sparkles size={16} />
              <span>Next Gen Indoor Safety</span>
            </div>

            <h1 className="hero-title">
              Navigate Indoors with<br />
              <span className="text-gradient">Intelligent Safety</span>
            </h1>

            <p className="hero-subtitle">
              Real-time pathfinding optimized for crowd density and emergency hazards. Get where you need to go, safely.
            </p>

            <div className="hero-actions">
              <button className="btn btn-primary" onClick={onScan} style={{ padding: '0.875rem 1.75rem', fontSize: '1rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
                Start Navigation
                <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary" onClick={scrollToFeatures} style={{ padding: '0.875rem 1.75rem', fontSize: '1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Learn More
              </button>
            </div>
          </div>

          {/* Right side illustration representation */}
          <div className="hero-map-illustration">
            <div style={{ position: 'relative', width: '450px', height: '300px', background: 'transparent' }}>
              {/* Simplified SVG representation of the map UI from the reference image */}
              <svg width="100%" height="100%" viewBox="0 0 450 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Fold lines */}
                <path d="M50 80 L50 250 L150 280 L250 250 L350 280 L350 110 L250 80 L150 110 Z" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="rgba(255,255,255,0.01)" />
                <path d="M150 110 L150 280" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <path d="M250 80 L250 250" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                {/* Path Track */}
                <path d="M100 200 H160 C180 200, 180 170, 200 170 H250 C270 170, 270 200, 290 200 H330" stroke="url(#pathGradient)" strokeWidth="4" strokeLinecap="round" strokeDasharray="15 10" />

                {/* Path Gradient */}
                <defs>
                  <linearGradient id="pathGradient" x1="100" y1="200" x2="330" y2="200" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#3B82F6" />
                    <stop offset="1" stopColor="#10B981" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Nodes */}
                <circle cx="100" cy="200" r="12" fill="rgba(59, 130, 246, 0.2)" stroke="#3B82F6" strokeWidth="1" filter="url(#glow)" />
                <circle cx="100" cy="200" r="4" fill="#3B82F6" />

                <circle cx="180" cy="170" r="4" fill="transparent" stroke="#C7B7A3" strokeWidth="2" />
                <circle cx="270" cy="200" r="4" fill="transparent" stroke="#C7B7A3" strokeWidth="2" />
                <circle cx="330" cy="200" r="4" fill="#10B981" filter="url(#glow)" />

                {/* Flag */}
                <path d="M330 200 V120" stroke="#10B981" strokeWidth="2" />
                <path d="M330 120 L360 135 L330 150 Z" fill="#10B981" opacity="0.8" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="container grid-3">
        {/* ... features remain hidden/styled below fold for now ... */}
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
    </div>
  );
}

export default HomePage;
