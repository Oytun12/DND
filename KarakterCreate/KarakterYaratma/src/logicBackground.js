import { computed } from 'vue';
import { store } from './store.js';
import { formatEntry } from './utils.js';

export function useBackgroundLogic() {

    // --- RENDER YARDIMCILARI (scriptBack.js ve logicClass.js Hibriti) ---  sheet-feature-item

    // Tablo Oluşturucu
    const renderTable = (entry) => {
        if (!entry || entry.type !== 'table') return null;

        let html = '<div class="table-responsive"><table class="feature-table bg-table">';
        
        if (entry.caption) html += `<caption>${entry.caption}</caption>`;

        if (entry.colLabels && entry.colLabels.length > 0) {
            html += '<thead><tr>';
            entry.colLabels.forEach((lbl, index) => {
                let content = "";
                try { content = formatEntry(lbl); } catch(e) { content = String(lbl); }
                content = content.replace(/<p>|<\/p>/g, '');
                
                // Zar sütunlarını ortala
                let styleClass = (content.startsWith('d') && content.length < 4) ? 'text-center' : '';
                html += `<th class="${styleClass}">${content}</th>`;
            });
            html += '</tr></thead>';
        }

        html += '<tbody>';
        if (entry.rows && entry.rows.length > 0) {
            entry.rows.forEach(row => {
                html += '<tr>';
                row.forEach((cell, index) => {
                    let cellContent = "";
                    if (cell === null || cell === undefined) cellContent = "-";
                    else if (typeof cell === 'object') {
                         if(cell.roll) cellContent = cell.roll.exact ? String(cell.roll.exact) : (cell.roll.min + "-" + cell.roll.max);
                         else cellContent = formatEntry(JSON.stringify(cell));
                    } else {
                        try { cellContent = formatEntry(cell); } catch (e) { cellContent = String(cell); }
                    }
                    
                    // İlk sütun genelde zar sonucudur, kalın ve ortalı yapalım
                    let cellClass = (index === 0) ? 'text-center font-bold' : '';
                    html += `<td class="${cellClass}">${cellContent}</td>`;
                });
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    };

    // Ana İçerik Oluşturucu (Recursive)
    const renderEntry = (e) => {
        if (e === null || e === undefined) return "";
        
        // String veya Sayı
        if (typeof e === 'string' || typeof e === 'number') return `<p>${formatEntry(String(e))}</p>`;
        
        // Dizi (Recursive)
        if (Array.isArray(e)) return e.map(sub => renderEntry(sub)).join('');

        // Obje
        if (typeof e === 'object') {
            // Tablo
            if (e.type === 'table') return renderTable(e);
            
            // Liste
            if (e.type === 'list') {
                let listHtml = `<ul style="margin: 5px 0 10px 20px; list-style-type: disc;">`;
                if (e.items) listHtml += e.items.map(item => `<li>${formatEntry(item)}</li>`).join('');
                listHtml += `</ul>`;
                return listHtml;
            }

            // Alt Başlıklar / Bölümler
            if (e.entries) { 
                // Ghost Fix: İsmi yoksa div açma, direkt içeriği bas
                if (!e.name) {
                    let subEntries = Array.isArray(e.entries) ? e.entries : [e.entries];
                    return subEntries.map(sub => renderEntry(sub)).join(''); 
                }

                // İsmi varsa başlık at
                let subHtml = `<div class="bg-subsection sheet-feature-item">`;
                if (e.name) subHtml += `<h4 class="bg-sub-header">${e.name}</h4>`;
                
                let subEntries = Array.isArray(e.entries) ? e.entries : [e.entries];
                subHtml += subEntries.map(sub => renderEntry(sub)).join(''); 
                
                subHtml += `</div>`;
                return subHtml;
            }
            
            // Veri (data) blokları (Genelde gizlidir ama bazen metin içerir)
            if (e.data) return ""; 
        }

        try { return `<p>${formatEntry(String(e))}</p>`; } catch(err) { return ""; }
    };

    // --- COMPUTED VALUES ---

    // Seçilen Geçmişin Tüm Detaylı İçeriği
    const activeBackgroundContent = computed(() => {
        const bg = store.background.selected;
        if (!bg || !bg.entries) return null;

        // Ana entries dizisini işle
        return renderEntry(bg.entries);
    });

    // Geçmiş Özelliği (Feature) - Genelde 'Feature: ...' diye başlar
    // Bunu ayrı bir vurgulu kutuda göstermek istersen diye ayırıyoruz
    const activeBackgroundFeature = computed(() => {
        const bg = store.background.selected;
        if (!bg || !bg.entries) return null;

        // "Feature" veya "Özellik" ile başlayan veya data.isFeature olan girişleri bul
        const featureEntry = bg.entries.find(entry => 
            (entry.data && entry.data.isFeature === true) || 
            (entry.name && (entry.name.startsWith("Feature") || entry.name.startsWith("Özellik")))
        );

        if (!featureEntry) return null;

        return {
            name: featureEntry.name,
            html: renderEntry(featureEntry.entries)
        };
    });

    return {
        activeBackgroundContent,
        activeBackgroundFeature
    };
}