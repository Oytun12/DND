import { createApp, ref, computed, onMounted } from 'vue';

const app = createApp({
    setup() {
        const loading = ref(true);
        const error = ref(null);
        
        const rawData = ref({});
        const classList = ref([]);
        
        const selectedClass = ref(null);
        const selectedSubclass = ref(null);
        const targetLevel = ref(1);
        
        const userChoices = ref({}); 

        // --- 1. SEÇİM ADETLERİ (Senin JSON İsimlerin) ---
        const manualCounts = {
            "Savaş Üstadı: Manevralar": 3,
            "Ek Manevralar": 2, 
            // JSON'a eklediğin özel bloklar için ayarlar:
            "Savaş Üstadı: Ek Manevralar_1": 2, // 7. Seviye
            "Savaş Üstadı: Ek Manevralar_2": 2, // 10. Seviye
            "Savaş Üstadı: Ek Manevralar_3": 2, // 15. Seviye
            
            "Metabüyü": 2,
            "Büyüde Uzmanlaşmış Şövalye: Büyüler": 2
        };

        // --- 2. VERİ KAYNAĞI HARİTASI ---
        // Eğer metin tabanlı özelliğin içi boşsa, seçenekleri buradan çalar.
        const optionSourceMap = {
            "Ek Manevralar": "Savaş Üstadı: Manevralar",
            "Ek Metabüyü": "Metabüyü"
        };

        onMounted(async () => {
            try {
                const response = await fetch('../../Data/classes.json');
                if (!response.ok) throw new Error(`Dosya bulunamadı!`);

                const data = await response.json();
                rawData.value = data;

                if (data.class && Array.isArray(data.class)) {
                    classList.value = data.class;
                } else {
                    throw new Error("JSON formatı hatalı.");
                }
            } catch (err) {
                console.error(err);
                error.value = `Veri yüklenemedi: ${err.message}`;
            } finally {
                loading.value = false;
            }
        });

        // --- Helpers ---
        const getHitDie = (cls) => {
            if (!cls || !cls.hd) return '?';
            return cls.hd.faces ? cls.hd.faces : cls.hd;
        };

        const formatEntry = (entry) => {
            if (!entry) return "";
            if (typeof entry === 'string') return parseTags(entry);
            if (entry.type === 'options') return ""; 
            if (entry.entries) return entry.entries.map(e => formatEntry(e)).join("<br>");
            if (entry.type === 'list' && entry.items) return "<ul>" + entry.items.map(i => "<li>" + formatEntry(i) + "</li>").join("") + "</ul>";
            return entry.name || "";
        };

        const parseTags = (text) => {
            if (!text) return "";
            return text.replace(/\{@(\w+)\s+([^}]+)\}/g, (match, tag, content) => {
                let displayText = content;
                if (content.includes('(') && content.includes(')')) {
                    const matches = content.match(/\(([^)]+)\)$/);
                    if (matches) displayText = matches[1];
                } else if (content.includes('|')) {
                    const parts = content.split('|');
                    displayText = parts[2] || parts[0]; 
                }

                switch (tag) {
                    case 'spell': case 'item': case 'condition': case 'sense': case 'skill': case 'action': case 'creature':
                        return `<span class="dnd-link" title="${tag}: ${content}">${displayText}</span>`;
                    case 'dice': case 'damage':
                        return `<span class="dnd-dice">${displayText}</span>`;
                    case 'bold':
                        return `<span class="dnd-bold">${content}</span>`;
                    case 'italic':
                        return `<span class="dnd-italic">${content}</span>`;
                    default:
                        return displayText;
                }
            });
        };

        // --- SEÇENEK SİSTEMİ ---
        const extractOptions = (feat) => {
            if (!feat) return null;
            if (feat.type === 'options' && feat.entries) return feat.entries;
            if (feat.entries && Array.isArray(feat.entries)) {
                for (const entry of feat.entries) {
                    if (entry.type === 'options' && entry.entries) return entry.entries;
                }
            }
            return null;
        };

        const findOptionsByName = (targetName) => {
            if (!selectedSubclass.value || !selectedSubclass.value.subclassFeatures) return null;
            for (const levelGroup of selectedSubclass.value.subclassFeatures) {
                for (const feat of levelGroup) {
                    if (feat.name === targetName) return extractOptions(feat);
                }
            }
            return null;
        };

        const normalizeOption = (opt) => {
            if (!opt) return { name: "Hatalı Veri", entries: [] };
            if (opt.name) return opt; 
            if (opt.entries && Array.isArray(opt.entries) && opt.entries.length > 0) {
                const inner = opt.entries[0];
                if (inner.name) return { ...inner, entries: inner.entries || [] };
            }
            return { name: "İsimsiz Seçenek", entries: [] };
        };

        const detectSelectionCount = (name, entries) => {
            if (manualCounts[name]) return manualCounts[name];
            
            const fullText = JSON.stringify(entries).toLowerCase();
            if (fullText.includes("3 manevra") || fullText.includes("seçeceğin 3") || fullText.includes("üç manevra")) return 3;
            if (fullText.includes("2 manevra") || fullText.includes("seçeceğin iki") || fullText.includes("seçeceğin 2") || fullText.includes("iki ek manevra")) return 2;
            
            return 0;
        };

        // --- COMPUTED ---
        const subclassUnlockLevel = computed(() => {
            if (!selectedClass.value || !selectedClass.value.classFeatures) return -1;
            try {
                for (let i = 0; i < selectedClass.value.classFeatures.length; i++) {
                    const levelGroup = selectedClass.value.classFeatures[i];
                    if (levelGroup && levelGroup.some(f => f.gainSubclassFeature === true)) {
                        return i + 1;
                    }
                }
            } catch (e) { console.warn("UnlockLevel hatası", e); }
            return -1;
        });

        const subclassOptions = computed(() => {
            if (!selectedClass.value || !selectedClass.value.subclasses) return [];
            return selectedClass.value.subclasses;
        });

        const activeFeatures = computed(() => {
            if (!selectedClass.value || !selectedClass.value.classFeatures) return [];

            const timeline = [];
            const mainFeaturesArray = selectedClass.value.classFeatures;
            const subFeaturesArray = selectedSubclass.value ? selectedSubclass.value.subclassFeatures : [];

            let subclassFeatureIndex = 0;

            try {
                for (let i = 0; i < targetLevel.value; i++) {
                    const currentLevel = i + 1;
                    const featuresAtThisLevel = [];

                    if (mainFeaturesArray[i]) {
                        mainFeaturesArray[i].forEach(feat => {
                            featuresAtThisLevel.push(processFeature(feat, false));

                            if (feat.gainSubclassFeature) {
                                if (selectedSubclass.value && subFeaturesArray[subclassFeatureIndex]) {
                                    subFeaturesArray[subclassFeatureIndex].forEach(subFeat => {
                                        featuresAtThisLevel.push(processFeature(subFeat, true));
                                    });
                                }
                                subclassFeatureIndex++;
                            }
                        });
                    }

                    if (featuresAtThisLevel.length > 0 || currentLevel === subclassUnlockLevel.value) {
                        timeline.push({
                            level: currentLevel,
                            features: featuresAtThisLevel
                        });
                    }
                }
            } catch (e) { console.error("Timeline Hatası", e); return timeline; }

            return timeline;
        });

        const processFeature = (feat, isSubclass) => {
            try {
                let entriesData = [];
                if (feat.entries) {
                    entriesData = feat.entries
                        .map(e => formatEntry(e))       
                        .filter(txt => txt && txt.trim() !== ""); 
                } else {
                    entriesData = ["Detay yok."];
                }

                let rawOptions = extractOptions(feat);

                if (!rawOptions || rawOptions.length === 0) {
                    const sourceName = optionSourceMap[feat.name];
                    if (sourceName) rawOptions = findOptionsByName(sourceName);
                }

                let cleanedOptions = [];
                if (rawOptions) cleanedOptions = rawOptions.map(opt => normalizeOption(opt));

                let count = detectSelectionCount(feat.name, feat.entries);
                if (cleanedOptions.length > 0 && count === 0) count = 1;

                return {
                    name: feat.name,
                    entries: entriesData,
                    isSubclass: isSubclass,
                    hasOptions: !!(cleanedOptions.length > 0), 
                    options: cleanedOptions,
                    selectionCount: count, 
                };
            } catch (e) {
                console.error("Özellik işlenirken hata:", feat.name, e);
                return { name: feat.name + " (Hata)", entries: [], isSubclass: false, hasOptions: false };
            }
        };

        // --- DÜZELTME BURADA: Seviyeyi de anahtara ekledik ---
        const getChoiceDetail = (featName, level, index) => {
            // Anahtar artık İsim + Seviye + İndex
            // Örn: Ek Manevralar-7_0
            const key = `${featName}-${level}_${index}`;
            const choice = userChoices.value[key];
            if (!choice) return null;
            return formatEntry(choice);
        };

        // --- AKILLI FİLTRELEME: Seçilenleri Gizle ---
        // Bu fonksiyon, bir seçim kutusu için "Müsait Seçenekleri" hesaplar.
        const getAvailableOptions = (allOptions, currentKey) => {
            if (!allOptions) return [];

            // 1. Diğer kutularda seçilmiş olan tüm isimleri topla
            const selectedNames = new Set();
            
            for (const [key, value] of Object.entries(userChoices.value)) {
                // Dikkat: Kendi kutumuzdaki seçimi filtreye eklememeliyiz!
                // Yoksa seçtiğimiz an seçenek kaybolur ve boş görünür.
                if (key !== currentKey && value && value.name) {
                    selectedNames.add(value.name);
                }
            }

            // 2. Ana listeyi filtrele: Sadece seçilmemiş olanları bırak
            return allOptions.filter(opt => !selectedNames.has(opt.name));
        };

        return {
            loading, error, classList, selectedClass, 
            selectedSubclass, subclassOptions, targetLevel, 
            getHitDie, activeFeatures, subclassUnlockLevel,
            userChoices, getChoiceDetail, getAvailableOptions // <--- Bunu ekledik
        };
    }
});

app.mount('#app');