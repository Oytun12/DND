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
   SCRIPTRACE.JS - Gelişmiş Irk Yükleyici (Fix: TR Statlar)
   ============================================================ */

/* --- MENÜ VE GENEL ETKİLEŞİMLER --- */

function toggleMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('open');
}

document.addEventListener('click', (event) => {
    // 1. Menü Kontrolü
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');
    if (menu.classList.contains('open') && !menu.contains(event.target) && !menuIcon.contains(event.target)) {
        menu.classList.remove('open');
    }

    // 2. Kartları Kapatma Kontrolü (Click Outside)
    if (!event.target.closest('.race-card')) {
        closeAllRaceCards();
    }
});

/* --- DİNAMİK VERİ YÜKLEME --- */

document.addEventListener("DOMContentLoaded", () => {
    loadRaces();
});

async function loadRaces() {
    const container = document.getElementById('race-container');
    
    try {
        const response = await fetch('../../Data/races.json');
        if (!response.ok) throw new Error("Veri dosyası bulunamadı.");
        
        const data = await response.json();
        const races = data.race || data; 

        container.innerHTML = ''; 

        races.forEach(race => {
            const hasSubraces = race.subraces && Array.isArray(race.subraces) && race.subraces.length > 0;

            // 1. Alt ırkı YOKSA -> Direkt kendisini ekle
            if (!hasSubraces) { 
                 if (race.name) {
                    const mainCard = createRaceCard(race);
                    container.appendChild(mainCard);
                 }
            }

            // 2. Alt ırkı VARSA -> Birleştirip (Merge) ekle
            if (hasSubraces) {
                race.subraces.forEach(subrace => {
                    const mergedRace = mergeRaceData(race, subrace);
                    const subCard = createRaceCard(mergedRace);
                    container.appendChild(subCard);
                });
            }
        });

        attachAccordionEvents();

    } catch (error) {
        console.error("Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">Veriler yüklenirken bir hata oluştu: ${error.message}</div>`;
    }
}

/* --- VERİ BİRLEŞTİRME --- */

function mergeRaceData(parent, sub) {
    const merged = { ...parent, ...sub };
    merged.name = `${parent.name} (${sub.name})`;
    
    // Yetenek Skorlarını Dizi Olarak Birleştir
    if (parent.ability && sub.ability) {
        merged.ability = mergeAbilities(parent.ability, sub.ability);
    } else {
        merged.ability = sub.ability || parent.ability;
    }

    // Özellikleri Birleştir
    const parentEntries = parent.entries || [];
    const subEntries = sub.entries || [];
    merged.entries = [...parentEntries, ...subEntries];
    
    return merged;
}

function mergeAbilities(parentAb, subAb) {
    const p = Array.isArray(parentAb) ? parentAb : [parentAb];
    const s = Array.isArray(subAb) ? subAb : [subAb];
    return [...p, ...s];
}

/* --- KART OLUŞTURMA --- */

function createRaceCard(race) {
    const card = document.createElement('div');
    card.className = 'race-card';

    // Başlık
    const header = document.createElement('div');
    header.className = 'collapsible-header';
    header.innerHTML = `
        <h3>${race.name}</h3>
        <span class="arrow-icon">▼</span>
    `;

    // İçerik
    const content = document.createElement('div');
    content.className = 'race-content';

    const abilityText = formatAbility(race.ability);
    const speedText = formatSpeed(race.speed);
    const sizeText = formatSize(race.size);
    
    let entriesHTML = '';
    if (race.entries) {
        entriesHTML = formatEntries(race.entries);
    }

    // YENİ: Alt ırk parantezlerini silip sadece Ana Irk ismini alan kod
    // Örn: "Cüce (Dağ)" -> "Cüce"
    const baseRaceName = race.name.split(' (')[0];

    content.innerHTML = `
        <p><strong class="bold">Yetenek Skorları:</strong> ${abilityText}</p>                
        <p><strong class="bold">Boyut:</strong> ${sizeText} | <strong class="bold">Hız:</strong> ${speedText}</p>
        <hr>
        ${entriesHTML}
        
        <div class="race-image-container">
            <img src="../../img/species/${baseRaceName}.webp" alt="${race.name}" loading="lazy" onerror="this.parentElement.style.display='none';">
        </div>
    `;

    card.appendChild(header);
    card.appendChild(content);

    return card;
}

/* --- TEXT PARSER (TAG ÇEVİRİCİSİ - Mor Linkler) --- */
function parse5eTags(text) {
    if (!text) return "";
    
    // {@spell ...} Etiketlerini Bul ve Değiştir
    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        const parts = content.split('|');
        const originalName = parts[0]; 
        const source = parts.length > 1 ? parts[1] : 'phb';
        const displayText = parts.length > 2 ? parts[2] : originalName;

        const urlName = encodeURIComponent(originalName.toLowerCase());
        const urlSource = encodeURIComponent(source.toLowerCase());
        
        const link = `https://kanguen.github.io/spells.html#${urlName}_${urlSource}`;

        // Mor link stili (CSS class ile)
        return `<a href="${link}" target="_blank" class="dnd-link spell-link">${displayText}</a>`;
    });

    return text;
}

/* --- YARDIMCI FORMATLAMA FONKSİYONLARI --- */

// FIX: Türkçe Anahtarları Destekleyen Yetenek Skoru Formatlayıcı
function formatAbility(ability) {
    if (!ability) return "Özelliklerden bakınız";
    
    let abList = Array.isArray(ability) ? ability : [ability];
    let results = [];
    
    // Hem Türkçe hem İngilizce kısaltmaları destekleyen harita
    const map = {
        'str': 'Kuvvet', 'dex': 'Çeviklik', 'con': 'Dayanıklılık', 
        'int': 'Zeka', 'wis': 'Akıl', 'cha': 'Karizma',
        // JSON dosyasındaki Türkçe kısaltmalar:
        'kuv': 'Kuvvet', 'çev': 'Çeviklik', 'day': 'Dayanıklılık',
        'zek': 'Zeka', 'akı': 'Akıl', 'kar': 'Karizma'
    };

    abList.forEach(abObj => {
        // 1. Sabit Puanlar (örn: "kuv": 2)
        Object.entries(abObj).forEach(([key, val]) => {
            // key map'te var mı VE değeri bir sayı mı? (choose objesi sayı değildir)
            if (map[key] && typeof val === 'number') {
                results.push(`${map[key]} +${val}`);
            }
        });

        // 2. Seçmeli Puanlar ("choose" yapısı)
        if (abObj.choose) {
            // choose bazen array bazen obje olabilir, array'e çevirip geziyoruz
            const choices = Array.isArray(abObj.choose) ? abObj.choose : [abObj.choose];
            
            choices.forEach(choice => {
                let count = choice.count || 1;
                let amount = choice.amount || 1;
                
                if (choice.from) {
                    let options = choice.from.map(k => map[k] || k.toUpperCase()).join(" veya ");
                    results.push(`Seçeceğin (${options}) skoruna +${amount}`);
                } else {
                    results.push(`Seçeceğin ${count} farklı yeteneğe +${amount}`);
                }
            });
        }
    });

    if (results.length === 0) return "Değişken (Özelliklere bakınız)";
    return results.join(", ");
}

function formatSpeed(speed) {
    if (!speed) return "30 ft.";
    if (typeof speed === 'number') return `${speed} ft.`;
    // Uçma, yüzme hızı gibi ekstra durumlar için:
    if (typeof speed === 'object') {
        let str = `${speed.walk || 30} ft.`;
        // Diğer hız türlerini ekle (uçma, yüzme vb.)
        for (const [key, val] of Object.entries(speed)) {
            if (key !== 'walk') {
                // key'i Türkçeleştirebiliriz (örn: fly -> uçma) ama JSON zaten Türkçe geliyorsa direkt yazalım
                str += `, ${key} ${val} ft.`;
            }
        }
        return str;
    }
    return speed;
}

function formatSize(size) {
    const map = {'M': 'Orta (Medium)', 'S': 'Küçük (Small)', 'L': 'Büyük (Large)', 'T': 'Minik (Tiny)', 'G': 'Devasa (Gargantuan)'};
    const s = Array.isArray(size) ? size[0] : size;
    return map[s] || "Orta";
}

function formatEntries(entries) {
    let html = '';
    
    entries.forEach(entry => {
        if (typeof entry === 'string') {
            html += `<p>${parse5eTags(entry)}</p>`;
        } 
        else if (entry.type === 'entries' || entry.name) {
            // Başlığı yazdır (eğer varsa)
            if (entry.name) {
                html += `<p><strong class="bold" style="color:#b52b2b;">${entry.name}:</strong> `;
            } else {
                html += `<p>`;
            }

            // Alt içerikleri yazdır
            if (entry.entries) {
                entry.entries.forEach(sub => {
                    if (typeof sub === 'string') html += parse5eTags(sub) + " ";
                    else if (sub.text) html += parse5eTags(sub.text) + " ";
                    // Tablo varsa (Draconic Soy gibi)
                    else if (sub.type === 'table') {
                        html += renderTable(sub);
                    }
                });
            }
            html += `</p>`;
        }
        else if (entry.type === 'list') {
             html += `<ul>`;
             entry.items.forEach(item => {
                 const rawText = typeof item === 'string' ? item : (item.entries ? item.entries.join(' ') : item.name);
                 html += `<li>• ${parse5eTags(rawText)}</li>`;
             });
             html += `</ul>`;
        }
        // Eğer entry direkt tablo ise
        else if (entry.type === 'table') {
            html += renderTable(entry);
        }
    });
    
    return html;
}

// Basit Tablo Render Fonksiyonu (Ejderdoğan vb. için)
function renderTable(tableData) {
    if (!tableData.rows || !tableData.rows.length) return "";
    
    let tableHTML = `<div class="draconic-table" style="margin: 15px 0; border: 1px solid #444; border-radius: 6px; overflow: hidden;">`;
    
    // Başlıklar (Opsiyonel)
    if (tableData.colLabels) {
        tableHTML += `<div style="display:grid; grid-template-columns: repeat(${tableData.colLabels.length}, 1fr); background:#333; padding:10px; font-weight:bold; border-bottom:1px solid #555;">`;
        tableData.colLabels.forEach(label => {
            tableHTML += `<div>${label}</div>`;
        });
        tableHTML += `</div>`;
    }

    // Satırlar
    tableData.rows.forEach((row, index) => {
        const bg = index % 2 === 0 ? '#222' : '#2a2a2a';
        tableHTML += `<div style="display:grid; grid-template-columns: repeat(${row.length}, 1fr); background:${bg}; padding:8px; border-bottom:1px solid #333;">`;
        row.forEach(cell => {
            tableHTML += `<div>${parse5eTags(cell)}</div>`;
        });
        tableHTML += `</div>`;
    });

    tableHTML += `</div>`;
    return tableHTML;
}

/* --- ACCORDION OLAYLARI --- */

function closeAllRaceCards() {
    const allCards = document.querySelectorAll('.race-card');
    allCards.forEach(c => c.classList.remove('active'));
}

function attachAccordionEvents() {
    const headers = document.querySelectorAll(".collapsible-header");

    headers.forEach(header => {
        header.addEventListener("click", function(e) {
            // Toggle mantığı: Tıklananı aç/kapa, diğerlerine dokunma
            const currentCard = this.parentElement;
            currentCard.classList.toggle('active');
        });
    });
}