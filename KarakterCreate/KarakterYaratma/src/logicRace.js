import { ref, computed, watch } from 'vue';
import { store } from './store.js';
import { parseTags, formatEntry } from './utils.js';

export function useRaceLogic() {
    
    // Veriler (API'den doldurulacak)
    const raceList = ref([]);
    const selectedFlatOption = ref(null);

    // Düzleştirilmiş Irk Listesi (Alt ırkları ana listeye yayar)
    const flatRaceList = computed(() => {
        const list = [];
        if (!raceList.value) return [];
            
        raceList.value.forEach(r => {
            if (r.subraces && r.subraces.length > 0) {
                r.subraces.forEach(sub => {
                    const subName = sub.name || "Standart"; 
                    list.push({ 
                        label: `${r.name} (${subName})`, 
                        race: r, 
                        subrace: sub 
                    });
                });
            } else {
                list.push({ label: r.name, race: r, subrace: null });
            }
        });
        return list;
    });

    // Seçim İzleyici (Dropdown değişince Store'u güncelle)
    watch(selectedFlatOption, (newVal) => {
        if (newVal) {
            store.race.selected = newVal.race;
            store.race.subrace = newVal.subrace;
            store.race.abilityChoices = {}; // Seçim değişince manuel statları sıfırla
        } else {
            store.race.selected = null;
            store.race.subrace = null;
            store.race.abilityChoices = {};
        }
    });

    // Seçmeli Statlar (Variant Human vb. için)
    const raceChoiceConfig = computed(() => {
        if (!store.race.selected) return null;
        const source = store.race.subrace?.ability ? store.race.subrace : store.race.selected;
        if (source && source.ability && source.ability.choose) {
            const chooseData = source.ability.choose[0] || source.ability.choose; 
            return {
                count: chooseData.count || 1, amount: chooseData.amount || 1,
                from: chooseData.from || ['str', 'dex', 'con', 'int', 'wis', 'cha']
            };
        }
        return null;
    });

    const abilityKeyMap = { 'kuv': 'str', 'str': 'str', 'çev': 'dex', 'dex': 'dex', 'day': 'con', 'con': 'con', 'zek': 'int', 'int': 'int', 'akı': 'wis', 'wis': 'wis', 'kar': 'cha', 'cha': 'cha' };
    
    // Toplam Irk Bonuslarını Hesapla
    const raceBonuses = computed(() => {
        const bonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
        if (!store.race.selected) return bonuses;
        const getKey = (k) => abilityKeyMap[k.toLowerCase()] || k.toLowerCase();
        
        const addBonus = (abilityObj) => {
            if (!abilityObj) return;
            for (const [key, val] of Object.entries(abilityObj)) {
                if (key === 'choose') continue; 
                const mappedKey = getKey(key);
                if (bonuses[mappedKey] !== undefined) bonuses[mappedKey] += val;
            }
        };
        if (store.race.selected.ability) addBonus(store.race.selected.ability);
        if (store.race.subrace && store.race.subrace.ability) addBonus(store.race.subrace.ability);
        
        const choiceConfig = raceChoiceConfig.value;
        if (choiceConfig) {
            Object.values(store.race.abilityChoices).forEach(statKey => {
                if (statKey) {
                    const mappedKey = getKey(statKey);
                    if (bonuses[mappedKey] !== undefined) bonuses[mappedKey] += choiceConfig.amount;
                }
            });
        }
        return bonuses;
    });

    // Ekrana basılacak özellik listesi (Traits)
    const activeRaceTraits = computed(() => {
        if (!store.race.selected) return [];
        let traits = [];
        if (store.race.selected.entries) traits = store.race.selected.entries.map(t => ({...t}));
        if (store.race.subrace && store.race.subrace.entries) {
            store.race.subrace.entries.forEach(subTrait => {
                if (subTrait.data && subTrait.data.overwrite) traits = traits.filter(t => t.name !== subTrait.data.overwrite);
                traits.push(subTrait);
            });
        }
        const formattedTraits = traits.map(trait => {
            if (typeof trait === 'string') return { name: "Özellik", text: parseTags(trait) };
            let processedText = "";
            if (trait.entries) processedText = trait.entries.map(e => formatEntry(e)).join("<br><br>");
            return { name: trait.name, text: processedText };
        });
        const bonusText = Object.entries(raceBonuses.value).filter(([_, val]) => val !== 0).map(([key, val]) => `<strong style="color:#4caf50">${key.toUpperCase()} +${val}</strong>`).join(', ');
        let headerText = bonusText ? `<p>Irkınızdan gelen doğal yetenekleriniz: ${bonusText}</p>` : `<p style="color:#e67e22">Lütfen yukarıdan yetenek puanı artışlarını seçiniz.</p>`;
        formattedTraits.unshift({ name: "Yetenek Puanı Artışı", text: headerText });
        return formattedTraits;
    });

    return {
        raceList,
        flatRaceList,
        selectedFlatOption,
        raceChoiceConfig,
        raceBonuses,
        activeRaceTraits
    };
}