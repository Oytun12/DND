/* ============================================================
   SCRIPTBESTIARY.JS - Yaratık Rehberi (Akıllı Veri ve Görsel Yönetimi)
   ============================================================ */

let ALL_MONSTERS = [];
let FLUFF_DICT = {}; 
let ACTIVE_FILTERS = {
    search: "",
    cr: "all",
    type: "all",
    size: "all",
    source: "all",
    sort: "name-asc" 
};

/* --- 1. YÜKLÜ KAYNAKLAR (AKILLI LİSTE) --- */
// Sunucuya yüklediğin JSON dosyalarının adını buraya ekle. 
// Böylece sistem olmayan 70+ dosyayı arayıp konsolda 404 hatası vermez.
const ACTIVE_SOURCES = [
    "bestiary-aatm.json",
    "bestiary-ai.json",
    "bestiary-aitfr-isf.json",
    "bestiary-aitfr-thp.json",
    "bestiary-aitfr-dn.json",
    "bestiary-aitfr-fcd.json",
    "bestiary-awm.json",
    "bestiary-bam.json",
    "bestiary-bgdia.json",
    "bestiary-bgg.json",
    "bestiary-bmt.json",
    "bestiary-cm.json",
    "bestiary-coa.json",
    "bestiary-cos.json",
    "bestiary-crcotn.json",
    "bestiary-dc.json",
    "bestiary-dip.json",
    "bestiary-ditlcot.json",
    "bestiary-dmg.json",
    "bestiary-dod.json",
    "bestiary-dosi.json",
    "bestiary-dsotdq.json",
    "bestiary-egw.json",
    "bestiary-erlw.json",
//  "bestiary-esk.json",
    "bestiary-ftd.json",
    "bestiary-ggr.json",
    "bestiary-gos.json",
//  "bestiary-gotsf.json",
    "bestiary-hat-tg.json",
    "bestiary-hftt.json",
//  "bestiary-hol.json",
    "bestiary-hotdq.json",
    "bestiary-idrotf.json",
    "bestiary-imr.json",
    "bestiary-jttrc.json",
    "bestiary-kftgv.json",
    "bestiary-kkw.json",
    "bestiary-llk.json",
    "bestiary-lmop.json",
    "bestiary-lox.json",
    "bestiary-lr.json",
    "bestiary-lrdt.json",
    "bestiary-mabjov.json",
    "bestiary-mcv1sc.json",
    "bestiary-mcv2dc.json",
    "bestiary-mcv3mc.json",
    "bestiary-mcv4ec.json",
    "bestiary-mismv1.json",
    "bestiary-mff.json",
    "bestiary-mgelft.json",
    "bestiary-mm.json",
    "bestiary-mpmm.json",
    "bestiary-mpp.json",
    "bestiary-mot.json",
    "bestiary-mtf.json",
//  "bestiary-nrh-tcmc.json",
//  "bestiary-nrh-avitw.json",
//  "bestiary-nrh-ass.json",
//  "bestiary-nrh-coi.json",
//  "bestiary-nrh-tlt.json",
//  "bestiary-nrh-awol.json",
//  "bestiary-nrh-at.json",
    "bestiary-oota.json",
    "bestiary-oow.json",
    "bestiary-pabtso.json",
    "bestiary-ps-a.json",
    "bestiary-ps-d.json",
    "bestiary-ps-i.json",
    "bestiary-ps-k.json",
    "bestiary-ps-x.json",
    "bestiary-ps-z.json",
//  "bestiary-phb.json",
    "bestiary-pota.json",
    "bestiary-qftis.json",
    "bestiary-rmbre.json",
    "bestiary-rot.json",
//  "bestiary-rtg.json",
    "bestiary-sads.json",
    "bestiary-scc.json",
    "bestiary-sdw.json",
    "bestiary-skt.json",
//  "bestiary-slw.json",
    "bestiary-tce.json",
    "bestiary-ttp.json",
    "bestiary-tftyp.json",
    "bestiary-toa.json",
    "bestiary-tofw.json",
    "bestiary-vd.json",
    "bestiary-veor.json",
    "bestiary-vgm.json",
    "bestiary-vrgr.json",
//  "bestiary-xge.json",
    "bestiary-wbtw.json",
    "bestiary-wdh.json",
    "bestiary-wdmm.json"

    // BURAYA ASLA "fluff-" BAŞLIKLI DOSYALARI YAZMA. 
    // Kod onları bu isimlerden türeterek arka planda kendi bulacak.
];

// Dropdown'da şık görünmesi için isim sözlüğü
const SOURCE_NAMES = {
    "AI": "Acquisitions Incorporated (AI)",
    "BAM": "Boo's Astral Menagerie (BAM)",
    "BGDIA": "Baldur's Gate: Descent into Avernus (BGDIA)",
    "BGG": "Bigby Presents: Glory of the Giants (BGG)",
    "BMT": "The Book of Many Things (BMT)",
    "CM": "Candlekeep Mysteries (CM)",
    "CoS": "Curse of Strahd (CoS)",
    "CRCotN": "Critical Role: Call of the Netherdeep (CRCotN)",
    "DMG": "Dungeon Master's Guide (DMG)",
    "DoD": "Domains of Delight (DoD)",
    "DoSI": "Dragons of Stormwreck Isle (DoSI)",
    "DSotDQ": "Dragonlance: Shadow of the Dragon Queen (DSotDQ)",
    "EGW": "Explorer's Guide to Wildemount (EGW)",
    "ERLW": "Eberron: Rising from the Last War (ERLW)",
    "FTD": "Fizban's Treasury of Dragons (FTD)",
    "GGR": "Guildmasters' Guide to Ravnica (GGR)",
    "GoS": "Ghosts of Saltmarsh (GoS)",
    "HotDQ": "Hoard of the Dragon Queen (HotDQ)",
    "IDRotF": "Icewind Dale: Rime of the Frostmaiden (IDRotF)",
    "JttRC": "Journeys through the Radiant Citadel (JttRC)",
    "KftGV": "Keys from the Golden Vault (KftGV)",
    "LMoP": "Lost Mine of Phandelver (LMoP)",
    "LoX": "Light of Xaryxis (LoX)",
    "MM": "Monster Manual (MM)",
    "MPMM": "Mordenkainen Presents: Monsters of the Multiverse (MPMM)",
    "MOT": "Mythic Odysseys of Theros (MOT)",
    "MTF": "Mordenkainen's Tome of Foes (MTF)",
    "OotA": "Out of the Abyss (OotA)",
    "PHB": "Player's Handbook (PHB)",
    "PotA": "Princes of the Apocalypse (PotA)",
    "RoT": "The Rise of Tiamat (RoT)",
    "SADS": "Spelljammer: Adventures in Space (SADS)",
    "SCC": "Strixhaven: A Curriculum of Chaos (SCC)",
    "SKT": "Storm King's Thunder (SKT)",
    "TCE": "Tasha's Cauldron of Everything (TCE)",
    "TftYP": "Tales from the Yawning Portal (TftYP)",
    "ToA": "Tomb of Annihilation (ToA)",
    "VGM": "Volo's Guide to Monsters (VGM)",
    "VRGR": "Van Richten's Guide to Ravenloft (VRGR)",
    "XGE": "Xanathar's Guide to Everything (XGE)",
    "WBtW": "The Wild Beyond the Witchlight (WBtW)",
    "WDH": "Waterdeep: Dragon Heist (WDH)",
    "WDMM": "Waterdeep: Dungeon of the Mad Mage (WDMM)"
    
    // Not: Popüler olmayan veya çok spesifik modüller listeye uzunluk katmaması 
    // için eklenmedi. Eğer SOURCE_NAMES içinde karşılığı yoksa, kod otomatik olarak 
    // kısaltmayı (Örn: AATM) dropdown menüsüne sorunsuz bir şekilde yazdıracaktır.
};

/* --- MENÜ VE TIKLAMA YÖNETİMİ --- */
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

/* --- BAŞLATMA VE VERİ ÇEKME --- */
document.addEventListener("DOMContentLoaded", () => {
    loadAllBestiaries();
    setupFilters();
    setupScrollToTop();
});

async function loadAllBestiaries() {
    const container = document.getElementById('monster-list');
    ALL_MONSTERS = [];
    FLUFF_DICT = {};

    // Sadece ACTIVE_SOURCES listesinde olan dosyaları çekiyoruz (Hatasız işlem)
    // DİKKAT: Dosya yolları '../../../' olarak güncellendi.
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
        } catch (e) { /* Fluff yoksa sessizce atla */ }
    });

    await Promise.all(fetchPromises);

    if (ALL_MONSTERS.length === 0) {
        container.innerHTML = `<div class="no-results" style="color:#b52b2b;">Yaratık verileri bulunamadı. Lütfen Data/bestiary klasörünü ve ACTIVE_SOURCES listesini kontrol edin.</div>`;
        return;
    }

    populateSourceFilter();
    sortAndRender();
}

/* --- DİNAMİK KAYNAK FİLTRESİ --- */
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

/* --- FİLTRELEME VE SIRALAMA AYARLARI --- */
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

/* --- ANA MANTIK (Filtreleme) --- */
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

/* --- RENDER İŞLEMLERİ --- */
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

    // Fluff sözlüğünden resim yakalama mantığı
    let imageUrl = "";
    const fluffData = FLUFF_DICT[`${m.name}_${m.source}`];
    if (fluffData && fluffData.images && fluffData.images.length > 0) {
        let imgHref = fluffData.images[0].href;
        if (typeof imgHref === 'object' && imgHref.path) {
            imageUrl = `../../../img/${imgHref.path}`; 
        } else if (typeof imgHref === 'string') {
            imageUrl = `../../../img/${imgHref}`;
        }
    }

    let html = ``;
    
    // AKILLI & TEMBEL GÖRSEL KONTROLÜ (Lazy Load)
    // "src" yerine "data-src" kullanıyoruz. Tarayıcı resmi baştan indirmeyecek.
    if (imageUrl) {
        html += `<div class="monster-image-container" style="text-align:center; margin-bottom: 20px;">
                    <img data-src="${imageUrl}" 
                         class="lazy-monster-img"
                         alt="${m.name}" 
                         onerror="this.outerHTML='<div style=\\'color:#ff8888; background:#2a1111; padding:15px; border:1px dashed #ff4444; border-radius:8px; font-size:0.9em; word-break: break-all;\\'><strong>Görsel Bulunamadı!</strong><br><br><small>Sistemin Aradığı Konum:<br>' + this.src + '</small></div>';" 
                         style="max-width: 100%; height: auto; max-height: 250px; border-radius: 8px; border: 1px solid #444; box-shadow: 0 4px 8px rgba(0,0,0,0.5);">
                 </div>`;
    }

    html += `
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

    let infoLines = [];
    if (m.save) {
        let saves = Object.entries(m.save).map(([stat, val]) => `${stat.toUpperCase()} ${val}`).join(", ");
        infoLines.push(`<strong>Kurtarmalar:</strong> <span style="color:#eee;">${saves}</span>`);
    }
    if (m.skill) {
        let skills = Object.entries(m.skill).map(([sk, val]) => `${sk} ${val}`).join(", ");
        infoLines.push(`<strong>Yetenekler:</strong> <span style="color:#eee;">${skills}</span>`);
    }
    if (m.passive) infoLines.push(`<strong>Pasif Algı:</strong> <span style="color:#eee;">${m.passive}</span>`);
    if (m.languages) infoLines.push(`<strong>Diller:</strong> <span style="color:#eee;">${m.languages.join(", ")}</span>`);
    
    if(infoLines.length > 0) {
        html += `<div class="monster-info-line">${infoLines.join(" &nbsp;|&nbsp; ")}</div>`;
    }

    if (m.trait) {
        html += `<div class="monster-section"><h4>Özellikler</h4>`;
        m.trait.forEach(t => {
            html += `<p><strong>${t.name}.</strong> ${renderText(t.entries)}</p>`;
        });
        html += `</div>`;
    }

    if (m.action) {
        html += `<div class="monster-section"><h4>Eylemler</h4>`;
        m.action.forEach(a => {
            html += `<p><strong>${a.name}.</strong> ${renderText(a.entries)}</p>`;
        });
        html += `</div>`;
    }

    content.innerHTML = html;

    // AÇILIR/KAPANIR MANTIK VE GÖRSEL YÜKLEME
    header.addEventListener('click', () => {
        const isOpen = content.style.display === 'block';
        content.style.display = isOpen ? 'none' : 'block';
        header.style.backgroundColor = isOpen ? '' : '#3a3a3a';
        const arrow = header.querySelector('.arrow-icon');
        arrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';

        // Kart açıldığında resmi yükle
        if (!isOpen) { 
            const lazyImg = content.querySelector('.lazy-monster-img');
            if (lazyImg && lazyImg.dataset.src) {
                // data-src içindeki yolu gerçek src'ye atar, resim o saniye yüklenmeye başlar
                lazyImg.src = lazyImg.dataset.src; 
                
                // Her açılışta tekrar denememesi için data-src'yi temizleriz
                lazyImg.removeAttribute('data-src'); 
            }
        }
    });

    card.appendChild(header);
    card.appendChild(content);
    return card;
}

/* --- YARDIMCI FONKSİYONLAR --- */
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
        let fromText = acList[0].from ? ` (${acList[0].from.join(", ")})` : "";
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
    return speeds.join(", ");
}

function renderText(entries) {
    if (!entries) return "";
    let text = Array.isArray(entries) ? entries.join(" ") : entries;
    text = text.replace(/{@atk mw}/g, '<em>Yakın Dövüş Silah Saldırısı:</em>');
    text = text.replace(/{@atk rw}/g, '<em>Menzilli Silah Saldırısı:</em>');
    text = text.replace(/{@atk mw,rw}/g, '<em>Yakın veya Menzilli Silah Saldırısı:</em>');
    text = text.replace(/{@hit (.*?)}/g, '<strong style="color:#b52b2b;">+$1</strong>');
    text = text.replace(/{@h}/g, '<em>İsabet halinde:</em>');
    text = text.replace(/{@damage (.*?)}/g, '<strong style="color:#b52b2b;">$1</strong> hasar');
    text = text.replace(/{@dc (.*?)}/g, '<strong style="color:#b52b2b;">DC $1</strong>');
    return text;
}

/* --- YUKARI DÖN BUTONU MANTIĞI --- */
function setupScrollToTop() {
    const btn = document.getElementById('scrollToTopBtn');
    if (!btn) return;

    // Sayfa kaydırıldıkça butonu göster/gizle
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            btn.classList.add('show');
        } else {
            btn.classList.remove('show');
        }
    });

    // Tıklanınca en üste yumuşakça çık
    btn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}