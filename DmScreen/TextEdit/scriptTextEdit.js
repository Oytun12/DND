/* ============================================================
   ZENGİN METİN EDİTÖRÜ (NOTION TARZI) - MODÜL LOGIC
   ============================================================ */

window.initTextEditor = function(panelEl, panelData, saveCallback) {
    const editor = panelEl.querySelector('.rich-text-editor');
    const exportBtn = panelEl.querySelector('.export-notes-btn');
    if (!editor) return;

    // 1. OTOMATİK KAYDETME VE YABANCI MADDE TEMİZLİĞİ
    editor.addEventListener('input', () => {
        editor.querySelectorAll('.custom-media-wrapper').forEach(wrapper => {
            Array.from(wrapper.childNodes).forEach(child => {
                if (child.nodeType === 3) child.remove(); 
            });
        });
        panelData.content = editor.innerHTML;
        if (saveCallback) saveCallback();
    });

    // 2. KLAVYE KISAYOLLARI VE İMLEÇ KORUMASI
    editor.addEventListener('keydown', (e) => {
        const sel = window.getSelection();
        if (!sel.rangeCount) return;
        const node = sel.anchorNode;

        let wrapperCheck = node.nodeType === 3 ? node.parentNode.closest('.custom-media-wrapper') : node.closest('.custom-media-wrapper');
        if (wrapperCheck) {
            if (!e.key.startsWith('Arrow') && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault();
                return;
            }
        }

        if (e.key === ' ' || e.key === 'Enter') {
            if (node.nodeType === 3) { 
                const text = node.textContent;
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
                    const words = text.split(' ');
                    const lastWord = words[words.length - 1];
                    const replacements = {
                        '->': '→', '<-': '←', '=>': '⇒',
                        ':D': '😃', ':)': '🙂', ':(': '😞',
                        '/shrug': '¯\\_(ツ)_/¯', ':/': '😕', '<3': '❤️'
                    };

                    if (replacements[lastWord]) {
                        e.preventDefault();
                        const range = document.createRange();
                        range.setStart(node, text.length - lastWord.length);
                        range.setEnd(node, text.length);
                        sel.removeAllRanges();
                        sel.addRange(range);
                        document.execCommand('delete', false, null);
                        document.execCommand('insertText', false, replacements[lastWord] + ' ');
                    }
                }
            }
        }
    });

    // 3. YAPIŞTIRMA MANTIĞI (SİSTEM KORUMASI EKLENDİ)
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
                panelData.content = editor.innerHTML;
                if (saveCallback) saveCallback();
                return; 
            }
        }

        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')       
            .replace(/\*(.*?)\*/g, '<em>$1</em>')                   
            .replace(/_(.*?)_/g, '<em>$1</em>')                     
            .replace(/~~(.*?)~~/g, '<del>$1</del>')                 
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')                
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')                 
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')                  
            .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>') 
            .replace(/^---$/gim, '<hr>');                           

        let lines = html.split('\n');
        let inUl = false, inOl = false, finalHtml = '';

        lines.forEach(line => {
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
                } else if (line.trim() === '') {
                    finalHtml += '<div><br></div>'; 
                } else {
                    finalHtml += `<div>${line}</div>`; 
                }
            }
        });

        if (inUl) finalHtml += '</ul>';
        if (inOl) finalHtml += '</ol>';

        document.execCommand('insertHTML', false, finalHtml);
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

            // Önizleme (Placeholder) Çizgisini Yarat
            dropPlaceholder = document.createElement('div');
            dropPlaceholder.className = 'media-drop-placeholder';
            dropPlaceholder.contentEditable = "false";
        }
    });

    editor.addEventListener('dragover', (e) => {
        if (draggedMediaNode && dropPlaceholder) {
            e.preventDefault(); // Sürüklemeye İzin Ver

            const y = e.clientY;
            // Editörün içindeki blok seviyesindeki tüm çocukları al (Sürüklenen öğe ve çizgi hariç)
            const children = Array.from(editor.children).filter(c => c !== draggedMediaNode && c !== dropPlaceholder);
            
            let closestChild = null;
            let insertAfter = false;

            if (children.length === 0) {
                editor.appendChild(dropPlaceholder);
                return;
            }

            // Fareye (Y ekseni) en yakın olan bloğu (Paragraf, H1, Liste vb.) bul
            for (let child of children) {
                const rect = child.getBoundingClientRect();
                if (y >= rect.top && y <= rect.bottom) {
                    closestChild = child;
                    // Eğer farenin imleci bloğun alt yarısındaysa "Altına" (After) yapıştır, üstündeyse "Üstüne" (Before)
                    insertAfter = y > (rect.top + rect.height / 2);
                    break;
                }
            }

            // Eğer tam üstünde değilsek ama aralardaysak en yakınını mesafe ölçerek bul
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

            // Önizleme Çizgisini İlgili Yere Yerleştir
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
            
            // Sürüklenen Öğeyi Tam Olarak Kırmızı Çizginin Olduğu Yere Taşı (Replace)
            dropPlaceholder.replaceWith(draggedMediaNode);
            draggedMediaNode.style.opacity = '1';
            
            // Altında yazı yazmaya devam edebilmek için boş bir satır oluştur
            const emptyDiv = document.createElement('div');
            emptyDiv.innerHTML = '<br>';
            draggedMediaNode.after(emptyDiv);
            
            // Temizlik
            draggedMediaNode = null;
            dropPlaceholder = null;
            
            panelData.content = editor.innerHTML;
            if(saveCallback) saveCallback();
        }
    });

    editor.addEventListener('dragend', (e) => {
        if (draggedMediaNode) {
            draggedMediaNode.style.opacity = '1';
        }
        if (dropPlaceholder && dropPlaceholder.parentNode) {
            dropPlaceholder.remove(); // Yanlışlıkla dışarı bırakılırsa çizgiyi yok et
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

    // 6. DIŞA AKTAR (EXPORT)
    exportBtn.onclick = () => {
        let markdown = "";
        function parseNode(n) {
            if (n.nodeType === Node.TEXT_NODE) return n.textContent;
            if (n.nodeType === Node.ELEMENT_NODE) {
                
                if (n.classList && n.classList.contains('custom-media-wrapper')) {
                    const img = n.querySelector('img');
                    const iframe = n.querySelector('iframe');
                    if (img) return `\n\n![Görsel](${img.src})\n\n`;
                    if (iframe) return `\n\n[PDF/Link Bağlantısı](${iframe.src})\n\n`;
                }

                let inner = "";
                n.childNodes.forEach(c => inner += parseNode(c));
                switch(n.tagName) {
                    case 'H1': return `# ${inner}\n\n`;
                    case 'H2': return `## ${inner}\n\n`;
                    case 'H3': return `### ${inner}\n\n`;
                    case 'P': case 'DIV': return `${inner}\n`;
                    case 'BR': return `\n`;
                    case 'B': case 'STRONG': return `**${inner}**`;
                    case 'I': case 'EM': return `*${inner}*`;
                    case 'U': return `__${inner}__`;
                    case 'STRIKE': case 'DEL': return `~~${inner}~~`;
                    case 'HR': return `---\n\n`;
                    case 'UL': return `${inner}\n`;
                    case 'OL': return `${inner}\n`;
                    case 'LI': 
                        const isOrdered = n.parentElement && n.parentElement.tagName === 'OL';
                        return isOrdered ? `1. ${inner}\n` : `- ${inner}\n`;
                    case 'BLOCKQUOTE': return `> ${inner}\n\n`;
                    default: return inner;
                }
            }
            return "";
        }
        editor.childNodes.forEach(c => { markdown += parseNode(c); });
        markdown = markdown.trim();

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
                        <button onclick="navigator.clipboard.writeText(document.querySelector('pre').innerText).then(()=>this.innerText='✓ Kopyalandı!')">Panoya Kopyala</button>
                    </div>
                    <pre>${markdown.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
                </div>
            </body></html>
        `);
        win.document.close();
    };
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
                    <h4 style="color:#e67e22; margin-bottom:10px;">Blok Komutları (Satır Başında + Boşluk/Enter)</h4>
                    <ul class="text-edit-help-list" style="list-style:none; padding:0; color:#ccc;">
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/h1</code> veya <code>#</code> : Ana Başlık</li>
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/h2</code> veya <code>##</code> : Alt Başlık</li>
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/num</code> veya <code>1.</code> : Numaralı Liste</li>
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/list</code> veya <code>-</code> : Madde İmi (Bullet)</li>
                        <li style="margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/quote</code> veya <code>&gt;</code> : Alıntı Kutusu</li>
                        <li style="margin-bottom:8px;"><code style="background:#111; color:#b52b2b; padding:2px 6px; border-radius:4px;">/line</code> veya <code>---</code> : Ayırıcı Çizgi</li>
                    </ul>
                    <h4 style="color:#e67e22; margin:20px 0 10px 0;">Klavye Kısayolları (Metni Seçip)</h4>
                    <p style="font-size:0.9em; color:#ccc;"><code>Ctrl+B</code> Kalın | <code>Ctrl+I</code> İtalik | <code>Ctrl+U</code> Altı Çizili</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    setTimeout(() => modal.classList.add('open'), 10);
}