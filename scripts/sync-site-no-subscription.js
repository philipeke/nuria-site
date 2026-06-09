"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const I18N_PATH = path.join(ROOT, "js", "i18n.js");
const LOCALE_ORDER = ["en", "ar", "ur", "id", "fr", "tr"];

const COPY = {
  en: {
    card2_text:
      "Learn how 15 starter reflections work and how personalised reflections are delivered inside Nuria.",
    card3_title: "Billing & Purchases",
    card3_text:
      "Questions about Nuria Serene, Nuria Noor, billing, or refunds? We've answered the most common questions below.",
    card5_title: "Serene, Noor & Luxury Stone",
    card5_text:
      "Help for Nuria Serene and Nuria Noor one-time purchases, Luxury Stone via Noor, Quran tools, Qaida, Sunnat, Halqa, Live Haramain, and personalization.",
    card5_link: "See what changed →",
    faq2_a:
      "Nuria is free to download and use with advertising. Every account gets the full app — Quran, duas, prayer tools, Qaida, Ask Nuria, tracking, and more — in 100+ languages. New users receive <strong>15 starter reflections</strong>. Optional one-time purchases (Nuria Serene or Nuria Noor) remove ads permanently; Nuria Noor also unlocks Luxury Stone and includes 300 bonus reflections.",
    faq3_a:
      "Reflections are your balance for personalised guidance in Nuria. Your balance is visible in the app. You can earn bonus reflections through optional rewarded ads, buy reflection top-ups, or choose Nuria Noor for 300 bonus reflections.",
    faq4_q: "What are Nuria Serene and Nuria Noor?",
    faq4_a:
      "Nuria Serene and Nuria Noor are optional <strong>one-time in-app purchases</strong> that remove banner, native, and interstitial ads permanently. Nuria Noor also unlocks the Luxury Stone theme and includes 300 bonus reflections. They do not auto-renew.",
    faq5_a:
      "Every new device receives <strong>15 starter reflections</strong> once. You can add more through rewarded ads, reflection top-ups in Settings, or by choosing Nuria Noor.",
    faq7_a:
      "You can keep using Nuria's daily guidance and prayer tools as normal. Watch optional rewarded ads for bonus reflections, buy a top-up in Settings, or choose Nuria Noor for a larger reflection bundle.",
    faq_release_q: "What changed from 4.0.0 to 4.3.0?",
    faq_release_a:
      "4.0.0 brought Luxury Stone (via Nuria Noor), Halqa, Qaida, Sunnat, and Live Haramain. 4.1.0 added Hiba gifts, Nuria Points, and release hardening. 4.3.0 makes Nuria free with ads, introduces Nuria Serene and Nuria Noor one-time purchases, Nuria Journey cloud sync, sharper Quran word-by-word audio, rewarded reflection bonuses, and polish across 100+ languages.",
    faq_stone_q: "How do I get Luxury Stone?",
    faq_stone_a:
      "Luxury Stone is included with <strong>Nuria Noor</strong>, a one-time purchase that also adds 300 bonus reflections and permanent ad-free access. <strong>Nuria Serene</strong> removes ads without Luxury Stone. Preview the palette on this website from the navbar theme selector.",
    faq_features_q: "What are Qaida, Sunnat, Live Haramain, and scholar path?",
    faq_features_a:
      "Nuria Qaida is a guided Quran-reading path with XP, streaks, adult and child modes. Sunnat is a searchable practice library grounded in Sahih al-Bukhari and Sahih Muslim. Live Haramain opens Makkah and Madinah live streams with prayer context. Scholar path helps tune defaults for Quran, tafsir, dhikr, prayer-time settings, and guidance tone around your preferred madhhab path.",
    warn_li3:
      "If you have active recurring billing for Nuria through Apple or Google (legacy accounts only), cancel it in the store <strong>before</strong> deleting your account. Serene and Noor one-time purchases do not need cancellation.",
    warn_li4:
      "Unused reflections and Serene or Noor benefits do not transfer to a new account.",
    warn_li5:
      "Your Quran notes, Halqa participation records, Qaida progress, Sunnat practice choices, ruqyah playback preferences, scholar-path defaults, achievements, and Luxury Stone preferences tied to your account will be removed where they are stored on Nuria systems.",
    s2_li2:
      "<strong>Website theme preference:</strong> The key <code>nuria-site-theme</code> stores whether you chose Classic or Luxury Stone. This stays in your browser and lets every page keep the same theme after navigation or reloads.",
  },
  ar: {
    card2_text:
      "تعرّف كيف تعمل 15 تأملاً ابتدائياً وكيف تُقدَّم التأملات الشخصية داخل نوريا.",
    card3_title: "الفوترة والشراء",
    card3_text:
      "أسئلة حول Nuria Serene أو Nuria Noor، الفوترة، أو الاسترداد؟ أجبنا على الأسئلة الشائعة أدناه.",
    card5_title: "Serene، Noor و Luxury Stone",
    card5_text:
      "مساعدة حول شراء Nuria Serene و Nuria Noor لمرة واحدة، Luxury Stone عبر Noor، أدوات القرآن، القاعدة، السنة، الحلقة، والحرمين.",
    card5_link: "عرض ما تغيّر ←",
    faq2_a:
      "نوريا مجانية للتنزيل والاستخدام مع إعلانات. كل حساب يحصل على التطبيق الكامل — قرآن، أدعية، أدوات صلاة، قاعدة، اسأل نوريا، والمزيد — بأكثر من 100 لغة. يحصل المستخدمون الجدد على <strong>15 تأملاً ابتدائياً</strong>. Nuria Serene أو Nuria Noor شراء لمرة واحدة يزيل الإعلانات؛ Nuria Noor يفتح Luxury Stone و300 تأملاً إضافياً.",
    faq3_a:
      "التأملات هي رصيدك للإرشاد الشخصي في نوريا. يظهر رصيدك في التطبيق. يمكنك كسب تأملات إضافية عبر إعلانات مكافأة، شراء تعبئة، أو اختيار Nuria Noor ل300 تأملاً إضافياً.",
    faq4_q: "ما هما Nuria Serene و Nuria Noor؟",
    faq4_a:
      "Nuria Serene و Nuria Noor شراءان اختياريان <strong>لمرة واحدة</strong> يزيلان إعلانات البانر والمحلية والبين الصفحات للأبد. Nuria Noor يفتح أيضاً مظهر Luxury Stone ويمنح 300 تأملاً إضافياً. لا يتجدد تلقائياً.",
    faq5_a:
      "كل جهاز جديد يحصل على <strong>15 تأملاً ابتدائياً</strong> مرة واحدة. يمكنك إضافة المزيد عبر إعلانات مكافأة، تعبئة في الإعدادات، أو Nuria Noor.",
    faq7_a:
      "يمكنك الاستمرار في الإرشاد اليومي وأدوات الصلاة. شاهد إعلانات مكافأة اختيارية، اشترِ تعبئة في الإعدادات، أو اختر Nuria Noor لحزمة تأملات أكبر.",
    faq_release_q: "ما الذي تغيّر من 4.0.0 إلى 4.3.0؟",
    faq_release_a:
      "4.0.0 أضاف Luxury Stone (عبر Nuria Noor)، الحلقة، القاعدة، السنة، والحرمين. 4.1.0 أضاف هدايا Hiba و Nuria Points وتقوية الإصدار. 4.3.0 يجعل نوريا مجانية مع إعلانات، Nuria Serene و Nuria Noor لمرة واحدة، مزامنة Journey السحابية، صوت قرآن أوضح، مكافآت تأملات، وتحسين 100+ لغة.",
    faq_stone_q: "كيف أحصل على Luxury Stone؟",
    faq_stone_a:
      "Luxury Stone مضمن مع <strong>Nuria Noor</strong> — شراء لمرة واحدة يضيف 300 تأملاً إضافياً ويزيل الإعلانات للأبد. <strong>Nuria Serene</strong> يزيل الإعلانات دون Luxury Stone. عاين الألوان من محدد المظهر في الموقع.",
    faq_features_q: "ما هي القاعدة، السنة، الحرمين، ومسار العلماء؟",
    faq_features_a:
      "قاعدة نوريا مسار قراءة مع XP وسلاسل وأوضاع للأطفال والبالغين. السنة مكتبة ممارسات من صحيح البخاري وصحيح مسلم. الحرمين بث مباشر للحرمين مع سياق الصلاة. مسار العلماء يضبط إعدادات القرآن والتفسير والذكر والصلاة.",
    warn_li3:
      "إذا كان لديك فوترة متكررة نشطة لنوريا عبر Apple أو Google (حسابات قديمة فقط)، ألغِها في المتجر <strong>قبل</strong> حذف الحساب. شراء Serene أو Noor لمرة واحدة لا يحتاج إلغاء.",
    warn_li4: "التأملات غير المستخدمة ومزايا Serene أو Noor لا تنتقل إلى حساب جديد.",
    warn_li5:
      "ملاحظات القرآن، سجلات الحلقة، تقدم القاعدة، اختيارات السنة، تفضيلات الرقية، مسار العلماء، الإنجازات، وتفضيلات Luxury Stone المرتبطة بحسابك ستُزال حيث تُخزَّن على أنظمة نوريا.",
    s2_li2:
      "<strong>تفضيل مظهر الموقع:</strong> المفتاح <code>nuria-site-theme</code> يخزّن Classic أو Luxury Stone في متصفحك.",
  },
  ur: {
    card2_text:
      "15 ابتدائی reflections کیسے کام کرتے ہیں اور ذاتی reflections نوریا میں کیسے ملتے ہیں، جانیں۔",
    card3_title: "Billing اور Purchases",
    card3_text:
      "Nuria Serene، Nuria Noor، billing، یا refunds کے بارے میں سوالات؟ ہم نے عام سوالات کے جوابات نیچے دیے ہیں۔",
    card5_title: "Serene، Noor اور Luxury Stone",
    card5_text:
      "Nuria Serene اور Nuria Noor one-time purchases، Noor کے ذریعے Luxury Stone، Quran tools، Qaida، Sunnat، Halqa، Live Haramain کی مدد۔",
    card5_link: "تبدیلیاں دیکھیں →",
    faq2_a:
      "نوریا اشتہارات کے ساتھ مفت ڈاؤن لوڈ اور استعمال کے لیے ہے۔ ہر اکاؤنٹ مکمل ایپ حاصل کرتا ہے — 100+ زبانوں میں۔ نئے صارفین <strong>15 ابتدائی reflections</strong> حاصل کرتے ہیں۔ Nuria Serene یا Nuria Noor one-time purchases اشتہارات ہمیشہ ہٹاتے ہیں؛ Nuria Noor Luxury Stone اور 300 bonus reflections بھی دیتا ہے۔",
    faq3_a:
      "Reflections نوریا میں ذاتی رہنمائی کے لیے آپ کا balance ہے۔ balance ایپ میں نظر آتا ہے۔ rewarded ads، top-up، یا Nuria Noor سے bonus reflections حاصل کریں۔",
    faq4_q: "Nuria Serene اور Nuria Noor کیا ہیں؟",
    faq4_a:
      "Nuria Serene اور Nuria Noor اختیاری <strong>one-time in-app purchases</strong> ہیں جو banner، native، اور interstitial ads ہمیشہ ہٹاتے ہیں۔ Nuria Noor Luxury Stone بھی کھولتا ہے اور 300 bonus reflections دیتا ہے۔ خود تجدید نہیں ہوتی۔",
    faq5_a:
      "ہر نئے ڈیوائس پر <strong>15 ابتدائی reflections</strong> ایک بار ملتے ہیں۔ rewarded ads، Settings میں top-up، یا Nuria Noor سے مزید حاصل کریں۔",
    faq7_a:
      "روزانہ رہنمائی اور نماز ٹولز حسب معمول استعمال کریں۔ rewarded ads دیکھیں، Settings میں top-up خریدیں، یا Nuria Noor منتخب کریں۔",
    faq_release_q: "4.0.0 سے 4.3.0 میں کیا بدلا؟",
    faq_release_a:
      "4.0.0 میں Luxury Stone (Nuria Noor کے ذریعے)، Halqa، Qaida، Sunnat، اور Live Haramain آئے۔ 4.1.0 میں Hiba gifts، Nuria Points، اور release hardening آئی۔ 4.3.0 نوریا کو ads کے ساتھ مفت کرتا ہے، Nuria Serene اور Nuria Noor one-time purchases، Journey cloud sync، بہتر Quran word-by-word audio، rewarded reflection bonuses، اور 100+ زبانوں میں polish لاتا ہے۔",
    faq_stone_q: "Luxury Stone کیسے حاصل کریں؟",
    faq_stone_a:
      "Luxury Stone <strong>Nuria Noor</strong> کے ساتھ ہے — one-time purchase جو 300 bonus reflections اور permanent ad-free بھی دیتا ہے۔ <strong>Nuria Serene</strong> ads ہٹاتا ہے بغیر Luxury Stone۔ navbar theme selector سے preview کریں۔",
    faq_features_q: "Qaida، Sunnat، Live Haramain، اور scholar path کیا ہیں؟",
    faq_features_a:
      "Nuria Qaida XP اور streaks کے ساتھ قرآن پڑھنے کا راستہ ہے۔ Sunnat صحیح البخاری اور صحیح مسلم پر مبنی ہے۔ Live Haramain Makkah اور Madinah live streams۔ scholar path Quran، tafsir، dhikr، اور prayer settings tune کرتا ہے۔",
    warn_li3:
      "اگر Apple یا Google کے ذریعے نوریا کی active recurring billing ہے (صرف legacy accounts)، اکاؤنٹ حذف کرنے سے <strong>پہلے</strong> store میں cancel کریں۔ Serene اور Noor one-time purchases کو cancel کی ضرورت نہیں۔",
    warn_li4: "غیر استعمال شدہ reflections اور Serene یا Noor benefits نئے اکاؤنٹ میں منتقل نہیں ہوتے۔",
    warn_li5:
      "قرآن notes، Halqa records، Qaida progress، Sunnat choices، ruqyah preferences، scholar-path defaults، achievements، اور Luxury Stone preferences آپ کے اکاؤنٹ سے ہٹا دی جائیں گی۔",
    s2_li2:
      "<strong>Website theme:</strong> <code>nuria-site-theme</code> Classic یا Luxury Stone یاد رکھتا ہے۔",
  },
  id: {
    card2_text:
      "Pelajari cara 15 refleksi awal bekerja dan bagaimana refleksi personal disampaikan di Nuria.",
    card3_title: "Tagihan & Pembelian",
    card3_text:
      "Pertanyaan tentang Nuria Serene, Nuria Noor, tagihan, atau refund? Kami menjawab pertanyaan umum di bawah.",
    card5_title: "Serene, Noor & Luxury Stone",
    card5_text:
      "Bantuan untuk pembelian sekali Nuria Serene dan Nuria Noor, Luxury Stone via Noor, Quran, Qaida, Sunnat, Halqa, Live Haramain.",
    card5_link: "Lihat perubahan →",
    faq2_a:
      "Nuria gratis diunduh dan digunakan dengan iklan. Setiap akun mendapat aplikasi lengkap dalam 100+ bahasa. Pengguna baru mendapat <strong>15 refleksi awal</strong>. Nuria Serene atau Nuria Noor (sekali beli) menghapus iklan; Nuria Noor juga membuka Luxury Stone dan 300 refleksi bonus.",
    faq3_a:
      "Refleksi adalah saldo panduan personal di Nuria. Saldo terlihat di aplikasi. Dapatkan bonus via iklan reward, top-up, atau Nuria Noor untuk 300 refleksi bonus.",
    faq4_q: "Apa itu Nuria Serene dan Nuria Noor?",
    faq4_a:
      "Nuria Serene dan Nuria Noor adalah <strong>pembelian sekali</strong> opsional yang menghapus iklan banner, native, dan interstitial selamanya. Nuria Noor juga membuka Luxury Stone dan 300 refleksi bonus. Tidak diperpanjang otomatis.",
    faq5_a:
      "Setiap perangkat baru mendapat <strong>15 refleksi awal</strong> sekali. Tambahkan via iklan reward, top-up di Pengaturan, atau Nuria Noor.",
    faq7_a:
      "Lanjutkan panduan harian dan alat shalat. Tonton iklan reward, beli top-up di Pengaturan, atau pilih Nuria Noor.",
    faq_release_q: "Apa yang berubah dari 4.0.0 ke 4.3.0?",
    faq_release_a:
      "4.0.0 membawa Luxury Stone (via Nuria Noor), Halqa, Qaida, Sunnat, dan Live Haramain. 4.1.0 menambahkan Hiba gifts, Nuria Points, dan hardening rilis. 4.3.0 membuat Nuria gratis dengan iklan, Nuria Serene dan Nuria Noor sekali beli, sinkronisasi cloud Journey, audio Quran word-by-word lebih tajam, bonus refleksi berhadiah, dan polish 100+ bahasa.",
    faq_stone_q: "Bagaimana mendapatkan Luxury Stone?",
    faq_stone_a:
      "Luxury Stone termasuk dengan <strong>Nuria Noor</strong> — pembelian sekali dengan 300 refleksi bonus dan bebas iklan. <strong>Nuria Serene</strong> menghapus iklan tanpa Luxury Stone. Pratinjau dari pemilih tema navbar.",
    faq_features_q: "Apa itu Qaida, Sunnat, Live Haramain, dan scholar path?",
    faq_features_a:
      "Nuria Qaida jalur baca Quran dengan XP dan streak. Sunnat dari Sahih al-Bukhari dan Sahih Muslim. Live Haramain siaran Makkah dan Madinah. Scholar path menyesuaikan Quran, tafsir, dhikr, dan pengaturan shalat.",
    warn_li3:
      "Jika ada penagihan berulang aktif untuk Nuria via Apple atau Google (akun legacy saja), batalkan di toko <strong>sebelum</strong> menghapus akun. Serene dan Noor sekali beli tidak perlu dibatalkan.",
    warn_li4: "Refleksi tidak terpakai dan manfaat Serene atau Noor tidak pindah ke akun baru.",
    warn_li5:
      "Catatan Quran, Halqa, Qaida, Sunnat, ruqyah, scholar-path, achievements, dan preferensi Luxury Stone pada akun Anda akan dihapus.",
    s2_li2:
      "<strong>Tema situs:</strong> <code>nuria-site-theme</code> menyimpan Classic atau Luxury Stone di browser Anda.",
  },
  fr: {
    card2_text:
      "Découvrez les 15 réflexions de départ et comment les réflexions personnalisées sont proposées dans Nuria.",
    card3_title: "Facturation & achats",
    card3_text:
      "Questions sur Nuria Serene, Nuria Noor, la facturation ou les remboursements ? Voir les FAQ ci-dessous.",
    card5_title: "Serene, Noor & Luxury Stone",
    card5_text:
      "Aide pour les achats uniques Nuria Serene et Nuria Noor, Luxury Stone via Noor, Quran, Qaida, Sunnat, Halqa, Live Haramain.",
    card5_link: "Voir les changements →",
    faq2_a:
      "Nuria est gratuite avec publicités. Chaque compte obtient l'app complète en 100+ langues. Les nouveaux utilisateurs reçoivent <strong>15 réflexions de départ</strong>. Nuria Serene ou Nuria Noor (achat unique) supprime les pubs ; Nuria Noor ouvre Luxury Stone et 300 réflexions bonus.",
    faq3_a:
      "Les réflexions sont votre solde pour la guidance personnalisée. Visible dans l'app. Bonus via pubs récompensées, top-up, ou Nuria Noor pour 300 réflexions bonus.",
    faq4_q: "Que sont Nuria Serene et Nuria Noor ?",
    faq4_a:
      "Nuria Serene et Nuria Noor sont des <strong>achats uniques</strong> optionnels qui suppriment les bannières, native et interstitielles pour toujours. Nuria Noor ouvre Luxury Stone et inclut 300 réflexions bonus. Pas de renouvellement auto.",
    faq5_a:
      "Chaque nouvel appareil reçoit <strong>15 réflexions de départ</strong> une fois. Ajoutez via pubs récompensées, top-up dans Paramètres, ou Nuria Noor.",
    faq7_a:
      "Continuez la guidance quotidienne et les outils de prière. Pubs récompensées, top-up dans Paramètres, ou Nuria Noor.",
    faq_release_q: "Quoi de nouveau entre 4.0.0 et 4.3.0 ?",
    faq_release_a:
      "4.0.0 a apporté Luxury Stone (via Nuria Noor), Halqa, Qaida, Sunnat et Live Haramain. 4.1.0 a ajouté les cadeaux Hiba, Nuria Points et le durcissement release. 4.3.0 rend Nuria gratuit avec pubs, Nuria Serene et Nuria Noor en achat unique, synchro cloud Journey, audio Coran mot à mot plus net, réflexions bonus récompensées et polish dans 100+ langues.",
    faq_stone_q: "Comment obtenir Luxury Stone ?",
    faq_stone_a:
      "Luxury Stone est inclus avec <strong>Nuria Noor</strong> — achat unique avec 300 réflexions bonus et sans pub. <strong>Nuria Serene</strong> supprime les pubs sans Luxury Stone. Prévisualisez via le sélecteur de thème.",
    faq_features_q: "Qaida, Sunnat, Live Haramain et scholar path ?",
    faq_features_a:
      "Nuria Qaida : lecture guidée avec XP et séries. Sunnat depuis Sahih al-Bukhari et Sahih Muslim. Live Haramain : flux Makkah et Madinah. Scholar path ajuste Coran, tafsir, dhikr et prière.",
    warn_li3:
      "Si vous avez une facturation récurrente active via Apple ou Google (comptes legacy uniquement), annulez dans le store <strong>avant</strong> de supprimer le compte. Serene et Noor (achat unique) ne nécessitent pas d'annulation.",
    warn_li4: "Réflexions non utilisées et avantages Serene ou Noor ne sont pas transférés.",
    warn_li5:
      "Notes Coran, Halqa, Qaida, Sunnat, ruqyah, scholar-path, achievements et préférences Luxury Stone liées au compte seront supprimées.",
    s2_li2:
      "<strong>Thème du site :</strong> <code>nuria-site-theme</code> enregistre Classic ou Luxury Stone dans votre navigateur.",
  },
  tr: {
    card2_text:
      "15 başlangıç reflection nasıl çalışır ve kişisel reflections Nuria'da nasıl sunulur, öğrenin.",
    card3_title: "Faturalama ve Satın Almalar",
    card3_text:
      "Nuria Serene, Nuria Noor, faturalama veya geri ödeme hakkında sorular? Sık sorulanları aşağıda yanıtladık.",
    card5_title: "Serene, Noor ve Luxury Stone",
    card5_text:
      "Nuria Serene ve Nuria Noor tek seferlik satın almalar, Noor ile Luxury Stone, Kuran araçları, Qaida, Sunnat, Halqa, Canlı Haramain.",
    card5_link: "Değişiklikleri gör →",
    faq2_a:
      "Nuria reklamlarla ücretsiz indirilir ve kullanılır. Her hesap 100+ dilde tam uygulamayı alır. Yeni kullanıcılar <strong>15 başlangıç reflection</strong> alır. Nuria Serene veya Nuria Noor tek seferlik satın alma reklamları kalıcı kaldırır; Nuria Noor Luxury Stone ve 300 bonus reflection ekler.",
    faq3_a:
      "Reflections, Nuria'da kişisel rehberlik bakiyenizdir. Bakiye uygulamada görünür. Ödüllü reklamlar, top-up veya Nuria Noor ile bonus reflections alın.",
    faq4_q: "Nuria Serene ve Nuria Noor nedir?",
    faq4_a:
      "Nuria Serene ve Nuria Noor, banner, native ve interstitial reklamları kalıcı kaldıran isteğe bağlı <strong>tek seferlik</strong> satın almalardır. Nuria Noor Luxury Stone açar ve 300 bonus reflection verir. Otomatik yenilenmez.",
    faq5_a:
      "Her yeni cihaz bir kez <strong>15 başlangıç reflection</strong> alır. Ödüllü reklamlar, Ayarlarda top-up veya Nuria Noor ile ekleyin.",
    faq7_a:
      "Günlük rehberlik ve namaz araçlarını normal kullanın. Ödüllü reklamlar, Ayarlarda top-up veya Nuria Noor seçin.",
    faq_release_q: "4.0.0'dan 4.3.0'a ne değişti?",
    faq_release_a:
      "4.0.0 Luxury Stone (Nuria Noor ile), Halqa, Qaida, Sunnat ve Canlı Haramain getirdi. 4.1.0 Hiba hediyeleri, Nuria Points ve release hardening ekledi. 4.3.0 Nuria'yı reklamlarla ücretsiz yapar, Nuria Serene ve Nuria Noor tek seferlik satın almaları, Journey bulut senkronu, daha net Kuran kelime sesi, ödüllü reflection bonusları ve 100+ dilde cilayı getirir.",
    faq_stone_q: "Luxury Stone nasıl alınır?",
    faq_stone_a:
      "Luxury Stone <strong>Nuria Noor</strong> ile gelir — 300 bonus reflection ve kalıcı reklamsız tek seferlik satın alma. <strong>Nuria Serene</strong> Luxury Stone olmadan reklamları kaldırır. Navbar tema seçicisinden önizleyin.",
    faq_features_q: "Qaida, Sunnat, Canlı Haramain ve scholar path nedir?",
    faq_features_a:
      "Nuria Qaida XP ve streak ile Kuran okuma yolu. Sunnat Sahih al-Bukhari ve Sahih Muslim kaynaklı. Canlı Haramain Mekke ve Medine yayınları. Scholar path Kuran, tefsir, zikir ve namaz ayarlarını düzenler.",
    warn_li3:
      "Apple veya Google üzerinden aktif yinelenen Nuria faturalandırması varsa (yalnızca legacy hesaplar), hesabı silmeden <strong>önce</strong> mağazada iptal edin. Serene ve Noor tek seferlik satın almalar iptal gerektirmez.",
    warn_li4: "Kullanılmayan reflections ve Serene veya Noor avantajları yeni hesaba taşınmaz.",
    warn_li5:
      "Kuran notları, Halqa, Qaida, Sunnat, ruqyah, scholar-path, achievements ve Luxury Stone tercihleri hesabınızdan kaldırılır.",
    s2_li2:
      "<strong>Site teması:</strong> <code>nuria-site-theme</code> Classic veya Luxury Stone saklar.",
  },
};

const REFERRAL_FIELDS = [
  "subtitle",
  "code_instructions",
  "steps_3",
  "steps_4",
  "trust_note",
  "help_partner_copy",
  "help_4",
  "help_5",
];

const REFERRAL_COPY = {
  ar: {
    subtitle:
      "تؤكد هذه الصفحة كود الإحالة وتساعدك على نسخه. تحدث المشتريات داخل تطبيق نوريا عبر شراء Apple أو Google داخل التطبيق.",
    code_instructions:
      "جرب فتح في نوريا أولاً. إذا ظل المتصفح على الموقع، انسخ الكود وأدخله في التطبيق قبل أول عملية شراء.",
    steps_3: "افتح Nuria Serene أو Nuria Noor في التطبيق.",
    steps_4: "أدخل هذا الكود قبل أول عملية شراء.",
    trust_note:
      "تتولى Apple أو Google المشتريات داخل نوريا. يقتصر دور هذا الموقع على التحقق من الكود وإرشادك إلى التطبيق.",
    help_partner_copy:
      "عند استخدام كود إحالة مجتمعك، يدعم شراءك شراكتهم مع نوريا مباشرة.",
    help_4: "افتح نوريا وأدخل الكود قبل أول عملية شراء.",
    help_5: "يدعم شراءك شراكة مجتمعك مع نوريا.",
  },
  ur: {
    subtitle:
      "یہ صفحہ ریفرل کوڈ کی تصدیق کرتا ہے اور آپ کو اسے کاپی کرنے میں مدد کرتا ہے۔ خریداری Nuria ایپ کے اندر Apple یا Google in-app purchase کے ذریعے ہوتی ہے۔",
    code_instructions:
      "پہلے Nuria میں کھولیں۔ اگر براؤزر ویب سائٹ پر رہے تو کوڈ کاپی کریں اور پہلی خریداری سے پہلے ایپ میں درج کریں۔",
    steps_3: "ایپ میں Nuria Serene یا Nuria Noor کھولیں۔",
    steps_4: "پہلی خریداری سے پہلے یہ کوڈ درج کریں۔",
    trust_note:
      "خریداری Nuria کے اندر Apple یا Google سنبھالتے ہیں۔ یہ ویب سائٹ صرف کوڈ کی تصدیق کرتی ہے اور ایپ میں رہنمائی کرتی ہے۔",
    help_partner_copy:
      "جب آپ اپنی کمیونٹی کا ریفرل کوڈ استعمال کرتے ہیں تو آپ کی خریداری براہ راست نوریہ کے ساتھ ان کی شراکت کی حمایت کرتی ہے۔",
    help_4: "نوریہ کھولیں اور پہلی خریداری سے پہلے کوڈ درج کریں۔",
    help_5: "آپ کی خریداری نوریہ کے ساتھ آپ کی برادری کی شراکت کی حمایت کرتی ہے۔",
  },
  id: {
    subtitle:
      "Halaman ini mengonfirmasi kode rujukan dan membantu Anda menyalinnya. Pembelian terjadi di dalam aplikasi Nuria melalui pembelian dalam aplikasi Apple atau Google.",
    code_instructions:
      "Coba Buka di Nuria terlebih dahulu. Jika browser tetap di situs web, salin kode dan masukkan di aplikasi sebelum pembelian pertama Anda.",
    steps_3: "Buka Nuria Serene atau Nuria Noor di aplikasi.",
    steps_4: "Masukkan kode ini sebelum pembelian pertama Anda.",
    trust_note:
      "Pembelian ditangani oleh Apple atau Google di dalam Nuria. Situs web ini hanya memvalidasi kode dan memandu Anda ke aplikasi.",
    help_partner_copy:
      "Saat Anda menggunakan kode rujukan komunitas Anda, pembelian Anda langsung mendukung kemitraan mereka dengan Nuria.",
    help_4: "Buka Nuria dan masukkan kode sebelum pembelian pertama Anda.",
    help_5: "Pembelian Anda mendukung kemitraan komunitas Anda dengan Nuria.",
  },
  fr: {
    subtitle:
      "Cette page confirme le code de parrainage et vous aide à le copier. Les achats se font dans l'application Nuria via l'achat intégré Apple ou Google.",
    code_instructions:
      "Essayez d'ouvrir dans Nuria d'abord. Si le navigateur reste sur le site, copiez le code et entrez-le dans l'application avant votre premier achat.",
    steps_3: "Ouvrez Nuria Serene ou Nuria Noor dans l'application.",
    steps_4: "Entrez ce code avant votre premier achat.",
    trust_note:
      "Les achats sont gérés par Apple ou Google dans Nuria. Ce site ne valide que le code et vous guide dans l'application.",
    help_partner_copy:
      "Lorsque vous utilisez le code de parrainage de votre communauté, votre achat soutient directement son partenariat avec Nuria.",
    help_4: "Ouvrez Nuria et entrez le code avant votre premier achat.",
    help_5: "Votre achat soutient le partenariat de votre communauté avec Nuria.",
  },
  tr: {
    subtitle:
      "Bu sayfa referral kodunu doğrular ve kopyalamanıza yardımcı olur. Satın alımlar Nuria uygulamasının içinde Apple veya Google uygulama içi satın alma ile gerçekleşir.",
    code_instructions:
      "Önce Nuria'da Aç'ı deneyin. Tarayıcı sitede kalırsa kodu kopyalayın ve ilk satın almadan önce uygulamaya girin.",
    steps_3: "Uygulamada Nuria Serene veya Nuria Noor'u açın.",
    steps_4: "İlk satın almadan önce bu kodu girin.",
    trust_note:
      "Satın alımlar Nuria içinde Apple veya Google tarafından işlenir. Bu site yalnızca kodu doğrular ve uygulamaya yönlendirir.",
    help_partner_copy:
      "Topluluğunuzun referral kodunu kullandığınızda satın alımınız Nuria ile ortaklıklarını doğrudan destekler.",
    help_4: "Nuria'yı açın ve ilk satın almadan önce kodu girin.",
    help_5: "Satın alımınız topluluğunuzun Nuria ortaklığını destekler.",
  },
};

function escapeJs(v) {
  return v.replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}

function getLocaleSection(content, locale) {
  const tStart = content.indexOf("const T = {");
  const start = content.indexOf(`  ${locale}: {`, tStart);
  let end = content.length;
  for (const other of LOCALE_ORDER) {
    if (other === locale) continue;
    const idx = content.indexOf(`  ${other}: {`, start + 1);
    if (idx !== -1 && idx < end) end = idx;
  }
  return { start, end, section: content.slice(start, end) };
}

function setInBlock(section, blockName, field, value) {
  const blockRe = new RegExp(`${blockName}: \\{[\\s\\S]*?${field}: `, "m");
  if (!section.match(blockRe)) throw new Error(`Missing ${blockName}.${field}`);
  const sq = new RegExp(
    `(${blockName}: \\{[\\s\\S]*?${field}: ')(?:\\\\.|[^'])*(')`,
    "m",
  );
  if (section.match(sq)) return section.replace(sq, `$1${escapeJs(value)}$2`);
  const dq = new RegExp(
    `(${blockName}: \\{[\\s\\S]*?${field}: ")(?:\\\\.|[^"])*(")`,
    "m",
  );
  if (section.match(dq)) {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return section.replace(dq, `$1${escaped}$2`);
  }
  throw new Error(`Missing quote style for ${blockName}.${field}`);
}

function ensureSuppExtras(section, c) {
  const fields = [
    ["card5_title", c.card5_title],
    ["card5_text", c.card5_text],
    ["card5_link", c.card5_link],
    ["faq_release_q", c.faq_release_q],
    ["faq_release_a", c.faq_release_a],
    ["faq_stone_q", c.faq_stone_q],
    ["faq_stone_a", c.faq_stone_a],
    ["faq_features_q", c.faq_features_q],
    ["faq_features_a", c.faq_features_a],
  ];
  if (section.includes("card5_title:")) {
    for (const [f, v] of fields) section = setInBlock(section, "supp", f, v);
    return section;
  }
  const block = fields
    .map(([f, v]) => `      ${f}: '${escapeJs(v)}',`)
    .join("\n");
  const next = section.replace(
    /(card4_link: '(?:\\.|[^'])*',)\r?\n(      faq_title:)/,
    `$1\n${block}\n$2`,
  );
  if (next === section) throw new Error("card5 insert failed");
  return next;
}

let content = fs.readFileSync(I18N_PATH, "utf8");

for (const locale of LOCALE_ORDER) {
  const c = COPY[locale];
  const { start, end, section } = getLocaleSection(content, locale);
  let s = section;
  s = setInBlock(s, "supp", "card2_text", c.card2_text);
  s = setInBlock(s, "supp", "card3_title", c.card3_title);
  s = setInBlock(s, "supp", "card3_text", c.card3_text);
  s = setInBlock(s, "supp", "faq2_a", c.faq2_a);
  s = setInBlock(s, "supp", "faq3_a", c.faq3_a);
  s = setInBlock(s, "supp", "faq4_q", c.faq4_q);
  s = setInBlock(s, "supp", "faq4_a", c.faq4_a);
  s = setInBlock(s, "supp", "faq5_a", c.faq5_a);
  s = setInBlock(s, "supp", "faq7_a", c.faq7_a);
  s = ensureSuppExtras(s, c);
  s = setInBlock(s, "del", "warn_li3", c.warn_li3);
  s = setInBlock(s, "del", "warn_li4", c.warn_li4);
  if (s.includes("warn_li5:")) {
    s = setInBlock(s, "del", "warn_li5", c.warn_li5);
  } else {
    s = s.replace(
      /(warn_li2: '(?:\\.|[^'])*',)\r?\n/,
      `$1\n      warn_li5: '${escapeJs(c.warn_li5)}',\n`,
    );
  }
  if (s.includes("cookies_page:") && s.includes("s2_li2:")) {
    s = setInBlock(s, "cookies_page", "s2_li2", c.s2_li2);
  }
  const ref = REFERRAL_COPY[locale];
  if (ref) {
    for (const field of REFERRAL_FIELDS) {
      s = setInBlock(s, "referral", field, ref[field]);
    }
  }
  content = content.slice(0, start) + s + content.slice(end);
}

fs.writeFileSync(I18N_PATH, content, "utf8");
console.log("Synced support/delete/cookie copy in i18n.js");
