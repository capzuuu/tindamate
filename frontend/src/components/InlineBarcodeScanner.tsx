import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ScanBarcode
} from 'lucide-react';
import { playScanAudio } from './BarcodeScannerModal';

interface InlineBarcodeScannerProps {
  isActive: boolean;
  onScan: (barcode: string) => void;
  lastScannedCode?: string;
  matchedProductName?: string;
}

export const InlineBarcodeScanner: React.FC<InlineBarcodeScannerProps> = ({
  isActive,
  onScan,
  lastScannedCode,
  matchedProductName
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const containerId = 'inline-product-scanner';

  const handleDecodedText = useCallback(
    (decodedText: string) => {
      const cleanCode = decodedText.trim();
      if (!cleanCode) return;

      const now = Date.now();
      if (now - lastScanTimeRef.current < 1200) {
        return;
      }
      lastScanTimeRef.current = now;

      playScanAudio('success');
      onScan(cleanCode);
    },
    [onScan]
  );

  useEffect(() => {
    if (!isActive || isPaused) {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scannerRef.current?.clear();
            } catch {
              // ignore
            }
            scannerRef.current = null;
          });
      }
      return;
    }

    let isMounted = true;
    setIsStarting(true);
    setCameraError(null);

    const startCamera = async () => {
      // 1. Secure context check
      if (
        typeof window !== 'undefined' &&
        !window.isSecureContext &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        if (!isMounted) return;
        setCameraError('Camera requires HTTPS on mobile devices.');
        setIsStarting(false);
        return;
      }

      // 2. Element existence check
      const el = document.getElementById(containerId);
      if (!el) {
        if (!isMounted) return;
        setCameraError('Camera container not ready.');
        setIsStarting(false);
        return;
      }

      try {
        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            scannerRef.current.clear();
          } catch {
            // ignore
          }
          scannerRef.current = null;
        }

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.QR_CODE
          ],
          verbose: false
        });

        scannerRef.current = html5QrCode;

        let cameraTarget: any = { facingMode: 'environment' };
        if (cameras.length > 0 && cameras[currentCameraIndex]) {
          cameraTarget = cameras[currentCameraIndex].id;
        }

        const scanConfig = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edge = Math.floor(minEdge * 0.75);
            return {
              width: Math.max(160, edge),
              height: Math.max(90, Math.floor(edge * 0.5))
            };
          }
        };

        const onFrameSuccess = (decodedText: string) => {
          if (isMounted) {
            handleDecodedText(decodedText);
          }
        };

        const onFrameError = () => {
          // Intentionally silent
        };

        try {
          await html5QrCode.start(cameraTarget, scanConfig, onFrameSuccess, onFrameError);
        } catch (errPrimary) {
          if (typeof cameraTarget === 'object' && cameraTarget.facingMode === 'environment') {
            await html5QrCode.start({ facingMode: 'user' }, scanConfig, onFrameSuccess, onFrameError);
          } else {
            throw errPrimary;
          }
        }

        if (isMounted) {
          setIsStarting(false);
        }

        Html5Qrcode.getCameras()
          .then((cams) => {
            if (isMounted && cams && cams.length > 1) {
              setCameras(cams);
            }
          })
          .catch(() => {});
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
          setCameraError('Camera permission denied.');
        } else {
          setCameraError('Camera unavailable. You can enter barcode manually.');
        }
        setIsStarting(false);
      }
    };

    const timer = setTimeout(startCamera, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            try {
              scannerRef.current?.clear();
            } catch {
              // ignore
            }
            scannerRef.current = null;
          });
      }
    };
  }, [isActive, isPaused, currentCameraIndex, handleDecodedText]);

  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
  };

  if (!isActive) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
        padding: '0.65rem 0.75rem',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '2px solid var(--border-outline)'
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: !isPaused && !cameraError ? '#10b981' : '#f59e0b',
              boxShadow: !isPaused && !cameraError ? '0 0 8px #10b981' : 'none',
              animation: !isPaused && !cameraError ? 'pulse 1.5s infinite' : 'none'
            }}
          />
          <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>
            {!isPaused ? 'Auto-Scanner Active' : 'Scanner Paused'}
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {!isPaused ? '(Point barcode at camera)' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {/* Flip camera if multiple cameras */}
          {cameras.length > 1 && !isPaused && (
            <button
              type="button"
              className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
              style={{ width: '28px', height: '28px', padding: 0 }}
              onClick={handleSwitchCamera}
              title="Switch front/back camera"
            >
              <RefreshCw size={13} />
            </button>
          )}

          {/* Toggle Pause / Resume Camera */}
          <button
            type="button"
            className="btn-neo btn-neo-surface btn-neo-sm"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Resume camera' : 'Pause camera to save battery'}
          >
            {isPaused ? <Camera size={13} /> : <CameraOff size={13} />}
            <span>{isPaused ? 'Open Camera' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Camera Viewport (visible when not paused) */}
      {!isPaused && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '170px',
            minHeight: '170px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            background: '#000000',
            border: '1.5px solid var(--border-outline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Html5Qrcode video container */}
          <div
            id={containerId}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '170px',
              background: '#000000'
            }}
          />

          {/* Targeting Brackets & Laser */}
          {!cameraError && !isStarting && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  width: '210px',
                  height: '100px',
                  border: '1.5px solid rgba(16, 185, 129, 0.85)',
                  borderRadius: '10px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                  position: 'relative'
                }}
              >
                {/* Corner accents */}
                <div style={{ position: 'absolute', top: -2, left: -2, width: 12, height: 12, borderTop: '3px solid #10B981', borderLeft: '3px solid #10B981' }} />
                <div style={{ position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderTop: '3px solid #10B981', borderRight: '3px solid #10B981' }} />
                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 12, height: 12, borderBottom: '3px solid #10B981', borderLeft: '3px solid #10B981' }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 12, height: 12, borderBottom: '3px solid #10B981', borderRight: '3px solid #10B981' }} />

                <div className="pos-barcode-laser" />
              </div>
            </div>
          )}

          {/* Starting state */}
          {isStarting && !cameraError && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#ffffff'
              }}
            >
              <ScanBarcode size={26} style={{ animation: 'pulse 1.2s infinite' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>Starting camera...</span>
            </div>
          )}

          {/* Error state */}
          {cameraError && (
            <div
              style={{
                position: 'absolute',
                padding: '1rem',
                textAlign: 'center',
                color: '#f87171',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <AlertCircle size={26} />
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{cameraError}</span>
            </div>
          )}
        </div>
      )}

      {/* Scanned Result Banner */}
      {lastScannedCode && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.4rem 0.65rem',
            borderRadius: 'var(--radius-sm)',
            background: '#dcfce7',
            border: '1.5px solid #16a34a',
            color: '#166534',
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <CheckCircle2 size={15} color="#16a34a" />
            <span>
              Scanned: <code style={{ fontFamily: 'var(--font-mono)', background: '#ffffff', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>{lastScannedCode}</code>
            </span>
          </div>
          {matchedProductName && (
            <span style={{ fontSize: '0.72rem', color: '#15803d' }}>
              ({matchedProductName})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
