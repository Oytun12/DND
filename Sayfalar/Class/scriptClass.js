let ALL_CLASSES_DATA = [];
let currentActiveIndex = null; // HAFIZA: Şu an hangi sınıf açık?

// ------------------ MENÜ & TAB İŞLEMLERİ ------------------
const toggleMenu = () => {
    const menu = document.getElementById('hamburger-menu');
    menu.classList.toggle('hidden');
    menu.classList.toggle('visible');
};

// TAB DEĞİŞTİRME FONKSİYONU (GÜNCELLENDİ: GEREKSİZ TIKLAMA ENGELİ)
function openTab(evt, viewId) {
    // DÜZELTME BURADA:
    // Eğer tıklanan butonda zaten 'active' sınıfı varsa, fonksiyonu hemen durdur.
    if (evt.currentTarget.classList.contains('active')) return;

    // 1. Tüm görünümleri gizle
    document.querySelectorAll('.tab-view').forEach(view => {
        view.style.display = 'none';
    });

    // 2. Tüm butonların aktifliğini kaldır
    document.querySelectorAll('.tab-link').forEach(link => {
        link.classList.remove('active');
    });

    // 3. Seçilen görünümü aç ve butonu aktif yap
    document.getElementById(viewId).style.display = 'block';
    evt.currentTarget.classList.add('active');

    // --- SENKRONİZASYON ---
    // Eğer hafızada bir sınıf varsa, yeni sekmede de onu aç
    if (currentActiveIndex !== null) {
        const targetType = (viewId === 'view-features') ? 'feat' : 'table';
        const wrapperId = `wrapper-${targetType}-${currentActiveIndex}`;
        const wrapper = document.getElementById(wrapperId);
        
        if (wrapper) {
            const header = wrapper.querySelector('.collapsible');
            if (header) {
                // Tıklama efektini tetikle
                header.click();
            }
        }
    }
}

// ------------------ GLOBAL TIKLAMA & KAPATMA ------------------
document.addEventListener('click', (event) => {
    // Menü Kapatma
    const menu = document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');
    if (menu.classList.contains('visible') && !menu.contains(event.target) && !menuIcon.contains(event.target)) {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }

    // Sınıf Kapatma (Boşluğa tıklama)
    const isHeader = event.target.closest('.collapsible');
    const isContent = event.target.closest('.class-content');
    const isTab = event.target.closest('.tab-link');
    const isSubBtn = event.target.closest('.btn-subclass'); // Alt sınıf butonları da kapatmasın

    if (!isHeader && !isContent && !isTab && !isSubBtn) {
        closeAllAccordions();
    }
});

function closeAllAccordions() {
    document.querySelectorAll('.class-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.collapsible').forEach(el => el.classList.remove('active'));
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active"));
    document.body.classList.remove("mobile-focus");
    currentActiveIndex = null; // Hafızayı sil
}

// ------------------ BAŞLATMA ------------------
document.addEventListener("DOMContentLoaded", () => {
    fetch('../../Data/classes.json')
        .then(response => response.json())
        .then(data => {
            ALL_CLASSES_DATA = data.class;
            renderAllViews();
        })
        .catch(error => {
            console.error('Hata:', error);
            document.getElementById('container-features').innerHTML = "<p style='color:red;'>Veri yüklenemedi. Lütfen Data/classes.json dosyasını kontrol edin.</p>";
        });
});

function renderAllViews() {
    const containerFeat = document.getElementById('container-features');
    containerFeat.innerHTML = "";
    
    const containerTable = document.getElementById('container-tables');
    containerTable.innerHTML = "";

    ALL_CLASSES_DATA.forEach((cls, index) => {
        createClassAccordionItem(containerFeat, cls, index, 'feat');
        createClassAccordionItem(containerTable, cls, index, 'table');
    });
}

function createClassAccordionItem(container, cls, index, type) {
    const wrapper = document.createElement('div');
    wrapper.className = 'class-wrapper';
    wrapper.id = `wrapper-${type}-${index}`; 

    const header = document.createElement('h3');
    header.className = 'collapsible';
    // Mobilde geri butonu
    header.innerHTML = `${cls.name} <button class="mobile-back-btn" onclick="closeFocusMode(event)">KAPAT ✕</button>`;
    
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
    e.stopPropagation();

    const contentDiv = document.getElementById(contentId);
    const wrapper = document.getElementById(wrapperId);
    const isOpen = contentDiv.style.display === "block";

    // Önce hepsini kapat (Görsel temizlik)
    document.querySelectorAll(".class-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".collapsible").forEach(h => h.classList.remove("active"));
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active"));
    document.body.classList.remove("mobile-focus");

    if (!isOpen) {
        // Tıklananı aç
        headerElement.classList.add("active");
        contentDiv.style.display = "block";
        wrapper.classList.add("focus-active");

        currentActiveIndex = classIndex; // Hafızaya al

        // Mobil Odak Modu
        if (window.innerWidth <= 768) {
            document.body.classList.add("mobile-focus");
            window.scrollTo(0, 0);
        } else {
            if (e.isTrusted) {
                setTimeout(() => headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }
        }

        // İçeriği Doldur
        if (type === 'feat') {
            renderClassFeatures(classIndex, contentId);
        } else {
            renderClassTable(classIndex, contentId);
        }
    } else {
        // Zaten açıksa kapat ve hafızayı sil
        currentActiveIndex = null;
    }
}

function closeFocusMode(e) {
    e.stopPropagation();
    closeAllAccordions();
}

// ------------------ İÇERİK: TABLOLAR ------------------
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
    
    // DÜZELTME BURADA: label'ı format5eText() içine aldık
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
    html += `<p style="font-size:0.8em; color:#666; margin-top:10px;">* Tabloyu yana kaydırarak diğer sütunları görebilirsiniz.</p>`;

    container.innerHTML = html;
}

function formatTableCell(cell) {
    // Eğer hücre bir nesne (object) ise (Bonus, Zar vb.)
    if (typeof cell === 'object') {
        if (cell.type === 'bonus') return `+${cell.value}`;
        // Zar gösterimini güzelleştir
        if (cell.type === 'dice') return cell.toRoll ? cell.toRoll : cell.number + 'd' + cell.faces;
        // Aralık belirtiyorsa (Örn: 1-4)
        if (cell.roll) return cell.roll.exact || `${cell.roll.min}-${cell.roll.max}`;
        // Bilinmeyen bir tipse string'e çevir
        return JSON.stringify(cell);
    }
    
    // Eğer hücre boşsa veya 0 ise çizgi koy
    if (cell === 0 || cell === "0") return "—";
    
    // DÜZELTME BURADA: Metin hücresi ise temizleyiciye gönder ({@filter...} gibi kodları düzeltir)
    return format5eText(cell);
}

// ------------------ İÇERİK: REHBER ------------------
function renderClassFeatures(classIndex, containerId) {
    renderClassFeaturesWithSubclass(classIndex, containerId, null);
}

function renderClassFeaturesWithSubclass(classIndex, containerId, subIndex) {
    const cls = ALL_CLASSES_DATA[classIndex];
    const container = document.getElementById(containerId);
    
    let html = `<p><span class="bold">Hit Zarı:</span> 1d${cls.hd.faces}</p>`;
    const profs = cls.startingProficiencies;
    html += `<p><span class="bold">Zırhlar:</span> ${profs.armor ? profs.armor.join(", ") : "Yok"}</p>`;
    html += `<p><span class="bold">Silahlar:</span> ${profs.weapons ? profs.weapons.join(", ") : "Yok"}</p>`;
    if (profs.skills) html += `<p><span class="bold">Beceriler:</span> ${profs.skills.choose} tane seçin: ${profs.skills.from.join(", ")}</p>`;
    
    html += `<hr>`;

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
                            let entriesToRender = sf.entries; // Varsayılan: Her şeyi yazdır

                            // DÜZELTME: Eğer ana isim yoksa ve içeride isim varsa
                            if (!featureName && sf.entries && sf.entries[0] && sf.entries[0].name) {
                                // 1. İsmi alıp başlığa taşı
                                featureName = sf.entries[0].name;
                                
                                // 2. KRİTİK NOKTA: İçeriği yazdırırken, başlığı aldığımız o ilk katmanı "soyup" atıyoruz.
                                // Sadece o katmanın içindeki "entries" kısmını alıyoruz.
                                if (sf.entries[0].entries) {
                                    entriesToRender = sf.entries[0].entries;
                                }
                            }
                            
                            if (!featureName) featureName = ""; 

                            html += `<div class="feature-block subclass-feature">
                                        <h5>${featureName}</h5>
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


// ------------------ KARMAŞIK METİN İŞLEYİCİ (GÜNCELLENDİ) ------------------
function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    
    // Eğer entries tek bir obje ise onu diziye çevir
    if (!Array.isArray(entries)) {
        entries = [entries];
    }

    entries.forEach(e => {
        if (!e) return;

        if (typeof e === "string") {
            // DÜZELTME: Metni doğrudan basmak yerine formatlayıp basıyoruz
            html += `<p>${format5eText(e)}</p>`;
        } else if (typeof e === "object") {
            // Liste
            if (e.type === "list") {
                html += `<ul>${e.items.map(i => `<li>${renderEntries([i])}</li>`).join("")}</ul>`;
            } 
            // Tablo
            else if (e.type === "table") {
                 html += `<table><thead><tr>${e.colLabels.map(h => `<th>${format5eText(h)}</th>`).join("")}</tr></thead><tbody>`;
                 e.rows.forEach(row => {
                     let rHtml = "";
                     row.forEach(c => rHtml += `<td>${typeof c==='object' ? (c.roll ? c.roll.exact : JSON.stringify(c)) : format5eText(c)}</td>`);
                     html += `<tr>${rHtml}</tr>`;
                 });
                 html += `</tbody></table>`;
            } 
            // İç İçe Başlıklar (Entries)
            else if (e.type === "entries" || e.type === "section") {
                if (e.name) html += `<h5>${format5eText(e.name)}</h5>`;
                html += renderEntries(e.entries);
            }
            // Kutucuk (Inset)
            else if (e.type === "inset") {
                 html += `<div style="border:1px solid #ccc; padding:10px; background:#f9f9f9; margin:10px 0;">`;
                 if (e.name) html += `<h5>${format5eText(e.name)}</h5>`;
                 html += renderEntries(e.entries);
                 html += `</div>`;
            }
            // "quote" (Alıntı)
            else if (e.type === "quote") {
                html += `<blockquote style="border-left: 4px solid #8b4513; padding-left: 10px; font-style: italic;">
                            ${renderEntries(e.entries)}
                            <footer style="font-size:0.8em; font-weight:bold;">— ${e.by || ""}</footer>
                         </blockquote>`;
            }
            // Bilinmeyen tipler için içerik varsa yazdır
            else if (e.entries) {
                html += renderEntries(e.entries);
            }
        }
    });
    return html;
}

// ------------------ 5e TOOLS FORMAT TEMİZLEYİCİ (YENİ!) ------------------
function format5eText(text) {
    if (!text || typeof text !== 'string') return text;

    // 1. Önce basit etiketleri temizle: {@spell Fireball} -> Fireball
    // Regex mantığı: {@etiketAdı Icerik|Kaynak|Ekstra} -> Sadece "Icerik" kısmını al
    
    // {@bold ...} -> Kalın yap
    text = text.replace(/{@bold ([^}]+)}/g, '<span class="dnd-bold">$1</span>');
    text = text.replace(/{@b ([^}]+)}/g, '<span class="dnd-bold">$1</span>');
    
    // {@italic ...} -> İtalik yap
    text = text.replace(/{@italic ([^}]+)}/g, '<span class="dnd-italic">$1</span>');
    text = text.replace(/{@i ([^}]+)}/g, '<span class="dnd-italic">$1</span>');

    // Saldırı Tipleri {@atk mw} -> "Yakın Dövüş Saldırısı:"
    text = text.replace(/{@atk mw}/g, '<span class="dnd-icon-text">🗡️ Yakın Dövüş Saldırısı:</span>');
    text = text.replace(/{@atk rw}/g, '<span class="dnd-icon-text">🏹 Menzilli Silah Saldırısı:</span>');
    text = text.replace(/{@atk ms}/g, '<span class="dnd-icon-text">✨ Yakın Büyü Saldırısı:</span>');
    text = text.replace(/{@atk rs}/g, '<span class="dnd-icon-text">🔥 Menzilli Büyü Saldırısı:</span>');
    
    // Hit (Vuruş) ve DC
    text = text.replace(/{@h}/g, '<span class="dnd-icon-text">Vuruş:</span>');
    text = text.replace(/{@dc ([^}]+)}/g, '<span class="dnd-bold">DC $1</span>');

    // {@recharge 5} -> (Zar 5-6 gelince yenilenir)
    text = text.replace(/{@recharge ([^}]+)}/g, '(Yenilenme $1-6)');
    text = text.replace(/{@recharge}/g, '(Yenilenme 6)');

    // GENEL TEMİZLİK: {@spell Fireball|PHB} gibi olan her şeyi temizle
    // Mantık: {@birsey Icerik} veya {@birsey Icerik|Kaynak} -> "Icerik" kısmını alıp süslü link yap
    text = text.replace(/{@\w+ ([^}|]+)(?:\|[^}]+)?}/g, '<span class="dnd-link">$1</span>');

    // {@dice 1d6} gibi zar kodları
    // Not: Üstteki genel temizlik bunu da yakalar ama özel stil vermek istersen buraya ekleyebilirsin.
    
    return text;
}