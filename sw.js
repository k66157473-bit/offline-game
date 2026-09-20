const CACHE_NAME = 'airplane-games-v1.0.7'; // バージョンを更新

const ASSETS_TO_CACHE = [
  '/offline-game/',
  '/offline-game/index.html',
  '/offline-game/manifest.json',
  '/offline-game/icon-offgame.png'
];

// インストール処理
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 古いキャッシュの削除
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

// 通信処理（★ここを正しく修正しました）
self.addEventListener('fetch', (event) => {
  // 画面を開くアクセス（HTMLリクエスト）の場合
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // オフライン時は確実にキャッシュの index.html を返す
          return caches.match('/offline-game/index.html')
            .then((res) => res || caches.match('/offline-game/'));
        })
    );
    return;
  }

  // 画像やその他のファイルの場合
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});