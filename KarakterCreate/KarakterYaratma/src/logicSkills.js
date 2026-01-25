import { computed } from 'vue';
import { store } from './store.js';

export function useSkillLogic(finalAbilityScores, proficiencyBonus) {

    const SKILL_DEFINITIONS = [
        { id: 'acrobatics', name: 'Akrobasi', attr: 'dex' },
        { id: 'sleight_of_hand', name: 'El Çabukluğu', attr: 'dex' }, // "El Çubuklu" düzeltildi
        { id: 'stealth', name: 'Gizlilik', attr: 'dex' },
        { id: 'arcana', name: 'Arcana', attr: 'int' },
        { id: 'history', name: 'Tarih', attr: 'int' },
        { id: 'investigation', name: 'Araştırma', attr: 'int' },
        { id: 'nature', name: 'Nature', attr: 'int' },
        { id: 'religion', name: 'Din', attr: 'int' },
        { id: 'animal_handling', name: 'Hayvan Terbiyesi', attr: 'wis' }, // Listede yoktu, standart gereği ekledim
        { id: 'insight', name: 'Sezgi', attr: 'wis' },
        { id: 'medicine', name: 'Medicine', attr: 'wis' }, // "Medicane" düzeltildi
        { id: 'perception', name: 'Algı', attr: 'wis' },
        { id: 'survival', name: 'Survival', attr: 'wis' },
        { id: 'deception', name: 'Aldatma', attr: 'cha' },
        { id: 'intimidation', name: 'Gözdağı', attr: 'cha' },
        { id: 'performance', name: 'Performans', attr: 'cha' },
        { id: 'persuasion', name: 'İkna', attr: 'cha' },
        { id: 'athletics', name: 'Atletizm', attr: 'str' }
    ];

    // Irkın verdiği yetenek hakları
    const getRaceSkillRules = () => {
        const race = store.race.selected?.name || "";
        const subrace = store.race.subrace?.name || "";
        const fullName = `${race} ${subrace}`.toLowerCase();
        let rules = { fixed: [], bonusBudget: 0, text: null };
        
        // Buradaki <strong> etiketleri HTML tarafında v-html ile çalışacak
        if (fullName.includes("insan") && (fullName.includes("alternatif") || fullName.includes("varyant"))) { 
            rules.bonusBudget = 1; 
            rules.text = "Alternatif İnsan: <strong>1</strong> beceri seçimi."; 
        }
        if (fullName.includes("elf") && !fullName.includes("yarı")) { 
            rules.fixed.push("perception"); 
            rules.text = "Keskin Duyular: <strong>Algı</strong> yeteneği."; 
        }
        if (fullName.includes("yarı-elf")) { 
            rules.bonusBudget = 2; 
            rules.text = "Beceri Çokluğu: İstediğin <strong>2</strong> beceriyi seçebilirsin."; 
        }
        if (fullName.includes("orc") || fullName.includes("ork")) { // 'ork' ihtimalini de ekledim
            rules.fixed.push("intimidation"); 
            rules.text = "Korkutucu: <strong>Gözdağı</strong> yeteneği."; 
        }
        if (fullName.includes("goliath")) { 
            rules.fixed.push("athletics"); 
            rules.text = "Doğal Atlet: <strong>Atletizm</strong> yeteneği."; 
        }
        return rules;
    };

    const raceSkillInfo = computed(() => getRaceSkillRules().text);

    // Sınıfın verdiği yetenek hakları (DİNAMİK VERSİYON)
    const getClassSkillRules = () => {
        if (!store.class.selected) return null;

        // 1. JSON verisinden yetenek bilgilerini çekiyoruz
        // Veri yolu: selectedClass -> startingProficiencies -> skills
        const startProfs = store.class.selected.startingProficiencies;

        if (startProfs && startProfs.skills) {
            const skillData = startProfs.skills;

            // DURUM A: Belirli bir listeden seçim (Örn: Barbar, Kolcu, Büyücü)
            // JSON Yapısı: { "choose": 2, "from": ["Atletizm", "Doğa"...] }
            if (skillData.from && skillData.choose) {
                return {
                    count: skillData.choose, // Seçim sayısı (Örn: 2)
                    list: Array.isArray(skillData.from) ? skillData.from.join(', ') : skillData.from
                };
            }

            // DURUM B: Herhangi bir yetenek (Örn: Ozan - Bard)
            // JSON Yapısı bazen { "any": 3 } şeklinde olabilir
            if (skillData.any) {
                return {
                    count: skillData.any,
                    list: "İstediğin herhangi bir yetenek"
                };
            }
        }

        // Eğer JSON'da veri yoksa (Fallback)
        return { count: 2, list: "Sınıf yetenekleri" };
    };

    const classSkillInfo = computed(() => {
        const info = getClassSkillRules();
        return info ? `Kural kitabına göre bu yeteneklerden <strong>${info.count}</strong> tane seçin: <strong>${info.list}</strong>.` : null;
    });

    // Toplam Bütçeler
    const skillBudget = computed(() => {
        let budget = 0;
        if (store.class.selected) {
            const cName = store.class.selected.name;
            if (cName === "Düzenbaz") budget += 4;
            else if (["Ozan", "Kolcu"].includes(cName)) budget += 3;
            else budget += 2;
        }
        if (store.background.selected) budget += 2;
        const raceRules = getRaceSkillRules();
        budget += raceRules.fixed.length + raceRules.bonusBudget;
        return budget;
    });

    const expertiseBudget = computed(() => {
        let budget = 0;
        if (!store.class.selected) return 0;
        const cName = store.class.selected.name;
        if (cName === "Düzenbaz") { budget += (store.class.level >= 6 ? 4 : 2); }
        else if (cName === "Ozan") { budget += (store.class.level >= 10 ? 4 : (store.class.level >= 3 ? 2 : 0)); }
        return budget;
    });

    const toggleSkill = (skillId) => {
        const isProf = store.skills.proficiencies.includes(skillId);
        const isExpert = store.skills.expertises.includes(skillId);
        if (!isProf && !isExpert) store.skills.proficiencies.push(skillId);
        else if (isProf) {
            store.skills.proficiencies = store.skills.proficiencies.filter(id => id !== skillId);
            store.skills.expertises.push(skillId);
        } else store.skills.expertises = store.skills.expertises.filter(id => id !== skillId);
    };

    const calculatedSkills = computed(() => {
        // 1. Önce hesapla
        const list = SKILL_DEFINITIONS.map(def => {
            const attrKey = def.attr;
            const attrScore = finalAbilityScores.value[attrKey] || 10;
            const attrMod = Math.floor((attrScore - 10) / 2);
            
            // Proficiency Seviyesi (0: Yok, 1: Var, 2: Expertise)
            // Store'da sadece string ID'ler tutuluyor, bu yüzden kontrol ediyoruz
            let profLevel = 0;
            if (store.skills.expertises.includes(def.id)) profLevel = 2;
            else if (store.skills.proficiencies.includes(def.id)) profLevel = 1;

            // Bonus Hesapla: (ProfLevel * PB) + Stat Mod
            const profBonus = profLevel > 0 ? (proficiencyBonus.value * (profLevel === 2 ? 2 : 1)) : 0;
            const totalBonus = attrMod + profBonus;

            return {
                ...def,
                attrMod,
                profLevel,
                totalBonus,
                attrLabel: def.attr.toUpperCase()
            };
        });

        // 2. SONRA SIRALA
        return list.sort((a, b) => {
            // Kriter 1: Uzmanlık Seviyesi (Önce ★, Sonra ●, En son •)
            if (b.profLevel !== a.profLevel) {
                return b.profLevel - a.profLevel;
            }
            // Kriter 2: İsim (Alfabetik - Türkçe karakter uyumlu)
            return a.name.localeCompare(b.name, 'tr');
        });
    });

    return {
        SKILL_DEFINITIONS,
        raceSkillInfo, classSkillInfo,
        skillBudget, expertiseBudget,
        toggleSkill, calculatedSkills,
        currentProfCount: computed(() => store.skills.proficiencies.length + store.skills.expertises.length), 
        currentExpertCount: computed(() => store.skills.expertises.length)
    };
}