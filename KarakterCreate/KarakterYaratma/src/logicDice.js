// src/logicDice.js
import { ref } from 'vue';

// --- PAYLAŞIMLI DURUM (GLOBAL STATE) ---
// Bu değişkenler fonksiyonun dışına alındı, böylece tüm uygulama aynı veriyi paylaşır.
const diceResult = ref({
    visible: false,
    source: '',      
    baseRoll: 0,    
    modifier: 0,    
    total: 0,
    diceLabel: 'd20',
    isCrit: false,   
    isFail: false    
});

const diceHistory = ref([]);
const isHistoryOpen = ref(false);
let autoCloseTimer = null;

// --- FONKSİYONLAR ---
export function useDiceLogic() {
    
    // YARDIMCI: Sonucu Gösterme (Hepsi aynı 'diceResult'ı günceller)
    const showResult = (result) => {
        diceResult.value = { ...result, visible: true }; 
        diceHistory.value.unshift(result);

        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        autoCloseTimer = setTimeout(() => {
            diceResult.value.visible = false;
        }, 4000);
    };

    // 1. D20 ATMA
    const rollD20 = (sourceName, modifier) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        
        const result = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: sourceName,
            baseRoll: roll,
            modifier: modifier,
            total: roll + modifier,
            diceLabel: 'd20',
            isCrit: roll === 20,
            isFail: roll === 1,
            type: 'd20'
        };

        showResult(result);
    };

    // 2. HASAR ZARI ATMA
    const rollDamage = (name, diceString, bonus, damageType) => {
        // diceString Örn: "8d6" veya "1d4"
        if (!diceString || !diceString.includes('d')) {
            console.error("Hatalı zar formatı:", diceString);
            return;
        }

        const [countStr, faceStr] = diceString.split('d');
        const count = parseInt(countStr) || 1;
        const faces = parseInt(faceStr) || 6;

        let diceSum = 0;
        for(let i=0; i<count; i++) {
            diceSum += Math.floor(Math.random() * faces) + 1;
        }

        const result = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: `${name} (${damageType})`,
            baseRoll: diceSum, 
            modifier: bonus,
            total: diceSum + bonus,
            diceLabel: diceString, 
            isCrit: false, 
            isFail: false,
            type: 'damage'
        };

        showResult(result);
    };

    const closeDiceResult = () => {
        diceResult.value.visible = false;
        if (autoCloseTimer) clearTimeout(autoCloseTimer);
    };

    const clearHistory = () => { diceHistory.value = []; };
    const toggleHistory = () => { isHistoryOpen.value = !isHistoryOpen.value; };

    return {
        diceResult,
        diceHistory,       
        isHistoryOpen,     
        rollD20,
        rollDamage,
        closeDiceResult,
        clearHistory,      
        toggleHistory      
    };
}