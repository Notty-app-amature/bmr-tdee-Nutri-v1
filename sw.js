// Define a name for the cache
const CACHE_NAME = 'bmr-calculator-v2'; // Updated version number

// List all the files and resources that need to be cached
const urlsToCache = [
  './index.html',
  './manifest.json', // Add manifest to the cache
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sarabun:wght@400;500;600;700&display=swap'
];

// --- Installation Event ---
// This event is triggered when the service worker is first installed.
self.addEventListener('install', event => {
  // We use event.waitUntil to ensure the service worker doesn't move on
  // from the installing phase until it has finished executing this code.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // Add all the specified URLs to the cache
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources during install:', error);
      })
  );
});

// --- Fetch Event ---
// This event is triggered for every request the page makes (e.g., for CSS, images, data).
self.addEventListener('fetch', event => {
  event.respondWith(
    // Check if the requested resource is already in the cache
    caches.match(event.request)
      .then(response => {
        // If a cached version is found, return it.
        if (response) {
          return response;
        }
        
        // If the resource is not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetching failed:', error);
            // Here you could return a fallback page for offline mode if needed
        });
      })
  );
});

// --- Activation Event ---
// This event is triggered when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name is not on the whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


// ==================================================================
// ส่วนที่เพิ่มเข้ามาสำหรับ BACKGROUND SYNC
// ==================================================================

// --- Sync Event ---
// Event นี้จะถูกเรียกเมื่อมีการเชื่อมต่ออินเทอร์เน็ตกลับมา
// และมี 'tag' ที่ถูกลงทะเบียนไว้รอการ sync อยู่
self.addEventListener('sync', event => {
  // ตรวจสอบ 'tag' ที่เราลงทะเบียนไว้จากหน้าเว็บ
  if (event.tag === 'sync-save-results') {
    console.log('Service Worker: กำลังเริ่มการ sync สำหรับ "sync-save-results"');
    // waitUntil เพื่อให้ service worker ทำงานต่อจนกว่า promise จะเสร็จสิ้น
    event.waitUntil(syncSaveResults());
  }
});

// ฟังก์ชันสมมติสำหรับจัดการการส่งข้อมูลที่ค้างอยู่
function syncSaveResults() {
  console.log('Service Worker: กำลังพยายามส่งข้อมูลที่บันทึกไว้...');
  // ในการใช้งานจริง:
  // 1. คุณจะต้องดึงข้อมูลที่บันทึกไว้ชั่วคราวจาก IndexedDB
  // 2. ใช้ fetch() เพื่อส่งข้อมูลนั้นไปยังเซิร์ฟเวอร์ของคุณ
  // 3. เมื่อส่งสำเร็จ, ให้ลบข้อมูลออกจาก IndexedDB
  
  // นี่เป็นเพียงตัวอย่างการจำลองการส่งข้อมูลไปยังเซิร์ฟเวอร์สมมติ
  return fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    body: JSON.stringify({
      title: 'Sync Test',
      body: 'Background sync successful!',
      userId: 1,
    }),
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
  .then(response => {
      if (!response.ok) {
          throw new Error('Network response was not ok.');
      }
      return response.json();
  })
  .then(json => {
      console.log('Service Worker: Sync สำเร็จ!', json);
      // สามารถส่งข้อความกลับไปบอกหน้าเว็บว่าทำสำเร็จแล้ว (ถ้าจำเป็น)
      self.clients.matchAll().then(clients => {
          clients.forEach(client => {
              client.postMessage({ type: 'SYNC_SUCCESS', message: 'ผลลัพธ์ของคุณถูกบันทึกเรียบร้อยแล้ว' });
          });
      });
  })
  .catch(err => {
      console.error('Service Worker: Sync ล้มเหลว:', err);
      // การ sync จะถูกลองใหม่อีกครั้งโดยอัตโนมัติในครั้งถัดไป
      // ไม่ต้องทำอะไรเพิ่มเติม เบราว์เซอร์จะจัดการให้เอง
      return Promise.reject(err);
  });
}
