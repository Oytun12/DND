/* ============================================================
   DM SCREEN - FIREBASE BAĞLANTI MOTORU
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// getFirestore yerine initializeFirestore'u da dahil ediyoruz
import { initializeFirestore, doc, setDoc, onSnapshot, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig } from "../../KarakterCreate/KarakterYaratma/src/firebaseConfig.js";

const app = initializeApp(firebaseConfig);

// WebSocket sorununu çözmek için Long Polling'i zorlayan ayar (Local Server dostu)
const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
});

window.db = db;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.updateDoc = updateDoc;
window.onSnapshot = onSnapshot;

console.log("🔥 DM Ekranı için Firebase Bulut Bağlantısı Kuruldu (Long Polling Aktif).");