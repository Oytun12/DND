document.querySelectorAll('.checkbox').forEach(function(checkbox) {
    checkbox.addEventListener('click', function() {
        // İkona tıklanınca checked sınıfı eklenir veya kaldırılır
        this.classList.toggle('checked');
    });
});

let profB = 2;

const stats = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0
};

const statsB = {
    strB: 0,
    dexB: 0,
    conB: 0,
    intB: 0,
    wisB: 0,
    chaB: 0
};

let skills = {
    athletics      : statsB.strB,       // STR
    acrobatics     : statsB.dexB,       // DEX
    sleightOfHand  : statsB.dexB,       // DEX
    stealth        : statsB.dexB,       // DEX
    arcana         : statsB.intB,       // INT
    history        : statsB.intB,       // INT
    investigation  : statsB.intB,       // INT
    nature         : statsB.intB,       // INT
    religion       : statsB.intB,       // INT
    animalHandling : statsB.wisB,       // WIS
    insight        : statsB.wisB,       // WIS
    medicine       : statsB.wisB,       // WIS
    perception     : statsB.wisB,       // WIS
    survival       : statsB.wisB,       // WIS
    deception      : statsB.chaB,       // CHA
    intimidation   : statsB.chaB,       // CHA
    performance    : statsB.chaB,       // CHA
    persuasion     : statsB.chaB        // CHA
};


document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('change', function() {
        const min = parseInt(this.min);
        const max = parseInt(this.max);
        let value = parseInt(this.value);

        if (value < min) {
            this.value = min;
        } else if (value > max) {
            this.value = max;
        }
    });
});


const girdiGeldiğinde = () => {
    stats.str = parseInt(document.getElementById('strInput').value);
    stats.dex = parseInt(document.getElementById('dexInput').value);
    stats.con = parseInt(document.getElementById('conInput').value);
    stats.int = parseInt(document.getElementById('intInput').value);
    stats.wis = parseInt(document.getElementById('wisInput').value);
    stats.cha = parseInt(document.getElementById('chaInput').value);

    profB  = parseInt(document.getElementById('ProfInput').value);

};

const statBonusHesapla=()=>{
    statsB.strB = Math.floor((stats.str - 10) / 2);
    statsB.dexB = Math.floor((stats.dex - 10) / 2);
    statsB.conB = Math.floor((stats.con - 10) / 2);
    statsB.intB = Math.floor((stats.int - 10) / 2);
    statsB.wisB = Math.floor((stats.wis - 10) / 2);
    statsB.chaB = Math.floor((stats.cha - 10) / 2);
};

const updateStatBonuses = () => {
    document.getElementById('strBonus').innerText = statsB.strB >= 0 ? `+${statsB.strB}` : `${statsB.strB}`;
    document.getElementById('dexBonus').innerText = statsB.dexB >= 0 ? `+${statsB.dexB}` : `${statsB.dexB}`;
    document.getElementById('conBonus').innerText = statsB.conB >= 0 ? `+${statsB.conB}` : `${statsB.conB}`;
    document.getElementById('intBonus').innerText = statsB.intB >= 0 ? `+${statsB.intB}` : `${statsB.intB}`;
    document.getElementById('wisBonus').innerText = statsB.wisB >= 0 ? `+${statsB.wisB}` : `${statsB.wisB}`;
    document.getElementById('chaBonus').innerText = statsB.chaB >= 0 ? `+${statsB.chaB}` : `${statsB.chaB}`;
};

function updateSavingThrows() {
    Object.keys(stats).forEach(stat => {
        const isChecked = document.getElementById(`${stat}-checkbox`).checked;
        const savingThrow = statsB[`${stat}B`] + (isChecked ? profB : 0);
        document.getElementById(`${stat}-saving`).textContent = savingThrow >= 0 ? `+${savingThrow}` : `${savingThrow}`;
    });
}

document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateSavingThrows);
});


function updateSkills() {
    skills = {
        athletics      : statsB.strB,       // STR
        acrobatics     : statsB.dexB,       // DEX
        sleightOfHand  : statsB.dexB,       // DEX
        stealth        : statsB.dexB,       // DEX
        arcana         : statsB.intB,       // INT
        history        : statsB.intB,       // INT
        investigation  : statsB.intB,       // INT
        nature         : statsB.intB,       // INT
        religion       : statsB.intB,       // INT
        animalHandling : statsB.wisB,       // WIS
        insight        : statsB.wisB,       // WIS
        medicine       : statsB.wisB,       // WIS
        perception     : statsB.wisB,       // WIS
        survival       : statsB.wisB,       // WIS
        deception      : statsB.chaB,       // CHA
        intimidation   : statsB.chaB,       // CHA
        performance    : statsB.chaB,       // CHA
        persuasion     : statsB.chaB        // CHA
    };
    
    let PP = statsB.wisB;
    document.getElementById(`PP`).innerHTML = PP >= 0 ? `(+${PP}) Pasive Perception`:`(${PP}) Pasive Perception`;

    let AC = 10 + statsB.dexB;
    document.getElementById(`ac`).innerHTML = `<input type="number" id="acInput" name="acInput" value="${AC}" min="9" max="25" class="input"><br>AC`;
                                                       
    let iniativ = statsB.dexB;
    document.getElementById(`iniativ`).innerHTML = iniativ >= 0 ? `+${iniativ} <br> İniative`:`${iniativ} <br> İniative`;
                                                       
    // let X = parseInt(document.getElementById(`X`).value);
    // document.getElementById(`HitDice`).innerHTML =  `Total= <input type="number" id="X" name="XInput" value="1" min="1" max="9" class="input">d<input type="number" id="D" name="DInput" value="6" min="6" max="12" class="input"><br>Hit Dice<br>${X}d12`;
                                                       
}



function updateSkillProf() {
    Object.keys(skills).forEach(skill => {
        const isChecked = document.getElementById(`${skill}-checkbox`).checked;
        const baseSkill = skills[skill];
        const skillP = baseSkill + (isChecked ? profB : 0);
        document.getElementById(`${skill}-bonus`).textContent = skillP >= 0 ? `+${skillP}` : `${skillP}`;
    });
}

// Checkbox'lara tıklanınca update fonksiyonunu çalıştırma
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        updateSkills();       // Statlara bağlı olarak skill'leri güncelle
        updateSkillProf();    // Proficiency bonusunu ekle
    });
});

const guncelle = () => {
    girdiGeldiğinde();
    statBonusHesapla();
    updateStatBonuses();
    updateSkills();
    updateSkills();           // Statlara bağlı olarak skill'leri güncelle
    updateSkillProf();        // Proficiency bonusunu ekle
    updateSavingThrows();
};

document.addEventListener('DOMContentLoaded', () => {
    guncelle();

    document.getElementById('strInput').addEventListener('change', guncelle);
    document.getElementById('dexInput').addEventListener('change', guncelle);
    document.getElementById('conInput').addEventListener('change', guncelle);
    document.getElementById('intInput').addEventListener('change', guncelle);
    document.getElementById('wisInput').addEventListener('change', guncelle);
    document.getElementById('chaInput').addEventListener('change', guncelle);

    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('change', guncelle);
    });
});