# Disambiguation rules — "Nuria" is never alone in metadata

"Nuria" is a common Spanish/Catalan female given name (e.g. the soprano
Nuria Rial) and a Catalan place name (Vall de Núria). AI models and knowledge
graphs that encounter bare "Nuria" will mis-link the entity — and once a
model has burned in a confused picture, it is very hard to correct.

**The rule:** in any machine-readable or externally indexed surface —
metadata, tool names, titles, registry listings, schema markup, package
names, social bios — never write bare "Nuria". Always anchor the entity:

- **"Nuria Islamic app"** (reference form), or
- **"Nuria — Islamic companion"** (title form)

Inside our own products (UI copy, headlines on nuria.one, the app itself),
bare "Nuria" is fine — context disambiguates. The rule applies to surfaces
*outside* our own context.

## Correct

| Surface | Use |
|---|---|
| Schema.org `name` | `Nuria — Islamic companion` |
| Schema.org `alternateName` | `Nuria Islamic app`, `Nuria app`, … |
| MCP registry description | "Nuria Islamic app — verified, source-cited Islamic guidance…" |
| MCP tool title | "Ask Nuria — verified Islamic guidance" (Ask Nuria is already distinctive) |
| GPT Store name | "Ask Nuria — Verified Islamic Guidance" |
| Crunchbase / LinkedIn name | "Nuria — Islamic companion" (or legal org name once confirmed) |
| Press headline | "Nuria Islamic app launches …" |

## Incorrect

- `name: Nuria` in any schema/registry/manifest ("who? the soprano?")
- A tool called `nuria` with description "Ask Nuria anything"
- Social bio that only says "Nuria — light for your soul"
- Package/server IDs like `nuria/server` without the qualifier
  (our MCP server id is `io.github.philipeke/nuria-intelligence` — the
  `nuria-intelligence` compound is the qualifier)

## Why this ordering matters

Entity canonicalization comes **before** any new external visibility
(MCP registry, directories, Store listings). Models snapshot the entity at
first contact; every listing must therefore already carry the canonical
name, description and sameAs graph from
[canonical-entity.yaml](canonical-entity.yaml).
