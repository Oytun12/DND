// Global değişken: Tüm veriyi burada tutacağız ki tekrar tekrar çekmeyelim
let ALL_CLASSES_DATA = [];

// ------------------ MENÜ İŞLEMLERİ ------------------
const toggleMenu = () => {
    const menu = document.getElementById('hamburger-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('visible');
    } else {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
};

// ------------------ GLOBAL TIKLAMA DİNLEYİCİSİ ------------------
document.addEventListener('click', (event) => {
    // 1. MENÜ KAPATMA
    const menu = document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');
    if (menu.classList.contains('visible') && !menu.contains(event.target) && !menuIcon.contains(event.target)) {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }

    // 2. SINIFLARI KAPATMA (Boşluğa tıklanınca)
    const isHeader = event.target.closest('.collapsible');
    const isContent = event.target.closest('.class-content');
    
    // Eğer tıklanan yer buton, başlık veya içerik DEĞİLSE kapat
    if (!isHeader && !isContent) {
        document.querySelectorAll('.class-content').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.collapsible').forEach(el => el.classList.remove('active'));
    }
});

// ------------------ VERİ ÇEKME VE BAŞLATMA ------------------
document.addEventListener("DOMContentLoaded", () => {
    fetch('../../Data/classes.json')
        .then(response => response.json())
        .then(data => {
            ALL_CLASSES_DATA = data.class; // Veriyi hafızaya al
            renderClassHeaders();          // Sadece başlıkları oluştur
        })
        .catch(error => {
            console.error('Hata:', error);
            document.getElementById('class-container').innerHTML = "<p style='color:red;'>Veri yüklenemedi. 'Data/classes.json' dosyasını kontrol edin.</p>";
        });
});

// Sadece Sınıf Başlıklarını ve İskeleti Oluşturur
function renderClassHeaders() {
    const container = document.getElementById('class-container');
    container.innerHTML = ""; 

    ALL_CLASSES_DATA.forEach((cls, index) => {
        const classWrapper = document.createElement('div');
        classWrapper.className = 'class-wrapper';
        // ID atayalım ki CSS ile hangisi aktif bilelim
        classWrapper.id = `wrapper-${index}`;
        
        // Başlık
        const header = document.createElement('h3');
        header.className = 'collapsible';
        
        // Başlık İçeriği + Mobil Geri Butonu (Gizli gelir)
        header.innerHTML = `
            ${cls.name}
            <button class="mobile-back-btn" onclick="closeFocusMode(event)">KAPAT ✕</button>
        `;
        
        header.onclick = (e) => toggleClassAccordion(e, index, header);

        // İçerik Alanı
        const contentDiv = document.createElement('div');
        contentDiv.className = 'class-content';
        contentDiv.id = `class-content-${index}`;

        classWrapper.appendChild(header);
        classWrapper.appendChild(contentDiv);
        container.appendChild(classWrapper);
    });
}

/// Bir sınıfa tıklandığında
function toggleClassAccordion(e, classIndex, headerElement) {
    // Eğer Geri butonuna tıklandıysa bu fonksiyonu çalıştırma (Çakışmayı önle)
    if(e.target.classList.contains('mobile-back-btn')) return;

    e.stopPropagation();
    
    const contentDiv = document.getElementById(`class-content-${classIndex}`);
    const wrapper = document.getElementById(`wrapper-${classIndex}`);
    const isCurrentlyOpen = contentDiv.style.display === "block";

    // 1. Önce her şeyi temizle
    document.querySelectorAll(".class-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".collapsible").forEach(h => h.classList.remove("active"));
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active")); // Odak sınıfını temizle
    
    // Mobil odak modunu temizle (Eğer masaüstündeysek zaten etki etmez)
    document.body.classList.remove("mobile-focus");

    // 2. Açma İşlemi
    if (!isCurrentlyOpen) {
        headerElement.classList.add("active");
        contentDiv.style.display = "block";
        wrapper.classList.add("focus-active"); // Bu wrapper artık odakta

        // MOBİL ODAK MODUNU AKTİF ET
        if (window.innerWidth <= 768) {
            document.body.classList.add("mobile-focus");
            window.scrollTo(0, 0); // Sayfanın en tepesine at
        } else {
            // Masaüstü ise yumuşak kaydır
            setTimeout(() => {
                headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        
        renderClassDetails(classIndex, null);
    }
}

// Sınıfın tüm detaylarını (Özellikler, Seviyeler, Alt Sınıflar) çizer
function renderClassDetails(classIndex, selectedSubclassIndex) {
    const cls = ALL_CLASSES_DATA[classIndex];
    const container = document.getElementById(`class-content-${classIndex}`);
    
    // HTML stringini oluşturmaya başlıyoruz
    let html = `
        <p><span class="bold">Hit Zarı:</span> 1d${cls.hd.faces}</p>
    `;

    // --- Uzmanlıklar ---
    const profs = cls.startingProficiencies;
    html += `<p><span class="bold">Zırhlar:</span> ${profs.armor ? profs.armor.join(", ") : "Yok"}</p>`;
    html += `<p><span class="bold">Silahlar:</span> ${profs.weapons ? profs.weapons.join(", ") : "Yok"}</p>`;
    if (profs.skills) {
        html += `<p><span class="bold">Beceriler:</span> ${profs.skills.choose} tane seçin: ${profs.skills.from.join(", ")}</p>`;
    }

    // --- Ekipman ---
    if (cls.startingEquipment && cls.startingEquipment.default) {
        html += `<p><span class="bold">Başlangıç Ekipmanı:</span></p><ul>`;
        cls.startingEquipment.default.forEach(item => html += `<li>${item}</li>`);
        html += `</ul>`;
    }

    html += `<hr>`;

    // --- ALT SINIF SEÇİM BUTONLARI ---
    if (cls.subclasses && cls.subclasses.length > 0) {
        html += `<div class="subclass-selection-area">
                    <span class="subclass-title">Alt Sınıf Seçiniz (Özellikleri Görmek İçin):</span>`;
        
        cls.subclasses.forEach((sub, subIdx) => {
            // Aktif buton kontrolü
            const isActive = (selectedSubclassIndex === subIdx) ? "active" : "";
            // Butona tıklandığında renderClassDetails'i tekrar çağırıp bu sefer o alt sınıfı yolluyoruz
            html += `<button class="btn-subclass ${isActive}" onclick="selectSubclass(event, ${classIndex}, ${subIdx})">
                        ${sub.name}
                     </button>`;
        });
        html += `</div>`;
    }

// --- SEVİYELER VE ÖZELLİKLER (ENJEKSİYON MANTIĞI) ---
    // Eğer bir alt sınıf seçildiyse onun verisini al
    const selectedSubclass = (selectedSubclassIndex !== null) ? cls.subclasses[selectedSubclassIndex] : null;
    
    let subclassFeatureIndex = 0;

    if (cls.classFeatures) {
        cls.classFeatures.forEach((levelFeatures, index) => {
            if (!levelFeatures || levelFeatures.length === 0) return;

            const level = index + 1;
            html += `<h4>Seviye ${level}</h4>`;

            // 1. Bu seviyenin ANA sınıf özelliklerini yaz
            levelFeatures.forEach(feature => {
                html += `<div class="feature-block">
                            <h5>${feature.name}</h5>
                            ${renderEntries(feature.entries)}
                         </div>`;
                
// 2. ALT SINIF ÖZELLİĞİ VAR MI KONTROL ET
                if (feature.gainSubclassFeature && selectedSubclass) {
                    const subFeatures = selectedSubclass.subclassFeatures[subclassFeatureIndex];
                    if (subFeatures) {
                        subFeatures.forEach(subFeat => {
                            // DÜZELTME: Etiket (Tag) tamamen kaldırıldı, sadece özellik adı kaldı.
                            html += `<div class="feature-block subclass-feature">
                                        <h5>${subFeat.name}</h5>
                                        ${renderEntries(subFeat.entries)}
                                     </div>`;
                        });
                        subclassFeatureIndex++; 
                    }
                }
            });
        });
    }

    container.innerHTML = html;
}

// Butona tıklandığında çalışır
function selectSubclass(e, classIndex, subIndex) {
    e.stopPropagation(); // Accordion kapanmasın diye
    renderClassDetails(classIndex, subIndex); // Sayfayı seçilen alt sınıfla yeniden çiz
}

// --- YARDIMCI: KARMAŞIK METİN İŞLEYİCİ ---
function renderEntries(entries) {
    let html = "";
    if (!entries) return html;

    entries.forEach(entry => {
        if (typeof entry === "string") {
            html += `<p>${entry}</p>`;
        } else if (typeof entry === "object") {
            if (entry.type === "list") {
                html += `<ul>${entry.items.map(i => `<li>${renderEntries([i])}</li>`).join("")}</ul>`;
            } else if (entry.type === "table") {
                html += `<table><thead><tr>${entry.colLabels.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
                entry.rows.forEach(row => {
                     // Tablo hücresi bazen obje (roll) olabilir, onu kontrol et
                    let rowHtml = "";
                    row.forEach(cell => {
                        let cellContent = cell;
                        if (typeof cell === 'object' && cell.roll) cellContent = cell.roll.exact || cell.roll.min + "-" + cell.roll.max;
                        if (typeof cell === 'object' && cell.type === 'bonus') cellContent = "+" + cell.value;
                        rowHtml += `<td>${cellContent}</td>`;
                    });
                    html += `<tr>${rowHtml}</tr>`;
                });
                html += `</tbody></table>`;
            } else if (entry.type === "entries") {
                html += `<strong>${entry.name || ""}</strong>`;
                html += renderEntries(entry.entries);
            }
        }
    });
    return html;
}

// Mobilde Kapat Butonuna Basınca
function closeFocusMode(e) {
    e.stopPropagation(); // Üstteki tıklamaları engelle
    
    // Her şeyi kapat ve resetle
    document.querySelectorAll(".class-content").forEach(c => c.style.display = "none");
    document.querySelectorAll(".collapsible").forEach(h => h.classList.remove("active"));
    document.querySelectorAll(".class-wrapper").forEach(w => w.classList.remove("focus-active"));
    
    document.body.classList.remove("mobile-focus");
}