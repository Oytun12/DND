/* ============================================================
   SCRIPT.JS - Ana Sayfa Menü Mantığı (Güncellendi)
   ============================================================ */

/* --- 1. GARANTİLİ MENÜ FONKSİYONU --- */
function toggleMenu(event) {
    // Tıklama olayını yakala ve yayılmasını engelle (Sayfa boşluğuna gitmesin)
    if (event) {
        event.stopPropagation();
    }

    // Menüyü bul
    const menu = document.getElementById('mobile-menu');

    if (menu) {
        // Toggle işlemi: Varsa kaldır, yoksa ekle
        // Sadece 'open' sınıfını kullanıyoruz (CSS ile uyumlu)
        menu.classList.toggle('open');
    } else {
        console.error("Menü elementi (id='mobile-menu') bulunamadı!");
    }
}

/* --- 2. GLOBAL TIKLAMA YÖNETİCİSİ (Boşluğa Tıklayınca Kapat) --- */
document.addEventListener('click', (event) => {
    const menu = document.getElementById('mobile-menu');
    const menuIcon = document.querySelector('.menu-icon');

    // Eğer menü açıksa
    if (menu && menu.classList.contains('open')) {
        // Ve tıklanan yer menü değilse VE ikon değilse
        if (!menu.contains(event.target) && (!menuIcon || !menuIcon.contains(event.target))) {
            menu.classList.remove('open');
        }
    }
});