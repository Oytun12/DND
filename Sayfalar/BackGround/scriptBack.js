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
   SCRIPTBACK.JS - Gelişmiş Etkileşimler (Multi-Open & Click Outside)
   ============================================================ */

/* --- MENÜ İŞLEMLERİ --- */
function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('open');
}

// GLOBAL TIKLAMA YÖNETİMİ
document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');

    // 1. Menü Kapatma Kontrolü
    // Eğer menü açıksa ve tıklanan yer menü veya ikon değilse -> Menüyü Kapat
    if (menu.classList.contains('open') && !menu.contains(event.target) && !menuIcon.contains(event.target)) {
        menu.classList.remove('open');
    }

    // 2. Geçmişleri Kapatma Kontrolü (Click Outside)
    // Eğer tıklanan yer bir 'Geçmiş Kartı' (Header veya İçerik) DEĞİLSE -> Hepsini Kapat
    const isInsideCard = event.target.closest('.bg-card-wrapper');
    
    if (!isInsideCard) {
        closeAllBackgrounds();
    }
});

// Tüm geçmişleri kapatan yardımcı fonksiyon
function closeAllBackgrounds() {
    // Tüm aktif başlıkların 'active' sınıfını kaldır (Ok işaretini düzelt)
    const allHeaders = document.querySelectorAll('.collapsible');
    allHeaders.forEach(h => h.classList.remove('active'));

    // Tüm içeriklere 'hidden' sınıfını ekle (Gizle)
    const allContents = document.querySelectorAll('.bg-content');
    allContents.forEach(c => c.classList.add('hidden'));
}

/* --- VERİ YÜKLEME --- */
document.addEventListener("DOMContentLoaded", () => {
    loadBackgrounds();
});

async function loadBackgrounds() {
    const container = document.getElementById('background-container');
    
    try {
        const response = await fetch('../../Data/backgrounds.json');
        if (!response.ok) throw new Error("Veri dosyası bulunamadı.");
        
        const data = await response.json();
        const backgrounds = data.background || data; 

        container.innerHTML = ''; 

        // Türkçe isim sırasına göre sırala
        backgrounds.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

        backgrounds.forEach(bg => {
            const card = createBackgroundCard(bg);
            container.appendChild(card);
        });

        attachAccordionEvents();

    } catch (error) {
        console.error("Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">Veriler yüklenirken bir hata oluştu.<br><small>${error.message}</small></div>`;
    }
}

/* --- KART OLUŞTURMA (GÜNCELLENDİ) --- */
function createBackgroundCard(bg) {
    const card = document.createElement('div');
    card.className = 'bg-card-wrapper';

    // 1. Başlık
    const header = document.createElement('h3');
    header.className = 'collapsible';
    
    // YENİ YAPI: 
    // Sol: İsim
    // Sağ: (Kaynak + Ok İkonu) bir arada
    header.innerHTML = `
        <span class="bg-name">${bg.name}</span>
        <div class="header-meta">
            <small class="bg-source">(${bg.source || 'PHB'})</small>
            <span class="arrow-icon">▼</span>
        </div>
    `;

    // 2. İçerik Alanı
    const content = document.createElement('div');
    content.className = 'bg-content hidden';

    // -- Üst Bilgiler --
    let infoHTML = '';
    if (bg.skillProficiencies) {
        const skills = Array.isArray(bg.skillProficiencies) ? bg.skillProficiencies.join(", ") : bg.skillProficiencies;
        infoHTML += `<p><strong class="bold">Beceri Uzmanlıkları:</strong> ${skills}</p>`;
    }
    
    // -- Detaylar --
    let entriesHTML = renderEntries(bg.entries);

    content.innerHTML = infoHTML + entriesHTML;

    card.appendChild(header);
    card.appendChild(content);

    return card;
}

/* --- İÇERİK FORMATLAMA --- */
function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    
    const entryList = Array.isArray(entries) ? entries : [entries];

    entryList.forEach(entry => {
        if (typeof entry === 'string') {
            html += `<p>${formatText(entry)}</p>`;
        } 
        else if (typeof entry === 'object') {
            if (entry.name && entry.type !== 'table') {
                html += `<h4 class="sub-header">${entry.name}</h4>`;
            }

            if (entry.type === 'table') {
                html += renderTable(entry);
            }
            else if (entry.type === 'list') {
                html += '<ul>' + entry.items.map(i => `<li>• ${formatText(i)}</li>`).join('') + '</ul>';
            }
            else if (entry.entries) {
                html += renderEntries(entry.entries);
            }
        }
    });
    
    return html;
}

function renderTable(tableData) {
    let html = `<div class="table-responsive"><table class="bg-table">`;
    
    if (tableData.colLabels) {
        html += `<thead><tr>`;
        tableData.colLabels.forEach(label => {
            const styleClass = (label.startsWith('d') && label.length < 4) ? 'col-dice' : '';
            html += `<th class="${styleClass}">${label}</th>`;
        });
        html += `</tr></thead>`;
    }

    html += `<tbody>`;
    if (tableData.rows) {
        tableData.rows.forEach(row => {
            html += `<tr>`;
            row.forEach((cell, index) => {
                const cellClass = (index === 0) ? 'text-center bold' : '';
                const cellText = typeof cell === 'object' ? formatText(cell.roll ? cell.roll.exact : JSON.stringify(cell)) : formatText(cell);
                html += `<td class="${cellClass}">${cellText}</td>`;
            });
            html += `</tr>`;
        });
    }
    html += `</tbody></table></div>`;
    return html;
}

function formatText(text) {
    if (!text) return "";
    // Kalın, İtalik
    text = text.replace(/{@bold ([^}]+)}/g, '<strong>$1</strong>');
    text = text.replace(/{@b ([^}]+)}/g, '<strong>$1</strong>');
    text = text.replace(/{@italic ([^}]+)}/g, '<em>$1</em>');
    
    // Büyü Linkleri (Opsiyonel, diğer sayfalardaki gibi mor yapmak istersen)
    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        const parts = content.split('|');
        const displayText = parts[2] || parts[0];
        const link = `https://kanguen.github.io/spells.html#${encodeURIComponent(parts[0].toLowerCase())}_phb`;
        return `<a href="${link}" target="_blank" style="color:#a855f7; text-decoration:underline;">${displayText}</a>`;
    });

    return text;
}

/* --- ACCORDION OLAYLARI --- */
function attachAccordionEvents() {
    const headers = document.querySelectorAll(".collapsible");
    headers.forEach(header => {
        header.addEventListener("click", function(e) {
            // Multi-open mantığı
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            
            if (content.classList.contains("hidden")) {
                content.classList.remove("hidden");
            } else {
                content.classList.add("hidden");
            }
        });
    });
}