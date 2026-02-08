// src/logicResources.js
import { store } from './store.js';

// Stat bonusunu hesaplayan yardımcı (store'daki base stat + ırk bonusu hesabı karmaşık olduğu için
// burada basitçe store'daki base'i veya dışarıdan gelen final değeri kullanacağız)
const getMod = (score) => Math.floor((score - 10) / 2);

export function calculateResources(cls, sub, race, level, stats) {
    if (!cls) return [];
    
    const resources = [];
    const cName = cls.name;
    const sName = sub ? sub.name : "";
    const rName = race ? race.name : "";
    
    // Stats: appKarYa tarafından hesaplanmış "finalAbilityScores" buraya gönderilmeli.
    // Eğer gönderilmezse store'daki ham veriyi kullanır (bonuslar eksik olabilir).
    const sStr = stats.str || 10;
    const sDex = stats.dex || 10;
    const sCon = stats.con || 10;
    const sInt = stats.int || 10;
    const sWis = stats.wis || 10;
    const sCha = stats.cha || 10;

    // --- GENEL ---
    // Hit Dice (Can Zarı)
    const hdFace = cls.hd ? cls.hd.faces : 8;
    resources.push({ 
        id: 'hit_dice', 
        name: `Can Zarı (d${hdFace})`, 
        max: level, 
        reset: 'long',
        icon: '💤'
    });

    // --- BARBAR (BARBARIAN) ---
    if (cName === 'Barbar') {
        let maxRage = 2;
        if (level >= 20) maxRage = 99; // Sınırsız
        else if (level >= 17) maxRage = 6;
        else if (level >= 12) maxRage = 5;
        else if (level >= 6) maxRage = 4;
        else if (level >= 3) maxRage = 3;
        
        resources.push({ id: 'rage', name: 'Öfke (Rage)', max: maxRage, reset: 'long', icon: '🔥' });

        if (sName.includes('Ata Muhafızı Yolu') || sName.includes('Ancestral')) {
             // Spirit Shield vb. genelde rage harcar ama özel bir havuz varsa buraya eklenir.
        }
        if (sName.includes('Yobazın Yolu') || sName.includes('Zealot') && level >= 6) {
             resources.push({ id: 'fanatical_focus', name: 'Fanatik Odak', max: 1, reset: 'long', icon: '🛡️' });
        }
    }

    // --- OZAN (BARD) ---
    if (cName === 'Ozan') {
        const chaMod = Math.max(1, getMod(sCha));
        const resetType = level >= 5 ? 'short' : 'long';
        // Zar boyutu seviyeye göre değişir (gösterimsel)
        let dieSize = 'd6';
        if (level >= 15) dieSize = 'd12';
        else if (level >= 10) dieSize = 'd10';
        else if (level >= 5) dieSize = 'd8';

        resources.push({ 
            id: 'bardic', 
            name: `Ozan İlhamı (${dieSize})`, 
            max: chaMod, 
            reset: resetType, 
            icon: '🎶' 
        });
    }

    // --- RAHİP (CLERIC) ---
    if (cName === 'Rahip' && level >= 2) {
        let maxCD = 1;
        if (level >= 18) maxCD = 3;
        else if (level >= 6) maxCD = 2;
        
        resources.push({ id: 'channel_divinity', name: 'Kutsal Kanal', max: maxCD, reset: 'short', icon: '✨' });
        
        // Bazı domainlerin özel kaynakları:
        if (sName.includes('Işık') && level >= 1) {
            resources.push({ id: 'warding_flare', name: 'Koruyucu Parlama', max: Math.max(1, getMod(sWis)), reset: 'long', icon: '🔥' });
        }
        if (sName.includes('Alacakaranlık') || sName.includes('Twilight')) {
            // Channel Divinity kullanır, ekstra kaynak yok.
        }
        if (sName.includes('Savaş') || sName.includes('War') && level >= 1) {
            resources.push({ id: 'war_priest', name: 'Savaş Rahibi Saldırısı', max: Math.max(1, getMod(sWis)), reset: 'long', icon: '⚔️' });
        }
    }

    // --- DRUID ---
    if (cName === 'Druid' && level >= 2) {
        let maxWS = 2;
        if (level >= 20) maxWS = 99; // Archdruid (Sınırsız)
        resources.push({ id: 'wild_shape', name: 'Vahşi Şekil', max: maxWS, reset: 'short', icon: '🐾' });
        
        if (sName.includes('Yıldız') || sName.includes('Stars')) {
            resources.push({ id: 'starry_form', name: 'Yıldız Formu (Wild Shape)', max: maxWS, reset: 'short', icon: '🌟' });
        }
    }

    // --- DÖVÜŞÇÜ (FIGHTER) ---
    if (cName === 'Dövüşçü' || cName === 'Savaşçı') {
        resources.push({ id: 'second_wind', name: 'İkinci Soluk', max: 1, reset: 'short', icon: '❤️' });
        
        if (level >= 2) {
            let maxAS = 1; 
            if (level >= 17) maxAS = 2;
            resources.push({ id: 'action_surge', name: 'Eylem Taşması', max: maxAS, reset: 'short', icon: '⚡' });
        }
        
        if (level >= 9) {
            let maxIndom = 1;
            if (level >= 17) maxIndom = 3;
            else if (level >= 13) maxIndom = 2;
            resources.push({ id: 'indomitable', name: 'Yılma (Indomitable)', max: maxIndom, reset: 'long', icon: '🛡️' });
        }

        // Subclasses
        if (sName.includes('Savaş Üstadı') || sName.includes('Battle Master')) {
            let dice = 4; 
            if (level >= 15) dice = 6; 
            else if (level >= 7) dice = 5;
            
            let dieType = 'd8';
            if (level >= 18) dieType = 'd12';
            else if (level >= 10) dieType = 'd10';

            resources.push({ id: 'sup_dice', name: `Üstünlük Zarı (${dieType})`, max: dice, reset: 'short', icon: '🎲' });
        }
        
        if (sName.includes('Samuray') && level >= 3) {
            resources.push({ id: 'fighting_spirit', name: 'Dövüş Ruhu', max: 3, reset: 'long', icon: '👺' });
        }
        
        if ((sName.includes('Psi') || sName.includes('Psi Warrior')) && level >= 3) {
            const psiMax = (2 * getMod(sInt)) + 1; // Değişiklik: Proficiency Bonus * 2 (Tasha's Cauldron)
            // Tasha kuralı: 2 * Prof Bonus. Prof Bonus logicSheet'te yok, levelden hesaplayalım:
            const prof = Math.ceil(level / 4) + 1;
            resources.push({ id: 'psi_dice', name: 'Psionik Enerji Zarı', max: prof * 2, reset: 'long', icon: '🧠' });
        }

        if ((sName.includes('Rün') || sName.includes('Rune')) && level >= 3) {
             const prof = Math.ceil(level / 4) + 1;
             resources.push({ id: 'giants_might', name: 'Devin Kudreti', max: prof, reset: 'long', icon: '💪' });
        }
        
        if (sName.includes('Arcane Okçu') && level >= 3) {
            resources.push({ id: 'arcane_shot', name: 'Arcane Atış', max: 2, reset: 'short', icon: '🏹' });
        }
    }

    // --- KEŞİŞ (MONK) ---
    if (cName === 'Keşiş' && level >= 2) {
        resources.push({ id: 'ki', name: 'Ki Puanı', max: level, reset: 'short', icon: '🧘' });
    }

    // --- PALADIN ---
    if (cName === 'Paladin') {
        resources.push({ id: 'lay_on_hands', name: 'Şifa Elleri (HP)', max: level * 5, reset: 'long', icon: '✋' });
        
        if (level >= 3) {
            resources.push({ id: 'channel_divinity_pal', name: 'Kutsal Kanal', max: 1, reset: 'short', icon: '☀️' });
        }
    }

    // --- KORUCU (RANGER) ---
    if (cName === 'Kolcu') {
        // Tasha's Favored Foe
        // Eğer varyant özellik seçildiyse (kontrolü zor, varsayılan ekleyelim)
        const prof = Math.ceil(level / 4) + 1;
        // resources.push({ id: 'favored_foe', name: 'Favored Foe', max: prof, reset: 'long', icon: '🎯' });
        
        if ((sName.includes('Fey') || sName.includes('Wanderer')) && level >= 3) {
            // Genelde spell slot kullanır
        }
        if (sName.includes('Swarmkeeper') && level >= 3) {
            // Sınırsız
        }
        if (sName.includes('Gloom Stalker') && level >= 3) {
             // İlk tur bonusu, resource değil.
        }
    }

    // --- HARAMİ (ROGUE) ---
    if (cName === 'Rogue' || cName === 'Düzenbaz') {
        if (sName.includes('Soulknife') && level >= 3) {
            const prof = Math.ceil(level / 4) + 1;
            resources.push({ id: 'psi_dice_rogue', name: 'Psionik Enerji', max: prof * 2, reset: 'long', icon: '🧠' });
        }
        if (sName.includes('Phantom') && level >= 9) {
            // Tokens of the Departed (Envanter gibi çalışır ama resource olabilir)
        }
    }

    // --- BÜYÜCÜ (SORCERER) ---
    if ((cName === 'Büyücü' || cName === 'Sorcerer') && level >= 2) {
        resources.push({ id: 'sorcery_points', name: 'Büyücülük Puanı', max: level, reset: 'long', icon: '🔮' });
    }

    // --- WARLOCK ---
    if (cName === 'Warlock' || cName === 'Cadı') {
        let slots = 1;
        if (level >= 17) slots = 4;
        else if (level >= 11) slots = 3;
        else if (level >= 2) slots = 2;
        
        // Slot seviyesini de belirtmek şık olur
        let slotLvl = 1;
        if (level >= 9) slotLvl = 5;
        else if (level >= 7) slotLvl = 4;
        else if (level >= 5) slotLvl = 3;
        else if (level >= 3) slotLvl = 2;

        resources.push({ id: 'pact_slots', name: `Pact Slotları (Lv.${slotLvl})`, max: slots, reset: 'short', icon: '🌙' });
        
        if (sName.includes('Kutsal') && level >= 1) {
            resources.push({ id: 'healing_light', name: 'İyileştirici Işık (d6)', max: 1 + level, reset: 'long', icon: '✨' });
        }
        if (sName.includes('Hex Kılıcı') && level >= 1) {
            resources.push({ id: 'hexblades_curse', name: 'Hexblade Laneti', max: 1, reset: 'short', icon: '💀' });
        }
    }

    // --- SİHİRBAZ (WIZARD) ---
    if (cName === 'Sihirbaz' || cName === 'Wizard') {
        resources.push({ id: 'arcane_recovery', name: 'Arcane Recovery', max: 1, reset: 'long', icon: '📘' });
        
        if (sName.includes('Bladesinger') || sName.includes('Bladesinging') && level >= 2) {
            const prof = Math.ceil(level / 4) + 1;
            resources.push({ id: 'bladesong', name: 'Kılıç Şarkısı', max: prof, reset: 'long', icon: '⚔️' });
        }
    }
    
    // --- ARITIFICER (Mucit) ---
    if (cName === 'Mucit' || cName === 'Artificer') {
        // Flash of Genius (Lv 7)
        if (level >= 7) {
            resources.push({ id: 'flash_genius', name: 'Deha Parıltısı', max: Math.max(1, getMod(sInt)), reset: 'long', icon: '💡' });
        }
    }

    // --- IRK ÖZELLİKLERİ ---
    if (rName.includes('Aasimar')) {
        resources.push({ id: 'celestial_rev', name: 'Semavi Dönüşüm', max: 1, reset: 'long', icon: '👼' });
        resources.push({ id: 'healing_hands_aasimar', name: 'Şifa Elleri (Aasimar)', max: 1, reset: 'long', icon: '✋' });
    }
    if (rName.includes('Ejder') || rName.includes('Dragonborn')) {
        // Fizban revizyonuna göre Prof Bonus kadar olabilir ama standart PHB 1 tanedir.
        // Genelde PHB: 1/Short, Fizban: Prof/Long. Şimdilik PHB (Short) yapalım.
        resources.push({ id: 'breath_weapon', name: 'Ejder Nefesi', max: 1, reset: 'short', icon: '🔥' });
    }
    if (rName.includes('Tiefling') && level >= 3) {
         resources.push({ id: 'hellish_rebuke', name: 'Cehennem Azarı', max: 1, reset: 'long', icon: '🔥' });
         if (level >= 5) resources.push({ id: 'darkness_race', name: 'Karanlık (Tiefling)', max: 1, reset: 'long', icon: '🌑' });
    }
    if (rName.includes('Orc') || rName.includes('Ork')) {
         // Half-orc Relentless Endurance
         resources.push({ id: 'relentless_endurance', name: 'Amansız Dayanıklılık (Half-Orc)', max: 1, reset: 'long', icon: '💀' });
    }

    return resources;
}