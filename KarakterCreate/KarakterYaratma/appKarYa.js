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
            skills: { 
                proficiencies: [], // Uzmanlık (Proficiency)
                expertises: []     // Ustalık (Expertise)
            },
            choices: {} 
        });

        // ============================================================
        //  2. NAVIGATION & DATA LOADING
        // ============================================================
        const currentStep = ref(0);
        const steps = [{ title: "Konsept" }, { title: "Irk" }, { title: "Sınıf" }, { title: "Puanlar" }, { title: "Geçmiş" }];
        
        const nextStep = () => { if (currentStep.value < steps.length - 1) currentStep.value++; };
        const prevStep = () => { if (currentStep.value > 0) currentStep.value--; };

        const loading = ref(true);
        const error = ref(null);
        const classList = ref([]);
        const raceList = ref([]);
        const backgroundList = ref([]);
        
        // Verileri Yükle
        onMounted(async () => {
            try {
                const [classRes, raceRes, bgRes] = await Promise.all([
                    fetch('../../Data/classes.json'),
                    fetch('../../Data/races.json'),
                    fetch('../../Data/backgrounds.json')
                ]);
                const classData = await classRes.json();
                
                // Kullanıcının JSON yapısına göre race verisini al
                // (Bazen {race: [...]} bazen direkt [...] olabilir, kontrol ediyoruz)
                const rawRaceData = await raceRes.json();
                raceList.value = Array.isArray(rawRaceData) ? rawRaceData : (rawRaceData.race || []);

                const bgData = await bgRes.json();
                classList.value = classData.class || [];
                backgroundList.value = bgData.background || [];
                
                loading.value = false;
            } catch (err) {
                error.value = "Veri yüklenemedi: " + err.message;
                console.error(err);
            }
        });

        // ============================================================
        //  3. HELPER FUNCTIONS (Parsing & Formatting)
        // ============================================================
        const parseTags = (text) => {
            if (!text) return "";
            return text.replace(/\{@(\w+)\s+([^}]+)\}/g, (match, tag, content) => {
                let [name, source] = content.split('|');
                let displayText = name;
                if (tag === 'spell') {
                    let urlName = encodeURIComponent(name.toLowerCase());
                    let urlSource = source ? `_${source.toLowerCase()}` : '_phb';
                    const targetUrl = `https://kanguen.github.io/spells.html#${urlName}${urlSource}`;
                    return `<a href="${targetUrl}" target="_blank" class="dnd-link spell-link" title="Büyü detayını gör">✨ ${displayText}</a>`;
                }
                return `<span class="dnd-link">${displayText}</span>`;
            });
        };

        const formatEntry = (entry) => { 
            if(!entry) return ""; 
            if(typeof entry==='string') return parseTags(entry); 
            if(entry.type==='options') return ""; 
            if(entry.entries) return entry.entries.map(e=>formatEntry(e)).join("<br>"); 
            if(entry.type==='list'&&entry.items) return "<ul>"+entry.items.map(i=>"<li>"+formatEntry(i)+"</li>").join("")+"</ul>"; 
            if(entry.type==='table') return "[Tablo Görüntülenemiyor]"; // Basit tablo placeholder
            return entry.name||""; 
        };

        // ============================================================
        //  4. IRK MANTIĞI (RACE LOGIC)
        // ============================================================
        const selectedFlatOption = ref(null);
        const selectedRace = ref(null);
        const selectedSubrace = ref(null);

        // Irk listesini düzleştir (Subrace'leri ana listeye al)
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

        // Irk Stat Seçimi Konfigürasyonu
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

        // Irk Bonuslarını Hesapla
        const abilityKeyMap = { 'kuv': 'str', 'str': 'str', 'çev': 'dex', 'dex': 'dex', 'day': 'con', 'con': 'con', 'zek': 'int', 'int': 'int', 'akı': 'wis', 'wis': 'wis', 'kar': 'cha', 'cha': 'cha' };
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

        // Ekrana basılacak özellik metinleri
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
        //  5. SINIF MANTIĞI (CLASS LOGIC)
        // ============================================================
        const selectedClass = ref(null);
        const selectedSubclass = ref(null);
        const targetLevel = ref(1);
        const userChoices = ref({}); 

        watch(selectedClass, (newVal) => { store.class.selected = newVal; selectedSubclass.value = null; });
        watch(selectedSubclass, (newVal) => { store.class.subclass = newVal; });
        watch(targetLevel, (newVal) => { store.class.level = newVal; });

        // Sınıf Özelliklerini (Feature) Ayrıştırma ve Gösterme
        const getHitDie = (cls) => cls?.hd?.faces || '?';
        const extractOptions = (feat) => { if(!feat) return null; if(feat.type==='options'&&feat.entries) return feat.entries; if(feat.entries&&Array.isArray(feat.entries)) { for(const e of feat.entries) if(e.type==='options'&&e.entries) return e.entries; } return null; };
        const optionSourceMap = { "Ek Manevralar": "Savaş Üstadı: Manevralar", "Ek Metabüyü": "Metabüyü" };
        const manualCounts = { "Savaş Üstadı: Manevralar": 3, "Ek Manevralar": 2, "Savaş Üstadı: Ek Manevralar_1": 2, "Metabüyü": 2, "Büyüde Uzmanlaşmış Şövalye: Büyüler": 2 };
        
        const findOptionsByName = (targetName) => { if(!selectedSubclass.value?.subclassFeatures) return null; for(const grp of selectedSubclass.value.subclassFeatures) for(const f of grp) if(f.name===targetName) return extractOptions(f); return null; };
        const normalizeOption = (opt) => opt ? (opt.name ? opt : (opt.entries?.[0]?.name ? {...opt.entries[0], entries: opt.entries[0].entries||[]} : {name: "Seçenek", entries:[]})) : {name:"Hata", entries:[]};
        const detectSelectionCount = (name, entries) => { if(manualCounts[name]) return manualCounts[name]; const txt = JSON.stringify(entries).toLowerCase(); return txt.includes("3") ? 3 : txt.includes("2") || txt.includes("iki") ? 2 : 0; };
        
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

        const subclassUnlockLevel = computed(() => selectedClass.value?.classFeatures?.findIndex(grp => grp.some(f => f.gainSubclassFeature)) + 1 || -1);
        const subclassOptions = computed(() => selectedClass.value?.subclasses || []);
        
        const activeFeatures = computed(() => {
            if (!selectedClass.value) return [];
            const timeline = [];
            let subIdx = 0;
            for (let i = 0; i < targetLevel.value; i++) {
                const feats = [];
                if (!store.abilities.asi[i + 1]) store.abilities.asi[i + 1] = { feat: null, stat1: null, stat2: null };
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

        const getAvailableOptions = (all, key) => { if(!all) return []; const used = new Set(Object.entries(userChoices.value).filter(([k,v]) => k!==key && v?.name).map(([_,v]) => v.name)); return all.filter(o => !used.has(o.name)); };
        const getChoiceDetail = (n, l, i) => formatEntry(userChoices.value[`${n}-${l}_${i}`]);

        // ============================================================
        //  6. PUANLAR VE STATLAR (SCORES & STATS)
        // ============================================================
        const statLabels = { 'str': 'KUV', 'dex': 'ÇEV', 'con': 'DAY', 'int': 'ZEK', 'wis': 'AKI', 'cha': 'KAR' };
        const selectableStats = { 'str': 'KUV', 'dex': 'ÇEV', 'con': 'DAY', 'int': 'ZEK', 'wis': 'AKI', 'cha': 'KAR' };

        const scoreMethods = [
            { id: 'manual', name: 'Manuel Giriş' },
            { id: 'standard_array', name: 'Standart Dizilim (15,14...)' },
            { id: 'point_buy', name: 'Point Buy (Standart)' },
            { id: 'point_buy_flex', name: 'Point Buy (Esnek)' },
            { id: 'roll_4d6', name: 'Zar At (4d6)' },
            { id: 'roll_5d6', name: 'Zar At (5d6)' }
        ];
        const selectedScoreMethod = ref('point_buy');
        const standardArrayValues = [15, 14, 13, 12, 10, 8];
        const rolledPool = ref([]);
        const hasRolled = ref(false);
        const isCapped20 = ref(false);

        // Point Buy Maliyet
        const getFlexCost = (score) => {
            if (score <= 8) return 0;
            if (score === 9) return 1; if (score === 10) return 2; if (score === 11) return 3;
            if (score === 12) return 4; if (score === 13) return 5; if (score === 14) return 7;
            if (score === 15) return 9; if (score === 16) return 12; if (score === 17) return 15;
            if (score === 18) return 19; if (score === 19) return 23; if (score >= 20) return 28;
            return 0;
        };
        const pointBuyBudget = computed(() => 27);
        const currentPbCost = computed(() => {
            let total = 0;
            Object.values(store.abilities.base).forEach(val => total += getFlexCost(val));
            return total;
        });
        
        const changePointBuy = (stat, delta) => {
            let next = store.abilities.base[stat] + delta;
            if (selectedScoreMethod.value === 'point_buy') { if (next < 8) next = 8; if (next > 15) next = 15; }
            else { if (next < 8) next = 8; if (next > 20) next = 20; }
            store.abilities.base[stat] = next;
        };

        const rollStats = () => {
            const diceCount = selectedScoreMethod.value === 'roll_5d6' ? 5 : 4;
            const results = [];
            for (let i = 0; i < 6; i++) {
                let rolls = [];
                for (let d = 0; d < diceCount; d++) rolls.push(Math.ceil(Math.random() * 6));
                rolls.sort((a, b) => a - b); rolls.shift(); 
                let sum = rolls.reduce((a, b) => a + b, 0);
                if (selectedScoreMethod.value === 'roll_5d6' && isCapped20.value && sum > 20) sum = 20;
                results.push(sum);
            }
            results.sort((a, b) => b - a);
            rolledPool.value = results; hasRolled.value = true;
            Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 0);
        };

        const isOptionDisabled = (val, currentKey, pool) => {
            const totalInPool = pool.filter(n => n === val).length;
            let usedByOthers = 0;
            Object.entries(store.abilities.base).forEach(([k, v]) => { if (k !== currentKey && v === val) usedByOthers++; });
            return usedByOthers >= totalInPool;
        };

        watch(selectedScoreMethod, (newMethod) => {
            if (newMethod.includes('point_buy')) Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 8);
            else if (newMethod === 'manual') Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 10);
            else Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 0);
            if (!newMethod.includes('roll')) { hasRolled.value = false; rolledPool.value = []; }
        });

        // Final Stat Hesapları
        const statBonuses = computed(() => {
            const totals = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
            for (const [key, val] of Object.entries(raceBonuses.value)) if (totals[key] !== undefined) totals[key] += val;
            Object.values(store.abilities.asi).forEach(asi => {
                if (asi.stat1) totals[asi.stat1] += 1;
                if (asi.stat2) totals[asi.stat2] += 1;
            });
            return totals;
        });

        const finalAbilityScores = computed(() => {
            const finals = {};
            ['str','dex','con','int','wis','cha'].forEach(k => {
                finals[k] = (store.abilities.base[k] || 10) + (statBonuses.value[k] || 0);
            });
            return finals;
        });

        const proficiencyBonus = computed(() => Math.ceil(targetLevel.value / 4) + 1);

        // ============================================================
        //  7. SKILL LOGIC & BUDGETS (THE CORE)
        // ============================================================
        
        // IRK YETENEK KURALLARI (Senin Data Setinle Uyumlu)
        const getRaceSkillRules = () => {
            const race = store.race.selected?.name || "";
            const subrace = store.race.subrace?.name || "";
            const fullName = `${race} ${subrace}`.toLowerCase();
            let rules = { fixed: [], bonusBudget: 0, text: null };

            // 1. İNSAN (ALTERNATİF / VARIANT)
            // JSON'da: name="İnsan", subrace="Alternatif" -> fullName = "insan alternatif"
            if (fullName.includes("insan") && (fullName.includes("alternatif") || fullName.includes("varyant") || fullName.includes("variant"))) {
                rules.bonusBudget = 1;
                rules.text = "Alternatif İnsan: Seçeceğin 1 beceride uzmanlık.";
            }

            // 2. ELF (Genel - Keskin Duyular)
            if (fullName.includes("elf")) {
                // Yarı-Elf (Half-Elf) ile karışmaması için kontrol
                if (!fullName.includes("yarı") && !fullName.includes("half")) {
                    rules.fixed.push("perception");
                    rules.text = "Keskin Duyular: Algı (Perception) yeteneği.";
                }
            }

            // 3. YARI-ELF (HALF-ELF) - Beceri Çokluğu
            if (fullName.includes("yarı-elf") || fullName.includes("yarı elf") || fullName.includes("half-elf")) {
                rules.bonusBudget = 2;
                rules.text = "Beceri Çokluğu: Seçeceğin 2 beceride uzmanlık.";
            }

            // 4. YARI-ORC (HALF-ORC) - Korkutucu
            if (fullName.includes("yarı-orc") || fullName.includes("yarı orc") || fullName.includes("half-orc")) {
                rules.fixed.push("intimidation");
                rules.text = "Korkutucu: Gözdağı (Intimidation) yeteneği.";
            }

            // 5. GOLIATH - Doğal Atlet (JSON'da var)
            if (fullName.includes("goliath")) {
                rules.fixed.push("athletics");
                rules.text = "Doğal Atlet: Atletizm (Athletics) yeteneği.";
            }

            // 6. DİĞERLERİ (JSON'da yok ama manuel eklenmişler)
            if (fullName.includes("bugbear")) { rules.fixed.push("stealth"); rules.text = "Sinsi: Gizlilik (Stealth)."; }
            if (fullName.includes("changeling")) { rules.fixed.push("deception"); rules.bonusBudget = 1; rules.text = "Şekil Değiştiren: Kandırma + 1 Seçmeli."; }
            if (fullName.includes("hobgoblin")) { rules.bonusBudget = 2; rules.text = "Askeri Eğitim: +2 Seçmeli Yetenek."; }
            if (fullName.includes("kenku")) { rules.bonusBudget = 2; rules.text = "Kenku Eğitimi: +2 Seçmeli Yetenek."; }
            if (fullName.includes("tabaxi")) { rules.fixed.push("perception"); rules.fixed.push("stealth"); rules.text = "Kedi Yetenekleri: Algı ve Gizlilik."; }
            if (fullName.includes("lizardfolk")) { rules.fixed.push("perception"); rules.fixed.push("survival"); rules.text = "Avcı Güdüsü: Algı ve Hayatta Kalma."; }
            if (fullName.includes("leonin")) { rules.fixed.push("intimidation"); rules.text = "Kükreme: Gözdağı (Intimidation)."; }

            return rules;
        };

        const raceSkillInfo = computed(() => getRaceSkillRules().text);


        // ============================================================
        //  SINIF YETENEK BİLGİSİ (CLASS SKILL INFO)
        // ============================================================
        const getClassSkillRules = () => {
            if (!store.class.selected) return null;
            const cName = store.class.selected.name;
        
            // Kullanıcının verdiği listeye göre tanımlar
            // (Hem Türkçe hem İngilizce isimleri destekler)
            const defs = {
                "Barbar": { count: 2, list: "Hayvan İdaresi, Atletizm, Gözdağı, Doğa, Algı, Hayatta Kalma" },
                "Barbarian": { count: 2, list: "Hayvan İdaresi, Atletizm, Gözdağı, Doğa, Algı, Hayatta Kalma" },

                "Büyücü": { count: 2, list: "Arkana, Tarih, Sezgi, İnceleme, Tıp, Din" },
                "Wizard": { count: 2, list: "Arkana, Tarih, Sezgi, İnceleme, Tıp, Din" },

                "Druid": { count: 2, list: "Arkana, Hayvan İdaresi, Sezgi, Tıp, Doğa, Algı, Din, Hayatta Kalma" },

                "Düzenbaz": { count: 4, list: "Akrobasi, Atletizm, Aldatma (Kandırma), Sezgi, Gözdağı, İnceleme, Algı, Performans, İkna, El Çabukluğu, Gizlenme" },
                "Rogue": { count: 4, list: "Akrobasi, Atletizm, Aldatma (Kandırma), Sezgi, Gözdağı, İnceleme, Algı, Performans, İkna, El Çabukluğu, Gizlenme" },

                "Keşiş": { count: 2, list: "Akrobasi, Atletizm, Tarih, Sezgi, Din, Gizlenme" },
                "Monk": { count: 2, list: "Akrobasi, Atletizm, Tarih, Sezgi, Din, Gizlenme" },

                "Kolcu": { count: 3, list: "Hayvan İdaresi, Atletizm, Sezgi, İnceleme, Doğa, Algı, Gizlenme, Hayatta Kalma" },
                "Ranger": { count: 3, list: "Hayvan İdaresi, Atletizm, Sezgi, İnceleme, Doğa, Algı, Gizlenme, Hayatta Kalma" },

                "Ozan": { count: 3, list: "İstediğin herhangi 3 yetenek" },
                "Bard": { count: 3, list: "İstediğin herhangi 3 yetenek" },

                "Paladin": { count: 2, list: "Atletizm, Sezgi, Gözdağı, Tıp, İkna, Din" },

                "Rahip": { count: 2, list: "Tarih, Sezgi, Tıp, İkna, Din" },
                "Cleric": { count: 2, list: "Tarih, Sezgi, Tıp, İkna, Din" },

                "Savaşçı": { count: 2, list: "Akrobasi, Hayvan İdaresi, Atletizm, Tarih, Sezgi, Gözdağı, Algı, Hayatta Kalma" },
                "Fighter": { count: 2, list: "Akrobasi, Hayvan İdaresi, Atletizm, Tarih, Sezgi, Gözdağı, Algı, Hayatta Kalma" },

                "Sorserer": { count: 2, list: "Arkana, Aldatma (Kandırma), Sezgi, Gözdağı, İkna, Din" },
                "Sorcerer": { count: 2, list: "Arkana, Aldatma (Kandırma), Sezgi, Gözdağı, İkna, Din" },
                "Sihirbaz": { count: 2, list: "Arkana, Aldatma (Kandırma), Sezgi, Gözdağı, İkna, Din" },

                "Warlock": { count: 2, list: "Arkana, Aldatma (Kandırma), Tarih, Gözdağı, İnceleme, Doğa, Din" },
                "Cadı": { count: 2, list: "Arkana, Aldatma (Kandırma), Tarih, Gözdağı, İnceleme, Doğa, Din" }
            };
        
            return defs[cName] || { count: "?", list: "Bilinmeyen Sınıf" };
        };

        const classSkillInfo = computed(() => {
            const info = getClassSkillRules();
            if (!info) return null;
            return `Kural kitabına göre bu yeteneklerden <strong>${info.count}</strong> tanesini seçebilirsiniz: ${info.list}.`;
        });

        // UZMANLIK (PROFICIENCY) BÜTÇESİ
        const skillBudget = computed(() => {
            let budget = 0;
            // 1. Sınıf
            if (store.class.selected) {
                const cName = store.class.selected.name;
                if (cName === "Düzenbaz" || cName === "Rogue") budget += 4;
                else if (["Ozan", "Bard", "Kolcu", "Ranger"].includes(cName)) budget += 3;
                else budget += 2;
            }
            // 2. Geçmiş
            if (store.background.selected) budget += 2;
            
            // 3. Irk (Sabitler + Seçmeliler)
            const raceRules = getRaceSkillRules();
            budget += raceRules.fixed.length;
            budget += raceRules.bonusBudget;
            
            return budget;
        });

        // USTALIK (EXPERTISE) BÜTÇESİ
        const expertiseBudget = computed(() => {
            let budget = 0;
            if (!store.class.selected) return 0;
            const cName = store.class.selected.name;
            const lvl = store.class.level;
            
            if (cName === "Düzenbaz" || cName === "Rogue") {
                if (lvl >= 1) budget += 2;
                if (lvl >= 6) budget += 2;
            } else if (cName === "Ozan" || cName === "Bard") {
                if (lvl >= 3) budget += 2;
                if (lvl >= 10) budget += 2;
            }
            return budget;
        });

        // WATCHER: Irk Seçilince Zorunlu Skillleri Ekle
        watch(() => store.race.selected, () => {
            const rules = getRaceSkillRules();
            if (rules.fixed.length > 0) {
                rules.fixed.forEach(skillId => {
                    if (!store.skills.proficiencies.includes(skillId)) {
                        store.skills.proficiencies.push(skillId);
                    }
                });
            }
        }, { deep: true });

        // WATCHER: Bütçe Azalırsa Fazlalıkları Sil
        watch([skillBudget, expertiseBudget], ([newSkillLimit, newExpertiseLimit]) => {
            if (store.skills.proficiencies.length > newSkillLimit) store.skills.proficiencies.splice(newSkillLimit);
            if (store.skills.expertises.length > newExpertiseLimit) store.skills.expertises.splice(newExpertiseLimit);
        });

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
            const stats = finalAbilityScores.value;
            const pb = proficiencyBonus.value;
            return SKILL_DEFINITIONS.map(skill => {
                const score = stats[skill.attr] || 10;
                const mod = Math.floor((score - 10) / 2);
                let level = 0;
                if (store.skills.proficiencies.includes(skill.id)) level = 1;
                if (store.skills.expertises.includes(skill.id)) level = 2;
                return { ...skill, totalBonus: mod + (pb * level), profLevel: level, attrLabel: statLabels[skill.attr].substring(0, 3) };
            });
        });

        const currentProfCount = computed(() => store.skills.proficiencies.length + store.skills.expertises.length);
        const currentExpertCount = computed(() => store.skills.expertises.length);
        const currentUsedSkills = computed(() => store.skills.proficiencies.length + store.skills.expertises.length);

        // ============================================================
        //  CHARACTER SEED SYSTEM (Tohum Sistemi)
        // ============================================================

        // 1. SEED OLUŞTURUCU (Karakter seçimlerini şifreli koda çevirir)
        const characterSeed = computed(() => {
            // Sadece gerekli "kimlik" bilgilerini alıyoruz (Dosyaların tamamını değil)
            const exportData = {
                n: store.meta.name,
                r: store.race.selected?.name,
                sr: store.race.subrace?.name,
                c: store.class.selected?.name,
                sc: store.class.subclass?.name,
                l: store.class.level,
                b: store.abilities.base,
                asi: store.abilities.asi,
                bg: store.background.selected?.name,
                p: store.skills.proficiencies,
                e: store.skills.expertises,
                ch: userChoices.value
            };

            try {
                // Veriyi stringe çevir ve Base64 ile şifrele
                const jsonStr = JSON.stringify(exportData);
                // Türkçe karakter desteği için URI encode/decode hilesi
                return btoa(unescape(encodeURIComponent(jsonStr)));
            } catch (e) {
                return "Seed Oluşturulamadı";
            }
        });

        // 2. SEED'DEN YÜKLEME (Dışarıdan gelen kodu karaktere çevirir)
        const loadFromSeed = (seed) => {
            try {
                const decoded = decodeURIComponent(escape(atob(seed)));
                const data = JSON.parse(decoded);

                // Meta & Seviye
                store.meta.name = data.n;
                store.class.level = data.l;

                // Statlar
                store.abilities.base = data.b;
                store.abilities.asi = data.asi;

                // Skilller
                store.skills.proficiencies = data.p;
                store.skills.expertises = data.e;
                userChoices.value = data.ch;

                // Nesneleri bulup eşleştirme (JSON listelerinden isimle eşliyoruz)
                if (data.r) {
                    const found = flatRaceList.value.find(x => x.label.includes(data.r));
                    if (found) selectedFlatOption.value = found;
                }

                if (data.c) {
                    store.class.selected = classList.value.find(x => x.name === data.c);
                }

                if (data.bg) {
                    store.background.selected = backgroundList.value.find(x => x.name === data.bg);
                }

                alert("Karakter başarıyla yüklendi!");
            } catch (e) {
                alert("Geçersiz Seed kodu!");
                console.error(e);
            }
        };

        const copySeed = () => {
            navigator.clipboard.writeText(characterSeed.value);
            alert("Seed panoya kopyalandı! Arkadaşlarına gönderebilirsin.");
        };

        // ============================================================
        //  8. MOBIL UI & EXTRAS
        // ============================================================
        const isMobileSheetOpen = ref(false);
        const toggleMobileSheet = () => { isMobileSheetOpen.value = !isMobileSheetOpen.value; };
        const featList = ref([ "Alert", "Actor", "Athlete", "Charger", "Crossbow Expert", "Defensive Duelist", "Dual Wielder", "Dungeon Delver", "Durable", "Great Weapon Master", "Healer", "Keen Mind", "Lucky", "Mage Slayer", "Mobile", "Observant", "Polearm Master", "Resilient", "Sentinel", "Sharpshooter", "Shield Master", "Skulker", "Tough", "War Caster" ]);

        return {
            store, currentStep, steps, nextStep, prevStep, loading, error,
            raceList, flatRaceList, selectedFlatOption, activeRaceTraits, raceBonuses, raceChoiceConfig,
            statLabels, selectableStats, classList, selectedClass, selectedSubclass, targetLevel, activeFeatures, subclassOptions, subclassUnlockLevel,
            getHitDie, userChoices, getChoiceDetail, getAvailableOptions,
            finalAbilityScores, statBonuses, selectedRace, selectedSubrace, featList,
            isMobileSheetOpen, toggleMobileSheet, proficiencyBonus, calculatedSkills, toggleSkill, backgroundList,
            
            // Skill Budgets & Info
            skillBudget, expertiseBudget, raceSkillInfo, 
            currentUsedSkills, currentProfCount, currentExpertCount,
            classSkillInfo,

            // Score Engine
            scoreMethods, selectedScoreMethod, isOptionDisabled, getFlexCost, pointBuyBudget, currentPbCost, changePointBuy, standardArrayValues, rollStats, rolledPool, hasRolled, isCapped20,
            characterSeed, loadFromSeed, copySeed
        };
    }
});
app.mount('#app');