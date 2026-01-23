// src/logicInventory.js
import { computed, ref } from 'vue';
import { store } from './store.js';
import { weaponList, armorList } from './data/items.js';

// Parametrelere class ve race eklendi
export function useInventoryLogic(finalAbilityScores, proficiencyBonus, selectedClass, selectedRace) {

    // --- YARDIMCI: USTALIK KONTROLÜ (DEDEKTİF) ---
    const checkProficiencyRule = (item) => {
        // 1. Karakterin Bildiği Tüm Ustalıkları Topla (Lower case yaparak)
        const knownProfs = [];
        
        // Sınıftan gelenler
        if (selectedClass.value && selectedClass.value.proficiency) {
            selectedClass.value.proficiency.forEach(p => knownProfs.push(p.toLowerCase()));
        }
        // Irktan gelenler (Varsa)
        if (selectedRace.value && selectedRace.value.proficiency) {
            selectedRace.value.proficiency.forEach(p => knownProfs.push(p.toLowerCase()));
        }

        // 2. Kontrol Et
        let isProficient = false;
        let warning = null;

        // Kategori Kontrolü (Simple / Martial)
        // Veritabanımızda "Basit Silahlar", "Simple Weapons" vb. farklı yazılmış olabilir, anahtar kelime arıyoruz.
        if (item.category === 'simple') {
            if (knownProfs.some(p => p.includes('simple') || p.includes('basit'))) isProficient = true;
        } else if (item.category === 'martial') {
            if (knownProfs.some(p => p.includes('martial') || p.includes('savaş'))) isProficient = true;
        }

        // İsim Kontrolü (Spesifik silah hakkı, örn: Elf Weapon Training - Longsword)
        // item.name: "Uzun Kılıç" -> "uzun kılıç"
        if (!isProficient) {
            if (knownProfs.some(p => item.name.toLowerCase().includes(p) || p.includes(item.id))) {
                isProficient = true;
            }
        }

        // 3. Zırh/Silah Gereksinim Kontrolü (STR Şartı)
        // Eğer silah heavy ise ve karakter küçükse vs. (Şimdilik sadece Zırh STR şartı ekleyelim)
        if (item.strReq) {
            const currentStr = finalAbilityScores.value.str || 10;
            if (currentStr < item.strReq) {
                warning = `Yetersiz Güç! (Gereken: ${item.strReq}, Sizde: ${currentStr})`;
                // Gereksinim karşılanmazsa kural olarak proficiency düşmez ama hız düşer. 
                // Biz basitlik adına burada da uyarı verelim.
            }
        }

        return { isProficient, warning };
    };


    // --- HESAPLAMALAR ---

    // 1. Zırh Sınıfı (AC)
    const calculatedAC = computed(() => {
        const dexMod = Math.floor(((finalAbilityScores.value.dex || 10) - 10) / 2);
        const equippedArmorId = store.inventory.armor || 'none';
        const armorData = armorList.find(a => a.id === equippedArmorId) || armorList[0];
        const hasShield = store.inventory.shield;

        let baseAC = armorData.ac;

        // Zırh türü ve Dex hesabı
        if (armorData.type === 'light') baseAC += dexMod;
        else if (armorData.type === 'medium') baseAC += Math.min(dexMod, 2);
        // Heavy: Dex yok

        if (hasShield) baseAC += 2;
        return baseAC;
    });

    // 2. Saldırı Listesi (GÜNCELLENDİ)
    const attackList = computed(() => {
        const strMod = Math.floor(((finalAbilityScores.value.str || 10) - 10) / 2);
        const dexMod = Math.floor(((finalAbilityScores.value.dex || 10) - 10) / 2);
        const pb = proficiencyBonus.value;

        // store.inventory.weapons artık obje dizisi olmalı: [{id:'dagger', custom:true}, {id:'club'}]
        // Geriye dönük uyumluluk için string ise objeye çeviriyoruz.
        const weaponInventory = store.inventory.weapons.map(w => {
            return (typeof w === 'string') ? { id: w, custom: null } : w;
        });

        return weaponInventory.map(wItem => {
            const wData = weaponList.find(i => i.id === wItem.id);
            if (!wData) return null;

            // Stat Seçimi
            let usedMod = strMod;
            if (wData.stat === 'dex') usedMod = dexMod;
            else if (wData.stat === 'finesse') usedMod = Math.max(strMod, dexMod);

            // Ustalık Kontrolü
            const ruleCheck = checkProficiencyRule(wData);
            
            // Nihai Karar: Kullanıcı override etmiş mi? Yoksa Kural mı geçerli?
            // wItem.custom === true (Kullanıcı "Ben ustayım" dedi)
            // wItem.custom === false (Kullanıcı "Usta değilim" dedi - nadir)
            // wItem.custom === null/undefined (Varsayılan kurala uy)
            
            let isProficient = ruleCheck.isProficient;
            if (wItem.custom === true) isProficient = true; 
            // Kullanıcı özellikle tiklemişse, kural ne derse desin ustadır.

            const hitBonus = usedMod + (isProficient ? pb : 0);
            const dmgBonus = usedMod;

            return {
                id: wData.id,
                name: wData.name,
                hit: (hitBonus >= 0 ? '+' : '') + hitBonus,
                dmg: wData.dmg,
                dmgType: wData.type,
                bonus: dmgBonus,
                totalBonusDisplay: (dmgBonus >= 0 ? '+' : '') + dmgBonus,
                // UI için gerekli bilgiler:
                isProficient, 
                warning: ruleCheck.warning,
                ruleSays: ruleCheck.isProficient // Kuralın asıl fikri (Toast için lazım)
            };
        }).filter(x => x !== null);
    });

    // --- YÖNETİM FONKSİYONLARI ---

    // Silah Ekle/Çıkar (GÜNCELLENDİ)
    const toggleWeapon = (id) => {
        // Envanterdeki mevcut durumu bul
        // Not: store.inventory.weapons artık obje ve string karışık olabilir, normalize ediyoruz
        const index = store.inventory.weapons.findIndex(w => (typeof w === 'string' ? w : w.id) === id);

        if (index > -1) {
            // Varsa çıkar
            store.inventory.weapons.splice(index, 1);
        } else {
            // Yoksa ekle (Varsayılan olarak 'null' yani kurala uy)
            // { id: 'dagger', custom: null }
            store.inventory.weapons.push({ id: id, custom: null });
        }
    };

    // Ustalık Tikini Değiştir (YENİ)
    const toggleWeaponProficiency = (id, forceState) => {
        const item = store.inventory.weapons.find(w => (typeof w === 'string' ? w : w.id) === id);
        if (item) {
            // Eğer item string ise objeye çevir (Eski seed uyumluluğu)
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
        checkProficiencyRule // Toast mesajı için dışarı açıyoruz
    };
}