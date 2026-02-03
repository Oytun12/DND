import { ref, computed } from 'vue';

export function useInventoryLogic(finalAbilityScores, proficiencyBonus, selectedClass, selectedRace) {
    
    const activeInvTab = ref('weapons'); 
    const store = window.store;
    
    // --- GÜVENLİK VE ONARIM (CRASH PROTECTION) ---
    const ensureStructure = () => {
        if (!store.inventory) store.inventory = {};
        if (!Array.isArray(store.inventory.weapons)) store.inventory.weapons = [];
        if (!Array.isArray(store.inventory.armor)) store.inventory.armor = [];
        if (!Array.isArray(store.inventory.gear)) store.inventory.gear = [];
        if (!store.inventory.currency) store.inventory.currency = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };
    };
    ensureStructure(); 

    // --- HESAPLAMALAR ---
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

    // --- EKLEME FONKSİYONLARI ---
    const addWeapon = (w) => {
        if (!Array.isArray(store.inventory.weapons)) store.inventory.weapons = [];
        store.inventory.weapons.push({
            id: Date.now(),
            name: w.name, dmg: w.dmg||'1d4', type: w.type||'Basit', stat: w.stat||'str',
            weight: parseFloat(w.weight)||2, bonusHit: parseInt(w.bonusHit)||0, bonusDmg: parseInt(w.bonusDmg)||0,
            isProficient: w.isProficient!==false, equipped: true
        });
    };

    const addArmor = (a) => {
        if (!Array.isArray(store.inventory.armor)) store.inventory.armor = [];
        store.inventory.armor.push({
            id: Date.now(),
            name: a.name, ac: parseInt(a.ac)||11, type: a.type||'Hafif',
            weight: parseFloat(a.weight)||5, equipped: false 
        });
    };

    const addGear = (g) => {
        if (!Array.isArray(store.inventory.gear)) store.inventory.gear = [];
        store.inventory.gear.push({
            id: Date.now(), name: g.name, qty: parseInt(g.qty)||1, weight: parseFloat(g.weight)||0
        });
    };

    const removeItem = (cat, idx) => { 
        if(confirm("Silinsin mi?")) {
            if(Array.isArray(store.inventory[cat])) store.inventory[cat].splice(idx, 1);
        }
    };

    // --- ZIRH DETAY METNİ (Listede Göstermek İçin) ---
    const getArmorMechanicText = (armor) => {
        if (!armor) return "";
        if (armor.type === 'Kalkan' || armor.type === 'Shield') return '+2 AC';
        if (armor.type === 'Hafif') return `AC ${armor.ac} + Dex`;
        if (armor.type === 'Orta') return `AC ${armor.ac} + Dex (Max 2)`;
        if (armor.type === 'Ağır') return `AC ${armor.ac}`;
        return `AC ${armor.ac}`;
    };

    // --- ZIRH VE KALKAN KUŞANMA (AKILLI SİSTEM) ---
    const handleArmorEquip = (targetArmor) => {
        if (targetArmor.type === 'Kalkan') {
            // Kalkanı aç/kapa (Diğer kalkanları kapatıyoruz, sadece 1 kalkan)
            if (!targetArmor.equipped) {
                store.inventory.armor.forEach(a => { if (a.type === 'Kalkan' && a.id !== targetArmor.id) a.equipped = false; });
            }
            targetArmor.equipped = !targetArmor.equipped;
        } else {
            // Gövde zırhı: Diğer gövde zırhlarını kapat
            if (!targetArmor.equipped) {
                store.inventory.armor.forEach(a => { if (a.type !== 'Kalkan' && a.id !== targetArmor.id) a.equipped = false; });
                targetArmor.equipped = true;
            } else {
                targetArmor.equipped = false;
            }
        }
    };

    // --- AC HESABI ---
    const calculatedAC = computed(() => {
        let base = 10;
        const dex = finalAbilityScores.value.dex || 10;
        const dexMod = Math.floor((dex - 10) / 2);
        
        if (!Array.isArray(store.inventory.armor)) return base + dexMod;

        const shield = store.inventory.armor.find(a => a.equipped && a.type === 'Kalkan');
        const shieldBonus = shield ? 2 : 0;

        const armor = store.inventory.armor.find(a => a.equipped && a.type !== 'Kalkan');
        if (armor) {
            base = armor.ac;
            if (armor.type === 'Hafif') base += dexMod;
            else if (armor.type === 'Orta') base += Math.min(dexMod, 2);
            // Ağır zırh Dex eklemez
        } else {
            base += dexMod;
        }
        return base + shieldBonus;
    });

    // --- AKSİYON LİSTESİ (Tüm Statları Destekleyen Versiyon) ---
    const attackList = computed(() => {
        if (!Array.isArray(store.inventory.weapons)) return [];

        return store.inventory.weapons.filter(w => w.equipped).map(w => {
            
            // 1. Modifikatör Hesabı (Dinamik)
            let mod = 0;
            const scores = finalAbilityScores.value || {};
            
            // Yardımcı fonksiyon: Skordan modifikatör hesapla
            const getMod = (val) => Math.floor(((val || 10) - 10) / 2);

            if (w.stat === 'finesse') {
                // Finesse: STR ve DEX arasından en yükseğini al
                mod = Math.max(getMod(scores.str), getMod(scores.dex));
            } else {
                // Dinamik: Seçilen stat neyse (cha, int, wis...) onun skorunu bul
                // Eğer stat bulunamazsa varsayılan olarak STR kullan
                const targetStat = w.stat || 'str';
                mod = getMod(scores[targetStat]);
            }

            // 2. Bonuslar
            const prof = w.isProficient ? (proficiencyBonus.value || 2) : 0;
            const magicHit = parseInt(w.bonusHit) || 0;
            const magicDmg = parseInt(w.bonusDmg) || 0;

            const totalHit = mod + prof + magicHit;
            const totalDmgBonus = mod + magicDmg;
            const dmgSign = totalDmgBonus >= 0 ? '+' : '';

            return {
                ...w,
                hit: totalHit >= 0 ? `+${totalHit}` : totalHit,
                hitVal: totalHit,
                dmgBonus: totalDmgBonus,
                totalBonusDisplay: totalDmgBonus !== 0 ? `${dmgSign}${totalDmgBonus}` : '',
                dmgType: w.type
            };
        });
    });

    return {
        activeInvTab, currentWeight, carryCapacity, encumbrancePct,
        weapons: computed(() => store.inventory.weapons),
        armors: computed(() => store.inventory.armor),
        gear: computed(() => store.inventory.gear),
        currency: computed(() => store.inventory.currency),
        addWeapon, addArmor, addGear, removeItem, attackList, calculatedAC,
        // YENİLER:
        handleArmorEquip, getArmorMechanicText 
    };
}