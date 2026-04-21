import React, { useEffect, useRef, useState } from 'react';

/**
 * Quick camera test component
 * Visit http://localhost:3000/camera-test to test getUserMedia
 */
function CameraTest() {
    const videoRef = useRef(null);
    const [status, setStatus] = useState('initializing...');
    const [hasPermission, setHasPermission] = useState(null);

    useEffect(() => {
        const videoEl = videoRef.current;
        let stream = null;

        const testCamera = async () => {
            try {
                // Check HTTPS requirement
                const loc = window.location;
                if (loc.protocol !== 'https:' && loc.hostname !== 'localhost') {
                    setStatus('❌ HTTPS required on non-localhost');
                    return;
                }

                // Check getUserMedia support
                if (!navigator.mediaDevices?.getUserMedia) {
                    setStatus('❌ getUserMedia not supported');
                    return;
                }

                setStatus('📷 Requesting camera access...');

                // Request camera with rear-facing preference
                stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: { ideal: 'environment' },
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });

                if (videoEl) {
                    videoEl.srcObject = stream;
                    await videoEl.play();
                    setStatus('✅ Camera working!');
                    setHasPermission(true);

                    // Log camera capabilities
                    const videoTrack = stream.getVideoTracks()[0];
                    const settings = videoTrack.getSettings();
                    console.log('Camera Settings:', {
                        width: settings.width,
                        height: settings.height,
                        facingMode: settings.facingMode,
                    });
                }
            } catch (err) {
                setStatus(`❌ Camera Error: ${err.name}`);
                setHasPermission(false);
                console.error('Camera error:', err);
            }
        };

        testCamera();

        return () => {
            if (videoEl?.srcObject) {
                videoEl.srcObject.getTracks().forEach(t => t.stop());
                videoEl.srcObject = null;
            } else if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // Test WebXR support
    const [xrSupport, setXrSupport] = useState(null);
    useEffect(() => {
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-ar').then(supported => {
                setXrSupport(supported);
            }).catch(() => setXrSupport(false));
        } else {
            setXrSupport(false);
        }
    }, []);

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            color: '#fff',
            fontFamily: 'Arial, sans-serif',
            padding: '20px',
            boxSizing: 'border-box',
        }}>
            <h1>📱 Camera & WebXR Test</h1>

            {/* Status */}
            <div style={{
                backgroundColor: '#222',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '16px',
            }}>
                <p><strong>Camera Status:</strong> {status}</p>
                <p><strong>Permission:</strong> {hasPermission === null ? '🔄 Checking...' : hasPermission ? '✅ Allowed' : '❌ Denied'}</p>
                <p><strong>WebXR:</strong> {xrSupport === null ? '🔄 Checking...' : xrSupport ? '✅ Supported' : '❌ Not Supported'}</p>
            </div>

            {/* Video Feed */}
            <div style={{
                flex: 1,
                backgroundColor: '#111',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <video
                    ref={videoRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    }}
                    playsInline
                />
            </div>

            {/* Info */}
            <div style={{
                backgroundColor: '#222',
                padding: '15px',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.5',
            }}>
                <h3>✓ Tests Performed:</h3>
                <ul>
                    <li>getUserMedia (camera access)</li>
                    <li>Rear-facing camera preference</li>
                    <li>WebXR AR session support</li>
                </ul>
                <h3 style={{ marginTop: '15px' }}>💡 Troubleshooting:</h3>
                <ul>
                    <li><strong>No camera feed?</strong> Check app permissions in phone settings</li>
                    <li><strong>HTTPS warning?</strong> Use localhost or deploy with HTTPS</li>
                    <li><strong>WebXR unavailable?</strong> Requires AR-capable device & Chrome/Firefox</li>
                </ul>
            </div>
        </div>
    );
}

export default CameraTest;
