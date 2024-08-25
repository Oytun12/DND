function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function rollStat() {
    let rolls = [rollDice(), rollDice(), rollDice(), rollDice()];
    rolls.sort((a, b) => a - b);
    return {
        total: rolls[1] + rolls[2] + rolls[3],
        rolls: rolls
    };
}

function updateStats() {
    const str = rollStat();
    const dex = rollStat();
    const con = rollStat();
    const int = rollStat();
    const wis = rollStat();
    const cha = rollStat();

    document.getElementById('str').innerText = str.total;
    document.getElementById('strRolls').innerText = `(${str.rolls.join(', ')})`;

    document.getElementById('dex').innerText = dex.total;
    document.getElementById('dexRolls').innerText = `(${dex.rolls.join(', ')})`;

    document.getElementById('con').innerText = con.total;
    document.getElementById('conRolls').innerText = `(${con.rolls.join(', ')})`;

    document.getElementById('int').innerText = int.total;
    document.getElementById('intRolls').innerText = `(${int.rolls.join(', ')})`;

    document.getElementById('wis').innerText = wis.total;
    document.getElementById('wisRolls').innerText = `(${wis.rolls.join(', ')})`;

    document.getElementById('cha').innerText = cha.total;
    document.getElementById('chaRolls').innerText = `(${cha.rolls.join(', ')})`;

    updateSkills(str.total, dex.total, con.total, int.total, wis.total, cha.total);
}

function updateSkills(str, dex, con, int, wis, cha) {
    updateSkill('acrobatics', dex, 'acrobaticsCheckbox');
    updateSkill('animalHandling', wis, 'animalHandlingCheckbox');
    updateSkill('arcana', int, 'arcanaCheckbox');
    updateSkill('athletics', str, 'athleticsCheckbox');
    updateSkill('deception', cha, 'deceptionCheckbox');
    updateSkill('history', int, 'historyCheckbox');
    updateSkill('insight', wis, 'insightCheckbox');
    updateSkill('intimidation', cha, 'intimidationCheckbox');
    updateSkill('investigation', int, 'investigationCheckbox');
    updateSkill('medicine', wis, 'medicineCheckbox');
    updateSkill('nature', int, 'natureCheckbox');
    updateSkill('perception', wis, 'perceptionCheckbox');
    updateSkill('performance', cha, 'performanceCheckbox');
    updateSkill('persuasion', cha, 'persuasionCheckbox');
    updateSkill('religion', int, 'religionCheckbox');
    updateSkill('sleightOfHand', dex, 'sleightOfHandCheckbox');
    updateSkill('stealth', dex, 'stealthCheckbox');
    updateSkill('survival', wis, 'survivalCheckbox');
}

function updateSkill(skillId, baseValue, checkboxId) {
    let skillBonus = baseValue;
    const checkbox = document.getElementById(checkboxId);
    if (checkbox.checked) {
        skillBonus += 2;
    }
    document.getElementById(skillId).innerText = skillBonus;
}

function addCheckboxListeners() {
    const checkboxes = document.querySelectorAll('#skills input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateSkills(
                parseInt(document.getElementById('str').innerText),
                parseInt(document.getElementById('dex').innerText),
                parseInt(document.getElementById('con').innerText),
                parseInt(document.getElementById('int').innerText),
                parseInt(document.getElementById('wis').innerText),
                parseInt(document.getElementById('cha').innerText)
            );
        });
    });
}

document.getElementById('rollStats').addEventListener('click', updateStats);

// Checkbox olay dinleyicilerini başlat
addCheckboxListeners();



function rollDice() {
    // Zar sayısını ve zar yüzey sayısını al
    const numDice = parseInt(document.getElementById('num-dice').value);
    const sidesDice = parseInt(document.getElementById('sides-dice').value);

    // Zarları at
    const results = [];
    for (let i = 0; i < numDice; i++) {
        results.push(Math.floor(Math.random() * sidesDice) + 1);
    }

    // Sonuçları ekrana yazdır
    document.getElementById('result').innerHTML = 
        `Zar sonuçları: ${results.join(', ')} <br> Toplam: ${results.reduce((a, b) => a + b, 0)}`;
}

