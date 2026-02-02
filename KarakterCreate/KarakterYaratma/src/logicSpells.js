/* ============================================================
   LOGICSPELLS.JS - FINAL FIXED VERSION
   ============================================================ */

if (typeof window.ALL_DATA === 'undefined') window.ALL_DATA = {};
let modalDisplayLimit = 50;
let isScrollListenerAttached = false;

/* --- ANA RENDER --- */
window.renderSpellTab = async function() {
    updateSpellStats();
    if (!window.ALL_DATA.spells || window.ALL_DATA.spells.length === 0) {
        const container = document.getElementById('spell-list-container');
        if(container) container.innerHTML = `<div style="text-align:center; padding:20px; color:#e67e22;">⏳ Büyü veritabanı yükleniyor...</div>`;
        await loadSpellData();
    }
    renderMySpellList();
};

async function loadSpellData() {
    try {
        const response = await fetch('../../Data/spells/spells-phb.json');
        if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);
        const json = await response.json();
        window.ALL_DATA.spells = json.spell || json;
    } catch (err) { console.error("Büyü hatası:", err); }
}

/* --- EKLEME İŞLEMİ (DOM MANIPULATION İLE ANLIK TEPKİ) --- */
window.addSpellToCharacter = function(spellName, btnElement) {
    const store = window.store;
    if (!store) return;
    if (!store.spells) store.spells = { known: [] };
    if (!store.spells.known) store.spells.known = [];
    
    // Zaten ekli mi?
    if (store.spells.known.includes(spellName)) {
        if (btnElement) {
            btnElement.innerText = "✓ Ekli";
            btnElement.disabled = true;
            btnElement.style.cssText = "background-color: #2a2a2a !important; color: #888 !important; border: 1px solid #444;";
        }
        return;
    }
    
    store.spells.known.push(spellName);
    renderMySpellList(); 
    
    // BUTONU GÜNCELLE
    if (btnElement) {
        btnElement.innerText = "✓ Eklendi";
        btnElement.disabled = true;
        // !important ile CSS'i ezdiğimizden emin oluyoruz
        btnElement.style.cssText = "background-color: #2a2a2a !important; color: #888 !important; border: 1px solid #444;";
    }
};

/* --- HTML OLUŞTURUCU (EVENT PARAMETRESİ İLE) --- */
window.filterAndRenderModalSpells = function(keepScroll = false) {
    const searchInput = document.getElementById('modal-spell-search-input');
    const levelSelect = document.getElementById('modal-spell-level-filter');
    const resultsContainer = document.getElementById('modal-spell-results');
    const scrollContainer = document.querySelector('#modal-spell-search .modal-body');

    if(!searchInput || !resultsContainer || !window.ALL_DATA.spells) return;

    const currentScroll = scrollContainer ? scrollContainer.scrollTop : 0;
    const searchText = searchInput.value.toLowerCase();
    const levelVal = levelSelect ? levelSelect.value : "all";

    if (!keepScroll) { modalDisplayLimit = 50; if(scrollContainer) scrollContainer.scrollTop = 0; }
    
    const filtered = window.ALL_DATA.spells.filter(spell => {
        if (searchText && !spell.name.toLowerCase().includes(searchText)) return false;
        if (levelVal !== "all" && spell.level.toString() !== levelVal) return false;
        return true;
    });

    const visibleSpells = filtered.slice(0, modalDisplayLimit);
    resultsContainer.innerHTML = "";

    if(visibleSpells.length === 0) {
        resultsContainer.innerHTML = "<div style='text-align:center; color:#888;'>Sonuç bulunamadı.</div>";
        return;
    }

    visibleSpells.forEach(spell => {
        const safeName = spell.name.replace(/'/g, "\\'");
        const isAdded = window.store && window.store.spells && window.store.spells.known.includes(spell.name);
        
        let btnHTML = "";
        if (isAdded) {
            btnHTML = `<button class="btn-select-spell" disabled style="background:#2a2a2a; color:#888;">✓ Ekli</button>`;
        } else {
            // DİKKAT: 'this' parametresi tırnak içinde değil!
            btnHTML = `<button class="btn-select-spell" onclick="window.addSpellToCharacter('${safeName}', this)">Ekle</button>`;
        }

        const div = document.createElement('div');
        div.className = 'spell-result-card';
        div.innerHTML = `
            <div>
                <strong>${spell.name}</strong> <small style="color:#888">(${spell.level}. Seviye)</small>
            </div>
            ${btnHTML}
        `;
        resultsContainer.appendChild(div);
    });

    if (keepScroll && scrollContainer) scrollContainer.scrollTop = currentScroll; // Değişken adı currentScroll olduğundan emin ol
}

/* --- DİĞER FONKSİYONLAR (AYNI KALACAK) --- */
window.removeSpellFromCharacter = function(spellName) {
    if (!confirm("Silinsin mi?")) return;
    const store = window.store;
    if (!store || !store.spells) return;
    store.spells.known = store.spells.known.filter(s => s !== spellName);
    renderMySpellList();
};

function updateSpellStats() {
    const store = window.store || {};
    const charClass = (store.class && store.class.selected) ? store.class.selected.name : "Wizard";
    const scores = (store.abilities && store.abilities.base) ? store.abilities.base : { int: 10, wis: 10, cha: 10 };
    const SPELL_ABILITY_MAP = { "Wizard": "int", "Rogue": "int", "Fighter": "int", "Cleric": "wis", "Druid": "wis", "Ranger": "wis", "Monk": "wis", "Bard": "cha", "Paladin": "cha", "Sorcerer": "cha", "Warlock": "cha", "Barbarian": "cha" };
    const abilityKey = SPELL_ABILITY_MAP[charClass] || "int";
    const score = scores[abilityKey] || 10;
    const mod = Math.floor((score - 10) / 2);
    const level = 1; 
    const prof = Math.ceil(level / 4) + 1;
    
    const elName = document.getElementById('spell-ability-name');
    if(elName) {
        elName.innerText = abilityKey.toUpperCase();
        document.getElementById('spell-ability-mod').innerText = (mod >= 0 ? "+" : "") + mod;
        document.getElementById('spell-save-dc').innerText = 8 + prof + mod;
        document.getElementById('spell-attack-bonus').innerText = "+" + (prof + mod);
    }
}

function renderMySpellList() {
    const container = document.getElementById('spell-list-container');
    if(!container) return;
    container.innerHTML = "";
    const store = window.store || { spells: { known: [] } };
    if (!store.spells) store.spells = { known: [] };
    const mySpells = (store.spells.known || []).map(name => window.ALL_DATA.spells.find(s => s.name === name) || { name: name, level: 0, school: "U", entries: ["Veri yok"] });

    for (let i = 0; i <= 9; i++) {
        const spellsOfLevel = mySpells.filter(s => s.level === i);
        if (spellsOfLevel.length > 0 || i <= 5) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'spell-level-group';
            const levelTitle = i === 0 ? "Cantrips (0. Seviye)" : `${i}. Seviye`;
            let slotsHTML = "";
            if (i > 0) {
                const maxSlots = i === 1 ? 4 : (i < 6 ? 3 : 1); 
                slotsHTML = `<div class="spell-slots"><span class="slot-label">Slotlar:</span>`;
                for(let s=0; s<maxSlots; s++) slotsHTML += `<input type="checkbox" class="slot-checkbox">`;
                slotsHTML += `</div>`;
            }
            groupDiv.innerHTML = `<div class="level-header"><span class="level-title">${levelTitle}</span>${slotsHTML}</div><div class="spell-list-items"></div>`;
            const listDiv = groupDiv.querySelector('.spell-list-items');
            
            if (spellsOfLevel.length === 0) listDiv.innerHTML = `<div style="padding:10px; color:#666;">-</div>`;
            else {
                spellsOfLevel.forEach(spell => {
                    const safeName = spell.name.replace(/'/g, "\\'");
                    const detailsHTML = renderEntries(spell.entries);
                    const row = document.createElement('div');
                    row.className = 'spell-row';
                    row.innerHTML = `
                        <div class="spell-row-header">
                            <div class="spell-info" onclick="window.toggleSpellDetail(this)">
                                <span class="spell-name">${spell.name} <span class="arrow-icon">▼</span></span>
                                <span class="spell-meta">${formatSchool(spell.school)} • ${formatComponents(spell.components)}</span>
                            </div>
                            <button class="btn-remove-spell" onclick="window.removeSpellFromCharacter('${safeName}')">🗑</button>
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

window.toggleSpellDetail = function(el) {
    el.closest('.spell-row').classList.toggle('expanded');
};

function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    if (!Array.isArray(entries)) entries = [entries];
    entries.forEach(e => {
        if (typeof e === 'string') html += `<p>${format5eText(e)}</p>`;
        else if (e.entries) html += `<p><strong>${e.name}.</strong> ${renderEntries(e.entries)}</p>`;
    });
    return html;
}

function format5eText(text) {
    if (!text || typeof text !== 'string') return text || "";
    
    // ZAR: onclick="window.globalRollDice('1d6')"
    // Not: event.stopPropagation() ekledik ki satır kapanmasın.
    
    // {@damage 8d6} -> ✨ 8d6
    text = text.replace(/{@damage ([^}]+)}/g, (m, d) => 
        `<span class="spell-text-damage clickable" onclick="event.stopPropagation(); window.globalRollDice('${d}')">✨ ${d}</span>`
    );
    
    // {@dice 1d20} -> ✨ 1d20
    text = text.replace(/{@dice ([^}]+)}/g, (m, d) => 
        `<span class="spell-text-damage clickable" onclick="event.stopPropagation(); window.globalRollDice('${d}')">✨ ${d}</span>`
    );
    
    // Diğerleri
    text = text.replace(/{@save (\w+)}/g, '<span class="spell-text-save">$1 Save</span>');
    text = text.replace(/{@dc ([^}]+)}/g, '<span class="spell-text-save">DC $1</span>');
    text = text.replace(/{@\w+ ([^}|]+)(?:\|[^}]+)?}/g, '<span class="spell-text-link">$1</span>');
    
    return text;
}

window.openSpellModal = async function() {
    document.getElementById('modal-spell-search').classList.remove('hidden');
    if (!window.ALL_DATA.spells) await loadSpellData();
    // Scroll listener
    const body = document.querySelector('#modal-spell-search .modal-body');
    if(body && !isScrollListenerAttached) {
        body.addEventListener('scroll', () => {
            if (body.scrollTop + body.clientHeight >= body.scrollHeight - 50) {
                modalDisplayLimit += 50;
                filterAndRenderModalSpells(true);
            }
        });
        isScrollListenerAttached = true;
    }
    filterAndRenderModalSpells();
};
window.closeSpellModal = function() { document.getElementById('modal-spell-search').classList.add('hidden'); };

document.addEventListener("DOMContentLoaded", () => {
    const sInput = document.getElementById('modal-spell-search-input');
    if(sInput) sInput.addEventListener('input', () => { modalDisplayLimit=50; window.filterAndRenderModalSpells(); });
    const lSelect = document.getElementById('modal-spell-level-filter');
    if(lSelect) lSelect.addEventListener('change', () => { modalDisplayLimit=50; window.filterAndRenderModalSpells(); });
});

function formatSchool(code) { const map = { "E": "Evoc", "C": "Conj", "N": "Necro", "I": "Illu", "A": "Abjur", "T": "Trans", "D": "Div", "EN": "Ench" }; return map[code] || code; }
function formatComponents(comp) { if (!comp) return ""; let res = []; if(comp.v) res.push("V"); if(comp.s) res.push("S"); if(comp.m) res.push("M"); return res.join(", "); }

export function useSpellLogic() { return {}; }