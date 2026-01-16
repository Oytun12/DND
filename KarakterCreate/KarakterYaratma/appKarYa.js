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
            skills: {
            proficiencies: [], // Uzmanlık (Proficiency) alanların ID'leri buraya dolacak
            expertises: []    // Ustalık (Expertise) alanların ID'leri buraya dolacak
            },
            background: { selected: null }, // Seçilen geçmiş burada tutulacak
            skills: { proficiencies: [], expertises: [] }, // Seçilen yetenekler burada tutulacak
            choices: {} 
        });

        // ============================================================
        //  2. NAVIGATION
        // ============================================================
        const currentStep = ref(0);

        const backgroundList = ref([]); // JSON'dan gelecek geçmişler listesi

        // --- 2. VERİ YÜKLEME (ONMOUNTED VEYA DOĞRUDAN) ---
        const loadBackgrounds = async () => {
            try {
                const response = await fetch('../../Data/backgrounds.json');
                const data = await response.json();
                backgroundList.value = data.background; // JSON yapısındaki "background" dizisini alıyoruz
            } catch (err) {
                console.error("Geçmiş verileri yüklenemedi:", err);
            }
        };
        loadBackgrounds();

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

        // --- DİNAMİK BEYİN: BÜTÇELER VE ANALİZ ---

        // 1. Toplam Uzmanlık (Proficiency) Bütçesi
        const skillBudget = computed(() => {
            let total = 0;
            // SINIF: Seçiliyse puan gelir (Düzenbaz 4, Ozan 3, Diğerleri 2)
            if (store.class.selected) {
                const name = store.class.selected.name;
                if (name === "Düzenbaz") total += 4;
                else if (name === "Ozan") total += 3;
                else total += 2;
            }
            // GEÇMİŞ: Her geçmiş standart 2 puan verir (Seçiliyse)
            if (store.background.selected) total += 2;

            // IRK: Varyant İnsan ise +1
            if (store.race.selected?.name.includes("Varyant")) total += 1;

            return total;
        });

        // 2. Toplam Ustalık (Expertise) Bütçesi
        const expertiseBudget = computed(() => {
            if (!store.class.selected) return 0;
            const name = store.class.selected.name;
            // Sadece belirli sınıflar Expertise (Ustalık) hakkı kazanır
            if (name === "Düzenbaz") return 2; // Lv1'de 2 tane
            if (name === "Ozan") return 2;    // Lv3'te 2 tane
            return 0; 
        });

        // 3. Mevcut Harcama Sayaçları (Kullanılanlar)
        const currentProfCount = computed(() => store.skills.proficiencies.length);
        const currentExpertCount = computed(() => store.skills.expertises.length);
        

        // Uzmanlık ve Ustalık için harcanan toplam puan (Esneklik için hepsini sayıyoruz)
        const currentUsedSkills = computed(() => {
            return store.skills.proficiencies.length + store.skills.expertises.length;
        });
        // --- ETKİLEŞİM: KUTUYA TIKLAYINCA NE OLSUN? ---




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



        // --- MOBİL KARAKTER KAĞIDI YÖNETİMİ ---
        const isMobileSheetOpen = ref(false);
        const toggleMobileSheet = () => {
            isMobileSheetOpen.value = !isMobileSheetOpen.value;
        };

        // ============================================================
        //  7. SCORE ENGINE (PUANLAMA SİSTEMİ)
        // ============================================================
        
        // Yöntemler
        const scoreMethods = [
            { id: 'manual', name: 'Manuel Giriş (Özgür)' },
            { id: 'standard_array', name: 'Standart Dizilim (15,14,13...)' },
            { id: 'point_buy', name: 'Point Buy (Standart)' },
            { id: 'point_buy_flex', name: 'Point Buy (Esnek)' },
            { id: 'roll_4d6', name: 'Zar At (4d6 - Düşüğü At)' },
            { id: 'roll_5d6', name: 'Buflı Zar (5d6 - Düşüğü At)' }
        ];

        // Seçili Yöntem (Varsayılan: Point Buy)
        const selectedScoreMethod = ref('point_buy');

        // --- ORTAK FİLTRELEME MANTIĞI (Kullanılanları Pasif Yap) ---

        // Bir değerin BAŞKA bir stat tarafından kullanılıp kullanılmadığını kontrol eder.
        // Eğer havuzda o değerden birden fazla varsa (örn: iki tane 14 attı), 
        // kaç tanesinin kullanıldığını sayar ve ona göre izin verir.
        const isOptionDisabled = (val, currentKey, pool) => {
            // 1. Havuzda bu değerden toplam kaç tane var?
            const totalInPool = pool.filter(n => n === val).length;
            
            // 2. Diğer statlar bu değerden kaç tane kullanmış?
            let usedByOthers = 0;
            Object.entries(store.abilities.base).forEach(([k, v]) => {
                // Şu an işlem yaptığımız stat (currentKey) hariç diğerlerine bak
                if (k !== currentKey && v === val) {
                    usedByOthers++;
                }
            });

            // 3. Eğer kullanılan sayı, havuzdakine eşit veya fazlaysa bu seçenek pasif olsun.
            return usedByOthers >= totalInPool;
        };

        // --- POINT BUY MANTIĞI ---

        // 1. Maliyet Hesaplama Fonksiyonu (Standart ve Esnek İçin Ortak)
        const getFlexCost = (score) => {
            if (score <= 8) return 0;
            if (score === 9) return 1;
            if (score === 10) return 2;
            if (score === 11) return 3;
            if (score === 12) return 4;
            if (score === 13) return 5;
            if (score === 14) return 7;
            if (score === 15) return 9;
            // Buradan sonrası Esnek Mod için artan maliyetler
            if (score === 16) return 12;
            if (score === 17) return 15;
            if (score === 18) return 19;
            if (score === 19) return 23;
            if (score >= 20) return 28;
            return 0;
        };

        // 2. Bütçe (Her zaman 27 referans alınır)
        const pointBuyBudget = computed(() => 27);

        // 3. Toplam Maliyeti Canlı Hesapla
        const currentPbCost = computed(() => {
            let total = 0;
            // Mevcut statları dön ve maliyetlerini topla
            Object.values(store.abilities.base).forEach(val => {
                total += getFlexCost(val);
            });
            return total;
        });

        // 4. Puan Değiştirme Butonlarının İşlevi
        const changePointBuy = (stat, delta) => {
            const current = store.abilities.base[stat];
            let next = current + delta;
            
            // Limit Kontrolleri
            if (selectedScoreMethod.value === 'point_buy') {
                // Standart Mod: En az 8, En çok 15
                if (next < 8) next = 8;
                if (next > 15) next = 15;
            } else {
                // Esnek Mod: En az 8, En çok 20
                if (next < 8) next = 8;
                if (next > 20) next = 20; 
            }
            
            // Yeni değeri kaydet
            store.abilities.base[stat] = next;
        };

        // --- STANDART DİZİLİM MANTIĞI ---
        const standardArrayValues = [15, 14, 13, 12, 10, 8];

        // --- ZAR ATMA MANTIĞI ---
        const rolledPool = ref([]);
        const hasRolled = ref(false);
        const isCapped20 = ref(false); // Limit kontrolü için değişken

        const rollStats = () => {
            const diceCount = selectedScoreMethod.value === 'roll_5d6' ? 5 : 4;
            const results = [];
            
            for (let i = 0; i < 6; i++) {
                // n tane zar at
                let rolls = [];
                for (let d = 0; d < diceCount; d++) {
                    rolls.push(Math.ceil(Math.random() * 6));
                }
                // Küçükten büyüğe sırala
                rolls.sort((a, b) => a - b);
                
                // En düşüğü at (ilk eleman)
                rolls.shift(); 
                
                // Kalanları topla
                let sum = rolls.reduce((a, b) => a + b, 0);

                // YENİ: Eğer 5d6 ise ve Limit seçiliyse 20'ye sabitle
                if (selectedScoreMethod.value === 'roll_5d6' && isCapped20.value) {
                    if (sum > 20) sum = 20;
                }

                results.push(sum);
            }
            // Büyükten küçüğe sırala
            results.sort((a, b) => b - a);
            rolledPool.value = results;
            hasRolled.value = true;
            
            // Sıfırla
            Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 0);
        };

        // Yöntem değişince verileri temizle ve varsayılanları ayarla
        watch(selectedScoreMethod, (newMethod) => {
            if (newMethod.includes('point_buy')) {
                Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 8);
            } else if (newMethod === 'manual') {
                Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 10);
            } else if (newMethod === 'standard_array') {
                 Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 0); // Seçmesi için 0 yap
            } else {
                // Zar modları
                Object.keys(store.abilities.base).forEach(k => store.abilities.base[k] = 0);
                hasRolled.value = false;
                rolledPool.value = [];
            }
        });
        
        // ============================================================
        //  8. Karakter Geçmişi MANTIĞI
        // ============================================================

        // --- YETENEK SEÇİM MANTIĞI ---

        // --- ETKİLEŞİM: KUTUYA TIKLAYINCA NE OLSUN? ---

        const toggleSkill = (skillId) => {
            const isProf = store.skills.proficiencies.includes(skillId);
            const isExpert = store.skills.expertises.includes(skillId);
        
            if (!isProf && !isExpert) {
                // Durum: Boş -> Uzmanlık (Proficiency) yap
                store.skills.proficiencies.push(skillId);
            } 
            else if (isProf) {
                // Durum: Uzman -> Ustalık (Expertise) yap
                // Uzmanlıktan sil, Ustalığa ekle
                store.skills.proficiencies = store.skills.proficiencies.filter(id => id !== skillId);
                store.skills.expertises.push(skillId);
            } 
            else {
                // Durum: Ustalık -> Boş yap
                store.skills.expertises = store.skills.expertises.filter(id => id !== skillId);
            }
        };
        // 2. Canlı Hesaplama (Sağ panel ve seçim ekranı için)
        const calculatedSkills = computed(() => {
            const stats = finalAbilityScores.value;
            const pb = proficiencyBonus.value;
        
            return SKILL_DEFINITIONS.map(skill => {
                const score = stats[skill.attr] || 10;
                const mod = Math.floor((score - 10) / 2);
                
                let level = 0; // Bonus çarpanı
                if (store.skills.proficiencies.includes(skill.id)) level = 1;
                if (store.skills.expertises.includes(skill.id)) level = 2;
            
                return {
                    ...skill,
                    totalBonus: mod + (pb * level),
                    profLevel: level,
                    attrLabel: statLabels[skill.attr].substring(0, 3)
                };
            });
        });

        

        // ============================================================
        //  9. RETURNED PROPERTIES
        // ============================================================

        return {
            store, currentStep, steps, nextStep, prevStep, loading, error,
            raceList, flatRaceList, selectedFlatOption, activeRaceTraits, raceBonuses, raceChoiceConfig, 
            statLabels, selectableStats,
            classList, selectedClass, selectedSubclass, targetLevel, activeFeatures, subclassOptions, subclassUnlockLevel,
            getHitDie, userChoices, getChoiceDetail, getAvailableOptions, 
            finalAbilityScores, statBonuses,
            selectedRace, selectedSubrace, featList,
            isMobileSheetOpen, toggleMobileSheet,
            proficiencyBonus, calculatedSkills, 
            toggleSkill,backgroundList,
            skillBudget,
            currentUsedSkills, currentProfCount, currentExpertCount,
            expertiseBudget,
            skillBudget: computed(() => 4), 
            expertiseBudget: computed(() => store.class.selected?.name === "Düzenbaz" ? 2 : 0),
            // Score Engine Returnleri
            scoreMethods, selectedScoreMethod, 
            isOptionDisabled, // Dropdown disable mantığı
            getFlexCost, pointBuyBudget, currentPbCost, changePointBuy, // Point Buy
            standardArrayValues, // Standart Array
            rollStats, rolledPool, hasRolled, isCapped20, 
        };
    }
});
app.mount('#app');