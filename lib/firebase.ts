import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Firebase Console → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyAZ75bqcwQN5bYQKTIAtbRGgFRuq9BMk6k",
  authDomain: "faithhub-dbdbb.firebaseapp.com",
  projectId: "faithhub-dbdbb",
  storageBucket: "faithhub-dbdbb.firebasestorage.app",
  messagingSenderId: "981282172978",
  appId: "1:981282172978:web:d893d5abc7103fd4618c2b",
};

const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === "web") {
  auth = getAuth(app);
} else {
  const AsyncStorage =
    require("@react-native-async-storage/async-storage").default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { auth };
export const db = getFirestore(app);
