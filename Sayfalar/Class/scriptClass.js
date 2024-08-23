const toggleMenu = () => {
    const menu = document.getElementById('hamburger-menu');
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        menu.classList.add('visible');
    } else {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
};

// Menü dışında bir yere tıklanınca menüyü gizle
document.addEventListener('click', (event) => {
    const menu = document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');

    // Eğer tıklama menüde veya menü ikonu üzerindeyse bir şey yapma
    if (menu.contains(event.target) || menuIcon.contains(event.target)) {
        return;
    }

    // Aksi halde menüyü gizle
    if (menu.classList.contains('visible')) {
        menu.classList.remove('visible');
        menu.classList.add('hidden');
    }
});