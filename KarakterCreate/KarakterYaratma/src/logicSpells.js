import { ref, computed } from 'vue';
import { store } from './store.js';
import { useDiceLogic } from './logicDice.js';

export function useSpellLogic(targetLevel, selectedClass, finalAbilityScores) {
    
    const { rollD20, rollDamage } = useDiceLogic();

    // --- 1. VERİ YÖNETİMİ ---
    const allSpells = ref([]);
    const isLoadingSpells = ref(false);

    // JSON verisini yükle (SADELEŞTİRİLMİŞ VE GARANTİ)
    const loadSpellsData = async () => {
        if (allSpells.value.length > 0) return; // Zaten yüklü, çık.
        
        isLoadingSpells.value = true;
        
        // HTML dosyan "KarakterYaratma" klasöründe.
        // Data klasörü ise bir üstte "KarakterCreate/Data" içinde.
        // Bu yüzden "../Data/..." yolu doğrudur.
        const targetPath = '../../Data/spells/spells-phb.json';

        try {
            console.log("Büyü verisi isteniyor:", targetPath); // Konsola bilgi bas
            const response = await fetch(targetPath);
            
            if (!response.ok) {
                throw new Error(`HTTP Hatası: ${response.status}`);
            }

            const data = await response.json();
            
            // Veri yapısını çöz
            let rawList = [];
            if (Array.isArray(data)) rawList = data;
            else if (data.spell) rawList = data.spell;
            
            // OKUL İSİMLERİ SÖZLÜĞÜ (YENİ)
            const schoolMap = {
                'A': 'Abjuration',
                'C': 'Conjuration',
                'D': 'Divination',
                'E': 'Enchantment',
                'V': 'Evocation',
                'I': 'Illusion',
                'N': 'Necromancy',
                'T': 'Transmutation'
            };

            // Veriyi işle ve hafızaya al
            allSpells.value = rawList.map((s, index) => ({
                ...s,
                id: (s.name ? s.name.replace(/[\s\(\)]/g, '_').toLowerCase() : 'spell') + '_' + index,
                
                // OKUL İSMİNİ DÜZELT (YENİ)
                // Eğer harita içinde varsa uzun halini al, yoksa olduğu gibi bırak
                school: schoolMap[s.school] || s.school,

                searchString: (
                    (s.name || '') + ' ' + 
                    (schoolMap[s.school] || s.school) + ' ' + // Aramaya da uzun halini ekle
                    (s.level || '')
                ).toLocaleLowerCase('tr')
            }));

            console.log(`Toplam ${allSpells.value.length} büyü işlendi.`);

        } catch (e) {
            console.error("KRİTİK HATA:", e);
            alert(`Büyü verisi yüklenemedi!\nDosya Yolu: ${targetPath}\nHata: ${e.message}`);
        } finally {
            isLoadingSpells.value = false;
        }
    };

    // --- 2. KİTAP VE SLOT YÖNETİMİ ---
    
    // Kullanıcının bildiği büyüler
    const knownSpellsList = computed(() => {
        return store.spells.known.map(kId => {
            return allSpells.value.find(s => s.id === kId) || null;
        }).filter(s => s !== null).sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
    });

    // Seviye bazlı gruplama
    const groupedSpells = computed(() => {
        const groups = {};
        knownSpellsList.value.forEach(spell => {
            const lvl = spell.level;
            if (!groups[lvl]) groups[lvl] = [];
            groups[lvl].push(spell);
        });
        return groups;
    });

    // Slot Maksimumlarını Hesapla
    const maxSpellSlots = computed(() => {
        const lvl = targetLevel.value || 1;
        const clsName = selectedClass.value?.name || '';
        
        const slots = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 };
        let casterLevel = lvl;
        
        // Sınıf tipine göre çarpan
        if (['Paladin', 'Kolcu', 'Ranger'].includes(clsName)) casterLevel = Math.floor(lvl / 2);
        else if (['Warlock', 'Sihirbaz'].includes(clsName)) casterLevel = 0; // Warlock özel hesaplanır
        else if (['Rogue', 'Fighter', 'Dövüşçü', 'Düzenbaz'].includes(clsName)) casterLevel = Math.floor(lvl / 3); // Arcane Trickster vb.

        if (casterLevel >= 1) slots[1] = 2;
        if (casterLevel >= 2) slots[1] = 3;
        if (casterLevel >= 3) { slots[1] = 4; slots[2] = 2; }
        if (casterLevel >= 4) { slots[2] = 3; }
        if (casterLevel >= 5) { slots[3] = 2; }
        if (casterLevel >= 6) { slots[3] = 3; }
        if (casterLevel >= 7) { slots[4] = 1; }
        if (casterLevel >= 8) { slots[4] = 2; }
        if (casterLevel >= 9) { slots[4] = 3; slots[5] = 1; }
        if (casterLevel >= 10) { slots[5] = 2; }
        // ... (Tablo devam eder)

        return slots;
    });

    const toggleSpellKnown = (spellId) => {
        const idx = store.spells.known.indexOf(spellId);
        if (idx > -1) store.spells.known.splice(idx, 1);
        else store.spells.known.push(spellId);
    };

    // --- 3. BÜYÜ ATMA (CASTING) ---
    const castSpell = (spell) => {
        let diceString = null;
        let modifier = 0;
        let damageType = spell.damageInflict ? spell.damageInflict[0] : 'Büyü';

        // JSON içeriğini metne çevirip içinde zar ara
        const rawText = JSON.stringify(spell.entries);

        // Gelişmiş Regex: {@dice 8d6} veya {@dice 1d4+1} veya {@damage ...} hepsini yakalar
        const regex = /{@(?:dice|damage)\s+([0-9]+d[0-9]+)(?:\s*([+\-])\s*([0-9]+))?.*?}/i;
        
        const match = rawText.match(regex);

        if (match) {
            diceString = match[1]; // "8d6" veya "1d4"
            
            // Eğer +1 veya -2 gibi bonus varsa
            if (match[2] && match[3]) {
                const sign = match[2] === '-' ? -1 : 1;
                modifier = sign * parseInt(match[3]);
            }
        }

        if (diceString) {
            console.log(`Büyü Atılıyor: ${spell.name}, Zar: ${diceString}, Bonus: ${modifier}`);
            rollDamage(spell.name, diceString, modifier, damageType);
        } else {
            alert(`${spell.name} kullanıldı! (Otomatik hasar zarı bulunamadı)`);
        }
    };

    // --- 4. PARSER ---
    const renderEntry = (entry) => {
        if (typeof entry === 'string') {
            return entry.replace(/{@dice\s(.*?)}/g, '<b>$1</b>')
                        .replace(/{@condition\s(.*?)}/g, '<u>$1</u>')
                        .replace(/{@spell\s(.*?)}/g, '<i>$1</i>')
                        .replace(/{@damage\s(.*?)}/g, '<b>$1</b>');
        }
        
        if (entry.type === 'list') {
            return `<ul>${entry.items.map(i => `<li>${renderEntry(i)}</li>`).join('')}</ul>`;
        }

        if (entry.type === 'entries') {
            return `<div><strong>${entry.name}:</strong> ${entry.entries.map(renderEntry).join(' ')}</div>`;
        }
        
        return '';
    };

    return {
        allSpells,
        isLoadingSpells,
        loadSpellsData,
        knownSpellsList,
        groupedSpells,
        maxSpellSlots,
        toggleSpellKnown,
        castSpell,
        renderEntry
    };
}