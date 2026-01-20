import { ref, computed, watch } from 'vue';
import { store } from './store.js';

export function useScoreLogic(raceBonuses) {
    // --- SABİTLER ---
    // Stat isimlerinin Türkçe karşılıkları
    const selectableStats = { 
        'str': 'KUV', 
        'dex': 'ÇEV', 
        'con': 'DAY', 
        'int': 'ZEK', 
        'wis': 'AKI', 
        'cha': 'KAR' 
    };
    
    const scoreMethods = [
        { id: 'manual', name: 'Manuel Giriş' },
        { id: 'standard_array', name: 'Standart Dizilim' },
        { id: 'point_buy', name: 'Point Buy (Standart)' },
        { id: 'point_buy_flex', name: 'Point Buy (Esnek)' },
        { id: 'roll_4d6', name: 'Zar At (4d6)' },
        { id: 'roll_5d6', name: 'Zar At (5d6)' }
    ];
    
    const selectedScoreMethod = ref('point_buy_flex');
    const standardArrayValues = [15, 14, 13, 12, 10, 8];
    const isRolling = ref(false);
    const isCapped20 = ref(false);
    
    // --- DRAG & DROP & TAP STATE ---
    const scoreAllocations = ref([]); 
    const draggedItem = ref(null);
    const rolledPool = ref([]); 
    const hasRolled = ref(false);

    // 1. Havuzu Başlat (SADECE TOPLARI YARATIR, STORE'A DOKUNMAZ)
    const initAllocations = (values) => {
        scoreAllocations.value = values.map((val, index) => ({
            id: Date.now() + index,
            val: val,
            assignedTo: null
        }));
    };

    // 2. Zar Atma
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
            initAllocations(results);   
            syncStore(); // Yeni zarlar atılınca store'u (0 olarak) eşle
            
            hasRolled.value = true;
            isRolling.value = false;
            if(typeof toastCallback === 'function') toastCallback("Zarlar atıldı! Puanları yerlerine sürükle.", "🎲");    
        }, 600); 
    };

    // 3. Puan Atama / Değiştirme (SWAP MANTIĞI)
    const assignScore = (scoreId, targetStat) => {
        const scoreItem = scoreAllocations.value.find(x => x.id === scoreId);
        if (!scoreItem) return;
        
        // Hedefte biri var mı? Varsa yer değiştir (Swap)
        const existingItem = scoreAllocations.value.find(x => x.assignedTo === targetStat);
        
        // Kendi kendine atama engeli
        if (existingItem && existingItem.id === scoreItem.id) return;

        if (existingItem) {
            // Hedefteki top, gelen topun eski yerine gitsin
            existingItem.assignedTo = scoreItem.assignedTo; 
        }
        
        scoreItem.assignedTo = targetStat;
        draggedItem.value = null; // İşlem bitince seçimi kaldır
        syncStore();
    };

    // 4. Havuza Geri Atma
    const unassignScore = (scoreId) => {
        const item = scoreAllocations.value.find(x => x.id === scoreId);
        if (item) {
            item.assignedTo = null;
            draggedItem.value = null;
            syncStore();
        }
    };

    // 5. Akıllı Tıklama (Mobil/Masaüstü)
    const handleOrbClick = (item, clickedItemLocation = null) => {
        if (!draggedItem.value) {
            draggedItem.value = item;
            return;
        }

        if (draggedItem.value.id === item.id) {
            draggedItem.value = null;
            return;
        }

        const selectedItem = draggedItem.value;
        const selectedItemLocation = selectedItem.assignedTo;

        if (clickedItemLocation) {
            assignScore(selectedItem.id, clickedItemLocation);
        }
        else if (selectedItemLocation && !clickedItemLocation) {
            assignScore(item.id, selectedItemLocation);
        }
        else {
            draggedItem.value = item;
        }
    };

    // --- STORE SENKRONİZASYONU ---
    const syncStore = () => {
        const resetVal = selectedScoreMethod.value === 'manual' ? 10 : 0;
        
        Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = resetVal);
        
        scoreAllocations.value.forEach(item => {
            if (item.assignedTo) store.abilities.base[item.assignedTo] = item.val;
        });
    };

    // --- SEED YÜKLEME ---
    const syncAllocationsFromStore = () => {
        if (!['standard_array', 'roll_4d6', 'roll_5d6'].includes(selectedScoreMethod.value)) return;
        
        const currentStats = { ...store.abilities.base };
        
        // 1. Havuz boşsa, önce havuzu yarat
        if (scoreAllocations.value.length === 0) {
            if (selectedScoreMethod.value.includes('roll') && rolledPool.value.length > 0) {
                initAllocations(rolledPool.value);
            } else if (selectedScoreMethod.value === 'standard_array') {
                initAllocations([...standardArrayValues]);
            }
        }

        // 2. Havuzdaki topları Store'daki değerlerle eşleştir
        Object.entries(currentStats).forEach(([stat, val]) => {
            if (val === 0) return;
            
            let match = scoreAllocations.value.find(x => x.val === val && x.assignedTo === null);
            if (!match) {
                match = scoreAllocations.value.find(x => x.val === val && x.assignedTo !== stat);
            }

            if (match) match.assignedTo = stat;
        });
        
        hasRolled.value = true;
        syncStore(); 
    };

    // --- YÖNTEM DEĞİŞİKLİĞİ İZLEYİCİSİ (WATCHER) ---
    watch(selectedScoreMethod, (newVal) => {
        
        // Eğer store'da veri varsa ve havuz boşsa, bu bir "Seed Yükleme" işlemidir.
        // Bu durumda sıfırlama yapmadan çıkıyoruz.
        const hasData = Object.values(store.abilities.base).some(v => v > 0);
        if (hasData && scoreAllocations.value.length === 0) {
            return; 
        }

        if (newVal === 'standard_array') {
            initAllocations([...standardArrayValues]);
            hasRolled.value = true; 
            syncStore();
        } else if (newVal.includes('point_buy')) {
            Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 8);
        } else if (newVal === 'manual') {
            Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 10);
        } else {
            // Roll modları için sıfırla
            Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 0);
            hasRolled.value = false;
            scoreAllocations.value = [];
        }
    });

    // Helperlar
    const getFlexCost = (score) => {
        if (score <= 8) return 0;
        const table = {9:1, 10:2, 11:3, 12:4, 13:5, 14:7, 15:9, 16:12, 17:15, 18:19, 19:23, 20:28};
        return table[score] || 28;
    };
    const pointBuyBudget = computed(() => 27);
    const currentPbCost = computed(() => {
        let total = 0;
        Object.values(store.abilities.base).forEach(val => total += getFlexCost(val));
        return total;
    });
    const changePointBuy = (stat, delta) => {
        let next = store.abilities.base[stat] + delta;
        let min = 8, max = selectedScoreMethod.value === 'point_buy' ? 15 : 20;
        if (next >= min && next <= max) store.abilities.base[stat] = next;
    };

    const statBonuses = computed(() => {
        const totals = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
        if (raceBonuses && raceBonuses.value) {
            for (const [key, val] of Object.entries(raceBonuses.value)) totals[key] += val;
        }
        Object.values(store.abilities.asi).forEach(asi => {
            if (asi.stat1) totals[asi.stat1] += 1;
            if (asi.stat2) totals[asi.stat2] += 1;
        });
        return totals;
    });

    const finalAbilityScores = computed(() => {
        const finals = {};
        ['str','dex','con','int','wis','cha'].forEach(k => {
            finals[k] = (store.abilities.base[k] || 0) + (statBonuses.value[k] || 0);
        });
        return finals;
    });

    const proficiencyBonus = computed(() => Math.ceil(store.class.level / 4) + 1);

    return {
        // DÜZELTME: statLabels eklendi (selectableStats'a referans verir)
        statLabels: selectableStats, 
        selectableStats, 
        
        scoreMethods, selectedScoreMethod, isRolling, isCapped20, standardArrayValues,
        pointBuyBudget, currentPbCost, changePointBuy, getFlexCost,
        rollStats, statBonuses, finalAbilityScores, proficiencyBonus,
        hasRolled, rolledPool,
        scoreAllocations, draggedItem, assignScore, unassignScore, 
        syncAllocationsFromStore, handleOrbClick, 
        isOptionDisabled: () => false 
    };
}