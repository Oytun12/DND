
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

    // Tıklanan eleman collapsible öğesi veya onun içeriği değilse collapsible içeriklerini gizle
    const collapsibles = document.querySelectorAll('.collapsible');
    collapsibles.forEach(collapsible => {
        const content = collapsible.nextElementSibling;
        if (content && content.classList.contains('visible') && !collapsible.contains(event.target) && !content.contains(event.target)) {
            content.classList.remove('visible');
            content.classList.add('hidden');
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const collapsibles = document.querySelectorAll(".collapsible");

    collapsibles.forEach(collapsible => {
        collapsible.addEventListener("click", function() {
            const content = this.nextElementSibling;
            if (content) {
                const isVisible = content.classList.contains('visible');
                content.classList.toggle("hidden", isVisible);
                content.classList.toggle("visible", !isVisible);

                // İçeriğin açılma/kapanma işlemi tamamlandıktan sonra kaydırma işlemini gerçekleştir
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 0);
            }
        });
    });
});
