// analyticsTracker.js
import { doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../KarakterCreate/KarakterYaratma/src/firebaseConfig.js"; // Kendi db yolunu doğru ayarla

async function trackPageVisit() {
    if (!db || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        // Kendi bilgisayarında test yaparken istatistikleri şişirme!
        return; 
    }

    try {
        const todayStr = new Date().toISOString().split('T')[0]; // Örn: 2026-03-27
        
        // Cihaz Kimliği Kontrolü
        let deviceId = localStorage.getItem("dnd_device_id");
        if (!deviceId) {
            deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem("dnd_device_id", deviceId);
        }

        // Bugün bu cihaz tekil ziyaretçi olarak sayıldı mı?
        const lastVisit = localStorage.getItem("dnd_last_visit");
        let isNewVisitorToday = (lastVisit !== todayStr);
        
        if (isNewVisitorToday) {
            localStorage.setItem("dnd_last_visit", todayStr);
        }

        // Hangi sayfa? (Örn: dmscreen)
        let pagePath = window.location.pathname.split('/').pop().split('.')[0] || "ana_sayfa";
        
        // Cihaz Tipi (Mobil mi Masaüstü mü?)
        const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
        
        // Veritabanına Tek Seferlik Fırlatma (Merge ile üzerine yazar)
        const statsRef = doc(db, "site_analytics", todayStr);
        
        const updateData = {
            total_views: increment(1),
            [`pages.${pagePath}`]: increment(1)
        };

        // Eğer bugün ilk kez giriyorsa tekil ziyaretçiyi ve cihaz tipini artır
        if (isNewVisitorToday) {
            updateData.unique_visitors = increment(1);
            if (isMobile) updateData.mobile_users = increment(1);
            else updateData.desktop_users = increment(1);
        }

        await setDoc(statsRef, updateData, { merge: true });
        console.log("📊 Analiz kaydedildi.");

    } catch (e) {
        console.error("Analiz motoru hatası:", e);
    }
}

// Sadece sayfa tam yüklendiğinde çalıştır
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackPageVisit);
} else {
    trackPageVisit();
}