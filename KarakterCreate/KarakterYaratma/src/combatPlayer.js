/* ============================================================
   OYUNCU SAVAŞ MODÜLÜ (PLAYER COMBAT WIDGET - VUE UYUMLU)
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { initializeFirestore, doc, onSnapshot, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { store } from './store.js'; 

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
});

document.addEventListener('DOMContentLoaded', () => {
    const widget = document.getElementById('player-combat-widget');
    const roomDisplay = document.getElementById('pcw-room-code-display');
    const btnMinimize = document.getElementById('pcw-minimize-btn');
    const btnLeave = document.getElementById('pcw-leave-btn');
    const btnRollInit = document.getElementById('pcw-roll-init-btn');
    const joinOverlay = document.getElementById('pcw-join-overlay');
    const listDiv = document.getElementById('pcw-list');
    const roundDisplay = document.getElementById('pcw-round-display');

    let currentRoomCode = "";
    let unsubscribeSnapshot = null;

    document.addEventListener('click', (e) => {
        const btnJoin = e.target.closest('#btn-join-combat');
        if (btnJoin) {
            const code = prompt("DM'in verdiği Savaş Odası kodunu girin (Örn: Ejderha-55):");
            if (code && code.trim() !== "") {
                currentRoomCode = code.trim();
                joinOverlay.style.display = 'flex'; 
                widget.style.display = 'flex';
                widget.classList.remove('minimized');
                roomDisplay.innerText = currentRoomCode;
                listenToRoom();
            }
        }
    });

    btnMinimize.addEventListener('click', () => widget.classList.toggle('minimized'));

    btnLeave.addEventListener('click', () => {
        if(confirm("Savaş odasından ayrılmak istediğinize emin misiniz?")) {
            if(unsubscribeSnapshot) unsubscribeSnapshot();
            widget.style.display = 'none';
            currentRoomCode = "";
        }
    });

    // 3. İNİSİYATİF AT VE BULUTA FIRLAT (AC VE ZAR DETAYLARI EKLENDİ)
    btnRollInit.addEventListener('click', async () => {
        if (!currentRoomCode || !store) return;

        let dexScore = 10;
        if (store.abilities && store.abilities.base && store.abilities.base.dex) {
            dexScore = parseInt(store.abilities.base.dex) || 10;
            if (store.abilities.asi && store.abilities.asi.dex) {
                dexScore += parseInt(store.abilities.asi.dex) || 0;
            }
        }
        
        const dexMod = Math.floor((dexScore - 10) / 2);
        const roll = Math.floor(Math.random() * 20) + 1;
        const totalInit = roll + dexMod;

        // VUE EKRANINDAN CANLI ZIRH SINIFINI (AC) YAKALAMAYA ÇALIŞ
        let acScore = 10 + dexMod; // Varsayılan AC
        // (Eğer kağıtta AC yazan bir element varsa oradan okur, yoksa 10+Dex kullanır)
        const acEl = document.querySelector('.armor-class, .ac-value, .ac-box, [title*="Zırh"], [title*="AC"]');
        if (acEl && parseInt(acEl.innerText)) {
            acScore = parseInt(acEl.innerText);
        }

        const myCombatant = {
            id: store.meta?.id || Date.now().toString(), 
            name: store.meta?.name || "İsimsiz Kahraman",
            initTotal: totalInit,
            initRoll: roll,        // DM Ekranı için Atılan Zar
            initMod: dexMod,       // DM Ekranı için Bonus
            ac: acScore,           // DM Ekranı için Zırh Sınıfı
            isMonster: false,
            isGroup: false,
            token: store.meta?.avatar || '../../img/SariZar.svg'
        };

        try {
            const roomRef = doc(db, "combat_sessions", currentRoomCode);
            await updateDoc(roomRef, {
                combatants: arrayUnion(myCombatant),
                lastUpdatedBy: "Player" 
            });
            joinOverlay.style.display = 'none'; 
        } catch (error) {
            console.error("Zar gönderilirken hata:", error);
            alert("Odaya bağlanılamadı. Kodun doğruluğunu veya DM'in odayı kurup kurmadığını kontrol edin.");
        }
    });

    function listenToRoom() {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        const roomRef = doc(db, "combat_sessions", currentRoomCode);

        unsubscribeSnapshot = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                roundDisplay.innerText = `Tur: ${data.round}`;
                listDiv.innerHTML = '';
                const myId = store.meta?.id;

                data.combatants.forEach((c, index) => {
                    const isActive = data.round > 0 && index === data.activeTurnIndex;
                    const isMe = c.id === myId;
                    let tokenSrc = c.token || '../../img/SariZar.svg';
                    if (tokenSrc.includes('../img/')) { tokenSrc = tokenSrc.replace('../img/', '../../img/'); }
                    
                    let acHtml = c.ac && c.ac !== "?" ? `<span class="pcw-ac">🛡️ ${c.ac}</span>` : `<span class="pcw-ac">🛡️ ?</span>`;

                    const card = document.createElement('div');
                    card.className = `pcw-card ${isActive ? 'active-turn' : ''} ${isMe ? 'is-me' : ''}`;
                    card.innerHTML = `
                        <div class="pcw-init">${c.initTotal}</div>
                        <img src="${tokenSrc}" class="pcw-token" onerror="this.src='../../img/SariZar.svg'">
                        <div class="pcw-name">${c.name} ${isMe ? '(Sen)' : ''}</div>
                        ${acHtml}
                    `;
                    listDiv.appendChild(card);
                });
            } else {
                listDiv.innerHTML = '<p style="color:#e74c3c; padding:10px; text-align:center;">Oda DM tarafından kapatıldı.</p>';
            }
        });
    }

    // SÜRÜKLE BIRAK
    let isDragging = false, currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    const header = document.getElementById('pcw-drag-handle');
    header.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);
    header.addEventListener("touchstart", dragStart, {passive: true});
    document.addEventListener("touchend", dragEnd);
    document.addEventListener("touchmove", drag, {passive: true});

    function dragStart(e) {
        if (e.target.closest('.pcw-window-controls')) return; 
        initialX = (e.type === "touchstart" ? e.touches[0].clientX : e.clientX) - xOffset;
        initialY = (e.type === "touchstart" ? e.touches[0].clientY : e.clientY) - yOffset;
        if (e.target === header || header.contains(e.target)) isDragging = true;
    }
    function dragEnd() { initialX = currentX; initialY = currentY; isDragging = false; }
    function drag(e) {
        if (isDragging) {
            e.preventDefault();
            currentX = (e.type === "touchmove" ? e.touches[0].clientX : e.clientX) - initialX;
            currentY = (e.type === "touchmove" ? e.touches[0].clientY : e.clientY) - initialY;
            xOffset = currentX; yOffset = currentY;
            setTranslate(currentX, currentY, widget);
        }
    }
    function setTranslate(xPos, yPos, el) { el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`; }
});