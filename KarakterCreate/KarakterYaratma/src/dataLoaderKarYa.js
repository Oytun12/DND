const DATA_ROOT = '../../Data'; 

export const DataLoader = {
    async loadJSON(fileName) {
        try {
            const fullPath = `${DATA_ROOT}/${fileName}`;
            const response = await fetch(fullPath);
            if (!response.ok) throw new Error(`Dosya bulunamadı: ${fileName}`);
            return await response.json();
        } catch (error) {
            console.error("Veri yükleme hatası:", error);
            throw error;
        }
    },

    // Sınıf verisini çeker
    async getClassData() {
        const data = await this.loadJSON('classes.json');
        return data; 
    },

    // YENİ: Feat (Yetenek) verisini çeker
    async getFeatsData() {
        try {
            const data = await this.loadJSON('feats.json');
            // 5eTools formatında genellikle { feat: [...] } olur
            return data.feat || data;
        } catch (e) {
            console.warn("Feats dosyası yüklenemedi, boş dizi dönülüyor.");
            return [];
        }
    }
};

// Background verisi için bağımsız fonksiyon (Düzeltildi)
export async function loadBackgroundData() {
    try {
        // ESKİ HATALI KOD: const response = await fetch('Data/backgrounds.json');
        // YENİ DÜZELTİLMİŞ KOD: DataLoader.loadJSON kullanıyoruz, yol otomatik düzeliyor.
        const data = await DataLoader.loadJSON('backgrounds.json');
        
        console.log("Geçmişler yüklendi:", data.background?.length);
        return data.background || []; 
    } catch (error) {
        console.error("Background verisi yüklenemedi:", error);
        return [];
    }
}

// --- src/dataLoaderKarYa.js DOSYASININ SONUNA EKLE ---

// Yardımcı: Boş değerleri temizle
function cleanObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.length > 0 ? obj.map(cleanObject).filter(v => v !== null && v !== undefined && v !== "") : undefined;
    }
    const res = {};
    let hasKeys = false;
    for (const key in obj) {
        const val = cleanObject(obj[key]);
        if (val !== null && val !== undefined && val !== "" && !(Array.isArray(val) && val.length === 0) && !(typeof val === 'object' && Object.keys(val).length === 0)) {
            res[key] = val;
            hasKeys = true;
        }
    }
    return hasKeys ? res : undefined;
}

// 1. STORE'DAN SEED OLUŞTURMA FONKSİYONU
export const generateSeedFromStore = (store) => {
    // Kaydedilecek veri paketini oluştur (Computed'daki characterSeed mantığının aynısı)
    const exportData = {
        n: store.meta.name,
        r: store.race.selected?.name,
        sr: store.race.subrace?.name,
        ac: store.race.abilityChoices,
        c: store.class.selected?.name,
        sc: store.class.subclass?.name,
        l: store.level || 1, // store.level yoksa 1 al (targetLevel'a dikkat)
        b: store.abilities.base,
        asi: store.abilities.asi,
        bg: store.background.selected?.name,
        p: store.skills.proficiencies,
        e: store.skills.expertises,
        ch: store.choices || {}, // UserChoices
        sm: store.scores?.method || 'manual', // Score Method
        rp: store.scores?.pool || [], // Rolled Pool
        hp: store.hp,
        inv: store.inventory,
        av: store.meta.avatar,
        spl: store.spells?.known || []
    };

    try {
        // LZString ile sıkıştır
        return window.LZString.compressToEncodedURIComponent(JSON.stringify(cleanObject(exportData)));
    } catch (e) {
        console.error("Seed oluşturma hatası:", e);
        return "";
    }
};

// 2. ARAYÜZ DURUMUNU KODLAMA (Tablar vb.)
export const encodeState = (store) => {
    // Şu anlık basitçe boş döndürebiliriz veya aktif tab bilgisini saklayabiliriz
    // İleride buraya "Hangi sekme açıktı?" bilgisini ekleyebilirsin.
    return ""; 
};