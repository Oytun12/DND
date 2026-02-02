import { createApp, ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'; 

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
import { useSpellLogic } from './src/logicSpells.js'; 

const app = createApp({
    setup() {
        
        // GLOBAL STORE
        window.store = store;

        // ============================================================
        // 1. GENEL SAYFA MANTIĞI
        // ============================================================
        const { isSheetMode, activeSheetTab, finishCreation, hasCreatedSheet, activeFeatureSubTab } = useCharacterSheet();
        const activeInventoryTab = ref('owned'); 
        
        // --- SEKME (TAB) YÖNETİMİ VE SÜRÜKLE-BIRAK (YENİ) ---
        const sheetTabs = ref([
            { id: 'actions',    label: 'Aksiyonlar',  icon: dndIcons.actions },
            { id: 'spells',     label: 'Büyüler',     icon: dndIcons.spells },
            { id: 'inventory',  label: 'Envanter',    icon: dndIcons.inventory },
            { id: 'features',   label: 'Özellikler',  icon: dndIcons.features },
            { id: 'description',label: 'Açıklama',    icon: dndIcons.description }
        ]);

        const draggingTabId = ref(null);

        const handleTabDragStart = (evt, tabId) => {
            draggingTabId.value = tabId;
            evt.dataTransfer.effectAllowed = 'move';
            evt.target.style.opacity = '0.5'; 
        };

        const handleTabDragEnd = (evt) => {
            evt.target.style.opacity = '1';
            draggingTabId.value = null;
        };

        const handleTabDrop = (evt, targetTabId) => {
            const fromIndex = sheetTabs.value.findIndex(t => t.id === draggingTabId.value);
            const toIndex = sheetTabs.value.findIndex(t => t.id === targetTabId);
            
            if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
                const item = sheetTabs.value.splice(fromIndex, 1)[0];
                sheetTabs.value.splice(toIndex, 0, item);
            }
        };

        // ============================================================
        // 2. IRK MANTIĞI
        // ============================================================
        const { raceList, flatRaceList, selectedFlatOption, raceBonuses, activeRaceTraits, raceChoiceConfig } = useRaceLogic();
        const selectedRace = computed(() => store.race.selected);

        // ============================================================
        // 3. SINIF MANTIĞI
        // ============================================================
        const { classList, selectedClass, selectedSubclass, targetLevel, userChoices, subclassOptions, subclassUnlockLevel, activeFeatures, getHitDie, getAvailableOptions, getChoiceDetail, classResources } = useClassLogic();

        // ============================================================
        // 4. PUANLAR
        // ============================================================
        const { statLabels, selectableStats, scoreMethods, selectedScoreMethod, standardArrayValues, rolledPool, hasRolled, isCapped20, isRolling, pointBuyBudget, currentPbCost, getFlexCost, changePointBuy, rollStats, isOptionDisabled, statBonuses, finalAbilityScores, proficiencyBonus, scoreAllocations, draggedItem, assignScore, unassignScore, syncAllocationsFromStore, handleOrbClick } = useScoreLogic(raceBonuses);

        // ============================================================
        // 5. YETENEKLER
        // ============================================================
        const { SKILL_DEFINITIONS, raceSkillInfo, classSkillInfo, skillBudget, expertiseBudget, toggleSkill, calculatedSkills, currentProfCount, currentExpertCount } = useSkillLogic(finalAbilityScores, proficiencyBonus);
        const isSkillsExpanded = ref(window.innerWidth > 860);

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

        const avatarGallery = [
            "../../img/avatars/default-avatar.png", "../../img/avatars/barbarian.jpg", "../../img/avatars/bard.jpg",
            "../../img/avatars/cleric.jpg", "../../img/avatars/druid.jpg", "../../img/avatars/fighter.jpg",
            "../../img/avatars/monk.jpg", "../../img/avatars/paladin.jpg", "../../img/avatars/ranger.jpg",
            "../../img/avatars/rogue.jpg", "../../img/avatars/sorcerer.jpg", "../../img/avatars/warlock.jpg",
            "../../img/avatars/wizard.jpg"
        ];

        const showCustomAvatarInput = ref(false);
        const isGalleryExpanded = ref(false); 
        const isMobileMenuOpen = ref(false);
        const toggleMobileMenu = () => { isMobileMenuOpen.value = !isMobileMenuOpen.value; };
        const isMobileSheetOpen = ref(false);
        const toggleMobileSheet = () => { isMobileSheetOpen.value = !isMobileSheetOpen.value; };

        const toggleGallery = () => {
            isGalleryExpanded.value = !isGalleryExpanded.value;
            if (isGalleryExpanded.value) {
                nextTick(() => {
                    setTimeout(() => {
                        if (galleryContainer.value) galleryContainer.value.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                });
            }
        };

        const galleryContainer = ref(null); 
        const galleryButton = ref(null);    

        const handleClickOutside = (event) => {
            if (isGalleryExpanded.value && galleryContainer.value && !galleryContainer.value.contains(event.target) &&
                galleryButton.value && !galleryButton.value.contains(event.target)) {
                isGalleryExpanded.value = false;
            }
        };

        const showToast = (message, icon = '✅') => {
            const existing = document.querySelector('.toast-notification');
            if(existing) existing.remove();     
            const toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
            document.body.appendChild(toast);       
            setTimeout(() => toast.classList.add('show'), 10);      
            setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
        };

        const handleFinish = () => { finishCreation(showToast); nextTick(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }); };
        const handleRoll = () => { rollStats(showToast); };

        // ============================================================
        // SEED (KAYIT/YÜKLEME)
        // ============================================================
        const characterSeed = computed(() => {
            const exportData = {
                n: store.meta.name, r: store.race.selected?.name, sr: store.race.subrace?.name, ac: store.race.abilityChoices,
                c: store.class.selected?.name, sc: store.class.subclass?.name, l: targetLevel.value,
                b: store.abilities.base, asi: store.abilities.asi, bg: store.background.selected?.name,
                p: store.skills.proficiencies, e: store.skills.expertises, ch: userChoices.value,
                sm: selectedScoreMethod.value, rp: rolledPool.value, hp: store.hp, inv: store.inventory, av: store.meta.avatar,
                spl: store.spells?.known || [],
                tabs: sheetTabs.value.map(t => t.id) // Tab sırasını kaydet
            };      
            try { return window.LZString.compressToEncodedURIComponent(JSON.stringify(cleanObject(JSON.parse(JSON.stringify(exportData))))); } 
            catch (e) { return ""; }
        });

        const copySeed = () => { navigator.clipboard.writeText(characterSeed.value); showToast("Karakter kodu kopyalandı!"); };
        const copyLink = () => {
            const url = `${window.location.origin}${window.location.pathname}?seed=${characterSeed.value}`;
            navigator.clipboard.writeText(url).then(() => { showToast("Link kopyalandı!", "🔗"); });
        };

        const loadFromSeed = () => {
            try {
                if (!seedText.value) { showToast("Kod girin.", "⚠️"); return; }
                let jsonStr = window.LZString.decompressFromEncodedURIComponent(seedText.value);
                if (!jsonStr) { showToast("Geçersiz kod!", "❌"); return; }                
                const data = JSON.parse(jsonStr);                
                store.meta.name = data.n || ""; store.meta.avatar = data.av || "../../img/avatars/default-avatar.png";
                targetLevel.value = data.l || 1; 
                
                if (data.r) {
                    const tSub = data.sr || "Standart";
                    const fOpt = flatRaceList.value.find(o => o.race.name === data.r && (o.subrace ? (o.subrace.name||"Standart") : "Standart") === tSub);
                    if (fOpt) { selectedFlatOption.value = fOpt; if (data.ac) setTimeout(() => { store.race.abilityChoices = { ...data.ac }; }, 100); }
                }            
                if (data.c) {
                    const fCls = classList.value.find(x => x.name === data.c);
                    if (fCls) { selectedClass.value = fCls; setTimeout(() => { if (data.sc) selectedSubclass.value = fCls.subclasses?.find(s => s.name === data.sc); }, 100); }
                }                

                selectedScoreMethod.value = data.sm || 'manual';
                if (data.rp) { rolledPool.value = [...data.rp]; hasRolled.value = true; }
                store.abilities.base = { ...data.b }; store.abilities.asi = { ...data.asi };
                if (data.bg) store.background.selected = backgroundList.value.find(x => x.name === data.bg);
                store.skills.proficiencies = [...(data.p || [])]; store.skills.expertises = [...(data.e || [])];
                userChoices.value = { ...data.ch }; 
                if (data.hp) store.hp = { ...store.hp, ...data.hp };
                if (data.inv) store.inventory = { ...store.inventory, ...data.inv };

                // Büyüleri Yükle
                if (data.spl && Array.isArray(data.spl)) {
                    if (!store.spells) store.spells = { known: [] };
                    store.spells.known = [...data.spl];
                    setTimeout(() => {
                         if(typeof window.renderMySpellList === 'function') window.renderMySpellList(); 
                    }, 500);
                }

                // Tab Sırasını Yükle
                if (data.tabs && Array.isArray(data.tabs)) {
                    sheetTabs.value.sort((a, b) => {
                        let idxA = data.tabs.indexOf(a.id);
                        let idxB = data.tabs.indexOf(b.id);
                        if (idxA === -1) idxA = 99;
                        if (idxB === -1) idxB = 99;
                        return idxA - idxB;
                    });
                }

                setTimeout(() => { syncAllocationsFromStore(); }, 200); 
                showToast("Yüklendi!", "🚀"); finishCreation(); seedText.value = ''; 
            } catch (e) { console.error(e); showToast("Hata!", "❌"); }
        };

        const updateResource = (id, delta, max) => {
            const current = store.resources[id] !== undefined ? store.resources[id] : max;
            let newVal = current + delta;
            if (newVal > max) newVal = max; if (newVal < 0) newVal = 0;
            store.resources[id] = newVal;
        };

        const handleRest = (type) => {
            let msg = type === 'long' ? "Uzun dinlenme: HP, Büyüler ve Yetenekler yenilendi! 💤" : "Kısa dinlenme yapıldı. ☕";
            classResources.value.forEach(res => { if (type === 'long' || res.reset === 'short') store.resources[res.id] = res.max; });
            
            if (typeof window.resetSpellSlots === 'function') {
                window.resetSpellSlots(type);
                const charClass = store.class.selected?.name;
                if (type === 'short' && charClass === 'Warlock') msg += " (Pact Büyüleri Yenilendi)";
            }
            showToast(msg);
        };

        // ============================================================
        // ZAR VE HASAR MANTIĞI
        // ============================================================
        const { diceResult, rollD20, rollDamage, closeDiceResult, diceHistory, isHistoryOpen, clearHistory, toggleHistory } = useDiceLogic();

        window.globalRollDice = (diceExpression) => {
            console.log("🎲 Global Zar:", diceExpression);
            rollDamage("Büyü Etkisi", diceExpression, 0, "Büyüsel");
        };

        const isSaveProficient = (key) => {
            const cls = selectedClass.value; if (!cls || !cls.proficiency) return false;
            const profs = cls.proficiency.map(p => p.toLowerCase());
            const map = { str: ['str','güç'], dex: ['dex','çev'], con: ['con','day'], int: ['int','zek'], wis: ['wis','akı'], cha: ['cha','kar'] };
            if (!map[key]) return false;
            return map[key].some(term => profs.some(p => p.includes(term)));
        };

        const isInventoryOpen = ref(false); 

        // ============================================================
        // 6. ENVANTER
        // ============================================================
        const isCustomWeaponFormOpen = ref(false);
        const customWeaponForm = ref({ name: '', dmg: '1d6', type: 'Kesici', stat: 'str', bonusHit: 0, bonusDmg: 0, isProficient: false });

        const { weaponList, armorList, calculatedAC, attackList, toggleWeapon, toggleWeaponProficiency, setArmor, toggleShield, checkProficiencyRule, addCustomWeaponToInventory } = useInventoryLogic(finalAbilityScores, proficiencyBonus, selectedClass, selectedRace);

        const saveCustomWeapon = () => {
            if (!customWeaponForm.value.name) { alert("İsim girin."); return; }
            addCustomWeaponToInventory(customWeaponForm.value);
            customWeaponForm.value = { name: '', dmg: '1d6', type: 'Kesici', stat: 'str', bonusHit: 0, bonusDmg: 0, isProficient: false };
            isCustomWeaponFormOpen.value = false;
            alert("Silah eklendi!");
        };
        const showWarningToast = (msg) => { alert("⚠️ " + msg); };

        // ============================================================
        // 7. CAN (HP) YÖNETİMİ
        // ============================================================
        const isHpModalOpen = ref(false);
        const hpModalValue = ref(0); 

        const maxHP = computed(() => {
            if (!selectedClass.value) return 0;
            const hd = parseInt(getHitDie(selectedClass.value)) || 8;
            const con = Math.floor(((finalAbilityScores.value.con || 10) - 10) / 2);
            return (hd + con) + ((hd / 2) + 1 + con) * (targetLevel.value - 1);
        });

        const currentHP = computed({
            get: () => (store.hp.current === null || store.hp.current === undefined) ? maxHP.value : store.hp.current,
            set: (val) => { if (val > maxHP.value) val = maxHP.value; if (val < 0) val = 0; store.hp.current = val; }
        });

        const hpStatusClass = computed(() => {
            if (maxHP.value === 0) return '';
            const p = (currentHP.value / maxHP.value) * 100;
            if (p <= 0) return 'hp-dead'; if (p <= 10) return 'hp-critical'; if (p <= 30) return 'hp-low'; return ''; 
        });

        const adjustHpModalValue = (amount) => { hpModalValue.value += amount; };
        const applyHpChange = () => {
            const val = hpModalValue.value; if (val === 0) return;
            currentHP.value += val;
            if (val > 0) showToast(`${val} İyileşildi!`, "💚"); else showToast(`${Math.abs(val)} Hasar!`, "🩸");
            hpModalValue.value = 0; isHpModalOpen.value = false;
        };
        const setFullHp = () => { currentHP.value = maxHP.value; showToast("Can yenilendi!", "✨"); };

        // ============================================================
        // 8. BÜYÜ SİSTEMİ
        // ============================================================
        useSpellLogic();

        watch(activeSheetTab, (newTab) => {
            if (newTab === 'spells') {
                setTimeout(() => {
                    if (typeof window.renderSpellTab === 'function') window.renderSpellTab(finalAbilityScores.value, targetLevel.value);
                }, 50);
            }
        });

        // ============================================================
        // LIFE CYCLE
        // ============================================================
        onMounted(async () => {
            document.addEventListener('click', handleClickOutside);
            if (!store.meta.avatar || typeof store.meta.avatar !== 'string') store.meta.avatar = "../../img/avatars/default-avatar.png";

            try {
                const [classRes, raceRes, bgRes] = await Promise.all([
                    fetch('../../Data/classes.json').catch(()=>null), fetch('../../Data/races.json').catch(()=>null), fetch('../../Data/backgrounds.json').catch(()=>null)
                ]);
                const classData = classRes ? await classRes.json() : { class: [] };
                classList.value = classData.class || [];
                const raceData = raceRes ? await raceRes.json() : { race: [] };
                raceList.value = Array.isArray(raceData) ? raceData : (raceData.race || []);
                const bgData = bgRes ? await bgRes.json() : { background: [] };
                backgroundList.value = bgData.background || [];
                
                loading.value = false;
                const loader = document.getElementById('initial-loader');
                if(loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 500); }

                const urlParams = new URLSearchParams(window.location.search);
                const urlSeed = urlParams.get('seed');
                if (urlSeed) { seedText.value = urlSeed; setTimeout(() => loadFromSeed(), 500); }
            } catch (err) { error.value = "Veri hatası"; loading.value = false; document.getElementById('initial-loader')?.remove(); }
        
            window.addEventListener('resize', () => {
                isSkillsExpanded.value = window.innerWidth > 860;
            });
        });

        onUnmounted(() => { document.removeEventListener('click', handleClickOutside); });

        // ============================================================
        // RETURN OBJECT
        // ============================================================
        return {
            store, currentStep, steps, nextStep, prevStep, loading, error,
            isMobileMenuOpen, toggleMobileMenu, isMobileSheetOpen, toggleMobileSheet,
            copyLink, showToast, backgroundList, featList, seedText, characterSeed, loadFromSeed, copySeed,
            formatEntry, parseTags, dndIcons, isSheetMode, activeSheetTab, activeInventoryTab, isSkillsExpanded,
            finishCreation: handleFinish, hasCreatedSheet, activeFeatureSubTab, raceList, flatRaceList,
            selectedFlatOption, raceBonuses, activeRaceTraits, raceChoiceConfig, classList, selectedClass,
            selectedSubclass, targetLevel, userChoices, subclassOptions, subclassUnlockLevel, activeFeatures,
            getHitDie, getAvailableOptions, getChoiceDetail, statLabels, selectableStats, scoreMethods,
            selectedScoreMethod, isOptionDisabled, getFlexCost, pointBuyBudget, currentPbCost, changePointBuy,
            standardArrayValues, rolledPool, hasRolled, isCapped20, isRolling, rollStats: handleRoll,
            statBonuses, finalAbilityScores, proficiencyBonus, handleOrbClick, scoreAllocations, draggedItem,
            assignScore, unassignScore, syncAllocationsFromStore, SKILL_DEFINITIONS, calculatedSkills, toggleSkill,
            skillBudget, expertiseBudget, raceSkillInfo, classSkillInfo, currentProfCount, currentExpertCount,
            avatarGallery, avatarList, showCustomAvatarInput, isGalleryExpanded, toggleGallery, galleryContainer,
            galleryButton, classResources, updateResource, handleRest, diceResult, rollD20, rollDamage,
            closeDiceResult, isSaveProficient, diceHistory, isHistoryOpen, clearHistory, toggleHistory,
            isInventoryOpen, calculatedAC, attackList, weaponList, armorList, toggleWeapon, setArmor, toggleShield,
            toggleWeaponProficiency, checkProficiencyRule, showWarningToast, isCustomWeaponFormOpen, customWeaponForm,
            saveCustomWeapon, isHpModalOpen, hpModalValue, maxHP, currentHP, hpStatusClass, setFullHp,
            adjustHpModalValue, applyHpChange,
            
            // Sürükle-Bırak İçin Eklenenler
            sheetTabs, handleTabDragStart, handleTabDragEnd, handleTabDrop
        };
    }
});
app.mount('#app');