// src/logicDice.js
import { ref } from 'vue';

export function useDiceLogic() {
    
    // Zar Sonuç Durumu (Mevcut)
    const diceResult = ref({
        visible: false,
        source: '',      
        baseRoll: 0,    
        modifier: 0,    
        total: 0,        
        isCrit: false,   
        isFail: false    
    });

    // YENİ: Zar Geçmişi ve Panel Durumu
    const diceHistory = ref([]);
    const isHistoryOpen = ref(false);
    let autoCloseTimer = null;

    const rollD20 = (sourceName, modifier) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        
        const result = {
            id: Date.now(), // Benzersiz ID (Scroll ve Key için)
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: sourceName,
            baseRoll: roll,
            modifier: modifier,
            total: roll + modifier,
            isCrit: roll === 20,
            isFail: roll === 1
        };

        // 1. Sonuç Ekranını Göster
        diceResult.value = { ...result, visible: true };

        // 2. Geçmişe Ekle (En başa ekliyoruz ki en yenisi üstte olsun)
        diceHistory.value.unshift(result);

        // 3. Otomatik Kapanma Zamanlayıcısı (5 Saniye)
        if (autoCloseTimer) clearTimeout(autoCloseTimer); // Eski sayacı iptal et
        
        autoCloseTimer = setTimeout(() => {
            diceResult.value.visible = false;
        }, 1500); // 5000ms = 5 saniye
    };

    const closeDiceResult = () => {
        diceResult.value.visible = false;
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };

    // Geçmişi Temizle
    const clearHistory = () => {
        diceHistory.value = [];
    };

    // Paneli Aç/Kapat
    const toggleHistory = () => {
        isHistoryOpen.value = !isHistoryOpen.value;
    };

    return {
        diceResult,
        diceHistory,       // Return
        isHistoryOpen,     // Return
        rollD20,
        closeDiceResult,
        clearHistory,      // Return
        toggleHistory      // Return
    };
}