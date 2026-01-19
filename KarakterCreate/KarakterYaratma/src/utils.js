// ============================================================
//  HELPER FUNCTIONS (Parsing & Formatting)
//  Metin işleme ve etiket çözümleme araçları.
// ============================================================

export const parseTags = (text) => {
    if (!text) return "";
    return text.replace(/\{@(\w+)\s+([^}]+)\}/g, (match, tag, content) => {
        let [name, source] = content.split('|');
        let displayText = name;
        if (tag === 'spell') {
            let urlName = encodeURIComponent(name.toLowerCase());
            let urlSource = source ? `_${source.toLowerCase()}` : '_phb';
            const targetUrl = `https://kanguen.github.io/spells.html#${urlName}${urlSource}`;
            return `<a href="${targetUrl}" target="_blank" class="dnd-link spell-link" title="Büyü detayını gör">✨ ${displayText}</a>`;
        }
        return `<span class="dnd-link">${displayText}</span>`;
    });
};

export const formatEntry = (entry) => { 
    if(!entry) return ""; 
    if(typeof entry==='string') return parseTags(entry); 
    if(entry.type==='options') return ""; 
    if(entry.entries) return entry.entries.map(e=>formatEntry(e)).join("<br>"); 
    if(entry.type==='list'&&entry.items) return "<ul>"+entry.items.map(i=>"<li>"+formatEntry(i)+"</li>").join("")+"</ul>"; 
    if(entry.type==='table') return "[Tablo Görüntülenemiyor]"; 
    return entry.name||""; 
};