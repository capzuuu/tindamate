import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  ScanBarcode,
  X,
  Camera,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Volume2,
  VolumeX,
  Layers
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  mode?: 'single' | 'continuous'; // 'single' closes after 1 scan, 'continuous' keeps scanning for POS
  onScan: (barcode: string) => void;
  onClose: () => void;
  lastScannedResult?: {
    code: string;
    name?: string;
    price?: number;
    success: boolean;
  } | null;
  children?: React.ReactNode;
}

// Crisp cash register POS beep via Web Audio API
export const playScanAudio = (type: 'success' | 'error' = 'success') => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // AudioContext blocked by browser policy
  }

  // Haptic feedback for smartphones
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(type === 'success' ? [60] : [120, 60, 120]);
    } catch {
      // Ignore vibration error
    }
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  title = 'Scan Product Barcode',
  subtitle = 'Point camera at the barcode on the item packaging',
  mode = 'single',
  onScan,
  onClose,
  lastScannedResult,
  children
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const containerId = 'tindamate-barcode-reader';

  // Handle successful barcode decode with cooldown to avoid duplicate triggers
  const handleDecodedText = useCallback((decodedText: string) => {
    const cleanCode = decodedText.trim();
    if (!cleanCode) return;

    const now = Date.now();
    // 1.2s debounce between scans
    if (now - lastScanTimeRef.current < 1200) {
      return;
    }
    lastScanTimeRef.current = now;

    if (soundEnabled) {
      playScanAudio('success');
    }

    onScan(cleanCode);

    if (mode === 'single') {
      onClose();
    }
  }, [mode, onScan, onClose, soundEnabled]);

  // Start Scanner
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsStarting(true);
    setCameraError(null);

    const startCamera = async () => {
      // 1. Check secure context for mobile devices
      if (
        typeof window !== 'undefined' &&
        !window.isSecureContext &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        if (!isMounted) return;
        setCameraError('Mobile browsers require HTTPS to access the camera.');
        setIsStarting(false);
        return;
      }

      // 2. Ensure container exists
      const el = document.getElementById(containerId);
      if (!el) {
        if (!isMounted) return;
        setCameraError('Scanner viewport container not found.');
        setIsStarting(false);
        return;
      }

      try {
        // Clean up previous instance if any
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

        // Choose camera target (prefer back/environment camera on phones)
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
              height: Math.max(100, Math.floor(edge * 0.55))
            };
          }
        };

        const onFrameSuccess = (decodedText: string) => {
          if (isMounted) {
            handleDecodedText(decodedText);
          }
        };

        const onFrameError = () => {
          // Intentionally silent for empty frames
        };

        // Start scanning with environment camera first, then fallback to user/webcam
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

        // Query cameras in background for switch button (without retriggering effect)
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
          setCameraError('Camera access was denied. Please allow camera permissions in your browser.');
        } else {
          setCameraError(`Camera error: ${msg}. You can enter barcode manually below.`);
        }
        setIsStarting(false);
      }
    };

    const timer = setTimeout(startCamera, 150);

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
  }, [isOpen, currentCameraIndex, handleDecodedText]);

  // Flip/Switch Camera
  const handleSwitchCamera = () => {
    if (cameras.length <= 1) return;
    setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedText(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-neo" style={{ zIndex: 3500 }} onClick={onClose}>
      <div
        className="modal-box-neo"
        style={{
          maxWidth: '520px',
          width: '95vw',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-primary-container)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--border-outline)'
              }}
            >
              <ScanBarcode size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{title}</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                {subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {/* Audio Toggle */}
            <button
              type="button"
              className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
              style={{ width: '32px', height: '32px' }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Beep' : 'Enable Beep'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} color="var(--text-hint)" />}
            </button>

            {/* Switch Camera Button (if multiple cameras) */}
            {cameras.length > 1 && (
              <button
                type="button"
                className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
                style={{ width: '32px', height: '32px' }}
                onClick={handleSwitchCamera}
                title="Switch Camera (Front/Rear)"
              >
                <RefreshCw size={15} />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              className="btn-neo btn-neo-surface btn-neo-sm btn-neo-icon"
              style={{ width: '32px', height: '32px' }}
              onClick={onClose}
              title="Close Scanner"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Camera Viewport Area */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '260px',
            minHeight: '260px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            background: '#000000',
            border: '2.5px solid var(--border-outline)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* HTML5 QRCODE Video Container */}
          <div
            id={containerId}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '260px',
              background: '#000000'
            }}
          />

          {/* Scanner Overlay Laser & Target Guide */}
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
              {/* Target Box */}
              <div
                style={{
                  width: '240px',
                  height: '140px',
                  border: '2px solid rgba(16, 185, 129, 0.85)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45)',
                  position: 'relative'
                }}
              >
                {/* Corner Accents */}
                <div style={{ position: 'absolute', top: -2, left: -2, width: 14, height: 14, borderTop: '4px solid #10B981', borderLeft: '4px solid #10B981' }} />
                <div style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderTop: '4px solid #10B981', borderRight: '4px solid #10B981' }} />
                <div style={{ position: 'absolute', bottom: -2, left: -2, width: 14, height: 14, borderBottom: '4px solid #10B981', borderLeft: '4px solid #10B981' }} />
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderBottom: '4px solid #10B981', borderRight: '4px solid #10B981' }} />

                {/* Animated Laser Bar */}
                <div className="pos-barcode-laser" />
              </div>
            </div>
          )}

          {/* Starting / Loading Spinner */}
          {isStarting && !cameraError && (
            <div
              style={{
                position: 'absolute',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#ffffff'
              }}
            >
              <Camera size={32} style={{ animation: 'pulse 1.2s infinite' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Starting camera...</span>
            </div>
          )}

          {/* Error Message Screen */}
          {cameraError && (
            <div
              style={{
                position: 'absolute',
                padding: '1.25rem',
                textAlign: 'center',
                color: '#f87171',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <AlertCircle size={32} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Live Feedback of Last Scanned Item (especially useful in POS continuous scan) */}
        {lastScannedResult && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.55rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--border-outline)',
              background: lastScannedResult.success ? '#dcfce7' : '#fee2e2',
              color: lastScannedResult.success ? '#166534' : '#991b1b',
              fontSize: '0.85rem',
              fontWeight: 700
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              {lastScannedResult.success ? (
                <CheckCircle2 size={18} color="var(--color-accent)" />
              ) : (
                <AlertCircle size={18} color="var(--color-error)" />
              )}
              <div>
                <div>{lastScannedResult.name || `Barcode: ${lastScannedResult.code}`}</div>
                {lastScannedResult.price !== undefined && (
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
                    Added to cart • ₱{lastScannedResult.price.toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '9999px',
                background: '#ffffff',
                border: '1px solid var(--border-outline)'
              }}
            >
              {lastScannedResult.code}
            </span>
          </div>
        )}

        {/* Custom Injected Content / Batch Intake Actions */}
        {children}

        {/* Mode Info & Manual Input Fallback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.4rem' }}>
            <input
              type="text"
              className="input-neo"
              placeholder="Or type/paste barcode (e.g. 480001655123)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              style={{ flex: 1, padding: '0.45rem 0.65rem', fontSize: '0.88rem' }}
            />
            <button
              type="submit"
              className="btn-neo btn-neo-primary btn-neo-sm"
              disabled={!manualCode.trim()}
              style={{ padding: '0.45rem 0.85rem' }}
            >
              Enter
            </button>
          </form>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.76rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Layers size={13} />
              <span>Supports EAN-13, UPC, Code-128 & QR</span>
            </span>

            {mode === 'continuous' && (
              <span style={{ fontWeight: 700, color: 'var(--color-accent)' }}>
                ⚡ Continuous POS Scan Active
              </span>
            )}
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          className="btn-neo btn-neo-surface"
          style={{ width: '100%', padding: '0.65rem', justifyContent: 'center' }}
          onClick={onClose}
        >
          Done Scanning
        </button>
      </div>
    </div>
  );
};
