import { ref, computed, watch } from 'vue';
import { store } from './store.js';
import { formatEntry } from './utils.js';

export function useClassLogic() {
    
    const classList = ref([]);
    const selectedClass = ref(null);
    const selectedSubclass = ref(null);
    const targetLevel = ref(1);
    const userChoices = ref({}); 

    // Store ile Senkronizasyon
    watch(selectedClass, (newVal) => { store.class.selected = newVal; selectedSubclass.value = null; });
    watch(selectedSubclass, (newVal) => { store.class.subclass = newVal; });
    watch(targetLevel, (newVal) => { store.class.level = newVal; });

    const getHitDie = (cls) => cls?.hd?.faces || '?';

    // --- FEATURE SEÇİM MANTIĞI ---
    
    // JSON'daki karmaşık seçenek yapısını çözümler
    const extractOptions = (feat) => { 
        if (!feat) return null; 
        if (feat.type === 'options' && feat.entries) return feat.entries; 
        if (feat.entries && Array.isArray(feat.entries)) { 
            for (const e of feat.entries) {
                if (e.type === 'options' && e.entries) return e.entries;
                if (e.entries && Array.isArray(e.entries)) {
                    for (const sub of e.entries) {
                        if (sub.type === 'options' && sub.entries) return sub.entries;
                    }
                }
            } 
        } 
        return null; 
    };

    // Bazı özelliklerin seçenekleri başka yerdedir, onları eşleştirir
    const optionSourceMap = { 
        "Dövüş Üstünlüğü": "Savaş Üstadı: Manevralar",
        "Ek Manevralar": "Savaş Üstadı: Manevralar", 
        "Arcane Atış": "Arcane Atış Seçenekleri",
        "Fazladan Arcane Atış Seçeneği": "Arcane Atış Seçenekleri",
        "Ek Metabüyü": "Metabüyü"
    };

    const findOptionsByName = (targetName) => { 
        if(!selectedSubclass.value?.subclassFeatures) return null; 
        for(const grp of selectedSubclass.value.subclassFeatures) 
            for(const f of grp) if(f.name===targetName) return extractOptions(f); 
        return null; 
    };

    const normalizeOption = (opt) => opt ? (opt.name ? opt : (opt.entries?.[0]?.name ? {...opt.entries[0], entries: opt.entries[0].entries||[]} : {name: "Seçenek", entries:[]})) : {name:"Hata", entries:[]};

    const detectSelectionCount = (feature) => {
        if (feature.selectionCount) return feature.selectionCount;
        if (feature.entries) {
            for (const entry of feature.entries) {
                if (entry.selectionCount) return entry.selectionCount;
                if (entry.type === 'options' && entry.selectionCount) return entry.selectionCount;
            }
        }
        return 0;
    };

    // Özelliği işleyip ekrana hazır hale getirir
    const processFeature = (feat, isSub) => {
        try {
            let opts = extractOptions(feat);
            if(!opts && optionSourceMap[feat.name]) opts = findOptionsByName(optionSourceMap[feat.name]);
            let cleanOpts = opts ? opts.map(normalizeOption) : [];
            let count = detectSelectionCount(feat);
            if(cleanOpts.length > 0 && count === 0) count = 1;
            return { 
                name: feat.name, 
                entries: feat.entries ? feat.entries.map(formatEntry).filter(t=>t) : ["Detay yok"], 
                isSubclass: isSub, 
                hasOptions: !!cleanOpts.length, 
                options: cleanOpts, 
                selectionCount: count 
            };
        } catch(e) { return {name: feat.name, entries:[], isSubclass:false}; }
    };

    const subclassUnlockLevel = computed(() => selectedClass.value?.classFeatures?.findIndex(grp => grp.some(f => f.gainSubclassFeature)) + 1 || -1);
    const subclassOptions = computed(() => selectedClass.value?.subclasses || []);
    
    // --- TIMELINE OLUŞTURUCU (Aktif Özellikler) ---
    const activeFeatures = computed(() => {
        if (!selectedClass.value) return [];
        const timeline = [];
        const optionCache = {}; 
    
        for (let i = 0; i < targetLevel.value; i++) {
            const feats = [];
            // ASI (Stat/Feat) objesi yoksa oluştur
            if (!store.abilities.asi[i + 1]) store.abilities.asi[i + 1] = { feat: null, stat1: null, stat2: null };

            selectedClass.value.classFeatures[i]?.forEach(f => {
                let processed = processFeature(f, false);
                
                // Seçenekleri hafızaya al veya hafızadan tamamla (Savaşçı Manevraları vb. için)
                if (processed.hasOptions) {
                    optionCache[processed.name] = processed.options;
                }
                else if (optionCache[processed.name] && !processed.hasOptions) {
                    processed.hasOptions = true;
                    processed.options = optionCache[processed.name];
                    if (processed.selectionCount === 0) processed.selectionCount = 1;
                }
            
                feats.push(processed);
            
                // Alt sınıf özellikleri (Subclass Features)
                if(f.gainSubclassFeature) {
                    if(selectedSubclass.value) {
                        // Subclass özellikleri genelde class feature indexine paralel gider ama bazen kayabilir
                        // Basit bir yaklaşımla timeline'daki subclass feature sayısını sayıyoruz
                        const subFeatIndex = timeline.filter(t => t.features.some(ft => ft.isSubclass)).length;
                        selectedSubclass.value.subclassFeatures?.[subFeatIndex]?.forEach(sf => feats.push(processFeature(sf, true)));
                    }
                }
            });

            if(feats.length || i+1 === subclassUnlockLevel.value) timeline.push({level: i+1, features: feats});
        }
        return timeline;
    });

    const getAvailableOptions = (all, key) => { 
        if(!all) return []; 
        // Daha önce seçilmişleri filtrele
        const used = new Set(Object.entries(userChoices.value).filter(([k,v]) => k!==key && v?.name).map(([_,v]) => v.name)); 
        return all.filter(o => !used.has(o.name)); 
    };
    
    const getChoiceDetail = (n, l, i) => formatEntry(userChoices.value[`${n}-${l}_${i}`]);

    return {
        classList,
        selectedClass,
        selectedSubclass,
        targetLevel,
        userChoices,
        subclassOptions,
        subclassUnlockLevel,
        activeFeatures,
        getHitDie,
        getAvailableOptions,
        getChoiceDetail
    };
}