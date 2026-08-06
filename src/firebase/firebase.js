import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAZf9nIjedLerNp-S_hH-M2L7CzAbsHyH0",
  authDomain: "our-little-space-7cd8a.firebaseapp.com",

  // เปลี่ยนข้อความนี้เป็น URL จริงจากหน้า Realtime Database
  databaseURL:
    "https://our-little-space-7cd8a-default-rtdb.asia-southeast1.firebasedatabase.app/",

  projectId: "our-little-space-7cd8a",
  storageBucket:
    "our-little-space-7cd8a.firebasestorage.app",
  messagingSenderId: "791325751201",
  appId: "1:791325751201:web:ffdb69d35c92ab636cbde0",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const realtimeDb = getDatabase(app);
