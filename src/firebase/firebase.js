import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAZf9nIjedLerNp-S_hH-M2L7CzAbsHyH0",
  authDomain: "our-little-space-7cd8a.firebaseapp.com",
  projectId: "our-little-space-7cd8a",
  storageBucket: "our-little-space-7cd8a.firebasestorage.app",
  messagingSenderId: "791325751201",
  appId: "1:791325751201:web:ffdb69d35c92ab636cbde0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
