import { ref, computed } from 'vue';

export function useInventoryLogic(finalAbilityScores, proficiencyBonus, selectedClass, selectedRace) {
    
    const activeInvTab = ref('weapons'); 
    const store = window.store;
    
    // Başlangıç Güvenlik Kontrolü
    if (!store.inventory) store.inventory = {};
    if (!Array.isArray(store.inventory.weapons)) store.inventory.weapons = [];
    if (!Array.isArray(store.inventory.armor)) store.inventory.armor = [];
    if (!Array.isArray(store.inventory.gear)) store.inventory.gear = [];
    if (!store.inventory.currency) store.inventory.currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

    const carryCapacity = computed(() => (finalAbilityScores.value.str || 10) * 15);

    const currentWeight = computed(() => {
        let total = 0;
        store.inventory.weapons?.forEach(w => total += (parseFloat(w.weight) || 0)); 
        store.inventory.armor?.forEach(a => total += (parseFloat(a.weight) || 0));
        store.inventory.gear?.forEach(g => total += (parseFloat(g.weight) || 0) * (g.qty || 1));
        const totalCoins = Object.values(store.inventory.currency || {}).reduce((a, b) => a + b, 0);
        total += totalCoins / 50;
        return Math.floor(total * 10) / 10; 
    });

    const encumbrancePct = computed(() => {
        if (carryCapacity.value === 0) return 0;
        return Math.min((currentWeight.value / carryCapacity.value) * 100, 100);
    });

    const addWeapon = (w) => {
        store.inventory.weapons.push({
            id: Date.now(),
            name: w.name, dmg: w.dmg||'1d4', type: w.type||'Basit', stat: w.stat||'str',
            weight: parseFloat(w.weight)||2, bonusHit: parseInt(w.bonusHit)||0, bonusDmg: parseInt(w.bonusDmg)||0,
            isProficient: w.isProficient||false, equipped: true
        });
    };

    const addArmor = (a) => {
        store.inventory.armor.push({
            id: Date.now(),
            name: a.name, ac: parseInt(a.ac)||11, type: a.type||'Hafif',
            weight: parseFloat(a.weight)||5, equipped: false
        });
    };

    const addGear = (g) => {
        store.inventory.gear.push({
            id: Date.now(), name: g.name, qty: parseInt(g.qty)||1, weight: parseFloat(g.weight)||0
        });
    };

    const removeItem = (cat, idx) => { if(confirm("Silinsin mi?")) store.inventory[cat].splice(idx, 1); };

    const attackList = computed(() => {
        if (!Array.isArray(store.inventory.weapons)) return [];
        return store.inventory.weapons.filter(w => w.equipped).map(w => {
            const statKey = w.stat || 'str';
            const mod = Math.floor(((finalAbilityScores.value[statKey] || 10) - 10) / 2);
            const prof = w.isProficient ? proficiencyBonus.value : 0;
            return {
                ...w,
                hitBonus: mod + prof + (w.bonusHit || 0),
                dmgBonus: mod + (w.bonusDmg || 0),
                totalDmg: `${w.dmg} ${mod + (w.bonusDmg||0) >= 0 ? '+' : ''}${mod + (w.bonusDmg||0)}`
            };
        });
    });

    const calculatedAC = computed(() => {
        let base = 10;
        const dex = finalAbilityScores.value.dex || 10;
        const dexMod = Math.floor((dex - 10) / 2);
        
        // HATA ÖNLEYİCİ KONTROL
        if (!Array.isArray(store.inventory.armor)) return base + dexMod;

        const armor = store.inventory.armor.find(a => a.equipped);
        if (armor) {
            base = armor.ac;
            if (armor.type === 'Hafif') base += dexMod;
            else if (armor.type === 'Orta') base += Math.min(dexMod, 2);
        } else {
            base += dexMod;
        }
        return base;
    });

    return {
        activeInvTab, currentWeight, carryCapacity, encumbrancePct,
        weapons: computed(() => store.inventory.weapons),
        armors: computed(() => store.inventory.armor),
        gear: computed(() => store.inventory.gear),
        currency: computed(() => store.inventory.currency),
        addWeapon, addArmor, addGear, removeItem, attackList, calculatedAC
    };
}