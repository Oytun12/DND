/* ============================================================
   SCRIPT-DMSCREEN.JS - Akıllı (State-Preserving) Grid Motoru
   ============================================================ */

let GRID_COLS = 4;
let GRID_ROWS = 2;
let PANELS = []; 
let editingPanelId = null;
let activeAddTarget = null; 

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

document.addEventListener("DOMContentLoaded", () => {
    setupControls();
    setupModal();
    renderGrid(); 
});

// --- KONTROL VE MODAL YÖNETİMİ ---
function setupControls() {
    const settingsModal = document.getElementById('grid-settings-modal');
    
    document.getElementById('open-grid-modal-btn').onclick = () => settingsModal.classList.add('open');
    const mobileBtn = document.getElementById('open-grid-modal-mobile');
    if(mobileBtn) mobileBtn.onclick = () => settingsModal.classList.add('open');

    document.querySelector('.close-settings-btn').onclick = () => {
        settingsModal.classList.remove('open');
        document.getElementById('reset-confirm-area').style.display = 'none';
    };

    document.getElementById('build-grid-btn').onclick = () => {
        GRID_COLS = parseInt(document.getElementById('grid-cols').value) || 4;
        GRID_ROWS = parseInt(document.getElementById('grid-rows').value) || 2;
        
        PANELS = PANELS.filter(p => p.r + p.h - 1 <= GRID_ROWS && p.c + p.w - 1 <= GRID_COLS);
        renderGrid();
        settingsModal.classList.remove('open');
    };

    document.getElementById('confirm-reset-btn').onclick = () => {
        document.getElementById('reset-confirm-area').style.display = 'block';
    };
    
    document.getElementById('cancel-reset-btn').onclick = () => {
        document.getElementById('reset-confirm-area').style.display = 'none';
    };

    document.getElementById('reset-screen-btn').onclick = () => {
        PANELS = [];
        editingPanelId = null;
        renderGrid();
        document.getElementById('reset-confirm-area').style.display = 'none';
        settingsModal.classList.remove('open');
    };
}

function setupModal() {
    const typeModal = document.getElementById('panel-type-modal');
    document.querySelector('.close-type-btn').onclick = () => typeModal.classList.remove('open');
    
    typeModal.querySelectorAll('.type-opt-btn').forEach(btn => {
        btn.onclick = () => {
            if (activeAddTarget) {
                PANELS.push({
                    id: Date.now(), // Benzersiz ID
                    r: activeAddTarget.r,
                    c: activeAddTarget.c,
                    w: 1, h: 1,
                    type: btn.dataset.type
                });
                typeModal.classList.remove('open');
                renderGrid();
            }
        };
    });
}

// --- ANA GRID ÇİZİCİ (YENİ AKILLI SİSTEM) ---
function renderGrid() {
    const container = document.getElementById('dm-grid');
    
    // 1. Grid Sınırlarını Güncelle
    container.style.gridTemplateColumns = `repeat(${GRID_COLS}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${GRID_ROWS}, 1fr)`;

    // 2. Önceki "Boş" yuvaları tamamen sil (Her seferinde yeniden hesaplanacaklar)
    container.querySelectorAll('.empty-panel').forEach(el => el.remove());

    // 3. Silinmesi gereken DOLU panelleri DOM'dan kaldır (Eğer kullanıcı Çarpı'ya bastıysa)
    const currentPanelIds = PANELS.map(p => p.id.toString());
    container.querySelectorAll('.dm-panel').forEach(el => {
        if (!currentPanelIds.includes(el.dataset.id)) {
            el.remove();
        }
    });

    // 4. Mevcut Panellerin Sadece Konumunu Güncelle (İçerikleri Yenilenmez!)
    PANELS.forEach(p => {
        let panelEl = container.querySelector(`.dm-panel[data-id="${p.id}"]`);
        
        // Eğer DOM'da bu panel henüz yoksa, İLK KEZ oluştur
        if (!panelEl) {
            panelEl = createNewPanelDOM(p);
            container.appendChild(panelEl);
        }
        
        // Zaten varsa (veya yeni oluştuysa) sadece Grid Alanını (CSS) güncelle
        panelEl.style.gridArea = `${p.r} / ${p.c} / span ${p.h} / span ${p.w}`;
        
        // Edit Katmanını (Overlay) Yönet
        manageEditOverlay(panelEl, p);
    });

    // 5. Boş Alanları (Empty Cells) Hesapla ve Çiz
    let occupied = Array(GRID_ROWS + 1).fill(0).map(() => Array(GRID_COLS + 1).fill(false));
    PANELS.forEach(p => {
        for(let i = p.r; i < p.r + p.h; i++) {
            for(let j = p.c; j < p.c + p.w; j++) {
                if(i <= GRID_ROWS && j <= GRID_COLS) occupied[i][j] = true;
            }
        }
    });

    for(let i = 1; i <= GRID_ROWS; i++) {
        for(let j = 1; j <= GRID_COLS; j++) {
            if(!occupied[i][j]) {
                const empty = document.createElement('div');
                empty.className = 'grid-cell empty-panel';
                empty.style.gridArea = `${i} / ${j} / span 1 / span 1`;
                
                empty.innerHTML = '<button class="add-content-btn" title="Yeni Panel Ekle">+</button>';
                
                empty.querySelector('.add-content-btn').onclick = () => {
                    activeAddTarget = { r: i, c: j };
                    document.getElementById('panel-type-modal').classList.add('open');
                };

                // Taşıma İşlemleri
                empty.ondragover = (e) => { e.preventDefault(); empty.classList.add('drag-over'); };
                empty.ondragleave = () => empty.classList.remove('drag-over');
                empty.ondrop = (e) => {
                    e.preventDefault();
                    empty.classList.remove('drag-over');
                    const id = e.dataTransfer.getData('text/plain');
                    const draggedP = PANELS.find(x => x.id == id);
                    if (draggedP && canPlacePanel(draggedP.id, i, j, draggedP.w, draggedP.h)) {
                        draggedP.r = i; draggedP.c = j;
                        editingPanelId = null;
                        renderGrid(); // Bu render işlemi sadece konumu günceller!
                    }
                };

                container.appendChild(empty);
            }
        }
    }
}

// --- PANEL İÇERİĞİ OLUŞTURMA (SADECE BİR KERE ÇALIŞIR) ---
function createNewPanelDOM(p) {
    const panelEl = document.createElement('div');
    panelEl.className = 'dm-panel';
    panelEl.dataset.id = p.id; // Güncelleme takibi için çok önemli!

    let title = "", contentHtml = "", extraClass = "";

    if (p.type === 'notes') { 
        title = "📝 Serbest Notlar"; 
        contentHtml = `<div class="panel-content-notes"><textarea placeholder="Düşüncelerini buraya yaz..."></textarea></div>`; 
    } else if (p.type === 'diceroller') { 
        title = "🎲 Zar Atıcı"; 
        contentHtml = `
            <div class="panel-content-diceroller">
                <div class="dice-buttons">
                    <button class="dice-btn" onclick="rollDice(20)">d20</button>
                    <button class="dice-btn" onclick="rollDice(12)">d12</button>
                    <button class="dice-btn" onclick="rollDice(10)">d10</button>
                    <button class="dice-btn" onclick="rollDice(8)">d8</button>
                    <button class="dice-btn" onclick="rollDice(6)">d6</button>
                    <button class="dice-btn" onclick="rollDice(4)">d4</button>
                </div>
                <div id="dice-result-${p.id}" style="margin-top: auto; padding: 15px; background-color: #111; border-radius: 4px; text-align: center; font-weight: bold;">Zar atın</div>
            </div>`; 
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
                <button class="panel-control-btn edit-panel-btn" title="Genişlet & Taşı">⤡</button>
                <button class="panel-control-btn remove-panel-btn" title="Kapat">✕</button>
            </div>
        </div>
        <div class="panel-content${extraClass}">${contentHtml}</div>
    `;

    // Etkileşim Butonları
    panelEl.querySelector('.remove-panel-btn').onclick = () => {
        PANELS = PANELS.filter(x => x.id !== p.id);
        renderGrid();
    };

    panelEl.querySelector('.edit-panel-btn').onclick = () => {
        editingPanelId = editingPanelId === p.id ? null : p.id;
        renderGrid();
    };

    return panelEl;
}

// --- EDİT (SÜRÜKLE/GENİŞLET) KATMANI YÖNETİMİ ---
function manageEditOverlay(panelEl, p) {
    let overlay = panelEl.querySelector('.edit-overlay');
    
    // Panel düzenleme modundaysa ve arayüzü yoksa EKLE
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
    } 
    // Panel düzenleme modunda değilse ve arayüzü kalmışsa SİL
    else {
        if (overlay) overlay.remove();
    }
}

// --- BOŞLUK KONTROLÜ VE YENİDEN BOYUTLANDIRMA ---
function canPlacePanel(ignoreId, r, c, w, h) {
    if (r < 1 || c < 1 || r + h - 1 > GRID_ROWS || c + w - 1 > GRID_COLS) return false;
    for (let i = r; i < r + h; i++) {
        for (let j = c; j < c + w; j++) {
            const occupant = PANELS.find(p => p.id !== ignoreId && i >= p.r && i < p.r + p.h && j >= p.c && j < p.c + p.w);
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
    const cellW = gridEl.getBoundingClientRect().width / GRID_COLS;
    const cellH = gridEl.getBoundingClientRect().height / GRID_ROWS;

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

// --- GLOBAL ZAR ATICI ---
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