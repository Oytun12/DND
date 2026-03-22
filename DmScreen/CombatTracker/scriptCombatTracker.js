/* ============================================================
   SAVAŞ TAKİPÇİSİ (FAZ 1.8 - TAM STAT KONTROLÜ & STAT ZARLARI)
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
        "bestiary-aatm.json", "bestiary-ai.json", "bestiary-aitfr-isf.json", "bestiary-aitfr-thp.json",
        "bestiary-aitfr-dn.json", "bestiary-aitfr-fcd.json", "bestiary-awm.json", "bestiary-bam.json",
        "bestiary-bgdia.json", "bestiary-bgg.json", "bestiary-bmt.json", "bestiary-cm.json",
        "bestiary-coa.json", "bestiary-cos.json", "bestiary-crcotn.json", "bestiary-dc.json",
        "bestiary-dip.json", "bestiary-ditlcot.json", "bestiary-dmg.json", "bestiary-dod.json",
        "bestiary-dosi.json", "bestiary-dsotdq.json", "bestiary-egw.json", "bestiary-erlw.json",
        "bestiary-ftd.json", "bestiary-ggr.json", "bestiary-gos.json", "bestiary-hat-tg.json",
        "bestiary-hftt.json", "bestiary-hotdq.json", "bestiary-idrotf.json", "bestiary-imr.json",
        "bestiary-jttrc.json", "bestiary-kftgv.json", "bestiary-kkw.json", "bestiary-llk.json",
        "bestiary-lmop.json", "bestiary-lox.json", "bestiary-lr.json", "bestiary-lrdt.json",
        "bestiary-mabjov.json", "bestiary-mcv1sc.json", "bestiary-mcv2dc.json", "bestiary-mcv3mc.json",
        "bestiary-mcv4ec.json", "bestiary-mismv1.json", "bestiary-mff.json", "bestiary-mgelft.json",
        "bestiary-mm.json", "bestiary-mpmm.json", "bestiary-mpp.json", "bestiary-mot.json",
        "bestiary-mtf.json", "bestiary-oota.json", "bestiary-oow.json", "bestiary-pabtso.json",
        "bestiary-ps-a.json", "bestiary-ps-d.json", "bestiary-ps-i.json", "bestiary-ps-k.json",
        "bestiary-ps-x.json", "bestiary-ps-z.json", "bestiary-pota.json", "bestiary-qftis.json",
        "bestiary-rmbre.json", "bestiary-rot.json", "bestiary-sads.json", "bestiary-scc.json",
        "bestiary-sdw.json", "bestiary-skt.json", "bestiary-tce.json", "bestiary-ttp.json",
        "bestiary-tftyp.json", "bestiary-toa.json", "bestiary-tofw.json", "bestiary-vd.json",
        "bestiary-veor.json", "bestiary-vgm.json", "bestiary-vrgr.json", "bestiary-wbtw.json",
        "bestiary-wdh.json", "bestiary-wdmm.json"
    ];

    let MONSTER_DB = [];
    let FLUFF_DICT = {};

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
                saveCallback(); renderApp();
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

        // Çarpı butonuna basılınca kapat
        modalClose.onclick = () => modalOverlay.classList.remove('active');
        
        // YENİ: Siyah arka plana (modal dışına) tıklanınca kapat
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) modalOverlay.classList.remove('active');
        };

        metaBtn.onclick = () => { panelData.isMetaHidden = !panelData.isMetaHidden; saveCallback(); renderApp(); };

        clearBtn.onclick = () => {
            if(confirm("Savaşı bitirip odayı kapatmak istediğinize emin misiniz?")) {
                panelData.isCombatActive = false; panelData.combatants = []; panelData.round = 0; panelData.activeTurnIndex = -1;
                saveCallback(); renderApp();
            }
        };

        nextBtn.onclick = () => {
            if (panelData.combatants.length === 0) return;
            if (panelData.round === 0) { panelData.round = 1; panelData.activeTurnIndex = 0; } 
            else {
                panelData.activeTurnIndex++;
                if (panelData.activeTurnIndex >= panelData.combatants.length) { panelData.activeTurnIndex = 0; panelData.round++; }
            }
            saveCallback(); renderList();
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

            const playerMatch = val.match(/^([A-Za-zğüşıöçĞÜŞİÖÇ\s]+)\s+(\d+)$/);
            if (playerMatch && !val.match(/^\d+/)) { 
                const pName = playerMatch[1].trim(); const pInit = parseInt(playerMatch[2]);
                isPlayerParsed = true;
                const dropItem = document.createElement('div'); dropItem.className = 'ct-drop-item';
                dropItem.innerHTML = `<span><strong>+</strong> Oyuncu Ekle: ${pName} (${pInit})</span>`;
                dropItem.onclick = () => {
                    addCombatant({ id: Date.now(), name: pName, initTotal: pInit, initRoll: pInit, initMod: 0, isMonster: false, isGroup: false, token: '../../img/SariZar.svg' });
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
                        
                        let tokenUrl = '../../img/SariZar.svg';
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
        saveCallback(); renderList();
    }

    function renderList() {
        const listDiv = wrapper.querySelector('.ct-combatants-list');
        if (!listDiv) return;
        listDiv.innerHTML = '';

        panelData.combatants.forEach((c, index) => {
            let isDead = c.isMonster ? (c.isGroup ? c.members.length === 0 || c.members.every(m => m.hp <= 0) : c.hp <= 0) : false;
            const isActiveTurn = panelData.round > 0 && index === panelData.activeTurnIndex;
            
            let initHtml = `<div class="ct-init-box">${c.initTotal}</div>`;
            if (c.isMonster && !panelData.isMetaHidden) {
                let modStr = c.initMod >= 0 ? `+${c.initMod}` : c.initMod;
                initHtml = `<div class="ct-init-box" title="Zar: ${c.initRoll}, Bonus: ${modStr}"><small>${c.initRoll}${modStr}</small>${c.initTotal}</div>`;
            }
            let acHtml = c.isMonster ? (panelData.isMetaHidden ? `<div class="ct-ac" title="Gizli">🛡️ ?</div>` : `<div class="ct-ac">🛡️ ${c.ac}</div>`) : '';

            const card = document.createElement('div');
            card.className = `ct-card ${isActiveTurn ? 'active-turn' : ''} ${isDead ? 'dead' : ''}`;

            if (c.isGroup) {
                let membersHtml = '';
                c.members.forEach((m, mIndex) => {
                    membersHtml += `
                        <div class="ct-member-row ${m.hp <= 0 ? 'dead' : ''}">
                            <div class="ct-row-left">
                                <img src="${c.token}" class="ct-token view-stats-btn" data-basename="${c.baseName}" title="Özellikleri Gör" onerror="this.src='../../img/SariZar.svg'">
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
                card.querySelectorAll('.hp-minus').forEach(btn => btn.onclick = () => { let m = c.members[btn.dataset.mindex]; m.hp = Math.max(0, m.hp - 1); saveCallback(); renderList(); });
                card.querySelectorAll('.hp-plus').forEach(btn => btn.onclick = () => { let m = c.members[btn.dataset.mindex]; m.hp++; saveCallback(); renderList(); });
                card.querySelectorAll('.hp-val').forEach(inp => inp.onchange = (e) => { let m = c.members[inp.dataset.mindex]; m.hp = parseInt(e.target.value) || 0; saveCallback(); renderList(); });
                card.querySelectorAll('.member-delete').forEach(btn => btn.onclick = () => { 
                    c.members.splice(btn.dataset.mindex, 1); 
                    if(c.members.length === 0) deleteCombatant(index); else { saveCallback(); renderList(); }
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
                            <img src="${c.token}" class="ct-token ${c.isMonster ? 'view-stats-btn' : ''}" data-basename="${c.baseName}" title="${c.isMonster ? 'Özellikleri Gör' : 'Oyuncu'}" onerror="this.src='../../img/SariZar.svg'">
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
                if (c.isMonster) {
                    card.querySelector('.hp-minus').onclick = () => { c.hp = Math.max(0, c.hp - 1); saveCallback(); renderList(); };
                    card.querySelector('.hp-plus').onclick = () => { c.hp++; saveCallback(); renderList(); };
                    card.querySelector('.hp-val').onchange = (e) => { c.hp = parseInt(e.target.value) || 0; saveCallback(); renderList(); };
                }
            }

            const nameDiv = card.querySelector('.ct-name[contenteditable="true"]');
            if (nameDiv) {
                nameDiv.onblur = () => { c.name = nameDiv.innerText; saveCallback(); };
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
        saveCallback(); renderList();
    }

    // --- HOMEBREW (ÖZEL CANAVAR) FORMU (TÜM STATLAR EKLENDİ) ---
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
                token: imgVal || '../../img/SariZar.svg'
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

    // --- ŞIK STAT BLOĞU VE ATILABİLİR STAT KUTULARI ---
    function openMonsterStatBlock(baseName) {
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
        
        // Modaldaki Statlara ve Metin İçindeki Zarlara Olay Atama
        attachDiceRollListeners(body);
        modal.classList.add('active');
    }

    // --- HIZLI ZAR MOTORU (TOAST) ---
    let toastTimeout;
    function attachDiceRollListeners(container) {
        // Hem metin içindeki zarları (.ct-rollable) hem de Stat Kutularını (.ct-stat-roll) yakala
        container.querySelectorAll('.ct-rollable, .ct-stat-roll').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                let formula = btn.dataset.roll;
                let titleText = btn.dataset.title || "Zar Sonucu"; // Stat kutusuna özel başlık için

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