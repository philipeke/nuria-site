'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const { parseCanonicalYaml, buildSchema, buildOrgSchema } = require('../scripts/build-schema-org.js');

test('schema-org.jsonld is generated from the canonical entity (no dual truth)', () => {
  const entity = parseCanonicalYaml(read('brand/canonical-entity.yaml'));
  const expected = buildSchema(entity);
  const published = JSON.parse(read('brand/schema-org.jsonld'));
  assert.deepStrictEqual(published, expected, 'regenerate: node scripts/build-schema-org.js');
});

test('schema-org-organization.jsonld is generated from the canonical entity (no dual truth)', () => {
  const entity = parseCanonicalYaml(read('brand/canonical-entity.yaml'));
  const expected = buildOrgSchema(entity);
  const published = JSON.parse(read('brand/schema-org-organization.jsonld'));
  assert.deepStrictEqual(published, expected, 'regenerate: node scripts/build-schema-org.js');
});

test('index.html embeds exactly the generated organization schema', () => {
  const html = read('index.html');
  const m = html.match(/<script type="application\/ld\+json" id="nuria-org-schema">\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(m, 'index.html missing the #nuria-org-schema JSON-LD block');
  const embedded = JSON.parse(m[1]);
  const published = JSON.parse(read('brand/schema-org-organization.jsonld'));
  assert.deepStrictEqual(embedded, published, 'index.html org embed drifted from brand/schema-org-organization.jsonld');
});

test('Wikidata Q-ids are present in both sameAs graphs (closes the sameAs loop)', () => {
  const entity = parseCanonicalYaml(read('brand/canonical-entity.yaml'));
  const app = JSON.parse(read('brand/schema-org.jsonld'));
  const org = JSON.parse(read('brand/schema-org-organization.jsonld'));
  assert.ok(entity.wikidata_app_qid, 'wikidata_app_qid missing from SSOT');
  assert.ok(entity.wikidata_org_qid, 'wikidata_org_qid missing from SSOT');
  assert.ok(app.sameAs.includes(`https://www.wikidata.org/wiki/${entity.wikidata_app_qid}`),
    'app schema sameAs missing its Wikidata Q-id');
  assert.ok(org.sameAs.includes(`https://www.wikidata.org/wiki/${entity.wikidata_org_qid}`),
    'organization schema sameAs missing its Wikidata Q-id');
});

test('published schema respects the disambiguation rule and hides PENDING fields', () => {
  const schema = JSON.parse(read('brand/schema-org.jsonld'));
  assert.notStrictEqual(schema.name, 'Nuria', 'bare "Nuria" is forbidden in metadata');
  assert.ok(/Islamic/i.test(schema.name), 'name must anchor the Islamic-app entity');
  assert.ok(!JSON.stringify(schema).includes('PENDING'), 'PENDING values must never publish');
  assert.strictEqual(schema['@type'], 'MobileApplication');
  assert.strictEqual(schema.offers.price, '0');
  assert.ok(Array.isArray(schema.sameAs) && schema.sameAs.length >= 3, 'sameAs graph present');
});

test('index.html embeds exactly the generated schema', () => {
  const html = read('index.html');
  const m = html.match(/<script type="application\/ld\+json" id="nuria-app-schema">\s*([\s\S]*?)\s*<\/script>/);
  assert.ok(m, 'index.html missing the #nuria-app-schema JSON-LD block');
  const embedded = JSON.parse(m[1]);
  const published = JSON.parse(read('brand/schema-org.jsonld'));
  assert.deepStrictEqual(embedded, published, 'index.html embed drifted from brand/schema-org.jsonld');
});

test('canonical short description is byte-identical in yaml and description doc', () => {
  const entity = parseCanonicalYaml(read('brand/canonical-entity.yaml'));
  const doc = read('brand/canonical-description.md');
  assert.ok(entity.description_short.length <= 160, 'short description must be <=160 chars');
  assert.ok(doc.includes(entity.description_short), 'canonical-description.md must contain the exact short description');
  assert.ok(entity.description_micro.length <= 100, 'micro description must be <=100 chars (MCP registry limit)');
  assert.ok(doc.includes(entity.description_micro), 'canonical-description.md must contain the exact micro description');
});

test('Gate 1: terminology + user-count policy hold in all public brand output', () => {
  const entity = parseCanonicalYaml(read('brand/canonical-entity.yaml'));
  const publicSurfaces = {
    'brand/schema-org.jsonld': read('brand/schema-org.jsonld'),
    'brand/canonical-description.md': read('brand/canonical-description.md'),
    'llms.txt': read('llms.txt'),
    'index.html embed': (read('index.html').match(/id="nuria-app-schema">\s*([\s\S]*?)\s*<\/script>/) || ['', ''])[1],
  };
  for (const [name, text] of Object.entries(publicSurfaces)) {
    assert.ok(!/scholar[- ](reviewed|certified)/i.test(text),
      `${name}: use "in scholarly review" until GIFS signs`);
    assert.ok(!/\b35[\s., ]?000\b/.test(text),
      `${name}: exact user count must never publish (threshold phrase only)`);
  }
  // internal fields stay out of the published schema
  const schema = read('brand/schema-org.jsonld');
  for (const v of [entity.user_count_internal, entity.user_count_as_of]) {
    assert.ok(v && !schema.includes(String(v)), 'internal user fields must not leak into schema');
  }
  // platform + review-status facts
  const parsed = JSON.parse(schema);
  assert.deepStrictEqual(parsed.operatingSystem, ['iOS', 'Android']);
  assert.strictEqual(entity.scholarly_review_status, 'in_review');
  assert.strictEqual(entity.app_status, 'preview');
  assert.strictEqual(entity.madhab_support.length, 4, 'four schools in canon');
  assert.ok(!entity.madhab_support.includes('Jafari'), 'Jafari not in canon');
});

test('Gate 1: terminology holds sitewide (js/i18n.js + ask/index.html + English l10n override) — closes the /ask coverage gap', () => {
  // A live "Halal-certified" / "verified sources" violation shipped to production hiding
  // in THREE places the original Gate-1 test (above) never scanned: the ask/index.html
  // static pre-hydration fallback text, and — the actual root cause — l10n/site_en.arb,
  // which js/i18n.js fetches on every page load and which OVERRIDES the T.en object at
  // runtime. Editing js/i18n.js alone silently did nothing in production; the arb file is
  // the real live source. This test covers all three so that class of bug can't hide again.
  const forbidden = [
    { re: /scholar[- ](reviewed|certified)/i, why: 'use "in scholarly review" until GIFS signs' },
    { re: /\bverified\s+(islamic|scholar|guidance|service|source|sources|knowledge|ai)\b/i, why: 'no "verified X" claims before GIFS signs' },
    { re: /halal[- ]certified/i, why: 'no "halal-certified" claims before GIFS signs' },
  ];
  // Scan EVERY public surface — not a curated list. A curated list is exactly what
  // let the original "Halal-certified" violation hide (it sat in files the old test
  // never named). Walk all committed .html plus the JS/arb sources of record.
  const htmlFiles = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (['.git', 'node_modules', 'tmp', 'assets'].includes(e.name)) continue;
        walk(path.join(dir, e.name));
      } else if (e.name.endsWith('.html')) {
        htmlFiles.push(path.relative(root, path.join(dir, e.name)).replace(/\\/g, '/'));
      }
    }
  })(root);
  const surfaces = {
    'js/i18n.js': read('js/i18n.js'),
    'l10n/site_en.arb': read('l10n/site_en.arb'),
    // the chat island + launcher render site-wide via the NuriaOne overlay, so their
    // hardcoded English fallback strings are public surfaces too
    'js/nuria-chat.js': read('js/nuria-chat.js'),
    'js/components.js': read('js/components.js'),
  };
  for (const rel of htmlFiles) surfaces[rel] = read(rel);
  for (const [name, text] of Object.entries(surfaces)) {
    for (const { re, why } of forbidden) {
      assert.ok(!re.test(text), `${name}: matched ${re} — ${why}`);
    }
  }
});
