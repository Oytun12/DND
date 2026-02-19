// src/firebaseConfig.js

// Firebase kütüphanelerini internetten (CDN) çekiyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// === GÜNCELLEME BURADA (1/2) ===
// signInWithRedirect fonksiyonunu import listesine ekledik
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInWithRedirect, // <--- YENİ EKLENDİ
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection, 
    collectionGroup,
    query,
    getDocs, 
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Senin Proje Ayarların
const firebaseConfig = {
  apiKey: "AIzaSyCh0xhq3cbjlhlqpFYpxyLA9AezSMEVQ6Y",
  authDomain: "marangozor-kar-ya.firebaseapp.com",
  projectId: "marangozor-kar-ya",
  storageBucket: "marangozor-kar-ya.firebasestorage.app",
  messagingSenderId: "605397590949",
  appId: "1:605397590949:web:13b179fd8ccd936369be4c",
  measurementId: "G-5MYXFL4R7G"
};

// Uygulamayı Başlat
const app = initializeApp(firebaseConfig);

// Servisleri Dışarı Aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// === GÜNCELLEME BURADA (2/2) ===
// Fonksiyonu dışarı aktar listesine ekledik
export { 
    signInWithPopup, 
    signInWithRedirect, // <--- YENİ EKLENDİ
    signOut, 
    onAuthStateChanged, 
    doc, 
    getDoc, 
    setDoc,
    collection,
    collectionGroup,
    query,
    getDocs,
    deleteDoc
};