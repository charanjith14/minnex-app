import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCmImTH606u4MSzsPy_O4NXV2aA6FkMA9Y',
  authDomain: 'minnex-8a0db.firebaseapp.com',
  projectId: 'minnex-8a0db',
  storageBucket: 'minnex-8a0db.firebasestorage.app',
  messagingSenderId: '649089346203',
  appId: '1:649089346203:web:4d3c16ce012019345cb43e',
};

let app, auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
