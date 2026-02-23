/**
 * FnBScanScreen - Web: kamera via getUserMedia + jsQR, navigasi ke toko F&B.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft2, ScanBarcode } from 'iconsax-react-nativejs';
import jsQR from 'jsqr';
import { scale, getHorizontalPadding, FontFamily } from '@core/config';
import { useTheme } from '@core/theme';
import { useTranslation } from '@core/i18n';
import { parseFnBQRCode } from '../../models';

const VIDEO_CONTAINER_ID = 'fnb-scan-video-container-web';

export const FnBScanScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const horizontalPadding = getHorizontalPadding();

  const [value, setValue] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [useManualInput, setUseManualInput] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScannedRef = useRef<{ data: string; t: number } | null>(null);

  const stopCamera = useCallback(() => {
    if (animationRef.current != null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
  }, []);

  const handleScanned = useCallback(
    (code: string) => {
      const fnbData = parseFnBQRCode(code);
      if (fnbData) {
        (navigation as any).navigate('FnB', {
          storeId: fnbData.storeId,
          storeName: fnbData.storeName,
          entryPoint: 'scan-qr',
        });
      } else {
        setInvalidMessage(
          t('fnb.invalidQR') || 'Kode QR ini bukan kode toko F&B yang valid. Silakan scan kode QR toko yang benar.'
        );
        setTimeout(() => setInvalidMessage(null), 4000);
      }
    },
    [navigation, t]
  );

  useEffect(() => {
    if (useManualInput) {
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
          mediaStream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = mediaStream;
        setCameraError(null);
        setStream(mediaStream);
      } catch (err) {
        if (mounted) {
          setCameraError(err instanceof Error ? err.message : 'Kamera tidak dapat diakses');
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
  }, [useManualInput, stopCamera]);

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
          handleScanned(code.data);
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
  }, [stream, cameraReady, handleScanned]);

  useEffect(() => {
    if (useManualInput) setCameraReady(false);
  }, [useManualInput]);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const fnbData = parseFnBQRCode(trimmed);
    if (fnbData) {
      (navigation as any).navigate('FnB', {
        storeId: fnbData.storeId,
        storeName: fnbData.storeName,
        entryPoint: 'scan-qr',
      });
    } else {
      setInvalidMessage(
        t('fnb.invalidQR') || 'Kode bukan kode toko F&B yang valid.'
      );
    }
  };

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
    minHeight: 240,
  };

  const videoStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center 55%',
    display: 'block',
  };

  if (useManualInput) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + scale(8), paddingHorizontal: horizontalPadding }]}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft2 size={scale(24)} color={colors.text} variant="Linear" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('fnb.scanStore') || 'Scan Toko FnB'}
          </Text>
          <View style={styles.headerButton} />
        </View>
        <View style={[styles.manualInputContainer, { paddingHorizontal: horizontalPadding }]}>
          <Text style={[styles.title, { color: colors.text }]}>Masukkan kode manual</Text>
          {cameraError ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Kamera: {cameraError}. Atau masukkan kode di bawah:
            </Text>
          ) : (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Paste link toko F&B (contoh: closepay://fnb/store-id)
            </Text>
          )}
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholder="closepay://fnb/..."
            placeholderTextColor="#999"
            value={value}
            onChangeText={setValue}
          />
          {invalidMessage ? (
            <Text style={styles.errorText}>{invalidMessage}</Text>
          ) : null}
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Buka Toko</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              setCameraError(null);
              setUseManualInput(false);
            }}
          >
            <Text style={[styles.linkText, { color: colors.primary }]}>Coba kamera lagi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + scale(8),
            paddingHorizontal: horizontalPadding,
            backgroundColor: 'rgba(0,0,0,0.5)',
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft2 size={scale(24)} color="#FFFFFF" variant="Linear" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <ScanBarcode size={scale(24)} color="#FFFFFF" variant="Bold" />
          <Text style={styles.headerTitleLight}>{t('fnb.scanStore') || 'Scan Toko FnB'}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

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
        <View style={[styles.staticFrame, { borderColor: colors.primary }]} pointerEvents="none">
          <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
        </View>
      )}

      {invalidMessage ? (
        <View style={styles.invalidBanner} pointerEvents="none">
          <Text style={styles.invalidBannerText}>{invalidMessage}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.switchInput}
        onPress={() => setUseManualInput(true)}
      >
        <Text style={styles.linkTextLight}>Input kode manual</Text>
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
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerButton: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: scale(18),
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    marginLeft: scale(8),
  },
  headerTitleLight: {
    color: '#FFFFFF',
    fontSize: scale(18),
    fontFamily: FontFamily?.monasans?.bold ?? 'System',
    marginLeft: scale(8),
  },
  manualInputContainer: {
    flex: 1,
    paddingVertical: 24,
    paddingTop: scale(80),
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  linkButton: { marginTop: 12, alignItems: 'center' },
  linkText: { fontSize: 14 },
  errorText: { color: '#c00', fontSize: 14, marginBottom: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  overlayText: { color: '#fff', marginTop: 12 },
  staticFrame: {
    position: 'absolute',
    top: '28%',
    left: '10%',
    right: '10%',
    bottom: '18%',
    borderWidth: 2,
    borderRadius: scale(12),
  },
  corner: {
    position: 'absolute',
    width: scale(24),
    height: scale(24),
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  invalidBanner: {
    position: 'absolute',
    top: '50%',
    left: 16,
    right: 16,
    backgroundColor: 'rgba(200,0,0,0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  invalidBannerText: { color: '#fff', fontSize: 14, textAlign: 'center' },
  switchInput: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  linkTextLight: { color: 'rgba(255,255,255,0.9)', fontSize: 14 },
});

export default FnBScanScreen;
