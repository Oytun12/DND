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
   SCRIPTENVANTER.JS - Akıllı Birleştirici, Filtreleyici ve Sıralayıcı (v2.0)
   ============================================================ */

/* --- GLOBAL DEĞİŞKENLER --- */
let allItems = []; // Tüm eşyalar burada toplanacak
let currentTab = 'basic'; // 'basic' veya 'magic'

/* --- BAŞLANGIÇ --- */
document.addEventListener("DOMContentLoaded", () => {
    initializeInventory();
});

/* --- VERİ YÜKLEME VE BİRLEŞTİRME --- */
async function initializeInventory() {
    const container = document.getElementById('inventory-container');
    container.innerHTML = `<div style="text-align: center; color: #888; padding: 20px;"><p>Tüm veriler taranıyor ve birleştiriliyor...</p></div>`;

    try {
        const [basicRes, magicRes] = await Promise.allSettled([
            fetch('../../Data/basicitems.json'),
            fetch('../../Data/items.json')
        ]);

        let combinedItems = [];

        if (basicRes.status === 'fulfilled') {
            const data = await basicRes.value.json();
            const list = data.basicitem || data.basicitems || data.item || data.items || [];
            if(Array.isArray(list)) combinedItems = combinedItems.concat(list);
        }

        if (magicRes.status === 'fulfilled') {
            const data = await magicRes.value.json();
            const list = data.item || data.items || data.basicitem || [];
            if(Array.isArray(list)) combinedItems = combinedItems.concat(list);
        }

        allItems = cleanData(combinedItems);
        console.log(`Toplam ${allItems.length} eşya yüklendi.`);

        renderTab('basic');

    } catch (error) {
        console.error("Kritik Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">Veriler yüklenirken hata oluştu.<br><small>${error.message}</small></div>`;
    }
}

function cleanData(items) {
    const uniqueItems = new Map();
    items.forEach(item => {
        if (!item.name || item.name === "Hatalı Girdi") return;
        if (!uniqueItems.has(item.name)) {
            uniqueItems.set(item.name, item);
        }
    });
    return Array.from(uniqueItems.values());
}

/* --- SEKME YÖNETİMİ --- */
window.switchTab = function(type) {
    if (currentTab === type) return;
    currentTab = type;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.innerText.toLowerCase().includes(type === 'basic' ? 'temel' : 'sihirli')) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    renderTab(type);
}

/* --- RENDER İŞLEMLERİ --- */
function renderTab(type) {
    const container = document.getElementById('inventory-container');
    container.innerHTML = '';

    let filteredItems = [];

    if (type === 'basic') {
        filteredItems = allItems.filter(item => {
            const r = (item.rarity || "").toLowerCase();
            return !r || r === "none" || r === "unknown";
        });
    } else {
        filteredItems = allItems.filter(item => {
            const r = (item.rarity || "").toLowerCase();
            return r && r !== "none" && r !== "unknown";
        });
    }

    if (filteredItems.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#aaa;">Bu kategoride eşya bulunamadı.</div>`;
        return;
    }

    const armorList = filteredItems.filter(i => isArmor(i));
    const weaponList = filteredItems.filter(i => isWeapon(i));
    const gearList = filteredItems.filter(i => !isArmor(i) && !isWeapon(i) && !i._isSubItem);

    const prefix = type === 'magic' ? 'Sihirli ' : '';
    
    // Zırhlar ve Silahlar için "Özellikler" sıralamasını da aktif edeceğiz.
    createCategorySection(`${prefix}Zırhlar ve Kalkanlar`, armorList, container, renderArmorRow, 'armor');
    createCategorySection(`${prefix}Silahlar`, weaponList, container, renderWeaponRow, 'weapon');
    
    const gearTitle = type === 'magic' ? "Yüzükler, Asalar ve Diğerleri" : "Macera Ekipmanları";
    createCategorySection(gearTitle, gearList, container, renderGearRow, 'gear');

    attachAccordionEvents();
}

function isArmor(item) {
    const t = item.type;
    return t === 'LA' || t === 'MA' || t === 'HA' || t === 'S'; 
}

function isWeapon(item) {
    const t = item.type;
    return t === 'M' || t === 'R' || t === 'A'; 
}

/* --- KATEGORİ OLUŞTURMA VE SIRALAMA --- */
function createCategorySection(title, itemList, parent, rowRenderer, categoryType) {
    if (itemList.length === 0) return;

    // Varsayılan sıralama: Zırhlar AC'ye göre, Silahlar Hasara göre, Diğerleri İsme göre
    let currentSort = 'name';
    if(categoryType === 'armor') currentSort = 'props'; // Varsayılan AC sıralaması
    if(categoryType === 'weapon') currentSort = 'props'; // Varsayılan Hasar sıralaması

    let sortDirection = 1; // 1: Artan (A-Z, Düşük-Yüksek)

    // Başlangıç sıralaması (Silah ve Zırhlar için varsayılan olarak en güçlü en üstte olsun diye -1 yapıyoruz)
    if (categoryType === 'armor' || categoryType === 'weapon') sortDirection = -1;

    sortList(itemList, currentSort, sortDirection, categoryType);

    const card = document.createElement('div');
    card.className = 'category-card';

    // HTML Yapısı - 4. Sütuna da 'sortable' ekledik
    card.innerHTML = `
        <div class="collapsible-header">
            <h3>${title} (${itemList.length})</h3>
            <span class="arrow-icon">▼</span>
        </div>
        <div class="category-content">
            <div class="item-table-wrapper">
                <table class="item-table">
                    <thead>
                        <tr>
                            <th class="col-name sortable" data-sort="name">Eşya Adı <span class="sort-icon">⇅</span></th>
                            <th class="col-cost sortable" data-sort="cost">Bedel / Nadirlik <span class="sort-icon">⇅</span></th>
                            <th class="col-weight sortable" data-sort="weight">Ağırlık <span class="sort-icon">⇅</span></th>
                            <th class="col-props sortable" data-sort="props">Özellikler <span class="sort-icon">⇅</span></th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = card.querySelector('tbody');
    const headers = card.querySelectorAll('th.sortable');

    function updateTable() {
        tbody.innerHTML = '';
        itemList.forEach(item => {
            const row = rowRenderer(item);
            tbody.appendChild(row);
            
            if (item.entries && item.entries.length > 0) {
                const detailRow = document.createElement('tr');
                detailRow.className = 'item-detail-row';
                detailRow.innerHTML = `
                    <td colspan="4">
                        <div class="item-desc">${renderEntries(item.entries)}</div>
                    </td>
                `;
                tbody.appendChild(detailRow);
                row.style.cursor = "pointer";
                row.addEventListener('click', () => { detailRow.classList.toggle('active'); });
            }
        });
        
        // İkonları güncelle
        headers.forEach(h => {
            const icon = h.querySelector('.sort-icon');
            if (h.getAttribute('data-sort') === currentSort) {
                icon.textContent = sortDirection === 1 ? '▲' : '▼'; // Artan / Azalan
                icon.style.opacity = '1';
                icon.style.color = '#b52b2b';
            } else {
                icon.textContent = '⇅';
                icon.style.opacity = '0.3';
                icon.style.color = 'inherit';
            }
        });
    }

    updateTable();

    // Tıklama Olayları
    headers.forEach(th => {
        th.addEventListener('click', () => {
            const sortBy = th.getAttribute('data-sort');
            
            if (currentSort === sortBy) {
                sortDirection *= -1;
            } else {
                currentSort = sortBy;
                // Yeni sütuna geçince; özellikler veya bedel ise genelde yüksekten düşüğe isteriz
                if (sortBy === 'props' || sortBy === 'cost') sortDirection = -1;
                else sortDirection = 1;
            }

            sortList(itemList, sortBy, sortDirection, categoryType);
            updateTable();
        });
    });

    parent.appendChild(card);
}

/* --- GELİŞMİŞ SIRALAMA MANTIĞI --- */
function sortList(list, criteria, direction, type) {
    list.sort((a, b) => {
        let valA, valB;

        // 1. İSİM SIRALAMASI
        if (criteria === 'name') {
            valA = (a.name || "").toLowerCase();
            valB = (b.name || "").toLowerCase();
            return valA.localeCompare(valB) * direction;
        } 
        // 2. AĞIRLIK SIRALAMASI
        else if (criteria === 'weight') {
            valA = parseFloat(a.weight) || 0;
            valB = parseFloat(b.weight) || 0;
            return (valA - valB) * direction;
        } 
        // 3. BEDEL / NADİRLİK SIRALAMASI
        else if (criteria === 'cost') {
            valA = parseCost(a);
            valB = parseCost(b);
            return (valA - valB) * direction;
        }
        // 4. ÖZELLİKLER (Zırh AC / Silah Hasarı)
        else if (criteria === 'props') {
            if (type === 'armor') {
                // AC'ye göre hesapla
                valA = (a.ac || 0) + (a.bonusAc || 0);
                valB = (b.ac || 0) + (b.bonusAc || 0);
            } 
            else if (type === 'weapon') {
                // Ortalama Hasara göre hesapla
                valA = calculateAverageDamage(a.dmg1);
                valB = calculateAverageDamage(b.dmg1);
            } 
            else {
                // Diğerleri için yazı uzunluğu veya alfabetik (fallback)
                valA = (a.name || "").length;
                valB = (b.name || "").length;
            }
            return (valA - valB) * direction;
        }
        return 0;
    });
}

// Zar hasarını puana çevirir (Örn: "2d6" -> 7, "1d12" -> 6.5)
function calculateAverageDamage(dmgStr) {
    if (!dmgStr) return 0;
    // Format: "2d6" veya "1d4"
    const parts = dmgStr.split('d');
    if (parts.length !== 2) return 0;

    const count = parseInt(parts[0]) || 0; // Zar adedi
    const faces = parseInt(parts[1]) || 0; // Zar yüzü

    // Ortalama hasar formülü: Adet * ((Yüz + 1) / 2)
    return count * ((faces + 1) / 2);
}

// Bedeli sayısal değere (Bakır cinsinden) çevirir
function parseCost(item) {
    if (item.rarity && item.rarity !== 'none' && item.rarity !== 'unknown') {
        const rarityMap = { 'common': 100, 'uncommon': 500, 'rare': 5000, 'very rare': 50000, 'legendary': 200000, 'artifact': 999999 };
        return (rarityMap[item.rarity.toLowerCase()] || 0) * 100;
    }

    if (!item.value) return 0;
    
    // items.json'da value bazen sayı (cp), bazen string olmayabilir.
    // 5eTools verisinde genelde sayı (cp) gelir. Örn: 500 (= 5gp)
    if (typeof item.value === 'number') return item.value;

    let str = String(item.value).toLowerCase().trim();
    let multiplier = 1;
    if (str.includes('pp')) multiplier = 1000;
    else if (str.includes('gp')) multiplier = 100;
    else if (str.includes('sp')) multiplier = 10;
    else if (str.includes('cp')) multiplier = 1;

    let num = parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
    return num * multiplier;
}

/* --- HTML FORMATLAYICILAR (AYNI) --- */
function renderArmorRow(item) {
    const tr = document.createElement('tr');
    let acText = item.ac ? `${item.ac} AC` : "";
    if (item.bonusAc) acText += ` (+${item.bonusAc})`;
    
    // Sıralama mantığını görselleştirmek için gerekirse buraya ekleme yapılabilir
    const props = [acText, item.stealth ? "Gizlilik Dez." : ""].filter(Boolean).join(", ");

    tr.innerHTML = `
        <td class="col-name">${item.name}</td>
        <td class="col-cost">${formatCostOrRarity(item)}</td>
        <td class="col-weight">${item.weight ? item.weight + " lb." : "-"}</td>
        <td class="col-props">${props || "-"}</td>
    `;
    return tr;
}

function renderWeaponRow(item) {
    const tr = document.createElement('tr');
    const dmg = item.dmg1 ? `${item.dmg1} ${translateDamage(item.dmgType)}` : "";
    let props = item.property ? item.property.map(translateProperty).join(", ") : "";

    tr.innerHTML = `
        <td class="col-name">${item.name}</td>
        <td class="col-cost">${formatCostOrRarity(item)}</td>
        <td class="col-weight">${item.weight ? item.weight + " lb." : "-"}</td>
        <td class="col-props">${[dmg, props].filter(Boolean).join(" | ")}</td>
    `;
    return tr;
}

function renderGearRow(item) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="col-name">${item.name}</td>
        <td class="col-cost">${formatCostOrRarity(item)}</td>
        <td class="col-weight">${item.weight ? item.weight + " lb." : "-"}</td>
        <td class="col-props" style="font-size:0.9em; font-style:italic;">Tıklayıp detay gör</td>
    `;
    return tr;
}

/* --- YARDIMCI FONKSİYONLAR --- */
function formatCostOrRarity(item) {
    const rarityMap = {
        'common': 'Yaygın', 'uncommon': 'Yaygın Olmayan', 'rare': 'Nadir',
        'very rare': 'Çok Nadir', 'legendary': 'Efsanevi', 'artifact': 'Artifakt'
    };
    if (item.rarity && item.rarity !== 'none' && item.rarity !== 'unknown') {
        return rarityMap[item.rarity.toLowerCase()] || item.rarity;
    }
    // Para birimi formatlama
    if (item.value) {
        if(typeof item.value === 'number') {
            // Sadece basit bir çeviri (cp -> gp)
            if(item.value >= 100 && item.value % 100 === 0) return (item.value / 100) + " gp";
            if(item.value >= 10 && item.value % 10 === 0) return (item.value / 10) + " sp";
            return item.value + " cp";
        }
        return item.value;
    }
    return "-";
}

function translateDamage(type) {
    const map = { 'S': 'Kesici', 'B': 'Ezici', 'P': 'Delici', 'R': 'Radyant', 'N': 'Nekrotik', 'F': 'Ateş', 'C': 'Soğuk', 'L': 'Yıldırım' };
    return map[type] || type;
}

function translateProperty(prop) {
    const map = { 'L': 'Hafif', 'F': 'Zarif', 'T': 'Fırlatılan', '2H': 'Çift-El', 'V': 'Çok Yönlü', 'H': 'Ağır', 'R': 'Menzilli', 'A': 'Mühimmat', 'LD': 'Kurmalı' };
    return map[prop] || prop;
}

function renderEntries(entries) {
    if (!entries) return "";
    let html = "";
    entries.forEach(entry => {
        if (typeof entry === 'string') html += `<p>${parseTags(entry)}</p>`;
        else if (entry.type === 'list') html += '<ul>' + entry.items.map(i => `<li>${parseTags(i)}</li>`).join('') + '</ul>';
        else if (entry.entries) {
            if(entry.name) html += `<strong>${entry.name}: </strong>`;
            html += renderEntries(entry.entries);
        }
    });
    return html;
}

function parseTags(text) {
    if (!text) return "";
    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        const parts = content.split('|');
        const link = `https://kanguen.github.io/spells.html#${encodeURIComponent(parts[0].toLowerCase())}_phb`;
        return `<a href="${link}" target="_blank" class="dnd-link spell-link">${parts[2] || parts[0]}</a>`;
    });
    text = text.replace(/{@\w+\s+([^}]+)}/g, (match, content) => content.split('|')[0]);
    return text;
}

function attachAccordionEvents() {
    const headers = document.querySelectorAll(".collapsible-header");
    headers.forEach(header => {
        header.addEventListener("click", function() {
            this.parentElement.classList.toggle("active");
        });
    });
}

function toggleMenu() { document.getElementById('mobile-menu').classList.toggle('open'); }