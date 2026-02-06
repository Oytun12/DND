/* ============================================================
   SCRIPTCLASS.JS - Karşılaştırma Modu & Akıllı Kapanma
   ============================================================ */

let ALL_CLASSES_DATA = [];
let currentActiveIndex = null;

const ATTR_MAP = {
    "str": "Kuvvet", "dex": "Çeviklik", "con": "Dayanıklılık",
    "int": "Zeka", "wis": "Akıl", "cha": "Karizma",
    "akı": "Akıl", "kuv": "Kuvvet", "çev": "Çeviklik", "day": "Dayanıklılık", "zek": "Zeka", "kar": "Karizma"
};

/* --- 1. MENÜ YÖNETİMİ --- */
function toggleMenu(event) {
    if (event) event.stopPropagation();
    let menu = document.getElementById('mobile-menu') || document.getElementById('hamburger-menu');
    if (menu) {
        if (menu.classList.contains('open')) {
            menu.classList.remove('open');
            menu.classList.remove('visible');
            menu.classList.add('hidden');
        } else {
            menu.classList.add('open');
            menu.classList.remove('hidden');
            menu.classList.add('visible');
        }
    }
}

/* --- 2. GLOBAL TIKLAMA YÖNETİCİSİ --- */
document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu') || document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');

    // A) Menü Kapatma
    if (menu && menu.classList.contains('open')) {
        if (!menu.contains(event.target) && (!menuIcon || !menuIcon.contains(event.target))) {
            menu.classList.remove('open');
            menu.classList.remove('visible');
            menu.classList.add('hidden');
        }
    }

    // B) SINIFLARI KAPATMA (Sadece Boşluğa Tıklayınca)
    // Tıklanan yer; Header, İçerik, Tab, Alt Sınıf butonu veya Options öğesi DEĞİLSE her şeyi kapat.
    const isHeader = event.target.closest('.collapsible');
    const isContent = event.target.closest('.class-content');
    const isTab = event.target.closest('.tab-link');
    const isSubBtn = event.target.closest('.btn-subclass');
    const isCloseBtn = event.target.classList.contains('mobile-back-btn');
    const isOptionsInteraction = event.target.closest('.options-toggle-btn') || event.target.closest('.options-content-wrapper');

    if (!menuIcon || !menuIcon.contains(event.target)) {
        if (!isHeader && !isContent && !isTab && !isSubBtn && !isCloseBtn && !isOptionsInteraction) {
            closeAllAccordions();
        }
    }

    // C) OPTIONS (SEÇENEKLER) YÖNETİMİ
    // Eğer bir Options Butonuna tıklandıysa:
    const optBtn = event.target.closest('.options-toggle-btn');
    if (optBtn) {
        const targetId = optBtn.getAttribute('data-target');
        const contentDiv = document.getElementById(targetId);
        
        if (contentDiv) {
            const isOpen = contentDiv.classList.contains('active');
            
            if (isOpen) {
                // Kapat
                contentDiv.classList.remove('active');
                optBtn.classList.remove('active');
                
                // UX: Kapanınca butonun hizasına geri kaydır (Listede kaybolmayı önler)
                setTimeout(() => {
                    optBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50);
            } else {
                // Aç
                contentDiv.classList.add('active');
                optBtn.classList.add('active');
            }
        }
        return; // İşlem tamam, aşağıya geçme
    }

    // D) OPTIONS DIŞINA TIKLAMA (İçerik Kapatma)
    // Eğer tıklanan yer bir Options öğesi DEĞİLSE ama Sınıf İçeriği İSE (yani metne tıklandıysa)
    // Açık olan Options kutularını kapat.
    if (!isOptionsInteraction && isContent) {
        document.querySelectorAll('.options-content-wrapper.active').forEach(div => {
            div.classList.remove('active');
            // Butonun aktifliğini de kaldır
            // ID'den butonu bulmamız gerekebilir veya tüm butonları sıfırlarız
            // En temizi tüm butonlardan active silmek:
        });
        document.querySelectorAll('.options-toggle-btn.active').forEach(btn => btn.classList.remove('active'));
    }
});

function closeAllAccordions() {
    document.querySelectorAll('.class-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.collapsible').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active"));
    document.body.classList.remove("mobile-focus"); 
    currentActiveIndex = null;
}

/* --- 3. SEKME (TAB) YÖNETİMİ --- */
function openTab(evt, viewId) {
    if (evt.currentTarget.classList.contains('active')) return;

    document.querySelectorAll('.tab-view').forEach(view => view.style.display = 'none');
    document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));

    document.getElementById(viewId).style.display = 'block';
    evt.currentTarget.classList.add('active');

    // Tab değişince açık olan sınıfın içeriğini güncelle (Eğer varsa)
    // Not: Multi-open olduğu için bu kısım en son aktif olana veya döngüye göre çalışabilir.
    // Şimdilik basitlik adına, eğer tek bir aktif index varsa onu güncelliyoruz.
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

/* --- 4. VERİ YÜKLEME --- */
document.addEventListener("DOMContentLoaded", () => {
    fetch('../../Data/classes.json')
        .then(response => response.json())
        .then(data => {
            ALL_CLASSES_DATA = data.class || data;
            // İsim sırasına göre diz
            ALL_CLASSES_DATA.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
            renderAllViews();
        })
        .catch(error => {
            console.error('Hata:', error);
            const container = document.getElementById('container-features');
            if(container) container.innerHTML = "<p class='error-msg'>Veri yüklenemedi. classes.json dosyasını kontrol edin.</p>";
        });
});

function renderAllViews() {
    const containerFeat = document.getElementById('container-features');
    if(containerFeat) containerFeat.innerHTML = "";
    const containerTable = document.getElementById('container-tables');
    if(containerTable) containerTable.innerHTML = "";

    ALL_CLASSES_DATA.forEach((cls, index) => {
        if(cls.name) {
            if(containerFeat) createClassAccordionItem(containerFeat, cls, index, 'feat');
            if(containerTable) createClassAccordionItem(containerTable, cls, index, 'table');
        }
    });
}

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

// [GÜNCELLEME] Multi-Open (Karşılaştırma) Destekli Açma Fonksiyonu
function toggleClassAccordion(e, classIndex, headerElement, contentId, type, wrapperId) {
    if(e.target.classList.contains('mobile-back-btn')) return;
    
    const contentDiv = document.getElementById(contentId);
    const wrapper = document.getElementById(wrapperId);
    const isOpen = contentDiv.style.display === "block";

    // NOT: closeAllAccordions() kaldırıldı -> Karşılaştırma Modu Aktif

    if (!isOpen) {
        // AÇMA
        headerElement.classList.add("active");
        contentDiv.style.display = "block";
        wrapper.classList.add("focus-active");
        currentActiveIndex = classIndex;

        // Mobil Özel Durum: Mobilde ekran dar olduğu için karşılaştırma zor olabilir,
        // kullanıcıyı odaklamak için diğerlerini kapatabiliriz VEYA scroll ederiz.
        if (window.innerWidth <= 768) {
            // Mobilde odak modu için diğerlerini kapatmak daha sağlıklıdır (CSS yapısı gereği)
            closeAllAccordions();
            // Tekrar aç (Çünkü closeAll kapattı)
            headerElement.classList.add("active");
            contentDiv.style.display = "block";
            wrapper.classList.add("focus-active");
            
            document.body.classList.add("mobile-focus");
            window.scrollTo(0, 0);
        } else {
            // Masaüstünde hafif scroll
            if (e.isTrusted) setTimeout(() => headerElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }

        // İçerik yükle
        if (contentDiv.innerHTML === "") {
            if (type === 'feat') renderClassFeatures(classIndex, contentId);
            else renderClassTable(classIndex, contentId);
        }
    } else {
        // KAPATMA
        contentDiv.style.display = "none";
        headerElement.classList.remove("active");
        wrapper.classList.remove("focus-active");
        
        if (currentActiveIndex === classIndex) currentActiveIndex = null;
        
        if (window.innerWidth <= 768) {
            document.body.classList.remove("mobile-focus");
        }
    }
}

function closeFocusMode(e) {
    e.stopPropagation();
    closeAllAccordions();
}

/* --- 5. RENDER FONKSİYONLARI --- */
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
    html += `<p class="table-mobile-hint">* Mobilde tabloyu yana kaydırabilirsiniz.</p>`;

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
        if (cell.type === 'speed' || cell.type === 'bonusSpeed') return `+${cell.value} ft.`;
        if (cell.roll) return cell.roll.exact || `${cell.roll.min}-${cell.roll.max}`;
        if (cell.value) return format5eText(cell.value.toString());
        return "—";
    }
    return format5eText(cell.toString());
}

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
    
    html += `<hr class="feature-divider">`;

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
                if (feat.gainSubclassFeature && selectedSubclass) {
                    const subs = selectedSubclass.subclassFeatures[subFeatIdx];
                    if (subs) {
                        subs.forEach(sf => {
                            let featureName = sf.name || "Alt Sınıf Özelliği";
                            let entriesToRender = sf.entries; 
                            
                            if (!sf.name && sf.entries && sf.entries[0] && sf.entries[0].name) {
                                featureName = sf.entries[0].name;
                                if (sf.entries[0].entries) entriesToRender = sf.entries[0].entries;
                            }

                            html += `<div class="feature-block subclass-feature-block">
                                        <h5 class="subclass-feature-title">${featureName}</h5>
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
   RECURSIVE RENDER MOTORU (GHOST FIX + OPTIONS ACCORDION)
   ============================================================ */

function renderEntries(entries, level = 0) {
    if (!entries) return "";
    const list = Array.isArray(entries) ? entries : [entries];
    let html = "";

    list.forEach(entry => {
        if (entry === null || entry === undefined) return;

        if (typeof entry === "string") {
            html += `<p>${format5eText(entry)}</p>`;
            return;
        }

        if (typeof entry === "object") {
            
            // --- A) OPTIONS TİPİ (AKORDİYON) ---
            if (entry.type === 'options') {
                const uniqueId = 'opt-' + Math.random().toString(36).substr(2, 9);
                const count = entry.entries ? entry.entries.length : 0;
                
                // Butonun CSS sınıfı: options-toggle-btn
                html += `<button class="options-toggle-btn" data-target="${uniqueId}">
                            <span>Seçenekleri Görüntüle (${count} Adet)</span>
                            <span class="options-arrow">▼</span>
                         </button>`;
                
                // İçerik Kutusunun CSS sınıfı: options-content-wrapper
                html += `<div id="${uniqueId}" class="options-content-wrapper">`;
                if (entry.entries) {
                    html += renderEntries(entry.entries, level + 1);
                }
                html += `</div>`;
                return;
            }

            // --- B) ÖZEL FORMATLAR ---
            if (entry.type === "table") { html += renderFeatureTable(entry); return; }
            
            if (entry.type === "list") {
                let items = entry.items || [];
                html += `<ul class="feature-list">${items.map(i => {
                    if(typeof i === 'object' && i.entries) return `<li>${renderEntries(i)}</li>`;
                    return `<li>${renderEntries(i)}</li>`;
                }).join("")}</ul>`;
                return;
            }
            
            if (entry.type === 'abilityDc' || entry.type === 'abilityAttackMod') { html += renderAbilityBox(entry); return; }
            
            if (entry.type === "quote") { 
                html += `<blockquote class="feature-quote">${renderEntries(entry.entries)}</blockquote>`; 
                return; 
            }
            
            if (entry.type === "inset") { 
                html += `<div class="feature-inset">${entry.name?`<h5 class="feature-inset-title">${format5eText(entry.name)}</h5>`:''}${renderEntries(entry.entries)}</div>`; 
                return; 
            }

            // --- C) BAŞLIKLI BLOK (Name Varsa) ---
            if (entry.name) {
                const sectionClass = level > 0 ? "feature-section indented" : "feature-section";
                
                html += `<div class="${sectionClass}">`;

                if (level === 0) { 
                    html += `<h5 class="feature-title-main">${format5eText(entry.name)}</h5>`;
                } else { 
                    html += `<strong class="feature-title-secondary">${format5eText(entry.name)}</strong>`;
                }
                
                if (entry.prerequisite) {
                    html += `<div class="feature-prerequisite">Gereksinim: ${format5eText(entry.prerequisite)}</div>`;
                }

                if (entry.entries) {
                    html += renderEntries(entry.entries, level + 1);
                }

                html += `</div>`;
            } 
            
            // --- D) İSİMSİZ KAPLAYICI (GHOST FIX) ---
            // Name yoksa, div açma, level artırma, direkt içeriği bas.
            else if (entry.entries) {
                html += renderEntries(entry.entries, level); 
            }
        }
    });
    return html;
}

function renderFeatureTable(entry) {
    if (!entry || entry.type !== 'table') return "";
    let html = '<div class="feature-table-wrapper"><table class="feature-table">';
    if (entry.caption) html += `<caption>${format5eText(entry.caption)}</caption>`;
    
    if (entry.colLabels) {
        html += '<thead><tr>';
        entry.colLabels.forEach((lbl, index) => {
            let alignClass = "";
            if (entry.colStyles && entry.colStyles[index]) {
                if (entry.colStyles[index].includes("text-align-center")) alignClass = "text-center";
                else if (entry.colStyles[index].includes("text-align-right")) alignClass = "text-right";
            }
            html += `<th class="${alignClass}">${format5eText(String(lbl))}</th>`;
        });
        html += '</tr></thead>';
    }
    html += '<tbody>';
    if (entry.rows) {
        entry.rows.forEach(row => {
            html += '<tr>';
            row.forEach(cell => {
                let txt = "";
                if (typeof cell === 'object' && cell.roll) {
                    txt = (cell.roll.exact) ? String(cell.roll.exact) : (cell.roll.min + "-" + cell.roll.max);
                } else if (typeof cell === 'object' && cell.entry) {
                    txt = format5eText(cell.entry);
                } else {
                    txt = format5eText(String(cell));
                }
                html += `<td>${txt}</td>`;
            });
            html += '</tr>';
        });
    }
    html += '</tbody></table></div>';
    return html;
}

function renderAbilityBox(e) {
    let k = (e.attributes && e.attributes[0]) ? e.attributes[0].toLowerCase() : 'int';
    let n = ATTR_MAP[k] || k.toUpperCase();
    let t = e.type === 'abilityDc' ? (e.name || 'Büyü') + ' Kurtulma DC' : (e.name || 'Büyü') + ' Saldırı Bonusu';
    let f = e.type === 'abilityDc' ? `8 + Uzmanlık + ${n}` : `Uzmanlık + ${n}`;
    return `<div class="mechanic-formula-box"><strong>${t}:</strong> <span>${f}</span></div>`;
}

function format5eText(text) {
    if (!text || typeof text !== 'string') return text || "";

    text = text.replace(/{@bold ([^}]+)}/g, '<span class="bold">$1</span>');
    text = text.replace(/{@b ([^}]+)}/g, '<span class="bold">$1</span>');
    text = text.replace(/{@italic ([^}]+)}/g, '<span class="italic">$1</span>');
    text = text.replace(/{@i ([^}]+)}/g, '<span class="italic">$1</span>');
    
    text = text.replace(/{@atk mw}/g, '🗡️');
    text = text.replace(/{@atk rw}/g, '🏹');
    text = text.replace(/{@atk ms}/g, '✨');
    text = text.replace(/{@atk rs}/g, '🔥');
    text = text.replace(/{@h}/g, 'Vuruş:');
    text = text.replace(/{@dc ([^}]+)}/g, 'DC $1');
    text = text.replace(/{@recharge ([^}]+)}/g, '(Yenilenme $1-6)');
    text = text.replace(/{@recharge}/g, '(Yenilenme 6)');

    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        const parts = content.split('|');
        const displayText = parts[2] || parts[0];
        const link = `https://kanguen.github.io/spells.html#${encodeURIComponent(parts[0].toLowerCase())}_phb`;
        return `<a href="${link}" target="_blank" class="dnd-link spell-link">${displayText}</a>`;
    });

    text = text.replace(/{@\w+ ([^}|]+)(?:\|[^}]+)?}/g, '$1');
    return text;
}