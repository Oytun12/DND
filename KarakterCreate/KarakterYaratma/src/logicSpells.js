/* ============================================================
   LOGICSPELLS.JS - FINAL (AUTO-REFRESH + REST SYSTEM + TR FILTER FIXED)
   ============================================================ */

if (typeof window.ALL_DATA === 'undefined') window.ALL_DATA = {};
let modalDisplayLimit = 50;
let isScrollListenerAttached = false;
let cachedLevel = 1; 

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

/* --- ÇEVİRİ HARİTASI --- */
const DB_CLASS_MAP = {
    "Sorcerer": "Sorcerer",
    "Büyücü": "Büyücü",
    "Rahip": "Rahip",
    "Paladin": "Paladin",
    "Kolcu": "Kolcu",
    "Ozan": "Ozan",
    "Druid": "Druid",
    "Warlock": "Warlock",
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

/* ============================================================
   FONKSİYON TANIMLARI (Önce tanımla, sonra window'a ata)
   ============================================================ */

/* --- VERİ YÜKLEME --- */
async function loadSpellData() {
    try {
        const response = await fetch('../../Data/spells/spells-phb.json');
        if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);
        const json = await response.json();
        window.ALL_DATA.spells = json.spell || json;
    } catch (err) { console.error("Büyü hatası:", err); }
}

/* --- ANA RENDER --- */
async function renderSpellTab(currentScores, currentLevel) {
    if (!currentScores && window.store && window.store.abilities) {
        currentScores = window.store.abilities.base;
    }
    if (currentLevel) cachedLevel = currentLevel;
    else if (window.store && window.targetLevel) cachedLevel = window.targetLevel;

    updateSpellStats(currentScores, cachedLevel);

    if (!window.ALL_DATA.spells || window.ALL_DATA.spells.length === 0) {
        const container = document.getElementById('spell-list-container');
        if(container) container.innerHTML = `<div style="text-align:center; padding:20px; color:#e67e22;">⏳ Büyü veritabanı yükleniyor...</div>`;
        await loadSpellData();
    }
    renderMySpellList(cachedLevel);
}

/* --- İSTATİSTİKLER --- */
function updateSpellStats(scores, level) {
    const store = window.store || {};
    const charClass = (store.class && store.class.selected) ? store.class.selected.name : "Büyücü";
    const config = SPELL_CASTING_CONFIG[charClass] || { ability: "int", type: "none" };
    const abilityKey = config.ability;
    const abilityScore = scores ? (scores[abilityKey] || 10) : 10;
    const mod = Math.floor((abilityScore - 10) / 2);
    const lvl = level || 1;
    const prof = Math.ceil(lvl / 4) + 1;

    // Elementlerin varlığını kontrol ederek işlem yap (Hata vermeyi engeller)
    const elName = document.getElementById('spell-ability-name');
    if (elName) elName.innerText = abilityKey.toUpperCase();

    const elMod = document.getElementById('spell-ability-mod');
    if (elMod) elMod.innerText = (mod >= 0 ? "+" : "") + mod;

    const elDC = document.getElementById('spell-save-dc');
    if (elDC) elDC.innerText = 8 + prof + mod;

    // Bu eleman Vue tarafında handle edildiği için HTML'de ID'si olmayabilir.
    // Varsa günceller, yoksa hata vermeden devam eder.
    const elAtk = document.getElementById('spell-attack-bonus');
    if (elAtk) elAtk.innerText = (prof + mod >= 0 ? "+" : "") + (prof + mod);
}

/* --- LİSTE RENDER --- */
function renderMySpellList(level) {
    const container = document.getElementById('spell-list-container');
    if(!container) return;
    container.innerHTML = "";

    const effectiveLevel = level || cachedLevel;
    const store = window.store || { spells: { known: [] } };
    if (!store.spells) store.spells = { known: [] };

    // KRİTİK GÜNCELLEME: Hem String (Listeden) hem Object (Özel) büyüleri tanı
    const mySpells = (store.spells.known || []).map(item => {
        // Eğer öğe bir string ise (eski kayıtlar veya listeden seçilenler), veritabanından bul
        if (typeof item === 'string') {
            return window.ALL_DATA.spells.find(s => s.name === item) || { name: item, level: 0, school: "U", entries: ["Veri yok"] };
        }
        // Eğer öğe bir obje ise (bizim yarattığımız özel büyü), direkt kullan
        return item;
    });

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
                    const schoolCode = spell.school || "U";
                    
                    // --- 1. MİNİMAL VERİ HAZIRLIĞI ---
                    
                    // Süre (Time) -> "1 Eylem"
                    let timeStr = "";
                    if (spell.time && spell.time[0]) {
                        const t = spell.time[0];
                        // Basit çeviriler
                        let unit = t.unit === "action" ? "Eylem" : (t.unit === "bonus" ? "Bonus" : (t.unit === "reaction" ? "Tepki" : t.unit));
                        timeStr = `${t.number} ${unit}`;
                    }

                    // Menzil (Range) -> "60 ft" veya "Dokunma"
                    let rangeStr = "";
                    if (spell.range) {
                        if (spell.range.distance) {
                            rangeStr = `${spell.range.distance.amount || ''} ${spell.range.distance.type || ''}`;
                        } else if (spell.range.type) {
                            rangeStr = (spell.range.type === "touch") ? "Dokunma" : ((spell.range.type === "self") ? "Kendin" : spell.range.type);
                        }
                    }

                    // Etki (Duration) -> "Anlık" veya "1 dk (C)"
                    let durStr = "";
                    if (spell.duration && spell.duration[0]) {
                        const d = spell.duration[0];
                        if (d.type === 'instant') durStr = "Anlık";
                        else if (d.type === 'permanent') durStr = "Kalıcı";
                        else if (d.type === 'timed') {
                            const dUnit = (d.duration.type === "minute") ? "dk" : ((d.duration.type === "hour") ? "sa" : d.duration.type);
                            durStr = `${d.duration.amount} ${dUnit}`;
                        }
                        // Konsantrasyon varsa (C) ekle ama meta etiketinde zaten renkli C var, 
                        // o yüzden buraya metin olarak eklemeye gerek yok, sadece süreyi yazalım.
                    }

                    // --- 2. SATIR OLUŞTURMA ---
                    const row = document.createElement('div');
                    row.className = 'spell-row';

                    // Eski sade açıklama formatı (renderEntries) kullanıyoruz
                    // Eğer renderEntries fonksiyonu dosyanın altında tanımlı değilse, onu da eklememiz gerekebilir.
                    // (Genelde "utils" veya dosyanın altında olur)
                    let detailsHTML = "";
                    if(typeof renderEntries === 'function') {
                         detailsHTML = renderEntries(spell.entries);
                    } else {
                        // Yedek plan (Eğer fonksiyon yoksa basitçe yaz)
                        detailsHTML = "<p>Detay yüklenemedi.</p>"; 
                    }
                    
                    if (spell.entriesHigherLevel) {
                         if(typeof renderEntries === 'function') {
                            detailsHTML += `<div style="margin-top:10px; padding-top:10px; border-top:1px dashed #333; color:#aaa;"><strong>Üst Seviyelerde:</strong> ${renderEntries(spell.entriesHigherLevel)}</div>`;
                         }
                    }

                    row.innerHTML = `
                        <div class="spell-row-header" onclick="this.parentElement.classList.toggle('expanded')">
                            <div style="flex:1;">
                                <span class="spell-name">${spell.name}</span>
                                <span class="spell-meta">
                                    <span style="color:#ccc;">${formatSchool(schoolCode)}</span> • 
                                    <span style="color:#aaa;">${formatComponents(spell.components)}</span>
                                    
                                    <span style="color:#666; margin-left:4px;">
                                        • ${timeStr} • ${rangeStr} • ${durStr}
                                    </span>
                                    
                                    ${spell.meta && spell.meta.rit ? '<span class="ritual-tag">R</span>' : ''}
                                    ${(spell.duration && spell.duration[0] && spell.duration[0].concentration) ? '<span class="conc-tag">C</span>' : ''}
                                </span>
                            </div>
                            <button class="btn-remove-spell btn-icon-delete" onclick="event.stopPropagation(); removeSpellFromCharacter('${safeName}')"><svg viewBox="0 0 24 24"><path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" /></svg></button>
                        </div>
                        <div class="spell-detail-content">
                            ${detailsHTML}
                        </div>
                    `;
                    listDiv.appendChild(row);
                });
            }
            container.appendChild(groupDiv);
        }
    }
}

/* --- YARDIMCILAR --- */
function toggleSpellDetail(el) { el.closest('.spell-row').classList.toggle('expanded'); }

function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    if (!Array.isArray(entries)) entries = [entries];
    entries.forEach(e => {
        if (typeof e === 'string') html += `<p>${format5eText(e)}</p>`;
        else if (e.entries) {
            let header = e.name || "";
            if (header === "At Higher Levels") header = "Üst Seviyelerde";
            html += `<p><strong style="color:#e67e22;">${header}.</strong> ${renderEntries(e.entries)}</p>`;
        }
    });
    return html;
}

function format5eText(text) {
    if (!text || typeof text !== 'string') return text || "";
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

function resetSpellSlots(restType) {
    const store = window.store;
    if (!store || !store.class || !store.class.selected) return;
    const charClass = store.class.selected.name;
    const config = SPELL_CASTING_CONFIG[charClass] || { type: 'full' };
    const isWarlock = config.type === 'pact';
    if (restType === 'long' || (restType === 'short' && isWarlock)) {
        document.querySelectorAll('.slot-checkbox').forEach(cb => cb.checked = false);
    }
}

/* ============================================================
   MODAL VE FİLTRELEME (DÜZELTİLMİŞ)
   ============================================================ */

function populateClassFilter() {
    const classSelect = document.getElementById('modal-spell-class-filter');
    if (!classSelect || classSelect.options.length > 1) return; 
    const classNames = Object.keys(DB_CLASS_MAP).sort();
    classNames.forEach(clsName => {
        const option = document.createElement('option');
        option.value = clsName; 
        option.text = clsName;
        classSelect.appendChild(option);
    });
}

function setupModalListeners() {
    const body = document.querySelector('#modal-spell-search .modal-body');
    const inputs = [
        'modal-spell-search-input', 
        'modal-spell-level-filter', 
        'modal-spell-class-filter', 
        'modal-spell-sort'
    ];

    if(body && !isScrollListenerAttached) {
        body.addEventListener('scroll', () => {
            if (body.scrollTop + body.clientHeight >= body.scrollHeight - 50) {
                modalDisplayLimit += 50;
                filterAndRenderModalSpells(true);
            }
        });
        isScrollListenerAttached = true;
    }

    inputs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            // BURASI KRİTİK: Artık fonksiyon direkt adıyla çağrılabilir
            el.oninput = () => { modalDisplayLimit=50; filterAndRenderModalSpells(); };
            el.onchange = () => { modalDisplayLimit=50; filterAndRenderModalSpells(); };
        }
    });
}

async function openSpellModal() {
    document.getElementById('modal-spell-search').classList.remove('hidden');
    if (!window.ALL_DATA.spells) await loadSpellData();
    populateClassFilter();
    setupModalListeners();
    filterAndRenderModalSpells();
}

function closeSpellModal() { 
    document.getElementById('modal-spell-search').classList.add('hidden'); 
}

function filterAndRenderModalSpells(keepScroll = false) {
    const searchInput = document.getElementById('modal-spell-search-input');
    const levelSelect = document.getElementById('modal-spell-level-filter');
    const classSelect = document.getElementById('modal-spell-class-filter');
    const sortSelect  = document.getElementById('modal-spell-sort');
    const resultsContainer = document.getElementById('modal-spell-results');
    const scrollContainer = document.querySelector('#modal-spell-search .modal-body');

    if(!searchInput || !resultsContainer || !window.ALL_DATA.spells) return;

    const currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
    if (!keepScroll) { modalDisplayLimit = 50; if(scrollContainer) scrollContainer.scrollTop = 0; }

    const searchText = searchInput.value.toLowerCase();
    const levelVal = levelSelect ? levelSelect.value : "all";
    const classVal = classSelect ? classSelect.value : "all";
    const sortVal  = sortSelect ? sortSelect.value : "level_asc";

    let filtered = window.ALL_DATA.spells.filter(spell => {
        if (searchText && !spell.name.toLowerCase().includes(searchText)) return false;
        if (levelVal !== "all" && spell.level.toString() !== levelVal) return false;
        if (classVal !== "all") {
            const dbClassName = DB_CLASS_MAP[classVal]; 
            if (!spell.classes || !spell.classes.fromClassList) return false;
            const belongsToClass = spell.classes.fromClassList.some(c => c.name === dbClassName);
            if (!belongsToClass) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        if (sortVal === 'name_asc') return a.name.localeCompare(b.name);
        else if (sortVal === 'level_asc') return (a.level - b.level) || a.name.localeCompare(b.name);
        else if (sortVal === 'level_desc') return (b.level - a.level) || a.name.localeCompare(b.name);
        return 0;
    });

    const visibleSpells = filtered.slice(0, modalDisplayLimit);
    resultsContainer.innerHTML = "";

    if(visibleSpells.length === 0) {
        resultsContainer.innerHTML = "<div style='text-align:center; color:#888; padding:20px;'>Sonuç bulunamadı.</div>";
        return;
    }

    visibleSpells.forEach(spell => {
        const safeName = spell.name.replace(/'/g, "\\'");
        const isAdded = window.store && window.store.spells && window.store.spells.known.includes(spell.name);
        const schoolCode = spell.school || "U";
        
        let btnHTML = isAdded 
            ? `<button class="btn-select-spell remove-mode" onclick="window.toggleSpellFromModal('${safeName}', this)">Çıkar</button>`
            : `<button class="btn-select-spell" onclick="window.toggleSpellFromModal('${safeName}', this)">Ekle</button>`;

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

    if (keepScroll && scrollContainer) scrollContainer.scrollTop = currentScroll;
}

function toggleSpellFromModal(spellName, btnElement) {
    const store = window.store;
    if (!store) return;
    if (!store.spells) store.spells = { known: [] };
    if (!store.spells.known) store.spells.known = [];
    
    const index = store.spells.known.indexOf(spellName);
    
    if (index > -1) {
        store.spells.known.splice(index, 1);
        if (btnElement) { btnElement.innerText = "Ekle"; btnElement.className = "btn-select-spell"; }
    } else {
        store.spells.known.push(spellName);
        if (btnElement) { btnElement.innerText = "Çıkar"; btnElement.className = "btn-select-spell remove-mode"; }
    }
    renderMySpellList(cachedLevel); 
}

function removeSpellFromCharacter(spellName) { 
    // YENİ SİSTEM:
    window.customConfirm(`${spellName} büyü kitabından çıkarılsın mı?`, () => {
        const store = window.store;
        if (!store || !store.spells) return;

        // DÜZELTME: Hem string (liste büyüsü) hem obje (özel büyü) kontrolü yapıyoruz
        store.spells.known = store.spells.known.filter(s => {
            // Eğer kayıt sadece bir isimse (String), direkt karşılaştır
            if (typeof s === 'string') {
                return s !== spellName;
            }
            // Eğer kayıt bir objeyse (Özel Büyü), ismine bak
            else if (typeof s === 'object' && s.name) {
                return s.name !== spellName;
            }
            return true; // Ne olduğu belirsizse silme
        });

        renderMySpellList(cachedLevel); // Listeyi yenile
    });
}

function formatSchool(code) { const map = { "E": "Evoc", "C": "Conj", "N": "Necro", "I": "Illu", "A": "Abjur", "T": "Trans", "D": "Div", "EN": "Ench" }; return map[code] || code; }
function formatComponents(comp) { if (!comp) return ""; let res = []; if(comp.v) res.push("V"); if(comp.s) res.push("S"); if(comp.m) res.push("M"); return res.join(", "); }

/* ============================================================
   WINDOW ATAMALARI (GLOBAL ERİŞİM)
   ============================================================ */
window.renderSpellTab = renderSpellTab;
window.openSpellModal = openSpellModal;
window.closeSpellModal = closeSpellModal;
window.filterAndRenderModalSpells = filterAndRenderModalSpells;
window.toggleSpellFromModal = toggleSpellFromModal;
window.toggleSpellDetail = toggleSpellDetail;
window.removeSpellFromCharacter = removeSpellFromCharacter;
window.resetSpellSlots = resetSpellSlots;
window.addSpellToCharacter = toggleSpellFromModal;

export function useSpellLogic() { return {}; }