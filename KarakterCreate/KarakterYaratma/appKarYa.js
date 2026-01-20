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
        
        // ============================================================
        // 2. IRK MANTIĞI
        // ============================================================
        // Not: Score ile ilgili değişkenler buradan kaldırıldı ve useScoreLogic'e taşındı.
        const { 
            raceList, 
            flatRaceList, 
            selectedFlatOption, 
            raceBonuses, 
            activeRaceTraits, 
            raceChoiceConfig 
        } = useRaceLogic();

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
            getChoiceDetail 
        } = useClassLogic();

        // ============================================================
        // 4. PUANLAR (SCORE LOGIC)
        // ============================================================
        // Düzeltme: handleOrbClick ve diğer drag-drop fonksiyonları buradan çekildi.
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
            // --- YENİ EKLENEN SİSTEMLER ---
            scoreAllocations, 
            draggedItem, 
            assignScore, 
            unassignScore, 
            syncAllocationsFromStore,
            handleOrbClick // <--- BURASI EKLENDİ (Daha önce tanımlı değildi ama return ediliyordu)
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
        const galleryContainer = ref(null); // HTML'deki ref ile eşleşir
        const galleryButton = ref(null);    // HTML'deki ref ile eşleşir

        const handleClickOutside = (event) => {
            // Eğer galeri açıksa VE tıklanan yer galeri değilse VE tıklanan yer buton değilse
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

        // --- HANDLER WRAPPERS ---
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

                // Havuzu güncelle (Re-hydration)
                setTimeout(() => { syncAllocationsFromStore(); }, 200); 

                showToast("Karakter Başarıyla Yüklendi!", "🚀");
                finishCreation(); 
                seedText.value = ''; 

            } catch (e) { 
                console.error(e);
                showToast("Yükleme sırasında hata oluştu!", "❌");
            }
        };

        // ============================================================
        // LIFE CYCLE (ON MOUNTED)
        // ============================================================
        onMounted(async () => {
            document.addEventListener('click', handleClickOutside); // Dinleyiciyi başlat
            // Varsayılan Avatar Kontrolü
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
        });
         // Sayfa kapanırken dinleyiciyi kaldır (Performans için)
        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
        });

        // ============================================================
        // RETURN OBJECT
        // ============================================================
        return {
            // Store ve Genel
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
            
            // Veri Listeleri ve Seed
            backgroundList, 
            featList, 
            seedText, 
            characterSeed, 
            loadFromSeed, 
            copySeed,
            
            // Utils ve Icons
            formatEntry, 
            parseTags, 
            dndIcons, 
            
            // Logic 1: Karakter Sayfası
            isSheetMode, 
            activeSheetTab, 
            finishCreation: handleFinish,
            hasCreatedSheet, 
            activeFeatureSubTab, 
            
            // Logic 2: Irk
            raceList, 
            flatRaceList, 
            selectedFlatOption, 
            raceBonuses, 
            activeRaceTraits, 
            raceChoiceConfig,
            
            // Logic 3: Sınıf
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
            
            // Logic 4: Puanlar (Score)
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
            // Score Yeni Eklenenler (Drag/Drop/Click)
            handleOrbClick, // <--- ARTIK TANIMLI VE DÖNÜYOR
            scoreAllocations, 
            draggedItem, 
            assignScore, 
            unassignScore, 
            syncAllocationsFromStore,
            
            // Logic 5: Yetenekler (Skills)
            SKILL_DEFINITIONS, 
            calculatedSkills, 
            toggleSkill, 
            skillBudget, 
            expertiseBudget, 
            raceSkillInfo, 
            classSkillInfo, 
            currentProfCount, 
            currentExpertCount, 
            
            // Avatar Gallery
            avatarGallery, 
            avatarList, 
            showCustomAvatarInput, 
            isGalleryExpanded,
            galleryContainer,
            galleryButton
        };
    }
});
app.mount('#app');