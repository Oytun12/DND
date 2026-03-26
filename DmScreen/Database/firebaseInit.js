/* ============================================================
   DM SCREEN - FIREBASE BAĞLANTI MOTORU
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// YENİ: deleteDoc eklendi
import { initializeFirestore, doc, setDoc, onSnapshot, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig } from "../../KarakterCreate/KarakterYaratma/src/firebaseConfig.js";

const app = initializeApp(firebaseConfig);

const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
});

window.db = db;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc; // YENİ EKLENDİ
window.onSnapshot = onSnapshot;

console.log("🔥 DM Ekranı için Firebase Bulut Bağlantısı Kuruldu (Long Polling Aktif).");