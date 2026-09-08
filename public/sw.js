/*
 * 아주 작은 서비스 워커.
 *
 * 하는 일은 두 가지뿐이다.
 *  - 해시가 붙은 정적 자산은 한 번 받으면 그대로 쓴다 (내용이 바뀌면 파일 이름이 바뀐다).
 *  - 페이지는 망을 먼저 보고, 안 되면 캐시로 보여 준다. 그래서 지하철에서도 카드가 열린다.
 *
 * 캐시 이름에 판을 적어 두었다. 이 파일을 고칠 때 판을 올리면 옛 캐시가 비워진다.
 */
const VERSION = 'ariadne-v1';
const SCOPE = new URL(self.registration.scope).pathname;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll([SCOPE]).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 공유로 열린 페이지는 캐시에 넣지 않는다. 쿼리마다 내용이 달라지기 때문이다.
  if (url.pathname.startsWith(SCOPE + 'capture')) return;

  const isAsset = url.pathname.includes('/_next/static/') || url.pathname.startsWith(SCOPE + 'icons/');

  if (isAsset) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(VERSION).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match(SCOPE))),
    );
  }
});
