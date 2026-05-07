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
  { page: 'index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'join/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: '404.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'support/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'privacy/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'terms/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'sources/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'cookies/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'delete-account/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'nuria-partner/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'nuria-partner/login/index.html', image: logoUrl, width: '1600', height: '1600' },
  { page: 'nuria-partner/portal/index.html', image: logoUrl, width: '1600', height: '1600' },
  {
    page: 'ambassador/index.html',
    image: 'https://nuria.oakdev.app/assets/ambassador-og.jpg',
    width: '1200',
    height: '630',
  },
];

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function includesMeta(html, name, value) {
  const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`<meta\\s+[^>]*(?:property|name)="${name}"[^>]*content="${escapedValue}"|<meta\\s+[^>]*content="${escapedValue}"[^>]*(?:property|name)="${name}"`, 'i');
  return pattern.test(html);
}

run('public link previews declare the expected social image', () => {
  for (const { page, image, width, height } of publicPreviewPages) {
    const html = read(page);
    assert(
      includesMeta(html, 'og:image', image),
      `${page} is missing og:image with the expected preview image`
    );
    assert(
      includesMeta(html, 'twitter:image', image),
      `${page} is missing twitter:image with the expected preview image`
    );
    assert(
      includesMeta(html, 'og:image:width', width),
      `${page} should declare the preview image width`
    );
    assert(
      includesMeta(html, 'og:image:height', height),
      `${page} should declare the preview image height`
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
