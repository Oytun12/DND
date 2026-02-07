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
import { weaponList as dbWeapons, armorList as dbArmors, gearList as dbGear } from './src/data/items.js';
import { useDiceLogic } from './src/logicDice.js';
import { useInventoryLogic } from './src/logicInventory.js';
import { useSpellLogic } from './src/logicSpells.js'; 
import { useBackgroundLogic } from './src/logicBackground.js';

// ============================================================
// DÜZELTME BURADA: loadBackgroundData FONKSİYONU EKLENDİ
// ============================================================
import { DataLoader, loadBackgroundData } from './src/dataLoaderKarYa.js'; 

// --- GLOBAL ONAY YÖNETİCİSİ ---
let activeConfirmListener = null;

window.customConfirm = (message, onConfirm) => {
    const modal = document.getElementById('global-confirm-modal');
    const textEl = document.getElementById('global-confirm-text');
    const yesBtn = document.getElementById('btn-global-yes');

    if (!modal || !textEl || !yesBtn) return;

    textEl.innerText = message || "Bu işlem geri alınamaz. Emin misiniz?";
    modal.classList.remove('hidden');
    yesBtn.focus();

    if (activeConfirmListener) document.removeEventListener('keydown', activeConfirmListener);

    activeConfirmListener = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); yesBtn.click(); }
        if (e.key === 'Escape') { window.closeConfirmModal(); }
    };

    document.addEventListener('keydown', activeConfirmListener);

    yesBtn.onclick = () => {
        onConfirm(); 
        window.closeConfirmModal(); 
    };
};

window.closeConfirmModal = () => {
    document.getElementById('global-confirm-modal').classList.add('hidden');
    if (activeConfirmListener) {
        document.removeEventListener('keydown', activeConfirmListener);
        activeConfirmListener = null;
    }
};

const app = createApp({
    setup() {
        
        // GLOBAL STORE
        window.store = store;

        // ============================================================
        // 1. GENEL SAYFA MANTIĞI
        // ============================================================
        // DÜZELTİLMİŞ HALİ:
        const { isSheetMode, activeSheetTab, finishCreation, hasCreatedSheet, activeFeatureSubTab, activeDescSubTab } = useCharacterSheet();
        const activeInventoryTab = ref('owned'); 
        
        // --- SEKME (TAB) YÖNETİMİ ---
        const sheetTabs = ref([
            { id: 'actions',    label: 'Aksiyonlar',  icon: dndIcons.actions },
            { id: 'spells',     label: 'Büyüler',     icon: dndIcons.spells },
            { id: 'inventory',  label: 'Envanter',    icon: dndIcons.inventory },
            { id: 'features',   label: 'Özellikler',  icon: dndIcons.features },
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

        // --- MOBİL DOKUNMATİK SÜRÜKLEME (TOUCH EVENTS) ---
        const handleTouchStart = (evt, tabId) => {
            draggingTabId.value = tabId;
            evt.target.style.opacity = '0.5'; // Görsel geri bildirim
            // Mobilde kaydırmayı engellemek istemiyoruz, o yüzden preventDefault yapmıyoruz.
        };

        const handleTouchEnd = (evt) => {
            evt.target.style.opacity = '1'; // Opaklığı düzelt
            
            // Parmağın kalktığı noktadaki elementi bul
            const touch = evt.changedTouches[0];
            const realTarget = document.elementFromPoint(touch.clientX, touch.clientY);
            
            if (realTarget) {
                // Dokunulan yer bir buton mu (veya butonun içindeki ikon/yazı mı)?
                // .closest('button') ile en yakın butonu buluyoruz.
                const targetBtn = realTarget.closest('button[data-tab-id]');
                
                if (targetBtn) {
                    const targetId = targetBtn.getAttribute('data-tab-id');
                    
                    // Eğer üzerine bırakılan tab farklıysa yer değiştir
                    if (targetId && targetId !== draggingTabId.value) {
                        const fromIndex = sheetTabs.value.findIndex(t => t.id === draggingTabId.value);
                        const toIndex = sheetTabs.value.findIndex(t => t.id === targetId);
                        
                        if (fromIndex !== -1 && toIndex !== -1) {
                            const item = sheetTabs.value.splice(fromIndex, 1)[0];
                            sheetTabs.value.splice(toIndex, 0, item);
                        }
                    }
                }
            }
            draggingTabId.value = null;
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
        // featList artık dinamik olarak store.data.feats'ten gelecek
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
                tabs: sheetTabs.value.map(t => t.id) 
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
                
                // Temel Veriler
                store.meta.name = data.n || ""; 
                store.meta.avatar = data.av || "../../img/avatars/default-avatar.png";
                targetLevel.value = data.l || 1; 
                
                // Irk ve Sınıf Seçimleri
                if (data.r) {
                    const tSub = data.sr || "Standart";
                    const fOpt = flatRaceList.value.find(o => o.race.name === data.r && (o.subrace ? (o.subrace.name||"Standart") : "Standart") === tSub);
                    if (fOpt) { selectedFlatOption.value = fOpt; if (data.ac) setTimeout(() => { store.race.abilityChoices = { ...data.ac }; }, 100); }
                }            
                if (data.c) {
                    const fCls = classList.value.find(x => x.name === data.c);
                    if (fCls) { selectedClass.value = fCls; setTimeout(() => { if (data.sc) selectedSubclass.value = fCls.subclasses?.find(s => s.name === data.sc); }, 100); }
                }                

                // Skorlar ve Seçimler
                selectedScoreMethod.value = data.sm || 'manual';
                if (data.rp) { rolledPool.value = [...data.rp]; hasRolled.value = true; }
                store.abilities.base = { ...data.b }; 
                store.abilities.asi = { ...data.asi };
                if (data.bg) store.background.selected = backgroundList.value.find(x => x.name === data.bg);
                store.skills.proficiencies = [...(data.p || [])]; 
                store.skills.expertises = [...(data.e || [])];
                userChoices.value = { ...data.ch }; 
                
                // HP
                if (data.hp) store.hp = { ...store.hp, ...data.hp };

                // Envanter
                if (data.inv) {
                    if (!store.inventory) store.inventory = {};
                    store.inventory.weapons = Array.isArray(data.inv.weapons) ? data.inv.weapons : [];
                    store.inventory.armor = Array.isArray(data.inv.armor) ? data.inv.armor : [];
                    store.inventory.gear = Array.isArray(data.inv.gear) ? data.inv.gear : [];
                    store.inventory.currency = data.inv.currency || { cp:0, sp:0, ep:0, gp:0, pp:0 };
                } else {
                    store.inventory = { weapons: [], armor: [], gear: [], currency: { cp:0, sp:0, ep:0, gp:0, pp:0 } };
                }

                // Büyüler
                if (data.spl && Array.isArray(data.spl)) {
                    if (!store.spells) store.spells = { known: [] };
                    store.spells.known = [...data.spl];
                    setTimeout(() => {
                         if(typeof window.renderMySpellList === 'function') window.renderMySpellList(); 
                    }, 500);
                }

                // Tab Sırası
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
            } catch (e) { 
                console.error("Yükleme Hatası:", e); 
                showToast("Hata! Kod bozuk.", "❌"); 
            }
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
            const cls = selectedClass.value; 
            if (!cls || !cls.proficiency) return false;
            
            const profs = cls.proficiency.map(p => p.toLowerCase().trim());
            const map = { 
                str: ['str', 'güç', 'strength', 'kuvvet', 'kuv', 'saving throw: str'], 
                dex: ['dex', 'çev', 'dexterity', 'agility', 'ceviklik', 'çeviklik'], 
                con: ['con', 'day', 'constitution', 'bünye', 'dayaniklilik', 'dayanıklılık'], 
                int: ['int', 'zek', 'intelligence', 'zeka'], 
                wis: ['wis', 'akı', 'wisdom', 'bilgelik', 'sezgi', 'akil', 'akıl', 'aki'], 
                cha: ['cha', 'kar', 'charisma', 'karizma'] 
            };
            
            if (!map[key]) return false;
            return map[key].some(term => profs.some(p => p.includes(term)));
        };

        const spellAttackMod = computed(() => {
            if (!selectedClass.value) return 0;
            const clsName = selectedClass.value.name;
            let attr = 'int'; 

            const map = {
                'Büyücü': 'int', 'Sihirbaz': 'int', 'Wizard': 'int', 'Rogue': 'int', 'Fighter': 'int', 'Artificer': 'int',
                'Rahip': 'wis', 'Druid': 'wis', 'Korucu': 'wis', 'Keşiş': 'wis', 'Cleric': 'wis', 'Ranger': 'wis', 'Monk': 'wis',
                'Ozan': 'cha', 'Paladin': 'cha', 'Sihirbaz (Sorcerer)': 'cha', 'Sorcerer': 'cha', 'Warlock': 'cha', 'Barbar': 'cha'
            };

            if (selectedClass.value.spellAbility) {
                attr = selectedClass.value.spellAbility.toLowerCase();
            } else if (map[clsName]) {
                attr = map[clsName];
            }

            const score = finalAbilityScores.value[attr] || 10;
            const mod = Math.floor((score - 10) / 2);
            return mod + proficiencyBonus.value;
        });

        const isInventoryOpen = ref(false); 

        // ============================================================
        // 6. ENVANTER
        // ============================================================
        const isCustomItemModalOpen = ref(false);
        const newItemType = ref('weapon'); 
        const itemSearchTerm = ref(""); 
        const activeSort = ref('az'); 
        const activeFilter = ref('all'); 

        const newWeapon = ref({ name: '', dmg: '1d6', type: 'Kesici', stat: 'str', weight: 2, bonusHit: 0, bonusDmg: 0 });
        const newArmor = ref({ name: '', ac: 11, type: 'Hafif', weight: 8 });
        const newGear = ref({ name: '', qty: 1, weight: 0.5 });

        const { 
            activeInvTab, currentWeight, carryCapacity, encumbrancePct,
            weapons, armors, gear, currency,
            addWeapon, addArmor, addGear, removeItem, attackList, calculatedAC,
            handleArmorEquip, getArmorMechanicText 
        } = useInventoryLogic(finalAbilityScores, proficiencyBonus, selectedClass, selectedRace);

        const activeModalTab = ref('list'); 

        const openItemModal = (type) => { 
            newItemType.value = type; 
            itemSearchTerm.value = ""; 
            activeSort.value = 'az'; 
            activeFilter.value = 'all'; 
            activeModalTab.value = 'list'; 
            
            newWeapon.value = { name: '', dmg: '1d6', type: 'Kesici', stat: 'str', weight: 2, bonusHit: 0, bonusDmg: 0 };
            newArmor.value = { name: '', ac: 11, type: 'Hafif', weight: 8 };
            newGear.value = { name: '', qty: 1, weight: 0.5 };
            
            isCustomItemModalOpen.value = true; 
        };

        const activeSpellModalTab = ref('list'); 
        
        const newCustomSpell = ref({
            name: '', level: 0, school: 'E', castingTime: '1 Aksiyon', range: '60 ft',
            components: 'V, S', duration: 'Anlık', description: '', hasAttack: false, damageDice: '', damageType: 'Ateş'
        });

        const openSpellModal = async () => {
            document.getElementById('modal-spell-search').classList.remove('hidden');
            activeSpellModalTab.value = 'list'; 
            newCustomSpell.value = { 
                name: '', level: 0, school: 'E', castingTime: '1 Aksiyon', range: '60 ft', 
                components: 'V, S', duration: 'Anlık', description: '', 
                hasAttack: false, damageDice: '', damageType: 'Ateş' 
            };
            if (!window.ALL_DATA || !window.ALL_DATA.spells) await window.loadSpellData(); 
            if(window.populateClassFilter) window.populateClassFilter();
            if(window.setupModalListeners) window.setupModalListeners();
            if(window.filterAndRenderModalSpells) window.filterAndRenderModalSpells();
        };

        const createCustomSpell = () => {
            const s = newCustomSpell.value;
            if(!s.name) { showToast("Büyü ismi gerekli!", "⚠️"); return; }
            let finalEntries = [s.description];
            let mechanicText = "";
            if (s.hasAttack) { mechanicText += `Make a spell attack. `; }
            if (s.damageDice) { mechanicText += `Hit: {@damage ${s.damageDice}} ${s.damageType} damage.`; }
            if (mechanicText) { finalEntries.push(mechanicText); }
            const spellObj = {
                name: s.name, level: s.level, school: s.school,
                time: [{ number: 1, unit: s.castingTime }],
                range: { type: "point", distance: { type: "ft", amount: parseInt(s.range) || 0 } },
                components: { v: s.components.includes('V'), s: s.components.includes('S'), m: s.components.includes('M') },
                duration: [{ type: "timed", duration: { type: "minute", amount: 1 } }],
                entries: finalEntries, isCustom: true
            };
            if (!store.spells.known) store.spells.known = [];
            store.spells.known.push(spellObj);
            showToast(`${s.name} Büyü Kitabına Yazıldı!`, "✨");
            if(window.renderSpellTab) window.renderSpellTab(finalAbilityScores.value, targetLevel.value);
            activeSpellModalTab.value = 'list';
        };

        const handleAddItem = () => {
            if (newItemType.value === 'weapon') {
                if (!newWeapon.value.name) { showToast("Silah ismi girin!", "⚠️"); return; }
                addWeapon({ ...newWeapon.value, isProficient: true });
                showToast(`${newWeapon.value.name} Eklendi!`, "⚔️");
            } 
            else if (newItemType.value === 'armor') {
                if (!newArmor.value.name) { showToast("Zırh ismi girin!", "⚠️"); return; }
                addArmor({ ...newArmor.value });
                showToast(`${newArmor.value.name} Eklendi!`, "🛡️");
            } 
            else {
                if (!newGear.value.name) { showToast("Eşya ismi girin!", "⚠️"); return; }
                addGear({ ...newGear.value });
                showToast(`${newGear.value.name} Eklendi!`, "🎒");
            }
            isCustomItemModalOpen.value = false;
        };
        
        const selectItem = (item) => {
            if (newItemType.value === 'weapon') {
                addWeapon({ name: item.name, dmg: item.dmg, type: item.type, stat: item.stat, weight: item.weight, isProficient: true });
                showToast(`${item.name} Eklendi!`, "⚔️");
            } 
            else if (newItemType.value === 'armor') {
                addArmor({ name: item.name, ac: item.ac, type: item.type, weight: item.weight });
                showToast(`${item.name} Eklendi!`, "🛡️");
            } 
            else {
                addGear({ name: item.name, qty: 1, weight: item.weight });
                showToast(`${item.name} Eklendi!`, "🎒");
            }
        };

        const filteredDbWeapons = computed(() => {
            let list = (dbWeapons || []).filter(i => i.name.toLowerCase().includes(itemSearchTerm.value.toLowerCase()));
            if (activeFilter.value !== 'all') { list = list.filter(i => i.category === activeFilter.value); }
            return list.sort((a, b) => {
                if (activeSort.value === 'az') return a.name.localeCompare(b.name);
                if (activeSort.value === 'za') return b.name.localeCompare(a.name);
                if (activeSort.value === 'weight_asc') return a.weight - b.weight;
                if (activeSort.value === 'weight_desc') return b.weight - a.weight;
                return 0;
            });
        });

        const filteredDbArmors = computed(() => {
            let list = (dbArmors || []).filter(i => i.name.toLowerCase().includes(itemSearchTerm.value.toLowerCase()));
            if (activeFilter.value !== 'all') { list = list.filter(i => i.type === activeFilter.value); }
            return list.sort((a, b) => {
                if (activeSort.value === 'az') return a.name.localeCompare(b.name);
                if (activeSort.value === 'za') return b.name.localeCompare(a.name);
                if (activeSort.value === 'ac_asc') return a.ac - b.ac; 
                if (activeSort.value === 'ac_desc') return b.ac - a.ac; 
                if (activeSort.value === 'weight_asc') return a.weight - b.weight;
                if (activeSort.value === 'weight_desc') return b.weight - a.weight;
                return 0;
            });
        });

        const filteredDbGear = computed(() => {
            let list = (dbGear || []).filter(i => i.name.toLowerCase().includes(itemSearchTerm.value.toLowerCase()));
            return list.sort((a, b) => {
                if (activeSort.value === 'az') return a.name.localeCompare(b.name);
                if (activeSort.value === 'za') return b.name.localeCompare(a.name);
                if (activeSort.value === 'weight_asc') return a.weight - b.weight;
                if (activeSort.value === 'weight_desc') return b.weight - a.weight;
                return 0;
            });
        });

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

        const deathSaves = ref({ successes: 0, failures: 0 });
        watch(currentHP, (newVal) => {
            if (newVal > 0) { deathSaves.value.successes = 0; deathSaves.value.failures = 0; }
        });

        const addDeathSave = (type) => {
            if (type === 'success') {
                if (deathSaves.value.successes < 3) deathSaves.value.successes++;
                if (deathSaves.value.successes === 3) {
                    showToast("3 Başarı! Hayata döndün! ✨", "💖");
                    setTimeout(() => { currentHP.value = 1; }, 500);
                }
            } else {
                if (deathSaves.value.failures < 3) deathSaves.value.failures++;
                if (deathSaves.value.failures === 3) { showToast("Karakter Öldü... 💀", "❌"); }
            }
        };

        const toggleDeathSave = (type, index) => {
            const currentVal = type === 'success' ? deathSaves.value.successes : deathSaves.value.failures;
            if (index < currentVal) {
                if (type === 'success') deathSaves.value.successes = index;
                else deathSaves.value.failures = index;
            } else { addDeathSave(type); }
        };

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
        // YENİ EKLENEN KISIM: Background Feature Hesaplama
        // ============================================================
        const currentBgFeature = computed(() => {
            const bg = store.background.selected;
            if (!bg || !bg.entries) return null;

            const featureEntry = bg.entries.find(entry => 
                (entry.data && entry.data.isFeature === true) || 
                (entry.name && entry.name.startsWith("Özellik"))
            );

            if (!featureEntry) return null;

            let description = "";
            if (Array.isArray(featureEntry.entries)) {
                description = featureEntry.entries
                    .filter(e => typeof e === 'string') 
                    .join('<br><br>'); 
            } else {
                description = featureEntry.entries || "";
            }

            return {
                name: featureEntry.name,
                description: description
            };
        });

        // ============================================================
        // 9. GEÇMİŞ (BACKGROUND) MANTIĞI (YENİ)
        // ============================================================
        const { activeBackgroundContent, activeBackgroundFeature } = useBackgroundLogic();

        // ============================================================
        // LIFE CYCLE (VERİ YÜKLEME)
        // ============================================================
        onMounted(async () => {
            document.addEventListener('click', handleClickOutside);
            if (!store.meta.avatar || typeof store.meta.avatar !== 'string') store.meta.avatar = "../../img/avatars/default-avatar.png";

            try {
                // --- YENİ VERİ YÜKLEME YAPISI ---
                // 1. Önce verileri yükle
                const classData = await DataLoader.getClassData();
                classList.value = classData.class || [];
                
                const raceData = await DataLoader.loadJSON('races.json');
                raceList.value = Array.isArray(raceData) ? raceData : (raceData.race || []);
                
                // Artık loadBackgroundData doğru import edildiği için çalışacak
                const bgData = await loadBackgroundData();
                backgroundList.value = bgData || [];

                // Feat'leri de yükle (Store'a atar)
                await DataLoader.getFeatsData().then(data => {
                    store.data.feats = data;
                    console.log("Feats yüklendi:", data.length);
                });

                loading.value = false;
                const loader = document.getElementById('initial-loader');
                if(loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 500); }

                const urlParams = new URLSearchParams(window.location.search);
                const urlSeed = urlParams.get('seed');
                if (urlSeed) { seedText.value = urlSeed; setTimeout(() => loadFromSeed(), 500); }
            } catch (err) { 
                console.error("Yükleme Hatası:", err);
                error.value = "Veri hatası"; 
                loading.value = false; 
                document.getElementById('initial-loader')?.remove(); 
            }
        
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
            copyLink, showToast, backgroundList, 
            seedText, characterSeed, loadFromSeed, copySeed,
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
            isInventoryOpen, isHpModalOpen, hpModalValue, maxHP, currentHP, hpStatusClass, setFullHp,
            adjustHpModalValue, applyHpChange, spellAttackMod,
            activeSpellModalTab, newCustomSpell, createCustomSpell, openSpellModal,
            deathSaves, toggleDeathSave, addDeathSave,
            isCustomItemModalOpen, newItemType, itemSearchTerm,
            filteredDbWeapons, filteredDbArmors, filteredDbGear, selectItem,
            openItemModal, activeSort, activeFilter,
            activeInvTab, currentWeight, carryCapacity, encumbrancePct, 
            weapons, armors, gear, currency, removeItem, 
            calculatedAC, attackList, handleArmorEquip, getArmorMechanicText,
            activeModalTab, handleAddItem, newWeapon, newArmor, newGear,
            sheetTabs, handleTabDragStart, handleTabDragEnd, handleTabDrop,
            handleTouchStart, handleTouchEnd,
            activeBackgroundContent,
            activeBackgroundFeature,
            activeDescSubTab,
        };
    }
});
app.mount('#app');