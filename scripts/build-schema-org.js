'use strict';
// Generates brand/schema-org.jsonld + brand/schema-org-organization.jsonld from
// brand/canonical-entity.yaml (SSOT) and refreshes both embedded copies in
// index.html (#nuria-app-schema, #nuria-org-schema).
// Run: node scripts/build-schema-org.js
// Parity is enforced by tests/brand-schema-static.test.js — no dual truth.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const YAML_PATH = path.join(root, 'brand', 'canonical-entity.yaml');
const APP_OUT_PATH = path.join(root, 'brand', 'schema-org.jsonld');
const ORG_OUT_PATH = path.join(root, 'brand', 'schema-org-organization.jsonld');
const INDEX_PATH = path.join(root, 'index.html');

// Fields that must NEVER reach any published artifact (schema, registries).
const INTERNAL_FIELDS = ['user_count_internal', 'user_count_as_of', 'user_growth_note'];

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
    if (!m) continue;
    const key = m[1];
    let rest = m[2].replace(/\s+#.*$/, '').trim();

    if (rest === '>-' || rest === '>') {
      const parts = [];
      while (i < lines.length && (/^\s+\S/.test(lines[i]) || !lines[i].trim())) {
        if (!lines[i].trim()) { i++; break; }
        parts.push(lines[i].trim());
        i++;
      }
      out[key] = parts.join(' ');
    } else if (rest === '') {
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

/** Gate-1 + privacy guards shared by every published schema node. */
function applyGuards(schema, entity) {
  const published = JSON.stringify(schema);
  if (/PENDING/i.test(published)) {
    throw new Error('PENDING value would be published — fill or remove it first');
  }
  if (/scholar[- ](reviewed|certified)/i.test(published)) {
    throw new Error('terminology gate: use "in scholarly review" until GIFS signs');
  }
  for (const f of INTERNAL_FIELDS) {
    const v = entity[f];
    if (v && published.includes(String(v))) {
      throw new Error(`internal field ${f} leaked into published schema`);
    }
  }
  if (/\b35\s?000\b|\b35000\b/.test(published)) {
    throw new Error('exact user count must never publish — use the threshold phrase');
  }
  return schema;
}

function buildSchema(entity) {
  for (const field of ['official_name', 'description_short', 'url']) {
    if (!entity[field]) throw new Error(`canonical-entity.yaml missing ${field}`);
  }
  const orgId = `${entity.url.replace(/\/$/, '')}/#organization`;
  const installUrl = [entity.app_store_url, entity.google_play_url].filter(Boolean);
  const schema = {
    '@context': 'https://schema.org',
    '@type': entity.category || 'MobileApplication',
    '@id': `${entity.url.replace(/\/$/, '')}/#app`,
    name: entity.official_name,
    alternateName: entity.alternate_names || [],
    description: entity.description_short,
    applicationCategory: 'LifestyleApplication',
    applicationSubCategory: entity.subcategory,
    operatingSystem: entity.platforms || ['iOS'],
    inLanguage: entity.languages_primary || [],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    url: entity.url,
    image: entity.logo_url,
    installUrl: installUrl.length === 1 ? installUrl[0] : installUrl,
    author: { '@id': orgId },
    publisher: { '@id': orgId },
    sameAs: entity.sameAs || [],
  };
  return applyGuards(schema, entity);
}

/** Organization node (Nuria Technologies) — same SSOT, own schema + embed. */
function buildOrgSchema(entity) {
  for (const field of ['legal_org_name', 'url']) {
    if (!entity[field]) throw new Error(`canonical-entity.yaml missing ${field}`);
  }
  const orgId = `${entity.url.replace(/\/$/, '')}/#organization`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': orgId,
    name: entity.legal_org_name,
    url: `${entity.url.replace(/\/$/, '')}/`,
    logo: entity.logo_url,
    sameAs: entity.org_sameAs || [],
  };
  return applyGuards(schema, entity);
}

function replaceEmbed(html, id, json) {
  const re = new RegExp(
    `(<script type="application/ld\\+json" id="${id}">\\s*)[\\s\\S]*?(\\s*</script>)`,
  );
  if (!re.test(html)) throw new Error(`index.html missing #${id} block`);
  return html.replace(re, `$1${json}$2`);
}

function main() {
  const entity = parseCanonicalYaml(fs.readFileSync(YAML_PATH, 'utf8'));
  if (entity.description_micro && entity.description_micro.length > 100) {
    throw new Error(`description_micro is ${entity.description_micro.length} chars (MCP registry limit 100)`);
  }
  if (entity.description_short && entity.description_short.length > 160) {
    throw new Error(`description_short is ${entity.description_short.length} chars (limit 160)`);
  }

  const appSchema = buildSchema(entity);
  const appJson = JSON.stringify(appSchema, null, 2);
  fs.writeFileSync(APP_OUT_PATH, appJson + '\n', 'utf8');

  const orgSchema = buildOrgSchema(entity);
  const orgJson = JSON.stringify(orgSchema, null, 2);
  fs.writeFileSync(ORG_OUT_PATH, orgJson + '\n', 'utf8');

  let html = fs.readFileSync(INDEX_PATH, 'utf8');
  html = replaceEmbed(html, 'nuria-org-schema', orgJson);
  html = replaceEmbed(html, 'nuria-app-schema', appJson);
  fs.writeFileSync(INDEX_PATH, html, 'utf8');

  console.log(`Wrote ${path.relative(root, APP_OUT_PATH)} (name: ${appSchema.name})`);
  console.log(`Wrote ${path.relative(root, ORG_OUT_PATH)} (name: ${orgSchema.name})`);
  console.log('Refreshed both index.html embeds.');
}

if (require.main === module) main();
module.exports = { parseCanonicalYaml, buildSchema, buildOrgSchema, INTERNAL_FIELDS };
