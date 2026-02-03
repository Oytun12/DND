export const weaponList = [
    // BASİT SİLAHLAR
    { id: 'club', name: 'Sopa', dmg: '1d4', type: 'Ezici', category: 'Basit', props: ['Hafif'], stat: 'str', weight: 2 },
    { id: 'dagger', name: 'Hançer', dmg: '1d4', type: 'Delici', category: 'Basit', props: ['Finesse', 'Hafif', 'Fırlatmalı'], stat: 'finesse', weight: 1 },
    { id: 'greatclub', name: 'Balyoz', dmg: '1d8', type: 'Ezici', category: 'Basit', props: ['Çift Elli'], stat: 'str', weight: 10 },
    { id: 'handaxe', name: 'El Baltası', dmg: '1d6', type: 'Kesici', category: 'Basit', props: ['Hafif', 'Fırlatmalı'], stat: 'str', weight: 2 },
    { id: 'javelin', name: 'Cirit', dmg: '1d6', type: 'Delici', category: 'Basit', props: ['Fırlatmalı'], stat: 'str', weight: 2 },
    { id: 'light_hammer', name: 'Hafif Çekiç', dmg: '1d4', type: 'Ezici', category: 'Basit', props: ['Hafif', 'Fırlatmalı'], stat: 'str', weight: 2 },
    { id: 'mace', name: 'Gürz', dmg: '1d6', type: 'Ezici', category: 'Basit', props: [], stat: 'str', weight: 4 },
    { id: 'quarterstaff', name: 'Değnek', dmg: '1d6', type: 'Ezici', category: 'Basit', props: ['Çok Yönlü (1d8)'], stat: 'str', weight: 4 },
    { id: 'spear', name: 'Mızrak', dmg: '1d6', type: 'Delici', category: 'Basit', props: ['Fırlatmalı', 'Çok Yönlü (1d8)'], stat: 'str', weight: 3 },
    { id: 'crossbow_light', name: 'Hafif Arbalet', dmg: '1d8', type: 'Delici', category: 'Basit', props: ['Menzilli', 'Çift Elli'], stat: 'dex', weight: 5 },
    { id: 'shortbow', name: 'Kısa Yay', dmg: '1d6', type: 'Delici', category: 'Basit', props: ['Menzilli', 'Çift Elli'], stat: 'dex', weight: 2 },

    // SAVAŞ SİLAHLARI
    { id: 'battleaxe', name: 'Savaş Baltası', dmg: '1d8', type: 'Kesici', category: 'Savaş', props: ['Çok Yönlü (1d10)'], stat: 'str', weight: 4 },
    { id: 'greataxe', name: 'Çift Ağızlı Balta', dmg: '1d12', type: 'Kesici', category: 'Savaş', props: ['Çift Elli', 'Ağır'], stat: 'str', weight: 7 },
    { id: 'greatsword', name: 'Büyük Kılıç', dmg: '2d6', type: 'Kesici', category: 'Savaş', props: ['Çift Elli', 'Ağır'], stat: 'str', weight: 6 },
    { id: 'longsword', name: 'Uzun Kılıç', dmg: '1d8', type: 'Kesici', category: 'Savaş', props: ['Çok Yönlü (1d10)'], stat: 'str', weight: 3 },
    { id: 'maul', name: 'Tokmak', dmg: '2d6', type: 'Ezici', category: 'Savaş', props: ['Çift Elli', 'Ağır'], stat: 'str', weight: 10 },
    { id: 'morningstar', name: 'Seher Yıldızı', dmg: '1d8', type: 'Delici', category: 'Savaş', props: [], stat: 'str', weight: 4 },
    { id: 'rapier', name: 'Meç (Rapier)', dmg: '1d8', type: 'Delici', category: 'Savaş', props: ['Finesse'], stat: 'finesse', weight: 2 },
    { id: 'scimitar', name: 'Pala', dmg: '1d6', type: 'Kesici', category: 'Savaş', props: ['Finesse', 'Hafif'], stat: 'finesse', weight: 3 },
    { id: 'shortsword', name: 'Kısa Kılıç', dmg: '1d6', type: 'Delici', category: 'Savaş', props: ['Finesse', 'Hafif'], stat: 'finesse', weight: 2 },
    { id: 'longbow', name: 'Uzun Yay', dmg: '1d8', type: 'Delici', category: 'Savaş', props: ['Menzilli', 'Çift Elli', 'Ağır'], stat: 'dex', weight: 2 }
];

export const armorList = [
    { id: 'padded', name: 'Dolgulu Zırh', ac: 11, type: 'Hafif', stealthDis: true, weight: 8 },
    { id: 'leather', name: 'Deri Zırh', ac: 11, type: 'Hafif', stealthDis: false, weight: 10 },
    { id: 'studded', name: 'Zımbalı Deri', ac: 12, type: 'Hafif', stealthDis: false, weight: 13 },
    { id: 'hide', name: 'Post Zırh', ac: 12, type: 'Orta', stealthDis: false, weight: 12 },
    { id: 'chain_shirt', name: 'Zincir Gömlek', ac: 13, type: 'Orta', stealthDis: false, weight: 20 },
    { id: 'scale_mail', name: 'Pullu Zırh', ac: 14, type: 'Orta', stealthDis: true, weight: 45 },
    { id: 'breastplate', name: 'Göğüs Zırhı', ac: 14, type: 'Orta', stealthDis: false, weight: 20 },
    { id: 'half_plate', name: 'Yarım Plaka', ac: 15, type: 'Orta', stealthDis: true, weight: 40 },
    { id: 'ring_mail', name: 'Halkalı Zırh', ac: 14, type: 'Ağır', stealthDis: true, weight: 40 },
    { id: 'chain_mail', name: 'Zincir Zırh', ac: 16, type: 'Ağır', stealthDis: true, strReq: 13, weight: 55 },
    { id: 'splint', name: 'Şerit Zırh', ac: 17, type: 'Ağır', stealthDis: true, strReq: 15, weight: 60 },
    { id: 'plate', name: 'Plaka Zırh', ac: 18, type: 'Ağır', stealthDis: true, strReq: 15, weight: 65 },
    { id: 'shield', name: 'Kalkan', ac: 2, type: 'Kalkan', stealthDis: false, weight: 6 }
];

export const gearList = [
    { id: 'backpack', name: 'Sırt Çantası', weight: 5 },
    { id: 'bedroll', name: 'Uyku Tulumu', weight: 7 },
    { id: 'rope', name: 'İp (Kenevir, 15m)', weight: 10 },
    { id: 'torch', name: 'Meşale', weight: 1 },
    { id: 'rations', name: 'Erzak (1 Günlük)', weight: 2 },
    { id: 'waterskin', name: 'Su Tulumu', weight: 5 },
    { id: 'potion_healing', name: 'İyileştirme İksiri', weight: 0.5, desc: '2d4 + 2 Can doldurur.' },
    { id: 'crowbar', name: 'Levye', weight: 5 },
    { id: 'grappling_hook', name: 'Kanca', weight: 4 },
    { id: 'hammer', name: 'Çekiç', weight: 3 },
    { id: 'piton', name: 'Sikke (Tırmanış)', weight: 0.25 },
    { id: 'lantern_hooded', name: 'Fener (Kapaklı)', weight: 2 },
    { id: 'oil', name: 'Yağ (Şişe)', weight: 1 },
    { id: 'tinderbox', name: 'Çakmak Taşı ve Kav', weight: 1 }
];