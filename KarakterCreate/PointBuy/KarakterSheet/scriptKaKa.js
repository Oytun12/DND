document.querySelectorAll('.checkbox').forEach(function(checkbox) {
    checkbox.addEventListener('click', function() {
        // İkona tıklanınca checked sınıfı eklenir veya kaldırılır
        this.classList.toggle('checked');
    });
});

