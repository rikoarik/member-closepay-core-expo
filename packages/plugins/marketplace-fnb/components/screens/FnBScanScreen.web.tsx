/**
 * FnBScanScreen - Web stub (no camera)
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const FnBScanScreen: React.FC = () => (
  <View style={styles.container}>
    <Text style={styles.text}>Scan F&B — tidak tersedia di web.</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  text: { fontSize: 16, color: '#666' },
});
