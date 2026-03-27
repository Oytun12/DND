/* ============================================================
   SCRIPT-DMSCREEN.JS - Çoklu Ekran (Multi-Monitor) Grid Motoru
   ============================================================ */

// --- EVRENSEL ÖZEL UYARI PENCERESİ MOTORU ---
window.showCustomModal = function(type, message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'dm-custom-modal-overlay';
    let inputHtml = type === 'prompt' ? `<input type="text" class="dm-custom-modal-input" placeholder="...">` : '';
    let cancelBtnHtml = (type === 'prompt' || type === 'confirm') ? `<button class="dm-custom-modal-btn cancel">İptal</button>` : '';

    overlay.innerHTML = `
        <div class="dm-custom-modal-box">
            <div class="dm-custom-modal-msg">${message}</div>
            ${inputHtml}
            <div class="dm-custom-modal-btns">
                ${cancelBtnHtml}
                <button class="dm-custom-modal-btn confirm">Tamam</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const inputEl = overlay.querySelector('.dm-custom-modal-input');
    if (inputEl) inputEl.focus();

    const btnConfirm = overlay.querySelector('.confirm');
    const btnCancel = overlay.querySelector('.cancel');

    if (inputEl) inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnConfirm.click(); });

    btnConfirm.onclick = () => {
        let val = true;
        if (type === 'prompt') val = inputEl.value;
        overlay.remove();
        if(callback) callback(val);
    };

    if (btnCancel) btnCancel.onclick = () => { overlay.remove(); if(callback) callback(null); };
};

let SCREENS = [];
let currentScreenIndex = 0;
let editingPanelId = null;
let activeAddTarget = null; 
let transformPanelId = null; // YENİ: Dönüştürülecek panelin kimliğini aklımızda tutar

// 1. WIDGET SÖZLÜĞÜ (Tüm sayfaların adresleri burada)
const WIDGETS = {
    'conditions': { title: "💀 Durumlar", url: "../Sayfalar/EkBilgi/Durumlar/durumlar.html" },
    'bestiary': { title: "🐉 Yaratık Rehberi", url: "../Sayfalar/EkBilgi/Bestiary/bestiary.html" },
    'feats': { title: "🎖️ Hünerler (Feats)", url: "../Sayfalar/EkBilgi/Feats/feats.html" },
    'invocations': { title: "🔮 Warlock Yakarışları", url: "../Sayfalar/EkBilgi/Yakarislar/yakarislar.html" },
    'backgrounds': { title: "📜 Geçmişler", url: "../Sayfalar/BackGround/back.html" },
    'classes': { title: "⚔️ Sınıflar", url: "../Sayfalar/Class/class.html" },
    'inventory': { title: "🎒 Ekipmanlar", url: "../Sayfalar/Envanter/envanter.html" },
    'races': { title: "🧝 Irklar", url: "../Sayfalar/Race/race.html" },
    'spells': { title: "✨ Büyüler", url: "../Sayfalar/Spells/spells.html" },
    'charcreator': { title: "🛠️ Karakter Yarat", url: "../KarakterCreate/KarakterYaratma/KarakterYa.html" }
};

// --- LOCAL STORAGE (KAYIT SİSTEMİ) ---
function saveScreenState() {
    const state = { screens: SCREENS, currentIndex: currentScreenIndex };
    localStorage.setItem('dndDmScreenState', JSON.stringify(state));
}

function loadScreenState() {
    const saved = localStorage.getItem('dndDmScreenState');
    if (saved) {
        try {
            const state = JSON.parse(saved);
            if (state.screens) { 
                SCREENS = state.screens;
                currentScreenIndex = state.currentIndex || 0;
            } else { 
                SCREENS = [{ id: Date.now(), cols: state.cols || 4, rows: state.rows || 2, panels: state.panels || [] }];
                currentScreenIndex = 0;
            }
        } catch (e) { console.error("Kayıt okuma hatası:", e); }
    } else {
        SCREENS = [{ id: Date.now(), cols: 4, rows: 2, panels: [] }];
        currentScreenIndex = 0;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    loadScreenState(); 
    setupControls();
    setupModal();
    setupFullscreen(); 
    updateModalInputs(); 
    renderGrid(); 
});

// --- ANİMASYONLU EKRAN GEÇİŞ MOTORU ---
function animateGridSwap(direction, callback) {
    const grid = document.getElementById('dm-grid');
    const exitX = direction === 'right' ? '-50px' : '50px';
    const enterX = direction === 'right' ? '50px' : '-50px';

    grid.style.transition = 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out';
    grid.style.transform = `translateX(${exitX})`;
    grid.style.opacity = '0';
    
    setTimeout(() => {
        callback(); 
        
        grid.style.transition = 'none';
        grid.style.transform = `translateX(${enterX})`;
        void grid.offsetWidth; 
        
        grid.style.transition = 'transform 0.2s ease-in-out, opacity 0.2s ease-in-out';
        grid.style.transform = 'translateX(0)';
        grid.style.opacity = '1';
    }, 200);
}

function switchScreen(newIndex) {
    if (newIndex < 0 || newIndex >= SCREENS.length || newIndex === currentScreenIndex) return;
    const direction = newIndex > currentScreenIndex ? 'right' : 'left';
    
    animateGridSwap(direction, () => {
        currentScreenIndex = newIndex;
        editingPanelId = null;
        updateModalInputs();
        renderGrid();
    });
}

function updateNavArrows() {
    const leftBtn = document.getElementById('nav-screen-left');
    const rightBtn = document.getElementById('nav-screen-right');
    leftBtn.style.display = currentScreenIndex > 0 ? 'flex' : 'none';
    rightBtn.style.display = currentScreenIndex < SCREENS.length - 1 ? 'flex' : 'none';
}

function updateModalInputs() {
    const activeScreen = SCREENS[currentScreenIndex];
    document.getElementById('grid-cols').value = activeScreen.cols;
    document.getElementById('grid-rows').value = activeScreen.rows;
    
    const tabsContainer = document.getElementById('screen-tabs-list');
    tabsContainer.innerHTML = '';
    
    SCREENS.forEach((scr, idx) => {
        const btn = document.createElement('button');
        btn.className = 'screen-tab' + (idx === currentScreenIndex ? ' active' : '');
        btn.textContent = `Ekran ${idx + 1}`;
        btn.onclick = () => switchScreen(idx);
        tabsContainer.appendChild(btn);
    });
    
    document.getElementById('delete-screen-btn').style.display = SCREENS.length > 1 ? 'block' : 'none';
}

// --- KONTROL VE MODAL YÖNETİMİ ---
function setupControls() {
    const settingsModal = document.getElementById('grid-settings-modal');
    
    document.getElementById('open-grid-modal-btn').onclick = () => { updateModalInputs(); settingsModal.classList.add('open'); };
    const mobileBtn = document.getElementById('open-grid-modal-mobile');
    if(mobileBtn) mobileBtn.onclick = () => { updateModalInputs(); settingsModal.classList.add('open'); };

    document.querySelector('.close-settings-btn').onclick = () => {
        settingsModal.classList.remove('open');
        document.getElementById('reset-confirm-area').style.display = 'none';
    };

    document.getElementById('nav-screen-left').onclick = () => switchScreen(currentScreenIndex - 1);
    document.getElementById('nav-screen-right').onclick = () => switchScreen(currentScreenIndex + 1);

    document.getElementById('add-screen-left-btn').onclick = () => {
        const newScreen = { id: Date.now(), cols: 4, rows: 2, panels: [] };
        SCREENS.splice(currentScreenIndex, 0, newScreen); 
        animateGridSwap('left', () => { updateModalInputs(); renderGrid(); });
    };

    document.getElementById('add-screen-right-btn').onclick = () => {
        const newScreen = { id: Date.now(), cols: 4, rows: 2, panels: [] };
        SCREENS.splice(currentScreenIndex + 1, 0, newScreen); 
        currentScreenIndex++; 
        animateGridSwap('right', () => { updateModalInputs(); renderGrid(); });
    };

    // setupControls fonksiyonu içindeki tüm ekranı silme tuşu
    document.getElementById('delete-screen-btn').onclick = () => {
        if (SCREENS.length <= 1) return;
        window.showCustomModal('confirm', "Bu ekranı (ve içindeki tüm panelleri) silmek istediğine emin misin?", (confirmed) => {
            if (confirmed) {
                SCREENS.splice(currentScreenIndex, 1);
                if (currentScreenIndex >= SCREENS.length) currentScreenIndex = SCREENS.length - 1;
                updateModalInputs();
                renderGrid();
            }
        });
    };

    document.getElementById('build-grid-btn').onclick = () => {
        const activeScreen = SCREENS[currentScreenIndex];
        activeScreen.cols = parseInt(document.getElementById('grid-cols').value) || 4;
        activeScreen.rows = parseInt(document.getElementById('grid-rows').value) || 2;
        
        activeScreen.panels = activeScreen.panels.filter(p => p.r + p.h - 1 <= activeScreen.rows && p.c + p.w - 1 <= activeScreen.cols);
        renderGrid();
    };

    document.getElementById('confirm-reset-btn').onclick = () => { document.getElementById('reset-confirm-area').style.display = 'block'; };
    document.getElementById('cancel-reset-btn').onclick = () => { document.getElementById('reset-confirm-area').style.display = 'none'; };

    document.getElementById('reset-screen-btn').onclick = () => {
        SCREENS[currentScreenIndex].panels = [];
        editingPanelId = null;
        renderGrid();
        document.getElementById('reset-confirm-area').style.display = 'none';
    };

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('open');
            const confirmArea = document.getElementById('reset-confirm-area');
            if (confirmArea) confirmArea.style.display = 'none';
        }
        if (editingPanelId !== null) {
            const isResizeHandle = e.target.classList.contains('resize-handle');
            const isDragHandle = e.target.classList.contains('drag-handle-center');
            const isEditBtn = e.target.closest('.edit-panel-btn');
            
            if (!isResizeHandle && !isDragHandle && !isEditBtn) {
                editingPanelId = null;
                renderGrid(); 
            }
        }
    });
}

function setupModal() {
    const typeModal = document.getElementById('panel-type-modal');
    
    // Çarpıya basıp çıkarsak hafızayı temizle
    document.querySelector('.close-type-btn').onclick = () => {
        transformPanelId = null;
        activeAddTarget = null;
        typeModal.classList.remove('open');
    };
    
    typeModal.querySelectorAll('.type-opt-btn').forEach(btn => {
        btn.onclick = () => {
            const activeScreen = SCREENS[currentScreenIndex];
            
            // DURUM 1: DÖNÜŞTÜRME İŞLEMİ (Boyut ve konum korunur, içerik değişir)
            if (transformPanelId) {
                const p = activeScreen.panels.find(x => x.id === transformPanelId);
                if (p) {
                    // Eski DOM elementini arayüzden siliyoruz ki yeni tipiyle baştan çizilebilsin
                    const oldEl = document.getElementById('dm-grid').querySelector(`.dm-panel[data-id="${p.id}"]`);
                    if(oldEl) oldEl.remove();
                    
                    p.type = btn.dataset.type;
                    p.content = ""; // Eski uygulamanın notlarını temizle
                }
                transformPanelId = null;
                typeModal.classList.remove('open');
                renderGrid();
            } 
            // DURUM 2: YENİ EKLEME İŞLEMİ (Artı tuşuna basıldıysa)
            else if (activeAddTarget) {
                activeScreen.panels.push({
                    id: Date.now(),
                    r: activeAddTarget.r,
                    c: activeAddTarget.c,
                    w: 1, h: 1,
                    type: btn.dataset.type,
                    content: "", 
                    zoom: 1 
                });
                activeAddTarget = null;
                typeModal.classList.remove('open');
                renderGrid();
            }
        };
    });
}

// --- ANA GRID ÇİZİCİ (YENİ AKILLI STATE MOTORU) ---
function renderGrid() {
    const container = document.getElementById('dm-grid');
    const activeScreen = SCREENS[currentScreenIndex];
    
    container.style.gridTemplateColumns = `repeat(${activeScreen.cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${activeScreen.rows}, 1fr)`;

    // Boş (Eklemeye hazır) hücreleri temizle
    container.querySelectorAll('.empty-panel').forEach(el => el.remove());

    // 1. Sistemde kayıtlı olan "Tüm Ekranlardaki" panellerin kimliklerini topla
    const allValidPanelIds = [];
    SCREENS.forEach(screen => {
        screen.panels.forEach(p => allValidPanelIds.push(p.id.toString()));
    });
    
    // 2. Şu an baktığımız (Aktif) ekrandaki panellerin kimlikleri
    const activePanelIds = activeScreen.panels.map(p => p.id.toString());

    // 3. DOM'da bulunan tüm panelleri denetle
    container.querySelectorAll('.dm-panel').forEach(el => {
        if (!allValidPanelIds.includes(el.dataset.id)) {
            // Panel sistemden tamamen silinmiş (Kullanıcı Çarpıya basmış veya Ekran silinmiş)
            el.remove();
        } else if (!activePanelIds.includes(el.dataset.id)) {
            // Panel silinmemiş AMA başka bir ekrana ait. SADECE GİZLE! (State korunur)
            el.style.display = 'none';
        }
    });

    // 4. Aktif Ekranın Panellerini Çiz ve Göster
    activeScreen.panels.forEach(p => {
        let panelEl = container.querySelector(`.dm-panel[data-id="${p.id}"]`);
        
        // Daha önce oluşturulmamışsa (Yeni eklendiyse) oluştur
        if (!panelEl) {
            panelEl = createNewPanelDOM(p);
            container.appendChild(panelEl);
        }
        
        // Paneli Görünür Yap ve Kordinatlarına Oturt
        panelEl.style.display = 'flex'; 
        panelEl.style.gridArea = `${p.r} / ${p.c} / span ${p.h} / span ${p.w}`;
        manageEditOverlay(panelEl, p);
    });

    // 5. Kalan boş alanlara (Ekleme Butonları) hücre çiz
    let occupied = Array(activeScreen.rows + 1).fill(0).map(() => Array(activeScreen.cols + 1).fill(false));
    activeScreen.panels.forEach(p => {
        for(let i = p.r; i < p.r + p.h; i++) {
            for(let j = p.c; j < p.c + p.w; j++) {
                if(i <= activeScreen.rows && j <= activeScreen.cols) occupied[i][j] = true;
            }
        }
    });

    for(let i = 1; i <= activeScreen.rows; i++) {
        for(let j = 1; j <= activeScreen.cols; j++) {
            if(!occupied[i][j]) {
                const empty = document.createElement('div');
                empty.className = 'grid-cell empty-panel';
                empty.style.gridArea = `${i} / ${j} / span 1 / span 1`;
                
                empty.innerHTML = '<button class="add-content-btn" title="Yeni Panel Ekle">+</button>';
                
                empty.querySelector('.add-content-btn').onclick = () => {
                    transformPanelId = null; // YENİ: Dönüştürme işlemini iptal et
                    activeAddTarget = { r: i, c: j };
                    document.getElementById('panel-type-modal').classList.add('open');
                };

                empty.ondragover = (e) => { e.preventDefault(); empty.classList.add('drag-over'); };
                empty.ondragleave = () => empty.classList.remove('drag-over');
                empty.ondrop = (e) => {
                    e.preventDefault();
                    empty.classList.remove('drag-over');
                    const id = e.dataTransfer.getData('text/plain');
                    const draggedP = activeScreen.panels.find(x => x.id == id);
                    if (draggedP && canPlacePanel(draggedP.id, i, j, draggedP.w, draggedP.h)) {
                        draggedP.r = i; draggedP.c = j;
                        editingPanelId = null;
                        renderGrid(); 
                    }
                };

                container.appendChild(empty);
            }
        }
    }

    updateNavArrows();
    saveScreenState();
}

function createNewPanelDOM(p) {
    const panelEl = document.createElement('div');
    panelEl.className = 'dm-panel';
    panelEl.dataset.id = p.id; 

    if (typeof p.zoom === 'undefined') p.zoom = 1;

    let title = "", contentHtml = "", extraClass = "";

    let inlineStyle = `style="--zoom: ${p.zoom};`;
    if (p.type === 'notes' || p.type === 'diceroller') {
        inlineStyle += ` zoom: ${p.zoom};`;
    }
    inlineStyle += `"`;

    if (p.type === 'notes') { 
        title = "📝 Serbest Notlar"; 
        const savedContent = p.content || "";
        contentHtml = `
            <div class="panel-content-notes">
                <div class="rich-text-editor" contenteditable="true" data-placeholder="Yazmaya başla... (/help ile komutları gör)">${savedContent}</div>
                <button class="export-notes-btn" title="Notion Uyumlu Markdown Çıktısı Al">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line></svg>
                    Export
                </button>
            </div>
        `; 
    } else if (p.type === 'diceroller') { 
        title = "🎲 Zar Atıcı"; 
        // Eski ilkel HTML'i tamamen silip, Premium Wrapper koyuyoruz.
        contentHtml = `<div class="premium-dice-wrapper"></div>`;
    } else if (p.type === 'combattracker') {
        title = "⚔️ Savaş Takipçisi";
        contentHtml = `<div class="combat-tracker-wrapper" style="height:100%; display:flex; flex-direction:column; overflow:hidden;"></div>`;
    } else if (WIDGETS[p.type]) { 
        title = WIDGETS[p.type].title;
        extraClass = " no-padding";
        contentHtml = `<iframe src="${WIDGETS[p.type].url}?widget=true"></iframe>`;
    } else {
        title = "Hata"; contentHtml = `<div>Geçersiz Panel</div>`;
    }

    panelEl.innerHTML = `
        <div class="panel-header">
            <span class="panel-title">${title}</span>
            <div class="panel-controls">
                <button class="panel-control-btn zoom-out-btn" title="Küçült" style="font-weight:bold; font-size:1.3em; margin-top:-2px;">-</button>
                <button class="panel-control-btn zoom-in-btn" title="Büyüt" style="font-weight:bold; font-size:1.1em;">+</button>
                <button class="panel-control-btn transform-panel-btn" title="İçeriği Değiştir">⟲</button>
                <button class="panel-control-btn edit-panel-btn" title="Genişlet & Taşı">⤡</button>
                <button class="panel-control-btn remove-panel-btn" title="Kapat">✕</button>
            </div>
        </div>
        <div class="panel-content${extraClass}" ${inlineStyle}>${contentHtml}</div>
    `;

    // DÖNÜŞTÜR BUTONU İŞLEVİ
    panelEl.querySelector('.transform-panel-btn').onclick = () => {
        // Eğer dönüştürdüğümüz şey aktif bir savaş odasıysa veritabanını temizle!
        if (p.type === 'combattracker' && p.isCombatActive && p.roomCode) {
            window.showCustomModal('confirm', "Modülü değiştirirseniz aktif savaş odası da veritabanından silinecektir. Onaylıyor musunuz?", async (confirmed) => {
                if (!confirmed) return;
                
                if (window.db && window.deleteDoc) {
                    try {
                        const roomRef = window.doc(window.db, "combat_sessions", p.roomCode);
                        await window.deleteDoc(roomRef);
                    } catch(e) { console.error("Oda silinirken hata:", e); }
                }
                
                // Savaş özelliklerini sıfırla ki yeni modüle bulaşmasın
                p.isCombatActive = false;
                p.roomCode = "";
                
                transformPanelId = p.id;
                document.getElementById('panel-type-modal').classList.add('open');
            });
        } else {
            transformPanelId = p.id;
            document.getElementById('panel-type-modal').classList.add('open');
        }
    }; 

    // createNewPanelDOM fonksiyonu içindeki panel silme tuşu
    panelEl.querySelector('.remove-panel-btn').onclick = () => {
        if (p.type === 'combattracker' && p.isCombatActive && p.roomCode) {
            window.showCustomModal('confirm', "Modülü kapatırsanız aktif savaş odası da veritabanından silinecektir. Onaylıyor musunuz?", async (confirmed) => {
                if (!confirmed) return;
                
                if (window.db && window.deleteDoc) {
                    try {
                        const roomRef = window.doc(window.db, "combat_sessions", p.roomCode);
                        await window.deleteDoc(roomRef);
                    } catch(e) { console.error("Oda silinirken hata:", e); }
                }
                const activeScreen = SCREENS[currentScreenIndex];
                activeScreen.panels = activeScreen.panels.filter(x => x.id !== p.id);
                renderGrid();
            });
        } else {
            const activeScreen = SCREENS[currentScreenIndex];
            activeScreen.panels = activeScreen.panels.filter(x => x.id !== p.id);
            renderGrid();
        }
    };

    panelEl.querySelector('.edit-panel-btn').onclick = () => {
        editingPanelId = editingPanelId === p.id ? null : p.id;
        renderGrid();
    };

    const contentDiv = panelEl.querySelector('.panel-content');
    
    panelEl.querySelector('.zoom-in-btn').onclick = () => {
        p.zoom = Math.min(2.5, (p.zoom * 10 + 1) / 10); 
        contentDiv.style.setProperty('--zoom', p.zoom);
        if (p.type === 'notes' || p.type === 'diceroller') contentDiv.style.zoom = p.zoom;
        saveScreenState(); 
    };

    panelEl.querySelector('.zoom-out-btn').onclick = () => {
        p.zoom = Math.max(0.5, (p.zoom * 10 - 1) / 10); 
        contentDiv.style.setProperty('--zoom', p.zoom);
        if (p.type === 'notes' || p.type === 'diceroller') contentDiv.style.zoom = p.zoom;
        saveScreenState(); 
    };

    if (p.type === 'notes') {
        if (typeof window.initTextEditor === 'function') {
            window.initTextEditor(panelEl, p, saveScreenState);
        } else {
            console.error("TextEdit modülü bulunamadı!");
        }
    };

    if (p.type === 'diceroller') {
        if (typeof window.initDiceRoller === 'function') window.initDiceRoller(panelEl, p, saveScreenState);
    }
    // YENİ EKLENEN SAVAŞ TAKİPÇİSİ MOTORU BAĞLANTISI
    if (p.type === 'combattracker') {
        if (typeof window.initCombatTracker === 'function') window.initCombatTracker(panelEl, p, saveScreenState);
    }

    return panelEl;
}

function manageEditOverlay(panelEl, p) {
    let overlay = panelEl.querySelector('.edit-overlay');
    
    if (editingPanelId === p.id) {
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'edit-overlay';
            
            overlay.innerHTML = `
                <button class="finish-edit-btn" title="Düzenlemeyi Bitir">✓</button>
                <div class="resize-handle top" data-dir="top"></div>
                <div class="resize-handle right" data-dir="right"></div>
                <div class="resize-handle bottom" data-dir="bottom"></div>
                <div class="resize-handle left" data-dir="left"></div>
                <div class="resize-handle top-left" data-dir="top-left"></div>
                <div class="resize-handle top-right" data-dir="top-right"></div>
                <div class="resize-handle bottom-left" data-dir="bottom-left"></div>
                <div class="resize-handle bottom-right" data-dir="bottom-right"></div>
                <div class="drag-handle-center" draggable="true" title="Sürükle ve Başka Yuvaya Bırak">✥</div>
            `;

            overlay.querySelector('.finish-edit-btn').onclick = () => {
                editingPanelId = null;
                renderGrid();
            };

            const centerHandle = overlay.querySelector('.drag-handle-center');
            centerHandle.ondragstart = (e) => { e.dataTransfer.setData('text/plain', p.id); };

            overlay.querySelectorAll('.resize-handle').forEach(handle => {
                handle.onpointerdown = (e) => startResize(e, p, handle.dataset.dir);
            });

            panelEl.appendChild(overlay);
        }
    } else {
        if (overlay) overlay.remove();
    }
}

function canPlacePanel(ignoreId, r, c, w, h) {
    const activeScreen = SCREENS[currentScreenIndex];
    if (r < 1 || c < 1 || r + h - 1 > activeScreen.rows || c + w - 1 > activeScreen.cols) return false;
    for (let i = r; i < r + h; i++) {
        for (let j = c; j < c + w; j++) {
            const occupant = activeScreen.panels.find(p => p.id !== ignoreId && i >= p.r && i < p.r + p.h && j >= p.c && j < p.c + p.w);
            if (occupant) return false;
        }
    }
    return true;
}

function startResize(e, panel, direction) {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const startR = panel.r, startC = panel.c, startW = panel.w, startH = panel.h;
    
    const gridEl = document.getElementById('dm-grid');
    const activeScreen = SCREENS[currentScreenIndex];
    const cellW = gridEl.getBoundingClientRect().width / activeScreen.cols;
    const cellH = gridEl.getBoundingClientRect().height / activeScreen.rows;

    const onMove = (moveEv) => {
        const dx = moveEv.clientX - startX;
        const dy = moveEv.clientY - startY;
        let newR = startR, newC = startC, newW = startW, newH = startH;

        if (direction.includes('right')) {
            newW = Math.max(1, startW + Math.round(dx / cellW));
        } else if (direction.includes('left')) {
            const deltaC = Math.round(dx / cellW);
            newW = Math.max(1, startW - deltaC);
            newC = startC + (startW - newW);
        }

        if (direction.includes('bottom')) {
            newH = Math.max(1, startH + Math.round(dy / cellH));
        } else if (direction.includes('top')) {
            const deltaR = Math.round(dy / cellH);
            newH = Math.max(1, startH - deltaR);
            newR = startR + (startH - newH);
        }

        if (canPlacePanel(panel.id, newR, newC, newW, newH)) {
            if (panel.r !== newR || panel.c !== newC || panel.w !== newW || panel.h !== newH) {
                panel.r = newR; panel.c = newC; panel.w = newW; panel.h = newH;
                renderGrid(); 
            }
        }
    };

    const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
}

window.rollDice = function(sides) {
    const resDivs = document.querySelectorAll('[id^="dice-result-"]');
    const roll = Math.floor(Math.random() * sides) + 1;
    resDivs.forEach(div => {
        if(div.closest('.panel-content-diceroller').matches(':hover')){
            div.textContent = `1d${sides} Sonucu: ${roll}`;
            div.style.color = '#b52b2b';
            setTimeout(() => div.style.color = '#eee', 500);
        }
    });
}


function setupFullscreen() {
    const fsBtn = document.getElementById('fullscreen-toggle-btn');
    if (!fsBtn) return;

    // Cihazın Dokunmatik (iPad/Mobil) olup olmadığını KESİN anlayan sistem
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.matchMedia("(max-width: 1366px)").matches;

    fsBtn.addEventListener('click', () => {
        if (isTouchDevice) {
            // DURUM 1: IPAD / MOBİL (Yalancı Tam Ekran - Sadece Header'ı Gizler)
            if (document.body.classList.contains('fullscreen-mode')) {
                document.body.classList.remove('fullscreen-mode');
                fsBtn.innerHTML = '⛶'; 
                fsBtn.title = "Arayüzü Gizle";
            } else {
                document.body.classList.add('fullscreen-mode');
                fsBtn.innerHTML = 'X'; 
                fsBtn.title = "Arayüzü Göster";
            }
        } else {
            // DURUM 2: MASAÜSTÜ (Gerçek Tam Ekran)
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(err => {
                    console.error(`Tam ekran hatası: ${err.message}`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    });

    // Masaüstü tam ekran değişikliklerini (ESC'ye basılma durumunu) dinlemeye devam et
    document.addEventListener('fullscreenchange', () => {
        if (isTouchDevice) return; // Mobil/iPad ise yalancı tam ekranı bozmasına izin verme

        if (document.fullscreenElement) {
            document.body.classList.add('fullscreen-mode');
            fsBtn.innerHTML = 'X'; 
            fsBtn.title = "Tam Ekrandan Çık (ESC)";
        } else {
            document.body.classList.remove('fullscreen-mode');
            fsBtn.innerHTML = '⛶'; 
            fsBtn.title = "Tam Ekran (ESC ile çık)";
        }
    });
}

/* ============================================================
   iOS/IPAD TAM EKRAN KORUMASI (ANTI-BOUNCE & AKILLI SCROLL)
   ============================================================ */
document.addEventListener('touchmove', function(e) {
    // 1. Kaydırılabilir olması muhtemel kutuyu bul
    const scrollableContainer = e.target.closest('.dice-workspace, .custom-rolls-section, .dice-history, .ct-combatants-list, .rich-text-editor, .ct-dropdown, .ct-modal-content');

    if (!scrollableContainer) {
        e.preventDefault(); 
        return;
    }
    if (scrollableContainer.scrollHeight <= scrollableContainer.clientHeight) {
        e.preventDefault();
    }
}, { passive: false });