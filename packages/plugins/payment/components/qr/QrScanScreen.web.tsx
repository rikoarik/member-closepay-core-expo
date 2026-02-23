/**
 * QrScanScreen - Web: kamera via getUserMedia + jsQR.
 * Video di-render lewat React agar preview tidak hilang saat re-render.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import jsQR from 'jsqr';
import { scale } from '@core/config';
import { useTheme } from '@core/theme';

const VIDEO_CONTAINER_ID = 'qr-scan-video-container-web';

interface QrScanScreenProps {
  isActive: boolean;
  onScanned?: (value: string, type: 'qr' | 'barcode') => void;
  onHeaderActionsReady?: (actions: React.ReactNode) => void;
}

export const QrScanScreen: React.FC<QrScanScreenProps> = ({
  isActive,
  onScanned,
  onHeaderActionsReady,
}) => {
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useManualInput, setUseManualInput] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{ data: string; t: number } | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    onHeaderActionsReady?.(null);
  }, [onHeaderActionsReady]);

  const stopCamera = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Start kamera dan set stream agar video di-render React
  useEffect(() => {
    if (!isActive || useManualInput) {
      stopCamera();
      setStream(null);
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;

    let mounted = true;

    const initCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        setCameraError(null);
        setStream(mediaStream);
      } catch (err) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
          setCameraError(msg);
          setUseManualInput(true);
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopCamera();
      setStream(null);
    };
  }, [isActive, useManualInput, stopCamera]);

  // Loop jsQR setelah video siap (video di-render React, ref terisi)
  useEffect(() => {
    if (!stream || !cameraReady || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let mounted = true;

    const tick = () => {
      if (!mounted || !streamRef.current || video.readyState !== video.HAVE_ENOUGH_DATA) {
        if (mounted) animationRef.current = requestAnimationFrame(tick);
        return;
      }
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (w === 0 || h === 0) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' });
      if (code?.data) {
        const now = Date.now();
        if (
          lastScannedRef.current?.data !== code.data ||
          now - lastScannedRef.current.t > 2000
        ) {
          lastScannedRef.current = { data: code.data, t: now };
          onScanned?.(code.data, 'qr');
        }
      }
      animationRef.current = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      mounted = false;
      if (animationRef.current != null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [stream, cameraReady, onScanned]);

  useEffect(() => {
    if (!isActive || useManualInput) setCameraReady(false);
  }, [isActive, useManualInput]);

  const handleSubmit = () => {
    if (value.trim() && onScanned) {
      onScanned(value.trim(), 'qr');
    }
  };

  if (useManualInput) {
    return (
      <View style={[styles.container, styles.manualInputContainer]}>
        <Text style={styles.title}>Masukkan kode manual</Text>
        {cameraError ? (
          <Text style={styles.subtitle}>Kamera: {cameraError}. Atau masukkan kode di bawah:</Text>
        ) : (
          <Text style={styles.subtitle}>Paste atau ketik kode QR / barcode:</Text>
        )}
        <TextInput
          style={styles.input}
          placeholder="Kode QR / barcode"
          value={value}
          onChangeText={setValue}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Kirim Kode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => {
            setCameraError(null);
            setUseManualInput(false);
          }}
        >
          <Text style={styles.linkText}>Coba kamera lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const videoContainerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
    minHeight: 200,
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 55%',
    display: 'block',
  };

  return (
    <View style={styles.container}>
      {typeof document !== 'undefined' && (
        <div id={VIDEO_CONTAINER_ID} style={videoContainerStyle}>
          {stream && (
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el) el.srcObject = stream;
              }}
              autoPlay
              playsInline
              muted
              style={videoStyle}
              onLoadedMetadata={() => {
                videoRef.current?.play().then(() => setCameraReady(true)).catch(() => {});
              }}
              onError={() => setCameraReady(false)}
            />
          )}
        </div>
      )}
      {!cameraError && !cameraReady && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Mengaktifkan kamera...</Text>
        </View>
      )}
      {!cameraError && cameraReady && (
        <View style={styles.staticFrame} pointerEvents="none"/>
         
      )}
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: '50%',
  },
  manualInputContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#076409',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  linkButton: { marginTop: 12, alignItems: 'center' },
  linkText: { color: '#076409', fontSize: 14 },
  videoWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayText: { color: '#fff', marginTop: 12 },
  staticFrame: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
   
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: scale(12),
  },
  corner: {
    position: 'absolute',

    left: 0,
    right: 0,
    bottom: 0,
    width: scale(24),
    height: scale(24),
    borderWidth: 4,
  },
 
  switchInput: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
