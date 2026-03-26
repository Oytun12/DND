/* ============================================================
   PREMIUM DICE ROLLER MOTORU (Roll20 Tarzı)
   ============================================================ */

window.initDiceRoller = function(panelEl, panelData, saveCallback) {
    const wrapper = panelEl.querySelector('.premium-dice-wrapper');
    if (!wrapper) return;

    if (!panelData.customRolls) panelData.customRolls = [];
    if (!panelData.diceHistory) panelData.diceHistory = [];

    const DICE_SVGS = {
        4: '<polygon points="18,3 3,28 33,28" stroke-linejoin="round"/> <line x1="18" y1="3" x2="18" y2="28"/> <line x1="18" y1="18" x2="3" y2="28"/> <line x1="18" y1="18" x2="33" y2="28"/>',
        6: '<rect x="6" y="6" width="24" height="24" rx="3" stroke-linejoin="round"/> <circle cx="12" cy="12" r="1.5" fill="currentColor"/> <circle cx="24" cy="24" r="1.5" fill="currentColor"/> <circle cx="12" cy="24" r="1.5" fill="currentColor"/> <circle cx="24" cy="12" r="1.5" fill="currentColor"/>',
        8: '<polygon points="18,3 33,18 18,33 3,18" stroke-linejoin="round"/> <line x1="3" y1="18" x2="33" y2="18"/> <line x1="18" y1="3" x2="18" y2="33"/>',
        10: '<polygon points="18,2 30,12 18,34 6,12" stroke-linejoin="round"/> <polygon points="18,2 24,14 18,22 12,14" stroke-linejoin="round"/> <line x1="6" y1="12" x2="12" y2="14"/> <line x1="30" y1="12" x2="24" y2="14"/> <line x1="18" y1="34" x2="18" y2="22"/>',
        12: '<polygon points="18,3 32,13 27,29 9,29 4,13" stroke-linejoin="round"/> <polygon points="18,10 25,16 22,23 14,23 11,16" stroke-linejoin="round"/> <line x1="18" y1="3" x2="18" y2="10"/> <line x1="32" y1="13" x2="25" y2="16"/> <line x1="27" y1="29" x2="22" y2="23"/> <line x1="9" y1="29" x2="14" y2="23"/> <line x1="4" y1="13" x2="11" y2="16"/>',
        20: '<polygon points="18,2 32,10 32,26 18,34 4,26 4,10" stroke-linejoin="round"/> <polygon points="18,2 26,18 10,18" stroke-linejoin="round"/> <polygon points="18,34 26,18 10,18" stroke-linejoin="round"/> <line x1="32" y1="10" x2="26" y2="18"/> <line x1="32" y1="26" x2="26" y2="18"/> <line x1="4" y1="10" x2="10" y2="18"/> <line x1="4" y1="26" x2="10" y2="18"/>',
        100: '<circle cx="18" cy="18" r="15" stroke-linejoin="round"/> <circle cx="18" cy="18" r="8" stroke-dasharray="2 4"/> <text x="18" y="22" font-size="10" text-anchor="middle" fill="currentColor" stroke="none" font-weight="bold">%</text>'
    };

    wrapper.innerHTML = `
        <div class="dice-base-row">
            ${[4, 6, 8, 10, 12, 20, 100].map(d => `
                <button class="die-btn" data-sides="${d}" title="1d${d} At">
                    <svg viewBox="0 0 36 36">${DICE_SVGS[d]}</svg>
                    <span>d${d}</span>
                </button>
            `).join('')}
        </div>

        <div class="dice-workspace">
            <div class="dice-controls">
                <div class="adv-toggle-group">
                    <button class="adv-btn" data-state="dis">Dezavantaj</button>
                    <button class="adv-btn active" data-state="norm">Normal</button>
                    <button class="adv-btn" data-state="adv">Avantaj</button>
                </div>
                <div class="mod-group">
                    <label>Bonus Mod:</label>
                    <input type="number" class="mod-input" value="0">
                </div>
            </div>

            <div class="custom-roll-builder">
                <input type="text" class="builder-input" id="b-name" placeholder="Örn: Ateş Topu" style="width:110px;">
                <input type="number" class="builder-input" id="b-qty" value="1" min="1" max="50" style="width:40px;">
                <span style="color:#aaa;">d</span>
                <select class="builder-input" id="b-sides">
                    <option value="4">4</option><option value="6" selected>6</option><option value="8">8</option>
                    <option value="10">10</option><option value="12">12</option><option value="20">20</option><option value="100">100</option>
                </select>
                <span style="color:#aaa;">+</span>
                <input type="number" class="builder-input" id="b-mod" value="0" style="width:50px;">
                <button class="builder-btn" id="b-save">Kaydet</button>
                <button class="builder-btn" id="b-cancel" style="background:#444;">İptal</button>
            </div>
            
            <div class="custom-rolls-section">
                </div>

            <div class="history-header-row">
                <span>Zar Geçmişi</span>
                <button class="clear-history-btn" title="Zar geçmişini ve aktif zarları sıfırla">Temizle</button>
            </div>

            <div class="dice-history">
                </div>
        </div>
    `;

    const baseBtns = wrapper.querySelectorAll('.die-btn');
    const advBtns = wrapper.querySelectorAll('.adv-btn');
    const modInput = wrapper.querySelector('.mod-input');
    const customSection = wrapper.querySelector('.custom-rolls-section');
    const historySection = wrapper.querySelector('.dice-history');
    const builder = wrapper.querySelector('.custom-roll-builder');
    const clearBtn = wrapper.querySelector('.clear-history-btn');
    
    let currentAdvState = 'norm';

    // AVANTAJ / DEZAVANTAJ SEÇİCİ
    advBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            advBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentAdvState = btn.dataset.state;
        });
    });

    // TEMEL ZAR TIKLAMA
    baseBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sides = parseInt(btn.dataset.sides);
            const mod = parseInt(modInput.value) || 0;
            
            btn.classList.remove('rolling-anim');
            void btn.offsetWidth; 
            btn.classList.add('rolling-anim');

            rollDice(`Düz Zar (d${sides})`, 1, sides, mod, sides === 20 ? currentAdvState : 'norm');
        });
    });

    // GEÇMİŞİ TEMİZLE BUTONU
    clearBtn.addEventListener('click', () => {
        panelData.diceHistory = [];
        saveCallback();
        renderHistory();
        
        // Aktif olarak yanmaya devam eden kırmızı zarları sıfırla
        baseBtns.forEach(btn => btn.classList.remove('rolling-anim'));
    });

    // ÖZEL ZAR MANTIĞI
    wrapper.querySelector('#b-cancel').addEventListener('click', () => {
        builder.classList.remove('open');
    });

    wrapper.querySelector('#b-save').addEventListener('click', () => {
        const name = wrapper.querySelector('#b-name').value || "Özel Zar";
        const qty = parseInt(wrapper.querySelector('#b-qty').value) || 1;
        const sides = parseInt(wrapper.querySelector('#b-sides').value) || 6;
        const mod = parseInt(wrapper.querySelector('#b-mod').value) || 0;

        panelData.customRolls.push({ id: Date.now(), name, qty, sides, mod });
        builder.classList.remove('open');
        wrapper.querySelector('#b-name').value = '';
        saveCallback();
        renderCustomRolls();
    });

    function rollDice(name, qty, sides, mod, advState) {
        let results = [];
        let total = 0;
        let isCritSuccess = false;
        let isCritFail = false;

        // Avantaj/Dezavantaj durumu genellikle tek zar (qty=1) için geçerlidir
        if (qty === 1 && advState !== 'norm') {
            let r1 = Math.floor(Math.random() * sides) + 1;
            let r2 = Math.floor(Math.random() * sides) + 1;
            
            let kept, dropped;
            if (advState === 'adv') {
                kept = Math.max(r1, r2);
                dropped = Math.min(r1, r2);
            } else {
                kept = Math.min(r1, r2);
                dropped = Math.max(r1, r2);
            }
            total = kept;
            results = [kept, dropped]; 
            
            // Tek zarda sağdaki toplam kutusunun parlaması için global kontrol
            if (kept === sides) isCritSuccess = true;
            if (kept === 1) isCritFail = true;
            
        } else {
            for (let i = 0; i < qty; i++) {
                let val = Math.floor(Math.random() * sides) + 1;
                results.push(val);
                total += val;
                
                // Eğer tek zar atıldıysa toplam kutusu parlasın
                if (qty === 1) {
                    if (val === sides) isCritSuccess = true;
                    if (val === 1) isCritFail = true;
                }
            }
        }

        const grandTotal = total + mod;
        let timeString = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});

        const historyObj = {
            id: Date.now(),
            name: name,
            formula: `${qty}d${sides} ${mod !== 0 ? (mod > 0 ? '+'+mod : mod) : ''}`,
            results: results,
            sides: sides, // YENİ: Zarın kaçlık olduğunu render işlemi için kaydediyoruz
            mod: mod,
            total: grandTotal,
            advState: advState,
            time: timeString,
            isCritSuccess: isCritSuccess,
            isCritFail: isCritFail
        };

        panelData.diceHistory.unshift(historyObj);
        if (panelData.diceHistory.length > 50) panelData.diceHistory.pop(); 
        
        saveCallback();
        renderHistory();
    }

    function renderCustomRolls() {
        customSection.innerHTML = '';
        
        panelData.customRolls.forEach(cr => {
            const btnWrap = document.createElement('div');
            btnWrap.className = 'custom-roll-wrap';
            
            const btn = document.createElement('button');
            btn.className = 'custom-roll-btn';
            btn.title = `${cr.name} zarını at`;
            btn.innerHTML = `<span>${cr.name}</span><strong>${cr.qty}d${cr.sides}${cr.mod !== 0 ? (cr.mod > 0 ? '+'+cr.mod : cr.mod) : ''}</strong>`;
            btn.onclick = () => rollDice(cr.name, cr.qty, cr.sides, cr.mod, 'norm');

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-custom-btn';
            delBtn.innerHTML = '×';
            delBtn.title = 'Bu zarı sil';
            delBtn.onclick = () => {
                panelData.customRolls = panelData.customRolls.filter(x => x.id !== cr.id);
                saveCallback();
                renderCustomRolls();
            };

            btnWrap.appendChild(btn);
            btnWrap.appendChild(delBtn);
            customSection.appendChild(btnWrap);
        });

        // Yeni Ekle butonu artık kare formunda
        const addBtn = document.createElement('button');
        addBtn.className = 'add-custom-trigger';
        addBtn.innerHTML = '<span style="font-size:1.5em; line-height:0.8;">+</span><span>Yeni Ekle</span>';
        addBtn.onclick = () => builder.classList.add('open');
        customSection.appendChild(addBtn);
    }

    function renderHistory() {
        historySection.innerHTML = '';
        
        if (panelData.diceHistory.length === 0) {
            historySection.innerHTML = '<div style="text-align:center; color:#555; margin-top:20px; font-style:italic;">Zar geçmişi temiz.</div>';
            return;
        }

        panelData.diceHistory.forEach(h => {
            const item = document.createElement('div');
            // Global kutu parlaması (Sadece tek zarlarda çalışır)
            item.className = `history-item ${h.isCritSuccess ? 'crit-success' : ''} ${h.isCritFail ? 'crit-fail' : ''}`;
            
            // YENİ: İçerideki sayıları Max/Min kontrolünden geçirip renklendiren minik fonksiyon
            const formatDie = (val) => {
                if (val === h.sides) return `<span style="color:#2ecc71; font-weight:bold; text-shadow: 0 0 5px rgba(46,204,113,0.4);" title="Maksimum!">${val}</span>`;
                if (val === 1) return `<span style="color:#e74c3c; font-weight:bold; text-shadow: 0 0 5px rgba(231,76,60,0.4);" title="Minimum!">${val}</span>`;
                return val;
            };

            let arrayHtml = '';
            // Avantaj/Dezavantaj durumu (ilk sayı kept, ikincisi dropped)
            if (h.advState !== 'norm' && h.results.length === 2) {
                arrayHtml = `[${formatDie(h.results[0])}, <span class="dropped" style="opacity:0.5;">${formatDie(h.results[1])}</span>]`;
            } else {
                // Normal çoklu zar durumu (her zarı formatDie filtresinden geçirir)
                const formattedResults = h.results.map(val => formatDie(val));
                arrayHtml = `[${formattedResults.join(', ')}]`;
            }

            let modHtml = h.mod !== 0 ? ` ${h.mod > 0 ? '+' : '-'} ${Math.abs(h.mod)}` : '';
            let advText = h.advState === 'adv' ? ' <span style="color:#2ecc71;">(Avantaj)</span>' : (h.advState === 'dis' ? ' <span style="color:#e74c3c;">(Dezavantaj)</span>' : '');

            item.innerHTML = `
                <div class="hi-header">
                    <span>${h.name}${advText}</span>
                    <span>${h.time}</span>
                </div>
                <div class="hi-body">
                    <div>
                        <div class="hi-formula">${h.formula}</div>
                        <div class="hi-rolls-array">${arrayHtml}${modHtml}</div>
                    </div>
                    <div class="hi-total" title="Toplam Sonuç">${h.total}</div>
                </div>
            `;
            historySection.appendChild(item);
        });
    }

    renderCustomRolls();
    renderHistory();
};