document.querySelectorAll('.checkbox').forEach(function(checkbox) {
    checkbox.addEventListener('click', function() {
        // İkona tıklanınca checked sınıfı eklenir veya kaldırılır
        this.classList.toggle('checked');
    });
    
});

function enforceMinMax(input) {
    let value = parseInt(input.value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    if (value < min) {
        value = min;
    } else if (value > max) {
        value = max;
    }

    input.value = value;
    return value;
}

function calculateBonus(value) {
    return Math.floor((value - 10) / 2);
}

function updateStat(input, bonusId) {
    const value = enforceMinMax(input);
    const bonus = calculateBonus(value);
    document.getElementById(bonusId).innerText = bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

const stats = [
    { inputId: 'strInput', bonusId: 'strBonus' },
    { inputId: 'dexInput', bonusId: 'dexBonus' },
    { inputId: 'conInput', bonusId: 'conBonus' },
    { inputId: 'intInput', bonusId: 'intBonus' },
    { inputId: 'wisInput', bonusId: 'wisBonus' },
    { inputId: 'chaInput', bonusId: 'chaBonus' },
];

stats.forEach(stat => {
    const input = document.getElementById(stat.inputId);
    input.addEventListener('change', function () {
        updateStat(input, stat.bonusId);
    });
});
