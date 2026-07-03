// Service Worker บัญชีร้านโจ๊ก
var CACHE = 'jok-v2';

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(['./', './index.html', './manifest.json']); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }));
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);

  // ข้อมูลจาก Supabase: ต่อเน็ตตรงเสมอ (ห้าม cache เดี๋ยวข้อมูลเก่า)
  if (url.hostname.indexOf('supabase.co') > -1) return;

  if (url.origin === location.origin) {
    // ไฟล์แอปของเรา: โหลดใหม่ก่อน ถ้าออฟไลน์ค่อยใช้ของเดิม
    e.respondWith(
      fetch(e.request).then(function (r) {
        var cp = r.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
        return r;
      }).catch(function () { return caches.match(e.request); })
    );
  } else {
    // ไลบรารีจาก CDN: ใช้ cache ก่อน โหลดครั้งเดียวพอ
    e.respondWith(
      caches.match(e.request).then(function (hit) {
        return hit || fetch(e.request).then(function (r) {
          var cp = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, cp); });
          return r;
        });
      })
    );
  }
});
