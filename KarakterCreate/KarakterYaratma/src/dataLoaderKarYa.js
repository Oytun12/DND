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

    // Artık sadece class dizisini değil, tüm veriyi (feature'lar dahil) döndürüyoruz
    async getClassData() {
        const data = await this.loadJSON('classes.json');
        return data; // { class: [...], classFeature: [...], subclass: [...] }
    }
};


export async function loadBackgroundData() {
    try {
        const response = await fetch('Data/backgrounds.json');
        if (!response.ok) {
            throw new Error(`HTTP hatası! Durum: ${response.status}`);
        }
        const data = await response.json();
        
        // JSON yapın { "background": [...] } şeklinde olduğu için
        // doğrudan data.background dizisini döndürüyoruz.
        console.log("Geçmişler yüklendi:", data.background);
        return data.background; 
    } catch (error) {
        console.error("Background verisi yüklenemedi:", error);
        return [];
    }
}