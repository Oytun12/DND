import { ref, computed, watch } from 'vue';
import { store } from './store.js';
import { parseTags, formatEntry } from './utils.js';

export function useRaceLogic() {
    
    // Veriler
    const raceList = ref([]);
    const selectedFlatOption = ref(null);

    // --- YARDIMCI: Dil Çevirici Haritası ---
    // JSON'dan "kuv" gelirse "str", "çev" gelirse "dex" olarak sisteme tanıtmalıyız.
    const abilityKeyMap = { 
        'kuv': 'str', 'str': 'str', 
        'çev': 'dex', 'dex': 'dex', 
        'day': 'con', 'con': 'con', 
        'zek': 'int', 'int': 'int', 
        'akı': 'wis', 'wis': 'wis', 
        'kar': 'cha', 'cha': 'cha' 
    };

    const getKey = (k) => abilityKeyMap[k.toLowerCase()] || k.toLowerCase();

    // Düzleştirilmiş Irk Listesi
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

    // Seçim İzleyici
    watch(selectedFlatOption, (newVal) => {
        if (newVal) {
            store.race.selected = newVal.race;
            store.race.subrace = newVal.subrace;
            store.race.abilityChoices = {}; 
        } else {
            store.race.selected = null;
            store.race.subrace = null;
            store.race.abilityChoices = {};
        }
    });

    // Seçmeli Statlar (Variant Human, Half-Elf vb. için)
    const raceChoiceConfig = computed(() => {
        if (!store.race.selected) return null;
        
        // Veri kaynağını belirle (Alt ırk mı, Ana ırk mı?)
        const source = store.race.subrace?.ability ? store.race.subrace : store.race.selected;
        
        if (source && source.ability) {
            // ability verisi JSON'da bazen direkt Obje, bazen Dizi olabilir.
            // Örn: İnsan (Alternatif) JSON'ında Obje içinde Dizi var.
            // Örn: Standart veri setlerinde direkt Dizi olabilir.
            
            // Güvenli erişim için önce diziye çevirip ilkini alalım, değilse kendisini alalım.
            const abilityData = Array.isArray(source.ability) ? source.ability[0] : source.ability;
            
            // "choose" verisi var mı?
            if (abilityData && abilityData.choose) {
                // choose da bir dizi olabilir: [{from:..., count:...}]
                const chooseItem = Array.isArray(abilityData.choose) ? abilityData.choose[0] : abilityData.choose;
                
                // KRİTİK DÜZELTME:
                // JSON'daki "from": ["kuv", "çev"] listesini sistem diline ("str", "dex") çevirmeliyiz.
                // Aksi takdirde dropdown'lar boş çıkar.
                let mappedFrom = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
                
                if (chooseItem.from) {
                    mappedFrom = chooseItem.from.map(k => getKey(k));
                }

                return {
                    count: chooseItem.count || 1,
                    amount: chooseItem.amount || 1,
                    from: mappedFrom
                };
            }
        }
        return null;
    });

    // Toplam Irk Bonuslarını Hesapla
    const raceBonuses = computed(() => {
        const bonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
        if (!store.race.selected) return bonuses;
        
        const addBonus = (rawAbility) => {
            if (!rawAbility) return;
            
            // Veri dizi değilse diziye çevirip işle (Standardizasyon)
            const abilityList = Array.isArray(rawAbility) ? rawAbility : [rawAbility];

            abilityList.forEach(abilityObj => {
                for (const [key, val] of Object.entries(abilityObj)) {
                    if (key === 'choose') continue; // Seçim verisini toplama dahil etme
                    
                    const mappedKey = getKey(key);
                    if (bonuses[mappedKey] !== undefined) bonuses[mappedKey] += val;
                }
            });
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