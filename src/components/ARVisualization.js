import React, { useEffect, useRef, useState } from 'react';
import './ARVisualization.css';

function ARVisualization({ currentLocation, destination, route }) {
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
        ctx.rotate(-heading * (Math.PI / 180));
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
        let bearing = Math.atan2(dy, dx) * (180 / Math.PI); // degrees from east
        bearing = (bearing + 360) % 360; // normalize
        // convert to compass north-based heading
        bearing = (90 - bearing + 360) % 360;
        // subtract device heading to get relative angle
        const relative = ((bearing - heading) + 360) % 360;
        // Make relative angle 0 point straight ahead, etc.
        const MathPI = Math.PI;
        const angle = relative * (MathPI / 180) - (MathPI / 2);

        // draw fat arrow on the "floor" pointing in relative angle
        ctx.save();
        ctx.translate(centerX, height - 120); // bottom center

        // draw tracking circle on the floor
        ctx.scale(1, 0.3); // perspective squash
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(0, 0, 150, 0, MathPI * 2);
        ctx.stroke();

        ctx.restore();

        // Arrow drawing
        ctx.save();
        ctx.translate(centerX, height - 120);
        ctx.rotate(angle);
        ctx.scale(1, 0.35); // perspective for arrow

        // Animated glowing 3D arrow
        ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
        ctx.shadowColor = 'rgba(16, 185, 129, 1)';
        ctx.shadowBlur = 20;

        let bounce = (Math.sin(Date.now() / 200) * 10);
        ctx.translate(0, bounce); // hover effect

        ctx.beginPath();
        ctx.moveTo(-20, 0);      // Base left
        ctx.lineTo(20, 0);       // Base right
        ctx.lineTo(20, -180);    // Stem right
        ctx.lineTo(40, -180);    // Head right
        ctx.lineTo(0, -250);     // Tip
        ctx.lineTo(-40, -180);   // Head left
        ctx.lineTo(-20, -180);   // Stem left
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Draw destination info box (moved up slightly)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(centerX - 130, height - 100, 260, 80, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 18px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText('📍 ' + destination.name, centerX, height - 60);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px "Outfit"';
        ctx.fillText('Follow the augmented track', centerX, height - 35);

        // Draw distance indicator on sides
        if (route && route.distance) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
          ctx.beginPath();
          ctx.roundRect(20, height / 2 - 40, 100, 80, 12);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 24px "Space Grotesk"';
          ctx.textAlign = 'center';
          ctx.fillText(route.distance.toFixed(0) + 'm', 70, height / 2);

          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px "Outfit"';
          ctx.fillText('Distance', 70, height / 2 + 20);
        }
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
      <video
        ref={videoRef}
        className="ar-video"
        autoPlay
        playsInline
        muted
        style={{ display: cameraActive ? 'block' : 'none' }}
      />
      <canvas ref={canvasRef} className="ar-canvas"></canvas>
      <div className="ar-status">
        {cameraActive ? '📷 Camera Active' : '🎮 AR Mode'}
      </div>
    </div>
  );
}

export default ARVisualization;
