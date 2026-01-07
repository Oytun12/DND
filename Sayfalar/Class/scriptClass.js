let ALL_CLASSES_DATA = [];
let currentActiveIndex = null; // HAFIZA: Şu an hangi sınıf açık? (Yoksa null)

// ------------------ MENÜ & TAB İŞLEMLERİ ------------------
const toggleMenu = () => {
    const menu = document.getElementById('hamburger-menu');
    menu.classList.toggle('hidden');
    menu.classList.toggle('visible');
};

// TAB DEĞİŞTİRME FONKSİYONU (GÜNCELLENDİ: SENKRONİZASYON EKLENDİ)
function openTab(evt, viewId) {
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

    // --- SENKRONİZASYON BÜYÜSÜ ---
    // Eğer şu an bir sınıf açıksa, yeni sekmede de aynı sınıfı aç
    if (currentActiveIndex !== null) {
        // Hangi sekmedeyiz? view-features -> 'feat', view-tables -> 'table'
        const targetType = (viewId === 'view-features') ? 'feat' : 'table';
        
        // O sekmedeki ilgili sınıfın başlığını (Header) bul
        // ID yapımız: wrapper-feat-0 veya wrapper-table-0
        const wrapperId = `wrapper-${targetType}-${currentActiveIndex}`;
        const wrapper = document.getElementById(wrapperId);
        
        if (wrapper) {
            const header = wrapper.querySelector('.collapsible');
            if (header) {
                // Sanki kullanıcı tıklamış gibi tetikle!
                // Not: click() metodu bizim toggleClassAccordion fonksiyonumuzu çalıştırır.
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

    // Eğer sınıf dışına tıklandıysa HEPSİNİ KAPAT ve HAFIZAYI SİL
    if (!isHeader && !isContent && !isTab && !isSubBtn) {
        closeAllAccordions();
    }
});

// Yardımcı: Her şeyi kapatan ve hafızayı sıfırlayan fonksiyon
function closeAllAccordions() {
    document.querySelectorAll('.class-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.collapsible').forEach(el => el.classList.remove('active'));
    
    // Mobil odak modunu temizle
    document.body.classList.remove("mobile-focus");
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active"));

    // HAFIZAYI SİL (Artık hiçbir sınıf açık değil)
    currentActiveIndex = null;
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
            document.getElementById('container-features').innerHTML = "<p style='color:red;'>Veri yüklenemedi.</p>";
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
    
    // Tıklama Olayı
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

    // 1. Önce Hepsini Kapat (Görsel Olarak)
    // Not: closeAllAccordions() çağırmıyoruz çünkü o index'i de sıfırlıyor.
    // Biz sadece görselleri kapatıp yenisini açacağız.
    document.querySelectorAll(".class-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".collapsible").forEach(h => h.classList.remove("active"));
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active"));
    document.body.classList.remove("mobile-focus");

    if (!isOpen) {
        // 2. Tıklananı Aç
        headerElement.classList.add("active");
        contentDiv.style.display = "block";
        wrapper.classList.add("focus-active");

        // HAFIZAYA KAYDET (Senkronizasyon için)
        currentActiveIndex = classIndex;

        // Mobil Odak
        if (window.innerWidth <= 768) {
            document.body.classList.add("mobile-focus");
            window.scrollTo(0, 0);
        } else {
            // Sadece kullanıcı gerçekten tıkladıysa (e.isTrusted) kaydır
            // Yoksa sekme değişiminde sayfa zıplamasın
            if (e.isTrusted) {
                setTimeout(() => headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
            }
        }

        // İçeriği Doldur
        if (type === 'feat') {
            // Eğer daha önce alt sınıf seçildiyse onu hatırla? 
            // Şimdilik sıfırlıyoruz, istenirse o da hafızaya alınabilir.
            renderClassFeatures(classIndex, contentId);
        } else {
            renderClassTable(classIndex, contentId);
        }
    } else {
        // Eğer zaten açıksa ve tekrar tıklandıysa -> Kapat ve Hafızayı Sil
        currentActiveIndex = null;
    }
}

// Mobilde Kapatma Butonu
function closeFocusMode(e) {
    e.stopPropagation();
    closeAllAccordions(); // Hepsini kapat ve hafızayı sil
}

// ------------------ İÇERİK OLUŞTURUCU: TABLOLAR ------------------
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
            html += `<th>${label}</th>`;
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
    if (typeof cell === 'object') {
        if (cell.type === 'bonus') return `+${cell.value}`;
        if (cell.type === 'dice') return cell.toRoll ? cell.toRoll : cell.number + 'd' + cell.faces;
        if (cell.roll) return cell.roll.exact || `${cell.roll.min}-${cell.roll.max}`;
        return JSON.stringify(cell);
    }
    if (cell === 0 || cell === "0") return "—";
    return cell;
}

// ------------------ İÇERİK OLUŞTURUCU: REHBER ------------------
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
                if (feat.gainSubclassFeature && selectedSubclass) {
                    const subs = selectedSubclass.subclassFeatures[subFeatIdx];
                    if (subs) {
                        subs.forEach(sf => {
                            // SADECE MAVİ KUTU, ETİKET YOK
                            html += `<div class="feature-block subclass-feature">
                                        <h5>${sf.name}</h5>
                                        ${renderEntries(sf.entries)}
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

function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    entries.forEach(e => {
        if (typeof e === "string") html += `<p>${e}</p>`;
        else if (e.type === "list") html += `<ul>${e.items.map(i => `<li>${renderEntries([i])}</li>`).join("")}</ul>`;
        else if (e.type === "table") {
             html += `<table><thead><tr>${e.colLabels.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
             e.rows.forEach(row => {
                 let rHtml = "";
                 row.forEach(c => rHtml += `<td>${typeof c==='object' ? (c.roll ? c.roll.exact : JSON.stringify(c)) : c}</td>`);
                 html += `<tr>${rHtml}</tr>`;
             });
             html += `</tbody></table>`;
        }
    });
    return html;
}