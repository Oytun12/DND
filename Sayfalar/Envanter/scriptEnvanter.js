/* ============================================================
   SCRIPTENVANTER.JS - Akıllı Birleştirici ve Filtreleyici
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
        // İki dosyayı da paralel olarak çekiyoruz
        const [basicRes, magicRes] = await Promise.allSettled([
            fetch('../../Data/basicitems.json'),
            fetch('../../Data/items.json')
        ]);

        let combinedItems = [];

        // 1. Basic Dosyasını İşle
        if (basicRes.status === 'fulfilled') {
            const data = await basicRes.value.json();
            // Dosya yapısındaki olası tüm dizileri tara ve birleştir
            const list = data.basicitem || data.basicitems || data.item || data.items || [];
            if(Array.isArray(list)) combinedItems = combinedItems.concat(list);
        }

        // 2. Magic/Items Dosyasını İşle
        if (magicRes.status === 'fulfilled') {
            const data = await magicRes.value.json();
            const list = data.item || data.items || data.basicitem || [];
            if(Array.isArray(list)) combinedItems = combinedItems.concat(list);
        }

        // 3. Verileri Temizle (Tekrarları ve bozukları kaldır)
        allItems = cleanData(combinedItems);

        console.log(`Toplam ${allItems.length} eşya yüklendi.`);

        // İlk sekmeyi render et
        renderTab('basic');

    } catch (error) {
        console.error("Kritik Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">Veriler yüklenirken hata oluştu.<br><small>${error.message}</small></div>`;
    }
}

// Veri Temizleme ve Düzenleme
function cleanData(items) {
    const uniqueItems = new Map();

    items.forEach(item => {
        // İsmi olmayan veya "Hatalı Girdi" olanları atla
        if (!item.name || item.name === "Hatalı Girdi") return;

        // Kopya kontrolü (İsim bazlı)
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

    // Buton stillerini güncelle
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
        // TEMEL EŞYALAR: Rarity (Nadirlik) özelliği olmayanlar veya "none" olanlar
        filteredItems = allItems.filter(item => {
            const r = (item.rarity || "").toLowerCase();
            return !r || r === "none" || r === "unknown";
        });
    } else {
        // SİHİRLİ EŞYALAR: Rarity özelliği olanlar (Common, Rare vb.)
        filteredItems = allItems.filter(item => {
            const r = (item.rarity || "").toLowerCase();
            return r && r !== "none" && r !== "unknown";
        });
    }

    if (filteredItems.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:30px; color:#aaa;">
            Bu kategoride görüntülenecek eşya bulunamadı.<br>
            <small>(items.json dosyasında veri olduğundan emin olun)</small>
        </div>`;
        return;
    }

    // Kategorilere Ayır
    const armorList = filteredItems.filter(i => isArmor(i));
    const weaponList = filteredItems.filter(i => isWeapon(i));
    // Diğerleri (Ne zırh ne silah olanlar)
    const gearList = filteredItems.filter(i => !isArmor(i) && !isWeapon(i) && !i._isSubItem);

    // Listeleri Oluştur
    const prefix = type === 'magic' ? 'Sihirli ' : '';
    
    createCategorySection(`${prefix}Zırhlar ve Kalkanlar`, armorList, container, renderArmorRow);
    createCategorySection(`${prefix}Silahlar`, weaponList, container, renderWeaponRow);
    
    const gearTitle = type === 'magic' ? "Yüzükler, Asalar ve Diğerleri" : "Macera Ekipmanları";
    createCategorySection(gearTitle, gearList, container, renderGearRow);

    // Accordion olaylarını yeniden bağla
    attachAccordionEvents();
}

/* --- FİLTRELEME YARDIMCILARI --- */
function isArmor(item) {
    const t = item.type;
    return t === 'LA' || t === 'MA' || t === 'HA' || t === 'S'; // Hafif, Orta, Ağır, Kalkan
}

function isWeapon(item) {
    const t = item.type;
    return t === 'M' || t === 'R' || t === 'A'; // Yakın, Menzilli, Cephane
}

/* --- HTML OLUŞTURUCULAR --- */
function createCategorySection(title, itemList, parent, rowRenderer) {
    if (itemList.length === 0) return;

    const card = document.createElement('div');
    card.className = 'category-card';

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
                            <th class="col-name">Eşya Adı</th>
                            <th class="col-cost">Bedel / Nadirlik</th>
                            <th class="col-weight">Ağırlık</th>
                            <th class="col-props">Özellikler</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    `;

    const tbody = card.querySelector('tbody');
    
    // İsme göre sırala
    itemList.sort((a, b) => a.name.localeCompare(b.name));

    itemList.forEach(item => {
        const row = rowRenderer(item);
        tbody.appendChild(row);
        
        // Detay Satırı
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
            row.addEventListener('click', () => {
                detailRow.classList.toggle('active');
            });
        }
    });

    parent.appendChild(card);
}

/* --- SATIR FORMATLAMA --- */
function renderArmorRow(item) {
    const tr = document.createElement('tr');
    let acText = item.ac ? `${item.ac} AC` : "";
    if (item.bonusAc) acText += ` (+${item.bonusAc})`;
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
    // Nadirlik varsa onu yaz
    if (item.rarity && item.rarity !== 'none' && item.rarity !== 'unknown') {
        return rarityMap[item.rarity.toLowerCase()] || item.rarity;
    }
    // Yoksa bedeli yaz
    return item.value || "-";
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
        if (typeof entry === 'string') {
            html += `<p>${parseTags(entry)}</p>`;
        } else if (entry.type === 'list') {
            html += '<ul>' + entry.items.map(i => `<li>${parseTags(i)}</li>`).join('') + '</ul>';
        } else if (entry.entries) {
            if(entry.name) html += `<strong>${entry.name}: </strong>`;
            html += renderEntries(entry.entries);
        }
    });
    return html;
}

function parseTags(text) {
    if (!text) return "";
    // Spell Linkleri
    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        const parts = content.split('|');
        const displayText = parts[2] || parts[0];
        const link = `https://kanguen.github.io/spells.html#${encodeURIComponent(parts[0].toLowerCase())}_phb`;
        return `<a href="${link}" target="_blank" class="dnd-link spell-link">${displayText}</a>`;
    });
    // Diğer etiketleri temizle
    text = text.replace(/{@\w+\s+([^}]+)}/g, (match, content) => content.split('|')[0]);
    return text;
}

function attachAccordionEvents() {
    const headers = document.querySelectorAll(".collapsible-header");
    headers.forEach(header => {
        header.addEventListener("click", function() {
            const card = this.parentElement;
            card.classList.toggle("active");
        });
    });
}

// Menü ve Dış Tıklama
function toggleMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}
document.addEventListener('click', (event) => {
    if (!event.target.closest('.category-card')) {
        // Dışarı tıklayınca kapatma istenirse buraya eklenebilir
    }
});