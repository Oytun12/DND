import { createApp, ref, onMounted } from 'vue';

import { 
    auth, db, signInWithPopup, googleProvider, signOut, onAuthStateChanged, 
    collection, getDocs, collectionGroup, query, getDoc, doc 
} from '../../KarakterCreate/KarakterYaratma/src/firebaseConfig.js';

const ADMIN_EMAILS = [
    "oytun.aycin12@gmail.com",
    "m4r4ngoz@gmail.com"  
];

createApp({
    setup() {
        const isAdmin = ref(false);
        const currentUser = ref(null);
        const users = ref([]);
        const loading = ref(false);

        onMounted(() => {
            onAuthStateChanged(auth, (user) => {
                if (user && ADMIN_EMAILS.includes(user.email)) {
                    currentUser.value = user;
                    isAdmin.value = true;
                    fetchAllData();
                } else {
                    currentUser.value = null;
                    isAdmin.value = false;
                    users.value = [];
                }
            });
        });

        const login = async () => {
            try {
                const res = await signInWithPopup(auth, googleProvider);
                if (!ADMIN_EMAILS.includes(res.user.email)) {
                    alert("Yetkisiz Giriş!");
                    await signOut(auth);
                }
            } catch (e) { console.error(e); }
        };

        const logout = async () => {
            await signOut(auth);
            window.location.reload();
        };

        const fetchAllData = async () => {
            loading.value = true;
            try {
                const allCharsQuery = query(collectionGroup(db, 'characters'));
                const querySnapshot = await getDocs(allCharsQuery);
                
                const usersMap = {}; 

                for (const charDoc of querySnapshot.docs) {
                    const charData = charDoc.data();
                    const userRef = charDoc.ref.parent.parent;
                    if (!userRef) continue; 
                    const userId = userRef.id;

                    // Karakter bilgileri
                    const charName = charData.meta?.name || charData.n || charData.name || "İsimsiz";
                    const charAvatar = charData.meta?.avatar || charData.av || charData.avatar || "";
                    
                    // Ana profil yoksa karakteri kaydedenin adını (owner) kullan
                    const ownerName = charData.owner || "Bilinmeyen Oyuncu";

                    if (!usersMap[userId]) {
                        usersMap[userId] = {
                            id: userId,
                            displayName: ownerName, 
                            email: "Bilgi yok",
                            photoURL: "",
                            characterList: []
                        };
                    }

                    usersMap[userId].characterList.push({
                        id: charDoc.id,
                        name: charName,
                        avatar: charAvatar
                    });
                }

                // Varsa güncel profil dosyalarını çek
                const userIDs = Object.keys(usersMap);
                await Promise.all(userIDs.map(async (uid) => {
                    try {
                        const userSnap = await getDoc(doc(db, "users", uid));
                        if (userSnap.exists()) {
                            const uData = userSnap.data();
                            usersMap[uid].displayName = uData.displayName || usersMap[uid].displayName;
                            usersMap[uid].email = uData.email || usersMap[uid].email;
                            usersMap[uid].photoURL = uData.photoURL || "";
                        }
                    } catch (e) { console.log("Profil detayı yok:", uid); }
                }));
                
                users.value = Object.values(usersMap);

            } catch (error) {
                console.error("Hata:", error);
                alert("Veri çekilemedi: " + error.message);
            } finally {
                loading.value = false;
            }
        };

        const openCharacter = (userId, charId) => {
            const url = `../../KarakterCreate/KarakterYaratma/KarakterYa.html?loadUser=${userId}&loadChar=${charId}`;
            window.open(url, '_blank');
        };

        return {
            isAdmin, currentUser, users, loading,
            login, logout, openCharacter
        };
    }
}).mount('#adminApp');