import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
