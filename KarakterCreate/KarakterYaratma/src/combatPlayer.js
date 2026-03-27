/* ============================================================
   OYUNCU SAVAŞ MODÜLÜ (PLAYER COMBAT WIDGET - VUE UYUMLU)
   ============================================================ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// YENİ: getDoc eklendi (Veritabanından silme işlemi için şart)
import { initializeFirestore, doc, onSnapshot, updateDoc, arrayUnion, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { firebaseConfig } from "./firebaseConfig.js";
import { store } from './store.js'; 

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false
});

// YENİ: ÖZEL UYARI PENCERESİ (Tarayıcının çirkin prompt/alert'ini ezer)
function showCustomModal(type, message, callback) {
    const overlay = document.createElement('div');
    overlay.className = 'pcw-modal-overlay';
    
    let inputHtml = type === 'prompt' ? `<input type="text" class="pcw-modal-input" placeholder="Örn: Ejderha-55">` : '';
    let cancelBtnHtml = (type === 'prompt' || type === 'confirm') ? `<button class="pcw-modal-btn cancel">İptal</button>` : '';

    overlay.innerHTML = `
        <div class="pcw-modal-box">
            <div class="pcw-modal-msg">${message}</div>
            ${inputHtml}
            <div class="pcw-modal-btns">
                ${cancelBtnHtml}
                <button class="pcw-modal-btn confirm">Tamam</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const inputEl = overlay.querySelector('.pcw-modal-input');
    if (inputEl) inputEl.focus();

    const btnConfirm = overlay.querySelector('.confirm');
    const btnCancel = overlay.querySelector('.cancel');

    // Enter tuşu ile onaylama
    if (inputEl) {
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') btnConfirm.click();
        });
    }

    btnConfirm.onclick = () => {
        let val = true;
        if (type === 'prompt') val = inputEl.value;
        overlay.remove();
        if(callback) callback(val);
    };

    if (btnCancel) {
        btnCancel.onclick = () => {
            overlay.remove();
            if(callback) callback(null);
        };
    }
}

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
    let myCombatantId = null; // YENİ: Firebase'den silmek için kendi ID'mizi aklımızda tutuyoruz

    // 1. SAVAŞA KATIL (ÖZEL PROMPT KULLANIMI)
    document.addEventListener('click', (e) => {
        const btnJoin = e.target.closest('#btn-join-combat');
        if (btnJoin) {
            showCustomModal('prompt', "DM'in verdiği Savaş Odası kodunu girin:", (code) => {
                if (code && code.trim() !== "") {
                    currentRoomCode = code.trim();
                    joinOverlay.style.display = 'flex'; 
                    widget.style.display = 'flex';
                    widget.classList.remove('minimized');
                    roomDisplay.innerText = currentRoomCode;
                    listenToRoom();
                }
            });
        }
    });

    // 2. WIDGET KONTROLLERİ
    btnMinimize.addEventListener('click', () => {
        widget.classList.toggle('minimized');
    });

    // ÇIKIŞ VE SİLİNME İŞLEMİ (ÖZEL CONFIRM KULLANIMI)
    btnLeave.addEventListener('click', () => {
        showCustomModal('confirm', "Savaş odasından ayrılmak istediğinize emin misiniz?", async (confirmed) => {
            if(confirmed) {
                // KENDİMİZİ FIREBASE LİSTESİNDEN SİLİYORUZ
                if (currentRoomCode && myCombatantId) {
                    try {
                        const roomRef = doc(db, "combat_sessions", currentRoomCode);
                        const snap = await getDoc(roomRef);
                        
                        if (snap.exists()) {
                            const data = snap.data();
                            const updatedCombatants = data.combatants.filter(c => c.id !== myCombatantId);
                            
                            await updateDoc(roomRef, {
                                combatants: updatedCombatants,
                                lastUpdatedBy: "Player"
                            });
                        }
                    } catch (e) {
                        console.error("Listeden silinirken hata oluştu:", e);
                    }
                }

                if(unsubscribeSnapshot) unsubscribeSnapshot();
                widget.style.display = 'none';
                currentRoomCode = "";
                myCombatantId = null; // ID'yi sıfırla
            }
        });
    });

    // 3. İNİSİYATİF AT VE BULUTA FIRLAT (AKILLI DOM OKUYUCU EKLENDİ)
    btnRollInit.addEventListener('click', async () => {
        if (!currentRoomCode || !store) return;

        // 1. İNİSİYATİF BONUSUNU (INIT MOD) DOĞRUDAN EKRANDAN OKU
        let initMod = 0; // Varsayılan
        const initEl = document.getElementById('player-live-init');
        
        if (initEl) {
            // "+" veya "-" işaretini koruyarak rakamı çekelim (Örn: "+4", "-1", "3")
            const parsedInit = parseInt(initEl.innerText.replace(/[^0-9\-]/g, ''), 10);
            if (!isNaN(parsedInit)) {
                initMod = parsedInit;
            }
        } else {
            // Yedek Plan (Fallback): HTML'de etiket bulunamazsa sadece DEX'ten hesapla
            let dexScore = 10;
            if (store.abilities && store.abilities.base && store.abilities.base.dex) {
                dexScore = parseInt(store.abilities.base.dex) || 10;
                if (store.abilities.asi && store.abilities.asi.dex) {
                    dexScore += parseInt(store.abilities.asi.dex) || 0;
                }
            }
            initMod = Math.floor((dexScore - 10) / 2);
        }

        // Zarı ve Toplamı Hesapla
        const roll = Math.floor(Math.random() * 20) + 1;
        const totalInit = roll + initMod;

        // 2. ZIRH (AC) DEĞERİNİ DOĞRUDAN EKRANDAN OKU
        let acScore = 10 + initMod; // Yedek hesap
        const acEl = document.getElementById('player-live-ac');
        if (acEl) {
            const parsedAC = parseInt(acEl.innerText.replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsedAC)) {
                acScore = parsedAC;
            }
        }

        // ID'yi hafızada tutuyoruz ki çıkarken silebilelim
        myCombatantId = store.meta?.id || Date.now().toString();

        const myCombatant = {
            id: myCombatantId, 
            name: store.meta?.name || "İsimsiz Kahraman",
            initTotal: totalInit,
            initRoll: roll,
            initMod: initMod, // DOĞRU BONUS BURADAN GİDİYOR
            ac: acScore,
            isMonster: false,
            isGroup: false,
            token: store.meta?.avatar || '../../img/avatars/default-avatar.png'
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
            showCustomModal('alert', "Odaya bağlanılamadı. Kodun doğruluğunu veya DM'in odayı kurup kurmadığını kontrol edin.", null);
        }
    });

    // 4. FIREBASE DİNLEYİCİSİ
    function listenToRoom() {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        const roomRef = doc(db, "combat_sessions", currentRoomCode);

        unsubscribeSnapshot = onSnapshot(roomRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                roundDisplay.innerText = `Tur: ${data.round}`;
                listDiv.innerHTML = '';
                
                data.combatants.forEach((c, index) => {
                    const isActive = data.round > 0 && index === data.activeTurnIndex;
                    // Kendi kartımızı bulmak için hafızadaki ID'yi kullanıyoruz
                    const isMe = c.id === myCombatantId;
                    
                    let tokenSrc = c.token || '../../img/avatars/default-avatar.png';
                    if (tokenSrc.includes('../img/')) { tokenSrc = tokenSrc.replace('../img/', '../../img/'); }
                    
                    let acHtml = c.ac && c.ac !== "?" ? `<span class="pcw-ac">🛡️ ${c.ac}</span>` : `<span class="pcw-ac">🛡️ ?</span>`;

                    // Kartın CSS'ine ölüm (dead) ve grup (is-group) mantığını ekledik
                    const card = document.createElement('div');
                    card.className = `pcw-card ${isActive ? 'active-turn' : ''} ${isMe ? 'is-me' : ''} ${c.isGroup ? 'is-group' : ''} ${c.isDead ? 'dead' : ''}`;
                    
                    if (c.isGroup) {
                        // Eğer Grupsa, önce başlığı koy, sonra minyonları alt alta diz
                        let membersHtml = '';
                        if (c.members && c.members.length > 0) {
                            c.members.forEach(m => {
                                membersHtml += `
                                    <div class="pcw-member-row ${m.isDead ? 'dead' : ''}">
                                        <img src="${tokenSrc}" class="pcw-token" onerror="this.src='../../img/avatars/default-avatar.png'">
                                        <div class="pcw-name">#${m.num} ${c.baseName || 'Minyon'}</div>
                                        ${acHtml}
                                    </div>
                                `;
                            });
                        }
                        card.innerHTML = `
                            <div class="pcw-group-header">
                                <div class="pcw-init">${c.initTotal}</div>
                                <div class="pcw-name">${c.name}</div>
                            </div>
                            ${membersHtml}
                        `;
                    } else {
                        // Tekil Canavar veya Oyuncu (Eski hali)
                        card.innerHTML = `
                            <div class="pcw-init">${c.initTotal}</div>
                            <img src="${tokenSrc}" class="pcw-token" onerror="this.src='../../img/avatars/default-avatar.png'">
                            <div class="pcw-name">${c.name} ${isMe ? '(Sen)' : ''}</div>
                            ${acHtml}
                        `;
                    }
                    listDiv.appendChild(card);
                });
            } else {
                listDiv.innerHTML = '<p style="color:#e74c3c; padding:10px; text-align:center;">Oda DM tarafından henüz kurulmadı veya kapatıldı.</p>';
            }
        });
    }

    // ============================================================
    // SÜRÜKLE BIRAK MANTIĞI
    // ============================================================
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