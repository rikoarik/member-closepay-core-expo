/**
 * QrScanScreen - Web: kamera via getUserMedia + jsQR, tanpa animasi, full layer.
 * Container video diambil via nativeID + getElementById agar pasti dapat DOM node.
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
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);
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

  useEffect(() => {
    if (!isActive || useManualInput) {
      stopCamera();
      return;
    }
    if (typeof document === 'undefined' || typeof navigator === 'undefined') return;

    const getContainer = (): HTMLElement | null =>
      document.getElementById(VIDEO_CONTAINER_ID);

    let mounted = true;
    let container: HTMLElement | null = null;

    const tryInit = () => {
      if (!mounted) return;
      container = getContainer();
      if (!container) {
        setTimeout(tryInit, 50);
        return;
      }
      initCamera();
    };

    const initCamera = async () => {
      if (!container || !mounted) return;
      let video: HTMLVideoElement;
      let canvas: HTMLCanvasElement;
      let ctx: CanvasRenderingContext2D | null;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setCameraError(null);

        video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsInline', '');
        video.setAttribute('muted', '');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.objectPosition = 'center center';
        video.srcObject = stream;
        container.innerHTML = '';
        container.appendChild(video);

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play().then(() => {
              if (mounted) setCameraReady(true);
              resolve();
            }).catch(reject);
          };
          video.onerror = () => reject(new Error('Video load failed'));
        });

        if (!mounted) return;
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d', { willReadFrequently: true });

        const tick = () => {
          if (!mounted || !streamRef.current || !video || !ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
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
          if (code && code.data) {
            const now = Date.now();
            if (lastScannedRef.current !== code.data || now - (lastScannedRef as any)._t > 2000) {
              lastScannedRef.current = code.data;
              (lastScannedRef as any)._t = now;
              onScanned?.(code.data, 'qr');
            }
          }
          animationRef.current = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        if (mounted) {
          const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
          setCameraError(msg);
          setUseManualInput(true);
        }
      }
    };

    tryInit();

    return () => {
      mounted = false;
      stopCamera();
      container = getContainer();
      if (container && typeof container.innerHTML !== 'undefined') container.innerHTML = '';
    };
  }, [isActive, useManualInput, onScanned, stopCamera]);

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

  return (
    <View style={styles.container}>
      <View
        nativeID={VIDEO_CONTAINER_ID}
        style={styles.videoWrapper}
      />
      {!cameraError && !cameraReady && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Mengaktifkan kamera...</Text>
        </View>
      )}
      {!cameraError && cameraReady && (
        <View style={styles.staticFrame} pointerEvents="none">
          <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
        </View>
      )}
      <TouchableOpacity
        style={styles.switchInput}
        onPress={() => setUseManualInput(true)}
      >
        <Text style={styles.linkText}>Input kode manual</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
    minHeight: 0,
    alignSelf: 'stretch',
    position: 'relative',
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
    top: 0,
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
    top: '15%',
    left: '10%',
    right: '10%',
    bottom: '15%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: scale(12),
  },
  corner: {
    position: 'absolute',
    width: scale(24),
    height: scale(24),
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
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
