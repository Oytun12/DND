// src/data/items.js

export const weaponList = [
    // BASİT SİLAHLAR (Simple Weapons)
    { id: 'club', name: 'Sopa', dmg: '1d4', type: 'ezici', category: 'simple', props: ['light'], stat: 'str' },
    { id: 'dagger', name: 'Hançer', dmg: '1d4', type: 'delici', category: 'simple', props: ['finesse', 'light', 'thrown'], stat: 'finesse' },
    { id: 'greatclub', name: 'Balyoz', dmg: '1d8', type: 'ezici', category: 'simple', props: ['two_handed'], stat: 'str' },
    { id: 'handaxe', name: 'El Baltası', dmg: '1d6', type: 'kesici', category: 'simple', props: ['light', 'thrown'], stat: 'str' },
    { id: 'javelin', name: 'Cirit', dmg: '1d6', type: 'delici', category: 'simple', props: ['thrown'], stat: 'str' },
    { id: 'light_hammer', name: 'Hafif Çekiç', dmg: '1d4', type: 'ezici', category: 'simple', props: ['light', 'thrown'], stat: 'str' },
    { id: 'mace', name: 'Gürz', dmg: '1d6', type: 'ezici', category: 'simple', props: [], stat: 'str' },
    { id: 'quarterstaff', name: 'Değnek', dmg: '1d6', type: 'ezici', category: 'simple', props: ['versatile'], stat: 'str' },
    { id: 'spear', name: 'Mızrak', dmg: '1d6', type: 'delici', category: 'simple', props: ['thrown', 'versatile'], stat: 'str' },
    { id: 'crossbow_light', name: 'Hafif Arbalet', dmg: '1d8', type: 'delici', category: 'simple', props: ['ranged', 'two_handed'], stat: 'dex' },
    { id: 'shortbow', name: 'Kısa Yay', dmg: '1d6', type: 'delici', category: 'simple', props: ['ranged', 'two_handed'], stat: 'dex' },

    // SAVAŞ SİLAHLARI (Martial Weapons)
    { id: 'battleaxe', name: 'Savaş Baltası', dmg: '1d8', type: 'kesici', category: 'martial', props: ['versatile'], stat: 'str' },
    { id: 'greataxe', name: 'Çift Ağızlı Balta', dmg: '1d12', type: 'kesici', category: 'martial', props: ['two_handed', 'heavy'], stat: 'str' },
    { id: 'greatsword', name: 'Büyük Kılıç', dmg: '2d6', type: 'kesici', category: 'martial', props: ['two_handed', 'heavy'], stat: 'str' },
    { id: 'longsword', name: 'Uzun Kılıç', dmg: '1d8', type: 'kesici', category: 'martial', props: ['versatile'], stat: 'str' },
    { id: 'maul', name: 'Tokmak', dmg: '2d6', type: 'ezici', category: 'martial', props: ['two_handed', 'heavy'], stat: 'str' },
    { id: 'morningstar', name: 'Seher Yıldızı', dmg: '1d8', type: 'delici', category: 'martial', props: [], stat: 'str' },
    { id: 'rapier', name: 'Meç (Rapier)', dmg: '1d8', type: 'delici', category: 'martial', props: ['finesse'], stat: 'finesse' },
    { id: 'scimitar', name: 'Pala', dmg: '1d6', type: 'kesici', category: 'martial', props: ['finesse', 'light'], stat: 'finesse' },
    { id: 'shortsword', name: 'Kısa Kılıç', dmg: '1d6', type: 'delici', category: 'martial', props: ['finesse', 'light'], stat: 'finesse' },
    { id: 'longbow', name: 'Uzun Yay', dmg: '1d8', type: 'delici', category: 'martial', props: ['ranged', 'two_handed', 'heavy'], stat: 'dex' }
];

// Zırh listesi aynı kalabilir, sadece 'strReq' alanlarının dolu olduğundan emin ol (Heavy zırhlar için).
export const armorList = [
    { id: 'none', name: 'Zırhsız (Kumaş)', ac: 10, type: 'none', stealthDis: false },
    { id: 'padded', name: 'Dolgulu Zırh', ac: 11, type: 'light', stealthDis: true },
    { id: 'leather', name: 'Deri Zırh', ac: 11, type: 'light', stealthDis: false },
    { id: 'studded', name: 'Zımbalı Deri', ac: 12, type: 'light', stealthDis: false },
    { id: 'hide', name: 'Post Zırh', ac: 12, type: 'medium', stealthDis: false, maxDex: 2 },
    { id: 'chain_shirt', name: 'Zincir Gömlek', ac: 13, type: 'medium', stealthDis: false, maxDex: 2 },
    { id: 'scale_mail', name: 'Pullu Zırh', ac: 14, type: 'medium', stealthDis: true, maxDex: 2 },
    { id: 'breastplate', name: 'Göğüs Zırhı', ac: 14, type: 'medium', stealthDis: false, maxDex: 2 },
    { id: 'half_plate', name: 'Yarım Plaka', ac: 15, type: 'medium', stealthDis: true, maxDex: 2 },
    { id: 'ring_mail', name: 'Halkalı Zırh', ac: 14, type: 'heavy', stealthDis: true },
    { id: 'chain_mail', name: 'Zincir Zırh', ac: 16, type: 'heavy', stealthDis: true, strReq: 13 }, // STR ŞARTI
    { id: 'splint', name: 'Şerit Zırh', ac: 17, type: 'heavy', stealthDis: true, strReq: 15 },    // STR ŞARTI
    { id: 'plate', name: 'Plaka Zırh', ac: 18, type: 'heavy', stealthDis: true, strReq: 15 }      // STR ŞARTI
];