import { useAuth } from "@/lib/auth-context";
import UserAvatar, { invalidatePhotoCache } from "@/components/UserAvatar";
import { auth, db } from "@/lib/firebase";
import { languageLabels, t, type Language } from "@/lib/i18n";
import { useLanguage } from "@/lib/language-context";
import { useOrg } from "@/lib/org-context";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
} from "firebase/auth";
import { deleteDoc, doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ModalType = "confirm" | "error" | null;
type DeleteModalStep = "confirm" | "type-to-delete" | "error" | null;

function SignOutModal({
  type,
  onDismiss,
  onConfirm,
  loading,
  lang,
}: {
  type: ModalType;
  onDismiss: () => void;
  onConfirm: () => void;
  loading: boolean;
  lang: Language;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (type) {
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
  }, [type, opacity, scale]);

  function handleDismiss() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      scale.setValue(0.9);
      onDismiss();
    });
  }

  if (!type) return null;

  const isError = type === "error";

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[modalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View
            style={[
              modalStyles.iconCircle,
              isError && { backgroundColor: "#FEF2F2" },
            ]}
          >
            <Ionicons
              name={isError ? "alert-circle" : "log-out-outline"}
              size={32}
              color={isError ? "#DC2626" : "#DC2626"}
            />
          </View>

          <Text style={modalStyles.title}>
            {isError
              ? t("profile_signout_failed", lang)
              : t("profile_signout_title", lang)}
          </Text>
          <Text style={modalStyles.message}>
            {isError
              ? t("profile_signout_error", lang)
              : t("profile_signout_msg", lang)}
          </Text>

          {isError ? (
            <Pressable
              onPress={handleDismiss}
              style={modalStyles.primaryButton}
            >
              <Text style={modalStyles.primaryButtonText}>
                {t("try_again", lang)}
              </Text>
            </Pressable>
          ) : (
            <View style={modalStyles.buttonRow}>
              <Pressable
                onPress={handleDismiss}
                disabled={loading}
                style={modalStyles.cancelButton}
              >
                <Text style={modalStyles.cancelButtonText}>
                  {t("cancel", lang)}
                </Text>
              </Pressable>
              <Pressable
                onPress={onConfirm}
                disabled={loading}
                style={[modalStyles.confirmButton, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={modalStyles.confirmButtonText}>
                    {t("profile_signout", lang)}
                  </Text>
                )}
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
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
    backgroundColor: "#FEF2F2",
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
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingVertical: 14,
  },
  cancelButtonText: {
    color: "#4B5563",
    fontSize: 16,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#DC2626",
    borderRadius: 16,
    paddingVertical: 14,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  primaryButton: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#1F3B2E",
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

function DeleteAccountModal({
  step,
  onDismiss,
  onConfirm,
  onProceedToPassword,
  password,
  onPasswordChange,
  loading,
  lang,
}: {
  step: DeleteModalStep;
  onDismiss: () => void;
  onConfirm: () => void;
  onProceedToPassword: () => void;
  password: string;
  onPasswordChange: (v: string) => void;
  loading: boolean;
  lang: Language;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (step) {
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
  }, [step, opacity, scale]);

  function handleDismiss() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      scale.setValue(0.9);
      onDismiss();
    });
  }

  if (!step) return null;

  const isError = step === "error";
  const isPasswordStep = step === "type-to-delete";
  const canDelete = password.length >= 6;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[modalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View
            style={[
              modalStyles.iconCircle,
              { backgroundColor: "#FEF2F2" },
            ]}
          >
            <Ionicons
              name={isError ? "alert-circle" : "trash-outline"}
              size={32}
              color="#DC2626"
            />
          </View>

          <Text style={modalStyles.title}>
            {isError
              ? t("profile_delete_failed", lang)
              : t("profile_delete_title", lang)}
          </Text>
          <Text style={modalStyles.message}>
            {isError
              ? t("profile_delete_error", lang)
              : isPasswordStep
                ? t("profile_delete_password_msg", lang)
                : t("profile_delete_msg", lang)}
          </Text>

          {isError ? (
            <Pressable
              onPress={handleDismiss}
              style={modalStyles.primaryButton}
            >
              <Text style={modalStyles.primaryButtonText}>
                {t("try_again", lang)}
              </Text>
            </Pressable>
          ) : isPasswordStep ? (
            <>
              <View style={deleteModalStyles.passwordRow}>
                <TextInput
                  style={deleteModalStyles.passwordField}
                  value={password}
                  onChangeText={onPasswordChange}
                  placeholder={t("auth_password_placeholder_login", lang)}
                  placeholderTextColor="#D1D5DB"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  style={deleteModalStyles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#8A8F98"
                  />
                </Pressable>
              </View>
              <View style={modalStyles.buttonRow}>
                <Pressable
                  onPress={handleDismiss}
                  disabled={loading}
                  style={modalStyles.cancelButton}
                >
                  <Text style={modalStyles.cancelButtonText}>
                    {t("cancel", lang)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={onConfirm}
                  disabled={!canDelete || loading}
                  style={[
                    modalStyles.confirmButton,
                    (!canDelete || loading) && { opacity: 0.5 },
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={modalStyles.confirmButtonText}>
                      {t("profile_delete_confirm", lang)}
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          ) : (
            <View style={modalStyles.buttonRow}>
              <Pressable
                onPress={handleDismiss}
                style={modalStyles.cancelButton}
              >
                <Text style={modalStyles.cancelButtonText}>
                  {t("cancel", lang)}
                </Text>
              </Pressable>
              <Pressable
                onPress={onProceedToPassword}
                style={modalStyles.confirmButton}
              >
                <Text style={modalStyles.confirmButtonText}>
                  {t("continue", lang)}
                </Text>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const deleteModalStyles = StyleSheet.create({
  passwordRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
  },
  passwordField: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1F2A1F",
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});

function EditDisplayNameModal({
  visible,
  onDismiss,
  onSave,
  currentName,
  loading,
  lang,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSave: (name: string) => void;
  currentName: string;
  loading: boolean;
  lang: Language;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const [name, setName] = useState(currentName);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(currentName);
      setError(false);
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
  }, [visible, opacity, scale, currentName]);

  function handleDismiss() {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      scale.setValue(0.9);
      onDismiss();
    });
  }

  if (!visible) return null;

  const canSave = name.trim().length > 0 && name.trim() !== currentName;

  return (
    <Modal transparent visible animationType="none">
      <Animated.View style={[modalStyles.backdrop, { opacity }]}>
        <Animated.View
          style={[modalStyles.card, { opacity, transform: [{ scale }] }]}
        >
          <View
            style={[
              modalStyles.iconCircle,
              { backgroundColor: "#F0FDF4" },
            ]}
          >
            <Ionicons name="person-outline" size={32} color="#5B7553" />
          </View>

          <Text style={modalStyles.title}>
            {t("profile_edit_name_title", lang)}
          </Text>
          <Text style={modalStyles.message}>
            {t("profile_edit_name_msg", lang)}
          </Text>

          <TextInput
            style={editNameStyles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("profile_edit_name_placeholder", lang)}
            placeholderTextColor="#D1D5DB"
            autoCapitalize="words"
            autoFocus
          />

          {error && (
            <Text style={editNameStyles.error}>
              {t("profile_edit_name_error", lang)}
            </Text>
          )}

          <View style={modalStyles.buttonRow}>
            <Pressable
              onPress={handleDismiss}
              disabled={loading}
              style={modalStyles.cancelButton}
            >
              <Text style={modalStyles.cancelButtonText}>
                {t("cancel", lang)}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onSave(name.trim())}
              disabled={!canSave || loading}
              style={[
                modalStyles.confirmButton,
                { backgroundColor: "#5B7553" },
                (!canSave || loading) && { opacity: 0.5 },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={modalStyles.confirmButtonText}>
                  {t("save", lang)}
                </Text>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const editNameStyles = StyleSheet.create({
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
  error: {
    color: "#DC2626",
    fontSize: 13,
    textAlign: "center",
  },
});

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { org, leaveOrg } = useOrg();
  const { lang, setLang } = useLanguage();
  const [modalType, setModalType] = useState<ModalType>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [pendingLang, setPendingLang] = useState<Language>(lang);
  const [saving, setSaving] = useState(false);
  const langDirty = pendingLang !== lang;
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [deleteStep, setDeleteStep] = useState<DeleteModalStep>(null);
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [photoURI, setPhotoURI] = useState<string | null>(null);
  const [showEditName, setShowEditName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);
  const snackOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setPendingLang(lang);
  }, [lang]);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists() && snap.data().photoBase64) {
        setPhotoURI(snap.data().photoBase64);
      }
    });
  }, [user]);

  async function saveDisplayName(newName: string) {
    if (!user) return;
    setSavingName(true);
    try {
      await updateProfile(user, { displayName: newName });
      // Update Firestore user doc
      await setDoc(doc(db, "users", user.uid), { displayName: newName }, { merge: true });
      // Update org member doc if in an org
      if (org) {
        const memberRef = doc(db, "organizations", org.orgId, "members", user.uid);
        await setDoc(memberRef, { displayName: newName }, { merge: true });
      }
      await refreshUser();
      setShowEditName(false);
    } catch (e) {
      console.error("Failed to update display name:", e);
    } finally {
      setSavingName(false);
    }
  }

  async function saveLang() {
    setSaving(true);
    try {
      await setLang(pendingLang);
    } finally {
      setSaving(false);
    }
  }

  async function pickAndUploadPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets[0]?.base64 || !user) return;
    setUploadingPhoto(true);
    setShowPhotoMenu(false);
    try {
      const dataURI = `data:image/jpeg;base64,${result.assets[0].base64}`;
      await setDoc(
        doc(db, "users", user.uid),
        { photoBase64: dataURI },
        { merge: true },
      );
      setPhotoURI(dataURI);
      invalidatePhotoCache(user.uid, dataURI);
    } catch (e) {
      console.error("Photo upload failed:", e);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function removePhoto() {
    if (!user) return;
    setUploadingPhoto(true);
    setShowPhotoMenu(false);
    try {
      await setDoc(
        doc(db, "users", user.uid),
        { photoBase64: null },
        { merge: true },
      );
      setPhotoURI(null);
      invalidatePhotoCache(user.uid, null);
    } catch {
      // ignore
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleResetPassword() {
    if (!user?.email) return;
    setResetSending(true);
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetSent(true);
    } catch {
      // ignore
    } finally {
      setResetSending(false);
    }
  }

  async function confirmDeleteAccount() {
    if (!user?.email) return;
    setDeleting(true);
    try {
      // Re-authenticate before destructive action
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      // Remove user from organization membership
      if (org) {
        const memberRef = doc(
          db,
          "organizations",
          org.orgId,
          "members",
          user.uid
        );
        await deleteDoc(memberRef);
      }
      // Remove user document from Firestore
      await deleteDoc(doc(db, "users", user.uid));
      // Delete the Firebase Auth account
      await deleteUser(user);
      setDeleteStep(null);
      setDeleting(false);
      setDeletePassword("");
    } catch {
      setDeleting(false);
      setDeleteStep("error");
    }
  }

  async function confirmSignOut() {
    setSigningOut(true);
    try {
      await signOut(auth);
      setModalType(null);
      setSigningOut(false);
    } catch {
      setSigningOut(false);
      setModalType("error");
    }
  }

  return (
    <>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => setShowPhotoMenu(true)} style={styles.avatarWrapper}>
          {photoURI ? (
            <Image source={{ uri: photoURI }} style={styles.avatarImage} />
          ) : (
            <UserAvatar uid={user?.uid} name={user?.displayName} email={user?.email} size={80} />
          )}
          {uploadingPhoto ? (
            <View style={styles.avatarBadge}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.avatarBadge}>
              <Ionicons name="camera-outline" size={14} color="#FFFFFF" />
            </View>
          )}
        </Pressable>
        <Text style={styles.name}>
          {user?.displayName || t("profile_member_fallback", lang)}
        </Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Modal transparent visible={showPhotoMenu} animationType="fade">
        <Pressable
          style={styles.photoMenuBackdrop}
          onPress={() => setShowPhotoMenu(false)}
        >
          <View style={styles.photoMenuCard}>
            <Text style={styles.photoMenuTitle}>
              {t("profile_change_photo", lang)}
            </Text>
            <Pressable onPress={pickAndUploadPhoto} style={styles.photoMenuItem}>
              <Ionicons name="image-outline" size={22} color="#5B7553" />
              <Text style={styles.photoMenuItemText}>
                {t("profile_photo_pick", lang)}
              </Text>
            </Pressable>
            {photoURI ? (
              <Pressable onPress={removePhoto} style={styles.photoMenuItem}>
                <Ionicons name="trash-outline" size={22} color="#DC2626" />
                <Text style={[styles.photoMenuItemText, { color: "#DC2626" }]}>
                  {t("profile_photo_remove", lang)}
                </Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setShowPhotoMenu(false)}
              style={styles.photoMenuCancel}
            >
              <Text style={styles.photoMenuCancelText}>
                {t("cancel", lang)}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("profile_account", lang)}</Text>

        <Pressable onPress={() => setShowEditName(true)} style={styles.row}>
          <Ionicons name="person-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_display_name", lang)}</Text>
          <Text style={styles.rowValue}>
            {user?.displayName || t("profile_not_set", lang)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#C4C9BE" />
        </Pressable>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="mail-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_email", lang)}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {user?.email}
          </Text>
        </View>

        <View style={styles.separator} />

        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_account_id", lang)}</Text>
          <Text style={styles.rowValue} numberOfLines={1}>
            {user?.uid.slice(0, 12)}...
          </Text>
        </View>

        <View style={styles.separator} />

        <Pressable
          onPress={handleResetPassword}
          disabled={resetSending}
          style={styles.row}
        >
          <Ionicons name="key-outline" size={20} color="#D97706" />
          <Text style={[styles.rowLabel, { color: "#D97706" }]}>
            {t("profile_reset_password", lang)}
          </Text>
          {resetSending ? (
            <ActivityIndicator size="small" color="#D97706" />
          ) : resetSent ? (
            <Ionicons name="checkmark-circle" size={20} color="#5B7553" />
          ) : null}
        </Pressable>
        {resetSent && (
          <Text style={styles.resetSentText}>
            {t("profile_reset_sent", lang)}
          </Text>
        )}

        <View style={styles.separator} />

        <Pressable
          onPress={() => setDeleteStep("confirm")}
          style={styles.row}
        >
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
          <Text style={[styles.rowLabel, { color: "#DC2626" }]}>
            {t("profile_delete_account", lang)}
          </Text>
        </Pressable>
      </View>

      {org && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t("profile_org", lang)}</Text>

          <View style={styles.row}>
            <Ionicons name="business-outline" size={20} color="#5B7553" />
            <Text style={styles.rowLabel}>{org.orgName}</Text>
            <Text style={styles.rowValue}>{org.role}</Text>
          </View>

          <View style={styles.separator} />

          <Pressable onPress={() => setShowLeaveConfirm(true)} style={styles.row}>
            <Ionicons name="exit-outline" size={20} color="#DC2626" />
            <Text style={[styles.rowLabel, { color: "#DC2626" }]}>
              {t("profile_leave_org", lang)}
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {t("profile_preferences", lang)}
        </Text>

        <View style={styles.row}>
          <Ionicons name="language-outline" size={20} color="#5B7553" />
          <Text style={styles.rowLabel}>{t("profile_language", lang)}</Text>
        </View>
        <View style={styles.langRow}>
          {(["en", "de", "vi"] as Language[]).map((l) => (
            <Pressable
              key={l}
              onPress={() => setPendingLang(l)}
              style={[
                styles.langChip,
                pendingLang === l && styles.langChipActive,
              ]}
            >
              <Text
                style={[
                  styles.langChipText,
                  pendingLang === l && styles.langChipTextActive,
                ]}
              >
                {languageLabels[l]}
              </Text>
            </Pressable>
          ))}
        </View>

        {langDirty && (
          <Pressable
            onPress={saveLang}
            disabled={saving}
            style={[styles.saveButton, saving && { opacity: 0.7 }]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>{t("save", lang)}</Text>
            )}
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => setModalType("confirm")}
        style={styles.signOutButton}
      >
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.signOutText}>{t("profile_signout", lang)}</Text>
      </Pressable>

      <Text style={styles.version}>{`FaithHub v${Constants.expoConfig?.version ?? "?"}`}</Text>

      {/* Leave org confirmation */}
      {showLeaveConfirm && (
        <Modal transparent visible animationType="none">
          <View style={modalStyles.backdrop}>
            <View style={modalStyles.card}>
              <Pressable
                onPress={() => setShowLeaveConfirm(false)}
                style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}
              >
                <Ionicons name="close" size={24} color="#8A8F84" />
              </Pressable>
              <View style={[modalStyles.iconCircle, { backgroundColor: "#FEF2F2" }]}>
                <Ionicons name="exit-outline" size={28} color="#DC2626" />
              </View>
              <Text style={modalStyles.title}>{t("profile_leave_title", lang)}</Text>
              <Text style={modalStyles.message}>{t("profile_leave_msg", lang)}</Text>
              <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                <Pressable
                  onPress={() => setShowLeaveConfirm(false)}
                  style={modalStyles.cancelButton}
                >
                  <Text style={modalStyles.cancelButtonText}>
                    {t("cancel", lang)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={async () => {
                    setShowLeaveConfirm(false);
                    await leaveOrg();
                    setSnackbar(t("profile_leave_success", lang));
                    snackOpacity.setValue(0);
                    Animated.timing(snackOpacity, {
                      toValue: 1,
                      duration: 250,
                      useNativeDriver: true,
                    }).start(() => {
                      setTimeout(() => {
                        Animated.timing(snackOpacity, {
                          toValue: 0,
                          duration: 400,
                          useNativeDriver: true,
                        }).start(() => setSnackbar(null));
                      }, 3000);
                    });
                  }}
                  style={[modalStyles.primaryButton, { backgroundColor: "#DC2626" }]}
                >
                  <Text style={modalStyles.primaryButtonText}>
                    {t("profile_leave_confirm", lang)}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <SignOutModal
        type={modalType}
        onDismiss={() => setModalType(null)}
        onConfirm={confirmSignOut}
        loading={signingOut}
        lang={lang}
      />

      <EditDisplayNameModal
        visible={showEditName}
        onDismiss={() => setShowEditName(false)}
        onSave={saveDisplayName}
        currentName={user?.displayName || ""}
        loading={savingName}
        lang={lang}
      />

      <DeleteAccountModal
        step={deleteStep}
        onDismiss={() => {
          setDeleteStep(null);
          setDeletePassword("");
        }}
        onProceedToPassword={() => setDeleteStep("type-to-delete")}
        onConfirm={confirmDeleteAccount}
        password={deletePassword}
        onPasswordChange={setDeletePassword}
        loading={deleting}
        lang={lang}
      />
    </ScrollView>

    {/* Snackbar */}
    {snackbar && (
      <Animated.View style={[snackStyles.container, { opacity: snackOpacity }]}>
        <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
        <Text style={snackStyles.text}>{snackbar}</Text>
      </Animated.View>
    )}
    </>
  );
}

const snackStyles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 40,
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
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});

const styles = StyleSheet.create({
  content: {
    padding: 24,
    paddingTop: 60,
    gap: 20,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 4,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3D5A3A",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F9F7F4",
  },
  photoMenuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
    padding: 16,
  },
  photoMenuCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 4,
  },
  photoMenuTitle: {
    color: "#1F2A1F",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  photoMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  photoMenuItemText: {
    color: "#2C3E2C",
    fontSize: 16,
    fontWeight: "500",
  },
  photoMenuCancel: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  photoMenuCancelText: {
    color: "#8A8F84",
    fontSize: 16,
    fontWeight: "600",
  },
  name: {
    color: "#2C3E2C",
    fontSize: 22,
    fontWeight: "700",
  },
  email: {
    color: "#8A8F84",
    fontSize: 15,
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 16,
  },
  sectionLabel: {
    color: "#A3A89E",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  rowLabel: {
    flex: 1,
    color: "#2C3E2C",
    fontSize: 15,
    fontWeight: "500",
  },
  rowValue: {
    color: "#8A8F84",
    fontSize: 14,
    maxWidth: 160,
    textAlign: "right",
  },
  separator: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.04)",
    marginVertical: 8,
  },
  langRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },
  langChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  langChipActive: {
    backgroundColor: "#5B7553",
  },
  langChipText: {
    color: "#6B7264",
    fontSize: 14,
    fontWeight: "500",
  },
  langChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  saveButton: {
    alignItems: "center",
    backgroundColor: "#5B7553",
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderColor: "#FECACA",
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
  },
  resetSentText: {
    color: "#5B7553",
    fontSize: 13,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  signOutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
  },
  version: {
    color: "#A3A89E",
    fontSize: 13,
    textAlign: "center",
  },
});
