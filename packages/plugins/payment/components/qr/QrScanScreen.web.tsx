/**
 * QrScanScreen - Web stub (no camera)
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

interface QrScanScreenProps {
  isActive: boolean;
  onScanned?: (value: string, type: 'qr' | 'barcode') => void;
  onHeaderActionsReady?: (actions: React.ReactNode) => void;
}

export const QrScanScreen: React.FC<QrScanScreenProps> = ({ onScanned }) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim() && onScanned) {
      onScanned(value.trim(), 'qr');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan QR</Text>
      <Text style={styles.subtitle}>Fitur kamera tidak tersedia di web. Masukkan kode secara manual:</Text>
      <TextInput
        style={styles.input}
        placeholder="Paste atau ketik kode QR / barcode"
        value={value}
        onChangeText={setValue}
        placeholderTextColor="#999"
      />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Kirim Kode</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 16 },
  button: { backgroundColor: '#076409', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
});
