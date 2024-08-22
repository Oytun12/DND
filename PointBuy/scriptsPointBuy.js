document.addEventListener('DOMContentLoaded', () => {
    guncelle();
    document.getElementById('race').addEventListener('change', guncelle);
    document.getElementById('background').addEventListener('change', guncelle);
    document.getElementById('class').addEventListener('change', guncelle);


    document.getElementById('race').addEventListener('change', calculateSkillSlots);
    document.getElementById('background').addEventListener('change', calculateSkillSlots);
    document.getElementById('class').addEventListener('change', calculateSkillSlots);



    const form = document.getElementById('character-form');
    const raceForm = document.getElementById('race-form');
    const statInputs = form.querySelectorAll('input[type="number"]');
    const totalPointsElement = document.getElementById('total-points');
    const submitBtn = document.getElementById('submit-btn');
    const resetBtn = document.getElementById('reset-btn');

    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('input', guncelle);
    });
    // if (window.innerWidth < 800) {
    //     // document.querySelector('meta[name="viewport"]').setAttribute('content', 'width=800, initial-scale=' + (window.innerWidth / 800));
    //     const cost = document.getElementById('race-info');
    //     cost.classList.add('hidden');
    // }
    let totalPoints = 0;

    let statBonuses = {
        strB: 0,
        dexB: 0,
        conB: 0,
        intB: 0,
        wisB: 0,
        chaB: 0
    };

    const statCostTable = {
        8: 0,
        9: 1,
        10: 2,
        11: 3,
        12: 4,
        13: 5,
        14: 7,
        15: 9
    };

    const raceBonuses = {
        Select: {strB: 0, dexB: 0, conB: 0, intB: 0, wisB: 0, chaB: 0},
        Human: {strB: 1, dexB: 1, conB: 1, intB: 1, wisB: 1, chaB: 1},
      
        "Elf(Ulu)": {strB: 0, dexB: 2, conB: 0, intB: 1, wisB: 0, chaB: 0},
        "Elf(Or)": {strB: 0, dexB: 2, conB: 0, intB: 0, wisB: 1, chaB: 0},
        "Elf(Drow)": {strB: 0, dexB: 2, conB: 0, intB: 0, wisB: 0, chaB: 1},
        "Dwarf(Dağ)": {strB: 2, dexB: 0, conB: 2, intB: 0, wisB: 0, chaB: 0},
        "Dwarf(Tepe)": {strB: 0, dexB: 0, conB: 2, intB: 0, wisB: 1, chaB: 0},
        "Halfling(Tez)": {strB: 0, dexB: 2, conB: 0, intB: 0, wisB: 0, chaB: 1},
        "Halfling(Tık)": {strB: 0, dexB: 2, conB: 1, intB: 0, wisB: 0, chaB: 0},
        Dragonborn: {strB: 2, dexB: 0, conB: 0, intB: 0, wisB: 0, chaB: 1},
        "Gnome(Kaya)": {strB: 0, dexB: 0, conB: 1, intB: 2, wisB: 0, chaB: 0},
        "Gnome(Or)": {strB: 0, dexB: 1, conB: 0, intB: 2, wisB: 0, chaB: 0},
        Tiefling: {strB: 0, dexB: 0, conB: 0, intB: 1, wisB: 0, chaB: 2},
      
        "Yarı-Orc": {strB: 2, dexB: 0, conB: 1, intB: 0, wisB: 0, chaB: 0},
    };


    const calculateStatCost = (stat) => {
        return statCostTable[stat] || 0;
    };

    const calculateModifier = (score) => {
        return Math.floor((score - 10) / 2);
    };

    const calculatePointsRemaining = () => {
        totalPoints = 0;
        statInputs.forEach(input => {
            const statValue = parseInt(input.value, 10);
            totalPoints += calculateStatCost(statValue);
        });
        totalPointsElement.textContent = `${totalPoints}/27`;
        submitBtn.disabled = totalPoints > 27;
    };

    const updateTotalsAndModifiers = () => {
        statInputs.forEach(input => {
            const statValue = parseInt(input.value, 10);
            const statName = input.name;
            const racialBonus = statBonuses[`${statName}B`] || 0;
            const total = statValue + racialBonus;
            const modifier = calculateModifier(total);

            document.getElementById(`${statName}-total`).textContent = total;
            document.getElementById(`${statName}-modifier`).textContent = modifier;
            document.getElementById(`${statName}-cost`).textContent = calculateStatCost(statValue);
        });
    };
    
    const updateRaceBonuses = (race) => {
        // Stat bonuslarını sıfırla
        statBonuses = {strB: 0, dexB: 0, conB: 0, intB: 0, wisB: 0, chaB: 0};
    
        // Seçilen ırkın bonuslarını uygula
        if (race === 'HumanVariant') {
            // Human Variant için custom bonusları al
            const bonus1 = document.getElementById('custom-bonus-1').value;
            const bonus2 = document.getElementById('custom-bonus-2') ? document.getElementById('custom-bonus-2').value : '';
    
            // Seçilen bonusları uygula
            if (bonus1) statBonuses[bonus1]++;
            if (bonus2) statBonuses[bonus2]++;
        } else if (race === 'Yarı-Elf') {
            // Yarı-Elf için custom bonusu al (customBonus3 kullanılıyor)
            const bonus3 = document.getElementById('custom-bonus-3') ? document.getElementById('custom-bonus-3').value : '';
    
            // Seçilen bonusları uygula
            if (bonus3) statBonuses[bonus3]++;
            statBonuses.chaB += 2; // Yarı-Elf için CHA bonusu her zaman +2
        } else {
            // Diğer ırklar için bonusları uygula
            statBonuses = {...raceBonuses[race]};
        }
    
        // Bonusları UI'ya yansıt
        Object.keys(statBonuses).forEach(key => {
            document.getElementById(`${key.split('B')[0]}-racial`).textContent = statBonuses[key];
        });
    
        // Toplamları ve modifikatorleri güncelle
        updateTotalsAndModifiers();
    };
    
    document.addEventListener('DOMContentLoaded', () => {
        const customBonus1 = document.getElementById('custom-bonus-1');
        const customBonus2 = document.getElementById('custom-bonus-2');
        const customBonus3 = document.getElementById('custom-bonus-3');
    
        if (customBonus1) {
            customBonus1.addEventListener('change', () => {
                updateRaceBonuses(document.getElementById('race').value);
            });
        }
    
        if (customBonus2) {
            customBonus2.addEventListener('change', () => {
                updateRaceBonuses(document.getElementById('race').value);
            });
        }
    
        if (customBonus3) {
            customBonus3.addEventListener('change', () => {
                updateRaceBonuses(document.getElementById('race').value);
            });
        }
    
        document.getElementById('race').addEventListener('change', (event) => {
            const selectedRace = event.target.value;
            updateRaceBonuses(selectedRace);
        });
    });
    
    
    const customBonus1 = document.getElementById('custom-bonus-1');
    const customBonus2 = document.getElementById('custom-bonus-2');
    const customBonus3 = document.getElementById('custom-bonus-3');

    if (customBonus1) {
        customBonus1.addEventListener('change', () => {
            updateRaceBonuses(document.getElementById('race').value);
            updateTotalsAndModifiers();
         });
    }

    if (customBonus2) {
        customBonus2.addEventListener('change', () => {
            updateRaceBonuses(document.getElementById('race').value);
            updateTotalsAndModifiers();
        });
    }
    if (customBonus3) {
        customBonus3.addEventListener('change', () => {
            updateRaceBonuses(document.getElementById('race').value);
            updateTotalsAndModifiers();
        });
    }
    
    
    
    raceForm.addEventListener('change', (event) => {
        const selectedRace = event.target.value;
        updateRaceBonuses(selectedRace);
    });

    statInputs.forEach(input => {
        input.addEventListener('change', () => {
            if (input.value < 8) input.value = 8;
            if (input.value > 15) input.value = 15;
            calculatePointsRemaining();
            updateTotalsAndModifiers();
        });
    });

    raceForm.addEventListener('change', (event) => {
        const selectedRace = event.target.value;
        // console.log(`Selected race: ${selectedRace}`); // Burada seçilen ırkı konsola yazdırın
        updateRaceBonuses(selectedRace);
    });

    resetBtn.addEventListener('click', () => {
        statInputs.forEach(input => input.value = 8);
        updateRaceBonuses('select'); // Default race olarak "human" seçebilirsiniz
        calculatePointsRemaining();
        updateTotalsAndModifiers();
    });

    // form.addEventListener('submit', (event) => {
    //     event.preventDefault();
    //     alert('Character created successfully!');
    //     // form.reset();
    //     // updateRaceBonuses('select');
    //     calculatePointsRemaining();
    //     updateTotalsAndModifiers();
    // });

    calculatePointsRemaining();
    updateTotalsAndModifiers();
    updateRaceBonuses('Select'); // Sayfa yüklendiğinde varsayılan ırkı ayarla


});    
// ------------------------------RACE İNFO-----------------------------------

const raceInfo = {
    Human: {
        title: "İnsan",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuv +1; Çev +1; Day +1; Zek +1; Akı +1; Kar +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    },
    // HumanVariant: {
    //     title: "Alternatif İnsan"
    // //     description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> herhangi iki farklı stata +1 alır.</span><br><div id='custom-bonuses' name='HumanVariant1' required>    <label for='custom-bonus-1'>Birinci bonus:</label>    <select id='custom-bonus-1'>        <option value='strB'>Strength</option>        <option value='dexB'>Dexterity</option>        <option value='conB'>Constitution</option>        <option value='intB'>Intelligence</option>        <option value='wisB'>Wisdom</option>        <option value='chaB'>Charisma</option>    </select>    <label for='custom-bonus-2' id='custom-bonus-2-label'>İkinci bonus:</label>    <select id='custom-bonus-2'>        <option value='strB'>Strength</option>        <option value='dexB'>Dexterity</option>        <option value='conB'>Constitution</option>        <option value='intB'>Intelligence</option>        <option value='wisB'>Wisdom</option>        <option value='chaB'>Charisma</option>    </select></div><br><br><strong class='bold'>Beceriler:  </strong><span class='ciz'>Seçeceğin bir beceride uzmanlık kazanırsın.</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    // },
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
    // "Yarı-Elf": {
    //     title: "Yarı-Elf",
    //     description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> herhangi iki farklı stata +1 alır.</span><br><div id='custom-bonuses' name='HumanVariant1' required>    <label for='custom-bonus-1'>Birinci bonus:</label>    <select id='custom-bonus-1'>        <option value='strB'>Strength</option>        <option value='dexB'>Dexterity</option>        <option value='conB'>Constitution</option>        <option value='intB'>Intelligence</option>        <option value='wisB'>Wisdom</option>        <option value='chaB'>Charisma</option>    </select>    </div><br><strong class='bold'>Beceriler:  </strong><span class='ciz'>Seçeceğin bir beceride uzmanlık kazanırsın.</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    // },
    "Yarı-Orc": {
        title: "Yarı-Orc",
        description: "<hr><strong class='bold'>Yetenek Skorları:</strong> <span class='ciz'> Kuv +2; Day +1</span><br>Geri kalan özellikleri Irklar sayfasından bakınız."
    }
    // Diğer ırklar ve bilgileri buraya ekleyin
};

const updateRaceInfo = () => {
    const selectedRace = document.getElementById('race').value;
    const raceInfoDiv = document.getElementById('race-info');

    if (selectedRace === "Select") {
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
    const raceInfoVariH = document.getElementById('race-variant-H');
        if (selectedRace === "HumanVariant") {
            raceInfoVariH.classList.remove('hidden');
            raceInfoVariH.classList.add('visible');
        } else {
            raceInfoVariH.classList.add('hidden');
            raceInfoVariH.classList.remove('visible');
        }
    const raceInfoVariE = document.getElementById('race-variant-E');
        if (selectedRace === "Yarı-Elf") {
            raceInfoVariE.classList.remove('hidden');
            raceInfoVariE.classList.add('visible');
        } else {
            raceInfoVariE.classList.add('hidden');
            raceInfoVariE.classList.remove('visible');
        }
    
};

// `updateRaceInfo` fonksiyonunu HTML öğelerine bağlayın
document.getElementById('race').addEventListener('change', updateRaceInfo);

// -------------------------------BACKGROUND İNFO-----------------------------------

const backgroundInfoDiv = document.getElementById("background-info");
    
const backgroundInfo = {
    Asker: {
        title: "Asker",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Atletizim</span> ve <span class='ciz'>Gözdağı</span> seçilmelidir.<br>Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Bilge: {
        title: "Bilge",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Arcana</span> ve <span class='ciz'>Tarih</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Denizci: {
        title: "Denizci",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Atletizim</span> ve <span class='ciz'>Algı</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    Korsan: {
        title: "Alternatif Denizci (Korsan)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Atletizim</span> ve <span class='ciz'>Algı</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Gösteri Adamı": {
        title: "Gösteri Adamı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Akrobasi</span> ve <span class='ciz'>Performance</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Gösteri Adamı (Gladyatör)": {
        title: "Alternatif Gösteri Adamı (Gladyatör)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong> <span class='ciz'>Akrobasi</span> ve <span class='ciz'>Performance</span> seçilmelidir. <br> Geri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Halk Kahramanı": {
        title: "Halk Kahramanı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Hayvan İdaresi</span> ve <span class='ciz'>Hayatta Kalma</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Loca Zanaatkarı": {
        title: "Loca Zanaatkarı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Sezgi</span> ve <span class='ciz'>İkna Etme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Loca Tüccarı": {
        title: "Alternatif Loca Zanaatkarı (Loca Tüccarı)t",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Sezgi</span> ve <span class='ciz'>İkna</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Münzevi": {
        title: "Münzevi (İnzivaya çekilmiş kimse)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Tıp</span> ve <span class='ciz'>Din</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Mürit": {
        title: "Mürit",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Sezgi</span> ve <span class='ciz'>Din</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Sokak Çocuğu": {
        title: "Sokak Çocuğu",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>El Çubukluğu</span> ve <span class='ciz'>Gizlenme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Soylu": {
        title: "Soylu",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Tarih</span> ve <span class='ciz'>İkna</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Şövalye": {
        title: "Alternatif Soylu (Şövalye)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Tarih</span> ve <span class='ciz'>İkna</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Suçlu": {
        title: "Suçlu",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Aldatma</span> ve <span class='ciz'>Gizlenme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Suçlu (Ajan)": {
        title: "Alternatif Suçlu (Ajan)",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Aldatma</span> ve <span class='ciz'>Gizlenme</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Yabancı": {
        title: "Yabancı",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Atletizim</span> ve <span class='ciz'>Hayatta Kalma</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    "Şarlatan": {
        title: "Şarlatan",
        description: "<hr><strong class='bold'>Beceri Uzmanlıkları:</strong><span class='ciz'>Aldatma</span> ve <span class='ciz'>El Çabukluğu</span> seçilmelidir. <brGeri kalan özellikleri Karakter Geçmişleri sayfasından bakınız."
    },
    // Diğer backgroundlar ve bilgileri buraya ekleyin
};

const updateBackgroundInfo = () => {
    const selectedBackground = document.getElementById('background').value;
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

document.getElementById('background').addEventListener('change', updateBackgroundInfo);

// ------------------------------CLASS İNFO-----------------------------------

const classInfoDiv = document.getElementById("class-info");

const classInfo = {
    Barbar: {
        title: "Barbar",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:  </strong> <span class='ciz'>Kuvvet</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:  </strong> <span class='ciz'>Dayanıklılık</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 12 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'>Hayvan İdaresi, Atletizm, Gözdağı, Doğa, Algı, ve Hayatta Kalma.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Ozan: {
        title: "Ozan",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Karizma</span><br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Çeviklik</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 8 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong><span class='ciz'>Tümü arasından 3 tane seç.</span><br>Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Rahip: {
        title: "Rahip",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Akıl</span>   <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Dayanıklılık</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 8 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'>Tarih, Sezgi, Tıp, İkna, ve Din.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Druid: {
        title: "Druid",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Akıl</span>   <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Dayanıklılık</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 8 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'> Arcana, Hayvan İdaresi, Sezgi, Tıp, Doğa, Algı, Din, ve Hayatta Kalma.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Savaşçı: {
        title: "Savaşçı",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Kuvvet</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Dayanıklılık</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 10 + Dayanıklılık bonus</span>u<br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'> Akrobasi, Hayvan İdaresi, Atletizm, Tarih, Sezgi, Gözdağı, Algı, ve Hayatta Kalma.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Keşiş: {
        title: "Keşiş",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Çeviklik</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Akıl</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 8 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'>Akrobasi, Atletizm, Tarih, Sezgi, Din, ve Gizlenme.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Paladin: {
        title: "Paladin",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Karizma</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Kuvvet</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 10 + Dayanıklılık bonus</span>u<br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'> Atletizm, Sezgi, Gözdağı, Tıp, İkna, ve Din.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Korucu: {
        title: "Korucu",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Çeviklik</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Akıl</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 10 + Dayanıklılık bonus</span>u<br><strong class='bold'>Beceriler:  </strong>Bunlardan 3 tanesini seç: <span class='ciz'> Hayvan İdaresi, Atletizm, Sezgi, İnceleme, Doğa, Algı, Gizlenme, ve Hayatta Kalma.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Hırsız: {
        title: "Düzenbaz",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Çeviklik</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Karizma</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 8 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 4 tanesini seç: <span class='ciz'> Akrobasi, Atletizm, Aldatma, Sezgi, Gözdağı, İnceleme, Algı, Performans, İkna, El Çabukluğu, ve Gizlenme.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Sihrbaz: {
        title: "Sihirbaz (Sorcerer)",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Karizma</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Dayanıklılık</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 6 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'> Arcana, Aldatma, Sezgi, Gözdağı, İkna, ve Din.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Warlock: {
        title: "Warlock",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Karizma</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Akıl</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 8 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'> Arcana, Aldatma, Tarih, Gözdağı, İnceleme, Doğa, ve Din.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    },
    Büyücü: {
        title: "Büyücü",
        description: "<hr><strong class='bold'>Tavsiye edilen birincil öncelikli stat:</strong> <span class='ciz'>Zeka</span> <br><strong class='bold'>Tavsiye edilen ikincil öncelikli stat:</strong> <span class='ciz'>Çeviklik</span><br><strong class='bold'>1. seviyede Hit Puanı: </strong><span class='ciz'> 6 + Dayanıklılık bonusu</span><br><strong class='bold'>Beceriler:  </strong>Bunlardan 2 tanesini seç: <span class='ciz'> Arcana, Tarih, Sezgi, İnceleme, Tıp, ve Din.</span><br> Geri kalan özellikleri Sınıflar sayfasından bakınız."
    }
};

const updateClassInfo = () => {
    const selectedClass = document.getElementById('class').value;
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


document.getElementById('class').addEventListener('change', updateClassInfo);

// -------------------------------SKİLL SLOT-----------------------------------------------

let remainingSkillSlots = 0; 

const skillSlotEksi = () => {
    if (remainingSkillSlots < 0) {
        document.getElementById('skill-slot-eksi').classList.remove('hidden');
    } else {
        document.getElementById('skill-slot-eksi').classList.add('hidden');
    }
}
function calculateSkillSlots() {
    let skillSlots = 0; // Yerel skillSlots değişkeni

    const selectedClass = document.getElementById('class').value;
    if (selectedClass === 'Barbar') {
        skillSlots += 2;
    } else if (selectedClass === 'Ozan') {
        skillSlots += 3;
    } else if (selectedClass === 'Rahip') {
        skillSlots += 2;
    }else if (selectedClass === 'Druid') {
        skillSlots += 2;
    }else if (selectedClass === 'Savaşçı') {
        skillSlots += 2;
    }else if (selectedClass === 'Keşiş') {
        skillSlots += 2;
    }else if (selectedClass === 'Paladin') {
        skillSlots += 2;
    }else if (selectedClass === 'Korucu') {
        skillSlots += 3;
    }else if (selectedClass === 'Hırsız') {
        skillSlots += 4;
    }else if (selectedClass === 'Sihrbaz') {
        skillSlots += 2;
    }else if (selectedClass === 'Warlock') {
        skillSlots += 2;
    }else if (selectedClass === 'Büyücü') {
        skillSlots += 2;
    }


    const selectedBackground = document.getElementById('background').value;
    const backgroundsWithBonus = [
        'Criminal', 'Halk Kahramanı', 'Bilge', 'Asker', 
        'Denizci', 'Korsan', 'Gösteri Adamı', 'Gösteri Adamı (Gladyatör)', 
        'Loca Zanaatkarı', 'Loca Tüccarı', 'Münzevi', 'Mürit', 
        'Sokak Çocuğu', 'Soylu', 'Şövalye', 'Suçlu', 'Suçlu (Ajan)', 
        'Yabancı', 'Şarlatan'
    ];

    if (backgroundsWithBonus.includes(selectedBackground)) {
        skillSlots += 2;
    }
    

    remainingSkillSlots = skillSlots; // remainingSkillSlots güncelle
    updateRemainingSkillSlots(); // remainingSkillSlots metnini güncelle
};
const updateRemainingSkillSlots = () => {
    document.getElementById('skill-slots').innerText = `Kalan Skill Yuvası: ${remainingSkillSlots}`; // Hesaplanan skillSlots değerini güncelle
    skillSlotEksi();
};

let strMod = 0;
let dexMod = 0;
let conMod = 0;
let intMod = 0;
let wisMod = 0;
let chaMod = 0;

const hesaplanmisBonus = () => {
    strMod = parseInt(document.getElementById('str-modifier').textContent, 10) || 0;
    dexMod = parseInt(document.getElementById('dex-modifier').textContent, 10) || 0;
    conMod = parseInt(document.getElementById('con-modifier').textContent, 10) || 0;
    intMod = parseInt(document.getElementById('int-modifier').textContent, 10) || 0;
    wisMod = parseInt(document.getElementById('wis-modifier').textContent, 10) || 0;
    chaMod = parseInt(document.getElementById('cha-modifier').textContent, 10) || 0;
};

const skillBonuses = {
    athletics: 0,
    acrobatics: 0,
    sleightOfHand: 0,
    stealth: 0,
    history: 0,
    religion: 0,
    investigation: 0,
    nature: 0,
    arcana: 0,
    animalHandling: 0,
    insight: 0,
    medicine: 0,
    perception: 0,
    survival: 0,
    deception: 0,
    persuasion: 0,
    performance: 0,
    intimidation: 0,
};

const skillBonuslariGuncelle = () => {
    skillBonuses.athletics = strMod;
    skillBonuses.acrobatics = dexMod;
    skillBonuses.stealth = dexMod;
    skillBonuses.sleightOfHand = dexMod;
    skillBonuses.history = intMod;
    skillBonuses.religion = intMod;
    skillBonuses.investigation = intMod;
    skillBonuses.nature = intMod;
    skillBonuses.arcana = intMod;
    skillBonuses.animalHandling = wisMod;
    skillBonuses.insight = wisMod;
    skillBonuses.medicine = wisMod;
    skillBonuses.perception = wisMod;
    skillBonuses.survival = wisMod;
    skillBonuses.deception = chaMod;
    skillBonuses.persuasion = chaMod;
    skillBonuses.performance = chaMod;
    skillBonuses.intimidation = chaMod;
};
const updateStatsAndSkills = () => {
    skillBonuslariGuncelle();
    hesaplanmisBonus(); 
    document.getElementById('athletics').innerHTML = skillBonuses.athletics;
    document.getElementById('acrobatics').innerHTML = skillBonuses.acrobatics;
    document.getElementById('stealth').innerHTML = skillBonuses.stealth;
    document.getElementById('sleightOfHand').innerHTML = skillBonuses.sleightOfHand;
    document.getElementById('history').innerHTML = skillBonuses.history;
    document.getElementById('religion').innerHTML = skillBonuses.religion;
    document.getElementById('investigation').innerHTML = skillBonuses.investigation;
    document.getElementById('nature').innerHTML = skillBonuses.nature;
    document.getElementById('arcana').innerHTML = skillBonuses.arcana;
    document.getElementById('animalHandling').innerHTML = skillBonuses.animalHandling;
    document.getElementById('insight').innerHTML = skillBonuses.insight;
    document.getElementById('medicine').innerHTML = skillBonuses.medicine;
    document.getElementById('perception').innerHTML = skillBonuses.perception;
    document.getElementById('survival').innerHTML = skillBonuses.survival;
    document.getElementById('deception').innerHTML = skillBonuses.deception;
    document.getElementById('persuasion').innerHTML = skillBonuses.persuasion;
    document.getElementById('performance').innerHTML = skillBonuses.performance;
    document.getElementById('intimidation').innerHTML = skillBonuses.intimidation;
    };

const toggleBonus = (skillId, buttonId, skillBonusKey, statName) => {
    const button = document.getElementById(buttonId);
    const statModifier = parseInt(document.getElementById(`${statName}-modifier`).textContent, 10) || 0;
    let skillTotal = statModifier + (skillBonuses[skillBonusKey] || 0);
    skillTotal = statModifier
    if (button.classList.contains('active')) {
        button.classList.remove('active');
        skillTotal = statModifier;
        remainingSkillSlots += 1;
    } else {
        button.classList.add('active');
        skillTotal = statModifier + 2;  // Buton aktif olduğunda +2 bonus eklenir
        remainingSkillSlots -= 1;
    }

    document.getElementById(skillId).textContent = skillTotal;
    updateRemainingSkillSlots();
    skillBonuslariGuncelle();
};


const resetAllButtons = () => {
    const skillButtons = document.querySelectorAll('.skillButton');
    skillButtons.forEach(button => {
        button.classList.remove('active');
    });
};

// Fonksiyonları window nesnesine atama
window.toggleBonusAthletics = () => toggleBonus('athletics', 'But-athletics', 'athletics', 'str');
window.toggleBonusAcrobatics = () => toggleBonus('acrobatics', 'But-acrobatics', 'acrobatics', 'dex');
window.toggleBonusSleightOfHand = () => toggleBonus('sleightOfHand', 'But-sleightOfHand', 'sleightOfHand', 'dex');
window.toggleBonusStealth = () => toggleBonus('stealth', 'But-stealth', 'stealth', 'dex');
window.toggleBonusHistory = () => toggleBonus('history', 'But-history', 'history', 'int');
window.toggleBonusReligion = () => toggleBonus('religion', 'But-religion', 'religion', 'int');
window.toggleBonusInvestigation = () => toggleBonus('investigation', 'But-investigation', 'investigation', 'int');
window.toggleBonusNature = () => toggleBonus('nature', 'But-nature', 'nature', 'int');
window.toggleBonusArcana = () => toggleBonus('arcana', 'But-arcana', 'arcana', 'int');
window.toggleBonusAnimalHandling = () => toggleBonus('animalHandling', 'But-animalHandling', 'animalHandling', 'wis');
window.toggleBonusInsight = () => toggleBonus('insight', 'But-insight', 'insight', 'wis');
window.toggleBonusMedicine = () => toggleBonus('medicine', 'But-medicine', 'medicine', 'wis');
window.toggleBonusPerception = () => toggleBonus('perception', 'But-perception', 'perception', 'wis');
window.toggleBonusSurvival = () => toggleBonus('survival', 'But-survival', 'survival', 'wis');
window.toggleBonusDeception = () => toggleBonus('deception', 'But-deception', 'deception', 'cha');
window.toggleBonusPersuasion = () => toggleBonus('persuasion', 'But-persuasion', 'persuasion', 'cha');
window.toggleBonusPerformance = () => toggleBonus('performance', 'But-performance', 'performance', 'cha');
window.toggleBonusIntimidation = () => toggleBonus('intimidation', 'But-intimidation', 'intimidation', 'cha');

document.getElementById('class').addEventListener('change', () => {
    resetAllButtons();
    calculateSkillSlots();
});

document.getElementById('background').addEventListener('change', () => {
    resetAllButtons();
    calculateSkillSlots();
});

calculateSkillSlots(); // Başlangıçta çağrılır

// -------------------------------POİNT BUY-----------------------------------------------



const guncelle = () => {
    // updateRaceBonuses();
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

const KaKa = () => {
    const selectedRace = document.getElementById('race').value;

    const selectedClass = document.getElementById('class').value;

    const selectedBackground = document.getElementById('background').value;

    const dexModifierText = document.getElementById('dex-modifier').innerText;
    const dexModifier = parseInt(dexModifierText, 10); // veya parseFloat eğer ondalıklı bir değer varsa
    const AC = dexModifier + 10;

    const wisModifierText = document.getElementById('wis-modifier').innerText;
    const wisModifier = parseInt(wisModifierText, 10); // veya parseFloat eğer ondalıklı bir değer varsa
    const PP = wisModifier + 10;
    
    // Mevcut statları ve verileri al
    const stats = {
        str: {
            total: document.getElementById('str-total').innerText,
            modifier: document.getElementById('str-modifier').innerText,
        },
        dex: {
            total: document.getElementById('dex-total').innerText,
            modifier: document.getElementById('dex-modifier').innerText,
        },
        con: {
            total: document.getElementById('con-total').innerText,
            modifier: document.getElementById('con-modifier').innerText,
        },
        int: {
            total: document.getElementById('int-total').innerText,
            modifier: document.getElementById('int-modifier').innerText,
        },
        wis: {
            total: document.getElementById('wis-total').innerText,
            modifier: document.getElementById('wis-modifier').innerText,
        },
        cha: {
            total: document.getElementById('cha-total').innerText,
            modifier: document.getElementById('cha-modifier').innerText,
        }
    };
    const skills = {
        athletics: {
            modifier: document.getElementById('athletics').innerText,
        },
        acrobatics: {
            modifier: document.getElementById('acrobatics').innerText,
        },
        sleightOfHand: {
            modifier: document.getElementById('sleightOfHand').innerText,
        },
        stealth: {
            modifier: document.getElementById('stealth').innerText,
        },
        history: {
            modifier: document.getElementById('history').innerText,
        },
        religion: {
            modifier: document.getElementById('religion').innerText,
        },
        investigation: {
            modifier: document.getElementById('investigation').innerText,
        },
        nature: {
            modifier: document.getElementById('nature').innerText,
        },
        arcana: {
            modifier: document.getElementById('arcana').innerText,
        },
        animalHandling: {
            modifier: document.getElementById('animalHandling').innerText,
        },
        insight: {
            modifier: document.getElementById('insight').innerText,
        },
        medicine: {
            modifier: document.getElementById('medicine').innerText,
        },
        perception: {
            modifier: document.getElementById('perception').innerText,
        },
        survival: {
            modifier: document.getElementById('survival').innerText,
        },
        deception: {
            modifier: document.getElementById('deception').innerText,
        },
        persuasion: {
            modifier: document.getElementById('persuasion').innerText,
        },
        performance: {
            modifier: document.getElementById('performance').innerText,
        },
        intimidation: {
            modifier: document.getElementById('intimidation').innerText,
        },
    };
        
    

    // Yeni bir sekme aç ve HTML içeriğini oluştur
    const newTab = window.open();
    newTab.document.write(`
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>D&D Karakter Kağıdı</title>
    <link rel="stylesheet" href="stylesKaKa.css">
    <style>
        .checkbox {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            border: 2px solid #ccc;
            cursor: pointer;
            vertical-align: middle;
        }
        
        .checkbox.checked {
            background-color: #333; /* İçi dolu olduğunda yeşil renkte olacak */
        }
    </style>
</head>
<body> 
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('.checkbox').forEach(function(checkbox) {
                checkbox.addEventListener('click', function() {
                    // İkona tıklanınca checked sınıfı eklenir veya kaldırılır
                    this.classList.toggle('checked');
                });
            });
        });
    </script>
    <!-- <div id=""></div> -->
    <div class="container">
        <div id="ust"><div id="ust-isim">
            <div id="isim">Karakter İsmi:<textarea id="noteArea-isim" placeholder="Notlarınızı buraya yazın..."></textarea></div></div>
            <div id="ozellikler">
                <div id="ozellikler-ust">
                    <div id="classLevel">Sınıf/ Level:<textarea id="noteArea-ust" placeholder="Class/ Level">${selectedClass}/ Level:1</textarea></div>
                    <div id="background">Karakter Geçmişi:<textarea id="noteArea-ust" placeholder="Karakter Geçmişi">${selectedBackground}</textarea></div>
                    <div id="PlayerName">Oyuncu İsmi:<textarea id="noteArea-ust" placeholder="Oyuncu İsmi"></textarea></div>
                </div>
                <div id="ozellikler-alt">
                    <div id="race">Irk:<textarea id="noteArea-alt" placeholder="Irk">${selectedRace}</textarea></div>
                    <div id="alignment">Alignment:<textarea id="noteArea-alt" placeholder="Alignment"></textarea></div>
                    <div id="EP">Deneyim Puanı:<textarea id="noteArea-alt" placeholder="Deneyim Puanı"></textarea></div>
                </div>
            </div>
        </div>
        <div id="alt">
<!-- ------------------------------------------------------------------------------- -->    
            <div id="sol">
                <div id="sol-ust">
                    <div id="sol-ust-sol">
                        <div id="inspration"><span class="checkbox" id="str-checkbox"></span>          İnspration   </div>
                        <div id="stats">
                            <div id="str"><strong class='bold'>Str</strong> <br><br> ${stats.str.modifier} <br><br>${stats.str.total}</div>
                            <div id="dex"><strong class='bold'>Dex</strong> <br><br> ${stats.dex.modifier} <br><br>${stats.dex.total}</div>
                            <div id="con"><strong class='bold'>Con</strong> <br><br> ${stats.con.modifier} <br><br>${stats.con.total}</div>
                            <div id="int"><strong class='bold'>İnt</strong> <br><br> ${stats.int.modifier} <br><br>${stats.int.total}</div>
                            <div id="wis"><strong class='bold'>Wis</strong> <br><br> ${stats.wis.modifier} <br><br>${stats.wis.total}</div>
                            <div id="cha"><strong class='bold'>Cha</strong> <br><br> ${stats.cha.modifier} <br><br>${stats.cha.total}</div>
                        </div>
                    </div>
                    <div id="sol-ust-sag">
                        <div id="yetenekler">
                            <div id="Proficiency">(+2)       Proficiency Bonus  </div>
                            <div id="kurtarma"><table>
                                <tbody><tr>
                                    <th>Prf</th>
                                    <th>Kurtarma at</th>
                                    <th>Skor</th>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="str-checkbox"></span></td>
                                    <td>Strenght</td>
                                    <td>${stats.str.modifier}</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="dex-checkbox"></span></td>
                                    <td>Dexterity</td>
                                    <td>${stats.dex.modifier}</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="con-checkbox"></span></td>
                                    <td>Constution</td>
                                    <td>${stats.con.modifier}</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="int-checkbox"></span></td>
                                    <td>İntelligence</td>
                                    <td>${stats.int.modifier}</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="wis-checkbox"></span></td>
                                    <td>Wisdom</td>
                                    <td>${stats.wis.modifier}</td>
                                </tr>
                                <tr>
                                    <td><span class="checkbox" id="cha-checkbox"></span></td>
                                    <td>Charizma</td>
                                    <td>${stats.cha.modifier}</td>
                                </tr>
                                </tbody></table>
                            </div>
                            <div id="skills">
                                <table>
                                    <tbody>
                                        <tr>
                                            <th>Prf</th>
                                            <th>Skill</th>
                                            <th>Skor</th>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="athletics-checkbox"></span></td>
                                            <td>Athletics</td>
                                            <td><span id="athletics-bonus">${skills.athletics.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="acrobatics-checkbox"></span></td>
                                            <td>Acrobatics</td>
                                            <td><span id="acrobatics-bonus">${skills.acrobatics.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="sleightOfHand-checkbox"></span></td>
                                            <td>Sleight of Hand</td>
                                            <td><span id="sleightOfHand-bonus">${skills.sleightOfHand.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="stealth-checkbox"></span></td>
                                            <td>Stealth</td>
                                            <td><span id="stealth-bonus">${skills.stealth.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="history-checkbox"></span></td>
                                            <td>History</td>
                                            <td><span id="history-bonus">${skills.history.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="religion-checkbox"></span></td>
                                            <td>Religion</td>
                                            <td><span id="religion-bonus">${skills.religion.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="investigation-checkbox"></span></td>
                                            <td>Investigation</td>
                                            <td><span id="investigation-bonus">${skills.investigation.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="nature-checkbox"></span></td>
                                            <td>Nature</td>
                                            <td><span id="nature-bonus">${skills.nature.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="arcana-checkbox"></span></td>
                                            <td>Arcana</td>
                                            <td><span id="arcana-bonus">${skills.arcana.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="animalHandling-checkbox"></span></td>
                                            <td>Animal Handling</td>
                                            <td><span id="animalHandling-bonus">${skills.animalHandling.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="insight-checkbox"></span></td>
                                            <td>Insight</td>
                                            <td><span id="insight-bonus">${skills.insight.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="medicine-checkbox"></span></td>
                                            <td>Medicine</td>
                                            <td><span id="medicine-bonus">${skills.medicine.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="perception-checkbox"></span></td>
                                            <td>Perception</td>
                                            <td><span id="perception-bonus">${skills.perception.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="survival-checkbox"></span></td>
                                            <td>Survival</td>
                                            <td><span id="survival-bonus">${skills.survival.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="deception-checkbox"></span></td>
                                            <td>Deception</td>
                                            <td><span id="deception-bonus">${skills.deception.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="persuasion-checkbox"></span></td>
                                            <td>Persuasion</td>
                                            <td><span id="persuasion-bonus">${skills.persuasion.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="performance-checkbox"></span></td>
                                            <td>Performance</td>
                                            <td><span id="performance-bonus">${skills.performance.modifier}</span></td>
                                        </tr>
                                        <tr>
                                            <td><span class="checkbox" id="intimidation-checkbox"></span></td>
                                            <td>Intimidation</td>
                                            <td><span id="intimidation-bonus">${skills.intimidation.modifier}</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div> 
                    </div>
                </div>
                <div id="sol-alt">
                    <div id="PP">(${PP}) Pasive Perception</div>
                    <div id="ozelliklerDiller">Diğer Özellikler ve Diller <hr> 
                        <textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea>
                    </div>
                </div>
            </div>
<!-- ------------------------------------------------------------------------------- -->
            <div id="orta">
                <div id="orta-ust">
                    <div id="orta-ust-ust">
                        <div id="ac">${AC}<br>AC</div>
                        <div id="iniativ">${stats.dex.modifier}<br> İniative</div>
                        <div id="speed">30<br>Speed</div>
                    </div>
                    <div id="orta-ust-orta">
                        <div id="CHitPoint">Max Hit Point= 30 <br>Current Hit Point</div>
                        <div id="THitPoint">+5 <br>Temporary Hit Point</div>
                    </div>
                    <div id="orta-ust-alt">
                        <div id="HitDice">Total= 3d12<br>Hit Dice<br>1d12</div>
                        <div id="DeathSaves">+ + + <br>+ + + <br>Death Saves</div>
                    </div>
                </div>
                <div id="orta-orta">
                <div id="saldırı">
                    <table>
                        <tbody><tr>
                            <th>NAME</th>
                            <th>ATK BONUS</th>
                            <th>DAMAGE/ TYPE</th>
                        </tr>
                        <tr>
                            <td>Strenght</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Dexterity</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Constution</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>İntelligence</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Wisdom</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                        <tr>
                            <td>Charizma</td>
                            <td>-1</td>
                            <td>-1</td>
                        </tr>
                    </tbody></table>
                   </div> 
                </div>
                <div id="orta-alt">
                    <div id="para">
                        <table>
                            <tbody><tr>
                                <th>Değer</th>
                                <th>Miktar</th>

                            </tr>
                            <tr>
                                <td>PP</td>
                                <td>10</td>
                            </tr>
                            <tr>
                                <td>GP</td>
                                <td>10</td>
                            </tr>
                            <tr>
                                <td>SP</td>
                                <td>10</td>
                            </tr>
                            <tr>
                                <td>CP</td>
                                <td>10</td>
                            </tr>
                        </tbody></table>
                    </div>
                    <div id="ekipman">Ekipman <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                </div>
            </div>
<!-- ------------------------------------------------------------------------------- -->
            <div id="sag">
                <div id="sag-ust">
                    <div id="kisilik">Kişilik Özellikleri <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                    <div id="ideals">İdealler <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                    <div id="bonds">Bond <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                    <div id="flaws">Flaws <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
                </div>
                <div id="sag-alt">FEATURES & TRAITS <hr><textarea id="noteArea" placeholder="Notlarınızı buraya yazın..."></textarea></div>
            </div>
<!-- ------------------------------------------------------------------------------- -->     
        </div>
    
    </div>
</body>
</html>
    `);
    newTab.document.close();
};
