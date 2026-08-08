'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const feed = JSON.parse(fs.readFileSync(path.join(root, 'assets/data/social-feed.json'), 'utf8'));
const config = fs.readFileSync(path.join(root, 'js/site-config.js'), 'utf8');
const client = fs.readFileSync(path.join(root, 'js/social-feed.js'), 'utf8');

function run(name, fn) {
  try {
    fn();
    process.stdout.write(`PASS ${name}\n`);
  } catch (error) {
    process.stderr.write(`FAIL ${name}\n${error.stack}\n`);
    process.exitCode = 1;
  }
}

function assertNewestFirst(items) {
  for (let index = 1; index < items.length; index += 1) {
    assert(
      new Date(items[index - 1].publishedAt) >= new Date(items[index].publishedAt),
      'posts must be newest first'
    );
  }
}

run('homepage social feed contains ten current direct links per platform', () => {
  assert.strictEqual(feed.ok, true);
  assert.strictEqual(feed.tiktok.length, 10);
  assert.strictEqual(feed.linkedin.length, 10);
  assert.strictEqual(new Set(feed.tiktok.map((item) => item.url)).size, 10);
  assert.strictEqual(new Set(feed.linkedin.map((item) => item.url)).size, 10);
  assert(feed.tiktok.every((item) => /^https:\/\/www\.tiktok\.com\/@nuria_app\/video\/\d+$/.test(item.url)));
  assert(feed.linkedin.every((item) => /^https:\/\/www\.linkedin\.com\/feed\/update\/urn:li:activity:\d+\/$/.test(item.url)));
  assertNewestFirst(feed.tiktok);
  assertNewestFirst(feed.linkedin);
});

run('homepage reads the committed feed without a social API dependency', () => {
  assert(config.includes("socialFeedUrl: 'assets/data/social-feed.json'"));
  assert(!client.includes('getSocialFeedHttp'));
  assert(client.includes("const endpoint = 'assets/data/social-feed.json'"));
});

if (process.exitCode && process.exitCode !== 0) process.exit(process.exitCode);
