
const CACHE_NAME = 'airplane-games-v1.0.4';

// キャッシュ対象のファイル一覧
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 1. インストール時：全ファイルをキャッシュに保存
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. 有効化時：古いバージョンのキャッシュを自動削除（変更検知時のクリーンアップ）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 通信処理：スマホ起動時の404を絶対に防ぐフォールバック付き
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // オフラインや404になりそうな画面アクセス時は、キャッシュ済みのメインHTMLを強制返却
        if (event.request.mode === 'navigate') {
          return caches.match('./') || caches.match('./index.html');
        }
      });
    })
  );
});