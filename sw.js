// --- ค่าคงที่และไฟล์สำหรับ Cache ---
const CACHE_NAME = 'bmr-calculator-v3'; // Updated version for new features
const urlsToCache = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap'
];

// =================================================================
// 1. ส่วนของการติดตั้ง (Installation) และ Caching
// =================================================================
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
});

// =================================================================
// 2. ส่วนของการจัดการ Cache และการดึงข้อมูล (Fetch)
// =================================================================
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ถ้าเจอใน cache, ให้ส่งค่าจาก cache กลับไปเลย
        if (response) {
          return response;
        }
        // ถ้าไม่เจอ, ให้ไปดึงจาก network
        return fetch(event.request);
      })
  );
});

// =================================================================
// 3. ส่วนของการ Activate และการลบ Cache เก่า
// =================================================================
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // ถ้าชื่อ cache ไม่ตรงกับเวอร์ชันปัจจุบัน ให้ลบทิ้ง
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// =================================================================
// 4. ส่วนสำหรับ PUSH NOTIFICATIONS
// =================================================================

// Event: 'push' - เกิดขึ้นเมื่อได้รับข้อความจาก Push Service
self.addEventListener('push', event => {
  console.log('Service Worker: Push Received.');
  
  // ดึงข้อมูลที่ส่งมาในรูปแบบ JSON
  // เราสามารถส่ง title, body, icon, etc. มาจากเซิร์ฟเวอร์ได้
  const data = event.data ? event.data.json() : {
    title: 'สวัสดีจากแอปสุขภาพดี!',
    body: 'มีการแจ้งเตือนใหม่',
    icon: 'https://placehold.co/192x192/4f46e5/ffffff?text=❤️'
  };

  const options = {
    body: data.body,
    icon: data.icon,
    badge: 'https://placehold.co/96x96/4f46e5/ffffff?text=★', // ไอคอนเล็กๆ สำหรับแถบสถานะ
    vibrate: [200, 100, 200], // รูปแบบการสั่น
    data: {
        url: self.registration.scope // URL ที่จะเปิดเมื่อคลิก
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Event: 'notificationclick' - เกิดขึ้นเมื่อผู้ใช้คลิกที่การแจ้งเตือน
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click Received.');

  // ปิดการแจ้งเตือนนั้น
  event.notification.close();

  // เปิดหน้าต่างแอปพลิเคชันขึ้นมา
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
