import React, { useEffect, useRef, useState } from 'react';
import './ARVisualization.css';

function ARVisualization({ currentLocation, destination }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [heading, setHeading] = useState(0); // device compass heading in degrees

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
        }
      } catch (err) {
        console.log('Camera not available, using AR canvas mode');
        setCameraActive(false);
      }
    };

    startCamera();

    // setup orientation listener for heading (fallback to 0 if unavailable)
    const handleOrientation = (e) => {
      if (typeof e.alpha === 'number') {
        let h = 360 - e.alpha; // convert to compass heading
        setHeading(h);
      }
    };
    window.addEventListener('deviceorientation', handleOrientation, true);

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    const drawAROverlay = () => {
      // Clear canvas but keep it transparent - DON'T fill with opaque color
      ctx.clearRect(0, 0, width, height);

      if (currentLocation && destination) {
        const centerX = width / 2;
        const centerY = height / 2;

        // Draw large compass circle
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 80, 0, Math.PI * 2);
        ctx.stroke();

        // Draw compass directions rotated by current heading
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(-heading * (Math.PI/180));
        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('N', 0, -100);
        ctx.fillText('S', 0, 100);
        ctx.fillText('E', 100, 0);
        ctx.fillText('W', -100, 0);
        ctx.restore();

        // Draw direction arrow (animated)
        // compute bearing from current location to destination
        const dx = destination.x - currentLocation.x;
        const dy = destination.y - currentLocation.y;
        let bearing = Math.atan2(dy, dx) * (180/Math.PI); // degrees from east
        bearing = (bearing + 360) % 360; // normalize
        // convert to compass north-based heading
        bearing = (90 - bearing + 360) % 360;
        // subtract device heading to get relative angle
        const relative = ((bearing - heading) + 360) % 360;
        const angle = relative * (Math.PI / 180);
        const arrowLength = 100;
        const arrowX = centerX + Math.cos(angle) * arrowLength;
        const arrowY = centerY + Math.sin(angle) * arrowLength;

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(arrowX, arrowY);
        ctx.stroke();

        // Draw arrowhead
        const headlen = 25;
        const angle1 = angle + Math.PI / 6;
        const angle2 = angle - Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - headlen * Math.cos(angle1), arrowY - headlen * Math.sin(angle1));
        ctx.lineTo(arrowX - headlen * Math.cos(angle2), arrowY - headlen * Math.sin(angle2));
        ctx.closePath();
        ctx.fillStyle = '#00ff00';
        ctx.fill();

        // Draw destination info box
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(centerX - 120, height - 80, 240, 70);

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('→ ' + destination.name, centerX, height - 50);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('Follow the arrow', centerX, height - 25);

        // Draw distance indicator on sides
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, centerY - 30, 80, 60);

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('100m', 20, centerY + 10);

        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText('to destination', 20, centerY + 25);
      } else if (currentLocation) {
        // Show location info when no destination is selected
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(width / 2 - 150, height / 2 - 50, 300, 100);

        ctx.fillStyle = '#00ff00';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You are here:', width / 2, height / 2 - 20);

        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(currentLocation.name, width / 2, height / 2 + 20);
      }

      // Draw HUD elements
      drawHUD(ctx, width, height);

      requestAnimationFrame(drawAROverlay);
    };

    drawAROverlay();
  }, [currentLocation, destination]);

  const drawHUD = (ctx, width, height) => {
    // Top left - compass indicator
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 100, 100);

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(60, 60, 40, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 60, 25);

    // Top right - AR status
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(width - 150, 10, 140, 50);

    ctx.fillStyle = cameraActive ? '#00ff00' : '#ffaa00';
    ctx.beginPath();
    ctx.arc(width - 25, 35, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(cameraActive ? 'Camera: ON' : 'AR MODE', width - 135, 30);
    ctx.fillText('Location: ' + (currentLocation?.name || 'Unknown'), width - 135, 50);
    ctx.fillText('AR Indoor Nav v1.0', width - 135, 70);
  };

  return (
    <div className="ar-visualization">
      {cameraActive && (
        <video 
          ref={videoRef}
          className="ar-video"
          autoPlay
          playsInline
          muted
        />
      )}
      <canvas ref={canvasRef} className="ar-canvas"></canvas>
      <div className="ar-status">
        {cameraActive ? '📷 Camera Active' : '🎮 AR Mode'}
      </div>
    </div>
  );
}

export default ARVisualization;
