'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

const repoRoot = path.resolve(__dirname, '..');
const logoUrl = 'https://nuria.oakdev.app/assets/Nuria%20Logo.png';
const publicPreviewPages = [
  'index.html',
  'join/index.html',
  '404.html',
  'support/index.html',
  'privacy/index.html',
  'terms/index.html',
  'sources/index.html',
  'cookies/index.html',
  'delete-account/index.html',
  'nuria-partner/index.html',
  'nuria-partner/login/index.html',
  'nuria-partner/portal/index.html',
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function includesMeta(html, name, value) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+[^>]*(?:property|name)="${name}"[^>]*content="${escapedValue}"|<meta\\s+[^>]*content="${escapedValue}"[^>]*(?:property|name)="${name}"`, 'i');
  return pattern.test(html);
}

run('public link previews use the Nuria logo image everywhere', () => {
  for (const page of publicPreviewPages) {
    const html = read(page);
    assert(
      includesMeta(html, 'og:image', logoUrl),
      `${page} is missing og:image with the Nuria logo`
    );
    assert(
      includesMeta(html, 'twitter:image', logoUrl),
      `${page} is missing twitter:image with the Nuria logo`
    );
    assert(
      includesMeta(html, 'og:image:width', '1600'),
      `${page} should declare the Nuria logo width`
    );
    assert(
      includesMeta(html, 'og:image:height', '1600'),
      `${page} should declare the Nuria logo height`
    );
  }
});

run('old metadata image is not used for social previews', () => {
  const htmlFiles = fs.readdirSync(repoRoot, { recursive: true })
    .filter((file) => String(file).endsWith('.html'));

  for (const file of htmlFiles) {
    assert(!read(file).includes('metadata%20image.png'), `${file} still references the old metadata image`);
  }
});

if (process.exitCode && process.exitCode !== 0) {
  process.exit(process.exitCode);
}
