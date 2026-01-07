// ------------------ MENÜ İŞLEMLERİ ------------------
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

// ------------------ GLOBAL TIKLAMA DİNLEYİCİSİ (DIŞ ALAN KONTROLÜ) ------------------
document.addEventListener('click', (event) => {
    // A) MENÜ KAPATMA MANTIĞI
    const menu = document.getElementById('hamburger-menu');
    const menuIcon = document.querySelector('.menu-icon');

    if (menu.classList.contains('visible')) {
        if (!menu.contains(event.target) && !menuIcon.contains(event.target)) {
            menu.classList.remove('visible');
            menu.classList.add('hidden');
        }
    }

    // B) COLLAPSIBLE (AÇILIR KAPANIR) KAPATMA MANTIĞI (GÜNCELLENDİ)
    // Tıklanan yer bir ".collapsible" (başlık) MI?
    const isHeader = event.target.closest('.collapsible');
    // Tıklanan yer bir ".icerik" (açılan kutu) MU?
    const isContent = event.target.closest('.icerik');

    // Eğer tıklama başlık DEĞİLSE ve içerik DEĞİLSE (Yani boşluğa tıklandıysa)
    if (!isHeader && !isContent) {
        // Açık olan HER ŞEYİ kapat
        const allActiveCollapsibles = document.querySelectorAll('.collapsible.active');
        allActiveCollapsibles.forEach(btn => {
            btn.classList.remove('active'); // Rengi ve oku eski haline getir
            const content = btn.nextElementSibling;
            if (content) {
                content.style.display = "none"; // Kutuyu gizle
            }
        });
    }
});

// ------------------ SEKME (TAB) SİSTEMİ ------------------
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tab-content");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab-link");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

// ------------------ AÇILIR/KAPANIR (COLLAPSIBLE) BUTON MANTIĞI ------------------
document.addEventListener("DOMContentLoaded", () => {
    const collapsibles = document.querySelectorAll(".collapsible");

    collapsibles.forEach(collapsible => {
        collapsible.addEventListener("click", function() {
            // Sadece tıklanan başlığı aç/kapat (Diğerlerine dokunma!)
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    });
});