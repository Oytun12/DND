import { ref, computed, watch } from 'vue';
import { store } from './store.js';
import { formatEntry } from './utils.js';
import { calculateResources } from './logicResources.js';

export function useClassLogic() {
    
    const classList = ref([]);
    const selectedClass = ref(null);
    const selectedSubclass = ref(null);
    const targetLevel = ref(1);
    const userChoices = ref({}); 

    // --- STORE SENKRONİZASYONU ---
    watch(selectedClass, (newVal) => { 
        store.class.selected = newVal; 
        selectedSubclass.value = null; 
    });
    watch(selectedSubclass, (newVal) => { 
        store.class.subclass = newVal; 
    });
    
    // ASI Başlatma
    watch(targetLevel, (newVal) => { 
        store.class.level = newVal; 
        for (let i = 1; i <= newVal; i++) {
            if (!store.abilities.asi) store.abilities.asi = {};
            if (!store.abilities.asi[i]) {
                store.abilities.asi[i] = { feat: null, stat1: null, stat2: null };
            }
        }
    }, { immediate: true });

    const getHitDie = (cls) => cls?.hd?.faces || '?';

    // --- FEATURE PARSE MANTIĞI ---
    const extractOptions = (feat) => { 
        if (!feat) return null; 
        if (feat.type === 'options' && feat.entries) return feat.entries; 
        if (feat.entries && Array.isArray(feat.entries)) { 
            for (const e of feat.entries) {
                if (e.type === 'options' && e.entries) return e.entries;
                if (e.entries && Array.isArray(e.entries)) {
                    for (const sub of e.entries) {
                        if (sub.type === 'options' && sub.entries) return sub.entries;
                    }
                }
            } 
        } 
        return null; 
    };

    const optionSourceMap = { 
        "Dövüş Üstünlüğü": "Savaş Üstadı: Manevralar",
        "Ek Manevralar": "Savaş Üstadı: Manevralar", 
        "Arcane Atış": "Arcane Atış Seçenekleri",
        "Fazladan Arcane Atış Seçeneği": "Arcane Atış Seçenekleri",
        "Ek Metabüyü": "Metabüyü"
    };

    const findOptionsByName = (targetName) => { 
        if(!selectedSubclass.value?.subclassFeatures) return null; 
        for(const grp of selectedSubclass.value.subclassFeatures) 
            for(const f of grp) if(f.name===targetName) return extractOptions(f); 
        return null; 
    };

    const normalizeOption = (opt) => opt ? (opt.name ? opt : (opt.entries?.[0]?.name ? {...opt.entries[0], entries: opt.entries[0].entries||[]} : {name: "Seçenek", entries:[]})) : {name:"Hata", entries:[]};

    const detectSelectionCount = (feature) => {
        if (feature.selectionCount) return feature.selectionCount;
        if (feature.entries) {
            for (const entry of feature.entries) {
                if (entry.selectionCount) return entry.selectionCount;
                if (entry.type === 'options' && entry.selectionCount) return entry.selectionCount;
            }
        }
        return 0;
    };

    // --- RENDER YARDIMCILARI ---
    const attrMap = {
        "str": "Kuvvet", "dex": "Çeviklik", "con": "Dayanıklılık",
        "int": "Zeka", "wis": "Akıl", "cha": "Karizma",
        "akı": "Akıl", "kuv": "Kuvvet", "çev": "Çeviklik", "day": "Dayanıklılık", "zek": "Zeka", "kar": "Karizma"
    };

    const renderTable = (entry) => {
        if (!entry || entry.type !== 'table') return null;
        let html = '<div class="table-responsive"><table class="feature-table">';
        if (entry.caption) html += `<caption>${entry.caption}</caption>`;
        if (entry.colLabels && entry.colLabels.length > 0) {
            html += '<thead><tr>';
            entry.colLabels.forEach((lbl, index) => {
                let content = "";
                try { content = (typeof lbl === 'string') ? formatEntry(lbl) : String(lbl); } catch(e) { content = String(lbl); }
                content = content.replace(/<p>|<\/p>/g, '');
                let style = "";
                if (entry.colStyles?.[index]?.includes("text-align-center")) style = 'style="text-align: center;"';
                else if (entry.colStyles?.[index]?.includes("text-align-right")) style = 'style="text-align: right;"';
                html += `<th ${style}>${content}</th>`;
            });
            html += '</tr></thead>';
        }
        html += '<tbody>';
        if (entry.rows && entry.rows.length > 0) {
            entry.rows.forEach(row => {
                html += '<tr>';
                row.forEach(cell => {
                    let cellContent = "";
                    if (cell === null || cell === undefined) cellContent = "-";
                    else if (typeof cell === 'number') cellContent = String(cell);
                    else if (typeof cell === 'object') {
                         if(cell.roll) cellContent = cell.roll.exact ? String(cell.roll.exact) : (cell.roll.min + "-" + cell.roll.max);
                         else if (cell.entry) try { cellContent = formatEntry(cell.entry); } catch(e) { cellContent = "Detay"; }
                         else cellContent = JSON.stringify(cell);
                    } else try { cellContent = formatEntry(cell); } catch (e) { cellContent = String(cell); }
                    if(typeof cellContent === 'string') cellContent = cellContent.replace(/^<p>(.*)<\/p>$/s, '$1');
                    html += `<td>${cellContent}</td>`;
                });
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    };

    const renderEntry = (e) => {
        if (e === null || e === undefined) return "";
        if (typeof e === 'string' || typeof e === 'number') return formatEntry(String(e));
        if (Array.isArray(e)) return e.map(sub => renderEntry(sub)).join('');

        if (typeof e === 'object') {
            if (e.type === 'table') return renderTable(e);
            
            if (e.type === 'list') {
                let listHtml = `<ul style="margin: 5px 0 10px 20px; list-style-type: disc;">`;
                if (e.items) listHtml += e.items.map(item => `<li>${renderEntry(item)}</li>`).join('');
                listHtml += `</ul>`;
                return listHtml;
            }

            if (e.type === 'abilityDc' || e.type === 'abilityAttackMod') {
                let attrKey = (e.attributes && e.attributes[0]) ? e.attributes[0].toLowerCase() : 'int';
                let attrName = attrMap[attrKey] || attrKey.toUpperCase();
                let title = e.type === 'abilityDc' ? (e.name || 'Büyü') + ' Kurtulma DC' : (e.name || 'Büyü') + ' Saldırı Bonusu';
                let formula = e.type === 'abilityDc' ? `8 + Uzmanlık + ${attrName}` : `Uzmanlık + ${attrName}`;
                return `<div class="mechanic-formula-box"><strong>${title}:</strong> <span>${formula}</span></div>`;
            }

            if (e.entries) { 
                // ============================================================
                // YENİ: İSİMSİZ KAPLAYICI (GHOST FIX)
                // ============================================================
                // Eğer bu grubun bir ismi (name) yoksa, gereksiz bir kutu (div) açma.
                // Sadece içindekileri işle ve ham olarak geri döndür.
                if (!e.name) {
                    let subEntries = Array.isArray(e.entries) ? e.entries : [e.entries];
                    return subEntries.map(sub => renderEntry(sub)).join(''); 
                }
                // ============================================================

                // Eğer ismi varsa normal bir alt bölüm olarak işle
                let subHtml = `<div class="feature-subsection">`;
                subHtml += `<h5 class="feature-sub-title">${e.name}</h5>`;
                let subEntries = Array.isArray(e.entries) ? e.entries : [e.entries];
                subHtml += subEntries.map(sub => renderEntry(sub)).join(''); 
                subHtml += `</div>`;
                return subHtml;
            }
            
            if (e.entry) return renderEntry(e.entry);
        }

        try { return formatEntry(String(e)); } catch(err) { return ""; }
    };

    // ============================================================
    // 2. SEÇİM KARTI YARDIMCILARI
    // ============================================================

    const renderFeatHeader = (feat) => {
        let metaHtml = "";

        if (feat.prerequisite && feat.prerequisite.length > 0) {
            let reqText = "";
            const reqs = feat.prerequisite.map(req => {
                if(typeof req === 'string') return req;
                if(req.level) return `${req.level}. Seviye`;
                if(req.race) return `Irk: ${req.race.map(r => r.name || r).join(" veya ")}`;
                if(req.ability) return "Belirli Stat Gereksinimi";
                if(req.spell) return "Büyü Yeteneği";
                return "Özel";
            });
            metaHtml += `<div style="margin-bottom:10px; color:#ccc;"><strong style="color:#b52b2b;">Gereksinim: </strong> ${reqs.join(", ")}</div>`;
        }

        if (feat.ability) {
            let bonuses = [];
            for (const [key, val] of Object.entries(feat.ability)) {
                if (key !== 'choose' && attrMap[key]) {
                    bonuses.push(`${attrMap[key]} +${val}`);
                }
            }
            if (feat.ability.choose) {
                const choices = Array.isArray(feat.ability.choose) ? feat.ability.choose : [feat.ability.choose];
                choices.forEach(ch => {
                    if (ch.from) {
                        const labels = ch.from.map(k => attrMap[k] || k.toUpperCase());
                        if (labels.length > 5) bonuses.push(`Herhangi bir Stat +${ch.amount || 1}`);
                        else bonuses.push(`${labels.join(" veya ")} +${ch.amount || 1}`);
                    }
                });
            }
            if (bonuses.length > 0) {
                metaHtml += `<div style="margin-bottom:8px; color:#ccc;"><strong style="color:#e67e22;">Stat Artışı:</strong> ${bonuses.join(", ")}</div>`;
            }
        }

        if (metaHtml) {
            metaHtml += `<div style="border-bottom: 1px dashed #444; margin-bottom: 15px; padding-bottom:5px;"></div>`;
        }

        return metaHtml;
    };

    const getExactChoices = (featureName, level, count) => {
        if (!userChoices.value || count <= 0) return [];
        const choicesList = [];
        for (let i = 0; i < count; i++) {
            const key = `${featureName}-${level}_${i}`;
            const selection = userChoices.value[key];
            if (selection) {
                let descHtml = "";
                if (typeof selection === 'string') {
                    choicesList.push({ type: 'simple', name: selection, desc: '' });
                } else {
                    if (selection.entries) descHtml = renderEntry(selection.entries);
                    else if (selection.desc) descHtml = formatEntry(selection.desc);
                    
                    choicesList.push({
                        type: 'card',
                        name: selection.name,
                        desc: descHtml
                    });
                }
            }
        }
        return choicesList;
    };

    // ============================================================
    // 3. ANA İŞLEYİCİLER
    // ============================================================

    const processFeature = (feat, isSub) => {
        if (!feat) return { name: "Bilinmeyen", entries: [], isSubclass: isSub };
        try {
            let opts = extractOptions(feat);
            if(!opts && optionSourceMap[feat.name]) opts = findOptionsByName(optionSourceMap[feat.name]);
            let cleanOpts = opts ? opts.map(normalizeOption) : [];
            let count = detectSelectionCount(feat);
            if(cleanOpts.length > 0 && count === 0) count = 1;

            let rawEntries = feat.entries || [];
            if (feat.type === 'options') {
                rawEntries = [];
            } else if (Array.isArray(rawEntries)) {
                rawEntries = rawEntries.filter(e => e.type !== 'options');
            }

            let processedEntries = [];
            if (rawEntries.length > 0) {
                processedEntries = rawEntries.map(e => renderEntry(e)).filter(t => t);
            } else if (cleanOpts.length > 0) {
                processedEntries = []; 
            } else {
                processedEntries = ["Detay yok"];
            }

            return { 
                name: feat.name, 
                entries: processedEntries, 
                isSubclass: isSub, 
                hasOptions: !!cleanOpts.length, 
                options: cleanOpts, 
                selectionCount: count,
                choices: []
            };
        } catch(e) { 
            console.error("Feature error:", feat.name);
            return {name: feat.name || "Hata", entries:["Veri hatası"], isSubclass:false, choices:[]}; 
        }
    };

    const subclassUnlockLevel = computed(() => selectedClass.value?.classFeatures?.findIndex(grp => grp.some(f => f.gainSubclassFeature)) + 1 || -1);
    const subclassOptions = computed(() => selectedClass.value?.subclasses || []);
    
    // --- ACTIVE FEATURES ---
    const activeFeatures = computed(() => {
        if (!selectedClass.value) return [];
        const timeline = [];
        
        for (let i = 0; i < targetLevel.value; i++) {
            const feats = [];
            const currentLvl = i + 1;
            
            selectedClass.value.classFeatures[i]?.forEach(f => {
               let processed = processFeature(f, false);

                // --- FEAT ENJEKSİYONU ---
                if (processed.name === 'Yetenek Skoru Gelişimi' || processed.name === 'Ability Score Improvement') {
                    const currentAsi = store.abilities.asi[currentLvl];
                    if (currentAsi && currentAsi.feat && store.data && store.data.feats) {
                        const featObj = store.data.feats.find(ft => ft.name === currentAsi.feat);
                        if (featObj) {
                            const fullDesc = renderFeatHeader(featObj) + renderEntry(featObj.entries);
                            
                            processed.choice = {
                                type: 'card',
                                name: featObj.name,
                                desc: fullDesc 
                            };
                            processed.choices = [ processed.choice ];
                        }
                    }
                }

                if (processed.selectionCount > 0) {
                    const choicesFound = getExactChoices(processed.name, currentLvl, processed.selectionCount);
                    if (choicesFound.length > 0) {
                        processed.choices = choicesFound;
                    }
                }

                if (processed.hasOptions) {
                    processed.hasOptions = true;
                    processed.options = processed.options; 
                }
                feats.push(processed);
            
                if(f.gainSubclassFeature) {
                    if(selectedSubclass.value) {
                        const subFeatIndex = timeline.filter(t => t.features.some(ft => ft.isSubclass)).length;
                        selectedSubclass.value.subclassFeatures?.[subFeatIndex]?.forEach(sf => {
                            let subProcessed = processFeature(sf, true);
                            
                            if (subProcessed.selectionCount > 0) {
                                const subChoicesFound = getExactChoices(subProcessed.name, currentLvl, subProcessed.selectionCount);
                                if (subChoicesFound.length > 0) {
                                    subProcessed.choices = subChoicesFound;
                                }
                            }
                            feats.push(subProcessed);
                        });
                    }
                }
            });
            if(feats.length || currentLvl === subclassUnlockLevel.value) timeline.push({level: currentLvl, features: feats});
        }
        return timeline;
    });
    
    const getAvailableOptions = (all, key) => { 
        if(!all) return []; 
        const used = new Set(Object.entries(userChoices.value).filter(([k,v]) => k!==key && v?.name).map(([_,v]) => v.name)); 
        return all.filter(o => !used.has(o.name)); 
    };
    
    const getChoiceDetail = (n, l, i) => formatEntry(userChoices.value[`${n}-${l}_${i}`]);
    const getDisplayChoice = (featureName) => null; 

    // --- RESOURCES (YENİLENMİŞ HALİ) ---
    // Artık hesaplamayı logicResources.js yapıyor.
    const classResources = computed(() => {
        // Store'daki yetenek puanlarını alıyoruz. 
        // DİKKAT: store.abilities.base ham puandır. Bonus eklenmiş halini appKarYa tarafı biliyor.
        // Ancak store üzerinden erişebildiğimiz en iyi veri şu an bu.
        // İdeal çözüm: appKarYa.js'den finalAbilityScores'u buraya inject etmek olurdu.
        // Fakat şimdilik store.abilities.base kullanıp ırk bonuslarını logicScores'dan çekemediğimiz için
        // yaklaşık bir değer (veya appKarYa'da hesaplanan değeri store'a yazarak) kullanabiliriz.
        // Şimdilik store.abilities.base üzerinden gidelim, bonuslar eksik olabilir ama çalışır.
        
        return calculateResources(
            selectedClass.value,
            selectedSubclass.value,
            store.race.selected,
            targetLevel.value,
            store.abilities.base // Veya appKarYa.js'den buraya provide/inject ile final skorları taşıyabilirsin.
        );
    });

    return {
        classList,
        selectedClass,
        selectedSubclass,
        targetLevel,
        userChoices,
        subclassOptions,
        subclassUnlockLevel,
        activeFeatures,
        getHitDie,
        getAvailableOptions,
        getChoiceDetail,
        classResources,
        getDisplayChoice
    };
}