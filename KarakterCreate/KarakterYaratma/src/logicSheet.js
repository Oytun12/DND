import { ref } from 'vue';

// Mantığı bir fonksiyon içine hapsedip dışarı sunuyoruz
export function useCharacterSheet() {
    
    const isSheetMode = ref(false); 
    const activeSheetTab = ref('actions');

    // Bu fonksiyon dışarıdan (main dosyadan) 'showToast' fonksiyonunu parametre alabilir
    const finishCreation = (toastCallback) => {
        isSheetMode.value = true;
        if(toastCallback) toastCallback("Karakter Kağıdı Oluşturuldu!", "📜");
    };

    // Main dosyaya neleri geri döndüreceğiz?
    return {
        isSheetMode,
        activeSheetTab,
        finishCreation
    };
}