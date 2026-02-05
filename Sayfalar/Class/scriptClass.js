/* ============================================================
   SCRIPTCLASS.JS - Geliştirilmiş Menü ve Modern İçerik Yapısı
   ============================================================ */

let ALL_CLASSES_DATA = [];
let currentActiveIndex = null; // HAFIZA: Şu an hangi sınıf açık?

// Stat Kısaltmalarını Türkçeye Çeviren Sözlük (Yeni Render Sistemi İçin)
const ATTR_MAP = {
    "str": "Kuvvet", "dex": "Çeviklik", "con": "Dayanıklılık",
    "int": "Zeka", "wis": "Akıl", "cha": "Karizma",
    "akı": "Akıl", "kuv": "Kuvvet", "çev": "Çeviklik", "day": "Dayanıklılık", "zek": "Zeka", "kar": "Karizma"
};

/* --- 1. GARANTİLİ MENÜ FONKSİYONU --- */
// HTML'den 'toggleMenu(event)' olarak çağırılmalıdır.
function toggleMenu(event) {
    if (event) event.stopPropagation();

    let menu = document.getElementById('mobile-menu');
    if (!menu) menu = document.getElementById('hamburger-menu');

    if (menu) {
        const isOpen = menu.classList.contains('open');
        if (isOpen) {
            menu.classList.remove('open');
            menu.classList.remove('visible');
            menu.classList.add('hidden');
        } else {
            menu.classList.add('open');
            menu.classList.remove('hidden');
            menu.classList.add('visible');
        }
    } else {
        console.error("Menü elementi bulunamadı!");
    }
}

/* --- 2. GLOBAL TIKLAMA YÖNETİCİSİ (Kapatma İşlemleri) --- */
document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu') || document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');

    // A) Menü Kapatma Kontrolü
    if (menu && menu.classList.contains('open')) {
        if (!menu.contains(event.target) && (!menuIcon || !menuIcon.contains(event.target))) {
            menu.classList.remove('open');
            menu.classList.remove('visible');
            menu.classList.add('hidden');
        }
    }

    // B) Sınıf Kapatma (Boşluğa Tıklama) Kontrolü
    const isHeader = event.target.closest('.collapsible');
    const isContent = event.target.closest('.class-content');
    const isTab = event.target.closest('.tab-link');
    const isSubBtn = event.target.closest('.btn-subclass');
    const isCloseBtn = event.target.classList.contains('mobile-back-btn');
    
    if (!menuIcon || !menuIcon.contains(event.target)) {
        if (!isHeader && !isContent && !isTab && !isSubBtn && !isCloseBtn) {
            closeAllAccordions();
        }
    }
});

function closeAllAccordions() {
    document.querySelectorAll('.class-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.collapsible').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active"));
    document.body.classList.remove("mobile-focus"); 
    currentActiveIndex = null;
}

/* --- 3. SEKME (TAB) DEĞİŞTİRME --- */
function openTab(evt, viewId) {
    if (evt.currentTarget.classList.contains('active')) return;

    // Tüm görünümleri gizle ve butonları pasif yap
    document.querySelectorAll('.tab-view').forEach(view => view.style.display = 'none');
    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));

    // Seçilen görünümü aç
    document.getElementById(viewId).style.display = 'block';
    evt.currentTarget.classList.add('active');

    // --- SENKRONİZASYON ---
    if (currentActiveIndex !== null) {
        const targetType = (viewId === 'view-features') ? 'feat' : 'table';
        const wrapperId = `wrapper-${targetType}-${currentActiveIndex}`;
        const wrapper = document.getElementById(wrapperId);
        
        if (wrapper) {
            const header = wrapper.querySelector('.collapsible');
            const contentDiv = wrapper.querySelector('.class-content');
            
            if (contentDiv && contentDiv.innerHTML === "") {
                if (targetType === 'feat') renderClassFeatures(currentActiveIndex, `content-${targetType}-${currentActiveIndex}`);
                else renderClassTable(currentActiveIndex, `content-${targetType}-${currentActiveIndex}`);
            }
            
            header.classList.add("active");
            contentDiv.style.display = "block";
            wrapper.classList.add("focus-active");
        }
    }
}

// ------------------ BAŞLATMA ------------------
document.addEventListener("DOMContentLoaded", () => {
    fetch('../../Data/classes.json')
        .then(response => response.json())
        .then(data => {
            ALL_CLASSES_DATA = data.class || data;
            renderAllViews();
        })
        .catch(error => {
            console.error('Hata:', error);
            document.getElementById('container-features').innerHTML = "<p style='color:#b52b2b;'>Veri yüklenemedi. classes.json dosyasını kontrol edin.</p>";
        });
});

function renderAllViews() {
    const containerFeat = document.getElementById('container-features');
    containerFeat.innerHTML = "";
    
    const containerTable = document.getElementById('container-tables');
    containerTable.innerHTML = "";

    ALL_CLASSES_DATA.forEach((cls, index) => {
        if(cls.name) {
            createClassAccordionItem(containerFeat, cls, index, 'feat');
            createClassAccordionItem(containerTable, cls, index, 'table');
        }
    });
}

// --- KART OLUŞTURMA ---
function createClassAccordionItem(container, cls, index, type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'class-wrapper';
    wrapper.id = `wrapper-${type}-${index}`; 

    const header = document.createElement('h3');
    header.className = 'collapsible';
    header.innerHTML = `
        <span class="cls-name">${cls.name}</span>
        <button class="mobile-back-btn" onclick="closeFocusMode(event)">✕</button>
    `;
    
    const contentId = `content-${type}-${index}`;
    header.onclick = (e) => toggleClassAccordion(e, index, header, contentId, type, wrapper.id);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'class-content';
    contentDiv.id = contentId;

    wrapper.appendChild(header);
    wrapper.appendChild(contentDiv);
    container.appendChild(wrapper);
}

// Akordiyon Açma/Kapama
function toggleClassAccordion(e, classIndex, headerElement, contentId, type, wrapperId) {
    if(e.target.classList.contains('mobile-back-btn')) return;
    
    const contentDiv = document.getElementById(contentId);
    const wrapper = document.getElementById(wrapperId);
    const isOpen = contentDiv.style.display === "block";

    closeAllAccordions();

    if (!isOpen) {
        headerElement.classList.add("active");
        contentDiv.style.display = "block";
        wrapper.classList.add("focus-active");
        currentActiveIndex = classIndex;

        if (window.innerWidth <= 768) {
            document.body.classList.add("mobile-focus");
            window.scrollTo(0, 0);
        } else {
            if (e.isTrusted) setTimeout(() => headerElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }

        if (contentDiv.innerHTML === "") {
            if (type === 'feat') renderClassFeatures(classIndex, contentId);
            else renderClassTable(classIndex, contentId);
        }
    } else {
        currentActiveIndex = null;
    }
}

function closeFocusMode(e) {
    e.stopPropagation();
    closeAllAccordions();
}

// ------------------ İÇERİK: TABLOLAR (ANA SINIF TABLOSU) ------------------
function renderClassTable(classIndex, containerId) {
    const cls = ALL_CLASSES_DATA[classIndex];
    const container = document.getElementById(containerId);
    
    if (!cls.classTableGroups || cls.classTableGroups.length === 0) {
        container.innerHTML = "<p>Bu sınıf için gelişim tablosu bulunamadı.</p>";
        return;
    }

    let html = `<div class="progression-table-wrapper">`;
    html += `<table class="progression-table">`;
    html += `<thead><tr>`;
    html += `<th>Seviye</th>`;
    html += `<th>Uzmanlık Bonusu</th>`;
    
    cls.classTableGroups.forEach(group => {
        group.colLabels.forEach(label => {
            html += `<th>${format5eText(label)}</th>`; 
        });
    });
    html += `</tr></thead>`;
    html += `<tbody>`;
    
    for (let level = 1; level <= 20; level++) {
        const profBonus = Math.ceil(level / 4) + 1;
        html += `<tr>`;
        html += `<td><strong>${level}</strong></td>`;
        html += `<td>+${profBonus}</td>`;

        cls.classTableGroups.forEach(group => {
            const rowData = group.rows[level - 1]; 
            if (Array.isArray(rowData)) {
                rowData.forEach(cell => { html += `<td>${formatTableCell(cell)}</td>`; });
            } else {
                html += `<td>${formatTableCell(rowData)}</td>`;
            }
        });
        html += `</tr>`;
    }
    html += `</tbody></table></div>`;
    html += `<p style="font-size:0.8em; color:#888; margin-top:10px;">* Mobilde tabloyu yana kaydırabilirsiniz.</p>`;

    container.innerHTML = html;
}

function formatTableCell(cell) {
    if (cell === null || cell === undefined) return "—";
    if (cell === 0 || cell === "0") return "—";

    if (typeof cell === 'object') {
        if (cell.type === 'dice') {
            if (Array.isArray(cell.toRoll)) {
                const die = cell.toRoll[0];
                if (die && die.faces) return `${die.number || 1}d${die.faces}`;
            }
            if (typeof cell.toRoll === 'string') return cell.toRoll;
            if (cell.faces) return `${cell.number || 1}d${cell.faces}`;
        }
        if (cell.type === 'bonus') return `+${cell.value}`;
        if (cell.type === 'speed' || cell.type === 'bonusSpeed' || (cell.value !== undefined && typeof cell.value === 'number' && cell.value >= 5)) {
             return `+${cell.value} ft.`;
        }
        if (cell.roll) return cell.roll.exact || `${cell.roll.min}-${cell.roll.max}`;
        if (cell.value) return format5eText(cell.value.toString());
        return "—";
    }
    return format5eText(cell.toString());
}

// ------------------ İÇERİK: REHBER (ÖZELLİKLER) ------------------
function renderClassFeatures(classIndex, containerId) {
    renderClassFeaturesWithSubclass(classIndex, containerId, null);
}

function renderClassFeaturesWithSubclass(classIndex, containerId, subIndex) {
    const cls = ALL_CLASSES_DATA[classIndex];
    const container = document.getElementById(containerId);
    
    let html = `<p><span class="bold">Hit Zarı:</span> 1d${cls.hd.faces}</p>`;
    const profs = cls.startingProficiencies;
    const armor = profs.armor ? profs.armor.join(", ") : "Yok";
    const weapons = profs.weapons ? profs.weapons.join(", ") : "Yok";
    
    html += `<p><span class="bold">Zırhlar:</span> ${armor}</p>`;
    html += `<p><span class="bold">Silahlar:</span> ${weapons}</p>`;
    
    if (profs.skills) {
        const count = profs.skills.choose ? profs.skills.choose.count : 1;
        const fromList = profs.skills.choose && profs.skills.choose.from ? profs.skills.choose.from.join(", ") : "";
        if(fromList) html += `<p><span class="bold">Beceriler:</span> ${count} tane seçin: ${fromList}</p>`;
    }
    
    html += `<hr style="border-color:#444; margin:15px 0;">`;

    // Alt Sınıf Seçim Butonları
    if (cls.subclasses && cls.subclasses.length > 0) {
        html += `<div class="subclass-selection-area"><span class="subclass-title">Alt Sınıf Seçiniz:</span>`;
        cls.subclasses.forEach((sub, idx) => {
            const active = (subIndex === idx) ? "active" : "";
            html += `<button class="btn-subclass ${active}" onclick="updateSubclassView(${classIndex}, '${containerId}', ${idx})">${sub.name}</button>`;
        });
        html += `</div>`;
    }

    const selectedSubclass = (subIndex !== null) ? cls.subclasses[subIndex] : null;
    let subFeatIdx = 0;

    if (cls.classFeatures) {
        cls.classFeatures.forEach((lvlFeats, i) => {
            if (!lvlFeats.length) return;
            html += `<h4>Seviye ${i + 1}</h4>`;
            lvlFeats.forEach(feat => {
                html += `<div class="feature-block"><h5>${feat.name}</h5>${renderEntries(feat.entries)}</div>`;
                
                // ALT SINIF ÖZELLİĞİ
                if (feat.gainSubclassFeature && selectedSubclass) {
                    const subs = selectedSubclass.subclassFeatures[subFeatIdx];
                    if (subs) {
                        subs.forEach(sf => {
                            let featureName = sf.name;
                            let entriesToRender = sf.entries; 

                            if (!featureName && sf.entries && sf.entries[0] && sf.entries[0].name) {
                                featureName = sf.entries[0].name;
                                if (sf.entries[0].entries) {
                                    entriesToRender = sf.entries[0].entries;
                                }
                            }
                            if (!featureName) featureName = "Alt Sınıf Özelliği"; 

                            html += `<div class="feature-block subclass-feature" style="border-left:3px solid #2b5a8e; background:#222;">
                                        <h5 style="color:#4dabf7;">${featureName}</h5>
                                        ${renderEntries(entriesToRender)}
                                     </div>`;
                        });
                        subFeatIdx++;
                    }
                }
            });
        });
    }
    container.innerHTML = html;
}

window.updateSubclassView = function(classIndex, containerId, subIndex) {
    renderClassFeaturesWithSubclass(classIndex, containerId, subIndex);
};

/* ============================================================
   MODERN VERİ İŞLEME MANTIĞI (Render Logic - Yeni)
   ============================================================ */

/**
 * Özelliklerin içindeki TABLOLARI çizer (Level tablosu değil, skill tabloları vb.)
 */
function renderFeatureTable(entry) {
    if (!entry || entry.type !== 'table') return "";

    let html = '<div class="feature-table-wrapper"><table class="feature-table">';
    
    if (entry.caption) {
        html += `<caption>${format5eText(entry.caption)}</caption>`;
    }

    if (entry.colLabels && entry.colLabels.length > 0) {
        html += '<thead><tr>';
        entry.colLabels.forEach((lbl, index) => {
            let content = format5eText(String(lbl)).replace(/<p>|<\/p>/g, '');
            let style = "";
            if (entry.colStyles && entry.colStyles[index]) {
                if (entry.colStyles[index].includes("text-align-center")) style = 'style="text-align: center;"';
                else if (entry.colStyles[index].includes("text-align-right")) style = 'style="text-align: right;"';
            }
            html += `<th ${style}>${content}</th>`;
        });
        html += '</tr></thead>';
    }

    html += '<tbody>';
    if (entry.rows && entry.rows.length > 0) {
        entry.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                let cellContent = "";
                
                if (cell === null || cell === undefined) cellContent = "—";
                else if (typeof cell === 'number') cellContent = String(cell);
                else if (typeof cell === 'object') {
                    if (cell.roll) {
                         cellContent = cell.roll.exact ? String(cell.roll.exact) : (cell.roll.min + "-" + cell.roll.max);
                    } else if (cell.entry) {
                         cellContent = format5eText(cell.entry); 
                    } else {
                         cellContent = JSON.stringify(cell); 
                    }
                } else {
                    cellContent = format5eText(String(cell));
                }

                if(typeof cellContent === 'string' && !cellContent.includes('<br>') && !cellContent.includes('<ul')) {
                    cellContent = cellContent.replace(/^<p>(.*)<\/p>$/s, '$1');
                }

                html += `<td>${cellContent}</td>`;
            });
            html += '</tr>';
        });
    }
    html += '</tbody></table></div>';
    return html;
}

/**
 * ANA İÇERİK İŞLEYİCİ (Recursive - Yeni)
 */
function renderEntries(entries) {
    if (!entries) return "";
    
    if (!Array.isArray(entries)) {
        entries = [entries];
    }

    let html = "";

    entries.forEach(e => {
        if (e === null || e === undefined) return;

        // 1. Düz String
        if (typeof e === "string") {
            html += `<p>${format5eText(e)}</p>`;
            return;
        }

        // 2. Nesne (Object) İşleme
        if (typeof e === "object") {
            
            // A) Tablo
            if (e.type === "table") {
                html += renderFeatureTable(e);
            } 
            
            // B) Liste
            else if (e.type === "list") {
                let items = e.items || [];
                html += `<ul class="feature-list">${items.map(i => `<li>${format5eText(i)}</li>`).join("")}</ul>`;
            } 
            
            // C) Formül Kutuları (DC ve Saldırı)
            else if (e.type === 'abilityDc' || e.type === 'abilityAttackMod') {
                let attrKey = (e.attributes && e.attributes[0]) ? e.attributes[0].toLowerCase() : 'int';
                let attrName = ATTR_MAP[attrKey] || attrKey.toUpperCase();
                
                let title = e.type === 'abilityDc' ? (e.name || 'Büyü') + ' Kurtulma DC' : (e.name || 'Büyü') + ' Saldırı Bonusu';
                let formula = e.type === 'abilityDc' ? `8 + Uzmanlık + ${attrName}` : `Uzmanlık + ${attrName}`;
                
                html += `
                <div class="mechanic-formula-box">
                    <strong>${title}:</strong>
                    <span>${formula}</span>
                </div>`;
            }

            // D) Alt Başlıklar / İç İçe Entries (Recursive)
            else if (e.name && (e.type === 'entries' || !e.type || e.type === 'section')) {
                html += `<div class="feature-subsection">`;
                html += `<span class="feature-sub-title">${format5eText(e.name)}</span>`;
                if (e.entries) {
                    html += renderEntries(e.entries); 
                }
                html += `</div>`;
            }

            // E) Kutucuk (Inset)
            else if (e.type === "inset") {
                 html += `<div style="border:1px solid #444; padding:10px; background:#2a2a2a; margin:10px 0; border-radius:4px;">`;
                 if (e.name) html += `<h5>${format5eText(e.name)}</h5>`;
                 html += renderEntries(e.entries);
                 html += `</div>`;
            }

            // F) Alıntı (Quote)
            else if (e.type === "quote") {
                html += `<blockquote style="border-left: 4px solid #b52b2b; padding-left: 10px; font-style: italic; color:#aaa;">
                            ${renderEntries(e.entries)}
                            <footer style="font-size:0.8em; font-weight:bold; color:#fff;">— ${e.by || ""}</footer>
                         </blockquote>`;
            }

            // G) Sadece entries varsa (isimsiz grup)
            else if (e.entries) {
                html += renderEntries(e.entries);
            }
        }
    });

    return html;
}

// ------------------ 5e TOOLS FORMAT TEMİZLEYİCİ (Güncellenmiş) ------------------
function format5eText(text) {
    if (!text || typeof text !== 'string') return text || "";

    text = text.replace(/{@bold ([^}]+)}/g, '<span class="bold">$1</span>');
    text = text.replace(/{@b ([^}]+)}/g, '<span class="bold">$1</span>');
    text = text.replace(/{@italic ([^}]+)}/g, '<span style="font-style:italic;">$1</span>');
    text = text.replace(/{@i ([^}]+)}/g, '<span style="font-style:italic;">$1</span>');

    text = text.replace(/{@atk mw}/g, '<span style="color:#b52b2b; font-weight:bold;">🗡️ Yakın Dövüş:</span>');
    text = text.replace(/{@atk rw}/g, '<span style="color:#b52b2b; font-weight:bold;">🏹 Menzilli:</span>');
    text = text.replace(/{@atk ms}/g, '<span style="color:#a855f7; font-weight:bold;">✨ Büyü (Yakın):</span>');
    text = text.replace(/{@atk rs}/g, '<span style="color:#a855f7; font-weight:bold;">🔥 Büyü (Menzil):</span>');
    
    text = text.replace(/{@h}/g, '<span style="font-weight:bold;">Vuruş:</span>');
    text = text.replace(/{@dc ([^}]+)}/g, '<span class="bold">DC $1</span>');

    text = text.replace(/{@recharge ([^}]+)}/g, '(Yenilenme $1-6)');
    text = text.replace(/{@recharge}/g, '(Yenilenme 6)');

    // Linkler
    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        const parts = content.split('|');
        const displayText = parts[2] || parts[0];
        const link = `https://kanguen.github.io/spells.html#${encodeURIComponent(parts[0].toLowerCase())}_phb`;
        return `<a href="${link}" target="_blank" style="color:#a855f7; text-decoration:none; border-bottom:1px dotted #a855f7;">${displayText}</a>`;
    });

    text = text.replace(/{@\w+ ([^}|]+)(?:\|[^}]+)?}/g, '$1');

    return text;
}