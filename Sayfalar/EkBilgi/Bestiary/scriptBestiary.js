/* ============================================================
   SCRIPTBESTIARY.JS - Yaratık Rehberi (Akıllı Veri ve Görsel Yönetimi)
   ============================================================ */

let ALL_MONSTERS = [];
let FLUFF_DICT = {}; 
let ACTIVE_FILTERS = {
    search: "", cr: "all", type: "all", size: "all", source: "all", sort: "name-asc" 
};

const ACTIVE_SOURCES = [
    "bestiary-aatm.json", "bestiary-ai.json", "bestiary-aitfr-isf.json", "bestiary-aitfr-thp.json",
    "bestiary-aitfr-dn.json", "bestiary-aitfr-fcd.json", "bestiary-awm.json", "bestiary-bam.json",
    "bestiary-bgdia.json", "bestiary-bgg.json", "bestiary-bmt.json", "bestiary-cm.json",
    "bestiary-coa.json", "bestiary-cos.json", "bestiary-crcotn.json", "bestiary-dc.json",
    "bestiary-dip.json", "bestiary-ditlcot.json", "bestiary-dmg.json", "bestiary-dod.json",
    "bestiary-dosi.json", "bestiary-dsotdq.json", "bestiary-egw.json", "bestiary-erlw.json",
    "bestiary-ftd.json", "bestiary-ggr.json", "bestiary-gos.json", "bestiary-hat-tg.json",
    "bestiary-hftt.json", "bestiary-hotdq.json", "bestiary-idrotf.json", "bestiary-imr.json",
    "bestiary-jttrc.json", "bestiary-kftgv.json", "bestiary-kkw.json", "bestiary-llk.json",
    "bestiary-lmop.json", "bestiary-lox.json", "bestiary-lr.json", "bestiary-lrdt.json",
    "bestiary-mabjov.json", "bestiary-mcv1sc.json", "bestiary-mcv2dc.json", "bestiary-mcv3mc.json",
    "bestiary-mcv4ec.json", "bestiary-mismv1.json", "bestiary-mff.json", "bestiary-mgelft.json",
    "bestiary-mm.json", "bestiary-mpmm.json", "bestiary-mpp.json", "bestiary-mot.json",
    "bestiary-mtf.json", "bestiary-oota.json", "bestiary-oow.json", "bestiary-pabtso.json",
    "bestiary-ps-a.json", "bestiary-ps-d.json", "bestiary-ps-i.json", "bestiary-ps-k.json",
    "bestiary-ps-x.json", "bestiary-ps-z.json", "bestiary-pota.json", "bestiary-qftis.json",
    "bestiary-rmbre.json", "bestiary-rot.json", "bestiary-sads.json", "bestiary-scc.json",
    "bestiary-sdw.json", "bestiary-skt.json", "bestiary-tce.json", "bestiary-ttp.json",
    "bestiary-tftyp.json", "bestiary-toa.json", "bestiary-tofw.json", "bestiary-vd.json",
    "bestiary-veor.json", "bestiary-vgm.json", "bestiary-vrgr.json", "bestiary-wbtw.json",
    "bestiary-wdh.json", "bestiary-wdmm.json"
];

const SOURCE_NAMES = {
    "AI": "Acquisitions Inc.", "BGDIA": "Descent into Avernus", "CoS": "Curse of Strahd",
    "DMG": "Dungeon Master's Guide", "MM": "Monster Manual", "MPMM": "Monsters of the Multiverse",
    "MTF": "Mordenkainen's Tome of Foes", "PHB": "Player's Handbook", "TCE": "Tasha's Cauldron",
    "VGM": "Volo's Guide to Monsters", "XGE": "Xanathar's Guide"
};

function toggleMenu(event) {
    if(event) event.stopPropagation();
    const menu = document.getElementById('mobile-menu');
    if(menu) menu.classList.toggle('open');
}

document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');
    if (menu && menu.classList.contains('open')) {
        if (!menu.contains(event.target) && !menuIcon.contains(event.target)) menu.classList.remove('open');
    }
    const isClickInsideCard = event.target.closest('.monster-card');
    if (!isClickInsideCard) closeAllMonsters();
});

function closeAllMonsters() {
    document.querySelectorAll('.monster-content').forEach(content => content.style.display = 'none');
    document.querySelectorAll('.monster-header').forEach(header => {
        header.style.backgroundColor = ''; 
        const arrow = header.querySelector('.arrow-icon');
        if(arrow) arrow.style.transform = 'rotate(0deg)';
    });
}

document.addEventListener("DOMContentLoaded", () => {
    loadAllBestiaries();
    setupFilters();
    setupScrollToTop();
});

async function loadAllBestiaries() {
    const container = document.getElementById('monster-list');
    ALL_MONSTERS = [];
    FLUFF_DICT = {};

    const fetchPromises = ACTIVE_SOURCES.map(async (filename) => {
        try {
            const res = await fetch(`../../../Data/bestiary/${filename}`);
            if (res.ok) {
                const data = await res.json();
                if (data.monster) ALL_MONSTERS.push(...data.monster);
            }
        } catch (e) { console.error(`${filename} yüklenemedi:`, e); }

        try {
            const fluffRes = await fetch(`../../../Data/bestiary/fluff-${filename}`);
            if (fluffRes.ok) {
                const fluffData = await fluffRes.json();
                if (fluffData.monsterFluff) {
                    fluffData.monsterFluff.forEach(f => {
                        FLUFF_DICT[`${f.name}_${f.source}`] = f;
                    });
                }
            }
        } catch (e) { }
    });

    await Promise.all(fetchPromises);

    if (ALL_MONSTERS.length === 0) {
        container.innerHTML = `<div class="no-results" style="color:#b52b2b;">Yaratık verileri bulunamadı.</div>`;
        return;
    }

    resolveCopies();
    populateSourceFilter();
    sortAndRender();
}

function getBaseMonster(monster) {
    if (!monster._copy) return monster;
    let base = ALL_MONSTERS.find(x => x.name === monster._copy.name && x.source === monster._copy.source);
    if (!base) return monster;
    if (base._copy) base = getBaseMonster(base); 
    return base;
}

function resolveCopies() {
    ALL_MONSTERS.forEach(m => {
        if (m._copy) {
            const base = getBaseMonster(m);
            if (base && base !== m) {
                Object.keys(base).forEach(key => {
                    if (m[key] === undefined && key !== '_copy') {
                        m[key] = JSON.parse(JSON.stringify(base[key]));
                    }
                });
            }
        }
    });
}

function populateSourceFilter() {
    const sourceSelect = document.getElementById('source-select');
    if (!sourceSelect) return;
    sourceSelect.innerHTML = '<option value="all">Tüm Kaynaklar</option>';

    const uniqueSources = [...new Set(ALL_MONSTERS.map(m => m.source))].sort();
    uniqueSources.forEach(src => {
        if(!src) return;
        const option = document.createElement('option');
        option.value = src;
        option.textContent = SOURCE_NAMES[src] || src; 
        sourceSelect.appendChild(option);
    });
}

function setupFilters() {
    ['search-input', 'cr-select', 'type-select', 'size-select', 'source-select', 'sort-select'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener(id === 'search-input' ? 'input' : 'change', (e) => {
                let filterKey = id.split('-')[0];
                ACTIVE_FILTERS[filterKey] = e.target.value.toLowerCase();
                if(filterKey !== 'search') ACTIVE_FILTERS[filterKey] = e.target.value; 
                sortAndRender();
            });
        }
    });
}

function sortAndRender() {
    let filtered = ALL_MONSTERS.filter(m => {
        if (ACTIVE_FILTERS.search && !m.name.toLowerCase().includes(ACTIVE_FILTERS.search)) return false;
        
        if (ACTIVE_FILTERS.cr !== "all") {
            let crVal = typeof m.cr === 'object' ? m.cr.cr : m.cr;
            if(!crVal) crVal = "0"; 
            if (ACTIVE_FILTERS.cr === "high") {
                if (crVal.includes("/") || parseInt(crVal) < 6) return false;
            } else {
                if (crVal !== ACTIVE_FILTERS.cr) return false;
            }
        }

        if (ACTIVE_FILTERS.type !== "all") {
            let mType = typeof m.type === 'object' ? m.type.type : m.type;
            if (mType !== ACTIVE_FILTERS.type) return false;
        }

        if (ACTIVE_FILTERS.size !== "all" && m.size && m.size[0] !== ACTIVE_FILTERS.size) return false;
        if (ACTIVE_FILTERS.source !== "all" && m.source !== ACTIVE_FILTERS.source) return false;

        return true;
    });

    filtered.sort((a, b) => {
        let crA = parseCR(a.cr); let crB = parseCR(b.cr);
        switch (ACTIVE_FILTERS.sort) {
            case "name-desc": return b.name.localeCompare(a.name);
            case "cr-asc": return crA - crB || a.name.localeCompare(b.name);
            case "cr-desc": return crB - crA || a.name.localeCompare(b.name);
            case "source": return (a.source || "").localeCompare(b.source || "") || a.name.localeCompare(b.name);
            case "name-asc": default: return a.name.localeCompare(b.name);
        }
    });

    renderMonsters(filtered);
}

function renderMonsters(monsters) {
    const container = document.getElementById('monster-list');
    container.innerHTML = '';

    if (monsters.length === 0) {
        container.innerHTML = `<div class="no-results">Aradığınız kriterlere uygun yaratık bulunamadı.</div>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    monsters.forEach(monster => fragment.appendChild(createMonsterCard(monster)));
    container.appendChild(fragment);
}

function createMonsterCard(m) {
    const card = document.createElement('div');
    card.className = `monster-card`;

    let mType = typeof m.type === 'object' ? m.type.type : m.type;
    let mSize = m.size ? getFullSizeName(m.size[0]) : "Bilinmiyor";
    let crVal = typeof m.cr === 'object' ? m.cr.cr : m.cr || "0";
    let sourceBook = m.source || "Bilinmeyen Kaynak";

    const header = document.createElement('div');
    header.className = `monster-header type-${mType}`;
    
    header.innerHTML = `
        <div class="monster-name-group">
            <span class="monster-name">${m.name}</span>
            <span class="monster-meta-short">${mSize} ${mType} | CR ${crVal} | ${sourceBook}</span>
        </div>
        <span class="arrow-icon" style="color:#aaa;">▼</span>
    `;

    const content = document.createElement('div');
    content.className = 'monster-content';

    let hpData = formatHP(m.hp);
    let acData = formatAC(m.ac);
    let speedData = formatSpeed(m.speed);

    let imageUrl = "";
    let fluffData = FLUFF_DICT[`${m.name}_${m.source}`];
    
    if (!fluffData && m._copy) {
        fluffData = FLUFF_DICT[`${m._copy.name}_${m._copy.source}`];
    }

    if (fluffData && fluffData.images && fluffData.images.length > 0) {
        let imgHref = fluffData.images[0].href;
        if (typeof imgHref === 'object' && imgHref.path) {
            imageUrl = `../../../img/${imgHref.path}`; 
        } else if (typeof imgHref === 'string') {
            imageUrl = `../../../img/${imgHref}`;
        }
    }

    const tokenSafeName = m.name.replace(/"/g, ''); 
    const tokenUrl = `../../../img/bestiary/tokens/${m.source}/${tokenSafeName}.webp`;

    let html = `
        <div class="monster-tabs">
            <button class="monster-tab-btn active" data-target="tab-stats-${m.name.replace(/\s+/g, '')}">İstatistikler</button>
            <button class="monster-tab-btn" data-target="tab-fluff-${m.name.replace(/\s+/g, '')}">Detaylar & Hikaye</button>
        </div>

        <div class="monster-tab active" id="tab-stats-${m.name.replace(/\s+/g, '')}">
            <div class="monster-token-container">
                <img data-src="${tokenUrl}" 
                     class="monster-token-img lazy-monster-img" 
                     onerror="this.parentElement.style.display='none';">
            </div>

            <div class="monster-details-grid">
                <div class="detail-item"><strong>Zırh Sınıfı (AC)</strong><span>${acData}</span></div>
                <div class="detail-item"><strong>Can Puanı (HP)</strong><span>${hpData}</span></div>
                <div class="detail-item"><strong>Hız</strong><span>${speedData}</span></div>
            </div>
            
            <div class="ability-scores-grid">
                <div class="ability-score-item"><strong>STR</strong><span>${m.str} (${getMod(m.str)})</span></div>
                <div class="ability-score-item"><strong>DEX</strong><span>${m.dex} (${getMod(m.dex)})</span></div>
                <div class="ability-score-item"><strong>CON</strong><span>${m.con} (${getMod(m.con)})</span></div>
                <div class="ability-score-item"><strong>INT</strong><span>${m.int} (${getMod(m.int)})</span></div>
                <div class="ability-score-item"><strong>WIS</strong><span>${m.wis} (${getMod(m.wis)})</span></div>
                <div class="ability-score-item"><strong>CHA</strong><span>${m.cha} (${getMod(m.cha)})</span></div>
            </div>
    `;

    // EKSİKLER GİDERİLDİ: Savaş sırasında DM'in çok ihtiyaç duyduğu hayati istatistikler eklendi
    let infoLines = [];
    if (m.save) {
        let saves = Object.entries(m.save).map(([stat, val]) => `${stat.toUpperCase()} ${val}`).join(", ");
        infoLines.push(`<strong>Kurtarmalar:</strong> <span style="color:#eee;">${saves}</span>`);
    }
    if (m.skill) {
        let skills = Object.entries(m.skill).map(([sk, val]) => `${sk} ${val}`).join(", ");
        infoLines.push(`<strong>Yetenekler:</strong> <span style="color:#eee;">${skills}</span>`);
    }
    if (m.vulnerable) infoLines.push(`<strong>Zafiyetler:</strong> <span style="color:#eee;">${parseResist(m.vulnerable)}</span>`);
    if (m.resist) infoLines.push(`<strong>Dirençler:</strong> <span style="color:#eee;">${parseResist(m.resist)}</span>`);
    if (m.immune) infoLines.push(`<strong>Bağışıklıklar:</strong> <span style="color:#eee;">${parseResist(m.immune)}</span>`);
    if (m.conditionImmune) infoLines.push(`<strong>Durum Bağışıklıkları:</strong> <span style="color:#eee;">${parseResist(m.conditionImmune)}</span>`);
    
    let senses = m.senses ? m.senses.join(", ") + ", " : "";
    let passive = m.passive ? `Pasif Algı ${m.passive}` : "";
    if (senses || passive) infoLines.push(`<strong>Duyular:</strong> <span style="color:#eee;">${senses}${passive}</span>`);
    
    if (m.languages) infoLines.push(`<strong>Diller:</strong> <span style="color:#eee;">${m.languages.join(", ")}</span>`);
    else infoLines.push(`<strong>Diller:</strong> <span style="color:#eee;">—</span>`);

    if (m.cr) {
        let xp = typeof m.cr === 'object' && m.cr.xp ? ` (${m.cr.xp} XP)` : "";
        infoLines.push(`<strong>Tehlike (CR):</strong> <span style="color:#eee;">${crVal}${xp}</span>`);
    }

    if(infoLines.length > 0) {
        html += `<div class="monster-info-line" style="line-height:1.8;">${infoLines.join(" &nbsp;|&nbsp; ")}</div>`;
    }

    // YENİ DÜZEN: renderText artık obje veya array gelse de hata vermeden HTML üretecek
    if (m.spellcasting) {
        html += `<div class="monster-section"><h4>Büyü Yapma (Spellcasting)</h4>`;
        m.spellcasting.forEach(sc => { html += `<p>${renderText(sc)}</p>`; });
        html += `</div>`;
    }

    if (m.trait) {
        html += `<div class="monster-section"><h4>Özellikler</h4>`;
        m.trait.forEach(t => { html += `<p>${renderText(t)}</p>`; });
        html += `</div>`;
    }

    if (m.action) {
        html += `<div class="monster-section"><h4>Eylemler</h4>`;
        m.action.forEach(a => { html += `<p>${renderText(a)}</p>`; });
        html += `</div>`;
    }

    if (m.reaction) {
        html += `<div class="monster-section"><h4>Tepkiler (Reactions)</h4>`;
        m.reaction.forEach(r => { html += `<p>${renderText(r)}</p>`; });
        html += `</div>`;
    }

    if (m.legendary) {
        html += `<div class="monster-section"><h4>Efsanevi Eylemler</h4>`;
        if (m.legendaryHeader) html += `<p>${renderText(m.legendaryHeader)}</p>`;
        else html += `<p>Yaratık, aşağıdaki seçeneklerden seçerek 3 efsanevi eylem yapabilir. Sadece bir efsanevi eylem seçeneği tek bir seferde ve sadece başka bir yaratığın turunun sonunda kullanılabilir. Yaratık harcadığı efsanevi eylemleri sırasının başında geri kazanır.</p>`;
        
        m.legendary.forEach(l => { html += `<p>${renderText(l)}</p>`; });
        html += `</div>`;
    }

    if (m.mythic) {
        html += `<div class="monster-section"><h4>Mistik Eylemler (Mythic Actions)</h4>`;
        if (m.mythicHeader) html += `<p>${renderText(m.mythicHeader)}</p>`;
        m.mythic.forEach(my => { html += `<p>${renderText(my)}</p>`; });
        html += `</div>`;
    }
    
    html += `</div> `;

    // TAB 2: DETAYLAR VE HİKAYE (FLUFF)
    html += `<div class="monster-tab fluff-text" id="tab-fluff-${m.name.replace(/\s+/g, '')}">`;
    
    if (imageUrl) {
        html += `<div style="text-align:center; margin-bottom: 20px;">
                    <img data-src="${imageUrl}" 
                         class="lazy-monster-img"
                         alt="${m.name}" 
                         style="max-width: 100%; height: auto; max-height: 400px; border-radius: 8px; border: 1px solid #444; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
                 </div>`;
    }

    if (fluffData && fluffData.entries) {
        html += renderText(fluffData.entries); // Fluff ayrıştırıcı olarak da ana motoru kullanıyoruz
    } else {
        html += `<p style="text-align:center; color:#888; font-style:italic;">Bu yaratık için detaylı hikaye verisi bulunamadı.</p>`;
    }

    html += `</div> `;

    content.innerHTML = html;

    const tabBtns = content.querySelectorAll('.monster-tab-btn');
    const tabs = content.querySelectorAll('.monster-tab');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            tabBtns.forEach(b => b.classList.remove('active'));
            tabs.forEach(t => t.classList.remove('active'));
            
            btn.classList.add('active');
            const targetTab = content.querySelector(`#${btn.dataset.target}`);
            if(targetTab) targetTab.classList.add('active');

            const lazyImgs = targetTab.querySelectorAll('.lazy-monster-img');
            lazyImgs.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        });
    });

    header.addEventListener('click', () => {
        const isOpen = content.style.display === 'block';
        content.style.display = isOpen ? 'none' : 'block';
        header.style.backgroundColor = isOpen ? '' : '#3a3a3a';
        const arrow = header.querySelector('.arrow-icon');
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';

        if (!isOpen) { 
            const activeTab = content.querySelector('.monster-tab.active');
            if(activeTab) {
                const lazyImgs = activeTab.querySelectorAll('.lazy-monster-img');
                lazyImgs.forEach(img => {
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                });
            }
        }
    });

    card.appendChild(header);
    card.appendChild(content);
    return card;
}

/* ============================================================
   YENİ NESİL RECURSIVE (ÖZYİNELEMELİ) METİN VE OBJE ÇÖZÜCÜ
   Bu motor, [object Object] hatasını %100 ortadan kaldırır.
   ============================================================ */
function renderText(entry) {
    if (!entry) return "";

    // 1. Düz Metin (Tüm 5etools etiketlerini şık HTML'e çevirir)
    if (typeof entry === "string") {
        let res = entry;
        
        // Saldırı Etiketleri
        res = res.replace(/{@atk mw}/g, '<em>Yakın Dövüş Silah Saldırısı:</em>');
        res = res.replace(/{@atk rw}/g, '<em>Menzilli Silah Saldırısı:</em>');
        res = res.replace(/{@atk mw,rw}/g, '<em>Yakın veya Menzilli Silah Saldırısı:</em>');
        res = res.replace(/{@atk rs}/g, '<em>Menzilli Büyü Saldırısı:</em>');
        res = res.replace(/{@atk ms}/g, '<em>Yakın Dövüş Büyü Saldırısı:</em>');
        res = res.replace(/{@atk ms,rs}/g, '<em>Yakın veya Menzilli Büyü Saldırısı:</em>');
        
        // Şarj (Recharge) Etiketleri
        res = res.replace(/{@recharge (\d+)}/gi, '(Şarj $1-6)');
        res = res.replace(/{@recharge}/gi, '(Şarj 6)');
        
        // Hasar, İsabet ve Matematiksel Veriler
        res = res.replace(/{@hit (.*?)}/gi, '<strong style="color:#b52b2b;">+$1</strong>');
        res = res.replace(/{@h}/gi, '<em>İsabet halinde:</em>');
        res = res.replace(/{@damage (.*?)}/gi, '<strong style="color:#b52b2b;">$1</strong>');
        res = res.replace(/{@dc (.*?)}/gi, '<strong style="color:#b52b2b;">DC $1</strong>');
        res = res.replace(/{@dice (.*?)(?:\|.*?)?}/gi, '<strong>$1</strong>');
        res = res.replace(/{@chance (.*?)(?:\|.*?)?}/gi, '<strong>%str</strong>');
        
        // Stilistik Etiketler (Büyü, Durum, Yaratık)
        res = res.replace(/{@spell (.*?)(?:\|.*?)?}/gi, '<span style="color:#2ecc71; font-weight:bold; font-style:italic;">$1</span>');
        res = res.replace(/{@condition (.*?)(?:\|.*?)?}/gi, '<span style="color:#e74c3c; font-weight:bold; border-bottom: 1px dotted #e74c3c;">$1</span>');
        res = res.replace(/{@creature (.*?)(?:\|.*?)?}/gi, '<span style="color:#3498db; font-weight:bold;">$1</span>');
        res = res.replace(/{@skill (.*?)(?:\|.*?)?}/gi, '<strong style="color:#f39c12;">$1</strong>');
        res = res.replace(/{@sense (.*?)(?:\|.*?)?}/gi, '<em>$1</em>');
        // Eşyalar (Item) için Altın/Bronz renkli ve altı kesik çizgili şık tasarım
        res = res.replace(/{@item (.*?)(?:\|.*?)?}/gi, '<span style="color:#f1c40f; font-weight:bold; border-bottom: 1px dashed #f1c40f;">$1</span>');
        
        // Geri kalan bilinmeyen tüm etiketleri filtreleyip içindeki ana metni kurtar
        res = res.replace(/{@\w+\s+([^}|]+)(?:\|[^}]+)?}/g, '$1');
        
        return res;
    }

    // 2. Dizi (Array) İçeriği
    if (Array.isArray(entry)) {
        return entry.map(e => renderText(e)).join(" ");
    }

    // 3. Obje (Object) İçeriği -> [object Object] hatasını engelleyen kısım
    if (typeof entry === "object") {
        let html = "";
        
        // İsim (Name) alanı varsa onu vurgula
        if (entry.name) {
            html += `<strong style="color:#fff;"><em>${renderText(entry.name)}.</em></strong> `;
        }

        if (entry.type === "entries") {
            html += renderText(entry.entries);
        } 
        else if (entry.type === "list") {
            html += `<ul style="margin-top: 5px; margin-bottom: 5px;">`;
            if (entry.items) {
                entry.items.forEach(item => {
                    html += `<li>${renderText(item)}</li>`;
                });
            }
            html += `</ul>`;
        } 
        else if (entry.type === "table") {
            html += `<div style="overflow-x: auto;"><table style="width:100%; border-collapse: collapse; margin: 10px 0; font-size: 0.9em; text-align: left;">`;
            if (entry.caption) html += `<caption style="font-weight:bold; color:#b52b2b; margin-bottom:5px;">${renderText(entry.caption)}</caption>`;
            if (entry.colLabels) {
                html += `<tr>${entry.colLabels.map(c => `<th style="border-bottom: 1px solid #b52b2b; padding: 5px; color:#ddd;">${renderText(c)}</th>`).join('')}</tr>`;
            }
            if (entry.rows) {
                entry.rows.forEach(row => {
                    html += `<tr>${row.map(cell => `<td style="padding: 5px; border-bottom: 1px solid #444;">${renderText(cell)}</td>`).join('')}</tr>`;
                });
            }
            html += `</table></div>`;
        } 
        else if (entry.type === "spellcasting") {
            if (entry.headerEntries) html += renderText(entry.headerEntries) + "<br>";
            if (entry.spells) {
                for (const [level, data] of Object.entries(entry.spells)) {
                    let levelName = level === "0" ? "Cantrips (at will)" : `${level}. Seviye (${data.slots} slot)`;
                    html += `<em>${levelName}:</em> ${renderText(data.spells)}<br>`;
                }
            }
            if (entry.will) html += `<em>Sınırsız (At will):</em> ${renderText(entry.will)}<br>`;
            if (entry.daily) {
                for (const [times, spells] of Object.entries(entry.daily)) {
                    let t = times.replace('e', ' her biri');
                    html += `<em>Günde ${t} defa:</em> ${renderText(spells)}<br>`;
                }
            }
            if (entry.footerEntries) html += renderText(entry.footerEntries);
        } 
        else if (entry.type === "inset" || entry.type === "insetReadaloud") {
            html += `<div style="background: rgba(181, 43, 43, 0.05); border-left: 3px solid #b52b2b; padding: 10px 15px; margin: 15px 0;">${renderText(entry.entries)}</div>`;
        } 
        else if (entry.type === "quote") {
            html += `<div style="font-style:italic; color:#aaa; margin: 10px 0;">"${renderText(entry.entries)}"`;
            if (entry.by) html += `<br><strong style="color:#888;">— ${renderText(entry.by)}</strong>`;
            html += `</div>`;
        }
        else if (entry.entries) {
            html += renderText(entry.entries);
        }

        return html;
    }
    return "";
}

/* --- DİĞER YARDIMCI FONKSİYONLAR --- */
function parseResist(arr) {
    if (!arr) return "";
    return arr.map(x => {
        if (typeof x === 'string') return renderText(x);
        if (x.resist) return `${x.resist.join(", ")} ${x.note ? '('+x.note+')' : ''}`;
        if (x.immune) return `${x.immune.join(", ")} ${x.note ? '('+x.note+')' : ''}`;
        if (x.vulnerable) return `${x.vulnerable.join(", ")} ${x.note ? '('+x.note+')' : ''}`;
        return "";
    }).join("; ");
}

function getMod(score) {
    if(!score) return "+0";
    let mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

function parseCR(cr) {
    let val = typeof cr === 'object' ? cr.cr : cr;
    if (!val) return 0;
    if (val.includes('/')) {
        let parts = val.split('/');
        return parseInt(parts[0]) / parseInt(parts[1]);
    }
    return parseInt(val);
}

function getFullSizeName(sizeCode) {
    const sizes = { 'T': 'Minik', 'S': 'Küçük', 'M': 'Orta', 'L': 'Büyük', 'H': 'Devasa', 'G': 'Muazzam' };
    return sizes[sizeCode] || sizeCode;
}

function formatAC(acList) {
    if (!acList || !acList.length) return "10";
    if (typeof acList[0] === 'number') return acList[0];
    if (typeof acList[0] === 'object') {
        // YENİ: 'from' (kaynak) içindeki etiketleri renderText motorundan geçiriyoruz
        let fromText = acList[0].from ? ` (${acList[0].from.map(f => renderText(f)).join(", ")})` : "";
        return `${acList[0].ac}${fromText}`;
    }
    return "10";
}

function formatHP(hpData) {
    if (!hpData) return "10 (3d6)";
    return `${hpData.average} (${hpData.formula})`;
}

function formatSpeed(speedData) {
    if (!speedData) return "30 ft.";
    let speeds = [];
    if (speedData.walk) speeds.push(`${speedData.walk} ft.`);
    if (speedData.fly) speeds.push(`Uçma ${speedData.fly} ft.`);
    if (speedData.swim) speeds.push(`Yüzme ${speedData.swim} ft.`);
    if (speedData.climb) speeds.push(`Tırmanma ${speedData.climb} ft.`);
    if (speedData.burrow) speeds.push(`Kazma ${speedData.burrow} ft.`);
    return speeds.join(", ");
}

function setupScrollToTop() {
    const btn = document.getElementById('scrollToTopBtn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) btn.classList.add('show');
        else btn.classList.remove('show');
    });
    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}