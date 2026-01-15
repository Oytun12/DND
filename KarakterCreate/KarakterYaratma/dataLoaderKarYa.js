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