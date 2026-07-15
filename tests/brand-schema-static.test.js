'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const { parseCanonicalYaml, buildSchema } = require('../scripts/build-schema-org.js');

test('schema-org.jsonld is generated from the canonical entity (no dual truth)', () => {
  const entity = parseCanonicalYaml(read('brand/canonical-entity.yaml'));
  const expected = buildSchema(entity);
  const published = JSON.parse(read('brand/schema-org.jsonld'));
  assert.deepStrictEqual(published, expected, 'regenerate: node scripts/build-schema-org.js');
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
});
