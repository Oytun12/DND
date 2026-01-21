import { computed } from 'vue';
import { store } from './store.js';

export function useSkillLogic(finalAbilityScores, proficiencyBonus) {

    const SKILL_DEFINITIONS = [
        { id: 'acrobatics', name: 'Akrobasi', attr: 'dex' }, { id: 'animal_handling', name: 'Hayvan Terbiyesi', attr: 'wis' },
        { id: 'arcana', name: 'Arkana', attr: 'int' }, { id: 'athletics', name: 'Atletizm', attr: 'str' },
        { id: 'deception', name: 'Kandırma', attr: 'cha' }, { id: 'history', name: 'Tarih', attr: 'int' },
        { id: 'insight', name: 'Sezgi', attr: 'wis' }, { id: 'intimidation', name: 'Gözdağı', attr: 'cha' },
        { id: 'investigation', name: 'Araştırma', attr: 'int' }, { id: 'medicine', name: 'Tıp', attr: 'wis' },
        { id: 'nature', name: 'Doğa', attr: 'int' }, { id: 'perception', name: 'Algı', attr: 'wis' },
        { id: 'performance', name: 'Performans', attr: 'cha' }, { id: 'persuasion', name: 'İkna', attr: 'cha' },
        { id: 'religion', name: 'Din', attr: 'int' }, { id: 'sleight_of_hand', name: 'El Çabukluğu', attr: 'dex' },
        { id: 'stealth', name: 'Gizlilik', attr: 'dex' }, { id: 'survival', name: 'Hayatta Kalma', attr: 'wis' }
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

    // Nihai Yetenek Hesaplaması
    const calculatedSkills = computed(() => {
        const stats = finalAbilityScores.value;
        const pb = proficiencyBonus.value;
        const labels = { 'str': 'KUV', 'dex': 'ÇEV', 'con': 'DAY', 'int': 'ZEK', 'wis': 'AKI', 'cha': 'KAR' };
        
        return SKILL_DEFINITIONS.map(skill => {
            const score = stats[skill.attr] || 10;
            const mod = Math.floor((score - 10) / 2);
            let level = 0;
            if (store.skills.proficiencies.includes(skill.id)) level = 1;
            if (store.skills.expertises.includes(skill.id)) level = 2;
            return { ...skill, totalBonus: mod + (pb * level), profLevel: level, attrLabel: labels[skill.attr].substring(0, 3) };
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