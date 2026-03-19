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
import { calculateResources } from './src/logicResources.js';
import { 
    auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
    doc, getDoc, setDoc, 
    collection, getDocs, deleteDoc, // <--- YENİ EKLENENLER
    signInWithRedirect, // <--- BUNU EKLE
} from './src/firebaseConfig.js';

import { 
    DataLoader, 
    loadBackgroundData, 
    generateSeedFromStore, // <--- Bunu ekle
    encodeState            // <--- Bunu ekle
} from './src/dataLoaderKarYa.js';


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

        const isReadOnlyMode = ref(false); // <--- Setup'ın başına ekle
        
        // GLOBAL STORE
        window.store = store;

        // --- YARDIMCI: Başlık, İkon ve Meta Etiketleri Güncelle ---
        const updatePageMeta = () => {
            const charName = store.meta.name || "D&D Karakterim";
            const avatarUrl = store.meta.avatar;
            const fullUrl = window.location.href; // O anki seed'li tam link

            // 1. Sayfa Başlığını Güncelle
            document.title = charName;

            // 2. iOS Ana Ekran Başlığını Güncelle (Yoksa Yarat)
            let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
            if (!appleTitle) {
                appleTitle = document.createElement('meta');
                appleTitle.name = "apple-mobile-web-app-title";
                document.head.appendChild(appleTitle);
            }
            appleTitle.setAttribute("content", charName);

            // 3. Android/Desktop Uygulama Adını Güncelle (Yoksa Yarat)
            let appNameMeta = document.querySelector('meta[name="application-name"]');
            if (!appNameMeta) {
                appNameMeta = document.createElement('meta');
                appNameMeta.name = "application-name";
                document.head.appendChild(appNameMeta);
            }
            appNameMeta.setAttribute("content", charName);

            // 4. İkonları Güncelle
            if (avatarUrl && !avatarUrl.includes('default-avatar')) {
                const favicon = document.getElementById('dynamic-favicon');
                const appleIcon = document.getElementById('dynamic-apple-icon');
                
                if (favicon) favicon.href = avatarUrl;
                if (appleIcon) appleIcon.href = avatarUrl;
            }

            // 5. DİNAMİK MANIFEST OLUŞTUR 🚀
            // İkon altındaki isim (short_name) en fazla 12 karakter olmalı ki sığsın
            const shortName = charName.length > 12 ? charName.substring(0, 10) + ".." : charName;
            
            const dynamicManifest = {
                "name": charName, // Açılış ekranında (Splash) yazan isim
                "short_name": shortName, // İkonun altında yazan isim
                "start_url": fullUrl, 
                "display": "standalone",
                "background_color": "#1a1a1a",
                "theme_color": "#1a1a1a",
                "id": fullUrl, // Her karakterin ayrı bir uygulama gibi davranması için
                "icons": [
                    {
                        "src": avatarUrl || "../../img/SariZar.svg",
                        "sizes": "192x192",
                        "type": "image/jpeg"
                    },
                    {
                        "src": avatarUrl || "../../img/SariZar.svg",
                        "sizes": "512x512",
                        "type": "image/jpeg"
                    }
                ]
            };

            const stringManifest = JSON.stringify(dynamicManifest);
            const base64Manifest = btoa(unescape(encodeURIComponent(stringManifest)));
            const dataUri = 'data:application/json;base64,' + base64Manifest;

            let manifestLink = document.querySelector('link[rel="manifest"]');
            if (manifestLink) {
                manifestLink.setAttribute('href', dataUri);
            } else {
                let newLink = document.createElement('link');
                newLink.rel = 'manifest';
                newLink.href = dataUri;
                document.head.appendChild(newLink);
            }
        };

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
        const { classList, selectedClass, selectedSubclass, targetLevel, userChoices, subclassOptions, subclassUnlockLevel, activeFeatures, getHitDie, getAvailableOptions, getChoiceDetail } = useClassLogic();

        // ============================================================
        // 4. PUANLAR
        // ============================================================
        const { statLabels, selectableStats, scoreMethods, selectedScoreMethod, standardArrayValues, rolledPool, hasRolled, isCapped20, isRolling, pointBuyBudget, currentPbCost, getFlexCost, changePointBuy, rollStats, isOptionDisabled, statBonuses, finalAbilityScores, proficiencyBonus, scoreAllocations, draggedItem, assignScore, unassignScore, syncAllocationsFromStore, handleOrbClick } = useScoreLogic(raceBonuses);

        // ============================================================
        // 5. YETENEKLER
        // ============================================================
        const { SKILL_DEFINITIONS, raceSkillInfo, classSkillInfo, skillBudget, expertiseBudget, toggleSkill, calculatedSkills, currentProfCount, currentExpertCount } = useSkillLogic(finalAbilityScores, proficiencyBonus);
        const isSkillsExpanded = ref(window.innerWidth > 860);

        const classResources = computed(() => {
            return calculateResources(
                selectedClass.value,
                selectedSubclass.value,
                store.race.selected,
                targetLevel.value,
                finalAbilityScores.value // <--- İşte kilit nokta burası!
            );
        });

        // ============================================================
        // UI & SİSTEM DEĞİŞKENLERİ
        // ============================================================
        const currentStep = ref(0);
        const steps = [{ title: "Konsept" }, { title: "Irk" }, { title: "Sınıf" }, { title: "Stat" }, { title: "Geçmiş" }];
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
                        if (galleryContainer.value) galleryContainer.value.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
            }
        };

        // --- YENİ EKLENECEK KISIM BURADAN BAŞLIYOR ---
        const selectAvatar = (img) => {
            // 1. Resmi Store'a kaydet (Avatar anında değişir)
            store.meta.avatar = '../../img/avatars/' + img;
            
            // 2. Galeriyi KAPATMIYORUZ! 
            
            // 3. Anında yukarıdaki isim ve avatar çerçevesine odaklan
            nextTick(() => {
                const frame = document.querySelector('.hero-avatar-frame');
                if (frame) {
                    frame.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
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
        // KARAKTER KAYDETME & URL GÜNCELLEME (YENİ)
        // ============================================================

        const updateAppIcon = () => {
            const avatarUrl = store.meta.avatar;
            // Varsayılan veya boşsa işlem yapma
            if (!avatarUrl || avatarUrl.includes('default-avatar')) return; 

            console.log("🖼️ İkon güncelleniyor (ID Hedefli): ", avatarUrl);

            // 1. Favicon'u Güncelle (Browser Sekmesi)
            const favicon = document.getElementById('dynamic-favicon');
            if (favicon) {
                favicon.href = avatarUrl;
                // Tipini duruma göre ayarla (opsiyonel, genelde browser anlar)
                // favicon.type = "image/jpeg"; 
            }

            // 2. Apple Touch Icon'u Güncelle (iOS Ana Ekran)
            const appleIcon = document.getElementById('dynamic-apple-icon');
            if (appleIcon) {
                appleIcon.href = avatarUrl;
            }

            // 3. (Opsiyonel) Android/Shortcut için genel bir yaratma işlemi
            // Eğer yukarıdaki ID'ler yoksa veya Android farklı bir tag arıyorsa:
            let shortcutIcon = document.querySelector("link[rel='shortcut icon']");
            if (!shortcutIcon) {
                shortcutIcon = document.createElement('link');
                shortcutIcon.rel = 'shortcut icon';
                document.head.appendChild(shortcutIcon);
            }
            shortcutIcon.href = avatarUrl;
        };


       // --- GÜNCELLE / KAYDET FONKSİYONU (DÜZELTİLMİŞ & TEMİZLENMİŞ) ---
        // --- GÜNCELLE / KAYDET FONKSİYONU (FİNAL & GÜVENLİ) ---
        const saveCharacterState = async () => {
            
            // --- YENİ EKLENEN KISIM: MİSAFİR KONTROLÜ ---
            if (!user.value) {
                showToast("Karakterinizi kaydedebilmek için Google ile giriş yapın", "🔒");
                return; // Fonksiyonu burada durdur, aşağıya inme
            }
            // ---------------------------------------------

            isSaving.value = true;

            // --- YENİ EKLENEN KISIM: KULLANICI PROFİLİNİ KAYDET ---
            // Bu sayede Admin panelinde "Hayalet Doküman" sorunu olmaz.
            try {
                const userRef = doc(db, "users", user.value.uid);
                // Sadece temel bilgileri merge (birleştirme) ile yazıyoruz
                await setDoc(userRef, {
                    displayName: user.value.displayName,
                    email: user.value.email,
                    photoURL: user.value.photoURL,
                    lastSeen: new Date()
                }, { merge: true });
            } catch (err) {
                console.warn("Kullanıcı profili güncellenemedi:", err);
            }
        
            try {
                // 1. Store'daki eksikleri tamamla (Seed için gerekli)
                store.level = targetLevel.value; 
                store.choices = userChoices.value;
                store.scores = { method: selectedScoreMethod.value, pool: rolledPool.value };

                // 2. Seed'i oluştur (Bu bizim ana yedeğimiz)
                const seed = generateSeedFromStore(store);
                
                // -------------------------------------------------------------
                // FİNAL ÇÖZÜM: GÜVENLİ VERİ PAKETİ (SAFE PAYLOAD)
                // Tüm 'store'u kaydedince içindeki zengin metinler (nested array) hata veriyor.
                // Bu yüzden sadece ihtiyacımız olanları temiz bir paket yapıyoruz.
                // -------------------------------------------------------------
                const safePayload = {
                    // Kimlik Bilgileri
                    uid: user.value ? user.value.uid : null,
                    owner: user.value ? user.value.displayName : 'Anonim',
                    updated: new Date(),
                    
                    // ANAHTAR VERİ: Seed (Geri yüklerken karakteri bu kuracak)
                    seed: seed, 

                    // DİNAMİK VERİLER (Seed'in tutmadığı anlık değişimler)
                    hp: { ...store.hp },
                    resources: { ...store.resources },
                    inventory: JSON.parse(JSON.stringify(store.inventory)), // Derin kopya (Referans kopmasın)
                    spells: JSON.parse(JSON.stringify(store.spells || { known: [] })),
                    meta: { ...store.meta },
                    
                    // FIX: Zar geçmişi iç içe dizi olduğu için string olarak saklıyoruz
                    // Firestore [[1,2]] yapısını kabul etmez, ama "[ [1,2] ]" (string) kabul eder.
                    rolledPoolStr: JSON.stringify(rolledPool.value),
                    
                    // İleride lazım olabilecek basit bilgiler
                    raceName: store.race.selected ? store.race.selected.name : '',
                    className: store.class.selected ? store.class.selected.name : '',
                    level: targetLevel.value
                };
                // -------------------------------------------------------------

                // A. GİRİŞ YAPILMAMIŞSA (Sadece URL)
                if (!user.value) {
                    const statePart = encodeState(store);
                    const newUrl = `${window.location.pathname}?s=${seed}&st=${statePart}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);
                    
                    lastSavedData.value = JSON.stringify(store);
                    showToast("URL güncellendi! Linki kopyalayabilirsin. 🔗", "✅");
                } 
                
                // B. GİRİŞ YAPILMIŞSA (Firebase)
                else {
                    const urlParams = new URLSearchParams(window.location.search);
                    let charID = urlParams.get('charID');
                    
                    // ID yoksa isimden oluştur
                    if (!charID) {
                        const rawName = store.meta.name || 'adsiz'; 
                        const charNameSlug = rawName.toLowerCase()
                            .replace(/ /g, '-')
                            .replace(/[ıİğĞüÜşŞöÖçÇ]/g, (c) => ({'ı':'i','İ':'i','ğ':'g','Ğ':'g','ü':'u','Ü':'u','ş':'s','Ş':'s','ö':'o','Ö':'o','ç':'c','Ç':'c'}[c]));
                        charID = `${charNameSlug}-${Date.now().toString().slice(-6)}`;
                    }
                
                    // Veritabanı Referansı
                    const charRef = doc(db, "users", user.value.uid, "characters", charID);
                    
                    // YAZMA İŞLEMİ (SafePayload kullanıyoruz)
                    await setDoc(charRef, safePayload, { merge: true });
                
                    // URL Güncelleme
                    const newUrl = `${window.location.pathname}?uid=${user.value.uid}&charID=${charID}`;
                    window.history.pushState({ path: newUrl }, '', newUrl);
                    
                    lastSavedData.value = JSON.stringify(store);
                    showToast("Karakter Buluta Kaydedildi! ☁️", "✅");
                }
            
            } catch (error) {
                console.error("Kayıt Hatası Detayı:", error);
                // Kullanıcıya detaylı bilgi verelim
                if (error.code === 'invalid-argument') {
                    showToast("Veri formatı hatası! (Konsola bak)", "❌");
                } else {
                    showToast("Kaydederken bir hata oluştu!", "❌");
                }
            } finally {
                isSaving.value = false;
            }
        };

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

                // 1. Hemen güncelle
                updatePageMeta(); 

                // 2. Garanti olsun diye 1 saniye sonra tekrar zorla (iOS için)
                setTimeout(() => {
                    updatePageMeta();
                }, 1000);

                // Eğer bu işlem "Salt Okunur" modunda yapılıyorsa veya karakter kağıdı açılmalıysa:
                if (hasCreatedSheet.value) {
                    nextTick(() => {
                        currentStep.value = 99;
                        window.scrollTo(0, 0);
                    });
                }

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

        // --- BAŞKASININ KARAKTERİNİ YÜKLE (STANDART MOD) ---
        const loadExternalCharacter = async (targetUid, charID) => {
            loading.value = true;
            console.log("🔍 Karakter kopyası yükleniyor...", targetUid, charID);

            try {
                // 1. Veriyi Çek
                const docRef = doc(db, "users", targetUid, "characters", charID);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    console.log("✅ Veri bulundu.");
                    const data = docSnap.data();

                    // 2. Sayfayı Hazırla (Kağıt Modu)
                    hasCreatedSheet.value = true; 

                    // 3. Seed Varsa Yükle
                    if (data.seed) {
                        seedText.value = data.seed;
                        await nextTick();
                        loadFromSeed();
                    }

                    // 4. Güncel Verileri Üstüne Yaz
                    await nextTick();
                    
                    if(data.meta) store.meta = { ...store.meta, ...data.meta };
                    if(data.hp) store.hp = { ...store.hp, ...data.hp };
                    if(data.inventory) store.inventory = data.inventory;
                    
                    // 5. EKRANI ZORLA GÜNCELLE
                    currentStep.value = 99; // Sihirbazdan çık
                    
                    // Sayfa Başlığını Güncelle
                    updatePageMeta();

                    // ÖNEMLİ: Artık "Salt Okunur" demiyoruz.
                    // Giriş yapmamışsa sadece görüntüler, yapmışsa kendi hesabına kaydedebilir.
                    if (user.value) {
                         showToast("Karakter yüklendi! Kaydederek kopyasını alabilirsin.", "💾");
                    } else {
                         showToast("Karakter görüntüleniyor.", "👁️");
                    }

                } else {
                    console.error("❌ Veri bulunamadı.");
                    showToast("Karakter bulunamadı.", "❌");
                }
            } catch (error) {
                console.error("🔥 Yükleme Hatası:", error);
                showToast("Yükleme Hatası: " + error.message, "❌");
            } finally {
                loading.value = false;
            }
        };
        

        // 1. Modal Açma (Akıllı Varsayılan Değer)
        const handleRest = (type) => {
            if (type === 'short') {
                const hdRes = getHitDiceResource();
                // Zar var mı kontrolü (yoksa 0)
                const currentHD = store.resources['hit_dice'] !== undefined ? store.resources['hit_dice'] : (hdRes ? hdRes.max : 0);

                // Eğer can full ise varsayılan 0 olsun, değilse ve zar varsa 1 olsun
                if (currentHP.value >= maxHP.value) {
                    spendDiceCount.value = 0;
                } else {
                    // Can eksikse ve zarın varsa 1, yoksa 0
                    spendDiceCount.value = currentHD > 0 ? 1 : 0;
                }
                
                showRestModal.value = true;
            } 
            else if (type === 'long') {
                performLongRest();
            }
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

        // Yardımcı Fonksiyon: Can Zarı Kaynağını Bul
        const getHitDiceResource = () => {
            return classResources.value.find(r => r.id === 'hit_dice');
        };

        // --- Dinlenme Sistemi Değişkenleri ---
        const showRestModal = ref(false); // Modalı açıp kapatan kontrol
        const spendDiceCount = ref(1);    // Harcanacak zar sayısı

        // 1. UZUN DİNLENME (Long Rest)
        const performLongRest = () => {
            if(!confirm("Uzun dinlenme yapmak üzeresin. Canın fullenecek ve kaynaklar yenilenecek.")) return;

            // 1. Canı Fulle
            store.hp.current = maxHP.value; // maxHP computed'ını kullanıyoruz

            // 2. Tüm Kaynakları Resetle (Uzun Dinlenmede hepsi dolar)
            // classResources listesindeki her kaynağın max değerini store.resources'a yazıyoruz
            classResources.value.forEach(res => {
                // Eğer kaynak 'hit_dice' ise özel kural: Yarısı geri gelir
                if (res.id === 'hit_dice') {
                    const currentHD = store.resources['hit_dice'] || res.max;
                    const regained = Math.max(1, Math.floor(res.max / 2));
                    store.resources['hit_dice'] = Math.min(res.max, currentHD + regained);
                } 
                else if (res.reset === 'long' || res.reset === 'short') {
                    // Diğer tüm uzun/kısa dinlenme kaynaklarını fulle
                    store.resources[res.id] = res.max;
                }
            });

            showToast("Uzun dinlenme tamamlandı. Zinde uyandın! ☀️", "💤");
        };

        // 2. KISA DİNLENME (Short Rest) - Modal Açma
        const openShortRestModal = () => {
            if (store.hitDice.current <= 0) {
                alert("Hiç Can Zarın kalmadı! Kısa dinlenmede iyileşmek için zarın yok.");
                return;
            }
            spendDiceCount.value = 1; // Varsayılan 1 zar
            showRestModal.value = true;
        };

        // 3. KISA DİNLENME - Uygulama (Zar Atma ve İyileşme)
        const confirmShortRest = () => {
            const diceToSpend = parseInt(spendDiceCount.value);
            const hdRes = getHitDiceResource();
            const currentHD = store.resources['hit_dice'] !== undefined ? store.resources['hit_dice'] : hdRes.max;

            // Güvenlik: Olmayan zarı harcatma
            if (diceToSpend > currentHD) {
                showToast("Yeterli Can Zarın yok!", "⚠️");
                return;
            }

            let totalHeal = 0;
            let individualRolls = []; // Tek tek zarları tutacak dizi
            
            // Anlık Con Modunu al
            const conScore = finalAbilityScores.value ? finalAbilityScores.value.con : 10;
            const conMod = Math.floor((conScore - 10) / 2);

            if (diceToSpend > 0) {
                // Zar Tipi
                let dieFace = 8; 
                if (hdRes && hdRes.name) {
                    const match = hdRes.name.match(/d(\d+)/);
                    if (match) dieFace = parseInt(match[1]);
                }
                
                // Zarları At ve Kaydet
                for (let i = 0; i < diceToSpend; i++) {
                    const roll = Math.floor(Math.random() * dieFace) + 1;
                    individualRolls.push(roll); // Zarı kaydet
                    totalHeal += Math.max(0, roll + conMod); // İyileşmeyi hesapla
                }

                // Canı ve Zarları Güncelle
                store.hp.current = Math.min(maxHP.value, currentHP.value + totalHeal);
                store.resources['hit_dice'] = currentHD - diceToSpend;

                // --- ZAR GEÇMİŞİNE EKLEME ---
                // diceHistory setup içinde useDiceLogic'ten geliyor, reactive bir ref'tir.
                if (diceHistory && diceHistory.value) {
                    diceHistory.value.unshift({
                        id: Date.now(),
                        source: `Kısa Dinlenme (${diceToSpend}d${dieFace})`,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        // baseRoll html'de string olarak da gösterilebilir.
                        // Örn: (3, 5) şeklinde zarları gösterelim
                        baseRoll: `(${individualRolls.join(', ')})`, 
                        modifier: conMod * diceToSpend, // Toplam Con bonusu
                        total: totalHeal,
                        isCrit: false, // İyileşmede kritik olmaz
                        isFail: false
                    });
                    
                    // İstersen sonuçları görmek için paneli otomatik aç:
                    isHistoryOpen.value = true;
                }
                // -----------------------------
            }

            // Kısa Dinlenme Kaynaklarını (Warlock vb.) Her Zaman Yenile
            let refreshedCount = 0;
            classResources.value.forEach(res => {
                if (res.reset === 'short') {
                    store.resources[res.id] = res.max;
                    refreshedCount++;
                }
            });

            showRestModal.value = false;
            
            if (totalHeal > 0) {
                showToast(`Dinlenme: +${totalHeal} Can`, "☕");
            } else {
                showToast("Kısa molan bitti.", "☕");
            }
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


        const user = ref(null); // <--- İşte hataya sebep olan eksik değişken

        // --- KARAKTER SLOT SİSTEMİ ---
        const characterSlots = ref(Array(6).fill(null)); // 6 Boş Slot
        const isLoadingSlots = ref(false);

        // Karakterleri Veritabanından Çek
        const fetchUserCharacters = async () => {
            if (!user.value) {
                characterSlots.value = Array(6).fill(null);
                return;
            }
            
            isLoadingSlots.value = true;
            try {
                // users/{uid}/characters koleksiyonuna git
                const charsRef = collection(db, "users", user.value.uid, "characters");
                const snapshot = await getDocs(charsRef);
                
                // Gelen verileri sırayla slotlara yerleştir
                const loadedChars = [];
                snapshot.forEach(doc => {
                    loadedChars.push({ id: doc.id, ...doc.data() });
                });

                // Slotları doldur (Maksimum 6 tane)
                const newSlots = Array(6).fill(null);
                loadedChars.slice(0, 6).forEach((char, i) => {
                    newSlots[i] = char;
                });
                characterSlots.value = newSlots;

            } catch (error) {
                console.error("Karakter listesi alınamadı:", error);
                showToast("Karakterler yüklenemedi.", "❌");
            } finally {
                isLoadingSlots.value = false;
            }
        };

        // Kullanıcı giriş yapınca listeyi otomatik çek
        watch(user, (newUser) => {
            if (newUser) fetchUserCharacters();
            else characterSlots.value = Array(6).fill(null);
        });

        // --- SLOT SEÇİM VE SIFIRLAMA MANTIĞI (GARANTİLİ YÖNTEM) ---
        const handleSlotSelect = async (slotIndex, charData) => {
            if (charData) {
                // A. VAR OLAN KARAKTERİ YÜKLE (Soft Load - Sayfa Yenilenmez)
                // Burası zaten çalışıyordu, aynen koruyoruz.
                if (charData.seed) {
                    seedText.value = charData.seed;
                    loadFromSeed();
                }
                if(charData.meta) store.meta = charData.meta;
                
                const newUrl = `${window.location.pathname}?uid=${user.value.uid}&charID=${charData.id}`;
                window.history.pushState({ path: newUrl }, '', newUrl);
                
                // Karakter kağıdını aktif et
                hasCreatedSheet.value = true; 
                
                showToast(`${charData.meta?.name || 'Karakter'} yüklendi.`, "📂");

            } else {
                // B. YENİ KARAKTER YARAT (HARD RELOAD - SAYFA YENİLENİR)
                // Değişkenleri tek tek sıfırlamak yerine, sayfayı yenilemek en temiz çözümdür.
                
                // 1. URL'deki ID'leri ve parametreleri temizle (Sadece ana domain kalsın)
                const cleanUrl = window.location.pathname;

                // Tarayıcının "Kaydedilmemiş değişiklik var" uyarısını sustur
                window.onbeforeunload = null;

                // 2. Sayfayı bu temiz adrese gitmeye zorla
                // Bu işlem sayfayı yeniler ve uygulamayı "fabrika ayarlarına" döndürür.
                window.location.href = cleanUrl;
            }
        };

        // Karakter Silme
        const deleteCharacter = async (charID) => {
            if(!confirm("Bu karakter kalıcı olarak silinecek! Emin misin?")) return;
            
            try {
                await deleteDoc(doc(db, "users", user.value.uid, "characters", charID));
                showToast("Karakter silindi.", "🗑️");
                fetchUserCharacters(); // Listeyi yenile
            } catch (e) {
                showToast("Silinemedi!", "❌");
            }
        };

        const isSaving = ref(false);
        const lastSavedData = ref(null);

        // Kullanıcı Durumunu İzle
        onAuthStateChanged(auth, (currentUser) => {
            user.value = currentUser;
            if (currentUser) {
                showToast(`Hoşgeldin, ${currentUser.displayName}! 👋`);
            }
        });

        // Giriş Yap (Popup yerine Redirect deneniyor)
        const handleLogin = async () => {
            try {
                // Önce Popup dene (Masaüstü için daha iyi)
                await signInWithPopup(auth, googleProvider);
            } catch (error) {
                // Eğer Popup engellenirse, Redirect (Yönlendirme) dene
                if (error.code === 'auth/popup-blocked') {
                    console.warn("Popup engellendi, yönlendirme deneniyor...");
                    await signInWithRedirect(auth, googleProvider);
                } else {
                    console.error("Giriş hatası:", error);
                    showToast("Giriş yapılamadı: " + error.message, "❌");
                }
            }
        };

        // Çıkış Yap
        const handleLogout = async () => {
            if(!confirm("Çıkış yapmak istediğine emin misin?")) return;
            await signOut(auth);
            showToast("Güle güle! 👋");
        };

        const hasUnsavedChanges = computed(() => {
            if (!lastSavedData.value) return true; 
            return JSON.stringify(store) !== lastSavedData.value;
        });

        // --- PROFİL & KARAKTER DEĞİŞTİRME MODALI ---
        const isProfileModalOpen = ref(false);

        const openProfileModal = () => {
            // Modalı açmadan önce listeyi tazeleyelim ki yeni karakterler görünsün
            fetchUserCharacters(); 
            isProfileModalOpen.value = true;
        };

        // YENİLİK: Konsept adımına (Step 0) dönüldüğünde listeyi OTOMATİK yenile
        watch(currentStep, (newStep) => {
            if (newStep === 0 && user.value) {
                fetchUserCharacters();
            }
        });

        // Slot Seçildiğinde Modalı da Kapat (Ekstra İşlem)
        const handleProfileSlotSelect = (index, char) => {
            handleSlotSelect(index, char); // Mevcut mantığı çalıştır
            isProfileModalOpen.value = false; // Modalı kapat
        };

        // ------------------------------------------------------------
        // ============================================================
        // LIFE CYCLE (VERİ YÜKLEME)
        // ============================================================
        onMounted(async () => {
            document.addEventListener('click', handleClickOutside);
            window.addEventListener('resize', () => {
                isSkillsExpanded.value = window.innerWidth > 860;
            });

            // 1. URL Parametrelerini Al (Hem standart hem Admin linklerini destekle)
            const urlParams = new URLSearchParams(window.location.search);
            
            const urlSeed = urlParams.get('seed');
            
            // BURASI GÜNCELLENDİ: Hem 'uid' hem 'loadUser' parametresine bakıyoruz
            const urlUid = urlParams.get('uid') || urlParams.get('loadUser'); 
            
            // BURASI GÜNCELLENDİ: Hem 'charID' hem 'loadChar' parametresine bakıyoruz
            const urlCharID = urlParams.get('charID') || urlParams.get('loadChar');

            // Varsayılan avatar kontrolü
            if (!store.meta.avatar || typeof store.meta.avatar !== 'string') {
                store.meta.avatar = "../../img/avatars/default-avatar.png";
            }

           try {
                // --- VERİLERİ YÜKLE ---
                
                // 1. Sınıfları Yükle ve Sırala
                const classData = await DataLoader.getClassData();
                classList.value = (classData.class || []).sort((a, b) => a.name.localeCompare(b.name, 'tr'));
                
                // 2. Irkları Yükle ve Sırala
                const raceData = await DataLoader.loadJSON('races.json');
                const rawRaceList = Array.isArray(raceData) ? raceData : (raceData.race || []);
                raceList.value = rawRaceList.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
                
                // 3. Geçmişleri Yükle ve Sırala
                const bgData = await loadBackgroundData();
                backgroundList.value = (bgData || []).sort((a, b) => a.name.localeCompare(b.name, 'tr'));

                // 4. Yetenekleri (Feats) Yükle
                await DataLoader.getFeatsData().then(data => {
                    store.data.feats = data;
                    console.log("Feats yüklendi:", data.length);
                });

                // Yükleme ekranını kaldır
                loading.value = false;
                const loader = document.getElementById('initial-loader');
                if(loader) { loader.classList.add('fade-out'); setTimeout(() => loader.remove(), 500); }

            } catch (err) { 
                console.error("Veri Yükleme Hatası:", err);
                error.value = "Veri hatası"; 
                loading.value = false; 
                document.getElementById('initial-loader')?.remove(); 
            }

            // --- KARAKTER YÜKLEME MANTIĞI (Beklemeli) ---
            // Verilerin (Irk, Sınıf) tam yüklendiğinden emin olana kadar bekle
            const checkDataLoaded = setInterval(async () => {
                if (raceList.value.length > 0 && classList.value.length > 0) {
                    clearInterval(checkDataLoaded);
                    
                    console.log("✅ Veriler hazır, URL kontrol ediliyor...");

                    // SENARYO A: Firebase ID ile Yükleme (Öncelikli)
                    if (urlUid && urlCharID) {
                        // Giriş yapmış kullanıcı biz miyiz?
                        if (user.value && user.value.uid === urlUid) {
                            // Bizim karakterimiz -> Normal akış (Bir şey yapmaya gerek yok)
                        } else {
                            // Başkasının karakteri veya Gizli Sekme -> Salt Okunur Yükle
                            await loadExternalCharacter(urlUid, urlCharID);
                        }
                    }
                    // SENARYO B: Seed ile Yükleme (ID yoksa buna bak)
                    else if (urlSeed) {
                        console.log("🌱 Seed bulundu, yükleniyor...");
                        seedText.value = urlSeed;
                        // Vue'nun güncellenmesini bekle ve yükle
                        setTimeout(() => loadFromSeed(), 100);
                    }
                }
            }, 100); // 100ms'de bir kontrol et
        });

        onUnmounted(() => { document.removeEventListener('click', handleClickOutside); });

        // ============================================================
        // RETURN OBJECT
        // ============================================================
        return {
            store, currentStep, steps, nextStep, prevStep, loading, error,
            isMobileMenuOpen, toggleMobileMenu, isMobileSheetOpen, toggleMobileSheet,
            copyLink, showToast, backgroundList, 
            saveCharacterState,

            // --- EKSİK OLAN SATIRLAR BURASI ---
            // Bunları eklemezsen o sarı hataları alırsın ve butonlar çalışmaz
            user,
            handleLogin,
            handleLogout,
            isSaving,
            hasUnsavedChanges,
            // ----------------------------------
            
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
            selectAvatar,
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

            performLongRest,
            openShortRestModal,
            confirmShortRest,
            showRestModal,
            spendDiceCount,
            currentBgFeature,

            characterSlots,
            isLoadingSlots,
            handleSlotSelect,
            deleteCharacter,

            isProfileModalOpen,    
            openProfileModal,      
            handleProfileSlotSelect,

        };
    }
});
app.mount('#app');