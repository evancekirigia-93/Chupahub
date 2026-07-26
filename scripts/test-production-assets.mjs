import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const host = '127.0.0.1';
const port = 3210;
const origin = `http://${host}:${port}`;
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', host, '-p', String(port)], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
server.stdout.on('data', chunk => { output += chunk; });
server.stderr.on('data', chunk => { output += chunk; });

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js exited before becoming ready.\n${output}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return response;
    } catch {
      // The production server has not bound its socket yet.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for Next.js.\n${output}`);
}

function assetUrls(html, extension) {
  const pattern = new RegExp(`["']([^"']+\\.${extension}(?:\\?[^"']*)?)["']`, 'g');
  return [...html.matchAll(pattern)]
    .map(match => new URL(match[1], origin))
    .filter(url => url.pathname.startsWith('/_next/static/'));
}

try {
  const page = await waitForServer();
  const html = await page.text();
  const assets = [
    ...assetUrls(html, 'css').map(url => ({ url, mime: 'text/css' })),
    ...assetUrls(html, 'js').map(url => ({ url, mime: 'application/javascript' })),
  ];

  if (!assets.some(asset => asset.mime === 'text/css')) throw new Error('The production page did not reference generated CSS.');
  if (!assets.some(asset => asset.mime === 'application/javascript')) throw new Error('The production page did not reference generated JavaScript.');

  for (const asset of new Map(assets.map(item => [item.url.href, item])).values()) {
    const response = await fetch(asset.url);
    const contentType = response.headers.get('content-type') || '';
    if (response.status !== 200) throw new Error(`${asset.url.pathname} returned HTTP ${response.status}.`);
    if (!contentType.toLowerCase().includes(asset.mime)) {
      throw new Error(`${asset.url.pathname} returned ${contentType || 'no Content-Type'}; expected ${asset.mime}.`);
    }
    console.log(`OK ${response.status} ${contentType} ${asset.url.pathname}`);
  }
} finally {
  server.kill('SIGTERM');
}
