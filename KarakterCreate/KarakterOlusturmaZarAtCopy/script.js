function d6() {
    return Math.floor(Math.random() * 6) + 1;
}

function rollStat() {
    let rolls = [d6(), d6(), d6(), d6()];
    rolls.sort((a, b) => a - b);
    return {
        total: rolls[1] + rolls[2] + rolls[3],
        rolls: rolls
    };
} 


let race = {
    str: 0,
    dex: 0,
    con: 0,
    int: 0,
    wis: 0,
    cha: 0,
};

document.getElementById('race').addEventListener('change', function() {
    if (this.value == "Human") {
        race.str = 1;
        race.dex = 1;
        race.con = 1;
        race.int = 1;
        race.wis = 1;
        race.cha = 1;
    } 
    // if (this.value == "HumanVariant") {
    //     race.str = 0;
    //     race.dex = 0;
    //     race.con = 0;
    //     race.int = 0;
    //     race.wis = 0;
    //     race.cha = 0;
    //     // Alternatif İnsan için oyuncunun hangi statları seçeceğine bağlı olarak kod eklenmelidir.
    // } 
    if (this.value == "Elf(Ulu)") {
        race.str = 0;
        race.dex = 2;
        race.con = 0;
        race.int = 1;
        race.wis = 0;
        race.cha = 0;
    } 
    if (this.value == "Elf(Or)") {
        race.str = 0;
        race.dex = 2;
        race.con = 0;
        race.int = 0;
        race.wis = 1;
        race.cha = 0;
    } 
    if (this.value == "Elf(Drow)") {
        race.str = 0;
        race.dex = 2;
        race.con = 0;
        race.int = 0;
        race.wis = 0;
        race.cha = 1;
    } 
    if (this.value == "Dwarf(Dağ)") {
        race.str = 0;
        race.dex = 0;
        race.con = 2;
        race.int = 0;
        race.wis = 0;
        race.cha = 0;
    } 
    if (this.value == "Dwarf(Tepe)") {
        race.str = 0;
        race.dex = 0;
        race.con = 2;
        race.int = 0;
        race.wis = 0;
        race.cha = 0;
    } 
    if (this.value == "Halfling(Tez)") {
        race.str = 0;
        race.dex = 2;
        race.con = 0;
        race.int = 0;
        race.wis = 0;
        race.cha = 0;
    } 
    if (this.value == "Halfling(Tık)") {
        race.str = 0;
        race.dex = 2;
        race.con = 0;
        race.int = 0;
        race.wis = 0;
        race.cha = 0;
    } 
    if (this.value == "Dragonborn") {
        race.str = 2;
        race.dex = 0;
        race.con = 0;
        race.int = 0;
        race.wis = 0;
        race.cha = 1;
    } 
    if (this.value == "Gnome(Kaya)") {
        race.str = 0;
        race.dex = 0;
        race.con = 0;
        race.int = 2;
        race.wis = 0;
        race.cha = 0;
    } 
    if (this.value == "Gnome(Or)") {
        race.str = 0;
        race.dex = 0;
        race.con = 0;
        race.int = 2;
        race.wis = 0;
        race.cha = 0;
    } 
    if (this.value == "Tiefling") {
        race.str = 0;
        race.dex = 0;
        race.con = 0;
        race.int = 1;
        race.wis = 0;
        race.cha = 2;
    } 
    // if (this.value == "Yarı-Elf") {
    //     race.str = 0;
    //     race.dex = 0;
    //     race.con = 0;
    //     race.int = 0;
    //     race.wis = 0;
    //     race.cha = 2;
    //     // Yarı-Elf için oyuncunun iki stat seçmesi gerekiyor.
    // } 
    if (this.value == "Yarı-Orc") {
        race.str = 2;
        race.dex = 0;
        race.con = 1;
        race.int = 0;
        race.wis = 0;
        race.cha = 0;
    }
    guncelle();
});

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

// ----------------------SKİLL STAT-------------------------------------------

function updateStat(statId, rollId) {
    const stat = rollStat();
    document.getElementById(statId).innerText = stat.total;
    document.getElementById(rollId).innerText = `(${stat.rolls.join(', ')})`;

    const total = parseInt(stat.total) + parseInt(race[statId]);
    const modifier = Math.floor((total - 10) / 2);
    document.getElementById(`${statId}-race`).innerText = race[statId];
    document.getElementById(`${statId}-total`).innerText = total;
    document.getElementById(`${statId}-modifier`).innerText = modifier;

    if (statId === "str") {
        skillBonuses.athletics = modifier;
    } 
    if (statId === "dex")  {
        skillBonuses.acrobatics = modifier;
        skillBonuses.stealth = modifier;
        skillBonuses.sleightOfHand = modifier;
    } 
    if (statId === "int")  {
        skillBonuses.history = modifier;
        skillBonuses.religion = modifier;
        skillBonuses.investigation = modifier;
        skillBonuses.nature = modifier;
        skillBonuses.arcana = modifier;
    } 
    if (statId === "wis")  {
        skillBonuses.animalHandling = modifier;
        skillBonuses.insight = modifier;
        skillBonuses.medicine = modifier;
        skillBonuses.perception = modifier;
        skillBonuses.survival = modifier;
    } 
    if (statId === "cha")  {
        skillBonuses.deception = modifier;
        skillBonuses.persuasion = modifier;
        skillBonuses.performance = modifier;
        skillBonuses.intimidation = modifier;
    }

    updateSkills();
}
function updateRace(statId) {

    // Fetch the race and total elements and ensure they're numbers
    const raceElement = document.getElementById(`${statId}-race`);
    const totalElement = document.getElementById(`${statId}-total`);

    const raceValue = parseInt(raceElement ? raceElement.innerText : '0', 10);
    const totalValue = parseInt(totalElement ? totalElement.innerText : '0', 10);

    // Calculate the new total and modifier
    const total = totalValue + raceValue;
    const modifier = Math.floor((total - 10) / 2) + race[statId];

    // Update the DOM with the new values
    totalElement.innerText = total;
    document.getElementById(`${statId}-modifier`).innerText = modifier;
    document.getElementById(`${statId}-total`).innerText = parseInt(totalElement) + parseInt(race[statId]);
    document.getElementById(`${statId}-race`).innerText = race[statId];

    if (statId === "str") {
        skillBonuses.athletics = modifier;
    } 
    if (statId === "dex")  {
        skillBonuses.acrobatics = modifier;
        skillBonuses.stealth = modifier;
        skillBonuses.sleightOfHand = modifier;
    } 
    if (statId === "int")  {
        skillBonuses.history = modifier;
        skillBonuses.religion = modifier;
        skillBonuses.investigation = modifier;
        skillBonuses.nature = modifier;
        skillBonuses.arcana = modifier;
    } 
    if (statId === "wis")  {
        skillBonuses.animalHandling = modifier;
        skillBonuses.insight = modifier;
        skillBonuses.medicine = modifier;
        skillBonuses.perception = modifier;
        skillBonuses.survival = modifier;
    } 
    if (statId === "cha")  {
        skillBonuses.deception = modifier;
        skillBonuses.persuasion = modifier;
        skillBonuses.performance = modifier;
        skillBonuses.intimidation = modifier;
    }

    updateSkills();
}

// -----------------------------GÜNCELLEME-------------------------------------

const updateSkills = () => {
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
const guncelle = () =>{
    updateRace('str');
    updateRace('dex');
    updateRace('con');
    updateRace('int');
    updateRace('wis');
    updateRace('cha');
};
document.getElementById('rollStats').addEventListener('click', function() {
    updateStat('str', 'strRolls');
    updateStat('dex', 'dexRolls');
    updateStat('con', 'conRolls');
    updateStat('int', 'intRolls');
    updateStat('wis', 'wisRolls');
    updateStat('cha', 'chaRolls');
});

document.getElementById('str-name').addEventListener('click', function() {
    updateStat('str', 'strRolls');

});

document.getElementById('dex-name').addEventListener('click', function() {
    updateStat('dex', 'dexRolls');
});

document.getElementById('con-name').addEventListener('click', function() {
    updateStat('con', 'conRolls');
});

document.getElementById('int-name').addEventListener('click', function() {
    updateStat('int', 'intRolls');
});

document.getElementById('wis-name').addEventListener('click', function() {
    updateStat('wis', 'wisRolls');
});

document.getElementById('cha-name').addEventListener('click', function() {
    updateStat('cha', 'chaRolls');
});

// -----------------------------Check-boxs-----------------------------------------------------------------------

const proficiencyBonus = 2;

// Checkboxlar için event listener ekleyelim
document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        const skillId = this.id.replace('Checkbox', ''); // Checkbox id'sinden skill id'sini buluyoruz
        if (this.checked) {
            // Checkbox işaretlendiyse proficiency bonusunu ekleyelim
            skillBonuses[skillId] += proficiencyBonus;
        } else {
            // Checkbox işaret kaldırıldığında proficiency bonusunu çıkaralım
            skillBonuses[skillId] -= proficiencyBonus;
        }
        updateSkills(); // Skill değerlerini güncelleyelim
    });
});