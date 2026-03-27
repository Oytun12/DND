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
        const activeTab = ref('analytics'); // Yeni: Sekme Kontrolü
        const stats = ref({}); // Yeni: Analiz Verileri
        
        // Bugünün tarihini YYYY-MM-DD formatında al (Yerel saate göre)
        const todayStr = ref(new Date().toLocaleDateString('tr-TR').split('.').reverse().join('-')); 

        onMounted(() => {
            onAuthStateChanged(auth, (user) => {
                if (user && ADMIN_EMAILS.includes(user.email)) {
                    currentUser.value = user;
                    isAdmin.value = true;
                    fetchAllData(); // Oyuncuları Çek
                    fetchAnalytics(); // İstatistikleri Çek
                } else {
                    currentUser.value = null;
                    isAdmin.value = false;
                    users.value = [];
                    stats.value = {};
                }
            });
        });

        const login = async () => {
            try {
                const res = await signInWithPopup(auth, googleProvider);
                if (!ADMIN_EMAILS.includes(res.user.email)) {
                    alert("Yetkisiz Giriş! Bu alan sadece DM'ler içindir.");
                    await signOut(auth);
                }
            } catch (e) { console.error(e); }
        };

        const logout = async () => {
            await signOut(auth);
            window.location.reload();
        };

        // --- YENİ: ANALİZ VERİLERİNİ ÇEKME MOTORU ---
        const fetchAnalytics = async () => {
            try {
                // Sadece 1 adet döküman okuyoruz! (Maliyet: Günlük 1 Read)
                const docRef = doc(db, "site_analytics", todayStr.value);
                const docSnap = await getDoc(docRef);
                
                if (docSnap.exists()) {
                    stats.value = docSnap.data();
                } else {
                    stats.value = { total_views: 0, unique_visitors: 0, mobile_users: 0, desktop_users: 0, pages: {} };
                }
            } catch (error) {
                console.error("Analizler çekilemedi:", error);
            }
        };

        // --- ESKİ: OYUNCU VERİTABANI MOTORU ---
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

                    const charName = charData.meta?.name || charData.n || charData.name || "İsimsiz";
                    const charAvatar = charData.meta?.avatar || charData.av || charData.avatar || "";
                    const ownerName = charData.owner || "Bilinmeyen Oyuncu";

                    if (!usersMap[userId]) {
                        usersMap[userId] = {
                            id: userId,
                            displayName: ownerName, 
                            email: "Google Auth Gizli",
                            photoURL: "",
                            characterList: []
                        };
                    }

                    usersMap[userId].characterList.push({ id: charDoc.id, name: charName, avatar: charAvatar });
                }

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
                    } catch (e) { }
                }));
                
                users.value = Object.values(usersMap);

            } catch (error) {
                console.error("Hata:", error);
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
            activeTab, stats, todayStr,
            login, logout, openCharacter, fetchAnalytics
        };
    }
}).mount('#adminApp');