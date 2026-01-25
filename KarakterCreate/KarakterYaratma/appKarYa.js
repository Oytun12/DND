import { createApp, ref, computed, onMounted, onUnmounted, watch } from 'vue';

// --- MODÜLLER ---
import { store, cleanObject } from './src/store.js';
import { parseTags, formatEntry } from './src/utils.js';
import { dndIcons } from './src/icons.js';
import { useCharacterSheet } from './src/logicSheet.js'; 
import { useRaceLogic } from './src/logicRace.js';
import { useClassLogic } from './src/logicClass.js';
import { useScoreLogic } from './src/logicScores.js';
import { useSkillLogic } from './src/logicSkills.js';
import { avatarList } from './src/data/avatarList.js';
import { useDiceLogic } from './src/logicDice.js';
import { useInventoryLogic } from './src/logicInventory.js';
import { useSpellLogic } from './src/logicSpells.js'; // En tepeye import olarak ekle


const app = createApp({
    setup() {
        
        // ============================================================
        // 1. GENEL SAYFA MANTIĞI
        // ============================================================
        const { 
            isSheetMode, 
            activeSheetTab, 
            finishCreation, 
            hasCreatedSheet, 
            activeFeatureSubTab 
        } = useCharacterSheet();

        // Envanter Alt Sekmesi için Değişken (YENİ)
        const activeInventoryTab = ref('owned'); // 'owned' veya 'all'
        
        // ============================================================
        // 2. IRK MANTIĞI
        // ============================================================
        const { 
            raceList, 
            flatRaceList, 
            selectedFlatOption, 
            raceBonuses, 
            activeRaceTraits, 
            raceChoiceConfig 
        } = useRaceLogic();

        // Seçili ırkı dinleyen computed (Envanter mantığı için gerekli)
        const selectedRace = computed(() => store.race.selected);

        // ============================================================
        // 3. SINIF MANTIĞI
        // ============================================================
        const { 
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
            getChoiceDetail,
            classResources, 
        } = useClassLogic();

        // ============================================================
        // 4. PUANLAR (SCORE LOGIC)
        // ============================================================
        const {
            statLabels, 
            selectableStats, 
            scoreMethods, 
            selectedScoreMethod, 
            standardArrayValues,
            rolledPool, 
            hasRolled, 
            isCapped20, 
            isRolling,
            pointBuyBudget, 
            currentPbCost,
            getFlexCost, 
            changePointBuy, 
            rollStats, 
            isOptionDisabled,
            statBonuses, 
            finalAbilityScores, 
            proficiencyBonus,
            scoreAllocations, 
            draggedItem, 
            assignScore, 
            unassignScore, 
            syncAllocationsFromStore,
            handleOrbClick 
        } = useScoreLogic(raceBonuses);

        // ============================================================
        // 5. YETENEKLER
        // ============================================================
        const {
            SKILL_DEFINITIONS,
            raceSkillInfo, 
            classSkillInfo,
            skillBudget, 
            expertiseBudget,
            toggleSkill, 
            calculatedSkills,
            currentProfCount, 
            currentExpertCount
        } = useSkillLogic(finalAbilityScores, proficiencyBonus);

        // Yetenek Paneli Durumu (Başlangıçta ekran genişliğine göre karar ver)
        const isSkillsExpanded = ref(window.innerWidth > 800);


        // ============================================================
        // UI & SİSTEM DEĞİŞKENLERİ
        // ============================================================
        const currentStep = ref(0);
        const steps = [{ title: "Konsept" }, { title: "Irk" }, { title: "Sınıf" }, { title: "Puanlar" }, { title: "Geçmiş" }];
        
        const nextStep = () => { if (currentStep.value < steps.length - 1) currentStep.value++; };
        const prevStep = () => { if (currentStep.value > 0) currentStep.value--; };

        const loading = ref(true);
        const error = ref(null);
        const backgroundList = ref([]);
        const featList = ref([ "Alert", "Actor", "Athlete", "Lucky", "Tough", "War Caster" ]);
        const seedText = ref('');

        // --- HIZLI AVATAR GALERİSİ ---
        const avatarGallery = [
            "../../img/avatars/default-avatar.png",
            "../../img/avatars/barbarian.jpg",
            "../../img/avatars/bard.jpg",
            "../../img/avatars/cleric.jpg",
            "../../img/avatars/druid.jpg",
            "../../img/avatars/fighter.jpg",
            "../../img/avatars/monk.jpg",
            "../../img/avatars/paladin.jpg",
            "../../img/avatars/ranger.jpg",
            "../../img/avatars/rogue.jpg",
            "../../img/avatars/sorcerer.jpg",
            "../../img/avatars/warlock.jpg",
            "../../img/avatars/wizard.jpg"
        ];

        const showCustomAvatarInput = ref(false);
        const isGalleryExpanded = ref(false); 
        const isMobileMenuOpen = ref(false);
        const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
        const isMobileSheetOpen = ref(false);
        const toggleMobileSheet = () => { isMobileSheetOpen.value = !isMobileSheetOpen.value; };

        // --- DIŞARI TIKLAMA İLE GALERİYİ KAPATMA ---
        const galleryContainer = ref(null); 
        const galleryButton = ref(null);    

        const handleClickOutside = (event) => {
            if (isGalleryExpanded.value && 
                galleryContainer.value && !galleryContainer.value.contains(event.target) &&
                galleryButton.value && !galleryButton.value.contains(event.target)) {
                isGalleryExpanded.value = false;
            }
        };

        // --- TOAST BİLDİRİMİ ---
        const showToast = (message, icon = '✅') => {
            const existing = document.querySelector('.toast-notification');
            if(existing) existing.remove();     
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
            document.body.appendChild(toast);       
            setTimeout(() => toast.classList.add('show'), 10);      
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 400);
            }, 3000);
        };

        const handleFinish = () => { finishCreation(showToast); };
        const handleRoll = () => { rollStats(showToast); };

        // ============================================================
        // SEED (KAYIT/YÜKLEME) SİSTEMİ
        // ============================================================
        const characterSeed = computed(() => {
            const exportData = {
                n: store.meta.name, 
                r: store.race.selected?.name, 
                sr: store.race.subrace?.name, 
                ac: store.race.abilityChoices,
                c: store.class.selected?.name, 
                sc: store.class.subclass?.name, 
                l: targetLevel.value,
                b: store.abilities.base, 
                asi: store.abilities.asi, 
                bg: store.background.selected?.name,
                p: store.skills.proficiencies, 
                e: store.skills.expertises, 
                ch: userChoices.value,
                sm: selectedScoreMethod.value, 
                rp: rolledPool.value,
                hp: store.hp,
                inv: store.inventory, 
                av: store.meta.avatar 
            };      
            try {
                const cleanData = cleanObject(JSON.parse(JSON.stringify(exportData)));
                return window.LZString.compressToEncodedURIComponent(JSON.stringify(cleanData));
            } catch (e) { return ""; }
        });

        const copySeed = () => {
            navigator.clipboard.writeText(characterSeed.value);
            showToast("Karakter kodu kopyalandı!");
        };

        const copyLink = () => {
            const url = `${window.location.origin}${window.location.pathname}?seed=${characterSeed.value}`;
            navigator.clipboard.writeText(url).then(() => {
                showToast("Link kopyalandı! Arkadaşına gönderebilirsin.", "🔗");
            });
        };

        const loadFromSeed = () => {
            try {
                if (!seedText.value) { showToast("Lütfen bir kod yapıştırın.", "⚠️"); return; }
                let jsonStr = window.LZString.decompressFromEncodedURIComponent(seedText.value);
                if (!jsonStr) { showToast("Geçersiz veya bozuk kod!", "❌"); return; }                
                const data = JSON.parse(jsonStr);                

                store.meta.name = data.n || "";
                if(data.av) { store.meta.avatar = data.av; } 
                else { store.meta.avatar = "../../img/avatars/default-avatar.png"; }

                targetLevel.value = data.l || 1; 
                
                // Irk Yükleme
                if (data.r) {
                    const targetSubraceName = data.sr || "Standart";
                    const foundFlatOption = flatRaceList.value.find(option => {
                        const raceMatch = option.race.name === data.r;
                        const optSubName = option.subrace ? (option.subrace.name || "Standart") : null;
                        if (option.subrace) return raceMatch && (optSubName === targetSubraceName);
                        return raceMatch;
                    });
                    if (foundFlatOption) {
                        selectedFlatOption.value = foundFlatOption;
                        if (data.ac) setTimeout(() => { store.race.abilityChoices = { ...data.ac }; }, 100);
                    }
                }            

                // Sınıf Yükleme
                if (data.c) {
                    const foundClass = classList.value.find(x => x.name === data.c);
                    if (foundClass) {
                        selectedClass.value = foundClass;
                        setTimeout(() => { if (data.sc) selectedSubclass.value = foundClass.subclasses?.find(s => s.name === data.sc); }, 100);
                    }
                }                

                // Puanlar ve Diğerleri
                selectedScoreMethod.value = data.sm || 'manual';
                if (data.rp) { rolledPool.value = [...data.rp]; hasRolled.value = true; }
                
                store.abilities.base = { ...data.b };
                store.abilities.asi = { ...data.asi };
                if (data.bg) store.background.selected = backgroundList.value.find(x => x.name === data.bg);
                store.skills.proficiencies = [...(data.p || [])];
                store.skills.expertises = [...(data.e || [])];
                userChoices.value = { ...data.ch };    
                
                // Can Yükleme
                if (data.hp) { store.hp = { ...store.hp, ...data.hp }; }

                // Envanter Yükleme
                if (data.inv) {
                    store.inventory = { ...store.inventory, ...data.inv };
                }

                // Havuzu güncelle
                setTimeout(() => { syncAllocationsFromStore(); }, 200); 

                showToast("Karakter Başarıyla Yüklendi!", "🚀");
                finishCreation(); 
                seedText.value = ''; 

            } catch (e) { 
                console.error(e);
                showToast("Yükleme sırasında hata oluştu!", "❌");
            }
        };

        // Kaynak Yönetimi
        const updateResource = (id, delta, max) => {
            const current = store.resources[id] !== undefined ? store.resources[id] : max;
            let newVal = current + delta;
            if (newVal > max) newVal = max;
            if (newVal < 0) newVal = 0;
            store.resources[id] = newVal;
        };

        // Dinlenme
        const handleRest = (type) => {
            let msg = "";
            if (type === 'long') {
                msg = "Uzun dinlenme: HP, Büyüler ve Yetenekler yenilendi! 💤";
            } else {
                msg = "Kısa dinlenme yapıldı. (Warlock büyüleri ve bazı yetenekler yenilendi) ☕";
            }
            classResources.value.forEach(res => {
                if (type === 'long' || res.reset === 'short') {
                    store.resources[res.id] = res.max;
                }
            });
            showToast(msg);
        };

        // ============================================================
        // ZAR VE HASAR MANTIĞI
        // ============================================================
        const { 
            diceResult, 
            rollD20,
            rollDamage, // <--- useDiceLogic'ten otomatik geliyor
            closeDiceResult, 
            diceHistory,
            isHistoryOpen,
            clearHistory,
            toggleHistory
        } = useDiceLogic();

        

        const isSaveProficient = (key) => {
            const cls = selectedClass.value;
            if (!cls || !cls.proficiency) return false;
            
            const profs = cls.proficiency.map(p => p.toLowerCase());

            // GENİŞLETİLMİŞ HARİTA (Hem TR, Hem ENG, Hem Kısaltma)
            const map = {
                str: ['str', 'strength', 'güç', 'kuv', 'kuvvet'],
                dex: ['dex', 'dexterity', 'çev', 'çeviklik'],
                con: ['con', 'constitution', 'day', 'dayanıklılık'],
                int: ['int', 'intelligence', 'zek', 'zeka'],
                wis: ['wis', 'wisdom', 'aki', 'akı', 'akıl', 'bilgelik', 'sezgi'], 
                cha: ['cha', 'charisma', 'kar', 'karizma']
            };

            // key (örn: 'str') haritada var mı bak
            if (!map[key]) return false;

            return map[key].some(term => profs.some(p => p.includes(term)));
        };

        const isInventoryOpen = ref(false); 

        // ============================================================
        // 6. ENVANTER (INVENTORY LOGIC)
        // ============================================================

        // ÖZEL SİLAH FORM DEĞİŞKENLERİ
        const isCustomWeaponFormOpen = ref(false);
        const customWeaponForm = ref({
            name: '',
            dmg: '1d6',
            type: 'Kesici',
            stat: 'str',
            bonusHit: 0, // YENİ: Ayrı Tutturma
            bonusDmg: 0, // YENİ: Ayrı Hasar
            isProficient: false
        });

        const {
            weaponList, armorList,
            calculatedAC, attackList,
            toggleWeapon, toggleWeaponProficiency, 
            setArmor, toggleShield,
            checkProficiencyRule,
            addCustomWeaponToInventory 
        } = useInventoryLogic(finalAbilityScores, proficiencyBonus, selectedClass, selectedRace);

        // FORMU KAYDET VE SIFIRLA
        const saveCustomWeapon = () => {
            if (!customWeaponForm.value.name) {
                alert("Lütfen silaha bir isim verin.");
                return;
            }
            
            addCustomWeaponToInventory(customWeaponForm.value);
            
            // Formu Sıfırla
            customWeaponForm.value = {
                name: '', 
                dmg: '1d6', 
                type: 'Kesici', 
                stat: 'str', 
                bonusHit: 0, 
                bonusDmg: 0, 
                isProficient: false
            };
            isCustomWeaponFormOpen.value = false;
            
            alert("Silah başarıyla eklendi! Çantam sekmesinden görebilirsiniz.");
        };

        // Toast Fonksiyonu
        const showWarningToast = (msg) => { alert("⚠️ DİKKAT: " + msg); };



   

            // ============================================================
        // 8. BÜYÜ SİSTEMİ (GARANTİLİ VERSİYON)
        // ============================================================
        const {
            allSpells,
            isLoadingSpells,
            loadSpellsData,
            knownSpellsList,
            groupedSpells,
            maxSpellSlots,
            toggleSpellKnown,
            castSpell,
            renderEntry
        } = useSpellLogic(targetLevel, selectedClass, finalAbilityScores);

        // UI Değişkenleri
        const isSpellBrowserOpen = ref(false);
        const spellSearchQuery = ref("");
        
        // KRİTİK: Başlangıçta 50 büyü göster. Bu değişken eksikse liste boş gelir!
        const browserDisplayLimit = ref(50); 

        // Pencere açılınca veriyi yüklemeyi ZORLA
        watch(isSpellBrowserOpen, (newValue) => {
            if (newValue === true) {
                console.log("Büyü kütüphanesi açıldı, veri kontrol ediliyor...");
                loadSpellsData(); // Veri yoksa çeker, varsa pas geçer
                browserDisplayLimit.value = 50; // Scroll'u başa sar
            }
        });

        // Filtreli Liste (Sıralı ve Limitli)
        const filteredSpells = computed(() => {
            if (!allSpells.value || allSpells.value.length === 0) return [];

            const q = spellSearchQuery.value.toLowerCase();
            
            // 1. Filtrele
            let result = allSpells.value.filter(s => s.searchString && s.searchString.includes(q));

            // 2. SIRALA (Önce Seviye, Sonra İsim)
            result.sort((a, b) => {
                // Seviye farkı varsa ona göre sırala (Küçükten büyüğe)
                if (a.level !== b.level) {
                    return a.level - b.level;
                }
                // Seviyeler aynıysa isme göre sırala (Alfabetik)
                return a.name.localeCompare(b.name);
            });

            // 3. Limitle (Sonsuz Kaydırma için)
            return result.slice(0, browserDisplayLimit.value);
        });

        // Sonsuz Kaydırma (Infinite Scroll)
        const onSpellBrowserScroll = (e) => {
            const { scrollTop, clientHeight, scrollHeight } = e.target;
            // Listenin sonuna yaklaşıldı mı?
            if (scrollTop + clientHeight >= scrollHeight - 100) {
                // Eğer daha fazla veri varsa, limiti 50 artır
                if (filteredSpells.value.length >= browserDisplayLimit.value) {
                    browserDisplayLimit.value += 50;
                }
            }
        };

        // ============================================================
        // 7. CAN (HP) YÖNETİMİ SİSTEMİ (YENİ)
        // ============================================================
        
        const isHpModalOpen = ref(false);
        const hpModalValue = ref(0); // Inputtaki değer

        // 1. Maksimum Can Hesabı (Tekrar kullanılabilir hale getirdik)
        const maxHP = computed(() => {
            if (!selectedClass.value) return 0;
            
            const hitDie = parseInt(getHitDie(selectedClass.value)) || 8;
            const conMod = Math.floor(((finalAbilityScores.value.con || 10) - 10) / 2);
            const lvl = targetLevel.value;

            // Seviye 1: Full Zar + Con
            // Sonraki Seviyeler: (Zar/2 + 1) + Con
            const firstLevel = hitDie + conMod;
            const nextLevels = ((hitDie / 2) + 1 + conMod) * (lvl - 1);

            return firstLevel + nextLevels;
        });

        // 2. Mevcut Can (Store ile senkronize)
        const currentHP = computed({
            get: () => {
                // Eğer store'da değer yoksa (null), karakter full candadır.
                if (store.hp.current === null || store.hp.current === undefined) {
                    return maxHP.value;
                }
                return store.hp.current;
            },
            set: (val) => {
                // Sınırları koru (0 ile Max arası)
                if (val > maxHP.value) val = maxHP.value;
                if (val < 0) val = 0;
                store.hp.current = val;
            }
        });

        // 3. Renk Sınıfı Belirleyici (%30 ve %10 kuralı)
        const hpStatusClass = computed(() => {
            if (maxHP.value === 0) return '';
            const percent = (currentHP.value / maxHP.value) * 100;

            if (percent <= 0) return 'hp-dead'; // Ölü (Gri/Siyah)
            if (percent <= 10) return 'hp-critical'; // Kritik (Kırmızı Yanıp Sönen)
            if (percent <= 30) return 'hp-low'; // Düşük (Turuncu)
            return ''; // Normal (Beyaz/Yeşil)
        });

        // 4. İşlemler (SADELEŞTİRİLDİ & BİRLEŞTİRİLDİ)
        
        // Değeri değiştir (Artık eksiye de düşebilir)
        const adjustHpModalValue = (amount) => {
            hpModalValue.value += amount;
        };

        // Tek Buton Mantığı: Artıysa iyileş, eksiyse hasar al
        const applyHpChange = () => {
            const val = hpModalValue.value;
            if (val === 0) return;

            // currentHP computed özelliği zaten sınırları (0 ve Max) koruyor
            // Bu yüzden direkt topluyoruz. (Hasar ise val negatiftir, toplamak çıkartmak demektir)
            currentHP.value += val;

            // Mesaj ver
            if (val > 0) showToast(`${val} İyileşildi!`, "💚");
            else showToast(`${Math.abs(val)} Hasar Alındı!`, "🩸");

            // Sıfırla ve kapat
            hpModalValue.value = 0;
            isHpModalOpen.value = false;
        };

        const setFullHp = () => {
            currentHP.value = maxHP.value;
            showToast("Can tamamen yenilendi!", "✨");
            // isHpModalOpen.value = false; // İsteğe bağlı: Resetleyince pencere kapanmasın, oyuncu görsün
        };


        // ============================================================
        // LIFE CYCLE (ON MOUNTED)
        // ============================================================
        onMounted(async () => {
            document.addEventListener('click', handleClickOutside);
            if (!store.meta.avatar || typeof store.meta.avatar !== 'string') {
                store.meta.avatar = "../../img/avatars/default-avatar.png";
            }

            try {
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
                    raceList.value = Array.isArray(rawRaceData) ? rawRaceData : (rawRaceData.race || []);
                }
            
                if (bgRes && bgRes.ok) {
                    const bgData = await bgRes.json();
                    backgroundList.value = bgData.background || [];
                }
                
                loading.value = false;
                const loader = document.getElementById('initial-loader');
                if(loader) {
                    loader.classList.add('fade-out');
                    setTimeout(() => loader.remove(), 500);
                }

                // URL'den Seed Okuma
                const urlParams = new URLSearchParams(window.location.search);
                const urlSeed = urlParams.get('seed');
                if (urlSeed) {
                    seedText.value = urlSeed;
                    setTimeout(() => loadFromSeed(), 500);
                }
            } catch (err) {
                error.value = "Veri yükleme hatası: " + err.message;
                loading.value = false;
                const loader = document.getElementById('initial-loader');
                if(loader) loader.remove();
            }
        
            // --- PENCERE BOYUTU DİNLEYİCİSİ (ÇİFT TARAFLI) ---
            window.addEventListener('resize', () => {
                const isDesktop = window.innerWidth > 850;

                if (isDesktop) {
                    // Geniş ekran: Eğer kapalıysa AÇ
                    if (!isSkillsExpanded.value) isSkillsExpanded.value = true;
                } else {
                    // Dar ekran: Eğer açıksa KAPAT
                    if (isSkillsExpanded.value) isSkillsExpanded.value = false;
                }
            });
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
        });

        // ============================================================
        // RETURN OBJECT
        // ============================================================
        return {
            store, 
            currentStep, 
            steps, 
            nextStep, 
            prevStep, 
            loading, 
            error,
            isMobileMenuOpen, 
            toggleMobileMenu, 
            isMobileSheetOpen, 
            toggleMobileSheet,
            copyLink, 
            showToast, 
            backgroundList, 
            featList, 
            seedText, 
            characterSeed, 
            loadFromSeed, 
            copySeed,
            formatEntry, 
            parseTags, 
            dndIcons, 
            isSheetMode, 
            activeSheetTab, 
            activeInventoryTab, // YENİ EKLENDİ
            isSkillsExpanded, // <--- EKLENDİ
            finishCreation: handleFinish,
            hasCreatedSheet, 
            activeFeatureSubTab, 
            raceList, 
            flatRaceList, 
            selectedFlatOption, 
            raceBonuses, 
            activeRaceTraits, 
            raceChoiceConfig,
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
            getChoiceDetail,
            statLabels, 
            selectableStats, 
            scoreMethods, 
            selectedScoreMethod, 
            isOptionDisabled, 
            getFlexCost, 
            pointBuyBudget, 
            currentPbCost, 
            changePointBuy, 
            standardArrayValues, 
            rolledPool, 
            hasRolled, 
            isCapped20, 
            isRolling,
            rollStats: handleRoll, 
            statBonuses, 
            finalAbilityScores, 
            proficiencyBonus,
            handleOrbClick, 
            scoreAllocations, 
            draggedItem, 
            assignScore, 
            unassignScore, 
            syncAllocationsFromStore,
            SKILL_DEFINITIONS, 
            calculatedSkills, 
            toggleSkill, 
            skillBudget, 
            expertiseBudget, 
            raceSkillInfo, 
            classSkillInfo, 
            currentProfCount, 
            currentExpertCount, 
            avatarGallery, 
            avatarList, 
            showCustomAvatarInput, 
            isGalleryExpanded,
            galleryContainer,
            galleryButton,
            classResources,   
            updateResource,   
            handleRest,
            diceResult, 
            rollD20,
            rollDamage, // YENİ EKLENDİ
            closeDiceResult, 
            isSaveProficient,
            diceHistory, 
            isHistoryOpen, 
            clearHistory, 
            toggleHistory,
            isInventoryOpen,
            calculatedAC,
            attackList,
            weaponList, armorList,
            toggleWeapon, setArmor, toggleShield,
            toggleWeaponProficiency,
            checkProficiencyRule,
            showWarningToast,

            isCustomWeaponFormOpen,
            customWeaponForm,
            saveCustomWeapon,

            isHpModalOpen,
            hpModalValue,
            maxHP,
            currentHP,
            hpStatusClass,
            setFullHp,
            adjustHpModalValue, // <--- Bunu ekle
            applyHpChange, // <--- Bunu ekle

            // Sihir Sistemi
            isSpellBrowserOpen,
            spellSearchQuery,
            filteredSpells,
            knownSpellsList,
            groupedSpells,
            maxSpellSlots,
            toggleSpellKnown,
            castSpell,
            renderEntry,
            isLoadingSpells,
            onSpellBrowserScroll,
        };
    }
});
app.mount('#app');