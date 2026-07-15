'use strict';
// Generates brand/schema-org.jsonld from brand/canonical-entity.yaml (SSOT).
// Run: node scripts/build-schema-org.js
// The embedded copy in index.html and the generated file are checked against
// each other by tests/brand-schema-static.test.js — no dual truth.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const YAML_PATH = path.join(root, 'brand', 'canonical-entity.yaml');
const OUT_PATH = path.join(root, 'brand', 'schema-org.jsonld');

/**
 * Minimal parser for the strict YAML subset used by canonical-entity.yaml:
 * top-level `key: value`, `key: >-` folded scalars, and `key:` + `- item`
 * lists. Comments (#) and blank lines ignored. No general YAML.
 */
function parseCanonicalYaml(text) {
  const out = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    i++;
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) continue; // indented content is consumed by its block below
    const key = m[1];
    let rest = m[2].replace(/\s+#.*$/, '').trim();

    if (rest === '>-' || rest === '>') {
      // folded scalar: consume indented lines
      const parts = [];
      while (i < lines.length && (/^\s+\S/.test(lines[i]) || !lines[i].trim())) {
        if (!lines[i].trim()) { i++; break; }
        parts.push(lines[i].trim());
        i++;
      }
      out[key] = parts.join(' ');
    } else if (rest === '') {
      // list block
      const items = [];
      while (i < lines.length) {
        const l = lines[i];
        if (!l.trim() || l.trim().startsWith('#')) { i++; continue; }
        const im = l.match(/^\s+-\s+(.*)$/);
        if (!im) break;
        items.push(unquote(im[1].replace(/\s+#.*$/, '').trim()));
        i++;
      }
      out[key] = items;
    } else {
      out[key] = unquote(rest);
    }
  }
  return out;
}

function unquote(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

function buildSchema(entity) {
  for (const field of ['official_name', 'description_short', 'url']) {
    if (!entity[field]) throw new Error(`canonical-entity.yaml missing ${field}`);
  }
  if (/PENDING/i.test(JSON.stringify([entity.official_name, entity.description_short, entity.url, entity.sameAs]))) {
    throw new Error('PENDING value would be published — fill or remove it first');
  }
  const orgId = `${entity.url.replace(/\/$/, '')}/#organization`;
  return {
    '@context': 'https://schema.org',
    '@type': entity.category || 'MobileApplication',
    '@id': `${entity.url.replace(/\/$/, '')}/#app`,
    name: entity.official_name,
    alternateName: entity.alternate_names || [],
    description: entity.description_short,
    applicationCategory: 'LifestyleApplication',
    applicationSubCategory: entity.subcategory,
    operatingSystem: entity.platform || 'iOS',
    inLanguage: entity.languages_primary || [],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: entity.url,
    image: entity.logo_url,
    installUrl: entity.app_store_url,
    author: { '@id': orgId },
    publisher: { '@id': orgId },
    sameAs: entity.sameAs || [],
  };
}

function main() {
  const entity = parseCanonicalYaml(fs.readFileSync(YAML_PATH, 'utf8'));
  const schema = buildSchema(entity);
  fs.writeFileSync(OUT_PATH, JSON.stringify(schema, null, 2) + '\n', 'utf8');
  console.log(`Wrote ${path.relative(root, OUT_PATH)} (name: ${schema.name})`);
}

if (require.main === module) main();
module.exports = { parseCanonicalYaml, buildSchema };
