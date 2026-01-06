document.addEventListener("DOMContentLoaded", function() {
    // Sayfa yüklendiğinde ilk hesaplamayı yap
    guncelle();

    // Dinleyiciler
    document.getElementById('race').addEventListener('change', () => { updateRaceInfo(); calculateSkillSlots(); guncelle(); });
    document.getElementById('background').addEventListener('change', () => { updateBackgroundInfo(); calculateSkillSlots(); guncelle(); });
    document.getElementById('class').addEventListener('change', () => { updateClassInfo(); calculateSkillSlots(); resetAllButtons(); });

    // HTML'de id="createSheetBtn" olan butona tıklanınca çalışır.
    // createCharacterSheet fonksiyonunu aşağıda tanımladık.
    const createBtn = document.getElementById('createSheetBtn');
    if(createBtn) {
        createBtn.addEventListener('click', createCharacterSheet);
    }
});

// ------------------------------ VERİ YAPILARI (DATA) -----------------------------------

const raceData = {
    "Human": { 
        title: "İnsan", speed: 30, bonuses: { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Hepsi +1</span>" 
    },
    "HumanVariant": { 
        title: "Alternatif İnsan", speed: 30, bonuses: {}, isVariant: true, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Seçmeli +1</span><br><select id='HumanVariant1' class='variant-select'><option value=''>1. stat (+1)</option><option value='str'>Str</option><option value='dex'>Dex</option><option value='con'>Con</option><option value='int'>Int</option><option value='wis'>Wis</option><option value='cha'>Cha</option></select><br><select id='HumanVariant2' class='variant-select'><option value=''>2. stat (+1)</option><option value='str'>Str</option><option value='dex'>Dex</option><option value='con'>Con</option><option value='int'>Int</option><option value='wis'>Wis</option><option value='cha'>Cha</option></select>" 
    },
    "Elf(Ulu)": { 
        title: "Yüce Elf", speed: 30, bonuses: { dex: 2, int: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çeviklik +2; Zeka +1</span>" 
    },
    "Elf(Or)": { title: "Orman Elfi", speed: 35, bonuses: { dex: 2, wis: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çeviklik +2; Bilgelik +1</span>" 
    },
    "Elf(Drow)": { title: "Drow", speed: 30, bonuses: { dex: 2, cha: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çeviklik +2; Karizma +1</span>" 
    },
    "Dwarf(Dağ)": { 
        title: "Dağ Cücesi", speed: 25, bonuses: { str: 2, con: 2 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuvvet +2; Dayanıklılık +2</span>" 
    },
    "Dwarf(Tepe)": { description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Dayanıklılık +2; Bilgelik +1</span>" 
    },
    "Halfling(Tez)": { 
        title: "Tez Ayak Buçukluk", speed: 25, bonuses: { dex: 2, cha: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çeviklik +2; Karizma +1</span>" 
    },
    "Halfling(Tık)": { 
        title: "Tıknaz Buçukluk", speed: 25, bonuses: { dex: 2, con: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çeviklik +2; Dayanıklılık +1</span>" 
    },
    "Dragonborn": { 
        title: "Ejderdoğan", speed: 30, bonuses: { str: 2, cha: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuvvet +2; Karizma +1</span>" 
    },
    "Gnome(Kaya)": { 
        title: "Kaya Gnomu", speed: 25, bonuses: { con: 1, int: 2 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Zeka +2; Dayanıklılık +1</span>" 
    },
    "Gnome(Or)": { 
        title: "Orman Gnomu",  speed: 25,  bonuses: { dex: 1, int: 2 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Zeka +2; Çeviklik +1</span>" 
    },
    "Tiefling": { 
        title: "Tiefling",  speed: 30, bonuses: { int: 1, cha: 2 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Karizma +2; Zeka +1</span>" 
    },
    "Yarı-Elf": { 
        title: "Yarı-Elf", speed: 30, isSemiVariant: true, 
        bonuses: { cha: 2 },  description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Karizma +2; diğer iki stat +1</span><br><select id='HumanVariant1' class='variant-select'><option value=''>1. stat (+1)</option><option value='str'>Str</option><option value='dex'>Dex</option><option value='con'>Con</option><option value='int'>Int</option><option value='wis'>Wis</option></select><br><select id='HumanVariant2' class='variant-select'><option value=''>2. stat (+1)</option><option value='str'>Str</option><option value='dex'>Dex</option><option value='con'>Con</option><option value='int'>Int</option><option value='wis'>Wis</option></select>" 
    },
    "Yarı-Orc": { 
        title: "Yarı-Orc", speed: 30, bonuses: { str: 2, con: 1 }, description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuvvet +2; Dayanıklılık +1</span>" 
    }
};

const backgroundInfo = {
    Soldier: { title: "Asker", description: "<hr>Beceri Uzmanlıkları: <b>Atletizm</b> ve <b>Gözdağı</b>." },
    Sage: { title: "Bilge", description: "<hr>Beceri Uzmanlıkları: <b>Arcana</b> ve <b>Tarih</b>." },
    Denizci: { title: "Denizci", description: "<hr>Beceri Uzmanlıkları: <b>Atletizm</b> ve <b>Algı</b>." },
    DenizciKorsan: { title: "Korsan", description: "<hr>Beceri Uzmanlıkları: <b>Atletizm</b> ve <b>Algı</b>." },
    GosteriAdamı: { title: "Gösteri Adamı", description: "<hr>Beceri Uzmanlıkları: <b>Akrobasi</b> ve <b>Performans</b>." },
    GosteriAdamiGladyator: { title: "Gladyatör", description: "<hr>Beceri Uzmanlıkları: <b>Akrobasi</b> ve <b>Performans</b>." },
    FolkHero: { title: "Halk Kahramanı", description: "<hr>Beceri Uzmanlıkları: <b>Hayvan İdaresi</b> ve <b>Hayatta Kalma</b>." },
    LocaZanaatkari: { title: "Loca Zanaatkarı", description: "<hr>Beceri Uzmanlıkları: <b>Sezgi</b> ve <b>İkna</b>." },
    LocaZanaatkariTuccar: { title: "Tüccar", description: "<hr>Beceri Uzmanlıkları: <b>Sezgi</b> ve <b>İkna</b>." },
    Munzevi: { title: "Münzevi", description: "<hr>Beceri Uzmanlıkları: <b>Tıp</b> ve <b>Din</b>." },
    Murit: { title: "Mürit", description: "<hr>Beceri Uzmanlıkları: <b>Sezgi</b> ve <b>Din</b>." },
    SokakCocugu: { title: "Sokak Çocuğu", description: "<hr>Beceri Uzmanlıkları: <b>El Çabukluğu</b> ve <b>Gizlenme</b>." },
    Soylu: { title: "Soylu", description: "<hr>Beceri Uzmanlıkları: <b>Tarih</b> ve <b>İkna</b>." },
    SoyluSovalye: { title: "Şövalye", description: "<hr>Beceri Uzmanlıkları: <b>Tarih</b> ve <b>İkna</b>." },
    Suclu: { title: "Suçlu", description: "<hr>Beceri Uzmanlıkları: <b>Aldatma</b> ve <b>Gizlenme</b>." },
    SucluAjan: { title: "Ajan", description: "<hr>Beceri Uzmanlıkları: <b>Aldatma</b> ve <b>Gizlenme</b>." },
    Yabanci: { title: "Yabancı", description: "<hr>Beceri Uzmanlıkları: <b>Atletizm</b> ve <b>Hayatta Kalma</b>." },
    Sarlatan: { title: "Şarlatan", description: "<hr>Beceri Uzmanlıkları: <b>Aldatma</b> ve <b>El Çabukluğu</b>." }
};

const classInfo = {
    Barbarian: { title: "Barbar", hitDie: 12, description: "<hr><b>Hit Die:</b> d12<br><b>Öncelik:</b> Kuvvet, Dayanıklılık" },
    Bard: { title: "Bard", hitDie: 8, description: "<hr><b>Hit Die:</b> d8<br><b>Öncelik:</b> Karizma, Çeviklik" },
    Cleric: { title: "Rahip", hitDie: 8, description: "<hr><b>Hit Die:</b> d8<br><b>Öncelik:</b> Akıl, Dayanıklılık" },
    Druid: { title: "Druid", hitDie: 8, description: "<hr><b>Hit Die:</b> d8<br><b>Öncelik:</b> Akıl, Dayanıklılık" },
    Fighter: { title: "Savaşçı", hitDie: 10, description: "<hr><b>Hit Die:</b> d10<br><b>Öncelik:</b> Kuvvet veya Çeviklik, Dayanıklılık" },
    Monk: { title: "Keşiş", hitDie: 8, description: "<hr><b>Hit Die:</b> d8<br><b>Öncelik:</b> Çeviklik, Akıl" },
    Paladin: { title: "Paladin", hitDie: 10, description: "<hr><b>Hit Die:</b> d10<br><b>Öncelik:</b> Kuvvet, Karizma" },
    Ranger: { title: "Korucu", hitDie: 10, description: "<hr><b>Hit Die:</b> d10<br><b>Öncelik:</b> Çeviklik, Akıl" },
    Rogue: { title: "Düzenbaz", hitDie: 8, description: "<hr><b>Hit Die:</b> d8<br><b>Öncelik:</b> Çeviklik" },
    Sorcerer: { title: "Sihirbaz", hitDie: 6, description: "<hr><b>Hit Die:</b> d6<br><b>Öncelik:</b> Karizma, Dayanıklılık" },
    Warlock: { title: "Warlock", hitDie: 8, description: "<hr><b>Hit Die:</b> d8<br><b>Öncelik:</b> Karizma" },
    Wizard: { title: "Büyücü", hitDie: 6, description: "<hr><b>Hit Die:</b> d6<br><b>Öncelik:</b> Zeka, Dayanıklılık" }
};

// ------------------------------ DURUM YÖNETİMİ (STATE) -----------------------------------

let stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
let statBonuses = { strB: 0, dexB: 0, conB: 0, intB: 0, wisB: 0, chaB: 0 };
let skillBonuses = {};
let remainingSkillSlots = 0;

// ------------------------------ FONSİYONLAR -----------------------------------

// 1. Irk Bonuslarını Uygula
const applyRaceBonuses = () => {
    stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    assignStats(); 
    const selectedRaceKey = document.getElementById('race').value;
    const race = raceData[selectedRaceKey];
    if (!race) return;

    if (race.bonuses) {
        for (const [stat, val] of Object.entries(race.bonuses)) {
            if (stats.hasOwnProperty(stat)) stats[stat] += val;
        }
    }

    if (race.isVariant || race.isSemiVariant) {
        const v1 = document.getElementById('HumanVariant1')?.value;
        const v2 = document.getElementById('HumanVariant2')?.value;
        if (v1 && stats.hasOwnProperty(v1)) stats[v1] += 1;
        if (v2 && stats.hasOwnProperty(v2) && v1 !== v2) stats[v2] += 1;
    }
};

// 2. Stat Dağılımı
const statOrderValues = [5, 4, 3, 2, 0, -2]; 
function assignStats() {
    stats = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
    const statItems = document.querySelectorAll('#statList li');
    statItems.forEach((item, index) => {
        const statName = item.getAttribute('data-stat');
        if (stats.hasOwnProperty(statName) && index < statOrderValues.length) {
            stats[statName] += statOrderValues[index];
        }
    });
}

// 3. Modifikatör Hesaplama
const hesaplanmisBonus = () => {
    statBonuses.strB = Math.floor((stats.str - 10) / 2);
    statBonuses.dexB = Math.floor((stats.dex - 10) / 2);
    statBonuses.conB = Math.floor((stats.con - 10) / 2);
    statBonuses.intB = Math.floor((stats.int - 10) / 2);
    statBonuses.wisB = Math.floor((stats.wis - 10) / 2);
    statBonuses.chaB = Math.floor((stats.cha - 10) / 2);
};

// 4. Skill Bonuslarını Güncelle
const skillBonuslariGuncelle = () => {
    skillBonuses = {
        athletics: statBonuses.strB,
        acrobatics: statBonuses.dexB,
        stealth: statBonuses.dexB,
        sleightOfHand: statBonuses.dexB,
        history: statBonuses.intB,
        religion: statBonuses.intB,
        investigation: statBonuses.intB,
        nature: statBonuses.intB,
        arcana: statBonuses.intB,
        animalHandling: statBonuses.wisB,
        insight: statBonuses.wisB,
        medicine: statBonuses.wisB,
        perception: statBonuses.wisB,
        survival: statBonuses.wisB,
        deception: statBonuses.chaB,
        persuasion: statBonuses.chaB,
        performance: statBonuses.chaB,
        intimidation: statBonuses.chaB
    };
};

// 5. UI Güncelleme
const updateStatsAndSkills = () => {
    document.getElementById('StatStr').innerHTML = `<div class='containerStat'><div class='strTxt'>Güç (STR): </div><div id='stricon'><div class='strB'>${stats.str}(${statBonuses.strB})</div></div></div>`;
    document.getElementById('StatDex').innerHTML = `<div class='containerStat'><div class='dexTxt'>Çeviklik (DEX): </div><div id='dexicon'><div class='dexB'>${stats.dex}(${statBonuses.dexB})</div></div></div>`;
    document.getElementById('StatCon').innerHTML = `<div class='containerStat'><div class='conTxt'>Dayanıklılık (CON): </div><div id='conicon'><div class='conB'>${stats.con}(${statBonuses.conB})</div></div></div>`;
    document.getElementById('StatInt').innerHTML = `<div class='containerStat'><div class='intTxt'>Zeka (INT): </div><div id='inticon'><div class='intB'>${stats.int}(${statBonuses.intB})</div></div></div>`;
    document.getElementById('StatWis').innerHTML = `<div class='containerStat'><div class='wisTxt'>Bilgelik (WIS): </div><div id='wisicon'><div class='wisB'>${stats.wis}(${statBonuses.wisB})</div></div></div>`;
    document.getElementById('StatCha').innerHTML = `<div class='containerStat'><div class='chaTxt'>Karizma (CHA): </div><div id='chaicon'><div class='chaB'>${stats.cha}(${statBonuses.chaB})</div></div></div>`;

    for (const [key, val] of Object.entries(skillBonuses)) {
        const btn = document.getElementById('But-' + key);
        const span = document.getElementById(key);
        if (span) {
            const isProficient = btn && btn.classList.contains('active');
            span.innerHTML = isProficient ? val + 2 : val;
        }
    }
};

const guncelle = () => {
    applyRaceBonuses(); 
    hesaplanmisBonus();
    skillBonuslariGuncelle();
    updateStatsAndSkills();
};

// ------------------------------ KARAKTER KAĞIDI OLUŞTURMA (YENİ) -----------------------------------

const createCharacterSheet = () => {
    const raceKey = document.getElementById('race').value;
    const classKey = document.getElementById('class').value;
    const bgKey = document.getElementById('background').value;

    if(!raceKey || !classKey || !bgKey) {
        alert("Lütfen tüm seçimleri tamamlayın!");
        return;
    }

    const race = raceData[raceKey];
    const cls = classInfo[classKey];
    const bg = backgroundInfo[bgKey];

    // Hesaplamalar
    const ac = 10 + statBonuses.dexB;
    const hp = cls.hitDie + statBonuses.conB;
    const speed = race.speed || 30;
    
    // Pasif Algı (Perception skill değeri + 10)
    const pp = 10 + parseInt(document.getElementById('perception').innerText);

    // Skill Profiency Kontrolü (Buton aktif mi?)
    const isProf = (skillId) => {
        const btn = document.getElementById('But-' + skillId);
        return (btn && btn.classList.contains('active')) ? 'checked' : '';
    };

    // Skill Değerini Dom'dan Al (En güncel hali)
    const getSkillVal = (skillId) => {
        return document.getElementById(skillId).innerText;
    };

    // Yeni sekme aç ve yaz
    const newTab = window.open();
    newTab.document.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${race.title} ${cls.title}</title>
    <link rel="stylesheet" href="../KarakterSheet/stylesKaKa.css">
    <style>
        /* CSS yüklenmezse diye yedek stiller */
        .checkbox { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #ccc; cursor: pointer; vertical-align: middle; }
        .checkbox.checked { background-color: #333; }
    </style>
</head>
<body> 
    <div class="container">
        <div id="ust"><div id="ust-isim">
            <div id="isim">Karakter İsmi:<textarea id="noteArea-isim" placeholder="..."></textarea></div></div>
            <div id="ozellikler">
                <div id="ozellikler-ust">
                    <div id="classLevel">Sınıf/Seviye:<textarea id="noteArea-ust">${cls.title} / 1. Seviye</textarea></div>
                    <div id="background">Geçmiş:<textarea id="noteArea-ust">${bg.title}</textarea></div>
                    <div id="PlayerName">Oyuncu:<textarea id="noteArea-ust"></textarea></div>
                </div>
                <div id="ozellikler-alt">
                    <div id="race">Irk:<textarea id="noteArea-alt">${race.title}</textarea></div>
                    <div id="alignment">Hizalanma:<textarea id="noteArea-alt"></textarea></div>
                    <div id="EP">XP:<textarea id="noteArea-alt">0</textarea></div>
                </div>
            </div>
        </div>
        <div id="alt">
            <div id="sol">
                <div id="sol-ust">
                    <div id="sol-ust-sol">
                        <div id="inspration"><span class="checkbox" id="str-checkbox"></span> İlhâm </div>
                        <div id="stats">
                            <div id="str"><strong class='bold'>STR</strong><br><br>${statBonuses.strB}<br><br>${stats.str}</div>
                            <div id="dex"><strong class='bold'>DEX</strong><br><br>${statBonuses.dexB}<br><br>${stats.dex}</div>
                            <div id="con"><strong class='bold'>CON</strong><br><br>${statBonuses.conB}<br><br>${stats.con}</div>
                            <div id="int"><strong class='bold'>INT</strong><br><br>${statBonuses.intB}<br><br>${stats.int}</div>
                            <div id="wis"><strong class='bold'>WIS</strong><br><br>${statBonuses.wisB}<br><br>${stats.wis}</div>
                            <div id="cha"><strong class='bold'>CHA</strong><br><br>${statBonuses.chaB}<br><br>${stats.cha}</div>
                        </div>
                    </div>
                    <div id="sol-ust-sag">
                        <div id="yetenekler">
                            <div id="Proficiency">(+2) Proficiency Bonus</div>
                            <div id="kurtarma"><table>
                                <tbody><tr><th>Prf</th><th>Saving Throws</th><th>Skor</th></tr>
                                <tr><td><span class="checkbox"></span></td><td>Strength</td><td>${statBonuses.strB}</td></tr>
                                <tr><td><span class="checkbox"></span></td><td>Dexterity</td><td>${statBonuses.dexB}</td></tr>
                                <tr><td><span class="checkbox"></span></td><td>Constitution</td><td>${statBonuses.conB}</td></tr>
                                <tr><td><span class="checkbox"></span></td><td>Intelligence</td><td>${statBonuses.intB}</td></tr>
                                <tr><td><span class="checkbox"></span></td><td>Wisdom</td><td>${statBonuses.wisB}</td></tr>
                                <tr><td><span class="checkbox"></span></td><td>Charisma</td><td>${statBonuses.chaB}</td></tr>
                                </tbody></table>
                            </div>
                            <div id="skills">
                                <table>
                                    <tbody>
                                        <tr><th>Prf</th><th>Skill</th><th>Skor</th></tr>
                                        <tr><td><span class="checkbox ${isProf('athletics')}"></span></td><td>Athletics</td><td>${getSkillVal('athletics')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('acrobatics')}"></span></td><td>Acrobatics</td><td>${getSkillVal('acrobatics')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('sleightOfHand')}"></span></td><td>Sleight of Hand</td><td>${getSkillVal('sleightOfHand')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('stealth')}"></span></td><td>Stealth</td><td>${getSkillVal('stealth')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('history')}"></span></td><td>History</td><td>${getSkillVal('history')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('religion')}"></span></td><td>Religion</td><td>${getSkillVal('religion')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('investigation')}"></span></td><td>Investigation</td><td>${getSkillVal('investigation')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('nature')}"></span></td><td>Nature</td><td>${getSkillVal('nature')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('arcana')}"></span></td><td>Arcana</td><td>${getSkillVal('arcana')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('animalHandling')}"></span></td><td>Animal Handling</td><td>${getSkillVal('animalHandling')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('insight')}"></span></td><td>Insight</td><td>${getSkillVal('insight')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('medicine')}"></span></td><td>Medicine</td><td>${getSkillVal('medicine')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('perception')}"></span></td><td>Perception</td><td>${getSkillVal('perception')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('survival')}"></span></td><td>Survival</td><td>${getSkillVal('survival')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('deception')}"></span></td><td>Deception</td><td>${getSkillVal('deception')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('persuasion')}"></span></td><td>Persuasion</td><td>${getSkillVal('persuasion')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('performance')}"></span></td><td>Performance</td><td>${getSkillVal('performance')}</td></tr>
                                        <tr><td><span class="checkbox ${isProf('intimidation')}"></span></td><td>Intimidation</td><td>${getSkillVal('intimidation')}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div> 
                    </div>
                </div>
                <div id="sol-alt">
                    <div id="PP">(${pp}) Passive Perception</div>
                    <div id="ozelliklerDiller">Diğer Özellikler & Diller <hr> <textarea id="noteArea"></textarea></div>
                </div>
            </div>
            <div id="orta">
                <div id="orta-ust">
                    <div id="orta-ust-ust">
                        <div id="ac">${ac}<br>AC</div>
                        <div id="iniativ">${statBonuses.dexB}<br>Initiative</div>
                        <div id="speed">${speed}<br>Speed</div>
                    </div>
                    <div id="orta-ust-orta">
                        <div id="CHitPoint">Max HP: ${hp}<br>Current Hit Point</div>
                        <div id="THitPoint"><br>Temporary HP</div>
                    </div>
                    <div id="orta-ust-alt">
                        <div id="HitDice">Total: 1d${cls.hitDie}<br>Hit Dice</div>
                        <div id="DeathSaves">○ ○ ○ <br>○ ○ ○ <br>Death Saves</div>
                    </div>
                </div>
                <div id="orta-orta">
                    <div id="saldırı">
                        SALDIRILAR & BÜYÜLER <hr><textarea id="noteArea" placeholder="Silah ve büyülerinizi buraya yazın..."></textarea>
                    </div> 
                </div>
                <div id="orta-alt">
                    <div id="para">
                        <table>
                            <tbody><tr><th>Para</th><th>Miktar</th></tr>
                            <tr><td>PP</td><td>0</td></tr>
                            <tr><td>GP</td><td>0</td></tr>
                            <tr><td>SP</td><td>0</td></tr>
                            <tr><td>CP</td><td>0</td></tr>
                        </tbody></table>
                    </div>
                    <div id="ekipman">Ekipman <hr><textarea id="noteArea"></textarea></div>
                </div>
            </div>
            <div id="sag">
                <div id="sag-ust">
                    <div id="kisilik">Kişilik <hr><textarea id="noteArea"></textarea></div>
                    <div id="ideals">İdealler <hr><textarea id="noteArea"></textarea></div>
                    <div id="bonds">Bağlar <hr><textarea id="noteArea"></textarea></div>
                    <div id="flaws">Kusurlar <hr><textarea id="noteArea"></textarea></div>
                </div>
                <div id="sag-alt">ÖZELLİKLER & YETENEKLER <hr><textarea id="noteArea"></textarea></div>
            </div>
        </div>
    </div>
    <script>
        // Checkbox tıklama mantığı (Kağıt üzerinde)
        document.querySelectorAll('.checkbox').forEach(function(checkbox) {
            checkbox.addEventListener('click', function() {
                this.classList.toggle('checked');
            });
        });
    </script>
</body>
</html>
    `);
    newTab.document.close();
};

// ------------------------------ SKILL SLOT & BUTTON MANTIĞI -----------------------------------

function calculateSkillSlots() {
    let slots = 0;
    const cls = document.getElementById('class').value;
    const race = document.getElementById('race').value;
    const bg = document.getElementById('background').value;

    const classSlots = {
        Barbarian: 2, Bard: 3, Cleric: 2, Druid: 2, Fighter: 2, Monk: 2,
        Paladin: 2, Ranger: 3, Rogue: 4, Sorcerer: 2, Warlock: 2, Wizard: 2
    };
    if (classSlots[cls]) slots += classSlots[cls];

    if (race === 'HumanVariant') slots += 1;
    // Background bonus skill kontrolü (Basitleştirilmiş)
    if (bg && bg !== "") slots += 2;

    remainingSkillSlots = slots;
    
    const activeButtons = document.querySelectorAll('.skillButton.active').length;
    remainingSkillSlots -= activeButtons;

    updateRemainingSkillSlotsUI();
}

const updateRemainingSkillSlotsUI = () => {
    document.getElementById('skill-slots').innerText = `Kalan Skill Yuvası: ${remainingSkillSlots}`;
    const warning = document.getElementById('skill-slot-eksi');
    if (remainingSkillSlots < 0) {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
};

const toggleBonus = (skillId, buttonId, skillKey) => {
    const button = document.getElementById(buttonId);
    const span = document.getElementById(skillId);
    const baseVal = skillBonuses[skillKey];

    if (button.classList.contains('active')) {
        button.classList.remove('active');
        remainingSkillSlots += 1;
        span.innerHTML = baseVal;
    } else {
        button.classList.add('active');
        remainingSkillSlots -= 1;
        span.innerHTML = baseVal + 2;
    }
    updateRemainingSkillSlotsUI();
};

const resetAllButtons = () => {
    document.querySelectorAll('.skillButton').forEach(btn => btn.classList.remove('active'));
    guncelle(); 
    calculateSkillSlots(); 
};

// HTML'den erişim için global atamalar
window.toggleBonusAthletics = () => toggleBonus('athletics', 'But-athletics', 'athletics');
window.toggleBonusAcrobatics = () => toggleBonus('acrobatics', 'But-acrobatics', 'acrobatics');
window.toggleBonusSleightOfHand = () => toggleBonus('sleightOfHand', 'But-sleightOfHand', 'sleightOfHand');
window.toggleBonusStealth = () => toggleBonus('stealth', 'But-stealth', 'stealth');
window.toggleBonusHistory = () => toggleBonus('history', 'But-history', 'history');
window.toggleBonusReligion = () => toggleBonus('religion', 'But-religion', 'religion');
window.toggleBonusInvestigation = () => toggleBonus('investigation', 'But-investigation', 'investigation');
window.toggleBonusNature = () => toggleBonus('nature', 'But-nature', 'nature');
window.toggleBonusArcana = () => toggleBonus('arcana', 'But-arcana', 'arcana');
window.toggleBonusAnimalHandling = () => toggleBonus('animalHandling', 'But-animalHandling', 'animalHandling');
window.toggleBonusInsight = () => toggleBonus('insight', 'But-insight', 'insight');
window.toggleBonusMedicine = () => toggleBonus('medicine', 'But-medicine', 'medicine');
window.toggleBonusPerception = () => toggleBonus('perception', 'But-perception', 'perception');
window.toggleBonusSurvival = () => toggleBonus('survival', 'But-survival', 'survival');
window.toggleBonusDeception = () => toggleBonus('deception', 'But-deception', 'deception');
window.toggleBonusPersuasion = () => toggleBonus('persuasion', 'But-persuasion', 'persuasion');
window.toggleBonusPerformance = () => toggleBonus('performance', 'But-performance', 'performance');
window.toggleBonusIntimidation = () => toggleBonus('intimidation', 'But-intimidation', 'intimidation');

window.guncelle = guncelle; 

// JQUERY SORTABLE
$(function() {
    $("#statList").sortable({
        update: function(event, ui) {
            guncelle(); 
        }
    });
    $("#statList").disableSelection();
});

// MENU
window.toggleMenu = () => {
    const menu = document.getElementById('hamburger-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('visible');
    } else {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
};

document.addEventListener('click', (event) => {
    const menu = document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');
    if (menu.contains(event.target) || menuIcon.contains(event.target)) return;
    if (menu.classList.contains('visible')) {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
});

// Diğer Görüntü Güncelleme Fonksiyonları (Race, Background, Class Info)
const updateRaceInfo = () => {
    const selectedRace = document.getElementById('race').value;
    const infoDiv = document.getElementById('race-info');
    const data = raceData[selectedRace];
    if (data) {
        infoDiv.classList.remove('hidden');
        infoDiv.classList.add('visible');
        infoDiv.innerHTML = `<h3>${data.title}</h3><p>${data.description}</p>`;
        if (data.isVariant || data.isSemiVariant) {
            const v1 = document.getElementById('HumanVariant1');
            const v2 = document.getElementById('HumanVariant2');
            if(v1) v1.addEventListener('change', guncelle);
            if(v2) v2.addEventListener('change', guncelle);
        }
    } else {
        infoDiv.classList.add('hidden');
        infoDiv.innerHTML = '';
    }
};
const updateBackgroundInfo = () => {
    const val = document.getElementById('background').value;
    const div = document.getElementById('background-info');
    const data = backgroundInfo[val];
    if (data) {
        div.classList.remove('hidden');
        div.innerHTML = `<h3>${data.title}</h3><p>${data.description}</p>`;
    } else {
        div.classList.add('hidden');
        div.innerHTML = '';
    }
};
const updateClassInfo = () => {
    const val = document.getElementById('class').value;
    const div = document.getElementById('class-info');
    const skillsDiv = document.getElementById('skills');
    const data = classInfo[val];
    if (data) {
        div.classList.remove('hidden');
        div.classList.add('visible');
        div.innerHTML = `<h3>${data.title}</h3><p>${data.description}</p>`;
        skillsDiv.classList.remove('hidden');
    } else {
        div.classList.add('hidden');
        skillsDiv.classList.add('hidden');
    }
};