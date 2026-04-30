import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";

export function useSnackbar() {
  const opacity = useRef(new Animated.Value(0)).current;
  const messageRef = useRef<string | null>(null);
  const setMessage = useRef<(msg: string | null) => void>(() => {});

  function show(msg: string) {
    messageRef.current = msg;
    setMessage.current(msg);
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          messageRef.current = null;
          setMessage.current(null);
        });
      }, 3000);
    });
  }

  return { opacity, show, messageRef, setMessage };
}

export default function Snackbar({
  message,
  opacity,
  position = "bottom",
}: {
  message: string | null;
  opacity: Animated.Value;
  position?: "top" | "bottom";
}) {
  if (!message) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        position === "top" ? styles.top : styles.bottom,
        { opacity },
      ]}
    >
      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 24,
    right: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#2C3E2C",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  top: { top: 60 },
  bottom: { bottom: 40 },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});
