const CACHE_NAME = 'game-cache-v1'; // ⚠️ غير الرقم إلى v2 ثم v3 في التحديثات القادمة ليفهم السيرفر وجود جديد

const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './data.js',
    './manifest.json',
    './privacy-policy.html',
    './terms.html'
    // أضف هنا أي ملفات صوتية أو صور تستخدمها لعبتك (.mp3, .png)
];

// التثبيت الأولي وتخزين الملفات للكاش (الأوفلاين)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        }).then(() => self.skipWaiting()) // تفعيل التحديث فوراً دون انتظار إغلاق المتصفح
    );
});

// تنظيف الكاش القديم فور تفعيل الإصدار الجديد
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key); // حذف الإصدارات القديمة لتوفر مساحة الهاتف
                    }
                })
            );
        }).then(() => self.clients.claim()) // السيطرة على صفحات اللعبة المفتوحة فوراً
    );
});

// استدعاء الملفات من الكاش لضمان الأوفلاين بسرعة الصاروخ
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
