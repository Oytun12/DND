document.addEventListener("DOMContentLoaded", () => {
    // URL'de '?widget=true' var mı kontrol et
    if (window.location.search.includes('widget=true')) {
        // Varsa, sayfadaki Header'ı (Menüyü) gizle
        const header = document.querySelector('.main-header');
        if (header) header.style.display = 'none';

        // İsteğe bağlı: Yukarı Dön butonunu gizle (Çünkü widget'ın içi kısadır)
        const scrollBtn = document.querySelector('.scroll-to-top');
        if (scrollBtn) scrollBtn.style.display = 'none';
        
        // Widget içinde padding'leri sıfırla ki güzel görünsün
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.margin = '0';
            mainContainer.style.padding = '10px';
        }
    }
});

/* ============================================================
   SCRIPTSPELLS.JS - Final Sürüm (İsim Etiketleri Düzeldi)
   ============================================================ */

let ALL_SPELLS = [];
let ACTIVE_FILTERS = {
    search: "",
    level: "all",
    school: "all",
    class: "all",
    sort: "name-asc" 
};

// SINIF EŞLEŞTİRME SÖZLÜĞÜ
const CLASS_MAPPING = {
    "Bard":     ["Bard", "Ozan"],
    "Cleric":   ["Cleric", "Rahip"],
    "Druid":    ["Druid"],
    "Paladin":  ["Paladin"],
    "Ranger":   ["Ranger", "Kolcu", "Korucu"],
    "Sorcerer": ["Sorcerer"],
    "Warlock":  ["Warlock", "Sihirbaz"],
    "Wizard":   ["Wizard", "Büyücü"]
};

/* --- MENÜ VE TIKLAMA YÖNETİMİ --- */
function toggleMenu(event) {
    if(event) event.stopPropagation();
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.toggle('open');
}

document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');

    if (menu && menu.classList.contains('open')) {
        if (!menu.contains(event.target) && !menuIcon.contains(event.target)) {
            menu.classList.remove('open');
        }
    }

    const isClickInsideCard = event.target.closest('.spell-card');
    if (!isClickInsideCard) {
        closeAllSpells();
    }
});

function closeAllSpells() {
    document.querySelectorAll('.spell-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.querySelectorAll('.spell-header').forEach(header => {
        header.style.backgroundColor = ''; 
        const arrow = header.querySelector('.arrow-icon');
        if(arrow) arrow.style.transform = 'rotate(0deg)';
    });
}

/* --- BAŞLATMA --- */
document.addEventListener("DOMContentLoaded", () => {
    loadSpells();
    setupFilters();
});

async function loadSpells() {
    const container = document.getElementById('spell-list');
    
    try {
        const response = await fetch('../../Data/spells/spells-phb.json');
        if (!response.ok) throw new Error("Veri dosyası bulunamadı.");
        
        const data = await response.json();
        ALL_SPELLS = data.spell || data; 

        sortAndRender();

    } catch (error) {
        console.error("Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">
            <p>Büyüler yüklenirken hata oluştu.</p>
            <small>${error.message}</small>
        </div>`;
    }
}

/* --- FİLTRELEME VE SIRALAMA AYARLARI --- */
function setupFilters() {
    document.getElementById('search-input').addEventListener('input', (e) => {
        ACTIVE_FILTERS.search = e.target.value.toLowerCase();
        sortAndRender();
    });

    const lvlBtns = document.querySelectorAll('.level-filters .filter-btn');
    lvlBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            lvlBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            ACTIVE_FILTERS.level = btn.dataset.level;
            sortAndRender();
        });
    });

    document.getElementById('school-select').addEventListener('change', (e) => {
        ACTIVE_FILTERS.school = e.target.value;
        sortAndRender();
    });

    document.getElementById('class-select').addEventListener('change', (e) => {
        ACTIVE_FILTERS.class = e.target.value;
        sortAndRender();
    });

    const sortSelect = document.getElementById('sort-select');
    if(sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            ACTIVE_FILTERS.sort = e.target.value;
            sortAndRender();
        });
    }
}

/* --- ANA MANTIK --- */
function sortAndRender() {
    let filtered = ALL_SPELLS.filter(spell => {
        if (ACTIVE_FILTERS.search) {
            const nameMatch = spell.name.toLowerCase().includes(ACTIVE_FILTERS.search);
            const trNameMatch = spell.trName ? spell.trName.toLowerCase().includes(ACTIVE_FILTERS.search) : false;
            if (!nameMatch && !trNameMatch) return false;
        }
        if (ACTIVE_FILTERS.level !== "all") {
            if (spell.level.toString() !== ACTIVE_FILTERS.level) return false;
        }
        if (ACTIVE_FILTERS.school !== "all") {
            if (spell.school !== ACTIVE_FILTERS.school) return false;
        }
        if (ACTIVE_FILTERS.class !== "all") {
            let hasClass = false;
            const targetClasses = CLASS_MAPPING[ACTIVE_FILTERS.class] || [ACTIVE_FILTERS.class];
            if (spell.classes && spell.classes.fromClassList) {
                hasClass = spell.classes.fromClassList.some(cls => 
                    targetClasses.includes(cls.name) || 
                    targetClasses.includes(cls.name.trim())
                );
            }
            if (!hasClass) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        switch (ACTIVE_FILTERS.sort) {
            case "name-desc": return b.name.localeCompare(a.name);
            case "level-asc": return (a.level - b.level) || a.name.localeCompare(b.name);
            case "level-desc": return (b.level - a.level) || a.name.localeCompare(b.name);
            case "school": return (a.school || "").localeCompare(b.school || "") || a.name.localeCompare(b.name);
            case "name-asc": default: return a.name.localeCompare(b.name);
        }
    });

    renderSpells(filtered);
}

/* --- RENDER İŞLEMLERİ --- */
function renderSpells(spells) {
    const container = document.getElementById('spell-list');
    container.innerHTML = '';

    if (spells.length === 0) {
        container.innerHTML = `<div class="no-results">Aradığınız kriterlere uygun büyü bulunamadı.</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    spells.forEach(spell => fragment.appendChild(createSpellCard(spell)));
    container.appendChild(fragment);
}

function createSpellCard(spell) {
    const card = document.createElement('div');
    card.className = `spell-card`;

    const schoolCode = spell.school || "U";
    const header = document.createElement('div');
    header.className = `spell-header school-${schoolCode}`;
    
    let levelText = spell.level === 0 ? "Cantrip (0. Seviye)" : `${spell.level}. Seviye`;
    let schoolName = getSchoolName(schoolCode);
    
    header.innerHTML = `
        <div class="spell-name-group">
            <span class="spell-name">${spell.name}</span>
            <span class="spell-meta-short">${levelText} • ${schoolName}</span>
        </div>
        <span class="arrow-icon">▼</span>
    `;

    const content = document.createElement('div');
    content.className = 'spell-content';

    const duration = formatDuration(spell.duration);
    const range = formatRange(spell.range);
    const components = formatComponents(spell.components);
    const time = formatTime(spell.time);

    let html = `
        <div class="spell-details-grid">
            <div class="detail-item"><strong>Uygulama Süresi</strong><span>${time}</span></div>
            <div class="detail-item"><strong>Menzil</strong><span>${range}</span></div>
            <div class="detail-item"><strong>Bileşenler</strong><span>${components}</span></div>
            <div class="detail-item"><strong>Süre</strong><span>${duration}</span></div>
        </div>
        <div class="spell-description">${renderEntries(spell.entries)}</div>
    `;

    if (spell.entriesHigherLevel) {
        // Burada zaten istediğin formatı manuel olarak sağlıyoruz.
        html += `<div">
                    <strong style="color:#b52b2b;">Üst Seviyelerde:</strong>
                    ${renderEntries(spell.entriesHigherLevel[0].entries)}
                 </div>`;
    }

    if (spell.classes && spell.classes.fromClassList) {
        html += `<div class="spell-classes">`;
        spell.classes.fromClassList.forEach(cls => {
            html += `<span class="class-tag">${cls.name}</span>`;
        });
        html += `</div>`;
    }


    content.innerHTML = html;

    header.addEventListener('click', () => {
        const isOpen = content.style.display === 'block';
        content.style.display = isOpen ? 'none' : 'block';
        header.style.backgroundColor = isOpen ? '' : '#3a3a3a';
        const arrow = header.querySelector('.arrow-icon');
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    card.appendChild(header);
    card.appendChild(content);
    return card;
}

/* --- YARDIMCI FONKSİYONLAR --- */
function getSchoolName(code) {
    const schools = {
        'A': 'Abjuration', 
        'C': 'Conjuration', 
        'D': 'Divination', 
        'E': 'Enchantment',  // Düzeltildi
        'V': 'Evocation',    // Düzeltildi
        'I': 'Illusion', 
        'N': 'Necromancy', 
        'T': 'Transmutation'
    };
    return schools[code] || code;
}

function formatTime(time) {
    if (!time || !time[0]) return "-";
    const t = time[0];
    return `${t.number} ${t.unit}`;
}

function formatRange(range) {
    if (!range) return "-";
    if (range.type === "point") return `${range.distance.amount} ${range.distance.type}`;
    return range.type;
}

function formatDuration(duration) {
    if (!duration || !duration[0]) return "-";
    const d = duration[0];
    if (d.type === "instant") return "Anlık";
    if (d.type === "timed") {
        let text = `${d.duration.amount} ${d.duration.type}`;
        if (d.concentration) text += " (Kons.)";
        return text;
    }
    return d.type;
}

function formatComponents(comp) {
    if (!comp) return "-";
    let text = [];
    if (comp.v) text.push("V");
    if (comp.s) text.push("S");
    if (comp.m) {
        const mat = typeof comp.m === 'string' ? comp.m : comp.m.text;
        text.push(`M (${mat})`);
    }
    return text.join(", ");
}

/* --- METİN İŞLEYİCİ (GÜNCELLENDİ) --- */
function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    if (!Array.isArray(entries)) entries = [entries];

    entries.forEach(e => {
        if (typeof e === 'string') {
            html += `<p>${formatText(e)}</p>`;
        } else if (typeof e === 'object') {
            if (e.type === 'list') {
                html += `<ul>${e.items.map(i => `<li>${formatText(i)}</li>`).join('')}</ul>`;
            } else if (e.entries) {
                
                if (e.name) {
                    html += `<div style="margin-bottom:10px;">
                                <strong>${e.name}:</strong>
                                ${renderEntries(e.entries)}
                             </div>`;
                } else {
                    html += renderEntries(e.entries);
                }
            }
        }
    });
    return html;
}

function formatText(text) {
    if (!text) return "";
    text = text.replace(/{@damage ([^}]+)}/g, '<span style="color:#ef4444; font-weight:bold;">$1</span>');
    text = text.replace(/{@save (\w+)}/g, (m, stat) => `<span style="font-weight:bold; text-transform:uppercase;">${stat}</span> save`);
    text = text.replace(/{@condition ([^}]+)}/g, '<u>$1</u>');
    text = text.replace(/{@spell ([^}|]+)(?:\|[^}]+)?}/g, '<span style="color:#a855f7;">$1</span>');
    text = text.replace(/{@\w+ ([^}|]+)(?:\|[^}]+)?}/g, '$1');
    return text;
}