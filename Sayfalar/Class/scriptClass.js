// --- MENÜ FONKSİYONLARI (Standart) ---
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

document.addEventListener('click', (event) => {
    const menu = document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');
    if (menu.classList.contains('visible') && !menu.contains(event.target) && !menuIcon.contains(event.target)) {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
});

// --- JSON VERİSİNİ ÇEKME VE İŞLEME ---
document.addEventListener("DOMContentLoaded", () => {
    // JSON dosyasının yolu (Data klasörü 2 seviye yukarıda)
    fetch('../../Data/classes.json')
        .then(response => response.json())
        .then(data => {
            renderClasses(data.class);
            initCollapsibles(); // İçerik yüklendikten sonra tıklama özelliğini ekle
        })
        .catch(error => {
            console.error('Hata:', error);
            document.getElementById('class-container').innerHTML = "<p style='color:red;'>Veri yüklenirken hata oluştu. Lütfen 'Data/classes.json' dosyasının yerinde olduğundan emin olun.</p>";
        });
});

// JSON verisini HTML'e çeviren fonksiyon
function renderClasses(classes) {
    const container = document.getElementById('class-container');
    container.innerHTML = ""; // Yükleniyor yazısını temizle

    classes.forEach(cls => {
        // İsim ve Slug (CSS class için)
        const className = cls.name;
        
        // --- HTML OLUŞTURMA ---
        let html = `
            <h3 class="collapsible">${className}</h3>
            <div class="class-content">
                <p><span class="bold">Hit Zarı:</span> 1d${cls.hd.faces}</p>
        `;

        // Uzmanlıklar
        const profs = cls.startingProficiencies;
        html += `<p><span class="bold">Zırhlar:</span> ${profs.armor ? profs.armor.join(", ") : "Yok"}</p>`;
        html += `<p><span class="bold">Silahlar:</span> ${profs.weapons ? profs.weapons.join(", ") : "Yok"}</p>`;
        
        if (profs.skills) {
            html += `<p><span class="bold">Beceriler:</span> ${profs.skills.choose} tane seçin: ${profs.skills.from.join(", ")}</p>`;
        }

        // Ekipman
        if (cls.startingEquipment && cls.startingEquipment.default) {
            html += `<p><span class="bold">Başlangıç Ekipmanı:</span></p><ul>`;
            cls.startingEquipment.default.forEach(item => {
                html += `<li>${item}</li>`;
            });
            html += `</ul>`;
        }

        html += `<hr>`;

        // Sınıf Özellikleri (Seviye Seviye)
        if (cls.classFeatures) {
            cls.classFeatures.forEach((levelFeatures, index) => {
                if (levelFeatures.length > 0) {
                    html += `<h4>Seviye ${index + 1}</h4>`;
                    levelFeatures.forEach(feature => {
                        html += `<div class="feature-block">
                                    <h5>${feature.name}</h5>
                                    ${renderEntries(feature.entries)}
                                 </div>`;
                    });
                }
            });
        }

        // Alt Sınıflar (Subclasses)
        if (cls.subclasses && cls.subclasses.length > 0) {
            html += `<hr><h3>${cls.subclassTitle || "Alt Sınıflar"}</h3>`;
            cls.subclasses.forEach(sub => {
                html += `<h4>${sub.name}</h4>`;
                if (sub.subclassFeatures) {
                    sub.subclassFeatures.forEach(lvlFeatures => {
                        lvlFeatures.forEach(feat => {
                            html += `<div class="feature-block">
                                        <h5>${feat.name || ""}</h5>
                                        ${renderEntries(feat.entries)}
                                     </div>`;
                        });
                    });
                }
            });
        }

        html += `</div>`; // class-content kapanış
        container.innerHTML += html;
    });
}

// Karmaşık metin içeriklerini (listeler, tablolar vb.) işleyen yardımcı fonksiyon
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
                // Basit tablo oluşturucu
                html += `<table><thead><tr>${entry.colLabels.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>`;
                entry.rows.forEach(row => {
                    html += `<tr>${row.map(cell => `<td>${typeof cell === 'object' ? (cell.roll ? cell.roll.exact : JSON.stringify(cell)) : cell}</td>`).join("")}</tr>`;
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

// Collapsible Aç/Kapa Mantığı
function initCollapsibles() {
    const collapsibles = document.querySelectorAll(".collapsible");
    collapsibles.forEach(collapsible => {
        collapsible.addEventListener("click", function() {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    });
}