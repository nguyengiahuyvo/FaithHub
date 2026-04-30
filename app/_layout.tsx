import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Pressable } from "@/components/HapticPressable";
import "react-native-reanimated";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc } from "firebase/firestore";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { t, type Language } from "@/lib/i18n";
import { LanguageProvider, useLanguage } from "@/lib/language-context";
import { useNotifications } from "@/lib/notifications";
import { OrgProvider } from "@/lib/org-context";
import { db } from "@/lib/firebase";

function SplashScreen() {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        damping: 12,
        stiffness: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeIn, scale]);

  return (
    <View style={splashStyles.container}>
      <Animated.View
        style={[
          splashStyles.content,
          { opacity: fadeIn, transform: [{ scale }] },
        ]}
      >
        <View style={splashStyles.iconCircle}>
          <Text style={splashStyles.icon}>+</Text>
        </View>
        <Text style={splashStyles.title}>✞ ​FaithHub</Text>
        <Text style={splashStyles.subtitle}>Your community. Your faith.</Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F7F4",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#5B7553",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#5B7553",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  icon: {
    color: "#FFFFFF",
    fontSize: 40,
    fontWeight: "300",
  },
  title: {
    color: "#1F3B2E",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: "#8A8F84",
    fontSize: 16,
    fontWeight: "500",
  },
});

function UpdateModal({
  visible,
  onUpdate,
  onClose,
  lang,
}: {
  visible: boolean;
  onUpdate: () => void;
  onClose: () => void;
  lang: Language;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 20,
          stiffness: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, scale]);

  if (!visible) return null;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[updateStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[updateStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={updateStyles.iconCircle}>
            <Ionicons name="cloud-download-outline" size={32} color="#5B7553" />
          </View>

          <Text style={updateStyles.title}>{t("update_title", lang)}</Text>
          <Text style={updateStyles.message}>{t("update_message", lang)}</Text>

          <Pressable onPress={onUpdate} style={updateStyles.button}>
            <Text style={updateStyles.buttonText}>
              {t("update_button", lang)}
            </Text>
          </Pressable>

          <Pressable onPress={onClose} style={updateStyles.closeButton}>
            <Text style={updateStyles.closeButtonText}>
              {t("update_later", lang)}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const updateStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0FDF4",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    color: "#1F2A1F",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    color: "#5C625C",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  button: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#5B7553",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeButtonText: {
    color: "#8A8F84",
    fontSize: 14,
  },
});

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { lang } = useLanguage();
  const segments = useSegments();
  const router = useRouter();
  const [showUpdate, setShowUpdate] = useState(false);
  const storeLinksRef = useRef({ ios: "", android: "" });

  // Register push notifications when user is authenticated and verified
  useNotifications(user?.emailVerified ? user.uid : undefined);

  // Check for app updates on startup
  useEffect(() => {
    const appVersion = Constants.expoConfig?.version;
    console.log("[VersionCheck] local version:", appVersion);

    if (!appVersion) return;

    getDoc(doc(db, "app", "metadata")).then((snap) => {
      console.log("[VersionCheck] doc exists:", snap.exists());
      if (!snap.exists()) return;
      const data = snap.data();
      console.log("[VersionCheck] remote version:", data.version);
      if (data.version && data.version !== appVersion) {
        storeLinksRef.current = {
          ios: data["ios-link"] ?? "",
          android: data["android-link"] ?? "",
        };
        setShowUpdate(true);
      }
    }).catch((err) => {
      console.error("[VersionCheck] error:", err);
    });
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inVerify = segments[0] === "verify-email";
    // Modal/overlay routes that should remain reachable for signed-in users
    // without being bounced back to the tabs group by the auth guard below.
    const authedModalRoutes = new Set<string>([
      "modal",
    ]);
    const inAuthedModal = authedModalRoutes.has(segments[0] ?? "");

    if (!user && (inTabsGroup || inVerify || inAuthedModal)) {
      router.replace("/login");
    } else if (user && !user.emailVerified && !inVerify) {
      router.replace("/verify-email");
    } else if (user && user.emailVerified && !inTabsGroup && !inAuthedModal) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  function handleUpdate() {
    const link =
      Platform.OS === "ios"
        ? storeLinksRef.current.ios
        : storeLinksRef.current.android;
    if (link) Linking.openURL(link);
  }

  if (isLoading) return <SplashScreen />;

  return (
    <>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <UpdateModal
        visible={showUpdate}
        onUpdate={handleUpdate}
        onClose={() => setShowUpdate(false)}
        lang={lang}
      />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <LanguageProvider>
        <OrgProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <RootNavigator />
            <StatusBar style="auto" />
          </ThemeProvider>
        </OrgProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
