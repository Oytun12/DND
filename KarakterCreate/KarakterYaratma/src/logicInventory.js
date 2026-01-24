// src/logicInventory.js
import { computed } from 'vue';
import { store } from './store.js';
import { weaponList, armorList } from './data/items.js';

export function useInventoryLogic(finalAbilityScores, proficiencyBonus, selectedClass, selectedRace) {

    // --- DEDEKTİF: USTALIK KONTROLÜ (Aynı Kalıyor) ---
    const checkProficiencyRule = (item) => {
        const knownProfs = [];
        if (selectedClass.value && selectedClass.value.proficiency) {
            selectedClass.value.proficiency.forEach(p => knownProfs.push(p.toLowerCase()));
        }
        if (selectedRace.value && selectedRace.value.proficiency) {
            selectedRace.value.proficiency.forEach(p => knownProfs.push(p.toLowerCase()));
        }

        let isProficient = false;
        let warning = null;

        if (item.category === 'simple') {
            if (knownProfs.some(p => p.includes('simple') || p.includes('basit'))) isProficient = true;
        } else if (item.category === 'martial') {
            if (knownProfs.some(p => p.includes('martial') || p.includes('savaş'))) isProficient = true;
        }

        if (!isProficient) {
            if (knownProfs.some(p => item.name.toLowerCase().includes(p) || p.includes(item.id))) {
                isProficient = true;
            }
        }

        if (item.strReq) {
            const currentStr = finalAbilityScores.value.str || 10;
            if (currentStr < item.strReq) {
                warning = `⚠️ Yetersiz Güç! (Gereken: ${item.strReq}, Sizde: ${currentStr})`;
            }
        }

        return { isProficient, warning };
    };

    // --- HESAPLAMALAR ---

    // 1. Zırh Sınıfı (AC) (Aynı Kalıyor)
    const calculatedAC = computed(() => {
        const dexMod = Math.floor(((finalAbilityScores.value.dex || 10) - 10) / 2);
        const equippedArmorId = store.inventory.armor || 'none';
        const armorData = armorList.find(a => a.id === equippedArmorId) || armorList[0];
        const hasShield = store.inventory.shield;

        let baseAC = armorData.ac;

        if (armorData.type === 'light') baseAC += dexMod;
        else if (armorData.type === 'medium') baseAC += Math.min(dexMod, 2);
        // Heavy: Dex yok

        if (hasShield) baseAC += 2;
        return baseAC;
    });

    // 2. Saldırı Listesi (GÜNCELLENDİ: TÜM STATLAR & AYRIK BONUSLAR)
    const attackList = computed(() => {
        // Tüm modları hazırla
        const mods = {
            str: Math.floor(((finalAbilityScores.value.str || 10) - 10) / 2),
            dex: Math.floor(((finalAbilityScores.value.dex || 10) - 10) / 2),
            con: Math.floor(((finalAbilityScores.value.con || 10) - 10) / 2),
            int: Math.floor(((finalAbilityScores.value.int || 10) - 10) / 2),
            wis: Math.floor(((finalAbilityScores.value.wis || 10) - 10) / 2),
            cha: Math.floor(((finalAbilityScores.value.cha || 10) - 10) / 2)
        };
        const pb = proficiencyBonus.value;

        const weaponInventory = store.inventory.weapons.map(w => 
            (typeof w === 'string') ? { id: w, custom: null } : w
        );

        return weaponInventory.map(wItem => {
            let wData;
            
            // Veriyi Al
            if (wItem.isCustomWeapon) {
                wData = wItem; 
            } else {
                wData = weaponList.find(i => i.id === wItem.id);
            }

            if (!wData) return null;

            // --- STAT SEÇİMİ (GÜNCELLENDİ) ---
            let selectedStatKey = wData.stat || 'str'; // Varsayılan STR
            let usedMod = mods.str;

            if (selectedStatKey === 'finesse') {
                // Finesse ise STR ve DEX'ten büyük olanı al
                usedMod = Math.max(mods.str, mods.dex);
            } else if (mods[selectedStatKey] !== undefined) {
                // Hexblade (Cha), Shillelagh (Wis), Artificer (Int) desteği
                usedMod = mods[selectedStatKey];
            }

            // --- BONUSLAR (GÜNCELLENDİ) ---
            // Özel silahsa kendi içindeki ayrı bonusları al, yoksa (standartsa) genel bonus yoktur (0)
            const extraHit = wItem.isCustomWeapon ? (wItem.bonusHit || 0) : 0;
            const extraDmg = wItem.isCustomWeapon ? (wItem.bonusDmg || 0) : 0;

            // --- USTALIK ---
            let isProficient = false;
            if (wItem.isCustomWeapon) {
                isProficient = wItem.customProficient; 
            } else {
                const ruleCheck = checkProficiencyRule(wData);
                isProficient = ruleCheck.isProficient;
                if (wItem.custom === true) isProficient = true;
                if (wItem.custom === false) isProficient = false;
            }

            // --- NİHAİ HESAP ---
            const hitBonus = usedMod + (isProficient ? pb : 0) + extraHit;
            const dmgBonus = usedMod + extraDmg;

            return {
                id: wData.id,
                name: wData.name,
                hit: (hitBonus >= 0 ? '+' : '') + hitBonus,
                dmg: wData.dmg,
                dmgType: wData.type,
                bonus: dmgBonus,
                totalBonusDisplay: (dmgBonus >= 0 ? '+' : '') + dmgBonus,
                isProficient: isProficient
            };
        }).filter(x => x !== null);
    });

    // --- YÖNETİM FONKSİYONLARI ---

    const toggleWeapon = (id) => {
        const index = store.inventory.weapons.findIndex(w => (typeof w === 'string' ? w : w.id) === id);
        if (index > -1) store.inventory.weapons.splice(index, 1);
        else store.inventory.weapons.push({ id: id, custom: null });
    };

    // GÜNCELLENDİ: Yeni formatta veri ekleme
    const addCustomWeaponToInventory = (formData) => {
        const newWeapon = {
            id: 'custom_' + Date.now(),
            isCustomWeapon: true,
            name: formData.name || 'İsimsiz Silah',
            dmg: formData.dmg || '1d4',
            type: formData.type || 'Kesici',
            stat: formData.stat || 'str',
            // YENİ: Ayrı bonusları kaydet
            bonusHit: formData.bonusHit || 0,
            bonusDmg: formData.bonusDmg || 0,
            customProficient: formData.isProficient
        };
        store.inventory.weapons.push(newWeapon);
    };

    const toggleWeaponProficiency = (id, forceState) => {
        const item = store.inventory.weapons.find(w => (typeof w === 'string' ? w : w.id) === id);
        if (item) {
            if (typeof item === 'string') {
                const idx = store.inventory.weapons.indexOf(item);
                store.inventory.weapons[idx] = { id: item, custom: forceState };
            } else {
                item.custom = forceState;
            }
        }
    };

    const setArmor = (id) => { store.inventory.armor = id; };
    const toggleShield = () => { store.inventory.shield = !store.inventory.shield; };

    return {
        weaponList, armorList,
        calculatedAC, attackList,
        toggleWeapon, toggleWeaponProficiency,
        setArmor, toggleShield,
        checkProficiencyRule,
        addCustomWeaponToInventory
    };
}