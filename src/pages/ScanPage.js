import React from 'react';
import QRLocalization from '../components/QRLocalization';
import './ScanPage.css';

function ScanPage({ onLocalize, onBack }) {
  return (
    <div className="container scan-container">
      <h1 className="page-title">Scan QR Code</h1>
      <p className="page-subtitle">Position the QR code inside the glowing frame below for automatic detection.</p>
      <QRLocalization onLocalize={onLocalize} />
    </div>
  );
}

export default ScanPage;
