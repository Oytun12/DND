document.addEventListener('DOMContentLoaded', () => {
    const customBonus1 = document.getElementById('custom-bonus-1');
    const customBonus2 = document.getElementById('custom-bonus-2');

    const updateRaceBonuses = (race) => {
        let bonuses = raceBonuses[race] || {strB: 0, dexB: 0, conB: 0, intB: 0, wisB: 0, chaB: 0};
        statBonuses = bonuses;

        if (race === 'HumanVariant' || race === 'Yarı-Elf') {
            bonuses = {...bonuses};

            const bonus1 = customBonus1 ? customBonus1.value : '';
            const bonus2 = customBonus2 ? customBonus2.value : '';

            if (race === 'HumanVariant') {
                if (bonus1) bonuses[bonus1]++;
                if (bonus2) bonuses[bonus2]++;
            } else if (race === 'Yarı-Elf') {
                if (bonus1) bonuses[bonus1]++;
                 // customBonus2Label.classList.add('hidden');
                // customBonus2.classList.add('hidden');
            }
        } else if (race !== 'HumanVariant' || race !== 'Yarı-Elf') {
            updateTotalsAndModifiers();
        }

        Object.keys(bonuses).forEach(key => {
            document.getElementById(`${key.split('B')[0]}-racial`).textContent = bonuses[key];
        });

        updateTotalsAndModifiers();
    };

    // Diğer gerekli kodlar burada
});



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

document.getElementById('race').addEventListener('change', updateRaceInfo);