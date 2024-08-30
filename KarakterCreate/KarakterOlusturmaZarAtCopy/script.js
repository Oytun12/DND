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

const race = {
    str: 1,
    dex: 2,
    con: 3,
    int: 4,
    wis: 5,
    cha: 6,
}

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