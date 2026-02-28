import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import './QRLocalization.css';

function QRLocalization({ onLocalize }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        scanQRCode();
      } catch (err) {
        setError('Unable to access camera: ' + err.message);
        setScanning(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleDefaultLocation = () => {
    // Default to Left Stairs as entry point
    const leftStairs = { id: 'left_stairs', name: 'Left Stairs', x: 20, y: 100 };
    onLocalize(leftStairs);
    setScanning(false);
  };

  const scanQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    const scan = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            const location = JSON.parse(code.data);
            if (location.id && location.x !== undefined && location.y !== undefined) {
              onLocalize(location);
              setScanning(false);
              return;
            }
          } catch (e) {
            // Invalid QR data format
          }
        }
      }

      if (scanning) {
        requestAnimationFrame(scan);
      }
    };

    scan();
  };

  return (
    <div className="qr-container">

      <video 
        ref={videoRef} 
        className="qr-video"
        autoPlay
        playsInline
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />


      <div className="qr-overlay">
        <div className="qr-frame"></div>
      </div>

      {error && <div className="qr-error">{error}</div>}
      {scanning && <div className="qr-scanning">Scanning...</div>}
      
      <div style={{ padding: '20px', textAlign: 'center', background: 'rgba(0,0,0,0.8)' }}>
        <button 
          className="btn btn-secondary"
          onClick={handleDefaultLocation}
        >
          Use Left Stairs (Default)
        </button>
      </div>
    </div>
  );
}

export default QRLocalization;
