"use strict";

const fs = require("fs");
const path = require("path");

const I18N_PATH = path.join(__dirname, "..", "js", "i18n.js");
const LOCALE_ORDER = ["en", "ar", "ur", "id", "fr", "tr"];

const PRICING = {
  en: {
    label: "How Nuria Works",
    title: "Free with <em>Ads</em>, Optional <em>Ad-Free</em>",
    subtitle:
      "Nuria is free to download and use. Every account gets the full app — Quran, duas, prayer tools, Qaida, Ask Nuria, and more — supported by advertising. New users receive 15 starter reflections.",
    std_tier: "Free",
    std_price: "Free forever \u00b7 supported by ads",
    std_desc:
      "Create your account and use Nuria at no charge. Core features are unlocked for everyone; discreet ads help keep Nuria free for the community.",
    std_f1: "\u2713\u00a0\u00a0Full Quran with audio, playback controls, and 40+ translations",
    std_f2: "\u2713\u00a0\u00a0Duas, adhkar, daily verse, dhikr, and Sunnat practices",
    std_f3: "\u2713\u00a0\u00a0Prayer times, adhan, Qibla, mosque finder, and Live Haramain",
    std_f4: "\u2713\u00a0\u00a0Islamic audio, companions texts, ruqyah, and guides",
    std_f5: "\u2713\u00a0\u00a0Prayer tracking, Muhasaba, Qaida, Islamic calendar, and badges",
    std_f6: "\u2713\u00a0\u00a015 starter reflections (one-time per device)",
    std_f7: "\u2713\u00a0\u00a0Ask Nuria and reflections across 15 categories",
    std_f8: "\u2713\u00a0\u00a0Optional rewarded ads for bonus reflections",
    std_f9: "\u2713\u00a0\u00a0Read, listen, learn, and track for free",
    std_f10: "\u2717\u00a0\u00a0Banner, native, and interstitial advertisements",
    std_f11: "\u2717\u00a0\u00a0Luxury Stone premium theme",
    std_btn: "Download Nuria",
    bar_badge: "Remove Ads",
    bar_tier: "Serene & Noor",
    bar_subtier: "One-time purchase",
    bar_price: "Optional one-time \u00b7 permanent ad-free",
    bar_desc:
      "Support Nuria and remove advertising forever with a single purchase. Nuria Serene removes all ads. Nuria Noor also unlocks the Luxury Stone theme and includes 300 bonus reflections.",
    bar_f1: "\u2713\u00a0\u00a0Everything in the free app",
    bar_f2: "\u2713\u00a0\u00a0No banner, native, or interstitial ads",
    bar_f3: "\u2713\u00a0\u00a0Nuria Noor: Luxury Stone theme + 300 reflections",
    bar_f4: "\u2713\u00a0\u00a0One-time payment — does not auto-renew",
    bar_f5: "\u2713\u00a0\u00a0Restore on new devices via your store account",
    bar_f6: "\u2713\u00a0\u00a0Optional reflection top-ups and donations in Settings",
    bar_f7: "\u2713\u00a0\u00a0Directly supports the team behind Nuria",
    bar_f8: "\u2713\u00a0\u00a0Rewarded ads still available for bonus reflections",
    bar_btn: "Download & Choose in App",
  },
  ar: {
    label: "كيف تعمل نوريا",
    title: "<em>مجانية</em> مع إعلانات، <em>بدون إعلانات</em> اختيارياً",
    subtitle:
      "نوريا مجانية للتنزيل والاستخدام. كل حساب يحصل على التطبيق الكامل — القرآن، الأدعية، أدوات الصلاة، القاعدة، اسأل نوريا، والمزيد — بدعم من الإعلانات. يحصل المستخدمون الجدد على 15 تأملاً ابتدائياً.",
    std_tier: "مجاني",
    std_price: "مجاني دائماً · بدعم من الإعلانات",
    std_desc:
      "أنشئ حسابك واستخدم نوريا دون رسوم. الميزات الأساسية متاحة للجميع؛ الإعلانات الخفيفة تساعد في إبقاء نوريا مجانية للمجتمع.",
    std_f1: "✓  القرآن كاملاً مع الصوت و40+ ترجمة",
    std_f2: "✓  الأدعية والأذكار والآية اليومية والذكر وممارسات السنة",
    std_f3: "✓  أوقات الصلاة والأذان والقبلة ومسجد قريب والحرمين المباشر",
    std_f4: "✓  صوتيات إسلامية ونصوص الصحابة والرقية والأدلة",
    std_f5: "✓  تتبع الصلاة والمحاسبة والقاعدة والتقويم الإسلامي والشارات",
    std_f6: "✓  15 تأملاً ابتدائياً (مرة واحدة لكل جهاز)",
    std_f7: "✓  اسأل نوريا وتأملات عبر 15 فئة",
    std_f8: "✓  إعلانات مكافأة اختيارية لتأملات إضافية",
    std_f9: "✓  اقرأ واستمع وتعلّم وتتبع مجاناً",
    std_f10: "✗  إعلانات بانر ومحلية وبين الصفحات",
    std_f11: "✗  مظهر Luxury Stone المميز",
    std_btn: "تحميل نوريا",
    bar_badge: "إزالة الإعلانات",
    bar_tier: "Serene و Noor",
    bar_subtier: "شراء لمرة واحدة",
    bar_price: "اختياري لمرة واحدة · بدون إعلانات دائماً",
    bar_desc:
      "ادعم نوريا وأزل الإعلانات للأبد بشراء واحد. Nuria Serene يزيل كل الإعلانات. Nuria Noor يفتح أيضاً مظهر Luxury Stone ويمنح 300 تأملاً إضافياً.",
    bar_f1: "✓  كل ما في التطبيق المجاني",
    bar_f2: "✓  بدون إعلانات بانر أو محلية أو بين الصفحات",
    bar_f3: "✓  Nuria Noor: Luxury Stone + 300 تأملاً",
    bar_f4: "✓  دفعة واحدة — لا يتجدد تلقائياً",
    bar_f5: "✓  استعادة على أجهزة جديدة عبر حساب المتجر",
    bar_f6: "✓  تعبئة تأملات وتبرعات اختيارية في الإعدادات",
    bar_f7: "✓  يدعم فريق نوريا مباشرة",
    bar_f8: "✓  إعلانات المكافأة متاحة لتأملات إضافية",
    bar_btn: "حمّل واختر داخل التطبيق",
  },
  ur: {
    label: "نوریا کیسے کام کرتی ہے",
    title: "اشتہارات کے ساتھ <em>مفت</em>، اختیاری <em>بغیر اشتہار</em>",
    subtitle:
      "نوریا مفت ڈاؤن لوڈ اور استعمال کے لیے ہے۔ ہر اکاؤنٹ مکمل ایپ حاصل کرتا ہے — قرآن، دعائیں، نماز ٹولز، قاعدہ، Ask Nuria، اور بہت کچھ — اشتہارات سے سپورٹ۔ نئے صارفین 15 ابتدائی reflections حاصل کرتے ہیں۔",
    std_tier: "مفت",
    std_price: "ہمیشہ مفت · اشتہارات سے سپورٹ",
    std_desc:
      "اپنا اکاؤنٹ بنائیں اور نوریا مفت استعمال کریں۔ بنیادی فیچرز سب کے لیے کھلے ہیں؛ ہلکے اشتہارات نوریا کو کمیونٹی کے لیے مفت رکھتے ہیں۔",
    std_f1: "✓  پورا قرآن آڈیو، پلے بیک اور 40+ تراجم کے ساتھ",
    std_f2: "✓  دعائیں، اذکار، روزانہ آیت، ذکر اور سنت کے مشقیں",
    std_f3: "✓  نماز کے اوقات، اذان، قبلہ، mosque finder اور Live Haramain",
    std_f4: "✓  اسلامی آڈیو، صحابہ texts، ruqyah اور guides",
    std_f5: "✓  prayer tracking، محاسبہ، قاعدہ، اسلامی کیلنڈر اور badges",
    std_f6: "✓  15 ابتدائی reflections (ہر ڈیوائس پر ایک بار)",
    std_f7: "✓  Ask Nuria اور 15 زمروں میں reflections",
    std_f8: "✓  bonus reflections کے لیے اختیاری rewarded ads",
    std_f9: "✓  مفت پڑھیں، سنیں، سیکھیں اور track کریں",
    std_f10: "✗  banner، native اور interstitial اشتہارات",
    std_f11: "✗  Luxury Stone premium theme",
    std_btn: "نوریا ڈاؤن لوڈ کریں",
    bar_badge: "اشتہارات ہٹائیں",
    bar_tier: "Serene اور Noor",
    bar_subtier: "ایک بار کی خرید",
    bar_price: "اختیاری ایک بار · مستقل بغیر اشتہار",
    bar_desc:
      "نوریا کو سپورٹ کریں اور ایک خرید سے اشتہارات ہمیشہ ہٹائیں۔ Nuria Serene تمام اشتہارات ہٹاتا ہے۔ Nuria Noor Luxury Stone theme بھی کھولتا ہے اور 300 bonus reflections دیتا ہے۔",
    bar_f1: "✓  مفت ایپ میں سب کچھ",
    bar_f2: "✓  کوئی banner، native یا interstitial اشتہار نہیں",
    bar_f3: "✓  Nuria Noor: Luxury Stone + 300 reflections",
    bar_f4: "✓  ایک ادائیگی — خود تجدید نہیں ہوتی",
    bar_f5: "✓  store اکاؤنٹ سے نئے ڈیوائس پر restore",
    bar_f6: "✓  Settings میں reflection top-up اور donations",
    bar_f7: "✓  نوریا ٹیم کو براہ راست سپورٹ",
    bar_f8: "✓  bonus reflections کے لیے rewarded ads دستیاب",
    bar_btn: "ڈاؤن لوڈ کریں اور ایپ میں منتخب کریں",
  },
  id: {
    label: "Cara Nuria Bekerja",
    title: "<em>Gratis</em> dengan Iklan, <em>Tanpa Iklan</em> Opsional",
    subtitle:
      "Nuria gratis untuk diunduh dan digunakan. Setiap akun mendapat aplikasi lengkap — Quran, doa, alat shalat, Qaida, Ask Nuria, dan lainnya — didukung oleh iklan. Pengguna baru mendapat 15 refleksi awal.",
    std_tier: "Gratis",
    std_price: "Selamanya gratis · didukung iklan",
    std_desc:
      "Buat akun dan gunakan Nuria tanpa biaya. Fitur inti terbuka untuk semua; iklan ringan membantu Nuria tetap gratis untuk komunitas.",
    std_f1: "✓  Quran lengkap dengan audio, kontrol putar, dan 40+ terjemahan",
    std_f2: "✓  Doa, adzkar, ayat harian, dzikir, dan praktik Sunnat",
    std_f3: "✓  Waktu shalat, adzan, kiblat, pencari masjid, dan Live Haramain",
    std_f4: "✓  Audio Islami, teks sahabat, ruqyah, dan panduan",
    std_f5: "✓  Pelacakan shalat, Muhasaba, Qaida, kalender Islam, dan lencana",
    std_f6: "✓  15 refleksi awal (sekali per perangkat)",
    std_f7: "✓  Ask Nuria dan refleksi di 15 kategori",
    std_f8: "✓  Iklan reward opsional untuk refleksi bonus",
    std_f9: "✓  Baca, dengarkan, belajar, dan lacak gratis",
    std_f10: "✗  Iklan banner, native, dan interstitial",
    std_f11: "✗  Tema premium Luxury Stone",
    std_btn: "Unduh Nuria",
    bar_badge: "Hapus Iklan",
    bar_tier: "Serene & Noor",
    bar_subtier: "Pembelian sekali",
    bar_price: "Opsional sekali · tanpa iklan permanen",
    bar_desc:
      "Dukung Nuria dan hapus iklan selamanya dengan satu pembelian. Nuria Serene menghapus semua iklan. Nuria Noor juga membuka tema Luxury Stone dan memberi 300 refleksi bonus.",
    bar_f1: "✓  Semua yang ada di aplikasi gratis",
    bar_f2: "✓  Tanpa iklan banner, native, atau interstitial",
    bar_f3: "✓  Nuria Noor: Luxury Stone + 300 refleksi",
    bar_f4: "✓  Satu pembayaran — tidak diperpanjang otomatis",
    bar_f5: "✓  Pulihkan di perangkat baru via akun toko",
    bar_f6: "✓  Top-up refleksi dan donasi opsional di Pengaturan",
    bar_f7: "✓  Langsung mendukung tim Nuria",
    bar_f8: "✓  Iklan reward tetap tersedia untuk refleksi bonus",
    bar_btn: "Unduh & pilih di aplikasi",
  },
  fr: {
    label: "Comment Nuria fonctionne",
    title: "<em>Gratuit</em> avec publicités, <em>sans pub</em> en option",
    subtitle:
      "Nuria est gratuite à télécharger et à utiliser. Chaque compte obtient l'application complète — Coran, duas, outils de prière, Qaida, Ask Nuria, et plus — financée par la publicité. Les nouveaux utilisateurs reçoivent 15 réflexions de départ.",
    std_tier: "Gratuit",
    std_price: "Toujours gratuit · financé par la publicité",
    std_desc:
      "Créez votre compte et utilisez Nuria sans frais. Les fonctions essentielles sont ouvertes à tous ; des publicités discrètes aident à garder Nuria gratuite pour la communauté.",
    std_f1: "✓  Coran complet avec audio, contrôles et 40+ traductions",
    std_f2: "✓  Duas, adhkar, verset du jour, dhikr et pratiques Sunnat",
    std_f3: "✓  Heures de prière, adhan, Qibla, mosquées et Live Haramain",
    std_f4: "✓  Audio islamique, textes des compagnons, ruqyah et guides",
    std_f5: "✓  Suivi des prières, Muhasaba, Qaida, calendrier islamique et badges",
    std_f6: "✓  15 réflexions de départ (une fois par appareil)",
    std_f7: "✓  Ask Nuria et réflexions dans 15 catégories",
    std_f8: "✓  Publicités récompensées optionnelles pour des réflexions bonus",
    std_f9: "✓  Lisez, écoutez, apprenez et suivez gratuitement",
    std_f10: "✗  Bannières, native et publicités interstitielles",
    std_f11: "✗  Thème premium Luxury Stone",
    std_btn: "Télécharger Nuria",
    bar_badge: "Supprimer les pubs",
    bar_tier: "Serene & Noor",
    bar_subtier: "Achat unique",
    bar_price: "Option unique · sans pub permanente",
    bar_desc:
      "Soutenez Nuria et supprimez la publicité pour toujours avec un seul achat. Nuria Serene supprime toutes les pubs. Nuria Noor ouvre aussi le thème Luxury Stone et inclut 300 réflexions bonus.",
    bar_f1: "✓  Tout dans l'application gratuite",
    bar_f2: "✓  Pas de bannières, native ou interstitielles",
    bar_f3: "✓  Nuria Noor : Luxury Stone + 300 réflexions",
    bar_f4: "✓  Paiement unique — pas de renouvellement auto",
    bar_f5: "✓  Restauration sur nouvel appareil via compte store",
    bar_f6: "✓  Recharges de réflexions et dons optionnels dans Paramètres",
    bar_f7: "✓  Soutient directement l'équipe Nuria",
    bar_f8: "✓  Pubs récompensées encore disponibles pour bonus",
    bar_btn: "Télécharger et choisir dans l'app",
  },
  tr: {
    label: "Nuria Nasıl Çalışır",
    title: "Reklamlı <em>Ücretsiz</em>, İsteğe Bağlı <em>Reklamsız</em>",
    subtitle:
      "Nuria indirmesi ve kullanımı ücretsizdir. Her hesap tam uygulamayı alır — Kuran, dualar, namaz araçları, Qaida, Ask Nuria ve daha fazlası — reklamlarla desteklenir. Yeni kullanıcılar 15 başlangıç reflection alır.",
    std_tier: "Ücretsiz",
    std_price: "Her zaman ücretsiz · reklamlı",
    std_desc:
      "Hesap oluşturun ve Nuria'yı ücretsiz kullanın. Temel özellikler herkese açık; hafif reklamlar Nuria'yı topluluk için ücretsiz tutar.",
    std_f1: "✓  Ses, oynatma kontrolleri ve 40+ çeviriyle tam Kuran",
    std_f2: "✓  Dualar, adhkar, günlük ayet, zikir ve Sünnet uygulamaları",
    std_f3: "✓  Namaz vakitleri, ezan, kıble, cami bulucu ve Canlı Haramain",
    std_f4: "✓  İslami ses, sahabeler metinleri, ruqyah ve rehberler",
    std_f5: "✓  Namaz takibi, Muhasaba, Qaida, İslami takvim ve rozetler",
    std_f6: "✓  15 başlangıç reflection (cihazda bir kez)",
    std_f7: "✓  Ask Nuria ve 15 kategoride reflections",
    std_f8: "✓  Bonus reflections için isteğe bağlı ödüllü reklamlar",
    std_f9: "✓  Ücretsiz okuyun, dinleyin, öğrenin ve takip edin",
    std_f10: "✗  Banner, native ve interstitial reklamlar",
    std_f11: "✗  Luxury Stone premium tema",
    std_btn: "Nuria'yı İndir",
    bar_badge: "Reklamları Kaldır",
    bar_tier: "Serene & Noor",
    bar_subtier: "Tek seferlik satın alma",
    bar_price: "İsteğe bağlı tek sefer · kalıcı reklamsız",
    bar_desc:
      "Nuria'yı destekleyin ve tek satın almayla reklamları kalıcı kaldırın. Nuria Serene tüm reklamları kaldırır. Nuria Noor Luxury Stone temasını da açar ve 300 bonus reflection verir.",
    bar_f1: "✓  Ücretsiz uygulamadaki her şey",
    bar_f2: "✓  Banner, native veya interstitial reklam yok",
    bar_f3: "✓  Nuria Noor: Luxury Stone + 300 reflections",
    bar_f4: "✓  Tek ödeme — otomatik yenilenmez",
    bar_f5: "✓  Mağaza hesabıyla yeni cihazda geri yükleme",
    bar_f6: "✓  Ayarlarda reflection top-up ve bağışlar",
    bar_f7: "✓  Nuria ekibini doğrudan destekler",
    bar_f8: "✓  Bonus reflections için rewarded reklamlar hâlâ mevcut",
    bar_btn: "İndir ve uygulamada seç",
  },
};

const DOWNLOAD_DESC = {
  en:
    "Download Nuria for free — full Quran, duas, prayer tools, Qaida, Ask Nuria, and daily guidance in one app. Continue free with ads, or buy Nuria Serene or Nuria Noor once to remove ads permanently.",
  ar:
    "حمّل نوريا مجاناً — القرآن الكامل، الأدعية، أدوات الصلاة، القاعدة، اسأل نوريا، والإرشاد اليومي في تطبيق واحد. استمر مجاناً مع الإعلانات، أو اشترِ Nuria Serene أو Nuria Noor مرة واحدة لإزالة الإعلانات للأبد.",
  ur:
    "نوریا مفت ڈاؤن لوڈ کریں — مکمل قرآن، دعائیں، نماز ٹولز، قاعدہ، Ask Nuria اور روزانہ رہنمائی ایک ایپ میں۔ اشتہارات کے ساتھ مفت جاری رکھیں، یا اشتہارات ہمیشہ ہٹانے کے لیے Nuria Serene یا Nuria Noor ایک بار خریدیں۔",
  id:
    "Unduh Nuria gratis — Quran lengkap, doa, alat shalat, Qaida, Ask Nuria, dan panduan harian dalam satu aplikasi. Lanjutkan gratis dengan iklan, atau beli Nuria Serene atau Nuria Noor sekali untuk menghapus iklan selamanya.",
  fr:
    "Téléchargez Nuria gratuitement — Coran complet, duas, outils de prière, Qaida, Ask Nuria et guidance quotidienne dans une seule app. Continuez gratuitement avec publicités, ou achetez Nuria Serene ou Nuria Noor une fois pour supprimer les pubs pour toujours.",
  tr:
    "Nuria'yı ücretsiz indirin — tam Kuran, dualar, namaz araçları, Qaida, Ask Nuria ve günlük rehberlik tek uygulamada. Ücretsiz reklamlarla devam edin veya reklamları kalıcı kaldırmak için Nuria Serene veya Nuria Noor satın alın.",
};

function escapeJsString(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function formatPricingBlock(data) {
  const lines = ["    pricing: {"];
  for (const [key, value] of Object.entries(data)) {
    lines.push(`      ${key}: '${escapeJsString(value)}',`);
  }
  lines.push("    },");
  return lines.join("\n");
}

function findLocaleBlockStart(content, locale) {
  const tStart = content.indexOf("const T = {");
  if (tStart === -1) throw new Error("const T block not found");
  const start = content.indexOf(`  ${locale}: {`, tStart);
  if (start === -1) throw new Error(`Locale block not found: ${locale}`);
  return start;
}

function replaceInLocaleSection(content, locale, replacers) {
  const start = findLocaleBlockStart(content, locale);

  let end = content.length;
  for (const other of LOCALE_ORDER) {
    if (other === locale) continue;
    const idx = content.indexOf(`  ${other}: {`, start + 1);
    if (idx !== -1 && idx < end) end = idx;
  }

  let section = content.slice(start, end);
  for (const [pattern, replacement] of replacers) {
    if (!section.match(pattern)) {
      throw new Error(`Pattern not found in ${locale}: ${pattern}`);
    }
    section = section.replace(pattern, replacement);
  }

  return content.slice(0, start) + section + content.slice(end);
}

let content = fs.readFileSync(I18N_PATH, "utf8");

for (const locale of LOCALE_ORDER) {
  const pricingBlock = formatPricingBlock(PRICING[locale]);
  content = replaceInLocaleSection(content, locale, [
    [/    pricing: \{[\s\S]*?\n      bar_btn:[\s\S]*?\n    \},/m, pricingBlock],
    [
      /(    download: \{[\s\S]*?      desc: ')[^']*(')/m,
      `$1${escapeJsString(DOWNLOAD_DESC[locale])}$2`,
    ],
  ]);
}

// English-only legal/support string updates
content = replaceInLocaleSection(content, "en", [
  [
    /warn_li3: '[^']*'/,
    "warn_li3: 'If you have an active legacy Barakah subscription, cancel it in App Store or Google Play <strong>before</strong> deleting your account. One-time Serene or Noor purchases do not need cancellation.'",
  ],
  [
    /warn_li4: '[^']*'/,
    "warn_li4: 'Unused reflections and Serene or Noor benefits do not transfer to a new account.'",
  ],
  [
    /meta: '<strong>Effective date:<\/strong> 1 January 2026[^']*'/,
    "meta: '<strong>Effective date:</strong> 9 June 2026 &nbsp;&middot;&nbsp; <strong>Last updated:</strong> 9 June 2026'",
  ],
  [
    /s1_text: 'This Cookie Policy explains how Nuria[^']*'/,
    "s1_text: 'This Cookie Policy explains how Nuria (\"we\", \"us\", \"our\") uses cookies and similar local storage on the Nuria website. The Nuria app may show advertising (see our Privacy Policy §2.19); this page covers website cookies only.'",
  ],
  [
    /card2_text: '[^']*'/,
    "card2_text: 'Learn how 15 starter reflections work and how personalised reflections are delivered inside Nuria.'",
  ],
  [
    /card3_title: 'Billing & Barakah'/,
    "card3_title: 'Billing & Purchases'",
  ],
  [
    /card3_text: "[^"]*"/,
    "card3_text: \"Questions about Nuria Serene, Nuria Noor, legacy Barakah subscriptions, billing, or cancellation? We've answered the most common questions below.\"",
  ],
  [
    /faq2_a: '[^']*'/,
    "faq2_a: 'Nuria is free to download and use with advertising. Every account gets the full app — Quran, duas, prayer tools, Qaida, Ask Nuria, tracking, and more — in 100+ languages. New users receive <strong>15 starter reflections</strong>. Optional one-time purchases (Nuria Serene or Nuria Noor) remove ads permanently; Nuria Noor also unlocks Luxury Stone and includes 300 bonus reflections.'",
  ],
  [
    /faq3_a: '[^']*'/,
    "faq3_a: 'Reflections are your balance for personalised guidance in Nuria. Your balance is visible in the app. You can earn bonus reflections through optional rewarded ads, buy reflection top-ups, or choose Nuria Noor for 300 bonus reflections.'",
  ],
  [
    /faq4_q: '[^']*'/,
    "faq4_q: 'What are Nuria Serene and Nuria Noor?'",
  ],
  [
    /faq4_a: '[^']*'/,
    "faq4_a: 'Nuria Serene and Nuria Noor are optional <strong>one-time in-app purchases</strong> that remove banner, native, and interstitial ads permanently. Nuria Noor also unlocks the Luxury Stone theme and includes 300 bonus reflections. They do not auto-renew. Legacy Barakah subscriptions remain honoured for existing subscribers until cancelled.'",
  ],
  [
    /faq5_a: '[^']*'/,
    "faq5_a: 'Every new device receives <strong>15 starter reflections</strong> once. You can add more through rewarded ads, reflection top-ups in Settings, or by choosing Nuria Noor.'",
  ],
  [
    /faq7_a: '[^']*'/,
    "faq7_a: 'You can keep using Nuria\\'s daily guidance and prayer tools as normal. Watch optional rewarded ads for bonus reflections, buy a top-up in Settings, or choose Nuria Noor for a larger reflection bundle.'",
  ],
  [
    /subtitle: 'This page confirms the referral code[^']*'/,
    "subtitle: 'This page confirms the referral code and helps you copy it. Purchases happen inside the Nuria app through Apple or Google in-app purchase.'",
  ],
  [
    /code_instructions: '[^']*'/,
    "code_instructions: 'Try Open in Nuria first. If your browser stays on the website, copy the code and enter it manually inside the app before your first purchase.'",
  ],
  [
    /steps_3: '[^']*'/,
    "steps_3: 'Open Nuria Serene or Nuria Noor in the app.'",
  ],
  [
    /steps_4: '[^']*'/,
    "steps_4: 'Enter this code before your first purchase.'",
  ],
  [
    /help_partner_copy: '[^']*'/,
    "help_partner_copy: 'When you use your community\\'s referral code, your purchase directly supports their partnership with Nuria.'",
  ],
  [
    /help_4: '[^']*'/,
    "help_4: 'Open Nuria and enter the code before your first purchase.'",
  ],
  [
    /help_5: '[^']*'/,
    "help_5: 'Your purchase supports your community\\'s partnership with Nuria.'",
  ],
]);

fs.writeFileSync(I18N_PATH, content, "utf8");
console.log("Updated js/i18n.js for monetization model.");
