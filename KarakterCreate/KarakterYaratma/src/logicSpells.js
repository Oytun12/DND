/* ============================================================
   LOGICSPELLS.JS - FINAL (AUTO-REFRESH + REST SYSTEM)
   ============================================================ */

if (typeof window.ALL_DATA === 'undefined') window.ALL_DATA = {};
let modalDisplayLimit = 50;
let isScrollListenerAttached = false;
let cachedLevel = 1; // Seviyeyi hafızada tutmak için değişken

/* --- SINIF AYARLARI --- */
const SPELL_CASTING_CONFIG = {
    "Büyücü":   { ability: "int", type: "full" },
    "Ozan":     { ability: "cha", type: "full" },
    "Rahip":    { ability: "wis", type: "full" },
    "Druid":    { ability: "wis", type: "full" },
    "Sorcerer": { ability: "cha", type: "full" },
    "Paladin":  { ability: "cha", type: "half" },
    "Kolcu":    { ability: "wis", type: "half" },
    "Warlock":  { ability: "cha", type: "pact" },
    "Barbarian": { ability: "cha", type: "none" },
    "Fighter":   { ability: "int", type: "third" }, 
    "Rogue":     { ability: "int", type: "third" }  
};

const FULL_CASTER_SLOTS = [
    [2,0,0,0,0,0,0,0,0], [3,0,0,0,0,0,0,0,0], [4,2,0,0,0,0,0,0,0], [4,3,0,0,0,0,0,0,0], [4,3,2,0,0,0,0,0,0],
    [4,3,3,0,0,0,0,0,0], [4,3,3,1,0,0,0,0,0], [4,3,3,2,0,0,0,0,0], [4,3,3,3,1,0,0,0,0], [4,3,3,3,2,0,0,0,0],
    [4,3,3,3,2,1,0,0,0], [4,3,3,3,2,1,0,0,0], [4,3,3,3,2,1,1,0,0], [4,3,3,3,2,1,1,0,0], [4,3,3,3,2,1,1,1,0],
    [4,3,3,3,2,1,1,1,0], [4,3,3,3,2,1,1,1,1], [4,3,3,3,3,1,1,1,1], [4,3,3,3,3,2,1,1,1], [4,3,3,3,3,2,2,1,1]
];

const WARLOCK_SLOTS = [
    {c:1,l:1}, {c:2,l:1}, {c:2,l:2}, {c:2,l:2}, {c:2,l:3}, {c:2,l:3}, {c:2,l:4}, {c:2,l:4}, {c:2,l:5}, {c:2,l:5},
    {c:3,l:5}, {c:3,l:5}, {c:3,l:5}, {c:3,l:5}, {c:3,l:5}, {c:3,l:5}, {c:4,l:5}, {c:4,l:5}, {c:4,l:5}, {c:4,l:5}
];

/* --- ANA RENDER --- */
window.renderSpellTab = async function(currentScores, currentLevel) {
    if (!currentScores && window.store && window.store.abilities) {
        currentScores = window.store.abilities.base;
    }
    // Seviye bilgisini güncelle ve hafızaya al
    if (currentLevel) cachedLevel = currentLevel;
    else if (window.store && window.targetLevel) cachedLevel = window.targetLevel; // Yedek

    updateSpellStats(currentScores, cachedLevel);

    if (!window.ALL_DATA.spells || window.ALL_DATA.spells.length === 0) {
        const container = document.getElementById('spell-list-container');
        if(container) container.innerHTML = `<div style="text-align:center; padding:20px; color:#e67e22;">⏳ Büyü veritabanı yükleniyor...</div>`;
        await loadSpellData();
    }
    renderMySpellList(cachedLevel);
};

async function loadSpellData() {
    try {
        const response = await fetch('../../Data/spells/spells-phb.json');
        if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);
        const json = await response.json();
        window.ALL_DATA.spells = json.spell || json;
    } catch (err) { console.error("Büyü hatası:", err); }
}

/* --- İSTATİSTİKLERİ GÜNCELLE --- */
function updateSpellStats(scores, level) {
    const store = window.store || {};
    const charClass = (store.class && store.class.selected) ? store.class.selected.name : "Büyücü";
    const config = SPELL_CASTING_CONFIG[charClass] || { ability: "int", type: "none" };
    const abilityKey = config.ability;
    const abilityScore = scores ? (scores[abilityKey] || 10) : 10;
    const mod = Math.floor((abilityScore - 10) / 2);
    const lvl = level || 1;
    const prof = Math.ceil(lvl / 4) + 1;

    const elName = document.getElementById('spell-ability-name');
    if(elName) {
        elName.innerText = abilityKey.toUpperCase();
        document.getElementById('spell-ability-mod').innerText = (mod >= 0 ? "+" : "") + mod;
        document.getElementById('spell-save-dc').innerText = 8 + prof + mod;
        document.getElementById('spell-attack-bonus').innerText = (prof + mod >= 0 ? "+" : "") + (prof + mod);
    }
}

/* --- LİSTEYİ RENDER ET (ÜST SEVİYE DESTEKLİ) --- */
function renderMySpellList(level) {
    const container = document.getElementById('spell-list-container');
    if(!container) return;
    container.innerHTML = "";

    const effectiveLevel = level || cachedLevel;
    const store = window.store || { spells: { known: [] } };
    if (!store.spells) store.spells = { known: [] };
    
    // Veri Yoksa Hata Vermesin
    const mySpells = (store.spells.known || []).map(name => 
        window.ALL_DATA.spells.find(s => s.name === name) || 
        { name: name, level: 0, school: "U", entries: ["Veri yok"] }
    );

    // Slot Hesaplama (Aynı kalıyor)
    const charClass = (store.class && store.class.selected) ? store.class.selected.name : "Büyücü";
    const config = SPELL_CASTING_CONFIG[charClass] || { type: "full" };
    let slots = [0,0,0,0,0,0,0,0,0];

    if (config.type === 'full') slots = FULL_CASTER_SLOTS[effectiveLevel - 1] || slots;
    else if (config.type === 'half') {
        const eff = Math.floor(effectiveLevel / 2);
        if (eff > 0) slots = FULL_CASTER_SLOTS[eff - 1] || slots;
    } 
    else if (config.type === 'pact') {
        const wData = WARLOCK_SLOTS[effectiveLevel - 1] || { c: 0, l: 0 };
        if (wData.l > 0) slots[wData.l - 1] = wData.c;
    }

    for (let i = 0; i <= 9; i++) {
        const spellsOfLevel = mySpells.filter(s => s.level === i);
        const slotCount = i > 0 ? slots[i-1] : 0;
        
        if (i === 0 || slotCount > 0 || spellsOfLevel.length > 0) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'spell-level-group';
            const levelTitle = i === 0 ? "Cantrips (0. Seviye)" : `${i}. Seviye`;
            
            let slotsHTML = "";
            if (i > 0 && slotCount > 0) {
                const slotLabel = (config.type === 'pact') ? "Pact Slot:" : "Slotlar:";
                slotsHTML = `<div class="spell-slots"><span class="slot-label">${slotLabel}</span>`;
                for(let s=0; s<slotCount; s++) slotsHTML += `<input type="checkbox" class="slot-checkbox">`;
                slotsHTML += `</div>`;
            }

            groupDiv.innerHTML = `<div class="level-header"><span class="level-title">${levelTitle}</span>${slotsHTML}</div><div class="spell-list-items"></div>`;
            const listDiv = groupDiv.querySelector('.spell-list-items');
            
            if (spellsOfLevel.length === 0) listDiv.innerHTML = `<div style="padding:10px; color:#666;">-</div>`;
            else {
                spellsOfLevel.forEach(spell => {
                    const safeName = spell.name.replace(/'/g, "\\'");
                    
                    // --- 1. NORMAL AÇIKLAMALAR ---
                    let detailsHTML = renderEntries(spell.entries);

                    // --- 2. ÜST SEVİYE BİLGİSİ VARSA EKLE ---
                    if (spell.entriesHigherLevel) {
                        detailsHTML += `<div style="margin-top:12px; padding-top:8px; border-top:1px dashed #444; color:#ccc;">`;
                        detailsHTML += renderEntries(spell.entriesHigherLevel);
                        detailsHTML += `</div>`;
                    }

                    const row = document.createElement('div');
                    row.className = 'spell-row';
                    row.innerHTML = `
                        <div class="spell-row-header">
                            <div class="spell-info" onclick="window.toggleSpellDetail(this)">
                                <span class="spell-name">${spell.name} <span class="arrow-icon">▼</span></span>
                                <span class="spell-meta">${formatSchool(spell.school)} • ${formatComponents(spell.components)}</span>
                            </div>
                            <button class="btn-remove-spell" onclick="window.removeSpellFromCharacter('${safeName}')">❌</button>
                        </div>
                        <div class="spell-detail-content">${detailsHTML}</div>
                    `;
                    listDiv.appendChild(row);
                });
            }
            container.appendChild(groupDiv);
        }
    }
}

/* --- FORMATLAMA FONKSİYONU (TÜRKÇELEŞTİRME EKLENDİ) --- */
function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    if (!Array.isArray(entries)) entries = [entries];
    
    entries.forEach(e => {
        if (typeof e === 'string') {
            html += `<p>${format5eText(e)}</p>`;
        } 
        else if (e.entries) {
            // Başlık Çevirisi
            let header = e.name || "";
            if (header === "At Higher Levels") header = "Üst Seviyelerde";

            html += `<p><strong>${header}.</strong> ${renderEntries(e.entries)}</p>`;
        }
    });
    return html;
}

/* --- YARDIMCILAR --- */
window.toggleSpellDetail = function(el) { el.closest('.spell-row').classList.toggle('expanded'); };

function format5eText(text) {
    if (!text || typeof text !== 'string') return text || "";
    // ZAR: onclick="window.globalRollDice('1d6')"
    text = text.replace(/{@damage ([^}]+)}/g, (m, d) => 
        `<span class="spell-text-damage clickable" onclick="event.stopPropagation(); window.globalRollDice('${d}')">✨ ${d}</span>`
    );
    text = text.replace(/{@dice ([^}]+)}/g, (m, d) => 
        `<span class="spell-text-damage clickable" onclick="event.stopPropagation(); window.globalRollDice('${d}')">✨ ${d}</span>`
    );
    text = text.replace(/{@save (\w+)}/g, '<span class="spell-text-save">$1 Save</span>');
    text = text.replace(/{@dc ([^}]+)}/g, '<span class="spell-text-save">DC $1</span>');
    text = text.replace(/{@\w+ ([^}|]+)(?:\|[^}]+)?}/g, '<span class="spell-text-link">$1</span>');
    return text;
}

/* --- DİNLENME VE RESETLEME (YENİ) --- */
window.resetSpellSlots = function(restType) {
    const store = window.store;
    if (!store || !store.class || !store.class.selected) return;

    const charClass = store.class.selected.name;
    const config = SPELL_CASTING_CONFIG[charClass] || { type: 'full' };
    const isWarlock = config.type === 'pact';

    // Uzun Dinlenme: Herkesin slotu yenilenir
    // Kısa Dinlenme: Sadece Warlock'un slotu yenilenir
    if (restType === 'long' || (restType === 'short' && isWarlock)) {
        const slots = document.querySelectorAll('.slot-checkbox');
        let count = 0;
        slots.forEach(cb => {
            if (cb.checked) {
                cb.checked = false;
                count++;
            }
        });
        if (count > 0) {
            console.log(`${count} büyü yuvası yenilendi.`);
        }
    }
};

/* ============================================================
   MODAL, FİLTRELEME VE SIRALAMA (PROFESYONEL VERSİYON)
   ============================================================ */

/* --- MODAL AÇ --- */
window.openSpellModal = async function() {
    const modal = document.getElementById('modal-spell-search');
    if(modal) modal.classList.remove('hidden');
    
    // Veri Yükle
    if (!window.ALL_DATA.spells) await loadSpellData();
    
    // Sınıf Filtresini Doldur (Sadece bir kere)
    populateClassFilter();

    // Event Listener'ları kur (Scroll ve Inputlar)
    setupModalListeners();

    // İlk Render
    filterAndRenderModalSpells();
};

/* --- MODAL KAPAT --- */
window.closeSpellModal = function() { 
    const modal = document.getElementById('modal-spell-search');
    if(modal) modal.classList.add('hidden'); 
};

/* --- SINIF LİSTESİNİ DOLDUR --- */
function populateClassFilter() {
    const classSelect = document.getElementById('modal-spell-class-filter');
    if (!classSelect || classSelect.options.length > 1) return; // Zaten doluysa geç

    const classes = [
        "Bard", "Cleric", "Druid", "Paladin", "Ranger", 
        "Sorcerer", "Warlock", "Wizard", "Artificer"
    ];
    
    // Türkçe Çeviri Haritası (İsteğe bağlı, veri tabanı İngilizce ise value İngilizce kalmalı)
    const trMap = {
        "Bard": "Ozan", "Cleric": "Rahip", "Druid": "Druid", "Paladin": "Paladin",
        "Ranger": "Kolcu", "Sorcerer": "Sorcerer", "Warlock": "Warlock", 
        "Wizard": "Büyücü", "Artificer": "Artificer"
    };

    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls; // Veritabanındaki isim (Genelde İngilizce)
        option.text = trMap[cls] || cls;
        classSelect.appendChild(option);
    });
}

/* --- LISTENER KURULUMU --- */
function setupModalListeners() {
    const body = document.querySelector('#modal-spell-search .modal-body');
    const inputs = [
        'modal-spell-search-input', 
        'modal-spell-level-filter', 
        'modal-spell-class-filter', 
        'modal-spell-sort'
    ];

    // Scroll Listener
    if(body && !isScrollListenerAttached) {
        body.addEventListener('scroll', () => {
            if (body.scrollTop + body.clientHeight >= body.scrollHeight - 50) {
                modalDisplayLimit += 50;
                filterAndRenderModalSpells(true);
            }
        });
        isScrollListenerAttached = true;
    }

    // Input Change Listeners
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            // Eski listenerları temizlemek zor olduğu için onchange/oninput üzerine yazıyoruz
            el.oninput = () => { modalDisplayLimit=50; filterAndRenderModalSpells(); };
            el.onchange = () => { modalDisplayLimit=50; filterAndRenderModalSpells(); };
        }
    });
}

/* --- ANA FİLTRELEME VE RENDER FONKSİYONU --- */
window.filterAndRenderModalSpells = function(keepScroll = false) {
    const searchInput = document.getElementById('modal-spell-search-input');
    const levelSelect = document.getElementById('modal-spell-level-filter');
    const classSelect = document.getElementById('modal-spell-class-filter');
    const sortSelect  = document.getElementById('modal-spell-sort');
    const resultsContainer = document.getElementById('modal-spell-results');
    const scrollContainer = document.querySelector('#modal-spell-search .modal-body');

    if(!searchInput || !resultsContainer || !window.ALL_DATA.spells) return;

    // Scroll Pozisyonunu Kaydet
    const currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
    if (!keepScroll) { 
        modalDisplayLimit = 50; 
        if(scrollContainer) scrollContainer.scrollTop = 0; 
    }

    // Değerleri Al
    const searchText = searchInput.value.toLowerCase();
    const levelVal = levelSelect ? levelSelect.value : "all";
    const classVal = classSelect ? classSelect.value : "all";
    const sortVal  = sortSelect ? sortSelect.value : "level_asc";

    // 1. FİLTRELEME
    let filtered = window.ALL_DATA.spells.filter(spell => {
        // İsim Filtresi
        if (searchText && !spell.name.toLowerCase().includes(searchText)) return false;
        
        // Seviye Filtresi
        if (levelVal !== "all" && spell.level.toString() !== levelVal) return false;
        
        // Sınıf Filtresi (Zor Kısım)
        // Veri yapısı genellikle: spell.classes.fromClassList = [{name: "Wizard", ...}]
        if (classVal !== "all") {
            if (!spell.classes || !spell.classes.fromClassList) return false;
            const belongsToClass = spell.classes.fromClassList.some(c => c.name === classVal);
            if (!belongsToClass) return false;
        }

        return true;
    });

    // 2. SIRALAMA (SORTING)
    filtered.sort((a, b) => {
        if (sortVal === 'name_asc') {
            return a.name.localeCompare(b.name);
        } 
        else if (sortVal === 'level_asc') {
            // Önce seviye, seviyeler eşitse isim
            return (a.level - b.level) || a.name.localeCompare(b.name);
        } 
        else if (sortVal === 'level_desc') {
            // Önce seviye (ters), seviyeler eşitse isim
            return (b.level - a.level) || a.name.localeCompare(b.name);
        }
        return 0;
    });

    // 3. LİMİTLEME (Infinite Scroll)
    const visibleSpells = filtered.slice(0, modalDisplayLimit);
    
    // 4. RENDER
    resultsContainer.innerHTML = "";

    if(visibleSpells.length === 0) {
        resultsContainer.innerHTML = "<div style='text-align:center; color:#888; padding:20px;'>Sonuç bulunamadı.</div>";
        return;
    }

    visibleSpells.forEach(spell => {
        const safeName = spell.name.replace(/'/g, "\\'");
        const isAdded = window.store && window.store.spells && window.store.spells.known.includes(spell.name);
        
        // Okul (School) Kısaltması
        const schoolCode = spell.school || "U";
        
        // Sınıflar (Tooltip veya küçük bilgi için - opsiyonel)
        // const classListStr = spell.classes && spell.classes.fromClassList ? spell.classes.fromClassList.map(c=>c.name).join(', ') : "";

        // Buton
        let btnHTML = "";
        if (isAdded) {
            btnHTML = `<button class="btn-select-spell remove-mode" onclick="window.toggleSpellFromModal('${safeName}', this)">Çıkar</button>`;
        } else {
            btnHTML = `<button class="btn-select-spell" onclick="window.toggleSpellFromModal('${safeName}', this)">Ekle</button>`;
        }

        const div = document.createElement('div');
        div.className = 'spell-result-card';
        div.innerHTML = `
            <div style="flex:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${spell.name}</strong> 
                    <span class="spell-meta-badge">Lv. ${spell.level}</span>
                </div>
                <small style="color:#666;">${formatSchool(schoolCode)} ${spell.meta && spell.meta.rit ? '• Ritual' : ''}</small>
            </div>
            ${btnHTML}
        `;
        resultsContainer.appendChild(div);
    });

    // Scrollu geri yükle (Sadece scroll ile tetiklendiyse)
    if (keepScroll && scrollContainer) scrollContainer.scrollTop = currentScroll;
}

window.toggleSpellFromModal = function(spellName, btnElement) {
    const store = window.store;
    if (!store) return;
    if (!store.spells) store.spells = { known: [] };
    if (!store.spells.known) store.spells.known = [];
    
    const index = store.spells.known.indexOf(spellName);
    
    if (index > -1) {
        store.spells.known.splice(index, 1);
        if (btnElement) {
            btnElement.innerText = "Ekle";
            btnElement.className = "btn-select-spell";
        }
    } else {
        store.spells.known.push(spellName);
        if (btnElement) {
            btnElement.innerText = "Çıkar";
            btnElement.className = "btn-select-spell remove-mode";
        }
    }
    // GÜNCELLEME: Listeyi anında yenile (Cache kullanarak)
    renderMySpellList(); 
};

window.addSpellToCharacter = window.toggleSpellFromModal; 
window.removeSpellFromCharacter = function(spellName) { 
    if (!confirm("Silinsin mi?")) return;
    const store = window.store;
    if (!store || !store.spells) return;
    store.spells.known = store.spells.known.filter(s => s !== spellName);
    renderMySpellList();
};

function formatSchool(code) { const map = { "E": "Evoc", "C": "Conj", "N": "Necro", "I": "Illu", "A": "Abjur", "T": "Trans", "D": "Div", "EN": "Ench" }; return map[code] || code; }
function formatComponents(comp) { if (!comp) return ""; let res = []; if(comp.v) res.push("V"); if(comp.s) res.push("S"); if(comp.m) res.push("M"); return res.join(", "); }

export function useSpellLogic() { return {}; }