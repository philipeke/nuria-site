"use strict";

const fs = require("fs");
const path = require("path");

const I18N_PATH = path.join(__dirname, "..", "js", "i18n.js");
const LOCALE_ORDER = ["en", "ar", "ur", "id", "fr", "tr"];

const MARKETING = {
  en: {
    site_index_title: "Nuria — Free Islamic Companion | Serene & Noor",
    site_index_desc:
      "Free Quran, prayer tools, Ask Nuria, and daily Islamic guidance. Remove ads with Nuria Serene, or unlock Luxury Stone and 300 bonus reflections with Nuria Noor.",
    site_index_og_title: "Nuria — Free Islamic Companion | Serene & Noor",
    site_index_og_desc:
      "Download Nuria free with ads, or choose Nuria Serene (ad-free) or Nuria Noor (Luxury Stone + bonus reflections).",
    hero_subtitle: "Free with ads — Serene & Noor when you want more",
    hero_desc:
      "The full Islamic companion in 100+ languages — Quran, duas, prayer tools, Qaida, Ask Nuria, and daily guidance. Nuria Serene removes ads forever with one purchase. Nuria Noor adds Luxury Stone and 300 bonus reflections.",
    hero_stat_barakah: "Serene & Noor",
    about_suite_i13: "Nuria Noor: Luxury Stone theme",
    about_suite_i14: "Nuria Qaida with XP, streaks, and child/adult modes",
    about_suite_i15: "Sunnat practices from Sahih al-Bukhari and Sahih Muslim",
    about_suite_i16: "Halqa challenges, scholar path, and personalized guidance",
    about_suite_i17: "Live Haramain and nearby imam experience",
    newfeatures_subtitle:
      "Quran, prayer tools, Ask Nuria, Halqa, Qaida, Sunnat, and Live Haramain — free with ads. Nuria Serene removes ads; Nuria Noor unlocks Luxury Stone and bonus reflections.",
    stone_tag: "Nuria Noor",
    stone_title: "Luxury Stone Theme",
    stone_text:
      "Unlock with Nuria Noor: warm stone surfaces, dark emerald accents, gilded borders, procedural veining, and theme-aware widgets across the app — plus the same palette on this website.",
    stone_li1: "Included with Nuria Noor",
    stone_li2: "Procedural stone texture with readable warm ink",
    stone_li3: "Preview the theme on this website",
    release_label: "Version 4.0.0 to 4.1.0",
    release_title: "Serene & Noor, Luxury Stone, and a fuller companion",
    release_subtitle:
      "Since 4.0.0, Nuria added Nuria Serene and Nuria Noor one-time purchases, the Luxury Stone theme via Noor, deeper Quran controls, Halqa, Qaida, Sunnat, Live Haramain, and ongoing polish through 4.1.0.",
    release_card1_title: "Luxury Stone with Nuria Noor",
    release_card1_text:
      "Nuria Noor unlocks a warm stone surface system with dark emerald CTAs, gilded rules, procedural veining, texture-aware widgets, and a live preview in settings.",
    release_band_site:
      "Preview the Luxury Stone palette on this website — the same premium theme Nuria Noor unlocks in the app.",
    subj_2: "Serene, Noor & Billing",
    about_f7_text:
      "Have a question about your deen, a hardship on your heart, or something you've always wondered? Ask Nuria and receive wisdom rooted in the Islamic tradition, personalised for you.",
    about_suite_text:
      "From Quran reading and listening to duas, prayer tools, Islamic audio, learning paths, Halqa accountability, Sunnat practice, ruqyah, and progress systems, Nuria is built as one complete Islamic companion. The free app includes the full experience for everyone; optional Serene or Noor purchases remove ads and Nuria Noor unlocks Luxury Stone.",
    newfeatures_ask_tag: "Ask Nuria",
    newfeatures_ask_text:
      "A question about your deen. A hardship weighing on your heart. Something you've always wondered about in Islam. Ask it. Nuria gives you a thoughtful, personalised answer rooted in authentic Islamic teaching.",
  },
  ar: {
    site_index_title: "نوريا — رفيق إسلامي مجاني | Serene و Noor",
    site_index_desc:
      "قرآن مجاني، أدوات صلاة، اسأل نوريا، وإرشاد يومي. Nuria Serene يزيل الإعلانات؛ Nuria Noor يفتح Luxury Stone و300 تأملاً إضافياً.",
    site_index_og_title: "نوريا — رفيق إسلامي مجاني | Serene و Noor",
    site_index_og_desc:
      "حمّل نوريا مجاناً مع إعلانات، أو اختر Nuria Serene (بدون إعلانات) أو Nuria Noor (Luxury Stone + تأملات إضافية).",
    hero_subtitle: "مجاني مع إعلانات — Serene و Noor عند الحاجة",
    hero_desc:
      "رفيق إسلامي كامل بأكثر من 100 لغة — قرآن، أدعية، أدوات صلاة، قاعدة، اسأل نوريا، وإرشاد يومي. Nuria Serene يزيل الإعلانات للأبد. Nuria Noor يضيف Luxury Stone و300 تأملاً إضافياً.",
    hero_stat_barakah: "Serene و Noor",
    about_suite_i13: "Nuria Noor: مظهر Luxury Stone",
    about_suite_i14: "قاعدة نوريا مع XP وسلاسل وأوضاع للأطفال والبالغين",
    about_suite_i15: "ممارسات السنة من صحيح البخاري وصحيح مسلم",
    about_suite_i16: "تحديات حلقة، مسار العلماء، وإرشاد شخصي",
    about_suite_i17: "الحرمين المباشر والبحث عن إمام قريب",
    newfeatures_subtitle:
      "قرآن، أدوات صلاة، اسأل نوريا، حلقة، قاعدة، سنة، والحرمين — مجاني مع إعلانات. Nuria Serene يزيل الإعلانات؛ Nuria Noor يفتح Luxury Stone وتأملات إضافية.",
    stone_tag: "Nuria Noor",
    stone_title: "مظهر Luxury Stone",
    stone_text:
      "يُفتح مع Nuria Noor: أسطح حجرية دافئة، لمسات زمردية، حدود ذهبية، عروق طبيعية، وودجات متوافقة مع المظهر — ونفس الألوان على هذا الموقع.",
    stone_li1: "مضمن مع Nuria Noor",
    stone_li2: "نسيج حجري مع نص دافئ واضح",
    stone_li3: "عاين المظهر على هذا الموقع",
    release_label: "الإصدار 4.0.0 إلى 4.1.0",
    release_title: "Serene و Noor، Luxury Stone، ورفيق أكمل",
    release_subtitle:
      "منذ 4.0.0، أضافت نوريا شراء Nuria Serene و Nuria Noor لمرة واحدة، مظهر Luxury Stone عبر Noor، أدوات قرآن أعمق، حلقة، قاعدة، سنة، الحرمين، وتحسينات مستمرة حتى 4.1.0.",
    release_card1_title: "Luxury Stone مع Nuria Noor",
    release_card1_text:
      "Nuria Noor يفتح نظام أسطح حجرية دافئة مع أزرار زمردية، قواعد ذهبية، عروق طبيعية، وودجات متوافقة مع المظهر ومعاينة مباشرة في الإعدادات.",
    release_band_site:
      "عاين ألوان Luxury Stone على هذا الموقع — نفس المظهر المميز الذي يفتحه Nuria Noor في التطبيق.",
    subj_2: "Serene، Noor والفوترة",
    about_f7_text:
      "لديك سؤال عن دينك، أو هم يثقل قلبك، أو شيء تتساءل عنه؟ اسأل نوريا وتلقَّ حكمة مستمدة من التراث الإسلامي، مخصصة لك.",
    about_suite_text:
      "من القرآن وأدوات الصلاة إلى الصوتيات والتتبع، نوريا رفيق إسلامي متكامل. التطبيق مجاني للجميع؛ Nuria Serene يزيل الإعلانات و Nuria Noor يفتح Luxury Stone.",
    newfeatures_ask_tag: "اسأل نوريا",
    newfeatures_ask_text:
      "سؤال عن دينك. هم يثقل قلبك. شيء تتساءل عنه في الإسلام. اسأله. نوريا تمنحك إجابة شخصية متأنية مستمدة من التعليم الإسلامي الأصيل.",
  },
  ur: {
    site_index_title: "نوریا — مفت اسلامی ساتھی | Serene اور Noor",
    site_index_desc:
      "مفت قرآن، نماز ٹولز، Ask Nuria، اور روزانہ رہنمائی۔ Nuria Serene اشتہارات ہٹاتا ہے؛ Nuria Noor Luxury Stone اور 300 bonus reflections کھولتا ہے۔",
    site_index_og_title: "نوریا — مفت اسلامی ساتھی | Serene اور Noor",
    site_index_og_desc:
      "نوریا مفت اشتہارات کے ساتھ ڈاؤن لوڈ کریں، یا Nuria Serene (بغیر اشتہار) یا Nuria Noor (Luxury Stone + bonus reflections) منتخب کریں۔",
    hero_subtitle: "اشتہارات کے ساتھ مفت — ضرورت پر Serene اور Noor",
    hero_desc:
      "100+ زبانوں میں مکمل اسلامی ساتھی — قرآن، دعائیں، نماز ٹولز، قاعدہ، Ask Nuria، اور روزانہ رہنمائی۔ Nuria Serene اشتہارات ہمیشہ ہٹاتا ہے۔ Nuria Noor Luxury Stone اور 300 bonus reflections دیتا ہے۔",
    hero_stat_barakah: "Serene اور Noor",
    about_suite_i13: "Nuria Noor: Luxury Stone theme",
    about_suite_i14: "Nuria Qaida XP، streaks، اور child/adult modes کے ساتھ",
    about_suite_i15: "صحیح البخاری اور صحیح مسلم سے سنت کے مشقیں",
    about_suite_i16: "Halqa challenges، scholar path، اور personalised guidance",
    about_suite_i17: "Live Haramain اور nearby imam experience",
    newfeatures_subtitle:
      "قرآن، نماز ٹولز، Ask Nuria، Halqa، Qaida، Sunnat، اور Live Haramain — اشتہارات کے ساتھ مفت۔ Nuria Serene اشتہارات ہٹاتا ہے؛ Nuria Noor Luxury Stone کھولتا ہے۔",
    stone_tag: "Nuria Noor",
    stone_title: "Luxury Stone Theme",
    stone_text:
      "Nuria Noor سے کھولیں: گرم stone surfaces، dark emerald accents، gilded borders، procedural veining، اور theme-aware widgets — اس ویب سائٹ پر بھی یہی palette۔",
    stone_li1: "Nuria Noor کے ساتھ شامل",
    stone_li2: "Procedural stone texture اور readable warm ink",
    stone_li3: "اس ویب سائٹ پر theme preview",
    release_label: "ورژن 4.0.0 سے 4.1.0",
    release_title: "Serene اور Noor، Luxury Stone، اور مکمل ساتھی",
    release_subtitle:
      "4.0.0 سے نوریا Nuria Serene اور Nuria Noor one-time purchases، Noor کے ذریعے Luxury Stone، گہرے Quran controls، Halqa، Qaida، Sunnat، Live Haramain، اور 4.1.0 تک polish شامل کر چکی ہے۔",
    release_card1_title: "Nuria Noor کے ساتھ Luxury Stone",
    release_card1_text:
      "Nuria Noor گرم stone surface system کھولتا ہے — dark emerald CTAs، gilded rules، procedural veining، texture-aware widgets، اور settings میں live preview۔",
    release_band_site:
      "اس ویب سائٹ پر Luxury Stone palette دیکھیں — وہی premium theme جو Nuria Noor ایپ میں کھولتا ہے۔",
    subj_2: "Serene، Noor اور Billing",
    about_f7_text:
      "اپنے دین، دل پر بوجھ، یا کسی سوال کے بارے میں؟ نوریا سے پوچھیں اور اسلامی روایت میں جڑی، آپ کے لیے ذاتی حکمت حاصل کریں۔",
    about_suite_text:
      "قرآن سے نماز ٹولز اور ٹریکنگ تک، نوریا مکمل اسلامی ساتھی ہے۔ مفت ایپ سب کے لیے؛ Nuria Serene اشتہارات ہٹاتا ہے اور Nuria Noor Luxury Stone کھولتا ہے۔",
    newfeatures_ask_tag: "Ask Nuria",
    newfeatures_ask_text:
      "اپنے دین کے بارے میں سوال۔ دل پر بوجھ۔ اسلام کے بارے میں جو کچھ آپ جاننا چاہتے تھے۔ پوچھیں۔ نوریا مستند اسلامی تعلیم پر مبنی سوچا سمجھا ذاتی جواب دیتا ہے۔",
  },
  id: {
    site_index_title: "Nuria — Teman Islami Gratis | Serene & Noor",
    site_index_desc:
      "Quran gratis, alat shalat, Ask Nuria, dan panduan harian. Nuria Serene menghapus iklan; Nuria Noor membuka Luxury Stone dan 300 refleksi bonus.",
    site_index_og_title: "Nuria — Teman Islami Gratis | Serene & Noor",
    site_index_og_desc:
      "Unduh Nuria gratis dengan iklan, atau pilih Nuria Serene (tanpa iklan) atau Nuria Noor (Luxury Stone + refleksi bonus).",
    hero_subtitle: "Gratis dengan iklan — Serene & Noor saat Anda ingin lebih",
    hero_desc:
      "Teman Islami lengkap dalam 100+ bahasa — Quran, doa, alat shalat, Qaida, Ask Nuria, dan panduan harian. Nuria Serene menghapus iklan selamanya. Nuria Noor menambahkan Luxury Stone dan 300 refleksi bonus.",
    hero_stat_barakah: "Serene & Noor",
    about_suite_i13: "Nuria Noor: tema Luxury Stone",
    about_suite_i14: "Nuria Qaida dengan XP, streak, dan mode anak/dewasa",
    about_suite_i15: "Praktik Sunnat dari Sahih al-Bukhari dan Sahih Muslim",
    about_suite_i16: "Halqa, jalur ulama, dan panduan personal",
    about_suite_i17: "Live Haramain dan pencarian imam terdekat",
    newfeatures_subtitle:
      "Quran, alat shalat, Ask Nuria, Halqa, Qaida, Sunnat, dan Live Haramain — gratis dengan iklan. Nuria Serene menghapus iklan; Nuria Noor membuka Luxury Stone.",
    stone_tag: "Nuria Noor",
    stone_title: "Tema Luxury Stone",
    stone_text:
      "Buka dengan Nuria Noor: permukaan batu hangat, aksen zamrud gelap, border emas, urat natural, dan widget yang mengikuti tema — plus palet yang sama di situs ini.",
    stone_li1: "Termasuk dengan Nuria Noor",
    stone_li2: "Tekstur batu procedural dengan teks hangat yang mudah dibaca",
    stone_li3: "Pratinjau tema di situs ini",
    release_label: "Versi 4.0.0 hingga 4.1.0",
    release_title: "Serene & Noor, Luxury Stone, dan teman yang lebih lengkap",
    release_subtitle:
      "Sejak 4.0.0, Nuria menambahkan pembelian sekali Nuria Serene dan Nuria Noor, tema Luxury Stone via Noor, kontrol Quran lebih dalam, Halqa, Qaida, Sunnat, Live Haramain, dan polish hingga 4.1.0.",
    release_card1_title: "Luxury Stone dengan Nuria Noor",
    release_card1_text:
      "Nuria Noor membuka sistem permukaan batu hangat dengan CTA zamrud gelap, garis emas, urat procedural, widget yang mengikuti tema, dan pratinjau langsung di pengaturan.",
    release_band_site:
      "Pratinjau palet Luxury Stone di situs ini — tema premium yang sama yang Nuria Noor membuka di aplikasi.",
    subj_2: "Serene, Noor & Tagihan",
    about_f7_text:
      "Ada pertanyaan tentang deen Anda? Kesulitan di hati? Tanyakan kepada Nuria dan terima hikmah dari tradisi Islam, dipersonalisasi untuk Anda.",
    about_suite_text:
      "Dari Quran hingga alat shalat dan kemajuan, Nuria adalah teman Islami lengkap. Aplikasi gratis untuk semua; Nuria Serene menghapus iklan dan Nuria Noor membuka Luxury Stone.",
    newfeatures_ask_tag: "Ask Nuria",
    newfeatures_ask_text:
      "Pertanyaan tentang deen Anda. Kesulitan di hati. Sesuatu yang ingin Anda ketahui tentang Islam. Tanyakan. Nuria memberi jawaban personal dari ajaran Islam yang otentik.",
  },
  fr: {
    site_index_title: "Nuria — Compagnon islamique gratuit | Serene & Noor",
    site_index_desc:
      "Coran gratuit, outils de prière, Ask Nuria et guidance quotidienne. Nuria Serene supprime les pubs ; Nuria Noor ouvre Luxury Stone et 300 réflexions bonus.",
    site_index_og_title: "Nuria — Compagnon islamique gratuit | Serene & Noor",
    site_index_og_desc:
      "Téléchargez Nuria gratuitement avec publicités, ou choisissez Nuria Serene (sans pub) ou Nuria Noor (Luxury Stone + réflexions bonus).",
    hero_subtitle: "Gratuit avec publicités — Serene & Noor pour aller plus loin",
    hero_desc:
      "Le compagnon islamique complet en 100+ langues — Coran, duas, outils de prière, Qaida, Ask Nuria et guidance quotidienne. Nuria Serene supprime les pubs pour toujours. Nuria Noor ajoute Luxury Stone et 300 réflexions bonus.",
    hero_stat_barakah: "Serene & Noor",
    about_suite_i13: "Nuria Noor : thème Luxury Stone",
    about_suite_i14: "Nuria Qaida avec XP, séries et modes enfant/adulte",
    about_suite_i15: "Pratiques Sunnat de Sahih al-Bukhari et Sahih Muslim",
    about_suite_i16: "Halqa, parcours des savants et guidance personnalisée",
    about_suite_i17: "Live Haramain et recherche d'imam proche",
    newfeatures_subtitle:
      "Coran, outils de prière, Ask Nuria, Halqa, Qaida, Sunnat et Live Haramain — gratuit avec publicités. Nuria Serene supprime les pubs ; Nuria Noor ouvre Luxury Stone.",
    stone_tag: "Nuria Noor",
    stone_title: "Thème Luxury Stone",
    stone_text:
      "Débloqué avec Nuria Noor : surfaces pierre chaude, accents émeraude, bordures dorées, veines naturelles et widgets adaptés au thème — plus la même palette sur ce site.",
    stone_li1: "Inclus avec Nuria Noor",
    stone_li2: "Texture pierre procedural et encre chaude lisible",
    stone_li3: "Prévisualisez le thème sur ce site",
    release_label: "Version 4.0.0 à 4.1.0",
    release_title: "Serene & Noor, Luxury Stone et un compagnon plus complet",
    release_subtitle:
      "Depuis 4.0.0, Nuria a ajouté les achats uniques Nuria Serene et Nuria Noor, le thème Luxury Stone via Noor, des outils Coran plus profonds, Halqa, Qaida, Sunnat, Live Haramain et des améliorations jusqu'à 4.1.0.",
    release_card1_title: "Luxury Stone avec Nuria Noor",
    release_card1_text:
      "Nuria Noor débloque un système de surfaces pierre chaude avec CTA émeraude, règles dorées, veines procedural, widgets adaptés au thème et aperçu en direct dans les paramètres.",
    release_band_site:
      "Prévisualisez la palette Luxury Stone sur ce site — le même thème premium que Nuria Noor débloque dans l'app.",
    subj_2: "Serene, Noor & facturation",
    about_f7_text:
      "Une question sur votre deen ? Une épreuve sur le cœur ? Demandez à Nuria et recevez une sagesse enracinée dans la tradition islamique, personnalisée pour vous.",
    about_suite_text:
      "Du Coran aux outils de prière et au suivi, Nuria est un compagnon islamique complet. L'app est gratuite pour tous ; Nuria Serene supprime les pubs et Nuria Noor ouvre Luxury Stone.",
    newfeatures_ask_tag: "Ask Nuria",
    newfeatures_ask_text:
      "Une question sur votre deen. Une épreuve pesant sur votre cœur. Posez-la. Nuria vous donne une réponse personnalisée enracinée dans l'enseignement islamique authentique.",
  },
  tr: {
    site_index_title: "Nuria — Ücretsiz İslami Yol Arkadaşı | Serene & Noor",
    site_index_desc:
      "Ücretsiz Kuran, namaz araçları, Ask Nuria ve günlük rehberlik. Nuria Serene reklamları kaldırır; Nuria Noor Luxury Stone ve 300 bonus reflection açar.",
    site_index_og_title: "Nuria — Ücretsiz İslami Yol Arkadaşı | Serene & Noor",
    site_index_og_desc:
      "Nuria'yı reklamlarla ücretsiz indirin veya Nuria Serene (reklamsız) ya da Nuria Noor (Luxury Stone + bonus reflections) seçin.",
    hero_subtitle: "Reklamlı ücretsiz — daha fazlası için Serene & Noor",
    hero_desc:
      "100+ dilde tam İslami yol arkadaşı — Kuran, dualar, namaz araçları, Qaida, Ask Nuria ve günlük rehberlik. Nuria Serene reklamları tek satın almayla kalıcı kaldırır. Nuria Noor Luxury Stone ve 300 bonus reflection ekler.",
    hero_stat_barakah: "Serene & Noor",
    about_suite_i13: "Nuria Noor: Luxury Stone teması",
    about_suite_i14: "XP, streak ve çocuk/yetişkin modlarıyla Nuria Qaida",
    about_suite_i15: "Sahih al-Bukhari ve Sahih Muslim'ten Sünnet uygulamaları",
    about_suite_i16: "Halqa, alim yolu ve kişisel rehberlik",
    about_suite_i17: "Canlı Haramain ve yakın imam deneyimi",
    newfeatures_subtitle:
      "Kuran, namaz araçları, Ask Nuria, Halqa, Qaida, Sunnat ve Canlı Haramain — reklamlarla ücretsiz. Nuria Serene reklamları kaldırır; Nuria Noor Luxury Stone açar.",
    stone_tag: "Nuria Noor",
    stone_title: "Luxury Stone Teması",
    stone_text:
      "Nuria Noor ile açılır: sıcak taş yüzeyler, koyu zümrüt vurgular, altın kenarlar, doğal damarlar ve temaya duyarlı widget'lar — bu sitede de aynı palet.",
    stone_li1: "Nuria Noor ile dahil",
    stone_li2: "Okunabilir sıcak metinle procedural taş dokusu",
    stone_li3: "Temayı bu sitede önizleyin",
    release_label: "Sürüm 4.0.0 – 4.1.0",
    release_title: "Serene & Noor, Luxury Stone ve daha tam bir yol arkadaşı",
    release_subtitle:
      "4.0.0'dan bu yana Nuria, Nuria Serene ve Nuria Noor tek seferlik satın almaları, Noor ile Luxury Stone teması, daha derin Kuran araçları, Halqa, Qaida, Sunnat, Canlı Haramain ve 4.1.0'a kadar iyileştirmeler ekledi.",
    release_card1_title: "Nuria Noor ile Luxury Stone",
    release_card1_text:
      "Nuria Noor, koyu zümrüt CTA'lar, altın kurallar, procedural damarlar, temaya duyarlı widget'lar ve ayarlarda canlı önizleme ile sıcak taş yüzey sistemi açar.",
    release_band_site:
      "Luxury Stone paletini bu sitede önizleyin — Nuria Noor'un uygulamada açan aynı premium tema.",
    subj_2: "Serene, Noor ve Faturalama",
    about_f7_text:
      "Deeniniz, kalbinizdeki bir yük veya merak ettiğiniz bir konu hakkında soru? Nuria'ya sorun ve İslami geleneğe dayalı, size özel hikmet alın.",
    about_suite_text:
      "Kurandan namaz araçlarına ve takibe kadar Nuria tam bir İslami yol arkadaşıdır. Uygulama herkese ücretsiz; Nuria Serene reklamları kaldırır, Nuria Noor Luxury Stone açar.",
    newfeatures_ask_tag: "Ask Nuria",
    newfeatures_ask_text:
      "Deeniniz hakkında bir soru. Kalbinizdeki bir yük. İslam hakkında hep merak ettiğiniz bir şey. Sorun. Nuria, otantik İslami öğretime dayalı düşünceli, kişisel bir yanıt verir.",
  },
};

function escapeJs(value) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function findLocaleBlockStart(content, locale) {
  const tStart = content.indexOf("const T = {");
  const start = content.indexOf(`  ${locale}: {`, tStart);
  if (start === -1) throw new Error(`Locale not found: ${locale}`);
  return start;
}

function getLocaleSection(content, locale) {
  const start = findLocaleBlockStart(content, locale);
  let end = content.length;
  for (const other of LOCALE_ORDER) {
    if (other === locale) continue;
    const idx = content.indexOf(`  ${other}: {`, start + 1);
    if (idx !== -1 && idx < end) end = idx;
  }
  return { start, end, section: content.slice(start, end) };
}

function replaceField(section, field, value) {
  const escaped = escapeJs(value);
  const re = new RegExp(`(${field}: ')(?:\\\\.|[^'])*(')`, "m");
  if (!section.match(re)) throw new Error(`Field missing: ${field}`);
  return section.replace(re, `$1${escaped}$2`);
}

function ensureSuiteExtras(section, m) {
  if (section.includes("suite_i13:")) {
    section = replaceField(section, "suite_i13", m.about_suite_i13);
    section = replaceField(section, "suite_i14", m.about_suite_i14);
    section = replaceField(section, "suite_i15", m.about_suite_i15);
    section = replaceField(section, "suite_i16", m.about_suite_i16);
    section = replaceField(section, "suite_i17", m.about_suite_i17);
    return section;
  }
  const block = [
    `      suite_i13: '${escapeJs(m.about_suite_i13)}',`,
    `      suite_i14: '${escapeJs(m.about_suite_i14)}',`,
    `      suite_i15: '${escapeJs(m.about_suite_i15)}',`,
    `      suite_i16: '${escapeJs(m.about_suite_i16)}',`,
    `      suite_i17: '${escapeJs(m.about_suite_i17)}',`,
  ].join("\n");
  const next = section.replace(
    /(suite_i12: '(?:\\.|[^'])*',)\r?\n/,
    `$1\n${block}\n`,
  );
  if (next === section) throw new Error("suite_i13 insert failed");
  return next;
}

function ensureStoneKeys(section, m) {
  if (section.includes("stone_tag:")) {
    section = replaceField(section, "stone_tag", m.stone_tag);
    section = replaceField(section, "stone_title", m.stone_title);
    section = replaceField(section, "stone_text", m.stone_text);
    section = replaceField(section, "stone_li1", m.stone_li1);
    section = replaceField(section, "stone_li2", m.stone_li2);
    section = replaceField(section, "stone_li3", m.stone_li3);
    return section;
  }
  const block = [
    `      stone_tag: '${escapeJs(m.stone_tag)}',`,
    `      stone_title: '${escapeJs(m.stone_title)}',`,
    `      stone_text: '${escapeJs(m.stone_text)}',`,
    `      stone_li1: '${escapeJs(m.stone_li1)}',`,
    `      stone_li2: '${escapeJs(m.stone_li2)}',`,
    `      stone_li3: '${escapeJs(m.stone_li3)}',`,
  ].join("\n");
  const next = section.replace(
    /(calendar_li3: '(?:\\.|[^'])*',)\r?\n(    \},)\r?\n(    pricing:)/,
    `$1\n${block}\n$2\n$3`,
  );
  if (next === section) throw new Error("stone insert failed");
  return next;
}

function ensureReleaseBlock(section, m) {
  if (section.includes("release:")) {
    section = section.replace(
      /(release: \{[\s\S]*?label: ')(?:\\.|[^'])*(')/m,
      `$1${escapeJs(m.release_label)}$2`,
    );
    section = section.replace(
      /(release: \{[\s\S]*?title: ')(?:\\.|[^'])*(')/m,
      `$1${escapeJs(m.release_title)}$2`,
    );
    section = section.replace(
      /(release: \{[\s\S]*?subtitle: ')(?:\\.|[^'])*(')/m,
      `$1${escapeJs(m.release_subtitle)}$2`,
    );
    section = section.replace(
      /(release: \{[\s\S]*?card1_title: ')(?:\\.|[^'])*(')/m,
      `$1${escapeJs(m.release_card1_title)}$2`,
    );
    section = section.replace(
      /(release: \{[\s\S]*?card1_text: ')(?:\\.|[^'])*(')/m,
      `$1${escapeJs(m.release_card1_text)}$2`,
    );
    section = section.replace(
      /(release: \{[\s\S]*?band_site: ')(?:\\.|[^'])*(')/m,
      `$1${escapeJs(m.release_band_site)}$2`,
    );
    return section;
  }
  const block = [
    "    release: {",
    `      label: '${escapeJs(m.release_label)}',`,
    `      title: '${escapeJs(m.release_title)}',`,
    `      subtitle: '${escapeJs(m.release_subtitle)}',`,
    `      card1_title: '${escapeJs(m.release_card1_title)}',`,
    `      card1_text: '${escapeJs(m.release_card1_text)}',`,
    `      band_site: '${escapeJs(m.release_band_site)}',`,
    "    },",
  ].join("\n");
  const next = section.replace(
    /(    categories: \{[\s\S]*?\r?\n    \},)\r?\n(    newfeatures:)/,
    `$1\n${block}\n$2`,
  );
  if (next === section) throw new Error("release insert failed");
  return next;
}

let content = fs.readFileSync(I18N_PATH, "utf8");

for (const locale of LOCALE_ORDER) {
  const m = MARKETING[locale];
  const { start, end, section } = getLocaleSection(content, locale);

  let updated = section;
  updated = replaceField(updated, "index_title", m.site_index_title);
  updated = replaceField(updated, "index_desc", m.site_index_desc);
  updated = replaceField(updated, "index_og_title", m.site_index_og_title);
  updated = replaceField(updated, "index_og_desc", m.site_index_og_desc);
  updated = updated.replace(
    /(hero: \{[\s\S]*?subtitle: ')(?:\\.|[^'])*(')/m,
    `$1${escapeJs(m.hero_subtitle)}$2`,
  );
  updated = updated.replace(
    /(hero: \{[\s\S]*?desc: ')(?:\\.|[^'])*(')/m,
    `$1${escapeJs(m.hero_desc)}$2`,
  );
  updated = replaceField(updated, "stat_barakah", m.hero_stat_barakah);
  updated = updated.replace(
    /(newfeatures: \{[\s\S]*?subtitle: ')(?:\\.|[^'])*(')/m,
    `$1${escapeJs(m.newfeatures_subtitle)}$2`,
  );
  updated = replaceField(updated, "subj_2", m.subj_2);
  updated = updated.replace(
    /(about: \{[\s\S]*?f7_text: ')(?:\\.|[^'])*(')/m,
    `$1${escapeJs(m.about_f7_text)}$2`,
  );
  updated = updated.replace(
    /(about: \{[\s\S]*?suite_text: ')(?:\\.|[^'])*(')/m,
    `$1${escapeJs(m.about_suite_text)}$2`,
  );
  updated = updated.replace(
    /(newfeatures: \{[\s\S]*?ask_tag: ')(?:\\.|[^'])*(')/m,
    `$1${escapeJs(m.newfeatures_ask_tag)}$2`,
  );
  updated = updated.replace(
    /(newfeatures: \{[\s\S]*?ask_text: ')(?:\\.|[^'])*(')/m,
    `$1${escapeJs(m.newfeatures_ask_text)}$2`,
  );
  updated = ensureSuiteExtras(updated, m);
  updated = ensureStoneKeys(updated, m);
  updated = ensureReleaseBlock(updated, m);

  content = content.slice(0, start) + updated + content.slice(end);
}

fs.writeFileSync(I18N_PATH, content, "utf8");
console.log("Updated Serene & Noor marketing in js/i18n.js");
