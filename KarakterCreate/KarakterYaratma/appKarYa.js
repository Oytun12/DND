import { createApp, ref, computed, onMounted, watch } from 'vue';

// --- MODÜLLER ---
import { store, cleanObject } from './src/store.js';
import { parseTags, formatEntry } from './src/utils.js';
import { dndIcons } from './src/icons.js';
// DÜZELTME: Senin belirttiğin gibi logicSheet.js kullanıyoruz
import { useCharacterSheet } from './src/logicSheet.js'; 
import { useRaceLogic } from './src/logicRace.js';
import { useClassLogic } from './src/logicClass.js';
import { useScoreLogic } from './src/logicScores.js';
import { useSkillLogic } from './src/logicSkills.js';
// Veri Dosyası (Büyük Liste)
import { avatarList } from './src/data/avatarList.js';

const app = createApp({
    setup() {
        
        // 1. GENEL SAYFA MANTIĞI
        const { isSheetMode, activeSheetTab, finishCreation, hasCreatedSheet, activeFeatureSubTab } = useCharacterSheet();
        
        // 2. IRK MANTIĞI
        const { 
            raceList, flatRaceList, selectedFlatOption, raceBonuses, activeRaceTraits, raceChoiceConfig 
        } = useRaceLogic();

        // 3. SINIF MANTIĞI
        const { 
            classList, selectedClass, selectedSubclass, targetLevel, userChoices, 
            subclassOptions, subclassUnlockLevel, activeFeatures, getHitDie, 
            getAvailableOptions, getChoiceDetail 
        } = useClassLogic();

        // 4. PUANLAR (Race Bonus'a ihtiyaç duyar)
        const {
            statLabels, selectableStats, scoreMethods, selectedScoreMethod, standardArrayValues,
            rolledPool, hasRolled, isCapped20, isRolling,
            pointBuyBudget, currentPbCost,
            getFlexCost, changePointBuy, rollStats, isOptionDisabled,
            statBonuses, finalAbilityScores, proficiencyBonus
        } = useScoreLogic(raceBonuses);

        // 5. YETENEKLER (Statlar ve PB'ye ihtiyaç duyar)
        const {
            SKILL_DEFINITIONS,
            raceSkillInfo, classSkillInfo,
            skillBudget, expertiseBudget,
            toggleSkill, calculatedSkills,
            currentProfCount, currentExpertCount
        } = useSkillLogic(finalAbilityScores, proficiencyBonus);


        // ============================================================
        //  UI & SİSTEM DEĞİŞKENLERİ
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

        // --- HIZLI AVATAR GALERİSİ (Sihirbazın ilk ekranı) ---
        // DOSYA YOLU DÜZELTMESİ: ../../img/avatars/
        // NOT: Senin klasöründe 'default-avatar.png' var, kodda onu kullanmalıyız.
        const avatarGallery = [
            "../../img/avatars/default-avatar.png", // <--- İsim düzeltildi
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

        // UI Kontrolleri
        const showCustomAvatarInput = ref(false);
        const isGalleryExpanded = ref(false); 
        
        // --- MOBİL MENÜ DEĞİŞKENLERİ ---
        const isMobileMenuOpen = ref(false);
        const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
        const isMobileSheetOpen = ref(false);
        const toggleMobileSheet = () => { isMobileSheetOpen.value = !isMobileSheetOpen.value; };

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

        // Modül sarmalayıcıları
        const handleFinish = () => {
            finishCreation(showToast);
        };

        const handleRoll = () => {
            rollStats(showToast);
        };

        // --- SEED (KAYIT) SİSTEMİ ---
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
                av: store.meta.avatar // Avatarı kaydet
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
                if (!seedText.value) {
                    showToast("Lütfen bir kod yapıştırın.", "⚠️");
                    return;
                }
                let jsonStr = window.LZString.decompressFromEncodedURIComponent(seedText.value);
                if (!jsonStr) {
                    showToast("Geçersiz veya bozuk kod!", "❌");
                    return;
                }                
                const data = JSON.parse(jsonStr);                

                store.meta.name = data.n || "";
                
                // Avatar Yükleme Kontrolü
                if(data.av) {
                    store.meta.avatar = data.av;
                } else {
                    // Seed'de avatar yoksa varsayılanı ata
                    store.meta.avatar = "../../img/avatars/default-avatar.png";
                }

                targetLevel.value = data.l || 1; 
                
                // Irkı Bul
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

                // Sınıfı Bul
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

                showToast("Karakter Başarıyla Yüklendi!", "🚀");
                finishCreation(); 
                seedText.value = ''; 

            } catch (e) { 
                console.error(e);
                showToast("Yükleme sırasında hata oluştu!", "❌");
            }
        };

        // Veri Çekme (Fetch)
        onMounted(async () => {
            // BAŞLANGIÇ GÜVENLİK KONTROLÜ: Avatar boşsa veya hatalıysa varsayılanı ata
            // Bu, 'undefined is not an object' hatasını önler.
            if (!store.meta.avatar || typeof store.meta.avatar !== 'string') {
                store.meta.avatar = "../../img/avatars/default-avatar.png";
            }

            try {
                // Not: JSON dosyaların da iki üst klasörde (Data/)
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

                const urlParams = new URLSearchParams(window.location.search);
                const urlSeed = urlParams.get('seed');
                if (urlSeed) {
                    seedText.value = urlSeed;
                    setTimeout(() => loadFromSeed(), 500);
                }
            } catch (err) {
                error.value = "Veri yükleme hatası: " + err.message;
                console.error(err);
                loading.value = false;
                const loader = document.getElementById('initial-loader');
                if(loader) loader.remove();
            }
        });

        // ============================================================
        //  RETURN (TEMPLATE İÇİN GEREKLİ HER ŞEY)
        // ============================================================
        return {
            // Store & Navigasyon
            store, currentStep, steps, nextStep, prevStep, loading, error,
            
            // UI Yardımcıları
            isMobileMenuOpen, toggleMobileMenu, isMobileSheetOpen, toggleMobileSheet,
            copyLink, showToast, isRolling,
            backgroundList, featList, seedText, characterSeed, loadFromSeed, copySeed,
            
            // Format Araçları
            formatEntry, parseTags, 
            
            // Modüllerden Gelenler
            dndIcons, isSheetMode, activeSheetTab, finishCreation: handleFinish,
            
            // Irk
            raceList, flatRaceList, selectedFlatOption, raceBonuses, activeRaceTraits, raceChoiceConfig,
            
            // Sınıf
            classList, selectedClass, selectedSubclass, targetLevel, userChoices, 
            subclassOptions, subclassUnlockLevel, activeFeatures, getHitDie, 
            getAvailableOptions, getChoiceDetail,

            // Puanlar
            statLabels, selectableStats, scoreMethods, selectedScoreMethod, 
            isOptionDisabled, getFlexCost, pointBuyBudget, currentPbCost, changePointBuy, 
            standardArrayValues, rolledPool, hasRolled, isCapped20, 
            rollStats: handleRoll, statBonuses, finalAbilityScores, proficiencyBonus,

            // Yetenekler
            SKILL_DEFINITIONS, calculatedSkills, toggleSkill, skillBudget, expertiseBudget, 
            raceSkillInfo, classSkillInfo, currentProfCount, currentExpertCount, 
            
            // Yeni Eklenenler (Sheet & Avatar)
            hasCreatedSheet, activeFeatureSubTab, 
            avatarGallery, avatarList, showCustomAvatarInput, isGalleryExpanded
        };
    }
});
app.mount('#app');