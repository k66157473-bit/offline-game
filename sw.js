const CACHE_NAME = 'airplane-games-v2.13.0';

const ASSETS_TO_CACHE = [
  '/offline-game/',
  '/offline-game/index.html',
  '/offline-game/icon-offgame.png'
];

// 1. インストール処理（1つ失敗しても巻き添えにしない安全設計）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS_TO_CACHE) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn('キャッシュスキップ:', url);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. 古いキャッシュを確実に削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 通信処理（アプリ起動時はキャッシュのHTMLを何が何でも即座に返す！）
self.addEventListener('fetch', (event) => {
  // アプリ起動・画面アクセス（HTML）の場合
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/offline-game/index.html')
        .then((res) => res || caches.match('/offline-game/'))
        .then((res) => res || fetch(event.request))
        .catch(() => caches.match('/offline-game/index.html'))
    );
    return;
  }

  // 画像やCSSなどのファイル
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      });
    })
  );
});