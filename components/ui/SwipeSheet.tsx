import { memo, useMemo, useRef, type ReactNode } from 'react';
import { Animated, PanResponder, type StyleProp, type ViewStyle } from 'react-native';

// Bottom sheet that closes when pulled down (like the iPhone's own sheets), and still on a tap outside.
export const SwipeSheet = memo(function SwipeSheet({ onClose, style, children }: { onClose: () => void; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const close = useRef(onClose); close.current = onClose;
  const responder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.5,
    onPanResponderMove: (_, gesture) => { if (gesture.dy > 0) translateY.setValue(gesture.dy); },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 90 || gesture.vy > 0.8) {
        Animated.timing(translateY, { toValue: 800, duration: 180, useNativeDriver: false }).start(() => { translateY.setValue(0); close.current(); });
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: false }).start();
      }
    },
    onPanResponderTerminate: () => Animated.spring(translateY, { toValue: 0, useNativeDriver: false }).start(),
  }), [translateY]);
  // A tap inside the sheet must not reach the backdrop (which closes it).
  return <Animated.View {...responder.panHandlers} onStartShouldSetResponder={() => true} style={[style, { transform: [{ translateY }] }]}>{children}</Animated.View>;
});
