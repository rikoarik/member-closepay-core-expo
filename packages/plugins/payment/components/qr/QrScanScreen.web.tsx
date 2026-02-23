/**
 * QrScanScreen - Web: kamera via getUserMedia + jsQR, fallback input manual.
 * Overlay & scan line animation match native QR screen.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import jsQR from 'jsqr';
import { scale } from '@core/config';
import { useTheme } from '@core/theme';

const SCAN_WINDOW_SIZE = scale(260);

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
  const containerRef = useRef<HTMLElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

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
    const raw = containerRef.current;
    const container = raw && typeof (raw as any).appendChild === 'function' ? (raw as HTMLElement) : null;
    if (!container) return;

    let video: HTMLVideoElement;
    let canvas: HTMLCanvasElement;
    let ctx: CanvasRenderingContext2D | null;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        setCameraError(null);

        video = document.createElement('video');
        video.setAttribute('autoplay', '');
        video.setAttribute('playsInline', '');
        video.setAttribute('muted', '');
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.srcObject = stream;
        container.innerHTML = '';
        container.appendChild(video);

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            video.play().then(() => {
              setCameraReady(true);
              resolve();
            }).catch(reject);
          };
          video.onerror = () => reject(new Error('Video load failed'));
        });

        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d');

        const tick = () => {
          if (!streamRef.current || !video || !ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animationRef.current = requestAnimationFrame(tick);
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
        const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
        setCameraError(msg);
        setUseManualInput(true);
      }
    };

    init();
    return () => {
      stopCamera();
      if (container) container.innerHTML = '';
    };
  }, [isActive, useManualInput, onScanned, stopCamera]);

  useEffect(() => {
    if (!isActive || useManualInput) setCameraReady(false);
  }, [isActive, useManualInput]);

  // Scan line animation when camera is active
  useEffect(() => {
    if (!isActive || !cameraReady || useManualInput) {
      scanAnim.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isActive, cameraReady, useManualInput, scanAnim]);

  const handleSubmit = () => {
    if (value.trim() && onScanned) {
      onScanned(value.trim(), 'qr');
    }
  };

  if (useManualInput) {
    return (
      <View style={styles.container}>
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
        ref={(r) => {
          containerRef.current = r != null ? (r as unknown as HTMLElement) : null;
        }}
        style={styles.videoWrapper}
      />
      {!cameraError && !cameraReady && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.overlayText}>Mengaktifkan kamera...</Text>
        </View>
      )}
      {/* Dark overlay with scan window + corners + scan line (when camera ready) */}
      {!cameraError && cameraReady && (
        <View style={styles.scanOverlayContainer} pointerEvents="box-none">
          <View style={styles.overlayTop} pointerEvents="none" />
          <View style={styles.overlayMiddle} pointerEvents="none">
            <View style={styles.overlaySide} pointerEvents="none" />
            <View style={[styles.scanWindow, { width: SCAN_WINDOW_SIZE, height: SCAN_WINDOW_SIZE }]} pointerEvents="none">
              <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} pointerEvents="none" />
              <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} pointerEvents="none" />
              <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} pointerEvents="none" />
              <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} pointerEvents="none" />
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: colors.primary,
                    transform: [{
                      translateY: scanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, SCAN_WINDOW_SIZE],
                      }),
                    }],
                  },
                ]}
                pointerEvents="none"
              />
            </View>
            <View style={styles.overlaySide} pointerEvents="none" />
          </View>
          <View style={styles.overlayBottom} pointerEvents="none" />
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
    padding: 24,
    minHeight: 400,
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
    overflow: 'hidden',
    borderRadius: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayText: { color: '#fff', marginTop: 12 },
  scanOverlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'box-none',
  },
  overlayTop: {
    flex: 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayMiddle: {
    flexDirection: 'row',
    height: SCAN_WINDOW_SIZE,
  },
  overlayBottom: {
    flex: 1.3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  scanWindow: {
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  corner: {
    position: 'absolute',
    width: scale(20),
    height: scale(20),
    borderWidth: 4,
    borderColor: 'white',
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
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
    height: 2,
    shadowColor: '#00ff00',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 4,
    shadowRadius: scale(10),
  },
  switchInput: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
