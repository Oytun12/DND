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