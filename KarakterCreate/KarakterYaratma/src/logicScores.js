import { ref, computed, watch } from 'vue';
import { store } from './store.js';

export function useScoreLogic(raceBonuses) {
    // --- SABİTLER VE AYARLAR ---
    const statLabels = { 'str': 'KUV', 'dex': 'ÇEV', 'con': 'DAY', 'int': 'ZEK', 'wis': 'AKI', 'cha': 'KAR' };
    const selectableStats = { 'str': 'KUV', 'dex': 'ÇEV', 'con': 'DAY', 'int': 'ZEK', 'wis': 'AKI', 'cha': 'KAR' };
    
    const scoreMethods = [
        { id: 'manual', name: 'Manuel Giriş' },
        { id: 'standard_array', name: 'Standart Dizilim (15,14...)' },
        { id: 'point_buy', name: 'Point Buy (Standart)' },
        { id: 'point_buy_flex', name: 'Point Buy (Esnek)' },
        { id: 'roll_4d6', name: 'Zar At (4d6)' },
        { id: 'roll_5d6', name: 'Zar At (5d6)' }
    ];
    
    const selectedScoreMethod = ref('point_buy_flex');
    const standardArrayValues = [15, 14, 13, 12, 10, 8];
    const rolledPool = ref([]);
    const hasRolled = ref(false);
    const isCapped20 = ref(false);
    const isRolling = ref(false); // Animasyon için

    // --- POINT BUY MANTIĞI ---
    const getFlexCost = (score) => {
        if (score <= 8) return 0;
        if (score === 9) return 1; if (score === 10) return 2; if (score === 11) return 3;
        if (score === 12) return 4; if (score === 13) return 5; if (score === 14) return 7;
        if (score === 15) return 9; if (score === 16) return 12; if (score === 17) return 15;
        if (score === 18) return 19; if (score === 19) return 23; if (score >= 20) return 28;
        return 0;
    };
    const pointBuyBudget = computed(() => 27);
    const currentPbCost = computed(() => {
        let total = 0;
        Object.values(store.abilities.base).forEach(val => total += getFlexCost(val));
        return total;
    });
    
    const changePointBuy = (stat, delta) => {
        let next = store.abilities.base[stat] + delta;
        if (selectedScoreMethod.value === 'point_buy') { if (next < 8) next = 8; if (next > 15) next = 15; }
        else { if (next < 8) next = 8; if (next > 20) next = 20; }
        store.abilities.base[stat] = next;
    };

    // --- ZAR ATMA MANTIĞI ---
    // Not: Toast mesajını göstermek için callback kullanacağız
    const rollStats = (toastCallback) => {
        isRolling.value = true;
        setTimeout(() => {
            const diceCount = selectedScoreMethod.value === 'roll_5d6' ? 5 : 4;
            const results = [];
            for (let i = 0; i < 6; i++) {
                let rolls = [];
                for (let d = 0; d < diceCount; d++) rolls.push(Math.ceil(Math.random() * 6));
                rolls.sort((a, b) => a - b); 
                rolls.shift(); 
                let sum = rolls.reduce((a, b) => a + b, 0);
                if (selectedScoreMethod.value === 'roll_5d6' && isCapped20.value && sum > 20) sum = 20;
                results.push(sum);
            }
            results.sort((a, b) => b - a);
            rolledPool.value = results; 
            hasRolled.value = true;
            isRolling.value = false;
            
            if(toastCallback) toastCallback("Zarlar atıldı! Şansın bol olsun.", "🎲");    
        }, 600); 
    };

    const isOptionDisabled = (val, currentKey, pool) => {
        const totalInPool = pool.filter(n => n === val).length;
        let usedByOthers = 0;
        Object.entries(store.abilities.base).forEach(([k, v]) => { if (k !== currentKey && v === val) usedByOthers++; });
        return usedByOthers >= totalInPool;
    };

    // Yöntem değişince puanları sıfırla
    watch(selectedScoreMethod, (newMethod) => {
        if (newMethod.includes('point_buy')) Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 8);
        else if (newMethod === 'manual') Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 10);
        else Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 0);
        if (!newMethod.includes('roll')) { hasRolled.value = false; rolledPool.value = []; }
    });

    // --- FİNAL HESAPLAMALAR ---
    const statBonuses = computed(() => {
        const totals = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
        // Irk bonuslarını ekle (Dışarıdan gelen veri)
        if (raceBonuses && raceBonuses.value) {
            for (const [key, val] of Object.entries(raceBonuses.value)) {
                if (totals[key] !== undefined) totals[key] += val;
            }
        }
        // ASI (Seviye atlama bonuslarını) ekle
        Object.values(store.abilities.asi).forEach(asi => {
            if (asi.stat1) totals[asi.stat1] += 1;
            if (asi.stat2) totals[asi.stat2] += 1;
        });
        return totals;
    });

    const finalAbilityScores = computed(() => {
        const finals = {};
        ['str','dex','con','int','wis','cha'].forEach(k => {
            finals[k] = (store.abilities.base[k] || 10) + (statBonuses.value[k] || 0);
        });
        return finals;
    });

    const proficiencyBonus = computed(() => Math.ceil(store.class.level / 4) + 1);

    return {
        statLabels, selectableStats, scoreMethods, selectedScoreMethod, standardArrayValues,
        rolledPool, hasRolled, isCapped20, isRolling,
        pointBuyBudget, currentPbCost,
        getFlexCost, changePointBuy, rollStats, isOptionDisabled,
        statBonuses, finalAbilityScores, proficiencyBonus
    };
}