import { ref } from 'vue';

// --- PAYLAŞIMLI DURUM (GLOBAL STATE) ---
const diceResult = ref({
    visible: false,
    source: '',      
    baseRoll: 0,    
    modifier: 0,    
    total: 0,
    diceLabel: 'd20',
    details: '', // Detay metni (Örn: "1, 5 (2d6)")
    isCrit: false,   
    isFail: false,
    type: 'd20'
});

const diceHistory = ref([]);
const isHistoryOpen = ref(false);
let autoCloseTimer = null;

// --- FONKSİYONLAR ---
export function useDiceLogic() {
    
    // YARDIMCI: Sonucu Gösterme
    const showResult = (result) => {
        diceResult.value = { ...result, visible: true }; 
        diceHistory.value.unshift(result);

        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        // Pencereyi 4 saniye sonra otomatik kapat (İstersen süreyi artırabilirsin)
        autoCloseTimer = setTimeout(() => {
            diceResult.value.visible = false;
        }, 4000);
    };

    // 1. D20 ATMA (Saldırı, Beceri vb.)
    const rollD20 = (sourceName, modifier) => {
        const roll = Math.floor(Math.random() * 20) + 1;
        
        // D20 için detay metni (Zar + Bonus)
        const sign = modifier >= 0 ? "+" : "";
        const detailText = `${roll} (d20) ${sign}${modifier}`;

        const result = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: sourceName,
            baseRoll: roll,
            modifier: modifier,
            total: roll + modifier,
            diceLabel: 'd20',
            details: detailText, // Ekrana bu yazılacak
            isCrit: roll === 20,
            isFail: roll === 1,
            type: 'd20'
        };

        showResult(result);
    };

    // 2. HASAR ZARI ATMA (BÜYÜLER VE SİLAHLAR İÇİN)
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
        let rolls = []; // Zarları tek tek tutacak dizi

        // Zar atma döngüsü
        for(let i=0; i<count; i++) {
            const r = Math.floor(Math.random() * faces) + 1;
            rolls.push(r); // Her zarı listeye ekle (Örn: 3, 5, 1)
            diceSum += r;
        }

        // Bonus metni (Örn: +0 veya -1)
        const bonusText = bonus >= 0 ? `+${bonus}` : `${bonus}`;

        // SONUÇ FORMATI: "1, 3, 5 (3d6) +0"
        // İşte istediğin format burası!
        const detailText = `${rolls.join(", ")} (${diceString}) ${bonusText}`;

        const result = {
            id: Date.now(),
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: `${name} (${damageType})`,
            baseRoll: diceSum, 
            modifier: bonus,
            total: diceSum + bonus,
            diceLabel: diceString, 
            details: detailText, // Detayları buraya aktarıyoruz
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