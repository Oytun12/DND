// src/firebaseConfig.js

// Firebase kütüphanelerini internetten (CDN) çekiyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    setDoc, 
    collection 
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

// Servisleri Dışarı Aktar (Diğer dosyalarda kullanmak için)
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Yardımcı Fonksiyonlar
export { signInWithPopup, signOut, onAuthStateChanged, doc, getDoc, setDoc, collection };