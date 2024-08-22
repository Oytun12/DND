document.querySelectorAll('.checkbox').forEach(function(checkbox) {
    checkbox.addEventListener('click', function() {
        // İkona tıklanınca checked sınıfı eklenir veya kaldırılır
        this.classList.toggle('checked');
    });
});

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
    athletics      : 0,      // STR
    acrobatics     : 0,      // DEX
    sleightOfHand  : 0,      // DEX
    stealth        : 0,      // DEX
    arcana         : 0,      // INT
    history        : 0,      // INT
    investigation  : 0,      // INT
    nature         : 0,      // INT
    religion       : 0,      // INT
    animalHandling : 0,      // WIS
    insight        : 0,      // WIS
    medicine       : 0,      // WIS
    perception     : 0,      // WIS
    survival       : 0,      // WIS
    deception      : 0,      // CHA
    intimidation   : 0,      // CHA
    performance    : 0,      // CHA
    persuasion     : 0       // CHA
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

const updateSkills = () => {
    skills.athletics      = statsB.strB;       // STR
    skills.acrobatics     = statsB.dexB;       // DEX
    skills.sleightOfHand  = statsB.dexB;       // DEX
    skills.stealth        = statsB.dexB;       // DEX
    skills.arcana         = statsB.intB;       // INT
    skills.history        = statsB.intB;       // INT
    skills.investigation  = statsB.intB;       // INT
    skills.nature         = statsB.intB;       // INT
    skills.religion       = statsB.intB;       // INT
    skills.animalHandling = statsB.wisB;       // WIS
    skills.insight        = statsB.wisB;       // WIS
    skills.medicine       = statsB.wisB;       // WIS
    skills.perception     = statsB.wisB;       // WIS
    skills.survival       = statsB.wisB;       // WIS
    skills.deception      = statsB.chaB;       // CHA
    skills.intimidation   = statsB.chaB;       // CHA
    skills.performance    = statsB.chaB;       // CHA
    skills.persuasion     = statsB.chaB;       // CHA
};    
const updateSkillBonuses = () => {
    document.getElementById('athletics-bonus').textContent      = skills.athletics >= 0 ? `+${skills.athletics}` : `${skills.athletics}`;
    document.getElementById('acrobatics-bonus').textContent     = skills.acrobatics >= 0 ? `+${skills.acrobatics}` : `${skills.acrobatics}`;
    document.getElementById('sleightOfHand-bonus').textContent  = skills.sleightOfHand >= 0 ? `+${skills.sleightOfHand}` : `${skills.sleightOfHand}`;
    document.getElementById('stealth-bonus').textContent        = skills.stealth >= 0 ? `+${skills.stealth}` : `${skills.stealth}`;
    document.getElementById('arcana-bonus').textContent         = skills.arcana >= 0 ? `+${skills.arcana}` : `${skills.arcana}`;
    document.getElementById('history-bonus').textContent        = skills.history >= 0 ? `+${skills.history}` : `${skills.history}`;
    document.getElementById('investigation-bonus').textContent  = skills.investigation >= 0 ? `+${skills.investigation}` : `${skills.investigation}`;
    document.getElementById('nature-bonus').textContent         = skills.nature >= 0 ? `+${skills.nature}` : `${skills.nature}`;
    document.getElementById('religion-bonus').textContent       = skills.religion >= 0 ? `+${skills.religion}` : `${skills.religion}`;
    document.getElementById('animalHandling-bonus').textContent = skills.animalHandling >= 0 ? `+${skills.animalHandling}` : `${skills.animalHandling}`;
    document.getElementById('insight-bonus').textContent        = skills.insight >= 0 ? `+${skills.insight}` : `${skills.insight}`;
    document.getElementById('medicine-bonus').textContent       = skills.medicine >= 0 ? `+${skills.medicine}` : `${skills.medicine}`;
    document.getElementById('perception-bonus').textContent     = skills.perception >= 0 ? `+${skills.perception}` : `${skills.perception}`;
    document.getElementById('survival-bonus').textContent       = skills.survival >= 0 ? `+${skills.survival}` : `${skills.survival}`;
    document.getElementById('deception-bonus').textContent      = skills.deception >= 0 ? `+${skills.deception}` : `${skills.deception}`;
    document.getElementById('persuasion-bonus').textContent     = skills.persuasion >= 0 ? `+${skills.persuasion}` : `${skills.persuasion}`;
    document.getElementById('performance-bonus').textContent    = skills.performance >= 0 ? `+${skills.performance}` : `${skills.performance}`;
    document.getElementById('intimidation-bonus').textContent   = skills.intimidation >= 0 ? `+${skills.intimidation}` : `${skills.intimidation}`;
};

const guncelle = () => {
    girdiGeldiğinde();
    statBonusHesapla();
    updateStatBonuses();
    updateSkills();
    updateSkillBonuses();
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