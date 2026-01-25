import { reactive } from 'vue';

// ============================================================
//  GLOBAL STATE (STORE)
//  Tüm uygulamanın verisi burada tutulur.
// ============================================================
export const store = reactive({

    meta: {
        name: "",
        playerName: "",
        xp: 0,
        avatar: "../../img/avatars/default-avatar.png"
    },
    race: { 
        selected: null, 
        subrace: null, 
        features: [],
        abilityChoices: {} 
    },
    class: { selected: null, subclass: null, level: 1 },
    abilities: { 
        method: "point-buy",
        base: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        asi: {} 
    },
    background: { selected: null },
    skills: { 
        proficiencies: [], // Uzmanlık (Proficiency)
        expertises: []     // Ustalık (Expertise)
    },
    resources: {},
    inventory: {
        weapons: [],    // Sadece ID'ler tutulacak: ['dagger', 'longbow']
        armor: 'none',  // Tek bir ID: 'leather'
        shield: false,  // Boolean: true/false
        items: {},      // { 'pot_heal': 3 } şeklinde
        gold: 0         // Para (Ucunu açık bıraktık)
    },
    hp: {
        current: null, // null ise Maksimuma eşit sayacağız
        temp: 0
    },
    choices: {} 
});

// ============================================================
//  DATA CLEANER
//  JSON çıktısı alırken boş/gereksiz verileri temizler.
// ============================================================
export const cleanObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
        const cleanedArray = obj.map(cleanObject).filter(item => 
            item !== null && item !== undefined && item !== "" && 
            (typeof item !== 'object' || Object.keys(item).length > 0)
        );
        return cleanedArray.length > 0 ? cleanedArray : undefined;
    }       

    const cleanedObj = {};
    Object.keys(obj).forEach(key => {
        const value = cleanObject(obj[key]);
        if (value !== null && value !== undefined && value !== "" && 
           (typeof value !== 'object' || Object.keys(value).length > 0)) {
            cleanedObj[key] = value;
        }
    });
    return Object.keys(cleanedObj).length > 0 ? cleanedObj : undefined;
};