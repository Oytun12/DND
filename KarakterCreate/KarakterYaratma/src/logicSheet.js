import { ref } from 'vue';

export function useCharacterSheet() {
    
    // Karakter yaratma ekranı mı yoksa Kağıt modu mu?
    const isSheetMode = ref(false); 
    
    // Aktif ana sekme (Aksiyonlar, Büyüler, Envanter vb.)
    const activeSheetTab = ref('actions');

    const activeDescSubTab = ref('equipment'); // Varsayılan: Donanım
    
    // Karakter yaratma işlemi bitti mi?
    const hasCreatedSheet = ref(false); 
    
    // Özellikler sekmesinin altındaki aktif tab (Irk, Sınıf, Geçmiş)
    // Varsayılan olarak 'class' açılır.
    const activeFeatureSubTab = ref('class'); 

    // Yaratma işlemini bitiren fonksiyon
    const finishCreation = (toastCallback) => {
        isSheetMode.value = true;
        hasCreatedSheet.value = true; 
        
        // Eğer bir bildirim fonksiyonu gönderildiyse çalıştır
        if(toastCallback) toastCallback("Karakter Kağıdı Oluşturuldu!", "📜");
    };

    return {
        isSheetMode,
        activeSheetTab,
        hasCreatedSheet,
        activeFeatureSubTab, 
        finishCreation,
        activeDescSubTab
    };
}