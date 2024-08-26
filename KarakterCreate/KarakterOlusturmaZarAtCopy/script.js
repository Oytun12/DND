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

function updateStat(statId, rollId) {
    const stat = rollStat();
    document.getElementById(statId).innerText = stat.total;
    document.getElementById(rollId).innerText = `(${stat.rolls.join(', ')})`;
}

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
