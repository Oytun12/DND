// src/utils.js

// ============================================================
//  HELPER FUNCTIONS (Parsing & Formatting)
//  Metin işleme ve etiket çözümleme araçları.
// ============================================================

export const parseTags = (text) => {
    if (!text) return "";
    // D&D Beyond / 5eTools etiketlerini ({@spell ...}) linke çevirir
    return text.replace(/\{@(\w+)\s+([^}]+)\}/g, (match, tag, content) => {
        let [name, source] = content.split('|');
        let displayText = name;
        
        // Büyü Etiketleri
        if (tag === 'spell') {
            let urlName = encodeURIComponent(name.toLowerCase());
            let urlSource = source ? `_${source.toLowerCase()}` : '_phb';
            const targetUrl = `https://kanguen.github.io/spells.html#${urlName}${urlSource}`;
            return `<a href="${targetUrl}" target="_blank" class="dnd-link spell-link" title="Büyü detayını gör">✨ ${displayText}</a>`;
        }
        
        // Condition (Durum) Etiketleri
        if (tag === 'condition') {
             return `<span style="color:#b52b2b; font-weight:bold; cursor:help;" title="Bu bir durum etkisidir">${displayText}</span>`;
        }
        
        // Diğer etiketler (item, creature vs.)
        return `<span class="dnd-link">${displayText}</span>`;
    });
};

/**
 * entry: İşlenecek veri objesi veya string
 * level: İç içe girme derinliği (0: Ana seviye, 1+: Alt seviyeler)
 */
export function formatEntry(entry, level = 0) { 
    // 1. Düz metin kontrolü
    if (!entry) return ""; 
    if (typeof entry === 'string') return parseTags(entry); 
    
    // 2. Basit tiplerin kontrolü
    if (typeof entry !== 'object') return entry;

    // --- ÖZEL TİP: OPTIONS (SEÇENEKLER) ---
    // Bu veri tipi dropdown menüler içindir, metin içinde GİZLENMELİDİR.
    if (entry.type === 'options') return "";

    // --- ÖZEL TİP: ABILITY DC (KURTULMA ZORLUĞU) ---
    if (entry.type === 'abilityDc') {
        const attr = entry.attributes ? entry.attributes[0].toUpperCase() : 'N/A';
        return `<div style="background: rgba(0,0,0,0.05); padding: 8px; border-radius: 4px; margin: 5px 0; text-align: center; font-weight: bold; font-size: 0.9em; color: #ccc; border: 1px dashed #ccc;">
                    ${entry.name || 'Kurtulma Zorluğu'} (DC) = 8 + Uzmanlık Bonusu + ${attr} Bonusu
                </div>`;
    }

    let html = '';

    // --- ÖZEL TİP: LİSTE (Maddeli Liste) ---
    if (entry.type === 'list' && entry.items) {
        html += '<ul style="padding-left: 20px; list-style-type: disc; margin: 5px 0 10px 15px; color:#ccc;">';
        entry.items.forEach(item => {
            html += `<li style="margin-bottom: 4px;">${formatEntry(item, level + 1)}</li>`;
        });
        html += '</ul>';
        return html;
    }

    // --- ÖZEL TİP: TABLO ---
    if (entry.type === 'table') return "<div style='color:#666; font-style:italic; font-size:0.8em;'>[Tablo Verisi - Lütfen kitaba bakınız]</div>"; 

    // --- BAŞLIK MANTIĞI (Name varsa) ---
    let namePrefix = "";
    
    if (entry.name) {
        // [DÜZELTME] Level 0 (Kırmızı Başlık) tamamen kaldırıldı.
        // Artık sadece Level 1 ve üzeri (İç içerik) için turuncu inline başlık ekleniyor.
        // Level 0 başlıklarını HTML arayüzü (h4 veya strong tagleri) halledecek.
        
        if (level > 0) {
            // "Ayı.", "Kurt." gibi iç seçenekler. #b52b2b
            namePrefix = `<strong style="color: rgba(181, 43, 43, 0.75); font-weight: 800;">${entry.name}.</strong> `;
        }
    }

    // --- İÇERİK DÖNGÜSÜ ---
    if (entry.entries) {
        entry.entries.forEach((subEntry, index) => {
            
            // Inline Header ekleme (Sadece ilk paragrafın başına)
            if (namePrefix && index === 0) {
                if (typeof subEntry === 'string') {
                    html += `<p style="margin-bottom: 8px;">${namePrefix}${parseTags(subEntry)}</p>`;
                } else {
                    html += `<div style="margin-bottom: 8px;">${namePrefix}</div>`;
                    html += formatEntry(subEntry, level + 1);
                }
            } 
            else {
                // Standart paragraf
                if (typeof subEntry === 'string') {
                    html += `<p style="margin-bottom: 8px;">${parseTags(subEntry)}</p>`;
                } else {
                    html += formatEntry(subEntry, level + 1);
                }
            }
        });
    }

    return html;
}