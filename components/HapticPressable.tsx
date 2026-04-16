import { forwardRef, useCallback } from "react";
import {
  Pressable as RNPressable,
  type GestureResponderEvent,
  type PressableProps,
  type View,
} from "react-native";
import * as Haptics from "expo-haptics";

/**
 * Drop-in replacement for React Native's Pressable that fires a light
 * haptic on every successful press. Shape-compatible so any file can swap
 * `import { Pressable } from "react-native"` for
 * `import { Pressable } from "@/components/HapticPressable"` with zero
 * other code changes.
 *
 * Haptics are fire-and-forget — failures (e.g. on web or unsupported
 * devices) are swallowed so they never block the real onPress handler.
 */
export const Pressable = forwardRef<View, PressableProps>(function HapticPressable(
  { onPress, ...rest },
  ref,
) {
  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      onPress?.(e);
    },
    [onPress],
  );

  return <RNPressable ref={ref} onPress={handlePress} {...rest} />;
});

export default Pressable;
