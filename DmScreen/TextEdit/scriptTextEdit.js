/* ============================================================
   ZENGİN METİN EDİTÖRÜ (NOTION TARZI) - MODÜL LOGIC
   ============================================================ */

window.initTextEditor = function(panelEl, panelData, saveCallback) {
    const editor = panelEl.querySelector('.rich-text-editor');
    const exportBtn = panelEl.querySelector('.export-notes-btn');
    if (!editor) return;

    // YENİ: HER ZAMAN EN ALTTA BOŞ BİR SATIR (DIV) BIRAKAN YARDIMCI MOTOR
    function ensureBottomLine() {
        let last = editor.lastElementChild;
        // Son eleman yoksa veya bir DIV değilse veya içi boş değilse (içinde resim vs varsa)
        if (!last || last.tagName !== 'DIV' || last.textContent !== '' || last.innerHTML.includes('<img') || last.innerHTML.includes('<iframe')) {
            const div = document.createElement('div');
            div.innerHTML = '<br>';
            editor.appendChild(div);
        }
    }

    // 1. OTOMATİK KAYDETME VE YABANCI MADDE TEMİZLİĞİ
    editor.addEventListener('input', () => {
        editor.querySelectorAll('.custom-media-wrapper').forEach(wrapper => {
            Array.from(wrapper.childNodes).forEach(child => {
                if (child.nodeType === 3) child.remove(); 
            });
        });
        
        ensureBottomLine(); // Altta boşluk garantisi
        panelData.content = editor.innerHTML;
        if (saveCallback) saveCallback();
    });

    // 2. KLAVYE KISAYOLLARI VE AKILLI FORMATLAMA MOTORU
    editor.addEventListener('keydown', (e) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const node = sel.anchorNode;
        const offset = sel.anchorOffset;

        // Medya kutusu koruması
        let wrapperCheck = node.nodeType === 3 ? node.parentNode.closest('.custom-media-wrapper') : node.closest('.custom-media-wrapper');
        if (wrapperCheck) {
            if (!e.key.startsWith('Arrow') && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
                return;
            }
        }

        // YENİ: BACKSPACE İLE FORMATTAN ÇIKIŞ (SATIR BAŞINDAYSA)
        if (e.key === 'Backspace') {
            const block = node.nodeType === 3 ? node.parentNode.closest('h1, h2, h3, blockquote, li') : node.closest('h1, h2, h3, blockquote, li');
            if (block && offset === 0) {
                e.preventDefault();
                if (block.tagName === 'LI') {
                    document.execCommand('outdent', false, null);
                } else {
                    document.execCommand('formatBlock', false, 'DIV');
                }
                return;
            }
        }

        // YENİ: ENTER İLE BOŞ FORMATTAN (ALINTI/LİSTE) ÇIKIŞ
        if (e.key === 'Enter') {
            const block = node.nodeType === 3 ? node.parentNode.closest('blockquote, li') : node.closest('blockquote, li');
            if (block && block.textContent.trim() === '') {
                e.preventDefault();
                if (block.tagName === 'LI') {
                    document.execCommand('outdent', false, null);
                }
                document.execCommand('formatBlock', false, 'DIV');
                return;
            }
        }

        if (e.key === ' ' || e.key === 'Enter') {
            if (node.nodeType === 3) { 
                const text = node.textContent;
                const textUpToCursor = text.slice(0, offset); // İmlece kadar olan metni al

                // Satır Başı (Block) Komutları
                const blockMatch = text.match(/^(\/h1|\/h2|\/h3|#{1,3}|---|[-*]|>|1\.|[0-9]+\.|\/help|\/list|\/num|\/quote|\/line)\s?$/i);
                
                if (blockMatch) {
                    e.preventDefault(); 
                    const cmd = blockMatch[1].toLowerCase();
                    const range = document.createRange();
                    range.setStart(node, 0);
                    range.setEnd(node, text.length);
                    sel.removeAllRanges();
                    sel.addRange(range);
                    document.execCommand('delete', false, null);

                    if (['/h1', '#'].includes(cmd)) document.execCommand('formatBlock', false, 'H1');
                    else if (['/h2', '##'].includes(cmd)) document.execCommand('formatBlock', false, 'H2');
                    else if (['/h3', '###'].includes(cmd)) document.execCommand('formatBlock', false, 'H3');
                    else if (['>', '/quote'].includes(cmd)) document.execCommand('formatBlock', false, 'BLOCKQUOTE');
                    else if (['-', '*', '/list'].includes(cmd)) document.execCommand('insertUnorderedList', false, null);
                    else if (cmd.match(/^[0-9]+\.$/) || cmd === '/num') document.execCommand('insertOrderedList', false, null);
                    else if (['---', '/line'].includes(cmd)) { document.execCommand('insertHorizontalRule', false, null); }
                    else if (cmd === '/help') { showEditorHelp(); }
                } 
                else if (e.key === ' ') {
                    // YENİ: WHATSAPP STİLİ SATIR İÇİ FORMATLAMA (*bold*, _italik_, ==highlight==)
                    const boldMatch = textUpToCursor.match(/\*([^\*]+)\*$/);
                    const italicMatch = textUpToCursor.match(/_([^_]+)_$/);
                    const highlightMatch = textUpToCursor.match(/==([^=]+)==$/);

                    if (boldMatch || italicMatch || highlightMatch) {
                        e.preventDefault();
                        const match = boldMatch || italicMatch || highlightMatch;
                        
                        const range = document.createRange();
                        // Yazılan komutu (örn: *bold*) bul ve sil
                        range.setStart(node, offset - match[0].length);
                        range.setEnd(node, offset);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        document.execCommand('delete', false, null);
                        
                        // Yerine formatlı HTML'i bas
                        let insertStr = '';
                        if (boldMatch) insertStr = `<strong>${match[1]}</strong>&nbsp;`;
                        else if (italicMatch) insertStr = `<em>${match[1]}</em>&nbsp;`;
                        else if (highlightMatch) insertStr = `<mark style="background-color:rgba(90, 15, 15, 0.5); color:#ff4444; padding:0 4px; border-radius:3px;">${match[1]}</mark>&nbsp;`;

                        document.execCommand('insertHTML', false, insertStr);
                        return; // Format atıldıysa emoji motoruna girme
                    }

                    // Emojiler
                    const words = textUpToCursor.split(' ');
                    const lastWord = words[words.length - 1];
                    const replacements = {
                        '->': '→', '<-': '←', '=>': '⇒',
                        ':D': '😃', ':)': '🙂', ':(': '😞',
                        '/shrug': '¯\\_(ツ)_/¯', ':/': '😕', '<3': '❤️'
                    };

                    if (replacements[lastWord]) {
                        e.preventDefault();
                        const range = document.createRange();
                        range.setStart(node, offset - lastWord.length);
                        range.setEnd(node, offset);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        document.execCommand('delete', false, null);
                        document.execCommand('insertText', false, replacements[lastWord] + ' ');
                    }
                }
            }
        }
    });

    // 3. YAPIŞTIRMA MANTIĞI (SİSTEM KORUMASI VE BOŞLUK FİLTRESİ EKLENDİ)
    editor.addEventListener('paste', (e) => {
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            alert("⚠️ Sistem Koruması: Çiğ resim dosyaları doğrudan yapıştırılamaz.\n\nSitenin kayıt sisteminin (LocalStorage) çökmemesi için lütfen internetteki veya Google Drive'daki resmin URL'sini kopyalayıp yapıştırın.");
            return;
        }

        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        
        const isUrl = /^https?:\/\//i.test(text.trim());
        if (isUrl) {
            const url = text.trim();
            let mediaHtml = '';
            
            if (url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i)) {
                mediaHtml = `
                &#8203;<div class="custom-media-wrapper" contenteditable="false" draggable="true" style="width: 250px; height: auto; cursor: grab;">
                    <img src="${url}" alt="Eklenen Görsel" draggable="false">
                    <div class="media-overlay"></div>
                    <div class="media-resize-handle"></div>
                </div>&#8203;<div><br></div>`;
            } 
            else if (url.match(/\.pdf($|\?)/i) || url.includes('drive.google.com/file/d/')) {
                let src = url;
                if (url.includes('drive.google.com/file/d/')) {
                    const match = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
                    if (match) src = `https://drive.google.com/file/d/${match[1]}/preview`;
                }
                mediaHtml = `
                &#8203;<div class="custom-media-wrapper" contenteditable="false" draggable="true" style="width: 100%; height: 400px; cursor: grab;">
                    <iframe src="${src}" style="border:none;" draggable="false"></iframe>
                    <div class="media-overlay"></div>
                    <div class="media-resize-handle"></div>
                </div>&#8203;<div><br></div>`;
            }

            if (mediaHtml) {
                document.execCommand('insertHTML', false, mediaHtml);
                ensureBottomLine();
                panelData.content = editor.innerHTML;
                if (saveCallback) saveCallback();
                return; 
            }
        }

        // YENİ: ==Highlight== desteği eklendi
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')       
            .replace(/\*(.*?)\*/g, '<em>$1</em>')                   
            .replace(/_(.*?)_/g, '<em>$1</em>')                     
            .replace(/~~(.*?)~~/g, '<del>$1</del>')                 
            .replace(/==(.*?)==/g, '<mark style="background-color:rgba(90, 15, 15, 0.5); color:#ff4444; padding:0 4px; border-radius:3px;">$1</mark>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')                
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')                 
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')                  
            .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>') 
            .replace(/^---$/gim, '<hr>');                           

        let lines = html.split('\n');
        let inUl = false, inOl = false, finalHtml = '';

        lines.forEach(line => {
            line = line.trim(); // Satırı temizle
            if (line === '') return; // YENİ: Notion'dan gelen gereksiz boşlukları iptal et
            
            let ulMatch = line.match(/^[-*]\s+(.*)/);
            let olMatch = line.match(/^\d+\.\s+(.*)/);

            if (ulMatch) {
                if (!inUl) { finalHtml += '<ul>'; inUl = true; }
                if (inOl) { finalHtml += '</ol>'; inOl = false; }
                finalHtml += `<li>${ulMatch[1]}</li>`;
            } else if (olMatch) {
                if (!inOl) { finalHtml += '<ol>'; inOl = true; }
                if (inUl) { finalHtml += '</ul>'; inUl = false; }
                finalHtml += `<li>${olMatch[1]}</li>`;
            } else {
                if (inUl) { finalHtml += '</ul>'; inUl = false; }
                if (inOl) { finalHtml += '</ol>'; inOl = false; }
                
                if (line.match(/^<(h1|h2|h3|hr|blockquote)/)) {
                    finalHtml += line;
                } else {
                    finalHtml += `<div>${line}</div>`; 
                }
            }
        });

        if (inUl) finalHtml += '</ul>';
        if (inOl) finalHtml += '</ol>';

        document.execCommand('insertHTML', false, finalHtml);
        ensureBottomLine();
        panelData.content = editor.innerHTML;
        if (saveCallback) saveCallback();
    });

    // 4. AKILLI (PARAGRAF BAZLI) SÜRÜKLE BIRAK MOTORU & ÖNİZLEME
    let draggedMediaNode = null;
    let dropPlaceholder = null;

    editor.addEventListener('dragstart', (e) => {
        const wrapper = e.target.closest('.custom-media-wrapper');
        if (wrapper) {
            draggedMediaNode = wrapper;
            wrapper.style.opacity = '0.4'; 
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', 'custom-media-drag');

            dropPlaceholder = document.createElement('div');
            dropPlaceholder.className = 'media-drop-placeholder';
            dropPlaceholder.contentEditable = "false";
        }
    });

    editor.addEventListener('dragover', (e) => {
        if (draggedMediaNode && dropPlaceholder) {
            e.preventDefault(); 

            const y = e.clientY;
            const children = Array.from(editor.children).filter(c => c !== draggedMediaNode && c !== dropPlaceholder);
            
            let closestChild = null;
            let insertAfter = false;

            if (children.length === 0) {
                editor.appendChild(dropPlaceholder);
                return;
            }

            for (let child of children) {
                const rect = child.getBoundingClientRect();
                if (y >= rect.top && y <= rect.bottom) {
                    closestChild = child;
                    insertAfter = y > (rect.top + rect.height / 2);
                    break;
                }
            }

            if (!closestChild) {
                let closestDist = Infinity;
                for (let child of children) {
                    const rect = child.getBoundingClientRect();
                    const mid = rect.top + rect.height / 2;
                    const dist = Math.abs(y - mid);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestChild = child;
                        insertAfter = y > mid;
                    }
                }
            }

            if (closestChild) {
                if (insertAfter) closestChild.after(dropPlaceholder);
                else closestChild.before(dropPlaceholder);
            } else {
                editor.appendChild(dropPlaceholder);
            }
        }
    });

    editor.addEventListener('drop', (e) => {
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            e.preventDefault();
            alert("⚠️ Sistem Koruması: Dışarıdan dosya sürüklenemez.\n\nLütfen resmin linkini kopyalayıp yapıştırın.");
            return;
        }

        if (draggedMediaNode && dropPlaceholder) {
            e.preventDefault();
            
            dropPlaceholder.replaceWith(draggedMediaNode);
            draggedMediaNode.style.opacity = '1';
            
            const emptyDiv = document.createElement('div');
            emptyDiv.innerHTML = '<br>';
            draggedMediaNode.after(emptyDiv);
            
            draggedMediaNode = null;
            dropPlaceholder = null;
            
            ensureBottomLine();
            panelData.content = editor.innerHTML;
            if(saveCallback) saveCallback();
        }
    });

    editor.addEventListener('dragend', (e) => {
        if (draggedMediaNode) {
            draggedMediaNode.style.opacity = '1';
        }
        if (dropPlaceholder && dropPlaceholder.parentNode) {
            dropPlaceholder.remove(); 
        }
        draggedMediaNode = null;
        dropPlaceholder = null;
    });

    // 5. MEDYA EDİTLEME VE BOYUTLANDIRMA MOTORU
    editor.addEventListener('pointerdown', (e) => {
        const wrapper = e.target.closest('.custom-media-wrapper');
        
        if (!wrapper && !e.target.classList.contains('media-resize-handle')) {
            editor.querySelectorAll('.custom-media-wrapper.media-edit-mode').forEach(el => {
                el.classList.remove('media-edit-mode');
            });
            return;
        }

        if (wrapper && !e.target.classList.contains('media-resize-handle')) {
            editor.querySelectorAll('.custom-media-wrapper.media-edit-mode').forEach(el => el.classList.remove('media-edit-mode'));
            wrapper.classList.add('media-edit-mode');
        }

        if (e.target.classList.contains('media-resize-handle')) {
            e.preventDefault();
            e.stopPropagation();
            const mediaBox = e.target.closest('.custom-media-wrapper');
            const startX = e.clientX;
            const startY = e.clientY;
            const startW = mediaBox.offsetWidth;
            const startH = mediaBox.offsetHeight;

            const onMove = (moveEv) => {
                const dx = moveEv.clientX - startX;
                const dy = moveEv.clientY - startY;
                mediaBox.style.width = Math.max(50, startW + dx) + 'px';
                mediaBox.style.height = Math.max(50, startH + dy) + 'px';
            };

            const onUp = () => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
                panelData.content = editor.innerHTML;
                if(saveCallback) saveCallback();
            };

            document.addEventListener('pointermove', onMove);
            document.addEventListener('pointerup', onUp);
        }
    });

    // 6. DIŞA AKTAR (EXPORT) - MARKDOWN & NOTION HTML ÇİFT KATMANLI KOPYALAMA
    exportBtn.onclick = () => {
        let markdown = "";
        let cleanHtml = ""; // YENİ: Notion'ın okuyabilmesi için eşzamanlı HTML çıktısı

        function parseNode(n) {
            if (n.nodeType === Node.TEXT_NODE) {
                return { md: n.textContent, html: n.textContent };
            }
            if (n.nodeType === Node.ELEMENT_NODE) {
                
                // Medyaları her iki formata da uygun şekilde ayır
                if (n.classList && n.classList.contains('custom-media-wrapper')) {
                    const img = n.querySelector('img');
                    const iframe = n.querySelector('iframe');
                    if (img) return { md: `\n![Görsel](${img.src})\n`, html: `<br><img src="${img.src}"><br>` };
                    if (iframe) return { md: `\n[PDF/Link Bağlantısı](${iframe.src})\n`, html: `<br><a href="${iframe.src}">PDF/Link Bağlantısı</a><br>` };
                }

                let innerMd = "";
                let innerHtml = "";
                n.childNodes.forEach(c => {
                    const res = parseNode(c);
                    innerMd += res.md;
                    innerHtml += res.html;
                });

                // Hem Markdown Hem de Kusursuz HTML Çıktısını Eşzamanlı Üret
                switch(n.tagName) {
                    case 'H1': return { md: `\n# ${innerMd}\n`, html: `<h1>${innerHtml}</h1>` };
                    case 'H2': return { md: `\n## ${innerMd}\n`, html: `<h2>${innerHtml}</h2>` };
                    case 'H3': return { md: `\n### ${innerMd}\n`, html: `<h3>${innerHtml}</h3>` };
                    case 'P': case 'DIV': return { md: `${innerMd}\n`, html: `<div>${innerHtml}</div>` };
                    case 'BR': return { md: `\n`, html: `<br>` };
                    case 'B': case 'STRONG': return { md: `**${innerMd}**`, html: `<strong>${innerHtml}</strong>` };
                    case 'I': case 'EM': return { md: `*${innerMd}*`, html: `<em>${innerHtml}</em>` };
                    case 'U': return { md: `__${innerMd}__`, html: `<u>${innerHtml}</u>` };
                    case 'STRIKE': case 'DEL': return { md: `~~${innerMd}~~`, html: `<del>${innerHtml}</del>` };
                    case 'MARK': return { md: `==${innerMd}==`, html: `<mark style="background-color:rgba(90, 15, 15, 0.5); color:#ff4444; font-weight:bold;">${innerHtml}</mark>` };
                    case 'HR': return { md: `---\n`, html: `<hr>` };
                    case 'UL': return { md: `${innerMd}\n`, html: `<ul>${innerHtml}</ul>` };
                    case 'OL': return { md: `${innerMd}\n`, html: `<ol>${innerHtml}</ol>` };
                    case 'LI': 
                        const isOrdered = n.parentElement && n.parentElement.tagName === 'OL';
                        return { md: isOrdered ? `1. ${innerMd}\n` : `- ${innerMd}\n`, html: `<li>${innerHtml}</li>` };
                    case 'BLOCKQUOTE': return { md: `> ${innerMd}\n`, html: `<blockquote>${innerHtml}</blockquote>` };
                    default: return { md: innerMd, html: innerHtml };
                }
            }
            return { md: "", html: "" };
        }

        editor.childNodes.forEach(c => { 
            const res = parseNode(c);
            markdown += res.md;
            cleanHtml += res.html;
        });
        
        markdown = markdown.trim();
        // Notion'a HTML kopyalanırken aralara sızan gizli sürükleme boşluklarını (u200B) temizle
        cleanHtml = `<meta charset="utf-8"><div>${cleanHtml.replace(/\u200B/g, '')}</div>`; 

        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head><title>Notları Dışa Aktar</title>
            <style>
                body { background: #1a1a1a; color: #eee; font-family: sans-serif; padding: 40px; display: flex; flex-direction: column; align-items: center; }
                .container { max-width: 800px; width: 100%; }
                pre { background: #222; padding: 20px; border-radius: 8px; border: 1px solid #444; white-space: pre-wrap; font-family: monospace; font-size: 1.1em; line-height: 1.6; }
                button { background: #b52b2b; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight:bold; transition:0.2s; }
                button:hover { background: #d13d3d; }
            </style></head>
            <body>
                <div class="container">
                    <div style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
                        <h2 style="color:#b52b2b; margin:0;">📝 Markdown Çıktısı</h2>
                        <button id="copy-btn">Panoya Kopyala</button>
                    </div>
                    <pre>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
                
                <script>
                    document.getElementById('copy-btn').addEventListener('click', async function() {
                        // JavaScript değişkenlerini güvenle içeri aktar
                        const mdText = ${JSON.stringify(markdown)};
                        const htmlText = ${JSON.stringify(cleanHtml)};
                        
                        try {
                            // PANONUN BEYNİ: Aynı anda iki farklı formatı kopyalıyoruz
                            const clipboardItem = new ClipboardItem({
                                'text/plain': new Blob([mdText], { type: 'text/plain' }),
                                'text/html': new Blob([htmlText], { type: 'text/html' })
                            });
                            await navigator.clipboard.write([clipboardItem]);
                            this.innerText = '✓ Kopyalandı (Notion Uyumlu)!';
                        } catch (err) {
                            // Eğer tarayıcı eski bir sürümse veya ClipboardItem desteklemiyorsa düz metin kopyala
                            navigator.clipboard.writeText(mdText);
                            this.innerText = '✓ Sadece Metin Kopyalandı!';
                        }
                        setTimeout(() => this.innerText = 'Panoya Kopyala', 2500);
                    });
                </script>
            </body></html>
        `);
        win.document.close();
    };

    // BAŞLANGIÇTA EN ALTTA BOŞ BİR SATIR OLDUĞUNDAN EMİN OL
    ensureBottomLine();
};

function showEditorHelp() {
    let modal = document.getElementById('text-edit-help-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'text-edit-help-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-window" style="width: 450px; background: #1e1e1e; border: 1px solid #444; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.8);">
                <div class="modal-header" style="background: #252525; padding: 15px 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #b52b2b;">Zengin Metin Editörü Rehberi</h3>
                    <button class="close-modal-btn" onclick="this.closest('.modal-overlay').classList.remove('open')" style="background:none; border:none; color:#888; cursor:pointer; font-size:1.2em;">✕</button>
                </div>
                <div class="modal-content" style="padding: 20px;">
                    <h4 style="color:#e67e22; margin-bottom:10px;">Medya Ekleme (Resim / PDF)</h4>
                    <p style="font-size:0.9em; color:#ccc; margin-bottom: 15px;">İnternetteki bir <strong>Görsel Linkini (.jpg, .png)</strong> veya <strong>Google Drive Dosya Linkini</strong> buraya yapıştırın (Ctrl+V).<br><br>Düzenlemek veya boyutlandırmak için resmin üzerine <strong>bir kez tıklayın.</strong> Resmi dilediğiniz gibi farklı bir satıra sürükleyebilirsiniz.</p>
                    <h4 style="color:#e67e22; margin-bottom:10px;">Satır İçi Kısayollar (Yazarken Boşluk Bırakın)</h4>
                    <p style="font-size:0.9em; color:#ccc;"><code>*metin*</code> Kalın Yapar | <code>_metin_</code> İtalik Yapar <br> <code>==metin==</code> Kırmızı Vurgu (Highlight) Yapar</p>
                    <h4 style="color:#e67e22; margin:20px 0 10px 0;">Blok Komutları (Satır Başında + Boşluk/Enter)</h4>
                    <ul class="text-edit-help-list" style="list-style:none; padding:0; color:#ccc;">
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/h1</code> veya <code>#</code> : Ana Başlık</li>
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/h2</code> veya <code>##</code> : Alt Başlık</li>
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/list</code> veya <code>-</code> : Madde İmi (Bullet)</li>
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/quote</code> veya <code>&gt;</code> : Alıntı Kutusu</li>
                    </ul>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    setTimeout(() => modal.classList.add('open'), 10);
}