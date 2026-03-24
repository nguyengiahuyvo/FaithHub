import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

// Simple in-memory cache so we don't re-fetch the same photo repeatedly
const photoCache = new Map<string, string | null>();

function getInitial(name?: string | null, email?: string | null): string {
  return (name || email || "?")[0]?.toUpperCase() ?? "?";
}

function useUserPhoto(uid?: string | null) {
  const [photo, setPhoto] = useState<string | null>(
    uid ? photoCache.get(uid) ?? null : null,
  );

  useEffect(() => {
    if (!uid) return;
    if (photoCache.has(uid)) {
      setPhoto(photoCache.get(uid) ?? null);
      return;
    }
    let cancelled = false;
    getDoc(doc(db, "users", uid)).then((snap) => {
      const base64 = snap.exists() ? snap.data().photoBase64 ?? null : null;
      photoCache.set(uid, base64);
      if (!cancelled) setPhoto(base64);
    });
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return photo;
}

/** Call this after uploading a new photo to update the cache instantly. */
export function invalidatePhotoCache(uid: string, newPhoto: string | null) {
  photoCache.set(uid, newPhoto);
}

type Props = {
  uid?: string | null;
  name?: string | null;
  email?: string | null;
  size: number;
};

export default function UserAvatar({ uid, name, email, size }: Props) {
  const photo = useUserPhoto(uid);
  const initial = getInitial(name, email);
  const fontSize = Math.round(size * 0.4);
  const borderRadius = size / 2;

  if (photo) {
    return (
      <Image
        source={{ uri: photo }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius },
      ]}
    >
      <Text style={[styles.text, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: "#5B7553",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  image: {
    backgroundColor: "#E5E7EB",
  },
});
