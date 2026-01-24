// src/logicDice.js
import { ref } from 'vue';

export function useDiceLogic() {
    
    // Zar Sonuç Durumu
    const diceResult = ref({
        visible: false,
        source: '',      
        baseRoll: 0,    
        modifier: 0,    
        total: 0,
        diceLabel: 'd20', // <--- YENİ: Varsayılan etiket
        isCrit: false,   
        isFail: false    
    });

    const diceHistory = ref([]);
    const isHistoryOpen = ref(false);
    let autoCloseTimer = null;

    // --- 1. D20 ATMA ---
    const rollD20 = (sourceName, modifier) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        
        const result = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: sourceName,
            baseRoll: roll,
            modifier: modifier,
            total: roll + modifier,
            diceLabel: 'd20', // <--- D20 atışlarında etiket
            isCrit: roll === 20,
            isFail: roll === 1,
            type: 'd20'
        };

        showResult(result);
    };

    // --- 2. HASAR ZARI ATMA ---
    const rollDamage = (name, diceString, bonus, damageType) => {
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
            source: `${name} Hasarı (${damageType})`,
            baseRoll: diceSum, 
            modifier: bonus,
            total: diceSum + bonus,
            diceLabel: diceString, // <--- YENİ: "2d6", "1d8" gibi gelen stringi buraya yazıyoruz
            isCrit: false, 
            isFail: false,
            type: 'damage'
        };

        showResult(result);
    };

    // --- YARDIMCI ---
    const showResult = (result) => {
        diceResult.value = { ...result, visible: true }; // Tüm veriyi state'e aktar
        diceHistory.value.unshift(result);

        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        autoCloseTimer = setTimeout(() => {
            diceResult.value.visible = false;
        }, 4000);
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