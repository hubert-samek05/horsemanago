const puppeteer = require('puppeteer-core');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYzNzFmNjY1LTVmMmUtNDdkZC04MGIyLWRlOTUyYWE0MTE0ZCIsImVtYWlsIjoiZGVtb0Bob3JzZW1hbmFnby5uZXQiLCJyb2xlIjoiU1RBQkxFX09XTkVSIiwiaWF0IjoxNzg1ODY0NTYzLCJleHAiOjE3ODY0NjkzNjN9.r5pnpQcQSyhqPH5Lw64rjEX-PMm0vjnkodlS-bp-xgE';
  const user = { id: '6371f665-5f2e-47dd-80b2-de952aa4114d', email: 'demo@horsemanago.net', firstName: 'Jan', lastName: 'Kowalski', role: 'STABLE_OWNER' };

  const browser = await puppeteer.launch({
    executablePath: '/root/.cache/puppeteer/chrome/linux-146.0.7680.153/chrome-linux64/chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  const errors = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Minified React error')) {
      console.log('[console]', msg.type(), text);
    }
  });
  page.on('pageerror', (err) => {
    console.log('[pageerror]', err.message);
    errors.push(err.message);
  });

  await page.goto('https://horsemanago.net/dashboard/horses', { waitUntil: 'networkidle2' });
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('auth-storage', JSON.stringify({ state: { token: t, user: u, activeStableId: null, activeRole: null, hasHydrated: true }, version: 0 }));
  }, token, user);

  await page.goto('https://horsemanago.net/dashboard/horses', { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 5000));

  console.log('Final URL:', page.url());
  console.log('React errors:', JSON.stringify(errors));

  const horseNames = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('h3, .horse-name, [class*="name"]'));
    return cards.map((el) => el.innerText).filter(Boolean).slice(0, 20);
  });
  console.log('Visible horse names:', horseNames);

  await browser.close();
})();
