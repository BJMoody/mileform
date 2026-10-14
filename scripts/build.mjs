import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(resolve(dist, 'app'), { recursive: true });
await cp(resolve(root, 'app'), resolve(dist, 'app'), { recursive: true });
await cp(resolve(root, 'index.html'), resolve(dist, 'index.html'));

// Workers Static Assets handles client-side routing via
// assets.not_found_handling = "single-page-application" in wrangler.jsonc.
// Do not emit a catch-all _redirects rewrite here: /app/* -> /app/index.html
// also matches /app/index.html and Cloudflare correctly rejects it as a loop.
await writeFile(
  resolve(dist, '_headers'),
  '/app/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n'
);

console.log('Built dist/ for Cloudflare Workers Static Assets deployment.');
