const base = 'http://localhost:3000';

const checks = [];
function check(name, ok, extra = '') {
  checks.push({ name, ok, extra });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${extra ? ' :: ' + extra : ''}`);
}

// 1. Страница отдаётся и содержит разметку
const home = await fetch(base + '/');
const homeHtml = await home.text();
check('GET / -> 200', home.status === 200, String(home.status));
check('HTML содержит <html lang="ru">', homeHtml.includes('<html lang="ru"'));

// 2. CSS подгружается
const cssHref = homeHtml.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+\.css[^"]*)"/)?.[1];
check('найден CSS-файл', Boolean(cssHref), cssHref ?? 'нет');
if (cssHref) {
  const css = await fetch(base + cssHref);
  const cssText = await css.text();
  check('CSS -> 200 и не пустой', css.status === 200 && cssText.length > 1000, `${cssText.length} байт`);
}

// 3. Заголовки безопасности
check(
  'Content-Security-Policy',
  Boolean(home.headers.get('content-security-policy')),
  home.headers.get('content-security-policy')?.slice(0, 80) ?? 'нет',
);
check('X-Content-Type-Options', home.headers.get('x-content-type-options') === 'nosniff');
check('X-Frame-Options', Boolean(home.headers.get('x-frame-options')));

// 4. Проксирование API через Next (same-origin)
const health = await fetch(base + '/api/health');
const healthBody = await health.text();
check('GET /api/health через прокси -> 200', health.status === 200, healthBody.slice(0, 80));

// 5. Логин через прокси: код + вход + получение сессии
const login = await fetch(base + '/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+79001234567' }),
});
const loginBody = await login.json();
check('POST /api/auth/login -> 200', login.status === 200, JSON.stringify(loginBody).slice(0, 90));

const setCookie = login.headers.get('set-cookie');
check('код запрошен (сессия ещё не выдана)', login.status === 200 && !setCookie?.includes('teenwork_session'));

const verify = await fetch(base + '/api/auth/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '+79001234567', code: loginBody.devCode ?? '111111' }),
});
const verifyCookie = verify.headers.get('set-cookie');
check('POST /api/auth/verify -> 200', verify.status === 200, verify.status === 200 ? '' : await verify.text());
check('verify выдаёт куку сессии', Boolean(verifyCookie?.includes('teenwork_session')));

const sessionCookie = (verifyCookie ?? '').split(';')[0];
const me = await fetch(base + '/api/auth/me', { headers: { cookie: sessionCookie } });
const meBody = await me.json();
check('GET /api/auth/me с сессией -> 200', me.status === 200, meBody?.user?.fullName ?? me.status);

// 6. Лента объявлений
const listings = await fetch(base + '/api/listings?limit=3');
const listingsBody = await listings.json();
check('GET /api/listings -> 200', listings.status === 200, `объявлений: ${listingsBody?.items?.length}`);

// 7. SQL-инъекция через прокси
const inj = await fetch(base + '/api/listings?q=' + encodeURIComponent("' OR '1'='1"));
const injBody = await inj.json();
check('инъекция в поиске отдаёт 0 записей', inj.status === 200 && injBody.items.length === 0, `найдено ${injBody?.items?.length}`);

// 8. Страницы сайта
for (const path of ['/gigs', '/login', '/register', '/documents', '/profile']) {
  const response = await fetch(base + path);
  check(`GET ${path} -> 200`, response.status === 200, String(response.status));
}

const failed = checks.filter((item) => !item.ok);
console.log(`\nИтого: ${checks.length - failed.length}/${checks.length} проверок пройдено`);
if (failed.length) process.exit(1);
