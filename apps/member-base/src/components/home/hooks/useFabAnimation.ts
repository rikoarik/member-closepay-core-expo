import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/**
 * Returns animated values for FAB show/hide. Runs parallel timing/spring when visible changes.
 */
export function useFabAnimation(visible: boolean): {
  fabOpacity: Animated.Value;
  fabScale: Animated.Value;
} {
  const fabOpacity = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fabOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(fabScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fabOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fabScale, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return { fabOpacity, fabScale };
}
