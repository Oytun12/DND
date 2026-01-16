import { createApp, ref, reactive, computed, onMounted, watch } from 'vue';

const app = createApp({
    setup() {
        // ============================================================
        //  1. GLOBAL STATE (STORE)
        // ============================================================
        const store = reactive({
            meta: { name: "", xp: 0 },
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
            choices: {} 
        });

        // ============================================================
        //  2. NAVIGATION
        // ============================================================
        const currentStep = ref(0);
        const steps = [{ title: "Konsept" }, { title: "Irk" }, { title: "Sınıf" }, { title: "Puanlar" }, { title: "Geçmiş" }];
        const nextStep = () => { if (currentStep.value < steps.length - 1) currentStep.value++; };
        const prevStep = () => { if (currentStep.value > 0) currentStep.value--; };

        // ============================================================
        //  3. VERİ YÖNETİMİ
        // ============================================================
        const loading = ref(true);
        const error = ref(null);
        const classList = ref([]);
        const raceList = ref([]); 
        
        const featList = ref([
            "Alert (Tetikte)", "Actor (Aktör)", "Athlete (Atlet)", "Charger (Hücumcu)", 
            "Crossbow Expert (Arbalet Uzmanı)", "Defensive Duelist (Savunmacı Düellocu)",
            "Dual Wielder (Çift Silahşör)", "Dungeon Delver (Zindan Kaşifi)", 
            "Durable (Dayanıklı)", "Great Weapon Master (Büyük Silah Ustası)",
            "Healer (Şifacı)", "Keen Mind (Keskin Zeka)", "Lucky (Şanslı)",
            "Mage Slayer (Büyücü Katili)", "Mobile (Mobil)", "Observant (Gözlemci)",
            "Polearm Master (Sırıklı Silah Ustası)", "Resilient (Dirençli)",
            "Sentinel (Nöbetçi)", "Sharpshooter (Keskin Nişancı)", 
            "Shield Master (Kalkan Ustası)", "Skulker (Gizlenen)", 
            "Tough (Sert)", "War Caster (Savaş Büyücüsü)"
        ]);

        onMounted(async () => {
            try {
                const [classRes, raceRes] = await Promise.all([
                    fetch('../../Data/classes.json'),
                    fetch('../../Data/races.json')
                ]);
                const classData = await classRes.json();
                const raceData = await raceRes.json();
                classList.value = classData.class;
                raceList.value = raceData.race;
                loading.value = false;
            } catch (err) {
                error.value = "Veri yüklenemedi: " + err.message;
            }
        });

        // ============================================================
        //  4. IRK MANTIĞI
        // ============================================================
        const selectedFlatOption = ref(null);
        const selectedRace = ref(null);
        const selectedSubrace = ref(null);

        const flatRaceList = computed(() => {
            const list = [];
            if (!raceList.value) return [];
            raceList.value.forEach(r => {
                if (r.subraces && r.subraces.length > 0) {
                    r.subraces.forEach(sub => list.push({ label: `${r.name} (${sub.name})`, race: r, subrace: sub }));
                } else {
                    list.push({ label: r.name, race: r, subrace: null });
                }
            });
            return list;
        });

        watch(selectedFlatOption, (newVal) => {
            if (newVal) {
                store.race.selected = newVal.race;
                store.race.subrace = newVal.subrace;
                selectedRace.value = newVal.race;
                selectedSubrace.value = newVal.subrace;
                store.race.abilityChoices = {}; 
            } else {
                store.race.selected = null;
                store.race.subrace = null;
                selectedRace.value = null;
                selectedSubrace.value = null;
                store.race.abilityChoices = {};
            }
        });

        const raceChoiceConfig = computed(() => {
            if (!selectedRace.value) return null;
            const source = selectedSubrace.value?.ability ? selectedSubrace.value : selectedRace.value;
            if (source && source.ability && source.ability.choose) {
                const chooseData = source.ability.choose[0] || source.ability.choose; 
                return {
                    count: chooseData.count || 1, amount: chooseData.amount || 1,
                    from: chooseData.from || ['str', 'dex', 'con', 'int', 'wis', 'cha']
                };
            }
            return null;
        });

        const abilityKeyMap = { 'kuv': 'str', 'str': 'str', 'çev': 'dex', 'dex': 'dex', 'day': 'con', 'con': 'con', 'zek': 'int', 'int': 'int', 'akı': 'wis', 'wis': 'wis', 'kar': 'cha', 'cha': 'cha' };
        
        const statLabels = { 'str': 'KUV', 'kuv': 'KUV', 'dex': 'ÇEV', 'çev': 'ÇEV', 'con': 'DAY', 'day': 'DAY', 'int': 'ZEK', 'zek': 'ZEK', 'wis': 'AKI', 'akı': 'AKI', 'aki': 'AKI', 'cha': 'KAR', 'kar': 'KAR' };

        const selectableStats = { 'str': 'KUV', 'dex': 'ÇEV', 'con': 'DAY', 'int': 'ZEK', 'wis': 'AKI', 'cha': 'KAR' };

        const raceBonuses = computed(() => {
            const bonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
            if (!selectedRace.value) return bonuses;
            const getKey = (k) => abilityKeyMap[k.toLowerCase()] || k.toLowerCase();
            const addBonus = (abilityObj) => {
                if (!abilityObj) return;
                for (const [key, val] of Object.entries(abilityObj)) {
                    if (key === 'choose') continue; 
                    const mappedKey = getKey(key);
                    if (bonuses[mappedKey] !== undefined) bonuses[mappedKey] += val;
                }
            };
            if (selectedRace.value.ability) addBonus(selectedRace.value.ability);
            if (selectedSubrace.value && selectedSubrace.value.ability) addBonus(selectedSubrace.value.ability);
            const choiceConfig = raceChoiceConfig.value;
            if (choiceConfig) {
                Object.values(store.race.abilityChoices).forEach(statKey => {
                    if (statKey) {
                        const mappedKey = getKey(statKey);
                        if (bonuses[mappedKey] !== undefined) bonuses[mappedKey] += choiceConfig.amount;
                    }
                });
            }
            return bonuses;
        });

        const activeRaceTraits = computed(() => {
            if (!selectedRace.value) return [];
            let traits = [];
            if (selectedRace.value.entries) traits = selectedRace.value.entries.map(t => ({...t}));
            if (selectedSubrace.value && selectedSubrace.value.entries) {
                selectedSubrace.value.entries.forEach(subTrait => {
                    if (subTrait.data && subTrait.data.overwrite) traits = traits.filter(t => t.name !== subTrait.data.overwrite);
                    traits.push(subTrait);
                });
            }
            const formattedTraits = traits.map(trait => {
                if (typeof trait === 'string') return { name: "Özellik", text: parseTags(trait) };
                let processedText = "";
                if (trait.entries) processedText = trait.entries.map(e => formatEntry(e)).join("<br><br>");
                return { name: trait.name, text: processedText };
            });
            const bonusText = Object.entries(raceBonuses.value).filter(([_, val]) => val !== 0).map(([key, val]) => `<strong style="color:#4caf50">${key.toUpperCase()} +${val}</strong>`).join(', ');
            let headerText = bonusText ? `<p>Irkınızdan gelen doğal yetenekleriniz: ${bonusText}</p>` : `<p style="color:#e67e22">Lütfen yukarıdan yetenek puanı artışlarını seçiniz.</p>`;
            formattedTraits.unshift({ name: "Yetenek Puanı Artışı", text: headerText });
            return formattedTraits;
        });

        // ============================================================
        //  5. SINIF MANTIĞI
        // ============================================================
        const selectedClass = ref(null);
        const selectedSubclass = ref(null);
        const targetLevel = ref(1);
        const userChoices = ref({}); 

        watch(selectedClass, (newVal) => { store.class.selected = newVal; selectedSubclass.value = null; });
        watch(selectedSubclass, (newVal) => { store.class.subclass = newVal; });
        watch(targetLevel, (newVal) => { store.class.level = newVal; });

        const manualCounts = { "Savaş Üstadı: Manevralar": 3, "Ek Manevralar": 2, "Savaş Üstadı: Ek Manevralar_1": 2, "Savaş Üstadı: Ek Manevralar_2": 2, "Savaş Üstadı: Ek Manevralar_3": 2, "Metabüyü": 2, "Büyüde Uzmanlaşmış Şövalye: Büyüler": 2 };
        const optionSourceMap = { "Ek Manevralar": "Savaş Üstadı: Manevralar", "Ek Metabüyü": "Metabüyü" };

        const getHitDie = (cls) => cls?.hd?.faces || '?';
        // --- ETİKETLERİ LİNKE ÇEVİRME ---
        const parseTags = (text) => {
            if (!text) return "";

            // Regex: {@tag content} formatını yakalar
            // Örn: {@spell Eldritch Blast (Eldritch Patlaması)|phb}
            return text.replace(/\{@(\w+)\s+([^}]+)\}/g, (match, tag, content) => {
                
                // İçerik bazen "İsim|Kaynak" şeklinde gelir. Parçalayalım.
                let [name, source] = content.split('|');
                
                // Görüntülenecek metin (Name)
                let displayText = name;

                // 1. EĞER BU BİR BÜYÜ İSE ({@spell ...})
                if (tag === 'spell') {
                    // URL için ismi temizle:
                    // 1. Küçük harfe çevir
                    // 2. Boşlukları %20 yap
                    // 3. Türkçe karakterleri de encodeURI halleder ama garanti olsun diye basit encode
                    let urlName = encodeURIComponent(name.toLowerCase());
                    
                    // Kaynak varsa (phb, xge vb.) ekle, yoksa phb varsayalım
                    let urlSource = source ? `_${source.toLowerCase()}` : '_phb';
                    
                    // 5eTürkçe URL yapısı: spells.html#isim_kaynak
                    // Örn: https://kanguen.github.io/spells.html#eldritch%20blast%20(eldritch%20patlamas%c4%b1)_phb
                    const targetUrl = `https://kanguen.github.io/spells.html#${urlName}${urlSource}`;

                    return `<a href="${targetUrl}" target="_blank" class="dnd-link spell-link" title="Büyü detayını gör">✨ ${displayText}</a>`;
                }

                // 2. DİĞER ETİKETLER (item, creature vb.) - Şimdilik sadece text kalsın
                // İstersen bunları da bestiary.html veya items.html'e yönlendirebiliriz.
                return `<span class="dnd-link">${displayText}</span>`;
            });
        };
        const formatEntry = (entry) => { if(!entry) return ""; if(typeof entry==='string') return parseTags(entry); if(entry.type==='options') return ""; if(entry.entries) return entry.entries.map(e=>formatEntry(e)).join("<br>"); if(entry.type==='list'&&entry.items) return "<ul>"+entry.items.map(i=>"<li>"+formatEntry(i)+"</li>").join("")+"</ul>"; return entry.name||""; };
        const extractOptions = (feat) => { if(!feat) return null; if(feat.type==='options'&&feat.entries) return feat.entries; if(feat.entries&&Array.isArray(feat.entries)) { for(const e of feat.entries) if(e.type==='options'&&e.entries) return e.entries; } return null; };
        const findOptionsByName = (targetName) => { if(!selectedSubclass.value?.subclassFeatures) return null; for(const grp of selectedSubclass.value.subclassFeatures) for(const f of grp) if(f.name===targetName) return extractOptions(f); return null; };
        const normalizeOption = (opt) => opt ? (opt.name ? opt : (opt.entries?.[0]?.name ? {...opt.entries[0], entries: opt.entries[0].entries||[]} : {name: "Seçenek", entries:[]})) : {name:"Hata", entries:[]};
        const detectSelectionCount = (name, entries) => { if(manualCounts[name]) return manualCounts[name]; const txt = JSON.stringify(entries).toLowerCase(); return txt.includes("3") ? 3 : txt.includes("2") || txt.includes("iki") ? 2 : 0; };
        const subclassUnlockLevel = computed(() => selectedClass.value?.classFeatures?.findIndex(grp => grp.some(f => f.gainSubclassFeature)) + 1 || -1);
        const subclassOptions = computed(() => selectedClass.value?.subclasses || []);
        const getAvailableOptions = (all, key) => { if(!all) return []; const used = new Set(Object.entries(userChoices.value).filter(([k,v]) => k!==key && v?.name).map(([_,v]) => v.name)); return all.filter(o => !used.has(o.name)); };
        const getChoiceDetail = (n, l, i) => formatEntry(userChoices.value[`${n}-${l}_${i}`]);
        const processFeature = (feat, isSub) => {
            try {
                let opts = extractOptions(feat);
                if(!opts && optionSourceMap[feat.name]) opts = findOptionsByName(optionSourceMap[feat.name]);
                let cleanOpts = opts ? opts.map(normalizeOption) : [];
                let count = detectSelectionCount(feat.name, feat.entries);
                if(cleanOpts.length > 0 && count === 0) count = 1;
                return { name: feat.name, entries: feat.entries ? feat.entries.map(formatEntry).filter(t=>t) : ["Detay yok"], isSubclass: isSub, hasOptions: !!cleanOpts.length, options: cleanOpts, selectionCount: count };
            } catch(e) { return {name: feat.name, entries:[], isSubclass:false}; }
        };
        const activeFeatures = computed(() => {
            if (!selectedClass.value) return [];
            const timeline = [];
            let subIdx = 0;
            for (let i = 0; i < targetLevel.value; i++) {
                const feats = [];
                if (!store.abilities.asi[i + 1]) {
                    store.abilities.asi[i + 1] = { feat: null, stat1: null, stat2: null };
                }
                selectedClass.value.classFeatures[i]?.forEach(f => {
                    feats.push(processFeature(f, false));
                    if(f.gainSubclassFeature) {
                        if(selectedSubclass.value) selectedSubclass.value.subclassFeatures[subIdx]?.forEach(sf => feats.push(processFeature(sf, true)));
                        subIdx++;
                    }
                });
                if(feats.length || i+1 === subclassUnlockLevel.value) timeline.push({level: i+1, features: feats});
            }
            return timeline;
        });

        // ----------------------------------------------------------------
        //  6. BONUS VE SKILL HESAPLAMALARI
        // ----------------------------------------------------------------
        
        // A. Tüm Bonuslar (Irk + ASI)
        const statBonuses = computed(() => {
            const totals = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
            for (const [key, val] of Object.entries(raceBonuses.value)) {
                if (totals[key] !== undefined) totals[key] += val;
            }
            Object.values(store.abilities.asi).forEach(asi => {
                if (asi.stat1) totals[asi.stat1] += 1;
                if (asi.stat2) totals[asi.stat2] += 1;
            });
            return totals;
        });

        // B. Final Ability Scores
        const finalAbilityScores = computed(() => {
            const finals = {};
            ['str','dex','con','int','wis','cha'].forEach(k => {
                finals[k] = (store.abilities.base[k] || 10) + (statBonuses.value[k] || 0);
            });
            return finals;
        });

        // C. Proficiency Bonus
        const proficiencyBonus = computed(() => {
            const lvl = store.class.level || 1;
            return Math.ceil(lvl / 4) + 1;
        });

        // D. Skill Listesi
        const SKILL_DEFINITIONS = [
            { id: 'acrobatics', name: 'Akrobasi', attr: 'dex' },
            { id: 'animal_handling', name: 'Hayvan Terbiyesi', attr: 'wis' },
            { id: 'arcana', name: 'Arkana (Büyü İlmi)', attr: 'int' },
            { id: 'athletics', name: 'Atletizm', attr: 'str' },
            { id: 'deception', name: 'Kandırma', attr: 'cha' },
            { id: 'history', name: 'Tarih', attr: 'int' },
            { id: 'insight', name: 'Sezgi', attr: 'wis' },
            { id: 'intimidation', name: 'Gözdağı', attr: 'cha' },
            { id: 'investigation', name: 'Araştırma', attr: 'int' },
            { id: 'medicine', name: 'Tıp', attr: 'wis' },
            { id: 'nature', name: 'Doğa', attr: 'int' },
            { id: 'perception', name: 'Algı', attr: 'wis' },
            { id: 'performance', name: 'Performans', attr: 'cha' },
            { id: 'persuasion', name: 'İkna', attr: 'cha' },
            { id: 'religion', name: 'Din', attr: 'int' },
            { id: 'sleight_of_hand', name: 'El Çabukluğu', attr: 'dex' },
            { id: 'stealth', name: 'Gizlilik', attr: 'dex' },
            { id: 'survival', name: 'Hayatta Kalma', attr: 'wis' }
        ];

        const calculatedSkills = computed(() => {
            const stats = finalAbilityScores.value;
            const pb = proficiencyBonus.value;
            return SKILL_DEFINITIONS.map(skill => {
                const score = stats[skill.attr] || 10;
                const mod = Math.floor((score - 10) / 2);
                const profLevel = 0; // Şimdilik 0, ileride store'dan çekeceğiz
                const total = mod + (pb * profLevel);
                return {
                    ...skill,
                    totalBonus: total,
                    profLevel: profLevel,
                    attrLabel: statLabels[skill.attr].substring(0, 3) 
                };
            });
        });

        // --- MOBİL KARAKTER KAĞIDI YÖNETİMİ ---
        const isMobileSheetOpen = ref(false);
        const toggleMobileSheet = () => {
            isMobileSheetOpen.value = !isMobileSheetOpen.value;
        };

        return {
            store, currentStep, steps, nextStep, prevStep, loading, error,
            raceList, flatRaceList, selectedFlatOption, activeRaceTraits, raceBonuses, raceChoiceConfig, 
            statLabels, selectableStats,
            classList, selectedClass, selectedSubclass, targetLevel, activeFeatures, subclassOptions, subclassUnlockLevel,
            getHitDie, userChoices, getChoiceDetail, getAvailableOptions, 
            finalAbilityScores, statBonuses,
            selectedRace, selectedSubrace, featList,
            isMobileSheetOpen, toggleMobileSheet,
            proficiencyBonus, calculatedSkills // <--- Bunlar artık return ediliyor!
        };
    }
});
app.mount('#app');