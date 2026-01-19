import { ref } from 'vue';

export function useCharacterSheet() {
    
    const isSheetMode = ref(false); 
    const activeSheetTab = ref('actions');
    const hasCreatedSheet = ref(false); 
    
    // YENİ: Özellikler alt sekmesi (Varsayılan: 'class')
    const activeFeatureSubTab = ref('class'); 

    const finishCreation = (toastCallback) => {
        isSheetMode.value = true;
        hasCreatedSheet.value = true; 
        if(toastCallback) toastCallback("Karakter Kağıdı Oluşturuldu!", "📜");
    };

    return {
        isSheetMode,
        activeSheetTab,
        hasCreatedSheet,
        activeFeatureSubTab, // Bunu dışarı aktarmayı unutma!
        finishCreation
    };
}