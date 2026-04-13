import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

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

function AppleNamePrompt({
  visible,
  onSave,
  onSkip,
  loading,
  lang,
}: {
  visible: boolean;
  onSave: (name: string) => void;
  onSkip: () => void;
  loading: boolean;
  lang: Language;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [name, setName] = useState("");

  useEffect(() => {
    if (visible) {
      setName("");
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
      <Animated.View style={[promptStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[promptStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View style={promptStyles.iconCircle}>
            <Ionicons name="person-add-outline" size={32} color="#5B7553" />
          </View>

          <Text style={promptStyles.title}>
            {t("apple_name_prompt_title", lang)}
          </Text>
          <Text style={promptStyles.message}>
            {t("apple_name_prompt_msg", lang)}
          </Text>

          <TextInput
            style={promptStyles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("profile_edit_name_placeholder", lang)}
            placeholderTextColor="#D1D5DB"
            autoCapitalize="words"
            autoFocus
          />

          <Pressable
            onPress={() => onSave(name.trim())}
            disabled={!name.trim() || loading}
            style={[
              promptStyles.saveButton,
              (!name.trim() || loading) && { opacity: 0.5 },
            ]}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={promptStyles.saveButtonText}>
                {t("save", lang)}
              </Text>
            )}
          </Pressable>

          <Pressable onPress={onSkip} disabled={loading} style={promptStyles.skipButton}>
            <Text style={promptStyles.skipButtonText}>
              {t("apple_name_prompt_skip", lang)}
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const promptStyles = StyleSheet.create({
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
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1F2A1F",
  },
  saveButton: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#5B7553",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skipButton: {
    paddingVertical: 8,
  },
  skipButtonText: {
    color: "#8A8F84",
    fontSize: 14,
  },
});

function RootNavigator() {
  const { user, isLoading, refreshUser } = useAuth();
  const { lang } = useLanguage();
  const segments = useSegments();
  const router = useRouter();
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const checkedRef = useRef(false);

  // Register push notifications when user is authenticated and verified
  useNotifications(user?.emailVerified ? user.uid : undefined);

  useEffect(() => {
    if (isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inVerify = segments[0] === "verify-email";
    // Modal/overlay routes that should remain reachable for signed-in users
    // without being bounced back to the tabs group by the auth guard below.
    const authedModalRoutes = new Set<string>([
      "modal",
      "quest-questions",
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

  // Check if Apple user needs to set display name (once per session)
  useEffect(() => {
    if (isLoading || !user || !user.emailVerified || checkedRef.current) return;
    checkedRef.current = true;

    if (user.displayName) return;

    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists() && snap.data().authProvider === "apple.com") {
        setShowNamePrompt(true);
      }
    });
  }, [isLoading, user]);

  async function handleSaveName(name: string) {
    if (!user) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: name });
      await setDoc(doc(db, "users", user.uid), { displayName: name }, { merge: true });
      await refreshUser();
      setShowNamePrompt(false);
    } catch (e) {
      console.error("Failed to set display name:", e);
    } finally {
      setSavingName(false);
    }
  }

  function handleSkipName() {
    setShowNamePrompt(false);
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
        <Stack.Screen
          name="quest-questions"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      <AppleNamePrompt
        visible={showNamePrompt}
        onSave={handleSaveName}
        onSkip={handleSkipName}
        loading={savingName}
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
