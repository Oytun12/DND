/* ============================================================
   GLOBAL DICE ROLLER (Tüm Sayfalar İçin Ortak Zar Motoru)
   ============================================================ */

const GlobalDice = (function() {
    let diceHistory = [];
    let autoCloseTimer = null;

    // Sayfa yüklendiğinde HTML arayüzünü otomatik olarak DOM'a ekle
    function injectHTML() {
        if (document.getElementById('global-dice-container')) return;

        const container = document.createElement('div');
        container.id = 'global-dice-container';
        container.innerHTML = `
            <div class="dice-overlay">
                <div id="global-dice-card" class="dice-result-card">
                    <div class="dice-close" onclick="GlobalDice.closeResult()">✖</div>
                    <div id="gd-source" class="dice-source">Saldırı</div>
                    <div class="dice-breakdown">
                        <span id="gd-details" style="font-size: 1.2em; color: #e67e22; font-family: monospace; letter-spacing: 1px;"></span>
                    </div>
                    <div id="gd-total" class="dice-total">20</div>
                    <div id="gd-crit-msg" style="font-size:0.8em; margin-top:5px; display:none;"></div>
                </div>
            </div>

            <div class="history-toggle-btn" onclick="GlobalDice.toggleHistory()" title="Zar Geçmişi">🕒</div>
            
            <div id="global-dice-history" class="history-panel">
                <div class="history-header">
                    <span>Zar Kayıtları</span>
                    <span class="close-history" onclick="GlobalDice.toggleHistory()">✖</span>
                </div>
                <div id="gd-history-list" class="history-list">
                    <div style="text-align:center; padding:20px; color:#666; font-size:0.9em;">Henüz zar atılmadı.</div>
                </div>
                <div class="history-footer">
                    <button onclick="GlobalDice.clearHistory()" class="btn-clear-history">🗑️ Temizle</button>
                    <button onclick="GlobalDice.toggleHistory()" class="btn-close-bottom">✖ Kapat</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Sayfadaki tüm ".rollable-dice" sınıfına sahip metinleri dinle
        setupGlobalClickListeners();
    }

    function showResult(result) {
        const card = document.getElementById('global-dice-card');
        document.getElementById('gd-source').innerText = result.source;
        document.getElementById('gd-details').innerHTML = result.details;
        
        const totalEl = document.getElementById('gd-total');
        totalEl.innerText = result.total;
        totalEl.className = 'dice-total' + (result.isCrit ? ' crit-success' : '') + (result.isFail ? ' crit-fail' : '');

        const critMsg = document.getElementById('gd-crit-msg');
        if (result.isCrit) { critMsg.innerText = "KRİTİK BAŞARI!"; critMsg.style.color = "#4caf50"; critMsg.style.display = "block"; }
        else if (result.isFail) { critMsg.innerText = "KRİTİK HATA!"; critMsg.style.color = "#d32f2f"; critMsg.style.display = "block"; }
        else { critMsg.style.display = "none"; }

        card.classList.add('active');

        // Geçmişe Ekle
        diceHistory.unshift(result);
        renderHistory();

        if (autoCloseTimer) clearTimeout(autoCloseTimer);
        autoCloseTimer = setTimeout(() => card.classList.remove('active'), 4000);
    }

    function renderHistory() {
        const list = document.getElementById('gd-history-list');
        if (diceHistory.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:20px; color:#666; font-size:0.9em;">Henüz zar atılmadı.</div>';
            return;
        }

        list.innerHTML = diceHistory.map(roll => `
            <div class="history-item">
                <div class="h-row-top">
                    <span class="h-source">${roll.source}</span>
                    <span class="h-time">${roll.time}</span>
                </div>
                <div class="h-row-result">
                    <span class="h-calc">
                        <span class="${roll.isCrit ? 'nat-20' : (roll.isFail ? 'nat-1' : '')}">${roll.baseRoll}</span> 
                        ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}
                    </span>
                    <span class="h-total ${roll.isCrit ? 'crit-success' : (roll.isFail ? 'crit-fail' : '')}">
                        = ${roll.total}
                    </span>
                </div>
            </div>
        `).join('');
    }

    function setupGlobalClickListeners() {
        document.addEventListener('click', (e) => {
            const rollable = e.target.closest('.rollable-dice');
            if (!rollable) return;
            
            const diceString = rollable.dataset.dice; // Örn: "2d6+3" veya "+5" veya "1d20"
            const source = rollable.dataset.source || "Sistem Zarı";
            
            if (diceString.includes('d')) {
                // Hasar / Zar Kombinasyonu (Örn: 2d6+3)
                let [dicePart, bonusPart] = diceString.replace(/\s+/g, '').split(/(?=[+-])/);
                let bonus = parseInt(bonusPart) || 0;
                rollDamage(source, dicePart, bonus, "");
            } else {
                // Sadece D20 Modifier (Örn: +5)
                rollD20(source, parseInt(diceString) || 0);
            }
        });
    }

    // --- DIŞARI AÇILAN API ---
    function rollD20(sourceName, modifier) {
        const roll = Math.floor(Math.random() * 20) + 1;
        const sign = modifier >= 0 ? "+" : "";
        showResult({
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: sourceName, baseRoll: roll, modifier: modifier, total: roll + modifier,
            details: `${roll} (d20) ${sign}${modifier}`, isCrit: roll === 20, isFail: roll === 1
        });
    }

    function rollDamage(name, diceString, bonus, damageType) {
        const [countStr, faceStr] = diceString.split('d');
        const count = parseInt(countStr) || 1;
        const faces = parseInt(faceStr) || 6;
        let diceSum = 0; let rolls = [];

        for(let i=0; i<count; i++) {
            const r = Math.floor(Math.random() * faces) + 1;
            rolls.push(r); diceSum += r;
        }

        const bonusText = bonus >= 0 ? `+${bonus}` : `${bonus}`;
        showResult({
            time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            source: damageType ? `${name} (${damageType})` : name,
            baseRoll: diceSum, modifier: bonus, total: diceSum + bonus,
            details: `${rolls.join(", ")} (${diceString}) ${bonusText}`, isCrit: false, isFail: false
        });
    }

    // Başlangıçta çalıştır
    window.addEventListener('DOMContentLoaded', injectHTML);

    return {
        rollD20, rollDamage,
        closeResult: () => document.getElementById('global-dice-card').classList.remove('active'),
        toggleHistory: () => document.getElementById('global-dice-history').classList.toggle('open'),
        clearHistory: () => { diceHistory = []; renderHistory(); }
    };
})();