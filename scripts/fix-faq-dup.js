const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '../js/i18n.js');
let s = fs.readFileSync(p, 'utf8');

// Remove duplicate faq1_a + faq2_a block (lines 310–311) between first faq2_a and faq3_q in en supp
const re = /(early access to new features\.',\n)      faq1_a: 'Nuria is a complete Islamic companion[^]*?',\n      faq2_a: 'Nuria is free to download\.[^]*?',\n(      faq3_q: 'What are credits\?')/;
const m = s.match(re);
if (!m) {
  console.error('duplicate FAQ block pattern not found');
  process.exit(1);
}
s = s.replace(re, '$1$2');

const oldFaq2 =
  "      faq2_a: 'Nuria is free to download. Every new account begins with <strong>50 starter credits</strong>. The free experience includes the full Quran, 40+ Quran translations, reading and listening, duas, adhkar, daily verse, prayer tools, audio, guides, tracking, mosque finder, ruqyah, the Islamic calendar, and more — all available in 100+ languages — while Barakah adds Ask Nuria, Quran tafsir from multiple scholars matched to your translation, 100 reflections each month, 2 extra widget pages, a Barakah badge, personalised greeting, preferred topic, and early access to new features.',";
const newFaq2 =
  "      faq2_a: 'Nuria is free to download. Every new account begins with <strong>50 starter credits</strong>. The free experience includes the full Quran, 40+ Quran translations, reading and listening, duas, adhkar, daily verse, prayer tools, audio, guides, tracking, Muhasaba, mosque finder, ruqyah, the Islamic calendar, and more — all available in 100+ languages — while Barakah adds Ask Nuria, Quran tafsir from multiple scholars matched to your translation, 100 reflections each month, 2 extra widget pages, a Barakah badge, personalised greeting, preferred topic, and early access to new features.',";

if (s.includes(oldFaq2)) {
  s = s.replace(oldFaq2, newFaq2);
} else if (!s.includes(newFaq2)) {
  console.error('could not update faq2_a with Muhasaba');
  process.exit(1);
}

fs.writeFileSync(p, s, 'utf8');
console.log('OK');
