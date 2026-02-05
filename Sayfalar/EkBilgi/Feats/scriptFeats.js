/* ============================================================
   SCRIPTFEATS.JS - Hünerler (Multi-Open & Auto Close)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    loadFeats();
    setupSearch();
});

let ALL_FEATS = [];

/* --- GLOBAL TIKLAMA YÖNETİMİ (Click Outside) --- */
document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');

    // 1. Mobil Menü Kapatma
    if (menu && menu.classList.contains('open')) {
        if (!menu.contains(event.target) && !menuIcon.contains(event.target)) {
            menu.classList.remove('open');
        }
    }

    // 2. Hünerleri Kapatma Kontrolü
    // Tıklanan yer bir 'Hüner Kartı' DEĞİLSE -> Hepsini Kapat
    const isClickInsideCard = event.target.closest('.feat-card');
    
    // Arama kutusuna tıklayınca kapanmasını istemiyorsan buraya ek koşul koyabilirsin.
    // Şimdilik sadece karta tıklanmadığında kapatır.
    if (!isClickInsideCard) {
        closeAllFeats();
    }
});

// Yardımcı Fonksiyon: Tüm açık hünerleri kapat
function closeAllFeats() {
    // İçerikleri gizle
    document.querySelectorAll('.feat-content').forEach(content => {
        content.style.display = 'none';
    });

    // Başlık stillerini (renk ve ok) sıfırla
    document.querySelectorAll('.feat-header').forEach(header => {
        header.style.backgroundColor = ''; 
        const arrow = header.querySelector('.arrow-icon');
        if(arrow) arrow.style.transform = 'rotate(0deg)';
    });
}

/* --- VERİ YÜKLEME --- */
async function loadFeats() {
    const container = document.getElementById('feat-list');
    
    try {
        const response = await fetch('../../../Data/feats.json');
        if (!response.ok) throw new Error("Veri dosyası bulunamadı.");
        
        const data = await response.json();
        ALL_FEATS = data.feat || data; 

        // Türkçe isme göre sırala
        ALL_FEATS.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

        renderFeats(ALL_FEATS);

    } catch (error) {
        console.error("Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">
            Veriler yüklenirken hata oluştu.<br><small>${error.message}</small>
        </div>`;
    }
}

/* --- RENDER İŞLEMİ --- */
function renderFeats(list) {
    const container = document.getElementById('feat-list');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888;">Eşleşen hüner bulunamadı.</div>';
        return;
    }

    list.forEach(feat => {
        const card = document.createElement('div');
        card.className = 'feat-card';

        // Gereksinim ve Stat Metni
        const prereqText = formatPrerequisite(feat.prerequisite);
        const abilityText = formatAbility(feat.ability);

        // Header
        const header = document.createElement('div');
        header.className = 'feat-header';
        
        const prereqHTML = prereqText 
            ? `<span class="feat-prereq"><span class="prereq-label">Gereksinim:</span> ${prereqText}</span>` 
            : `<span class="feat-prereq" style="opacity:0.5;">Gereksinim Yok</span>`;

        header.innerHTML = `
            <div class="feat-title-group">
                <span class="feat-name">${feat.name}</span>
                ${prereqHTML}
            </div>
            <span class="arrow-icon">▼</span>
        `;

        // Content
        const content = document.createElement('div');
        content.className = 'feat-content';
        
        let html = '';
        if (abilityText) {
            html += `<div class="ability-box"><strong>Stat Artışı:</strong> ${abilityText}</div>`;
        }
        
        html += renderEntries(feat.entries);
        
        if(feat.source) {
            html += `<div style="margin-top:15px; font-size:0.8em; color:#666; text-align:right;">Kaynak: ${feat.source} (Sayfa ${feat.page || '-'})</div>`;
        }

        content.innerHTML = html;

        // TIKLAMA OLAYI (MULTI-OPEN)
        // Buradaki mantık: Tıklandığında sadece kendisinin durumunu tersine çevirir.
        // Diğerlerini kapatmaz. (Diğerlerini kapatma işini yukarıdaki Global Click listener yapar)
        header.addEventListener('click', () => {
            const isOpen = content.style.display === 'block';
            
            // Toggle işlemi
            content.style.display = isOpen ? 'none' : 'block';
            
            // Görsel değişim
            header.querySelector('.arrow-icon').style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            header.style.backgroundColor = isOpen ? '' : '#3a3a3a';
        });

        card.appendChild(header);
        card.appendChild(content);
        container.appendChild(card);
    });
}

/* --- ARAMA --- */
function setupSearch() {
    const input = document.getElementById('search-input');
    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = ALL_FEATS.filter(f => f.name.toLowerCase().includes(term));
        renderFeats(filtered);
    });
}

/* --- YARDIMCI FORMAT FONKSİYONLARI --- */
function formatPrerequisite(prereqs) {
    if (!prereqs || prereqs.length === 0) return null;
    let parts = [];
    prereqs.forEach(p => {
        if (p.race) {
            let raceNames = p.race.map(r => {
                let txt = capitalize(r.name);
                if(r.subrace) txt += ` (${r.subrace})`;
                return txt;
            }).join(" veya ");
            parts.push(`${raceNames}`);
        }
        if (p.ability) {
            p.ability.forEach(a => {
                for (let [key, val] of Object.entries(a)) {
                    parts.push(`${translateAbility(key)} ${val} veya üzeri`);
                }
            });
        }
        if (p.spellcasting) parts.push("Büyü yapabilme yeteneği");
        if (p.proficiency) {
            p.proficiency.forEach(prof => {
                if(prof.zırh) parts.push(`${capitalize(prof.zırh)} zırh uzmanlığı`);
            });
        }
    });
    return parts.join(", ");
}

function formatAbility(ability) {
    if (!ability) return null;
    let parts = [];
    for (let [key, val] of Object.entries(ability)) {
        if (key === 'choose') {
            val.forEach(choice => {
                let options = choice.from.map(k => translateAbility(k)).join(" veya ");
                parts.push(`${options} +${choice.amount || 1}`);
            });
        } else {
            parts.push(`${translateAbility(key)} +${val}`);
        }
    }
    return parts.join(", ");
}

function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    const list = Array.isArray(entries) ? entries : [entries];
    list.forEach(e => {
        if (typeof e === 'string') {
            html += `<p>${formatText(e)}</p>`;
        } else if (typeof e === 'object') {
            if (e.type === 'list') {
                html += '<ul>' + e.items.map(i => `<li>${formatText(i)}</li>`).join('') + '</ul>';
            }
        }
    });
    return html;
}

function formatText(text) {
    if (!text || typeof text !== 'string') return text;
    text = text.replace(/{@skill ([^}]+)}/g, '<span style="color:#b52b2b;">$1</span>');
    text = text.replace(/{@spell ([^}]+)}/g, '<span style="color:#a855f7;">$1</span>');
    text = text.replace(/{@dice ([^}]+)}/g, '<span style="color:#d4af37;">$1</span>'); // Zar rengi eklendi
    text = text.replace(/{@\w+\s+([^}|]+)(?:\|[^}]+)?}/g, '$1');
    return text;
}

function translateAbility(abbr) {
    const map = { "kuv": "Kuvvet", "str": "Kuvvet", "çev": "Çeviklik", "dex": "Çeviklik", "day": "Dayanıklılık", "con": "Dayanıklılık", "zek": "Zeka", "int": "Zeka", "akı": "Akıl", "wis": "Akıl", "kar": "Karizma", "cha": "Karizma" };
    return map[abbr.toLowerCase()] || abbr.toUpperCase();
}

function capitalize(s) {
    return s && s[0].toUpperCase() + s.slice(1);
}

function toggleMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}