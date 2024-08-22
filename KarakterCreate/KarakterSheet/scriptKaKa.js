document.querySelectorAll('.checkbox').forEach(function(checkbox) {
    checkbox.addEventListener('click', function() {
        // İkona tıklanınca checked sınıfı eklenir veya kaldırılır
        this.classList.toggle('checked');
    });
});

input.addEventListener('change', function () {
    let value = parseInt(input.value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    if (value < min) {
        input.value = min;
    } else if (value > max) {
        input.value = max;
    }
});