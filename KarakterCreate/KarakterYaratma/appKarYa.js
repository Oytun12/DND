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
                // Dosyaların varlığını kontrol etmek için basit bir try-catch
                const [classRes, raceRes, bgRes] = await Promise.all([
                    fetch('../../Data/classes.json').catch(e => null),
                    fetch('../../Data/races.json').catch(e => null),
                    fetch('../../Data/backgrounds.json').catch(e => null)
                ]);
            
                if (!classRes || !classRes.ok) throw new Error("Sınıf verisi yüklenemedi.");
                const classData = await classRes.json();
                classList.value = classData.class || [];
            
                if (raceRes && raceRes.ok) {
                    const rawRaceData = await raceRes.json();
                    // Bazı veri setlerinde "race" array içinde, bazılarında direkt array olabilir
                    raceList.value = Array.isArray(rawRaceData) ? rawRaceData : (rawRaceData.race || []);
                }
            
                if (bgRes && bgRes.ok) {
                    const bgData = await bgRes.json();
                    backgroundList.value = bgData.background || [];
                }
            
                loading.value = false;
            } catch (err) {
                error.value = "Veri yükleme hatası: " + err.message + ". (Lütfen Live Server kullanın veya JSON yollarını kontrol edin.)";
                console.error(err);
                loading.value = false;
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
            if(entry.type==='table') return "[Tablo Görüntülenemiyor]"; 
            return entry.name||""; 
        };

        // ============================================================
        //  4. IRK MANTIĞI (RACE LOGIC)
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
        //  5. SINIF MANTIĞI (CLASS LOGIC)
        // ============================================================
        const selectedClass = ref(null);
        const selectedSubclass = ref(null);
        const targetLevel = ref(1);
        const userChoices = ref({}); 

        watch(selectedClass, (newVal) => { store.class.selected = newVal; selectedSubclass.value = null; });
        watch(selectedSubclass, (newVal) => { store.class.subclass = newVal; });
        watch(targetLevel, (newVal) => { store.class.level = newVal; });

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
            for (let i = 0; i < targetLevel.value; i++) {
                const feats = [];
                if (!store.abilities.asi[i + 1]) store.abilities.asi[i + 1] = { feat: null, stat1: null, stat2: null };
                selectedClass.value.classFeatures[i]?.forEach(f => {
                    feats.push(processFeature(f, false));
                    if(f.gainSubclassFeature) {
                        if(selectedSubclass.value) selectedSubclass.value.subclassFeatures?.[timeline.filter(t => t.features.some(ft => ft.isSubclass)).length]?.forEach(sf => feats.push(processFeature(sf, true)));
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
        const selectedScoreMethod = ref('point_buy_flex');
        const standardArrayValues = [15, 14, 13, 12, 10, 8];
        const rolledPool = ref([]);
        const hasRolled = ref(false);
        const isCapped20 = ref(false);

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
        //  7. SKILL LOGIC & BUDGETS
        // ============================================================
        const getRaceSkillRules = () => {
            const race = store.race.selected?.name || "";
            const subrace = store.race.subrace?.name || "";
            const fullName = `${race} ${subrace}`.toLowerCase();
            let rules = { fixed: [], bonusBudget: 0, text: null };
            if (fullName.includes("insan") && (fullName.includes("alternatif") || fullName.includes("varyant"))) { rules.bonusBudget = 1; rules.text = "Alternatif İnsan: 1 beceri."; }
            if (fullName.includes("elf") && !fullName.includes("yarı")) { rules.fixed.push("perception"); rules.text = "Keskin Duyular: Algı."; }
            if (fullName.includes("yarı-elf")) { rules.bonusBudget = 2; rules.text = "Beceri Çokluğu: 2 beceri."; }
            if (fullName.includes("orc")) { rules.fixed.push("intimidation"); rules.text = "Korkutucu: Gözdağı."; }
            if (fullName.includes("goliath")) { rules.fixed.push("athletics"); rules.text = "Doğal Atlet: Atletizm."; }
            return rules;
        };

        const raceSkillInfo = computed(() => getRaceSkillRules().text);

        const getClassSkillRules = () => {
            if (!store.class.selected) return null;
            const cName = store.class.selected.name;
            const defs = {
                "Barbar": { count: 2, list: "Hayvan İdaresi, Atletizm, Gözdağı, Doğa, Algı, Hayatta Kalma" },
                "Büyücü": { count: 2, list: "Arkana, Tarih, Sezgi, İnceleme, Tıp, Din" },
                "Düzenbaz": { count: 4, list: "Akrobasi, Atletizm, Kandırma, Sezgi, Gözdağı, İnceleme, Algı, Performans, İkna, El Çabukluğu, Gizlenme" },
                "Ozan": { count: 3, list: "İstediğin herhangi 3 yetenek" }
            };
            return defs[cName] || { count: 2, list: "Sınıf yetenekleri" };
        };

        const classSkillInfo = computed(() => {
            const info = getClassSkillRules();
            return info ? `Kural kitabına göre bu yeteneklerden ${info.count} tane seçin: ${info.list}.` : null;
        });

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
            if (cName === "Düzenbaz") { budget += (targetLevel.value >= 6 ? 4 : 2); }
            else if (cName === "Ozan") { budget += (targetLevel.value >= 10 ? 4 : (targetLevel.value >= 3 ? 2 : 0)); }
            return budget;
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

        // ============================================================
        //  8. MOBIL UI & SEED SYSTEM
        // ============================================================
        const isMobileMenuOpen = ref(false);
        const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
        const isMobileSheetOpen = ref(false);
        const toggleMobileSheet = () => { isMobileSheetOpen.value = !isMobileSheetOpen.value; };
        const featList = ref([ "Alert", "Actor", "Athlete", "Lucky", "Tough", "War Caster" ]);
        const seedText = ref('');

        const characterSeed = computed(() => {
            const exportData = {
                n: store.meta.name, r: store.race.selected?.name, sr: store.race.subrace?.name, ac: store.race.abilityChoices,
                c: store.class.selected?.name, sc: store.class.subclass?.name, l: targetLevel.value,
                b: store.abilities.base, asi: store.abilities.asi, bg: store.background.selected?.name,
                p: store.skills.proficiencies, e: store.skills.expertises, ch: userChoices.value,
                sm: selectedScoreMethod.value, rp: rolledPool.value
            };
            try { return btoa(unescape(encodeURIComponent(JSON.stringify(exportData)))); } catch (e) { return ""; }
        });

        const loadFromSeed = () => {
            try {
                if (!seedText.value) return;
                const data = JSON.parse(decodeURIComponent(escape(atob(seedText.value))));
                store.meta.name = data.n || "";
                targetLevel.value = data.l || 1; 
                if (data.r) {
                    const foundRace = flatRaceList.value.find(x => x.label.includes(data.r));
                    if (foundRace) {
                        selectedFlatOption.value = foundRace;
                        setTimeout(() => { store.race.abilityChoices = { ...data.ac }; }, 50);
                    }
                }
                if (data.c) {
                    const foundClass = classList.value.find(x => x.name === data.c);
                    if (foundClass) {
                        selectedClass.value = foundClass;
                        setTimeout(() => { if (data.sc) selectedSubclass.value = foundClass.subclasses?.find(s => s.name === data.sc); }, 100);
                    }
                }
                selectedScoreMethod.value = data.sm || 'manual';
                if (data.rp) { rolledPool.value = [...data.rp]; hasRolled.value = true; }
                store.abilities.base = { ...data.b };
                store.abilities.asi = { ...data.asi };
                if (data.bg) store.background.selected = backgroundList.value.find(x => x.name === data.bg);
                store.skills.proficiencies = [...(data.p || [])];
                store.skills.expertises = [...(data.e || [])];
                userChoices.value = { ...data.ch };
                alert("Başarıyla yüklendi!");
                seedText.value = ''; 
            } catch (e) { alert("Geçersiz Seed!"); }
        };

        const copySeed = () => {
            navigator.clipboard.writeText(characterSeed.value);
            alert("Seed kopyalandı!");
        };

        // ============================================================
        //  9. RETURNED PROPERTIES
        // ============================================================
        return {
            store, currentStep, steps, nextStep, prevStep, loading, error,
            raceList, flatRaceList, selectedFlatOption, activeRaceTraits, raceBonuses, raceChoiceConfig,
            statLabels, selectableStats, classList, selectedClass, selectedSubclass, targetLevel, activeFeatures, subclassOptions, subclassUnlockLevel,
            getHitDie, userChoices, getChoiceDetail, getAvailableOptions,
            finalAbilityScores, statBonuses, selectedRace, selectedSubrace, featList,
            isMobileSheetOpen, toggleMobileSheet, proficiencyBonus, calculatedSkills, toggleSkill, backgroundList,
            skillBudget, expertiseBudget, raceSkillInfo, currentProfCount: computed(() => store.skills.proficiencies.length + store.skills.expertises.length), 
            currentExpertCount: computed(() => store.skills.expertises.length), currentUsedSkills: computed(() => store.skills.proficiencies.length + store.skills.expertises.length),
            classSkillInfo, scoreMethods, selectedScoreMethod, isOptionDisabled, getFlexCost, pointBuyBudget, currentPbCost, changePointBuy, standardArrayValues, rollStats, rolledPool, hasRolled, isCapped20,
            characterSeed, loadFromSeed, copySeed, seedText, formatEntry, parseTags, extractOptions, processFeature, SKILL_DEFINITIONS ,isMobileMenuOpen, toggleMobileMenu,
        };
    }
});
app.mount('#app');