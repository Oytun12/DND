/* ============================================================
   SCRIPTYAKARISLAR.JS - Warlock Verisi & Akıllı Sıralama
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    loadInvocations();
    setupFilters(); // İsmi setupSearch yerine setupFilters yaptık
});

let ALL_INVOCATIONS = [];

/* --- GLOBAL TIKLAMA YÖNETİMİ --- */
document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');

    if (menu && menu.classList.contains('open')) {
        if (!menu.contains(event.target) && !menuIcon.contains(event.target)) {
            menu.classList.remove('open');
        }
    }

    const isClickInsideCard = event.target.closest('.inv-card');
    if (!isClickInsideCard) {
        closeAllInvocations();
    }
});

function closeAllInvocations() {
    document.querySelectorAll('.inv-content').forEach(content => {
        content.style.display = 'none';
    });
    document.querySelectorAll('.inv-header').forEach(header => {
        header.style.backgroundColor = ''; 
        const arrow = header.querySelector('.arrow-icon');
        if(arrow) arrow.style.transform = 'rotate(0deg)';
    });
}

/* --- VERİ YÜKLEME --- */
async function loadInvocations() {
    const container = document.getElementById('inv-list');
    
    try {
        const response = await fetch('../../../Data/classes.json');
        if (!response.ok) throw new Error("Veri dosyası bulunamadı.");
        
        const data = await response.json();
        const classList = data.class || data;
        const warlock = classList.find(c => c.name.toLowerCase() === "warlock" || c.name.toLowerCase() === "sihirbaz");

        if (!warlock) throw new Error("Warlock sınıf verisi bulunamadı.");

        let foundOptions = null;
        if (warlock.classFeatures) foundOptions = findInvocationsRecursive(warlock.classFeatures);
        if (!foundOptions && data.classFeature) foundOptions = findInvocationsRecursive(data.classFeature);

        if (!foundOptions) throw new Error("Yakarış listesi veritabanında tespit edilemedi.");

        ALL_INVOCATIONS = foundOptions;

        // Başlangıçta filtreleme ve sıralama fonksiyonunu çağır
        filterAndRender();

    } catch (error) {
        console.error("Hata Detayı:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">
            Veriler yüklenirken hata oluştu.<br><small>${error.message}</small>
        </div>`;
    }
}

// Recursive Bulucu (Değişmedi)
function findInvocationsRecursive(obj) {
    if (!obj || typeof obj !== 'object') return null;
    if (Array.isArray(obj)) {
        for (let item of obj) {
            const result = findInvocationsRecursive(item);
            if (result) return result;
        }
        return null;
    }
    if (obj.name === "Eldritch Yakarışları" || obj.name === "Eldritch Invocations") {
        if (obj.entries) {
            const optionsEntry = obj.entries.find(e => e.type === 'options');
            if (optionsEntry && optionsEntry.entries) return optionsEntry.entries;
        }
    }
    if (obj.type === 'options' && obj.entries && obj.entries.length > 0) {
        if (obj.entries[0].type === 'invocation') return obj.entries;
    }
    const keysToSearch = ['entries', 'classFeature', 'classFeatures'];
    for (let key of keysToSearch) {
        if (obj[key]) {
            const result = findInvocationsRecursive(obj[key]);
            if (result) return result;
        }
    }
    return null;
}

/* --- FİLTRELEME VE SIRALAMA MANTIĞI (YENİ) --- */
function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');

    // Her iki element değiştiğinde de aynı ana fonksiyonu çağırıyoruz
    searchInput.addEventListener('input', filterAndRender);
    sortSelect.addEventListener('change', filterAndRender);
}

function filterAndRender() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortValue = document.getElementById('sort-select').value;

    // 1. ARAMA FİLTRESİ
    let filtered = ALL_INVOCATIONS.filter(inv => {
        const nameMatch = inv.name.toLowerCase().includes(searchTerm);
        // İstersen gereksinim içinde de arama yapabilirsin:
        // const prereqMatch = (inv.prerequisite || "").toLowerCase().includes(searchTerm);
        return nameMatch; 
    });

    // 2. SIRALAMA
    filtered.sort((a, b) => {
        if (sortValue === 'name-asc') {
            return a.name.localeCompare(b.name, 'tr');
        } 
        else if (sortValue === 'name-desc') {
            return b.name.localeCompare(a.name, 'tr');
        } 
        else if (sortValue === 'level-asc') {
            // Seviyesi düşük olan önce, eşitse isme göre
            return (extractLevel(a) - extractLevel(b)) || a.name.localeCompare(b.name, 'tr');
        } 
        else if (sortValue === 'level-desc') {
            // Seviyesi yüksek olan önce
            return (extractLevel(b) - extractLevel(a)) || a.name.localeCompare(b.name, 'tr');
        }
    });

    renderInvocations(filtered);
}

// --- SİHİRLİ FONKSİYON: Metinden Seviye Çıkarma ---
function extractLevel(inv) {
    if (!inv.prerequisite) return 0; // Gereksinim yoksa 0. seviye kabul et

    // Regex Açıklaması:
    // (\d+)  -> Bir veya daha fazla rakam yakala (Grup 1)
    // \.     -> Nokta karakteri (Örn: 9.)
    // \s* -> Olası boşluk
    // seviye -> "seviye" kelimesi
    const regex = /(\d+)\.\s*seviye/i;
    const match = inv.prerequisite.match(regex);

    if (match) {
        return parseInt(match[1]); // Bulunan sayıyı döndür (Örn: 9)
    }
    
    return 0; // "seviye" kelimesi geçmiyorsa (Örn: "eldritch blast cantripi") 0 döndür
}

/* --- RENDER İŞLEMİ --- */
function renderInvocations(list) {
    const container = document.getElementById('inv-list');
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = '<div style="text-align:center; color:#888;">Yakarış bulunamadı.</div>';
        return;
    }

    list.forEach(inv => {
        const card = document.createElement('div');
        card.className = 'inv-card';

        const prereqText = formatText(inv.prerequisite || "");
        
        // Header
        const header = document.createElement('div');
        header.className = 'inv-header';
        
        const prereqHTML = prereqText 
            ? `<span class="inv-prereq"><span class="prereq-label">Gereksinim:</span> ${prereqText}</span>` 
            : `<span class="inv-prereq" style="opacity:0.5;">Gereksinim Yok</span>`;

        header.innerHTML = `
            <div class="inv-title-group">
                <span class="inv-name">${inv.name}</span>
                ${prereqHTML}
            </div>
            <span class="arrow-icon">▼</span>
        `;

        // Content
        const content = document.createElement('div');
        content.className = 'inv-content';
        content.innerHTML = renderEntries(inv.entries);

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

function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    const list = Array.isArray(entries) ? entries : [entries];
    list.forEach(e => {
        if (typeof e === 'string') html += `<p>${formatText(e)}</p>`;
        else if (typeof e === 'object' && e.type === 'list') {
            html += '<ul>' + e.items.map(i => `<li>${formatText(i)}</li>`).join('') + '</ul>';
        }
    });
    return html;
}

function formatText(text) {
    if (!text || typeof text !== 'string') return text;

    // 1. {@spell ...} Etiketlerini Bul ve Kanguen Sitesine Linkle
    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        // İçerik: "Büyü Adı | Kaynak | Görünen Metin" şeklinde olabilir
        const parts = content.split('|');
        const originalName = parts[0]; 
        
        // Kaynak belirtilmemişse 'phb' varsayalım (Irklar sayfasındaki mantık)
        const source = parts.length > 1 ? parts[1] : 'phb';
        
        // Görünen metin belirtilmemişse orijinal ismi kullan
        const displayText = parts.length > 2 ? parts[2] : originalName;

        // URL için güvenli hale getir (Küçük harf + encode)
        const urlName = encodeURIComponent(originalName.toLowerCase());
        const urlSource = encodeURIComponent(source.toLowerCase());
        
        // Hedef Link (Kanguen Github IO)
        // Örnek: .../spells.html#compulsion%20(zorlama)_phb
        const link = `https://kanguen.github.io/spells.html#${urlName}_${urlSource}`;

        // CSS stili "stylesYakarislar.css" içindeki .dnd-link.spell-link sınıfından gelecek
        return `<a href="${link}" target="_blank" class="dnd-link spell-link">${displayText}</a>`;
    });

    // 2. Diğer etiketleri temizle (Sadece metni bırak)
    text = text.replace(/{@\w+\s+([^}|]+)(?:\|[^}]+)?}/g, '$1');

    return text;
}

function toggleMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}