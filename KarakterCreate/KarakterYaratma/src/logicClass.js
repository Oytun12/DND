import { ref, computed, watch } from 'vue';
import { store } from './store.js';
import { formatEntry } from './utils.js';

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
                let subHtml = `<div class="feature-subsection">`;
                if (e.name) subHtml += `<h5 class="feature-sub-title">${e.name}</h5>`;
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
    // 2. SEÇİM KARTI YARDIMCILARI (GÜNCELLENMİŞ VERSİYON)
    // ============================================================

    // Özelliğin seçilmesi gereken sayısına göre (selectionCount),
    // o seviyeye ait yapılmış seçimleri bulur (Dizi Olarak Döner).
    const getExactChoices = (featureName, level, count) => {
        if (!userChoices.value || count <= 0) return [];
        
        const choicesList = [];
        
        // Sihirbazda kayıt formatı: "FeatureName-Level_Index"
        // Örn: "Eldritch Yakarışları-2_0", "Eldritch Yakarışları-2_1"
        
        for (let i = 0; i < count; i++) {
            const key = `${featureName}-${level}_${i}`;
            const selection = userChoices.value[key];

            if (selection) {
                // Seçim verisini görüntüye uygun hale getir
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
            // Eğer seçenek listesi var ama count 0 geliyorsa varsayılan 1 olsun
            if(cleanOpts.length > 0 && count === 0) count = 1;

            // Filtreleme: Seçim listesi varsa ana metinden çıkar
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
                selectionCount: count, // Seçim sayısını dışarıya veriyoruz
                choices: [] // Varsayılan boş
            };
        } catch(e) { 
            console.error("Feature error:", feat.name);
            return {name: feat.name || "Hata", entries:["Veri hatası"], isSubclass:false, choices:[]}; 
        }
    };

    const subclassUnlockLevel = computed(() => selectedClass.value?.classFeatures?.findIndex(grp => grp.some(f => f.gainSubclassFeature)) + 1 || -1);
    const subclassOptions = computed(() => selectedClass.value?.subclasses || []);
    
    // --- ACTIVE FEATURES (SEÇİM ENJEKSİYONLU) ---
    const activeFeatures = computed(() => {
        if (!selectedClass.value) return [];
        const timeline = [];
        const optionCache = {}; 
    
        for (let i = 0; i < targetLevel.value; i++) {
            const feats = [];
            const currentLvl = i + 1; // Seviye 1-20
            
            selectedClass.value.classFeatures[i]?.forEach(f => {
               let processed = processFeature(f, false);

                // --- GÜNCEL SEÇİM ENJEKSİYONU ---
                // Özelliğin kaç seçim hakkı olduğuna (selectionCount) bakıyoruz.
                // Ve o seviyeye (currentLvl) ait seçimleri çekiyoruz.
                if (processed.selectionCount > 0) {
                    const choicesFound = getExactChoices(processed.name, currentLvl, processed.selectionCount);
                    if (choicesFound.length > 0) {
                        processed.choices = choicesFound;
                    }
                }

                if (processed.hasOptions) {
                    optionCache[processed.name] = processed.options;
                }
                else if (optionCache[processed.name] && !processed.hasOptions) {
                    processed.hasOptions = true;
                    processed.options = optionCache[processed.name];
                    if (processed.selectionCount === 0) processed.selectionCount = 1;
                }
                feats.push(processed);
            
                if(f.gainSubclassFeature) {
                    if(selectedSubclass.value) {
                        const subFeatIndex = timeline.filter(t => t.features.some(ft => ft.isSubclass)).length;
                        selectedSubclass.value.subclassFeatures?.[subFeatIndex]?.forEach(sf => {
                            let subProcessed = processFeature(sf, true);
                            
                            // Alt Sınıf Seçimleri (Aynı Mantık)
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

    // Dışarı açmak için (HTML artık processed.choices kullanıyor ama referans kalsın)
    const getDisplayChoice = (featureName) => null; 

    // --- RESOURCES ---
    const classResources = computed(() => {
        const cls = selectedClass.value;
        const sub = selectedSubclass.value;
        const lvl = targetLevel.value;
        const resources = [];

        if (!cls) return resources;
        const cName = cls.name;
        const sName = sub ? sub.name : "";
        const rName = store.race.selected?.name || "";

        const hdFace = getHitDie(cls);
        resources.push({ id: 'hit_dice', name: `Can Zarı (d${hdFace})`, max: lvl, reset: 'long' });

        if (rName === 'Aasimar') resources.push({ id: 'celestial_rev', name: 'Semavi Dönüşüm', max: 1, reset: 'long' });
        if (rName.includes('Tiefling') && lvl >= 3) {
             resources.push({ id: 'hellish_rebuke', name: 'Cehennem Azarı (2.Sv)', max: 1, reset: 'long' });
             if (lvl >= 5) resources.push({ id: 'darkness_race', name: 'Karanlık (2.Sv)', max: 1, reset: 'long' });
        }
        if (rName.includes('Ejder')) resources.push({ id: 'breath_weapon', name: 'Ejder Nefesi', max: 1, reset: 'short' });

        if (cName === 'Dövüşçü' || cName === 'Savaşçı') {
            resources.push({ id: 'second_wind', name: 'İkinci Soluk', max: 1, reset: 'short' });
            if (lvl >= 2) {
                let maxAS = 1; if (lvl >= 17) maxAS = 2;
                resources.push({ id: 'action_surge', name: 'Eylem Coşkusu', max: maxAS, reset: 'short' });
            }
            if (sName.includes('Savaş Üstadı') && lvl >= 3) {
                let dice = 4; if (lvl >= 15) dice = 6; else if (lvl >= 7) dice = 5;
                resources.push({ id: 'sup_dice', name: 'Üstünlük Zarı', max: dice, reset: 'short' });
            }
            if (sName.includes('Samuray') && lvl >= 3) resources.push({ id: 'fighting_spirit', name: 'Dövüş Ruhu', max: 3, reset: 'long' });
            if (sName.includes('Psi') && lvl >= 3) resources.push({ id: 'psi_dice', name: 'Psionik Enerji', max: 2 * Math.ceil(lvl / 4) + 1, reset: 'long' });
        }

        if (cName === 'Barbar') {
            let maxRage = 2; if (lvl >= 17) maxRage = 6; else if (lvl >= 12) maxRage = 5; else if (lvl >= 6) maxRage = 4; else if (lvl >= 3) maxRage = 3;
            resources.push({ id: 'rage', name: 'Öfke (Rage)', max: maxRage, reset: 'long' });
        }

        if (cName === 'Keşiş' && lvl >= 2) resources.push({ id: 'ki', name: 'Ki Puanı', max: lvl, reset: 'short' });

        if (cName === 'Warlock' || cName === 'Cadı') {
            let slots = 1; if (lvl >= 17) slots = 4; else if (lvl >= 11) slots = 3; else if (lvl >= 2) slots = 2;
            resources.push({ id: 'pact_slots', name: 'Pact Slotları', max: slots, reset: 'short' });
        }

        if (cName === 'Sihirbaz') {
            resources.push({ id: 'arcane_recovery', name: 'Slot Yenileme (Arcane Rec.)', max: 1, reset: 'long' });
            if (sName.includes('Kılıç') && lvl >= 2) resources.push({ id: 'bladesong', name: 'Kılıç Şarkısı', max: Math.ceil(lvl / 4) + 1, reset: 'long' });
        }
        
        if (cName === 'Büyücü' && lvl >= 2) resources.push({ id: 'sorcery_points', name: 'Büyücülük Puanı', max: lvl, reset: 'long' });

        if ((cName === 'Rahip' && lvl >= 2) || (cName === 'Paladin' && lvl >= 3)) {
             let maxCD = 1; if (cName === 'Rahip') { if (lvl >= 18) maxCD = 3; else if (lvl >= 6) maxCD = 2; }
             resources.push({ id: 'channel_divinity', name: 'Kutsal Kanal', max: maxCD, reset: 'short' });
        }
        if (cName === 'Paladin') resources.push({ id: 'lay_on_hands', name: 'Şifa Elleri (HP)', max: lvl * 5, reset: 'long' });

        if (cName === 'Ozan') {
             const chaMod = Math.max(1, Math.floor(((store.abilities.base.cha || 10) - 10) / 2));
             const resetType = lvl >= 5 ? 'short' : 'long';
             resources.push({ id: 'bardic', name: 'Ozan İlhamı', max: chaMod, reset: resetType });
        }
        
        if (cName === 'Druid' && lvl >= 2) resources.push({ id: 'wild_shape', name: 'Vahşi Şekil', max: 2, reset: 'short' });

        return resources;
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