/* ============================================================
   SAVAŞ TAKİPÇİSİ (FAZ 2.1 - HATA DÜZELTMELERİ & OYUNCU DETAYLARI)
   ============================================================ */

window.initCombatTracker = async function(panelEl, panelData, saveCallback) {
    const wrapper = panelEl.querySelector('.combat-tracker-wrapper');
    if (!wrapper) return;

    if (typeof panelData.isCombatActive === 'undefined') panelData.isCombatActive = false;
    if (typeof panelData.isMetaHidden === 'undefined') panelData.isMetaHidden = false; 
    if (!panelData.roomCode) panelData.roomCode = "";
    if (!panelData.combatants) panelData.combatants = [];
    if (!panelData.customMonsters) panelData.customMonsters = []; 
    if (typeof panelData.round === 'undefined') panelData.round = 0;
    if (typeof panelData.activeTurnIndex === 'undefined') panelData.activeTurnIndex = -1;

    const ACTIVE_SOURCES = [
        "bestiary-mm.json", "bestiary-mpmm.json", "bestiary-phb.json" // Sadece ana kaynaklar
    ];

    let MONSTER_DB = [];
    const fetchPromises = ACTIVE_SOURCES.map(async (filename) => {
        try {
            const res = await fetch(`../Data/bestiary/${filename}`);
            if (res.ok) {
                const data = await res.json();
                if (data.monster) MONSTER_DB.push(...data.monster);
            }
        } catch (e) {}
    });

    await Promise.all(fetchPromises);
    resolveCopies(); 

    function getBaseMonster(monster) {
        if (!monster._copy) return monster;
        let base = MONSTER_DB.find(x => x.name === monster._copy.name && x.source === monster._copy.source);
        if (!base) return monster;
        if (base._copy) base = getBaseMonster(base); 
        return base;
    }

    function resolveCopies() {
        MONSTER_DB.forEach(m => {
            if (m._copy) {
                const base = getBaseMonster(m);
                if (base && base !== m) {
                    Object.keys(base).forEach(key => {
                        if (m[key] === undefined && key !== '_copy') m[key] = JSON.parse(JSON.stringify(base[key]));
                    });
                }
            }
        });
    }

    // ==========================================
    // FIREBASE KÖPRÜSÜ (UNDEFINED HATASI ÇÖZÜLDÜ)
    // ==========================================
    let unsubscribeSnapshot = null;
    let isRemoteUpdate = false; 

    async function syncToFirebase() {
        if (!window.db || isRemoteUpdate) return;
        if (!panelData.roomCode || !panelData.isCombatActive) return;

        try {
            const roomRef = window.doc(window.db, "combat_sessions", panelData.roomCode);
            
            const safeCombatants = panelData.combatants.map(c => {
                // Ölüm kontrolü
                let isDead = false;
                if (c.isMonster) {
                    if (c.isGroup) {
                        isDead = !c.members || c.members.length === 0 || c.members.every(m => m.hp <= 0);
                    } else {
                        isDead = c.hp <= 0;
                    }
                }

                // undefined hatalarını önlemek için || "" ve || 0 kullanıyoruz
                let safeObj = {
                    id: c.id, 
                    name: c.name || "Bilinmeyen", 
                    baseName: c.baseName || "", // Hatanın ana kaynağı burasıydı, düzeltildi.
                    initTotal: c.initTotal || 0, 
                    initRoll: c.initRoll !== undefined ? c.initRoll : (c.initTotal || 0),
                    initMod: c.initMod !== undefined ? c.initMod : 0,
                    isMonster: !!c.isMonster, 
                    isGroup: !!c.isGroup, 
                    token: c.token || '../../img/avatars/default-avatar.png',
                    isDead: isDead
                };
                
                if (c.isGroup && c.members) {
                    safeObj.members = c.members.map(m => ({
                        num: m.num || 0,
                        isDead: m.hp <= 0
                    }));
                }

                let tempAc = c.ac !== undefined ? c.ac : "?";
                safeObj.ac = panelData.isMetaHidden ? "?" : tempAc;
                
                return safeObj;
            });

            await window.setDoc(roomRef, {
                combatants: safeCombatants,
                round: panelData.round || 0,
                activeTurnIndex: panelData.activeTurnIndex || 0,
                isMetaHidden: !!panelData.isMetaHidden,
                lastUpdatedBy: "DM", 
                timestamp: Date.now()
            });
            console.log("🔥 Savaş verisi buluta başarıyla kaydedildi.");
        } catch (e) {
            console.error("Firebase senkronizasyon hatası:", e);
        }
    }

    function listenToFirebaseRoom() {
        if (!window.db || !panelData.roomCode) return;
        const roomRef = window.doc(window.db, "combat_sessions", panelData.roomCode);
        if (unsubscribeSnapshot) unsubscribeSnapshot(); 
        
        unsubscribeSnapshot = window.onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                if (data.lastUpdatedBy === "Player") {
                    isRemoteUpdate = true; 
                    
                    // 1. HAYALET AVI: Oyuncu savaştan çıktıysa DM'in listesinden de anında SİL
                    panelData.combatants = panelData.combatants.filter(localC => {
                        if (localC.isMonster) return true; // Canavarlara dokunma, onlar bizim
                        // Oyuncu Firebase'de hala var mı? Yoksa sil!
                        return data.combatants.some(remoteC => remoteC.id === localC.id);
                    });

                    // 2. Yeni Oyuncuları Ekle
                    data.combatants.forEach(remoteC => {
                        const localIndex = panelData.combatants.findIndex(lc => lc.id === remoteC.id);
                        if (localIndex === -1 && !remoteC.isMonster) {
                            panelData.combatants.push({
                                id: remoteC.id, 
                                name: remoteC.name, 
                                initTotal: remoteC.initTotal, 
                                initRoll: remoteC.initRoll !== undefined ? remoteC.initRoll : remoteC.initTotal, 
                                initMod: remoteC.initMod !== undefined ? remoteC.initMod : 0, 
                                ac: remoteC.ac !== undefined ? remoteC.ac : "?",
                                isMonster: false, 
                                isGroup: false, 
                                token: remoteC.token || '../../img/avatars/default-avatar.png'
                            });
                        }
                    });

                    panelData.combatants.sort((a, b) => b.initTotal - a.initTotal);
                    saveCallback();
                    renderList();
                    
                    isRemoteUpdate = false; 
                    syncToFirebase(); 
                }
            }
        });
    }

    function renderApp() {
        if (!panelData.isCombatActive) {
            wrapper.innerHTML = `
                <div class="ct-setup-screen">
                    <h3 style="color:#b52b2b; margin-bottom:10px;">Savaş Takipçisi</h3>
                    <p style="color:#888; font-size:0.9em; margin-bottom:20px;">Oyuncular için ortak bir savaş odası kurun ve inisiyatif takibini başlatın.</p>
                    <button class="ct-setup-btn">Savaş Odası Kur</button>
                </div>
            `;
            wrapper.querySelector('.ct-setup-btn').onclick = () => {
                const prefixes = ["Ejderha", "Zindan", "Büyü", "Kılıç", "Karanlık", "Gölge"];
                panelData.roomCode = `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${Math.floor(Math.random() * 900) + 100}`;
                panelData.isCombatActive = true;
                saveCallback(); 
                syncToFirebase(); 
                listenToFirebaseRoom(); 
                renderApp();
            };
        } else {
            wrapper.innerHTML = `
                <div class="ct-main-screen">
                    <div class="ct-header">
                        <div class="ct-room-code">Oda: <span>${panelData.roomCode}</span></div>
                        <div class="ct-controls">
                            <button class="ct-meta-btn ${panelData.isMetaHidden ? 'active' : ''}" title="Meta Koruması (AC ve Zarları Gizle)">🛡️</button>
                            <span class="ct-round-counter">Tur: ${panelData.round}</span>
                            <button class="ct-next-btn">${panelData.round === 0 ? 'Savaşı Başlat' : 'Sonraki ❯'}</button>
                            <button class="ct-clear-btn" title="Savaşı Bitir">✕</button>
                        </div>
                    </div>
                    <div class="ct-search-area">
                        <input type="text" class="ct-smart-input" placeholder="Oytun 15 | Gob | 3 Goblin | Özel">
                        <div class="ct-dropdown"></div>
                    </div>
                    <div class="ct-combatants-list"></div>
                </div>

                <div id="ct-modal-container" class="ct-modal-overlay">
                    <div class="ct-modal-content">
                        <div class="ct-modal-header"><h3 id="ct-modal-title">Başlık</h3><button class="ct-modal-close">✕</button></div>
                        <div class="ct-modal-body" id="ct-modal-body"></div>
                    </div>
                </div>
                
                <div id="ct-dice-toast" class="ct-dice-toast">
                    <div class="ct-dt-header">Zar Sonucu</div>
                    <div class="ct-dt-formula">1d20+5</div>
                    <div class="ct-dt-result">18</div>
                </div>
            `;
            attachMainEvents();
            renderList();

            if (!unsubscribeSnapshot && window.db && panelData.isCombatActive) {
                listenToFirebaseRoom();
            }
        }
    }

    function attachMainEvents() {
        const input = wrapper.querySelector('.ct-smart-input');
        const dropdown = wrapper.querySelector('.ct-dropdown');
        const nextBtn = wrapper.querySelector('.ct-next-btn');
        const clearBtn = wrapper.querySelector('.ct-clear-btn');
        const metaBtn = wrapper.querySelector('.ct-meta-btn');
        const modalOverlay = wrapper.querySelector('#ct-modal-container');
        const modalClose = wrapper.querySelector('.ct-modal-close');

        modalClose.onclick = () => modalOverlay.classList.remove('active');
        modalOverlay.onclick = (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove('active'); };

        metaBtn.onclick = () => { panelData.isMetaHidden = !panelData.isMetaHidden; saveCallback(); syncToFirebase(); renderApp(); };

        // ODA KODUNU KOPYALAMA İŞLEMİ
        const roomCodeDiv = wrapper.querySelector('.ct-room-code');
        if (roomCodeDiv && panelData.roomCode) {
            roomCodeDiv.title = "Kodu kopyalamak için tıklayın";
            roomCodeDiv.onclick = () => {
                navigator.clipboard.writeText(panelData.roomCode).then(() => {
                    const span = roomCodeDiv.querySelector('span');
                    const originalText = panelData.roomCode;
                    
                    // Geçici olarak Kopyalandı yazısı göster ve rengini yeşil yap
                    span.innerText = "Kopyalandı!";
                    span.style.color = "#2ecc71";
                    
                    // 1.5 saniye sonra eski haline döndür
                    setTimeout(() => {
                        span.innerText = originalText;
                        span.style.color = "#e67e22";
                    }, 1500);
                }).catch(err => {
                    console.error("Kopyalama başarısız:", err);
                });
            };
        }

        clearBtn.onclick = () => {
            window.showCustomModal('confirm', "Savaşı bitirip odayı kapatmak istediğinize emin misiniz?", async (confirmed) => {
                if(confirmed) {
                    const roomToDelete = panelData.roomCode;
                    
                    panelData.isCombatActive = false; 
                    panelData.combatants = []; 
                    panelData.round = 0; 
                    panelData.activeTurnIndex = -1;
                    panelData.roomCode = ""; 
                    saveCallback(); 
                    
                    if (unsubscribeSnapshot) {
                        unsubscribeSnapshot();
                        unsubscribeSnapshot = null;
                    }

                    if (window.db && roomToDelete && window.deleteDoc) {
                        try {
                            const roomRef = window.doc(window.db, "combat_sessions", roomToDelete);
                            await window.deleteDoc(roomRef);
                        } catch (e) { console.error("Oda silinirken hata:", e); }
                    }
                    renderApp();
                }
            });
        };

        nextBtn.onclick = () => {
            if (panelData.combatants.length === 0) return;
            if (panelData.round === 0) { panelData.round = 1; panelData.activeTurnIndex = 0; } 
            else {
                panelData.activeTurnIndex++;
                if (panelData.activeTurnIndex >= panelData.combatants.length) { panelData.activeTurnIndex = 0; panelData.round++; }
            }
            saveCallback(); syncToFirebase(); renderList();
            wrapper.querySelector('.ct-round-counter').innerText = `Tur: ${panelData.round}`;
            nextBtn.innerText = 'Sonraki ❯';
        };

        input.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (val.length < 2) { dropdown.classList.remove('active'); return; }
            dropdown.innerHTML = '';
            let isPlayerParsed = false;

            if (val.toLowerCase().includes("özel")) {
                const dropItem = document.createElement('div'); dropItem.className = 'ct-drop-item';
                dropItem.innerHTML = `<span style="color:#e67e22;"><strong>+</strong> Özel Düşman (Homebrew) Yarat</span>`;
                dropItem.onclick = () => { openCustomMonsterCreator(); input.value = ''; dropdown.classList.remove('active'); };
                dropdown.appendChild(dropItem);
            }

            // DM Manuel Oyuncu Ekleme (AC ve Zar düzeltmesi eklendi)
            const playerMatch = val.match(/^([A-Za-zğüşıöçĞÜŞİÖÇ\s]+)\s+(\d+)$/);
            if (playerMatch && !val.match(/^\d+/)) { 
                const pName = playerMatch[1].trim(); const pInit = parseInt(playerMatch[2]);
                isPlayerParsed = true;
                const dropItem = document.createElement('div'); dropItem.className = 'ct-drop-item';
                dropItem.innerHTML = `<span><strong>+</strong> Oyuncu Ekle: ${pName} (${pInit})</span>`;
                dropItem.onclick = () => {
                    addCombatant({ 
                        id: Date.now(), name: pName, 
                        initTotal: pInit, initRoll: pInit, initMod: 0, ac: "?", 
                        isMonster: false, isGroup: false, token: '../../img/avatars/default-avatar.png' 
                    });
                    input.value = ''; dropdown.classList.remove('active');
                };
                dropdown.appendChild(dropItem);
            } 
            
            if (!isPlayerParsed) {
                let searchCount = 1; let searchQuery = val;
                const groupMatch = val.match(/^(\d+)\s+(.+)$/);
                if (groupMatch) { searchCount = parseInt(groupMatch[1]); searchQuery = groupMatch[2].trim(); }

                const searchLower = searchQuery.toLowerCase();
                const combinedDB = [...panelData.customMonsters, ...MONSTER_DB];
                const foundMonsters = combinedDB.filter(m => m.name.toLowerCase().includes(searchLower)).slice(0, 8); 
                
                foundMonsters.forEach(m => {
                    const dropItem = document.createElement('div'); dropItem.className = 'ct-drop-item';
                    let titleStr = searchCount > 1 ? `<strong>${searchCount}x</strong> ${m.name}` : m.name;
                    let crStr = m.isCustom ? 'Özel' : (m.cr ? (typeof m.cr === 'object' ? m.cr.cr : m.cr) : '?');
                    dropItem.innerHTML = `<span>${titleStr}</span><span class="cr">CR: ${crStr}</span>`;
                    
                    dropItem.onclick = () => {
                        const dexMod = Math.floor(((m.dex || 10) - 10) / 2);
                        const initRoll = Math.floor(Math.random() * 20) + 1;
                        const hp = m.hp && m.hp.average ? m.hp.average : (m.hp || 10);
                        const ac = m.ac && m.ac[0] ? (typeof m.ac[0] === 'object' ? m.ac[0].ac : m.ac[0]) : 10;
                        
                        let tokenUrl = '../../img/avatars/default-avatar.png';
                        if (m.isCustom && m.customImg) {
                            tokenUrl = m.customImg;
                        } else if (!m.isCustom && m.source) {
                            const tokenSafeName = m.name.replace(/"/g, ''); 
                            tokenUrl = `../img/bestiary/tokens/${m.source}/${tokenSafeName}.webp`;
                        }

                        let finalName = searchCount > 1 ? `${searchCount}x ${m.name} Grubu` : m.name;
                        if (searchCount === 1) {
                            const sameMonsters = panelData.combatants.filter(c => c.baseName === m.name && !c.isGroup);
                            if (sameMonsters.length > 0) {
                                finalName = `${m.name} ${sameMonsters.length + 1}`;
                                if (sameMonsters.length === 1) sameMonsters[0].name = `${m.name} 1`; 
                            }
                        }

                        let newCombatant = {
                            id: Date.now(), name: finalName, baseName: m.name,
                            initRoll: initRoll, initMod: dexMod, initTotal: initRoll + dexMod,
                            isMonster: true, isGroup: searchCount > 1, ac: ac, token: tokenUrl
                        };

                        if (searchCount > 1) {
                            newCombatant.members = Array.from({length: searchCount}).map((_, i) => ({ id: Date.now() + i, hp: hp, maxHp: hp, num: i + 1 }));
                        } else {
                            newCombatant.hp = hp; newCombatant.maxHp = hp;
                        }

                        addCombatant(newCombatant);
                        input.value = ''; dropdown.classList.remove('active'); input.focus();
                    };
                    dropdown.appendChild(dropItem);
                });
            }
            if (dropdown.innerHTML !== '') dropdown.classList.add('active');
            else dropdown.classList.remove('active');
        });

        document.addEventListener('click', (ev) => { if(!input.contains(ev.target) && !dropdown.contains(ev.target)) dropdown.classList.remove('active'); });
    }

    function addCombatant(obj) {
        panelData.combatants.push(obj);
        panelData.combatants.sort((a, b) => b.initTotal - a.initTotal);
        saveCallback(); 
        syncToFirebase();
        renderList();
    }

    // --- RENDER LIST (ARTIK OYUNCULARIN DA ZAR VE AC'Sİ GÖZÜKÜYOR) ---
    function renderList() {
        const listDiv = wrapper.querySelector('.ct-combatants-list');
        if (!listDiv) return;
        listDiv.innerHTML = '';

        panelData.combatants.forEach((c, index) => {
            let isDead = c.isMonster ? (c.isGroup ? c.members.length === 0 || c.members.every(m => m.hp <= 0) : c.hp <= 0) : false;
            const isActiveTurn = panelData.round > 0 && index === panelData.activeTurnIndex;
            
            let initHtml = `<div class="ct-init-box">${c.initTotal}</div>`;
            if (!panelData.isMetaHidden) {
                let modStr = c.initMod >= 0 ? `+${c.initMod}` : c.initMod;
                initHtml = `<div class="ct-init-box" title="Zar: ${c.initRoll}, Bonus: ${modStr}"><small>${c.initRoll}${modStr}</small>${c.initTotal}</div>`;
            }
            
            let acText = c.ac !== undefined ? c.ac : "?";
            let acHtml = panelData.isMetaHidden ? `<div class="ct-ac" title="Gizli">🛡️ ?</div>` : `<div class="ct-ac">🛡️ ${acText}</div>`;

            const card = document.createElement('div');
            card.className = `ct-card ${isActiveTurn ? 'active-turn' : ''} ${isDead ? 'dead' : ''}`;

            if (c.isGroup) {
                let membersHtml = '';
                c.members.forEach((m, mIndex) => {
                    membersHtml += `
                        <div class="ct-member-row ${m.hp <= 0 ? 'dead' : ''}">
                            <div class="ct-row-left">
                                <img src="${c.token}" class="ct-token view-stats-btn" data-basename="${c.baseName}" title="Özellikleri Gör" onerror="this.src='../../img/avatars/default-avatar.png'">
                                <div class="ct-name" title="Minyon #${m.num}">#${m.num} ${c.baseName}</div>
                                ${acHtml}
                            </div>
                            <div class="ct-row-right">
                                <div class="ct-hp-controls">
                                    <button class="ct-hp-btn hp-minus" data-mindex="${mIndex}">-</button>
                                    <input type="number" class="ct-hp-input hp-val" data-mindex="${mIndex}" value="${m.hp}" title="Maks HP: ${m.maxHp}">
                                    <button class="ct-hp-btn hp-plus" data-mindex="${mIndex}">+</button>
                                </div>
                                <button class="ct-delete-btn member-delete" data-mindex="${mIndex}" title="Bu Minyonu Sil">✕</button>
                            </div>
                        </div>
                    `;
                });

                card.innerHTML = `
                    <div class="ct-group-header">
                        <div class="ct-group-title-area">
                            ${initHtml}
                            <div class="ct-name" contenteditable="true" spellcheck="false">${c.name}</div>
                        </div>
                        <button class="ct-delete-btn group-delete" title="Tüm Grubu Sil">✕</button>
                    </div>
                    ${membersHtml}
                `;

                card.querySelector('.group-delete').onclick = () => { deleteCombatant(index); };
                
                // --- MİNYONLAR İÇİN KUSURSUZ HP BUTONLARI ---
                card.querySelectorAll('.hp-minus').forEach(btn => btn.onclick = () => { 
                    let m = c.members[btn.dataset.mindex]; 
                    m.hp = Math.max(0, m.hp - 1); 
                    saveCallback(); syncToFirebase(); renderList(); // Anında buluta fırlat!
                });
                
                card.querySelectorAll('.hp-plus').forEach(btn => btn.onclick = () => { 
                    let m = c.members[btn.dataset.mindex]; 
                    m.hp++; 
                    saveCallback(); syncToFirebase(); renderList(); 
                });
                
                card.querySelectorAll('.hp-val').forEach(inp => inp.onchange = (e) => { 
                    let m = c.members[inp.dataset.mindex]; 
                    m.hp = parseInt(e.target.value) || 0; 
                    saveCallback(); syncToFirebase(); renderList(); 
                });
                
                card.querySelectorAll('.member-delete').forEach(btn => btn.onclick = () => { 
                    c.members.splice(btn.dataset.mindex, 1); 
                    if(c.members.length === 0) deleteCombatant(index); 
                    else { saveCallback(); syncToFirebase(); renderList(); }
                });

            } else {
                let hpControlsHtml = '';
                if (c.isMonster) {
                    hpControlsHtml = `
                        <div class="ct-hp-controls">
                            <button class="ct-hp-btn hp-minus">-</button>
                            <input type="number" class="ct-hp-input hp-val" value="${c.hp}" title="Maks HP: ${c.maxHp}">
                            <button class="ct-hp-btn hp-plus">+</button>
                        </div>
                    `;
                }

                card.innerHTML = `
                    <div class="ct-member-row">
                        <div class="ct-row-left">
                            ${initHtml}
                            <img src="${c.token}" class="ct-token ${c.isMonster ? 'view-stats-btn' : ''}" data-basename="${c.baseName}" title="${c.isMonster ? 'Özellikleri Gör' : 'Oyuncu'}" onerror="this.src='../../img/avatars/default-avatar.png'">
                            <div class="ct-name" contenteditable="true" spellcheck="false">${c.name}</div>
                            ${acHtml}
                        </div>
                        <div class="ct-row-right">
                            ${hpControlsHtml}
                            <button class="ct-delete-btn group-delete" title="Kaldır">✕</button>
                        </div>
                    </div>
                `;

                card.querySelector('.group-delete').onclick = () => { deleteCombatant(index); };
                
                // --- TEKİL CANAVARLAR İÇİN KUSURSUZ HP BUTONLARI ---
                if (c.isMonster) {
                    card.querySelector('.hp-minus').onclick = () => { 
                        c.hp = Math.max(0, c.hp - 1); 
                        saveCallback(); syncToFirebase(); renderList(); 
                    };
                    card.querySelector('.hp-plus').onclick = () => { 
                        c.hp++; 
                        saveCallback(); syncToFirebase(); renderList(); 
                    };
                    card.querySelector('.hp-val').onchange = (e) => { 
                        c.hp = parseInt(e.target.value) || 0; 
                        saveCallback(); syncToFirebase(); renderList(); 
                    };
                }
            }

            const nameDiv = card.querySelector('.ct-name[contenteditable="true"]');
            if (nameDiv) {
                nameDiv.onblur = () => { c.name = nameDiv.innerText; saveCallback(); syncToFirebase(); };
                nameDiv.onkeydown = (e) => { if(e.key === 'Enter') { e.preventDefault(); nameDiv.blur(); } };
            }

            card.querySelectorAll('.view-stats-btn').forEach(btn => {
                btn.onclick = () => openMonsterStatBlock(btn.dataset.basename);
            });

            listDiv.appendChild(card);
        });
    }

    function deleteCombatant(index) {
        panelData.combatants.splice(index, 1);
        if (index < panelData.activeTurnIndex) panelData.activeTurnIndex--;
        if (panelData.activeTurnIndex >= panelData.combatants.length) panelData.activeTurnIndex = 0;
        saveCallback(); syncToFirebase(); renderList();
    }

    // --- HOMEBREW (ÖZEL CANAVAR) FORMU ---
    function openCustomMonsterCreator() {
        const modal = wrapper.querySelector('#ct-modal-container');
        const title = wrapper.querySelector('#ct-modal-title');
        const body = wrapper.querySelector('#ct-modal-body');

        title.innerText = "Özel Düşman Yarat";
        body.innerHTML = `
            <div class="ct-form-row">
                <div class="ct-form-group" style="flex:2;"><label>Düşman Adı</label><input type="text" id="cm-name" class="ct-form-input" placeholder="Örn: Zehirli Örümcek"></div>
                <div class="ct-form-group" style="flex:3;"><label>Görsel URL (İsteğe Bağlı)</label><input type="text" id="cm-img" class="ct-form-input" placeholder="https://..."></div>
            </div>
            <div class="ct-form-row">
                <div class="ct-form-group"><label>Zırh (AC)</label><input type="number" id="cm-ac" class="ct-form-input" value="10"></div>
                <div class="ct-form-group"><label>Can (HP)</label><input type="number" id="cm-hp" class="ct-form-input" value="15"></div>
            </div>
            <div class="ct-form-row">
                <div class="ct-form-group"><label>STR</label><input type="number" id="cm-str" class="ct-form-input" value="10"></div>
                <div class="ct-form-group"><label>DEX</label><input type="number" id="cm-dex" class="ct-form-input" value="10"></div>
                <div class="ct-form-group"><label>CON</label><input type="number" id="cm-con" class="ct-form-input" value="10"></div>
                <div class="ct-form-group"><label>INT</label><input type="number" id="cm-int" class="ct-form-input" value="10"></div>
                <div class="ct-form-group"><label>WIS</label><input type="number" id="cm-wis" class="ct-form-input" value="10"></div>
                <div class="ct-form-group"><label>CHA</label><input type="number" id="cm-cha" class="ct-form-input" value="10"></div>
            </div>
            <div class="ct-form-group">
                <label>Saldırılar & Notlar (*Kalın*, _İtalik_ veya --- kullanın)</label>
                <div id="cm-notes" class="ct-rich-editor" contenteditable="true" data-placeholder="Örn: *Isırık:* +4 isabet, 1d6+2 hasar."></div>
            </div>
            <button id="cm-save-btn" class="ct-setup-btn" style="width:100%; margin-top:10px; font-size:1em;">Kaydet ve Sahneye Ekle</button>
        `;
        modal.classList.add('active');

        const notesEditor = wrapper.querySelector('#cm-notes');
        notesEditor.addEventListener('keyup', function(e) {
            if (e.key === ' ' || e.key === 'Enter') {
                let html = this.innerHTML;
                let newHtml = html.replace(/\*([^\*<]+)\*/g, '<b>$1</b>')
                                  .replace(/_([^_<]+)_/g, '<i>$1</i>')
                                  .replace(/---/g, '<hr>');
                if (html !== newHtml) {
                    this.innerHTML = newHtml;
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.selectNodeContents(this);
                    range.collapse(false);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        });

        wrapper.querySelector('#cm-save-btn').onclick = () => {
            const name = wrapper.querySelector('#cm-name').value || "Bilinmeyen Düşman";
            const imgVal = wrapper.querySelector('#cm-img').value.trim();
            const hpVal = parseInt(wrapper.querySelector('#cm-hp').value) || 10;
            const acVal = parseInt(wrapper.querySelector('#cm-ac').value) || 10;
            const strVal = parseInt(wrapper.querySelector('#cm-str').value) || 10;
            const dexVal = parseInt(wrapper.querySelector('#cm-dex').value) || 10;
            const conVal = parseInt(wrapper.querySelector('#cm-con').value) || 10;
            const intVal = parseInt(wrapper.querySelector('#cm-int').value) || 10;
            const wisVal = parseInt(wrapper.querySelector('#cm-wis').value) || 10;
            const chaVal = parseInt(wrapper.querySelector('#cm-cha').value) || 10;
            const notesHtml = wrapper.querySelector('#cm-notes').innerHTML;

            const newMonster = {
                name: name, isCustom: true,
                ac: [acVal], hp: { average: hpVal }, 
                str: strVal, dex: dexVal, con: conVal, int: intVal, wis: wisVal, cha: chaVal,
                customText: notesHtml, customImg: imgVal
            };
            panelData.customMonsters.push(newMonster);

            const dexMod = Math.floor((dexVal - 10) / 2);
            const initRoll = Math.floor(Math.random() * 20) + 1;
            
            addCombatant({
                id: Date.now(), name: name, baseName: name,
                initRoll: initRoll, initMod: dexMod, initTotal: initRoll + dexMod,
                isMonster: true, isGroup: false, ac: acVal, hp: hpVal, maxHp: hpVal,
                token: imgVal || '../../img/avatars/default-avatar.png'
            });
            modal.classList.remove('active');
        };
    }

    function renderText(entry) {
        if (!entry) return "";
        if (typeof entry === "string") {
            let res = entry;
            res = res.replace(/{@atk mw}/g, '<em>Yakın Dövüş:</em>');
            res = res.replace(/{@atk rw}/g, '<em>Menzilli:</em>');
            res = res.replace(/{@atk mw,rw}/g, '<em>Yakın/Menzilli:</em>');
            res = res.replace(/{@atk rs}/g, '<em>Menzilli Büyü:</em>');
            res = res.replace(/{@atk ms}/g, '<em>Yakın Büyü:</em>');
            res = res.replace(/{@h}/g, '<em>İsabet halinde:</em>');
            
            res = res.replace(/{@hit (.*?)}/gi, '<strong class="ct-rollable" data-roll="d20+$1" title="Saldırı Zarı At">+$1</strong>');
            res = res.replace(/{@damage (.*?)}/gi, '<strong class="ct-rollable" data-roll="$1" title="Hasar Zarı At">$1</strong>');
            res = res.replace(/{@dice (.*?)(?:\|.*?)?}/gi, '<strong class="ct-rollable" data-roll="$1" title="Zar At">$1</strong>');
            res = res.replace(/{@chance (.*?)(?:\|.*?)?}/gi, '<strong class="ct-rollable" data-roll="d100" title="% Şans Zarı">% $1</strong>');

            res = res.replace(/{@spell (.*?)(?:\|.*?)?}/gi, '<span style="color:#2ecc71; font-weight:bold; font-style:italic;">$1</span>');
            res = res.replace(/{@condition (.*?)(?:\|.*?)?}/gi, '<span style="color:#e74c3c; font-weight:bold; border-bottom: 1px dotted #e74c3c;">$1</span>');
            res = res.replace(/{@creature (.*?)(?:\|.*?)?}/gi, '<span style="color:#3498db; font-weight:bold;">$1</span>');
            res = res.replace(/{@skill (.*?)(?:\|.*?)?}/gi, '<strong style="color:#f39c12;">$1</strong>');
            res = res.replace(/{@sense (.*?)(?:\|.*?)?}/gi, '<em>$1</em>');
            res = res.replace(/{@item (.*?)(?:\|.*?)?}/gi, '<em>$1</em>');
            
            res = res.replace(/(?<!data-roll=")\b(\d+d\d+(?:\s*[+-]\s*\d+)?)\b(?![^<]*>)/gi, '<strong class="ct-rollable" data-roll="$1" title="Hızlı Zar At">🎲 $1</strong>');
            res = res.replace(/{@\w+\s+([^}|]+)(?:\|[^}]+)?}/g, '$1');
            return res;
        }
        if (Array.isArray(entry)) return entry.map(e => renderText(e)).join(" ");
        if (typeof entry === "object") {
            let html = "";
            if (entry.name) html += `<strong><em>${renderText(entry.name)}.</em></strong> `;
            if (entry.type === "entries") html += renderText(entry.entries);
            else if (entry.type === "list") html += `<ul>${entry.items ? entry.items.map(i => `<li>${renderText(i)}</li>`).join('') : ''}</ul>`;
            else if (entry.type === "spellcasting") {
                if (entry.headerEntries) html += renderText(entry.headerEntries) + "<br>";
                if (entry.spells) {
                    for (const [lvl, data] of Object.entries(entry.spells)) {
                        let lvlName = lvl === "0" ? "Cantrips (at will)" : `${lvl}. Seviye (${data.slots} slot)`;
                        html += `<em>${lvlName}:</em> ${renderText(data.spells)}<br>`;
                    }
                }
                if (entry.will) html += `<em>Sınırsız:</em> ${renderText(entry.will)}<br>`;
                if (entry.daily) {
                    for (const [times, spells] of Object.entries(entry.daily)) {
                        html += `<em>Günde ${times.replace('e',' defa')}:</em> ${renderText(spells)}<br>`;
                    }
                }
                if (entry.footerEntries) html += renderText(entry.footerEntries);
            }
            else if (entry.entries) html += renderText(entry.entries);
            return html;
        }
        return "";
    }

    function getModStr(score) {
        if(!score) return "+0";
        let mod = Math.floor((score - 10) / 2);
        return mod >= 0 ? `+${mod}` : `${mod}`;
    }

    function openMonsterStatBlock(baseName) {
        if (!baseName) return;

        const modal = wrapper.querySelector('#ct-modal-container');
        const title = wrapper.querySelector('#ct-modal-title');
        const body = wrapper.querySelector('#ct-modal-body');
        
        let m = panelData.customMonsters.find(x => x.name === baseName) || MONSTER_DB.find(x => x.name === baseName);
        if (!m) return;

        title.innerText = m.name;
        let acVal = m.ac && m.ac[0] ? (typeof m.ac[0] === 'object' ? m.ac[0].ac : m.ac[0]) : 10;
        let hpVal = m.hp ? `${m.hp.average || m.hp} (${m.hp.formula || ''})` : '10';

        let html = `
            <div class="ct-stat-block">
                <div class="ct-main-stats">
                    <div class="ct-stat-item"><span>AC</span><span>${acVal}</span></div>
                    <div class="ct-stat-item"><span>HP</span><span>${hpVal}</span></div>
                    <div class="ct-stat-item"><span>Hız</span><span>${m.speed ? (m.speed.walk || 30) : 30} ft.</span></div>
                </div>

                <div class="ct-ability-grid">
                    <div class="ct-ability-box ct-stat-roll" data-roll="1d20${getModStr(m.str)}" data-title="STR Zarı" title="STR Zarını At"><span>STR</span><span>${m.str || 10} (${getModStr(m.str)})</span></div>
                    <div class="ct-ability-box ct-stat-roll" data-roll="1d20${getModStr(m.dex)}" data-title="DEX Zarı" title="DEX Zarını At"><span>DEX</span><span>${m.dex || 10} (${getModStr(m.dex)})</span></div>
                    <div class="ct-ability-box ct-stat-roll" data-roll="1d20${getModStr(m.con)}" data-title="CON Zarı" title="CON Zarını At"><span>CON</span><span>${m.con || 10} (${getModStr(m.con)})</span></div>
                    <div class="ct-ability-box ct-stat-roll" data-roll="1d20${getModStr(m.int)}" data-title="INT Zarı" title="INT Zarını At"><span>INT</span><span>${m.int || 10} (${getModStr(m.int)})</span></div>
                    <div class="ct-ability-box ct-stat-roll" data-roll="1d20${getModStr(m.wis)}" data-title="WIS Zarı" title="WIS Zarını At"><span>WIS</span><span>${m.wis || 10} (${getModStr(m.wis)})</span></div>
                    <div class="ct-ability-box ct-stat-roll" data-roll="1d20${getModStr(m.cha)}" data-title="CHA Zarı" title="CHA Zarını At"><span>CHA</span><span>${m.cha || 10} (${getModStr(m.cha)})</span></div>
                </div>
        `;
        
        let infoLines = [];
        if (m.skill) infoLines.push(`<strong>Yetenekler:</strong> <span>${Object.entries(m.skill).map(([sk, val]) => `${sk} ${val}`).join(", ")}</span>`);
        let senses = m.senses ? m.senses.join(", ") + ", " : "";
        let passive = m.passive ? `Pasif Algı ${m.passive}` : "";
        if (senses || passive) infoLines.push(`<strong>Duyular:</strong> <span>${senses}${passive}</span>`);
        if (m.languages) infoLines.push(`<strong>Diller:</strong> <span>${m.languages.join(", ")}</span>`);
        if (m.cr) infoLines.push(`<strong>Tehlike (CR):</strong> <span>${typeof m.cr === 'object' ? m.cr.cr : m.cr}</span>`);
        
        if (infoLines.length > 0) html += `<div class="ct-info-line">${infoLines.join(" &nbsp;|&nbsp; ")}</div>`;
        
        if (m.trait) { html += `<h4>Özellikler</h4>`; m.trait.forEach(t => html += `<p>${renderText(t)}</p>`); }
        if (m.action) { html += `<h4>Eylemler</h4>`; m.action.forEach(a => html += `<p>${renderText(a)}</p>`); }
        if (m.spellcasting) { html += `<h4>Büyü Yapma</h4>`; m.spellcasting.forEach(sc => html += `<p>${renderText(sc)}</p>`); }
        if (m.isCustom && m.customText) { html += `<h4>Saldırılar & Notlar</h4><div>${renderText(m.customText)}</div>`; }
        
        html += `</div>`;
        body.innerHTML = html;
        
        attachDiceRollListeners(body);
        modal.classList.add('active');
    }

    let toastTimeout;
    function attachDiceRollListeners(container) {
        container.querySelectorAll('.ct-rollable, .ct-stat-roll').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                let formula = btn.dataset.roll;
                let titleText = btn.dataset.title || "Zar Sonucu"; 

                let clean = formula.replace(/\s+/g, '').toLowerCase();
                let total = 0;
                let parts = clean.split(/(?=[+-])/); 
                if(parts.length === 1 && !clean.includes('+') && !clean.includes('-')) parts = [clean];
                
                parts.forEach(part => {
                    let sign = 1;
                    if(part.startsWith('-')) { sign = -1; part = part.substring(1); }
                    else if(part.startsWith('+')) { sign = 1; part = part.substring(1); }
                    
                    if(part.includes('d')) {
                        let [q, s] = part.split('d');
                        let qty = parseInt(q) || 1; 
                        let sides = parseInt(s) || 20;
                        for(let i = 0; i < qty; i++) { total += (Math.floor(Math.random() * sides) + 1) * sign; }
                    } else { total += (parseInt(part) || 0) * sign; }
                });

                let toast = wrapper.querySelector('#ct-dice-toast');
                toast.querySelector('.ct-dt-header').innerText = titleText;
                toast.querySelector('.ct-dt-formula').innerText = formula;
                toast.querySelector('.ct-dt-result').innerText = total;
                toast.classList.add('show');
                
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
            };
        });
    }

    renderApp();
};