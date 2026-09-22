import test from 'node:test';
import assert from 'node:assert/strict';
import { hostingConfig } from '../hosting.mjs';

process.env.PUBLIC_ORIGIN = 'https://alibi-hosting-test.vercel.app';
process.env.NODE_ENV = 'production';
const { server } = await import('../server.mjs');
let base;
test.before(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
});

test('Hosting trusts the configured origin exactly and preserves local play', () => {
  const config = hostingConfig({ PUBLIC_ORIGIN: 'https://alibi.example/' });
  assert.equal(config.hosted, true);
  assert.equal(config.allowsOrigin('https://alibi.example', 'backend.example'), true);
  assert.equal(config.allowsOrigin('http://localhost:3000', 'localhost:3000'), true);
  for (const origin of ['https://alibi.example.attacker.test', 'http://alibi.example',
    'https://preview.vercel.app', 'null', 'https://alibi.example/path']) {
    assert.equal(config.allowsOrigin(origin, 'backend.example'), false, origin);
  }
  assert.equal(hostingConfig({}).hosted, false);
  assert.equal(hostingConfig({ NODE_ENV: 'production' }).hosted, true);
  for (const origin of ['file:///tmp/alibi', 'https://example.com/join',
    'https://user:pass@example.com', 'https://example.com?token=x']) {
    assert.throws(() => hostingConfig({ PUBLIC_ORIGIN: origin }));
  }
});

test('Hosted HTTP accepts the website origin, hides LAN addresses, and streams room updates', async () => {
  async function post(path, body, origin = process.env.PUBLIC_ORIGIN) {
    return fetch(base + path, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  assert.deepEqual(await fetch(base + '/api/network').then(r => r.json()), { addresses: [] });
  const created = await post('/api/rooms', {});
  assert.equal(created.status, 201);
  const host = await created.json();
  assert.equal((await post('/api/rooms', {}, 'https://untrusted.vercel.app')).status, 403);
  const abort = new AbortController();
  try {
    const response = await fetch(`${base}/api/events?room=${host.room}&token=${host.token}`, { signal: abort.signal });
    assert.match(response.headers.get('content-type'), /text\/event-stream/);
    const reader = response.body.getReader();
    async function snapshot() {
      let text = '';
      while (!text.includes('\n\n')) {
        const part = await reader.read();
        assert.equal(part.done, false);
        text += new TextDecoder().decode(part.value);
      }
      return JSON.parse(text.split('\n').find(line => line.startsWith('data: ')).slice(6));
    }
    assert.equal((await snapshot()).players.length, 0);
    const joined = await post('/api/join', { room: host.room, name: 'Remote player' });
    assert.equal(joined.status, 200);
    assert.equal((await snapshot()).players[0].name, 'Remote player');
  } finally { abort.abort(); }
  for (const path of ['/hosting.mjs', '/.env', '/vercel.json']) {
    assert.equal((await fetch(base + path)).status, 404);
  }
});
