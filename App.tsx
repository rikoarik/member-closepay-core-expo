import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import MemberbaseApp from './apps/member-base';

const MOBILE_VIEWPORT_WIDTH = 414;
const WEB_VIEWPORT_WIDTH = 1024;
const MOBILE_VIEWPORT_HEIGHT = 896;
export default function App() {
  const content = (
    <>
      <StatusBar style="auto" />
      <MemberbaseApp />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <View style={styles.webInner}>
          <GestureHandlerRootView style={styles.root}>
            {content}
          </GestureHandlerRootView>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      {content}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  webOuter: {
    flex: 1,
    width: '100%',
    height: MOBILE_VIEWPORT_HEIGHT,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webInner: {
    width: MOBILE_VIEWPORT_WIDTH,
    maxWidth: '100%',
    minHeight: '100%',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});
