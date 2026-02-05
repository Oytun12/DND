/* ============================================================
   SCRIPTKURALLAR.JS - Hızlı Referans Ayrıştırıcı
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    loadRules();
    setupScrollBtn();
    setupMobileSidebar(); // YENİ FONKSİYON
});

async function loadRules() {
    const container = document.getElementById('rules-container');
    const tocNav = document.getElementById('toc-nav');

    try {
        const response = await fetch('../../../Data/quickreference.json');
        if (!response.ok) throw new Error("Veri dosyası bulunamadı.");
        
        const json = await response.json();
        
        container.innerHTML = '';
        tocNav.innerHTML = '';

        // JSON yapısında "data" ana dizisi içeriği tutar.
        // "reference" dizisi ise başlıkları tutar ama biz "data"yı sırayla işleyeceğiz.
        const dataList = json.data || [];

        dataList.forEach((section, index) => {
            // Ana Bölümler (Karakter Yaratma, Ekipman vb.)
            if (section.type === 'entries') {
                renderRecursive(section, container, tocNav, 1);
            }
        });

    } catch (error) {
        console.error("Hata:", error);
        container.innerHTML = `<div style="text-align:center; color:#b52b2b;">
            Kurallar yüklenirken hata oluştu.<br><small>${error.message}</small>
        </div>`;
    }
}

/* --- RECURSIVE RENDER FONKSİYONU --- */
// Bu fonksiyon iç içe geçmiş her türlü yapıyı (section, entry, list, table) işler
function renderRecursive(entry, parentElement, tocElement, level) {
    
    // 1. DİZİ KONTROLÜ (Array of entries)
    if (entry.entries && Array.isArray(entry.entries)) {
        // Eğer bu bir 'section' ise başlık at ve container oluştur
        let wrapper = parentElement;
        
        if (entry.name) {
            const id = slugify(entry.name);
            
            // Başlık Elementi (H2, H3, H4...)
            const headerTag = `h${Math.min(level + 1, 6)}`;
            const header = document.createElement(headerTag);
            header.innerText = entry.name;
            header.id = id;
            parentElement.appendChild(header);

            // ToC'a Ekle (Sadece Seviye 1 ve 2 başlıkları)
            if (tocElement && level <= 3) {
                const link = document.createElement('a');
                link.href = `#${id}`;
                link.innerText = entry.name;
                if (level > 1) link.classList.add('toc-sub');
                tocElement.appendChild(link);
            }
        }

        // Özel kutu (inset) ise stil ver
        if (entry.type === 'inset') {
            const insetDiv = document.createElement('div');
            insetDiv.className = 'rule-inset';
            parentElement.appendChild(insetDiv);
            wrapper = insetDiv; // Çocukları bunun içine ekle
        }

        // Çocukları işle
        entry.entries.forEach(subEntry => {
            renderRecursive(subEntry, wrapper, tocElement, level + 1);
        });
    }
    
    // 2. BASİT METİN (String)
    else if (typeof entry === 'string') {
        const p = document.createElement('p');
        p.innerHTML = formatText(entry);
        parentElement.appendChild(p);
    }

    // 3. TABLO (Table)
    else if (entry.type === 'table') {
        renderTable(entry, parentElement);
    }

    // 4. LİSTE (List)
    else if (entry.type === 'list') {
        const ul = document.createElement('ul');
        ul.className = 'rule-list';
        entry.items.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = formatText(item);
            ul.appendChild(li);
        });
        parentElement.appendChild(ul);
    }
}

/* --- TABLO OLUŞTURUCU --- */
function renderTable(data, parent) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    // Başlık (Caption)
    if (data.caption) {
        const caption = document.createElement('h4');
        caption.innerText = data.caption;
        caption.style.textAlign = "center";
        caption.style.color = "#aaa";
        parent.appendChild(caption);
    }

    const table = document.createElement('table');
    table.className = 'rule-table';

    // Thead
    if (data.colLabels) {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        data.colLabels.forEach(label => {
            const th = document.createElement('th');
            th.innerHTML = formatText(label);
            tr.appendChild(th);
        });
        thead.appendChild(tr);
        table.appendChild(thead);
    }

    // Tbody
    const tbody = document.createElement('tbody');
    data.rows.forEach(row => {
        const tr = document.createElement('tr');
        // Satır bazen obje ({type: row, row: [...]}) bazen direkt array olabilir
        const cellData = Array.isArray(row) ? row : (row.row || []);
        
        cellData.forEach(cell => {
            const td = document.createElement('td');
            td.innerHTML = formatText(cell);
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    wrapper.appendChild(table);
    parent.appendChild(wrapper);
}

/* --- METİN FORMATLAYICI (TAG PARSER) --- */
function formatText(text) {
    if (!text || typeof text !== 'string') return text;

    // {@b Bold} -> <b>Bold</b>
    text = text.replace(/{@b\s+([^}]+)}/g, '<strong>$1</strong>');
    
    // {@i Italic} -> <i>Italic</i>
    text = text.replace(/{@i\s+([^}]+)}/g, '<em>$1</em>');

    // {@spell ...} Linkleri (Kanguen Stili)
    text = text.replace(/{@spell\s+([^}]+)}/gi, (match, content) => {
        const parts = content.split('|');
        const originalName = parts[0]; 
        const source = parts.length > 1 ? parts[1] : 'phb';
        const displayText = parts.length > 2 ? parts[2] : originalName;
        const urlName = encodeURIComponent(originalName.toLowerCase());
        const urlSource = encodeURIComponent(source.toLowerCase());
        const link = `https://kanguen.github.io/spells.html#${urlName}_${urlSource}`;
        return `<a href="${link}" target="_blank" class="dnd-link spell-link">${displayText}</a>`;
    });

    // {@condition ...} Linkleri (Durumlar Sayfasına)
    // Örnek: {@condition Blinded} -> Durumlar sayfasına link
    text = text.replace(/{@condition\s+([^}]+)}/gi, (match, content) => {
        // Türkçe karakterleri ve boşlukları halletmek gerekebilir ama şimdilik basit yapalım
        // Durumlar sayfamız: ../Durumlar/durumlar.html
        return `<a href="../Durumlar/durumlar.html" class="dnd-link" style="color:#e74c3c;">${content}</a>`;
    });

    // {@skill ...}, {@class ...} gibi diğer etiketleri temizle
    text = text.replace(/{@\w+\s+([^}|]+)(?:\|[^}]+)?}/g, '$1');

    return text;
}

// Yardımcı: ID oluşturucu (Türkçe karakter uyumlu)
function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Boşlukları tire yap
        .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
        .replace(/[^\w\-]+/g, '')       // Alfanümerik olmayanları at
        .replace(/\-\-+/g, '-')         // Çift tireleri tek yap
        .replace(/^-+/, '')             // Baştaki tireyi at
        .replace(/-+$/, '');            // Sondaki tireyi at
}

/* --- ARAYÜZ ETKİLEŞİMLERİ --- */
function toggleMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}

function setupScrollBtn() {
    const btn = document.getElementById('back-to-top');
    window.onscroll = function() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
            btn.style.display = "block";
        } else {
            btn.style.display = "none";
        }
    };
    btn.onclick = function() {
        window.scrollTo({top: 0, behavior: 'smooth'});
    };
}

/* --- MOBİL SIDEBAR YÖNETİMİ (YENİ) --- */
function setupMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const toggleBtn = document.getElementById('toc-toggle-btn');
    
    // 1. Overlay (Karartma) Katmanı Oluştur
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    document.body.appendChild(overlay);

    // 2. Kapatma Butonu (X) Oluştur ve Sidebar'a Ekle
    const closeBtn = document.createElement('button');
    closeBtn.className = 'sidebar-close-btn';
    closeBtn.innerHTML = '&times;'; // Çarpı işareti
    // Sidebar header'ının içine veya direkt sidebar'ın başına ekle
    const sidebarHeader = document.querySelector('.sidebar-header');
    if(sidebarHeader) sidebarHeader.appendChild(closeBtn);
    else sidebar.prepend(closeBtn);

    // --- FONKSİYONLAR ---
    
    function openSidebar() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Arka plan kaymasını engelle
    }

    function closeSidebar() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Kaydırmayı geri aç
    }

    // --- EVENT LISTENERS ---

    // Açma Butonu
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Tıklamanın body'ye gitmesini engelle
        openSidebar();
    });

    // Kapatma Butonu (X)
    closeBtn.addEventListener('click', closeSidebar);

    // Dışarı Tıklama (Overlay'e tıklama)
    overlay.addEventListener('click', closeSidebar);

    // İçindekiler Linkine Tıklayınca Menüyü Kapat (Kullanıcı bir başlığa gitmek istediğinde)
    const tocNav = document.getElementById('toc-nav');
    tocNav.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            closeSidebar();
        }
    });
}