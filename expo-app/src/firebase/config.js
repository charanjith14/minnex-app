import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with actual config from your environment or copy from Vite app
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "demo",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "demo",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "demo",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "demo"
};

const app = initializeApp(firebaseConfig);

// In React Native, Firebase Auth needs AsyncStorage for persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
