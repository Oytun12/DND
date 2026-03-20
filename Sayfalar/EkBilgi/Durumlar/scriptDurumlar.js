document.addEventListener("DOMContentLoaded", () => {
    // Sayfanın URL'sinde 'widget=true' şifresi var mı kontrol et
    if (window.location.search.includes('widget=true')) {
        // Varsa, ana menüyü (header) gizle
        const header = document.querySelector('.main-header');
        if (header) header.style.display = 'none';

        // İsteğe bağlı: DM screen'e daha iyi sığması için ana kapsayıcının dış boşluklarını sıfırla
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.margin = '0';
            mainContainer.style.padding = '10px';
        }
        
        // İsteğe bağlı: Filtreleme arama çubuğunu gizlemek istersen
        // const filterSection = document.querySelector('.filter-section');
        // if (filterSection) filterSection.style.display = 'none';
    }
});

/* ============================================================
   SCRIPTDURUMLAR.JS - Durumlar (Multi-Open & Auto Close)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    loadConditions();
    setupSearch();
});

let ALL_CONDITIONS = [];

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

    // 2. Durumları Kapatma Kontrolü
    // Tıklanan yer bir 'Durum Kartı' DEĞİLSE -> Hepsini Kapat
    const isClickInsideCard = event.target.closest('.condition-card');
    
    if (!isClickInsideCard) {
        closeAllConditions();
    }
});

// Yardımcı Fonksiyon: Tüm açık durumları kapat
function closeAllConditions() {
    // İçerikleri gizle
    document.querySelectorAll('.condition-content').forEach(content => {
        content.style.display = 'none';
    });

    // Başlık stillerini (renk ve ok) sıfırla
    document.querySelectorAll('.condition-header').forEach(header => {
        header.style.backgroundColor = ''; 
        const arrow = header.querySelector('.arrow-icon');
        if(arrow) arrow.style.transform = 'rotate(0deg)';
    });
}

/* --- VERİ YÜKLEME --- */
async function loadConditions() {
    const container = document.getElementById('condition-list');
    
    try {
        const response = await fetch('../../../Data/conditions.json');
        
        if (!response.ok) throw new Error("Veri dosyası bulunamadı.");
        
        const data = await response.json();
        ALL_CONDITIONS = data.condition || data; 

        // Türkçe isme göre sırala
        ALL_CONDITIONS.sort((a, b) => {
            const nameA = a.trName || a.name;
            const nameB = b.trName || b.name;
            return nameA.localeCompare(nameB, 'tr');
        });

        renderConditions(ALL_CONDITIONS);

    } catch (error) {
        console.error("Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">
            Veriler yüklenirken hata oluştu.<br><small>${error.message}</small>
        </div>`;
    }
}

/* --- RENDER İŞLEMİ --- */
function renderConditions(list) {
    const container = document.getElementById('condition-list');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888;">Eşleşen durum bulunamadı.</div>';
        return;
    }

    list.forEach(cond => {
        const card = document.createElement('div');
        card.className = 'condition-card';

        // İsim (Türkçe varsa onu kullan, yanına İngilizceyi ekle)
        const displayName = cond.trName || cond.name;
        const subName = cond.trName ? ` <small style="color:#888; font-weight:normal;">(${cond.name})</small>` : '';

        // Header
        const header = document.createElement('div');
        header.className = 'condition-header';
        header.innerHTML = `
            <span class="cond-title">
                <span class="cond-icon">💀</span> 
                ${displayName}${subName}
            </span>
            <span class="arrow-icon">▼</span>
        `;

        // Content
        const content = document.createElement('div');
        content.className = 'condition-content';
        content.innerHTML = renderEntries(cond.entries);

        // TIKLAMA OLAYI (MULTI-OPEN)
        // Sadece tıklanan kartı aç/kapat, diğerlerini etkileme
        header.addEventListener('click', () => {
            const isOpen = content.style.display === 'block';
            
            content.style.display = isOpen ? 'none' : 'block';
            header.querySelector('.arrow-icon').style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
            header.style.backgroundColor = isOpen ? '' : '#3a3a3a';
        });

        card.appendChild(header);
        card.appendChild(content);
        container.appendChild(card);
    });
}

/* --- ARAMA VE YARDIMCILAR --- */
function setupSearch() {
    const input = document.getElementById('search-input');
    input.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        
        const filtered = ALL_CONDITIONS.filter(c => {
            const enName = c.name.toLowerCase();
            const trName = (c.trName || "").toLowerCase();
            return enName.includes(term) || trName.includes(term);
        });

        renderConditions(filtered);
    });
}

function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    const list = Array.isArray(entries) ? entries : [entries];

    list.forEach(entry => {
        if (typeof entry === 'string') {
            html += `<p>${formatText(entry)}</p>`;
        } 
        else if (entry.type === 'list') {
            html += '<ul>' + entry.items.map(i => `<li>${formatText(i)}</li>`).join('') + '</ul>';
        }
    });
    return html;
}

function formatText(text) {
    if(typeof text !== 'string') return JSON.stringify(text);
    return text.replace(/{@\w+\s+([^}]+)}/g, '$1');
}

function toggleMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}