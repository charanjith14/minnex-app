import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCmImTH606u4MSzsPy_O4NXV2aA6FkMA9Y',
  authDomain: 'minnex-8a0db.firebaseapp.com',
  projectId: 'minnex-8a0db',
  storageBucket: 'minnex-8a0db.firebasestorage.app',
  messagingSenderId: '649089346203',
  appId: '1:649089346203:web:4d3c16ce012019345cb43e',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
