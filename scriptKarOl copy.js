document.addEventListener("DOMContentLoaded", function() {
    guncelle();
    calculateSkillSlots(); // Başlangıçta skill slots hesapla
    // Event listener'lar
    document.getElementById('race').addEventListener('change', function() {
        guncelle();
        updateRaceInfo();
    });

    document.getElementById('background').addEventListener('change', function() {
        guncelle();
        updateBackgroundInfo();
        calculateSkillSlots();
    });

    document.getElementById('class').addEventListener('change', function() {
        guncelle();
        updateClassInfo();
        updateStatSira();
        calculateSkillSlots();
    });
    document.getElementById('assignStats').addEventListener('click', guncelle);
// ------------------------------RACE İNFO-----------------------------------

const raceInfo = {
    Human: {
        title: "İnsan",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuv +1; Çev +1; Day +1; Zek +1; Akı +1; Kar +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Elf(Ulu)": {
        title: "Elf(Ulu)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çev +2; Zek +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Elf(Or)": {
        title: "Elf(Orman)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çev +2; Akı +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Elf(Drow)": {
        title: "Elf(Drow)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çev +2; Kar +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Dwarf(Dağ)": {
        title: "Cüce(Dağ)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuv +2; Day +2</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Dwarf(Tepe)": {
        title: "Cüce(Tepe)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Day +2; Akı +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Halfling(Tez)": {
        title: "Buçukluk (Tez Ayak)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çev +2; Kar +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Halfling(Tık)": {
        title: "Buçukluk (Tıknaz)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çev +2; Day +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    Dragonborn: {
        title: "Ejderdoğan",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuv +2; Kar +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Gnome(Kaya)": {
        title: "Gnome(Kaya)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Day +1; Zek +2</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Gnome(Or)": {
        title: "Gnome(Orman)",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Çev +1; Zek +2</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    Tiefling: {
        title: "Tiefling",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Zek +1; Kar +2</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Yarı-Ef": {
        title: "Yarı-Elf",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kar +2; harici herhangi iki +1 seç</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    "Yarı-Orc": {
        title: "Yarı-Orc",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuv +2; Day +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    }
    // Diğer ırklar ve bilgileri buraya ekleyin
};

const updateRaceInfo = () => {
    const selectedRace = document.getElementById('race').value;
    const raceInfoDiv = document.getElementById('race-info');
    
    if (selectedRace === "") {
        raceInfoDiv.classList.add('hidden');
        raceInfoDiv.classList.remove('visible');
        raceInfoDiv.innerHTML = '';
    } else {
        const info = raceInfo[selectedRace];
        if (info) {
            raceInfoDiv.classList.remove('hidden');
            raceInfoDiv.classList.add('visible');
            raceInfoDiv.innerHTML = `<h3>${info.title}</h3><p>${info.description}</p>`;
        } else {
            raceInfoDiv.classList.add('hidden');
            raceInfoDiv.classList.remove('visible');
            raceInfoDiv.innerHTML = '';
        }
    }
};



// -------------------------------BACKGROUND İNFO-----------------------------------
    
const backgroundInfo = {
    Soldier: {
        title: "Asker",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Atletizim</span> ve <span class='ciz'>Gözdağı</span> seçilmelidir.<br>Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Sage: {
        title: "Bilge",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Arcana</span> ve <span class='ciz'>Tarih</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Denizci: {
        title: "Denizci",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Atletizim</span> ve <span class='ciz'>Algı</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    DenizciKorsan: {
        title: "Alternatif Denizci (Korsan)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Atletizim</span> ve <span class='ciz'>Algı</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    GosteriAdamı: {
        title: "Gösteri Adamı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Akrobasi</span> ve <span class='ciz'>Performance</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    GosteriAdamiGladyator: {
        title: "Alternatif Gösteri Adamı (Gladyatör)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Akrobasi</span> ve <span class='ciz'>Performance</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    FolkHero: {
        title: "Halk Kahramanı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Hayvan İdaresi</span> ve <span class='ciz'>Hayatta Kalma</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    LocaZanaatkari: {
        title: "Loca Zanaatkarı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Sezgi</span> ve <span class='ciz'>İkna Etme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    LocaZanaatkariTuccar: {
        title: "Alternatif Loca Zanaatkarı (Loca Tüccarı)t",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Sezgi</span> ve <span class='ciz'>İkna</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Munzevi: {
        title: "Münzevi (İnzivaya çekilmiş kimse)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Tıp</span> ve <span class='ciz'>Din</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Murit: {
        title: "Mürit",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Sezgi</span> ve <span class='ciz'>Din</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    SokakCocugu: {
        title: "Sokak Çocuğu",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>El Çubukluğu</span> ve <span class='ciz'>Gizlenme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Soylu: {
        title: "Soylu",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Tarih</span> ve <span class='ciz'>İkna</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    SoyluSovalye: {
        title: "Alternatif Soylu (Şövalye)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Tarih</span> ve <span class='ciz'>İkna</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Suclu: {
        title: "Suçlu",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Aldatma</span> ve <span class='ciz'>Gizlenme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    SucluAjan: {
        title: "Alternatif Suçlu (Ajan)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Aldatma</span> ve <span class='ciz'>Gizlenme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Yabanci: {
        title: "Yabancı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Atletizim</span> ve <span class='ciz'>Hayatta Kalma</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Sarlatan: {
        title: "Şarlatan",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Aldatma</span> ve <span class='ciz'>El Çabukluğu</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    // Diğer backgroundlar ve bilgileri buraya ekleyin
};

const updateBackgroundInfo = () => {
    const selectedBackground = document.getElementById('background').value;
    const backgroundInfoDiv = document.getElementById("background-info");
    
    if (selectedBackground === "select") {
        backgroundInfoDiv.classList.add('hidden');
        backgroundInfoDiv.innerHTML = '';
    } else {
        const info = backgroundInfo[selectedBackground];
        if (info) {
            backgroundInfoDiv.classList.remove('hidden');
            backgroundInfoDiv.innerHTML = `<h3>${info.title}</h3><p>${info.description}</p>`;
        } else {
            backgroundInfoDiv.classList.add('hidden');
            backgroundInfoDiv.innerHTML = '';
        }
    }
};

// ------------------------------CLASS İNFO-----------------------------------

const statSira = {
    statsıra: {
        description: "<hr><ul id='statList'><li data-stat='str'>Strength</li><li data-stat='dex'>Dexterity</li><li data-stat='con'>Constitution</li><li data-stat='int'>Intelligence</li><li data-stat='wis'>Wisdom</li><li data-stat='cha'>Charisma</li></ul><button id='assignStats'>Assign Stats</button><div id='result'></div><br><hr>"
    },
};

const updateStatSira = () => {
    const selectedClass = document.getElementById('class').value;
    const statSiraDiv = document.getElementById("stat-sira");

    if (selectedClass === "select") {
        statSiraDiv.classList.add('hidden');
        statSiraDiv.innerHTML = '';
    } else {
        const info = statSira[selectedClass];
        if (info) {
            statSiraDiv.classList.remove('hidden');
            statSiraDiv.innerHTML = info.description;
        } else {
            statSiraDiv.classList.add('hidden');
            statSiraDiv.innerHTML = '';
        }
    }
};

document.getElementById('class').addEventListener('change', updateStatSira);


// ------------------------------CLASS İNFO-----------------------------------

const classInfo = {
    Fighter: {
        title: "Savaşçı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları.</strong>Bunlardan 2 tanesi seçilmelidir. <span class='ciz' >Akrobasi, Hayvan İdaresi, Atletizm, Tarih, Sezgi, Gözdağı, Algı, ve Hayatta Kalma.</span><br>Savaşçılar, güçlü ve taktiksel yetenekleriyle silahlı çatışmalara girebilen savaşçılardır."
    },
    Wizard: {
        title: "Büyücü",
        description: "<hr>Büyücüler, güçlü büyüler yapmak için bilgi ve zekalarını kullanan büyücülerdir."
    },
    Rogue: {
        title: "Hırsız",
        description: "<hr>Hırsızlar, gizlilik, kilit açma ve tuzak bulma ve etkisiz hale getirme konusunda yeteneklidir."
    }
    // Diğer sınıflar ve bilgileri buraya ekleyin
};

const updateClassInfo = () => {
    const selectedClass = document.getElementById('class').value;
    const classInfoDiv = document.getElementById("class-info");

    if (selectedClass === "select") {
        classInfoDiv.classList.add('hidden');
        classInfoDiv.classList.remove('visible');
        classInfoDiv.innerHTML = '';
    } else {
        const info = classInfo[selectedClass];
        if (info) {
            classInfoDiv.classList.remove('hidden');
            classInfoDiv.classList.add('visible');
            classInfoDiv.innerHTML = `<h3>${info.title}</h3><p>${info.description}</p>`;
            
        } else {
            classInfoDiv.classList.add('hidden');
            classInfoDiv.classList.remove('visible');
            classInfoDiv.innerHTML = '';
        }
    }
};


document.getElementById('class').addEventListener('change', function() {
    var classSelect = document.getElementById('class');
    var skillsInfo = document.getElementById('skills');

    if (classSelect.value !== "") {
        skillsInfo.classList.remove('hidden');
    } else {
        skillsInfo.classList.add('hidden');
    }
});
document.getElementById('class').addEventListener('change', updateClassInfo);

// -------------------------------SKİLL SLOT-----------------------------------------------

let remainingSkillSlots = 0;

const skillSlotEksi = () => {
    const skillSlotEksiDiv = document.getElementById('skill-slot-eksi');
    if (remainingSkillSlots < 0) {
        skillSlotEksiDiv.classList.remove('hidden');
    } else {
        skillSlotEksiDiv.classList.add('hidden');
    }
};


function calculateSkillSlots() {
    let skillSlots = 0;

    const selectedClass = document.getElementById('class').value;
    if (selectedClass === 'Fighter') {
        skillSlots += 2;
    } else if (selectedClass === 'Wizard') {
        skillSlots += 3;
    } else if (selectedClass === 'Rogue') {
        skillSlots += 4;
    }

    const selectedBackground = document.getElementById('background').value;
    const backgroundsWithBonus = [
        'Criminal', 'FolkHero', 'Sage', 'Soldier', 
        'Denizci', 'DenizciKorsan', 'GosteriAdamı', 'GosteriAdamiGladyator', 
        'LocaZanaatkari', 'LocaZanaatkariTuccar', 'Munzevi', 'Murit', 
        'SokakCocugu', 'Soylu', 'SoyluSovalye', 'Suclu', 'SucluAjan', 
        'Yabanci', 'Sarlatan'
    ];

    if (backgroundsWithBonus.includes(selectedBackground)) {
        skillSlots += 2;
    }
    
    remainingSkillSlots = skillSlots;
    updateRemainingSkillSlots();
}

const updateRemainingSkillSlots = () => {
    document.getElementById('skill-slots').innerText = `Kalan Skill Yuvası: ${remainingSkillSlots}`;
    skillSlotEksi();
};

const toggleBonus = (skillId, buttonId, skillBonusKey) => {
    const button = document.getElementById(buttonId);
    const skillBonuses = {}; // skillBonuses objesini tanımlayın

    if (button.classList.contains('active')) {
        button.classList.remove('active');
        document.getElementById(skillId).innerHTML = skillBonuses[skillBonusKey];
        remainingSkillSlots += 1;
    } else {
        button.classList.add('active');
        document.getElementById(skillId).innerHTML = skillBonuses[skillBonusKey] + 2;
        remainingSkillSlots -= 1;
    }
    updateRemainingSkillSlots();
};

const resetAllButtons = () => {
    const skillButtons = document.querySelectorAll('.skillButton');
    skillButtons.forEach(button => {
        button.classList.remove('active');
    });
};
// Fonksiyonları window nesnesine atama
window.toggleBonusAthletics = () => toggleBonus('athletics', 'But-athletics', 'athleticsB');
window.toggleBonusAcrobatics = () => toggleBonus('acrobatics', 'But-acrobatics', 'acrobaticsB');
window.toggleBonusSleightOfHand = () => toggleBonus('sleightOfHand', 'But-sleightOfHand', 'sleightOfHandB');
window.toggleBonusStealth = () => toggleBonus('stealth', 'But-stealth', 'stealthB');
window.toggleBonusHistory = () => toggleBonus('history', 'But-history', 'historyB');
window.toggleBonusReligion = () => toggleBonus('religion', 'But-religion', 'religionB');
window.toggleBonusInvestigation = () => toggleBonus('investigation', 'But-investigation', 'investigationB');
window.toggleBonusNature = () => toggleBonus('nature', 'But-nature', 'natureB');
window.toggleBonusArcana = () => toggleBonus('arcana', 'But-arcana', 'arcanaB');
window.toggleBonusAnimalHandling = () => toggleBonus('animalHandling', 'But-animalHandling', 'animalHandlingB');
window.toggleBonusInsight = () => toggleBonus('insight', 'But-insight', 'insightB');
window.toggleBonusMedicine = () => toggleBonus('medicine', 'But-medicine', 'medicineB');
window.toggleBonusPerception = () => toggleBonus('perception', 'But-perception', 'perceptionB');
window.toggleBonusSurvival = () => toggleBonus('survival', 'But-survival', 'survivalB');
window.toggleBonusDeception = () => toggleBonus('deception', 'But-deception', 'deceptionB');
window.toggleBonusPersuasion = () => toggleBonus('persuasion', 'But-persuasion', 'persuasionB');
window.toggleBonusPerformance = () => toggleBonus('performance', 'But-performance', 'performanceB');
window.toggleBonusIntimidation = () => toggleBonus('intimidation', 'But-intimidation', 'intimidationB');

document.getElementById('class').addEventListener('change', () => {
    resetAllButtons();
    updateSkillButtons();
});
});

  // -----------------------STAT AND SKİLL------------------------------------------

  let stats = {
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10
};

const statBonuses = {
    strB: 0,
    dexB: 0,
    conB: 0,
    intB: 0,
    wisB: 0,
    chaB: 0
};



// -------------------------------Stat-Skill----------------------------------

const hesaplanmisBonus = () => {
    statBonuses.strB = Math.floor((stats.str - 10) / 2);
    statBonuses.dexB = Math.floor((stats.dex - 10) / 2);
    statBonuses.conB = Math.floor((stats.con - 10) / 2);
    statBonuses.intB = Math.floor((stats.int - 10) / 2);
    statBonuses.wisB = Math.floor((stats.wis - 10) / 2);
    statBonuses.chaB = Math.floor((stats.cha - 10) / 2);
};

let skillBonuses = {
    athleticsB: 0,
    acrobaticsB: 0,
    stealthB: 0,
    sleightOfHandB: 0,
    historyB: 0,
    religionB: 0,
    investigationB: 0,
    natureB: 0,
    arcanaB: 0,
    animalHandlingB: 0,
    insightB: 0,
    medicineB: 0,
    perceptionB: 0,
    survivalB: 0,
    deceptionB: 0,
    persuasionB: 0,
    performanceB: 0,
    intimidationB: 0
};

const skillBonuslariGuncelle = () => {
    skillBonuses.athleticsB = statBonuses.strB;
    skillBonuses.acrobaticsB = statBonuses.dexB;
    skillBonuses.stealthB = statBonuses.dexB;
    skillBonuses.sleightOfHandB = statBonuses.dexB;
    skillBonuses.historyB = statBonuses.intB;
    skillBonuses.religionB = statBonuses.intB;
    skillBonuses.investigationB = statBonuses.intB;
    skillBonuses.natureB = statBonuses.intB;
    skillBonuses.arcanaB = statBonuses.intB;
    skillBonuses.animalHandlingB = statBonuses.wisB;
    skillBonuses.insightB = statBonuses.wisB;
    skillBonuses.medicineB = statBonuses.wisB;
    skillBonuses.perceptionB = statBonuses.wisB;
    skillBonuses.survivalB = statBonuses.wisB;
    skillBonuses.deceptionB = statBonuses.chaB;
    skillBonuses.persuasionB = statBonuses.chaB;
    skillBonuses.performanceB = statBonuses.chaB;
    skillBonuses.intimidationB = statBonuses.chaB;
};

const updateStatsAndSkills = () => {
    skillBonuslariGuncelle();
    hesaplanmisBonus(); 
    document.getElementById('StatStr').innerHTML = "<div class='containerStat'><div class='strTxt'>Güç (STR): </div><div id='stricon'><div class='strB'>" + stats.str + "(" + statBonuses.strB + ")</div></div></div>";
    document.getElementById('StatDex').innerHTML = "<div class='containerStat'><div class='dexTxt'>Çeviklik (DEX): </div><div id='dexicon'><div class='dexB'>" + stats.dex + "(" + statBonuses.dexB + ")</div></div></div>";
    document.getElementById('StatCon').innerHTML = "<div class='containerStat'><div class='conTxt'>Dayanıklılık (CON): </div><div id='conicon'><div class='conB'>" + stats.con + "(" + statBonuses.conB + ")</div></div></div>";
    document.getElementById('StatInt').innerHTML = "<div class='containerStat'><div class='intTxt'>Zeka (INT): </div><div id='inticon'><div class='intB'>" + stats.int + "(" + statBonuses.intB + ")</div></div></div>";
    document.getElementById('StatWis').innerHTML = "<div class='containerStat'><div class='wisTxt'>Bilgelik (WIS): </div><div id='wisicon'><div class='wisB'>" + stats.wis + "(" + statBonuses.wisB + ")</div></div></div>";
    document.getElementById('StatCha').innerHTML = "<div class='containerStat'><div class='chaTxt'>Karizma (CHA): </div><div id='chaicon'><div class='chaB'>" + stats.cha + "(" + statBonuses.chaB + ")</div></div></div>";

    document.getElementById('athletics').innerHTML = skillBonuses.athleticsB;
    document.getElementById('acrobatics').innerHTML = skillBonuses.acrobaticsB;
    document.getElementById('stealth').innerHTML = skillBonuses.stealthB;
    document.getElementById('sleightOfHand').innerHTML = skillBonuses.sleightOfHandB;
    document.getElementById('history').innerHTML = skillBonuses.historyB;
    document.getElementById('religion').innerHTML = skillBonuses.religionB;
    document.getElementById('investigation').innerHTML = skillBonuses.investigationB;
    document.getElementById('nature').innerHTML = skillBonuses.natureB;
    document.getElementById('arcana').innerHTML = skillBonuses.arcanaB;
    document.getElementById('animalHandling').innerHTML = skillBonuses.animalHandlingB;
    document.getElementById('insight').innerHTML = skillBonuses.insightB;
    document.getElementById('medicine').innerHTML = skillBonuses.medicineB;
    document.getElementById('perception').innerHTML = skillBonuses.perceptionB;
    document.getElementById('survival').innerHTML = skillBonuses.survivalB;
    document.getElementById('deception').innerHTML = skillBonuses.deceptionB;
    document.getElementById('persuasion').innerHTML = skillBonuses.persuasionB;
    document.getElementById('performance').innerHTML = skillBonuses.performanceB;
    document.getElementById('intimidation').innerHTML = skillBonuses.intimidationB;
};

// ------------------------------------------------
const applyRaceBonuses = () => {
    const race = document.getElementById('race').value;

    stats = {
        str: 10,
        dex: 10,
        con: 10,
        int: 10,
        wis: 10,
        cha: 10
    };

    if (race === 'Human') {
        stats.str += 1;
        stats.dex += 1;
        stats.con += 1;
        stats.int += 1;
        stats.wis += 1;
        stats.cha += 1;
    } else if (race === 'Elf(Ulu)') {
        stats.dex += 2;
        stats.int += 1;
    } else if (race === 'Elf(Or)') {
        stats.dex += 2;
        stats.wis += 1;
    } else if (race === 'Elf(Drow)') {
        stats.dex += 2;
        stats.cha += 1;
    } else if (race === 'Dwarf(Dağ)') {
        stats.str += 2;
        stats.con += 2;
    } else if (race === 'Dwarf(Tepe)') {
        stats.con += 2;
        stats.wis += 1;
    } else if (race === 'Halfling(Tez)') {
        stats.dex += 2;
        stats.cha += 1;
    } else if (race === 'Halfling(Tık)') {
        stats.dex += 2;
        stats.con += 1;
    } else if (race === 'Dragonborn') {
        stats.str += 2;
        stats.cha += 1;
    } else if (race === 'Gnome(Kaya)') {
        stats.int += 2;
        stats.con += 1;
    } else if (race === 'Gnome(Or)') {
        stats.int += 2;
        stats.dex += 1;
    } else if (race === 'Tiefling') {
        stats.int += 1;
        stats.cha += 2;
    } else if (race === 'Yarı-Elf') {
        stats.int += 1;
        stats.cha += 2;
    } else if (race === 'Yarı-Orc') {
        stats.con += 1;
        stats.str += 2;
    }
};

const applyBackgroundBonuses = () => {
    const background = document.getElementById('background').value;

    // if (background === 'Soldier') {
    //     stats.str += 1;
    //     stats.con += 1;
    // } else if (background === 'Criminal') {
    //     stats.dex += 1;
    // } else if (background === 'FolkHero') {
    //     stats.str += 1;
    // } else if (background === 'Noble') {
    //     stats.cha += 1;
    // } else if (background === 'Sage') {
    //     stats.int += 1;
    // } else if (background === 'Sarlatan') {
    //     stats.str += 1;
    //     stats.con += 1;
    // }
};

const applyClassBonuses = () => {
    const selectedClass = document.getElementById('class').value;

    // if (selectedClass === 'Fighter') {
    //     stats.str += 5;
    //     stats.con += 4;
    //     stats.wis += 3;
    //     stats.cha += 2;
    //     stats.dex += 0;
    //     stats.int += -2;
    // } else if (selectedClass === 'Wizard') {
    //     stats.int += 5;
    //     stats.wis += 4;
    //     stats.dex += 3;
    //     stats.con += 2;
    //     stats.cha += 0;
    //     stats.str += -2;
    // } else if (selectedClass === 'Rogue') {
    //     stats.dex += 5;
    //     stats.int += 4;
    //     stats.wis += 3;
    //     stats.cha += 2;
    //     stats.str += 0;
    //     stats.con += -2;
    // }
};
// -----------------------STAT AND SKILL------------------------------------------

$(function() {
    $("#statList").sortable();
    $("#statList").disableSelection();
});

const statOrder = [5, 4, 3, 2, 0, -2];

function assignStats() {
    const statItems = document.querySelectorAll('#statList li');

    statItems.forEach((item, index) => {
        const stat = item.getAttribute('data-stat');
        stats[stat] += (statOrder[index]);
        // stst.str = 
    });

    // document.getElementById('result').innerText = `
    //     Strength: ${stats.str}
    //     Dexterity: ${stats.dex}
    //     Constitution: ${stats.con}
    //     Intelligence: ${stats.int}
    //     Wisdom: ${stats.wis}
    //     Charisma: ${stats.cha}
    // `;
}
// ---------------------------GÜNCELLE--------------------------------------

const guncelle = () => {
    applyRaceBonuses();
    applyBackgroundBonuses();
    applyClassBonuses();
    assignStats();
    hesaplanmisBonus();
    skillBonuslariGuncelle();
    updateStatsAndSkills();
};

// -------------------------------MENÜ----------------------------------

const toggleMenu = () => {
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

    if (menu.contains(event.target) || menuIcon.contains(event.target)) {
        return;
    }

    if (menu.classList.contains('visible')) {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
});  
