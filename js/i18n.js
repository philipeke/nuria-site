'use strict';

// ─── Language metadata ────────────────────────────────────────────────────────
const LANG_META = {
  en: { flag: '🇬🇧', label: 'EN', name: 'English',   dir: 'ltr' },
  ar: { flag: '🇸🇦', label: 'AR', name: 'العربية',   dir: 'rtl' },
  ur: { flag: '🇵🇰', label: 'UR', name: 'اردو',      dir: 'rtl' },
  id: { flag: '🇮🇩', label: 'ID', name: 'Indonesia', dir: 'ltr' },
  fr: { flag: '🇫🇷', label: 'FR', name: 'Français',  dir: 'ltr' },
  tr: { flag: '🇹🇷', label: 'TR', name: 'Türkçe',    dir: 'ltr' },
};

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {

  // ── English ──────────────────────────────────────────────────────────────────
  en: {
    nav: {
      about: 'About', daily: 'Daily', categories: 'Categories',
      plans: 'Plans', support: 'Support', download: 'Download',
    },
    hero: {
      subtitle: 'Daily Sunni Islamic Guidance, Prayer & Reflection',
      desc: 'Begin each day in the light of faith. Receive heartfelt prayers, timeless wisdom, and meaningful guidance rooted in the beautiful tradition of Sunni Islam.',
      stat_categories: 'Categories', stat_days: 'Days of Guidance', stat_barakah: 'Barakah',
      appstore_small: 'Download on the', appstore: 'App Store',
      googleplay_small: 'Get it on', googleplay: 'Google Play',
      discover: 'Discover Nuria',
    },
    quote1: {
      text: '"And whoever fears Allah — He will make for him a way out."',
      cite: 'Quran · At-Talaq 65:2',
    },
    about: {
      label: 'About Nuria',
      title: 'A Companion of <em>Light</em> for Every Soul',
      subtitle: 'Nuria — meaning <em>luminous</em> — is designed to bring the timeless teachings of Sunni Islam into the rhythm of your daily life. Authentic prayers, beautiful wisdom, and guidance rooted in the Sunnah, beautifully delivered to your pocket.',
      f1_title: 'Daily Prayers',
      f1_text: 'Begin and end each day with beautifully crafted supplications aligned with Fajr and Isha, grounded in the Sunnah of the Prophet \u32de.',
      f2_title: 'Daily Scripture',
      f2_text: 'Receive a meaningful verse from the Holy Quran or the Hadith each day, with deep reflection and spiritual context to enrich your understanding.',
      f3_title: 'Daily Role Models',
      f3_text: 'Discover the luminaries of Sunni Islam — from the noble Sahabah to the great Imams — whose lives illuminate the straight path.',
      f4_title: 'Personal Reflections',
      f4_text: 'Choose from 15 spiritual categories and receive deeply personal guidance crafted with care and intention — a private companion for the soul.',
      f5_title: 'Authentic Sunni Perspective',
      f5_text: 'Every word is rooted in authentic Sunni scholarship, the Quran, and the Hadith. Traditional wisdom delivered with warmth, clarity, and care.',
      f6_title: 'Spiritual Growth',
      f6_text: 'Build consistent habits of dhikr, reflection, and closeness to Allah. Nuria grows with you on your journey toward the best version of yourself.',
      f7_title: 'Ask Nuria Anything',
      f7_text: 'Have a question about your deen, a hardship on your heart, or something you\'ve always wondered? Ask freely — Nuria answers with wisdom rooted in the Sunni tradition. One reflection, one answer, directly for you.',
      f8_title: 'Qibla Compass',
      f8_text: 'Wherever you are in the world, face the sacred direction with confidence. Nuria\'s built-in Qibla compass points you toward the Kaaba in Mecca — always accurate, always available.',
      f9_title: 'Daily Prayer Times',
      f9_text: 'Never miss Salah. Nuria displays the precise times for all five daily prayers — Fajr, Dhuhr, Asr, Maghrib, and Isha — calculated for your exact location every single day.',
    },
    daily: {
      label: 'What Awaits You Each Day',
      title: 'Every Morning, a New <em>Blessing</em>',
      d1_title: 'Daily Scripture',
      d1_text: 'A carefully chosen verse from the Holy Quran or the Hadith of the Prophet \u32de, accompanied by reflection and context to deepen your connection with the Divine Word.',
      d2_title: 'Daily Role Model',
      d2_text: 'Meet a luminary of Sunni Islam — a Companion, a great Imam, a scholar of the heart. Each day, a new light from our tradition to inspire your own journey.',
      d3_title: 'Personal Reflection',
      d3_text: 'Your daily spiritual companion. A reflection crafted with wisdom and intention, speaking directly to where you are on your path — every single day.',
    },
    quote2: {
      text: '"Indeed, Allah is beautiful and He loves beauty."',
      cite: 'Sahih Muslim \u00b7 91',
    },
    categories: {
      label: '15 Reflection Categories',
      title: 'Every Dimension of Your <em>Soul</em>',
      subtitle: 'Choose the aspect of your life where your heart seeks guidance. Receive wisdom and reflection crafted with deep care for your spiritual need.',
      c1: 'Daily Guidance',   c2: 'Iman & Trust',         c3: 'Prayer Reflection',
      c4: 'Patience & Hope',  c5: 'Seek Forgiveness',     c6: 'Mercy & Compassion',
      c7: 'Faith & Strength', c8: 'Grateful Heart',       c9: 'Life Purpose',
      c10: 'Family Ties',     c11: 'Inner Peace',          c12: 'Prophet Wisdom',
      c13: 'Good Character',  c14: 'Resist Temptation',   c15: 'Evening Dhikr',
    },
    newfeatures: {
      label: 'New in Nuria',
      title: 'More Than Reflection — <em>Complete</em> Islamic Companion',
      subtitle: 'Nuria has grown. Alongside your daily blessings and personal reflections, three powerful new tools are now at your fingertips.',
      ask_tag: '1 Reflection', ask_title: 'Ask Nuria Anything',
      ask_text: 'A question about your deen. A hardship weighing on your heart. Something you\'ve always wondered about in Islam. Ask it. Nuria responds with a thoughtful, personalised answer rooted in the authentic Sunni tradition — in the same spirit as your reflections.',
      ask_li1: 'Ask about Quran, Hadith, or Islamic rulings',
      ask_li2: 'Seek guidance on personal struggles',
      ask_li3: 'Get answers in your own language',
      qibla_tag: 'Free \u00b7 Always On', qibla_title: 'Qibla Direction',
      qibla_text: 'Wherever you find yourself — at home, travelling, or somewhere unfamiliar — face the sacred direction with certainty. Nuria\'s Qibla compass points toward the Holy Kaaba using your device\'s compass, precise and always available.',
      qibla_li1: 'Real-time compass toward the Kaaba',
      qibla_li2: 'Works anywhere in the world',
      qibla_li3: 'No setup required',
      prayer_tag: 'Free \u00b7 Daily', prayer_title: '5 Daily Prayer Times',
      prayer_text: 'Salah is the pillar of Islam. Never miss a prayer. Nuria calculates and displays the precise times for all five daily prayers based on your location — Fajr, Dhuhr, Asr, Maghrib, and Isha — refreshed every day, perfectly timed for where you are.',
      prayer_li1: 'Fajr \u00b7 Dhuhr \u00b7 Asr \u00b7 Maghrib \u00b7 Isha',
      prayer_li2: 'Location-accurate prayer times',
      prayer_li3: 'Displayed clearly every day',
    },
    pricing: {
      label: 'Choose Your Path',
      title: 'Begin with <em>Standard</em>, Flourish with <em>Barakah</em>',
      subtitle: 'Every Muslim deserves access to spiritual guidance. Start free, and when you are ready — unlock the full abundance of Nuria.',
      std_tier: 'Standard',
      std_price: 'Included with the app \u00b7 150 reflections',
      std_desc: 'When you download Nuria you receive 150 reflections to use across your chosen categories — your first steps on the illuminated path.',
      std_f1: '\u2713\u00a0\u00a0Daily Scripture',           std_f2: '\u2713\u00a0\u00a0Daily Role Model',
      std_f3: '\u2713\u00a0\u00a0Daily Personal Reflection', std_f4: '\u2713\u00a0\u00a0Qibla compass',
      std_f5: '\u2713\u00a0\u00a05 daily prayer times',      std_f6: '\u2713\u00a0\u00a0150 reflections included',
      std_f7: '\u2713\u00a0\u00a0Ask Nuria Anything (uses reflections)',
      std_f8: '\u2713\u00a0\u00a0Access to select categories',
      std_f9: '\u2717\u00a0\u00a0All 15 reflection categories',
      std_f10: '\u2717\u00a0\u00a0300 additional Barakah reflections',
      std_f11: '\u2717\u00a0\u00a0Reflection top-ups & upcoming features',
      std_btn: 'Download Nuria',
      bar_badge: 'Most Beloved',
      bar_price: '+300 reflections \u00b7 Top-ups available',
      bar_desc: 'Purchase Barakah and receive 300 additional reflections on top of your Standard allowance — plus top-ups whenever you need more.',
      bar_f1: '\u2713\u00a0\u00a0Everything in Standard',
      bar_f2: '\u2713\u00a0\u00a0300 additional reflections',
      bar_f3: '\u2713\u00a0\u00a0All 15 reflection categories unlocked',
      bar_f4: '\u2713\u00a0\u00a0Ask Nuria Anything — unlimited by balance',
      bar_f5: '\u2713\u00a0\u00a0Buy reflection top-ups anytime',
      bar_f6: '\u2713\u00a0\u00a0Early access to new categories',
      bar_f7: '\u2713\u00a0\u00a0Priority upcoming features',
      bar_btn: 'Receive Barakah',
    },
    download: {
      label: 'Available Now',
      title: 'Carry the Light of Islam<br><em>with You Today</em>',
      desc: 'Download Nuria and begin your daily journey of faith, reflection, and closeness to Allah — in your pocket, in your heart, every morning you wake.',
      appstore_small: 'Download on the', appstore: 'App Store',
      googleplay_small: 'Get it on', googleplay: 'Google Play',
    },
    footer: {
      tagline: 'Light for the Muslim soul — every single day.',
      col1: 'App', home: 'Home', about: 'About', plans: 'Plans', dl: 'Download',
      col2: 'Legal', privacy: 'Privacy Policy', terms: 'Terms of Service', delete: 'Delete Account',
      col3: 'Help', support_center: 'Support Center', contact: 'Contact Us',
      copy: '\u00a9 2026 OakDev & AI AB. All rights reserved.',
    },
    pages: {
      privacy_label: 'Legal', privacy_title: 'Privacy Policy',
      privacy_subtitle: 'We respect your privacy and handle your personal data with honesty, care, and full transparency — in accordance with GDPR and Swedish law.',
      terms_label: 'Legal', terms_title: 'Terms of Service',
      terms_subtitle: 'Please read these terms carefully before using Nuria. By downloading or using the App, you agree to be bound by them.',
      support_label: 'We\'re Here to Help', support_title: 'Support Center',
      support_subtitle: 'Find answers to your questions or reach out to us directly. We\'re committed to your experience with Nuria.',
      delete_label: 'Account', delete_title: 'Delete Your Account',
      delete_subtitle: 'We are sorry to see you go. You may request permanent deletion of your Nuria account and all associated data at any time.',
      legal_notice: '',
    },
  },

  // ── Arabic ────────────────────────────────────────────────────────────────────
  ar: {
    nav: {
      about: 'عن نوريا', daily: 'يومي', categories: 'الفئات',
      plans: 'الباقات', support: 'الدعم', download: 'تحميل',
    },
    hero: {
      subtitle: 'إرشاد سني يومي — صلاة وتأمل',
      desc: 'ابدأ كل يوم في نور الإيمان. تلقَّ أدعية من القلب، وحِكماً خالدة، وإرشاداً هادفاً متجذراً في التراث الإسلامي السني الجميل.',
      stat_categories: 'فئة', stat_days: 'يوم من الإرشاد', stat_barakah: 'بركة',
      appstore_small: 'حمِّل من', appstore: 'App Store',
      googleplay_small: 'احصل عليه من', googleplay: 'Google Play',
      discover: 'اكتشف نوريا',
    },
    quote1: {
      text: '«وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا»',
      cite: 'القرآن الكريم · الطلاق 65:2',
    },
    about: {
      label: 'عن نوريا',
      title: 'رفيق من <em>النور</em> لكل روح',
      subtitle: 'نوريا — ومعناها <em>مضيئة</em> — صُمِّمت لإدخال التعاليم الخالدة للإسلام السني في إيقاع حياتك اليومية. أدعية أصيلة، وحِكم جميلة، وإرشاد مستمد من السنة، يُوصَل بجمال إلى جيبك.',
      f1_title: 'أدعية يومية',
      f1_text: 'ابدأ كل يوم واختمه بأدعية جميلة متوافقة مع صلاتَي الفجر والعشاء، مستمدة من سنة النبي ﷺ.',
      f2_title: 'آيات يومية',
      f2_text: 'احصل كل يوم على آية ذات معنى من القرآن الكريم أو الحديث الشريف، مع تأمل وسياق روحي يثري فهمك.',
      f3_title: 'قدوات يومية',
      f3_text: 'اكتشف أعلام الإسلام السني — من الصحابة الكرام إلى الأئمة العظام — الذين تُضيء حياتهم الصراط المستقيم.',
      f4_title: 'تأملات شخصية',
      f4_text: 'اختر من 15 فئة روحية واحصل على إرشاد شخصي عميق مصنوع بعناية — رفيق خاص للروح.',
      f5_title: 'منظور سني أصيل',
      f5_text: 'كل كلمة متجذرة في المنهج السني الأصيل والقرآن الكريم والحديث الشريف. حِكمة تراثية بدفء ووضوح وعناية.',
      f6_title: 'النمو الروحي',
      f6_text: 'بنِ عادات ثابتة من الذكر والتأمل والقرب من الله. تنمو نوريا معك في رحلتك نحو أفضل نسخة منك.',
      f7_title: 'اسأل نوريا أي شيء',
      f7_text: 'لديك سؤال عن دينك، أو ضيق يثقل قلبك، أو شيء تتساءل عنه دائماً؟ اسأل بحرية — نوريا تجيبك بحكمة مستمدة من التراث السني.',
      f8_title: 'بوصلة القبلة',
      f8_text: 'أينما كنت في العالم، استقبل الاتجاه المقدس بثقة. بوصلة القبلة في نوريا تشير نحو الكعبة المشرفة في مكة المكرمة.',
      f9_title: 'أوقات الصلوات الخمس',
      f9_text: 'لا تفوِّت صلاة. تعرض نوريا الأوقات الدقيقة للصلوات الخمس — الفجر والظهر والعصر والمغرب والعشاء — محسوبة لموقعك الحالي كل يوم.',
    },
    daily: {
      label: 'ما ينتظرك كل يوم',
      title: 'كل صباح، بركة <em>جديدة</em>',
      d1_title: 'آية يومية',
      d1_text: 'آية مختارة بعناية من القرآن الكريم أو حديث النبي ﷺ، مصحوبة بتأمل وسياق يعمِّقان صلتك بالكلمة الإلهية.',
      d2_title: 'قدوة اليوم',
      d2_text: 'تعرف على عَلَم من أعلام الإسلام السني — صحابياً جليلاً أو إماماً عظيماً أو عالِماً للقلوب. كل يوم نور جديد من تراثنا.',
      d3_title: 'تأمل شخصي',
      d3_text: 'رفيقك الروحي اليومي. تأمل مصنوع بحكمة وقصد، يتحدث مباشرة إلى مرحلتك على دربك.',
    },
    quote2: {
      text: '«إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ»',
      cite: 'صحيح مسلم · 91',
    },
    categories: {
      label: '١٥ فئة تأمل',
      title: 'كل أبعاد <em>روحك</em>',
      subtitle: 'اختر جانب حياتك الذي يبحث فيه قلبك عن الإرشاد. تلقَّ حكمة وتأملاً مصنوعاً بعناية لاحتياجك الروحي.',
      c1: 'هداية يومية',    c2: 'إيمان وتوكل',       c3: 'تأمل الصلاة',
      c4: 'صبر وأمل',       c5: 'طلب المغفرة',        c6: 'رحمة وشفقة',
      c7: 'قوة الإيمان',    c8: 'قلب شاكر',           c9: 'هدف الحياة',
      c10: 'صلة الرحم',     c11: 'سكينة القلب',       c12: 'حكمة الأنبياء',
      c13: 'حسن الخُلق',    c14: 'مقاومة الإغراء',    c15: 'ذكر المساء',
    },
    newfeatures: {
      label: 'جديد في نوريا',
      title: 'أكثر من مجرد تأمل — رفيق إسلامي <em>متكامل</em>',
      subtitle: 'نوريا نمت. إلى جانب بركاتك اليومية وتأملاتك الشخصية، ثلاثة أدوات جديدة قوية بين يديك الآن.',
      ask_tag: 'تأمل واحد', ask_title: 'اسأل نوريا أي شيء',
      ask_text: 'سؤال عن دينك. ضيق يثقل قلبك. شيء تتساءل عنه دائماً في الإسلام. اسأله. نوريا تجيبك بإجابة شخصية متأنية مستمدة من التراث السني الأصيل.',
      ask_li1: 'اسأل عن القرآن والحديث والأحكام الشرعية',
      ask_li2: 'اطلب التوجيه في مشاكلك الشخصية',
      ask_li3: 'احصل على إجابات بلغتك',
      qibla_tag: 'مجاني · دائماً', qibla_title: 'اتجاه القبلة',
      qibla_text: 'أينما وجدت نفسك — في المنزل أو في السفر — استقبل الاتجاه المقدس بيقين. بوصلة القبلة في نوريا تشير نحو الكعبة المشرفة.',
      qibla_li1: 'بوصلة آنية نحو الكعبة',
      qibla_li2: 'تعمل في أي مكان في العالم',
      qibla_li3: 'لا إعداد مطلوب',
      prayer_tag: 'مجاني · يومي', prayer_title: 'أوقات الصلوات الخمس',
      prayer_text: 'الصلاة عمود الإسلام. لا تفوِّت صلاة. نوريا تحسب وتعرض الأوقات الدقيقة للصلوات الخمس بناءً على موقعك — الفجر والظهر والعصر والمغرب والعشاء.',
      prayer_li1: 'الفجر · الظهر · العصر · المغرب · العشاء',
      prayer_li2: 'أوقات دقيقة حسب موقعك',
      prayer_li3: 'معروضة بوضوح كل يوم',
    },
    pricing: {
      label: 'اختر مسارك',
      title: 'ابدأ بـ<em>المعياري</em>، ازدهر مع <em>البركة</em>',
      subtitle: 'كل مسلم يستحق الوصول إلى الإرشاد الروحي. ابدأ مجاناً، وحين تكون مستعداً — افتح وفرة نوريا الكاملة.',
      std_tier: 'المعياري',
      std_price: 'مشمول مع التطبيق · ١٥٠ تأملاً',
      std_desc: 'عند تنزيل نوريا تحصل على ١٥٠ تأملاً لاستخدامها عبر الفئات التي تختارها — خطواتك الأولى على الدرب المنير.',
      std_f1: '✓  القرآن والحديث اليومي',     std_f2: '✓  قدوة اليوم',
      std_f3: '✓  التأمل الشخصي اليومي',       std_f4: '✓  بوصلة القبلة',
      std_f5: '✓  أوقات الصلوات الخمس',        std_f6: '✓  ١٥٠ تأملاً مشمولاً',
      std_f7: '✓  اسأل نوريا (يستهلك تأملاً)', std_f8: '✓  الوصول لفئات مختارة',
      std_f9: '✗  جميع الفئات الـ١٥',
      std_f10: '✗  ٣٠٠ تأمل إضافي من البركة',
      std_f11: '✗  تعبئة التأملات وما يأتي',
      std_btn: 'تحميل نوريا',
      bar_badge: 'الأكثر حباً',
      bar_price: '+٣٠٠ تأمل · متاح التعبئة',
      bar_desc: 'اشترِ البركة واحصل على ٣٠٠ تأمل إضافي فوق رصيدك المعياري — مع إمكانية التعبئة متى احتجت.',
      bar_f1: '✓  كل ما في المعياري',
      bar_f2: '✓  ٣٠٠ تأمل إضافي',
      bar_f3: '✓  جميع فئات التأمل الـ١٥',
      bar_f4: '✓  اسأل نوريا بلا حدود',
      bar_f5: '✓  تعبئة التأملات في أي وقت',
      bar_f6: '✓  وصول مبكر لفئات جديدة',
      bar_f7: '✓  أولوية المزايا القادمة',
      bar_btn: 'احصل على البركة',
    },
    download: {
      label: 'متاح الآن',
      title: 'احمل نور الإسلام<br><em>معك اليوم</em>',
      desc: 'نزِّل نوريا وابدأ رحلتك اليومية من الإيمان والتأمل والقرب من الله — في جيبك، في قلبك، كل صباح تستيقظ.',
      appstore_small: 'حمِّل من', appstore: 'App Store',
      googleplay_small: 'احصل عليه من', googleplay: 'Google Play',
    },
    footer: {
      tagline: 'نور للروح المسلمة — كل يوم.',
      col1: 'التطبيق', home: 'الرئيسية', about: 'عن نوريا', plans: 'الباقات', dl: 'تحميل',
      col2: 'قانوني', privacy: 'سياسة الخصوصية', terms: 'شروط الخدمة', delete: 'حذف الحساب',
      col3: 'مساعدة', support_center: 'مركز الدعم', contact: 'اتصل بنا',
      copy: '© 2026 OakDev & AI AB. جميع الحقوق محفوظة.',
    },
    pages: {
      privacy_label: 'قانوني', privacy_title: 'سياسة الخصوصية',
      privacy_subtitle: 'نحترم خصوصيتك ونتعامل مع بياناتك الشخصية بصدق وعناية وشفافية تامة.',
      terms_label: 'قانوني', terms_title: 'شروط الخدمة',
      terms_subtitle: 'يرجى قراءة هذه الشروط بعناية قبل استخدام نوريا. بتنزيل التطبيق أو استخدامه، فأنت توافق على الالتزام بها.',
      support_label: 'نحن هنا للمساعدة', support_title: 'مركز الدعم',
      support_subtitle: 'اعثر على إجابات لأسئلتك أو تواصل معنا مباشرة. نحن ملتزمون بتجربتك مع نوريا.',
      delete_label: 'الحساب', delete_title: 'حذف حسابك',
      delete_subtitle: 'يؤسفنا رحيلك. يمكنك طلب الحذف الدائم لحساب نوريا وجميع بياناتك المرتبطة به في أي وقت.',
      legal_notice: 'ملاحظة: هذه الوثيقة متاحة باللغة الإنجليزية فقط بوصفها النسخة الملزمة قانونياً.',
    },
  },

  // ── Urdu ─────────────────────────────────────────────────────────────────────
  ur: {
    nav: {
      about: 'ہمارے بارے میں', daily: 'روزانہ', categories: 'زمرے',
      plans: 'منصوبے', support: 'مدد', download: 'ڈاؤن لوڈ',
    },
    hero: {
      subtitle: 'روزانہ سنی اسلامی رہنمائی، نماز اور مراقبہ',
      desc: 'ہر دن ایمان کی روشنی میں شروع کریں۔ سنی اسلام کی خوبصورت روایت سے جڑی دل سے نکلی دعائیں، لازوال حکمت اور بامعنی رہنمائی حاصل کریں۔',
      stat_categories: 'زمرے', stat_days: 'روزانہ رہنمائی', stat_barakah: 'برکت',
      appstore_small: 'ڈاؤن لوڈ کریں', appstore: 'App Store',
      googleplay_small: 'حاصل کریں', googleplay: 'Google Play',
      discover: 'نوریا دریافت کریں',
    },
    quote1: {
      text: '«اور جو اللہ سے ڈرتا ہے، اللہ اس کے لیے راستہ نکال دیتا ہے۔»',
      cite: 'قرآن · الطلاق 65:2',
    },
    about: {
      label: 'نوریا کے بارے میں',
      title: 'ہر روح کے لیے <em>نور</em> کا ساتھی',
      subtitle: 'نوریا — جس کا مطلب <em>روشن</em> ہے — سنی اسلام کی لازوال تعلیمات کو آپ کی روزمرہ زندگی کی تال میں لانے کے لیے بنائی گئی ہے۔',
      f1_title: 'روزانہ دعائیں',
      f1_text: 'فجر اور عشاء کے ساتھ ہم آہنگ خوبصورت دعاؤں کے ساتھ ہر دن شروع اور ختم کریں، جو نبی ﷺ کی سنت پر مبنی ہیں۔',
      f2_title: 'روزانہ آیت',
      f2_text: 'قرآن پاک یا حدیث سے روزانہ ایک بامعنی آیت حاصل کریں، جو آپ کی سمجھ کو گہرا کرنے کے لیے تأمل اور سیاق کے ساتھ پیش کی جاتی ہے۔',
      f3_title: 'روزانہ رول ماڈل',
      f3_text: 'سنی اسلام کے روشن ستاروں کو دریافت کریں — نیک صحابہ سے لے کر عظیم اماموں تک — جن کی زندگیاں سیدھے راستے کو روشن کرتی ہیں۔',
      f4_title: 'ذاتی مراقبات',
      f4_text: '15 روحانی زمروں میں سے انتخاب کریں اور عنایت و ارادے سے تیار کردہ ذاتی رہنمائی حاصل کریں۔',
      f5_title: 'مستند سنی نقطہ نظر',
      f5_text: 'ہر لفظ مستند سنی علمیت، قرآن اور حدیث میں جڑا ہوا ہے۔ گرمجوشی، وضاحت اور عنایت کے ساتھ پیش کردہ روایتی حکمت۔',
      f6_title: 'روحانی ترقی',
      f6_text: 'ذکر، مراقبہ اور اللہ سے قربت کی مستقل عادات بنائیں۔ نوریا آپ کے ساتھ اپنے بہترین ورژن کی طرف سفر میں بڑھتی ہے۔',
      f7_title: 'نوریا سے کچھ بھی پوچھیں',
      f7_text: 'اپنے دین کے بارے میں سوال ہو، دل پر بوجھ ہو، یا کچھ جاننا چاہتے ہوں؟ آزادی سے پوچھیں — نوریا سنی روایت میں جڑی حکمت سے جواب دیتی ہے۔',
      f8_title: 'قبلہ کمپاس',
      f8_text: 'دنیا میں جہاں بھی ہوں، یقین کے ساتھ مقدس سمت کا رخ کریں۔ نوریا کا بلٹ ان قبلہ کمپاس مکہ مکرمہ میں کعبہ کی طرف اشارہ کرتا ہے۔',
      f9_title: '5 وقت کی نماز کے اوقات',
      f9_text: 'کوئی نماز نہ چھوٹے۔ نوریا ہر روز آپ کے مقام کے مطابق پانچوں نمازوں کے درست اوقات ظاہر کرتی ہے — فجر، ظہر، عصر، مغرب اور عشاء۔',
    },
    daily: {
      label: 'ہر روز آپ کا کیا انتظار ہے',
      title: 'ہر صبح ایک نئی <em>برکت</em>',
      d1_title: 'روزانہ آیت',
      d1_text: 'قرآن پاک یا نبی ﷺ کی حدیث سے احتیاط سے منتخب کردہ آیت، جو الہٰی کلام سے آپ کا تعلق گہرا کرنے کے لیے تأمل اور سیاق کے ساتھ پیش کی جاتی ہے۔',
      d2_title: 'روزانہ رول ماڈل',
      d2_text: 'سنی اسلام کے ایک روشن ستارے سے ملیں — صحابی، عظیم امام، یا دل کے عالم۔ ہر روز ہماری روایت کی ایک نئی روشنی۔',
      d3_title: 'ذاتی مراقبہ',
      d3_text: 'آپ کا روزانہ روحانی ساتھی۔ حکمت اور ارادے سے تیار کردہ مراقبہ، جو آپ کے راستے پر آپ کی موجودہ جگہ سے براہ راست بات کرتا ہے۔',
    },
    quote2: {
      text: '«بے شک اللہ خوبصورت ہے اور خوبصورتی کو پسند کرتا ہے۔»',
      cite: 'صحیح مسلم · 91',
    },
    categories: {
      label: '15 مراقبہ زمرے',
      title: 'آپ کی <em>روح</em> کا ہر پہلو',
      subtitle: 'اپنی زندگی کا وہ پہلو منتخب کریں جہاں آپ کا دل رہنمائی ڈھونڈتا ہے۔ آپ کی روحانی ضرورت کے لیے عنایت سے تیار کردہ حکمت اور مراقبہ حاصل کریں۔',
      c1: 'روزانہ رہنمائی',   c2: 'ایمان اور توکل',     c3: 'نماز مراقبہ',
      c4: 'صبر اور امید',      c5: 'مغفرت طلبی',         c6: 'رحمت اور شفقت',
      c7: 'ایمان اور طاقت',   c8: 'شکرگزار دل',         c9: 'زندگی کا مقصد',
      c10: 'خاندانی رشتے',    c11: 'قلبی سکون',          c12: 'انبیاء کی حکمت',
      c13: 'اچھا اخلاق',      c14: 'فتنہ سے بچاؤ',       c15: 'شام کا ذکر',
    },
    newfeatures: {
      label: 'نوریا میں نیا',
      title: 'صرف مراقبہ نہیں — <em>مکمل</em> اسلامی ساتھی',
      subtitle: 'نوریا نے ترقی کی ہے۔ روزانہ برکات اور ذاتی مراقبات کے ساتھ، تین طاقتور نئے ٹولز اب آپ کی انگلیوں پر ہیں۔',
      ask_tag: '1 مراقبہ', ask_title: 'نوریا سے کچھ بھی پوچھیں',
      ask_text: 'اپنے دین کے بارے میں سوال۔ دل پر بوجھ۔ کچھ جو آپ اسلام کے بارے میں ہمیشہ جاننا چاہتے تھے۔ پوچھیں۔ نوریا مستند سنی روایت میں جڑی سوچے سمجھے جواب کے ساتھ جواب دیتی ہے۔',
      ask_li1: 'قرآن، حدیث یا اسلامی احکام کے بارے میں پوچھیں',
      ask_li2: 'ذاتی مشکلات میں رہنمائی طلب کریں',
      ask_li3: 'اپنی زبان میں جوابات حاصل کریں',
      qibla_tag: 'مفت · ہمیشہ', qibla_title: 'قبلہ کی سمت',
      qibla_text: 'جہاں بھی ہوں — گھر میں، سفر میں — یقین کے ساتھ مقدس سمت کا رخ کریں۔ نوریا کا قبلہ کمپاس آپ کے آلے کے کمپاس سے خانہ کعبہ کی طرف اشارہ کرتا ہے۔',
      qibla_li1: 'کعبہ کی طرف ریئل ٹائم کمپاس',
      qibla_li2: 'دنیا میں کہیں بھی کام کرتا ہے',
      qibla_li3: 'کوئی سیٹ اپ درکار نہیں',
      prayer_tag: 'مفت · روزانہ', prayer_title: '5 وقت کی نماز',
      prayer_text: 'نماز اسلام کا ستون ہے۔ کوئی نماز نہ چھوٹے۔ نوریا آپ کے مقام کی بنیاد پر پانچوں نمازوں کے درست اوقات حساب کرتی اور ظاہر کرتی ہے۔',
      prayer_li1: 'فجر · ظہر · عصر · مغرب · عشاء',
      prayer_li2: 'مقام کے مطابق درست اوقات',
      prayer_li3: 'ہر روز واضح طور پر ظاہر',
    },
    pricing: {
      label: 'اپنا راستہ چنیں',
      title: '<em>معیاری</em> سے شروع کریں، <em>برکت</em> سے پھلیں پھولیں',
      subtitle: 'ہر مسلمان روحانی رہنمائی کا حقدار ہے۔ مفت شروع کریں، اور جب تیار ہوں — نوریا کی مکمل فراوانی کو کھولیں۔',
      std_tier: 'معیاری',
      std_price: 'ایپ کے ساتھ شامل · 150 مراقبات',
      std_desc: 'نوریا ڈاؤن لوڈ کرنے پر آپ کو 150 مراقبات ملتے ہیں — روشن راستے پر آپ کے پہلے قدم۔',
      std_f1: '✓  روزانہ آیت',        std_f2: '✓  روزانہ رول ماڈل',
      std_f3: '✓  روزانہ ذاتی مراقبہ', std_f4: '✓  قبلہ کمپاس',
      std_f5: '✓  5 وقت کی نماز',     std_f6: '✓  150 مراقبات شامل',
      std_f7: '✓  نوریا سے پوچھیں (مراقبہ استعمال ہوتا ہے)',
      std_f8: '✓  منتخب زمروں تک رسائی',
      std_f9: '✗  تمام 15 مراقبہ زمرے',
      std_f10: '✗  300 اضافی برکت مراقبات',
      std_f11: '✗  مراقبہ ٹاپ اپ اور آنے والی خصوصیات',
      std_btn: 'نوریا ڈاؤن لوڈ کریں',
      bar_badge: 'سب سے پیارا',
      bar_price: '+300 مراقبات · ٹاپ اپ دستیاب',
      bar_desc: 'برکت خریدیں اور اپنے معیاری الاؤنس کے علاوہ 300 اضافی مراقبات حاصل کریں — اور جب ضرورت ہو ٹاپ اپ کریں۔',
      bar_f1: '✓  معیاری میں سب کچھ',
      bar_f2: '✓  300 اضافی مراقبات',
      bar_f3: '✓  تمام 15 مراقبہ زمرے کھلے',
      bar_f4: '✓  نوریا سے بلا حد پوچھیں',
      bar_f5: '✓  کسی بھی وقت مراقبہ ٹاپ اپ',
      bar_f6: '✓  نئے زمروں تک جلد رسائی',
      bar_f7: '✓  آنے والی خصوصیات میں ترجیح',
      bar_btn: 'برکت حاصل کریں',
    },
    download: {
      label: 'ابھی دستیاب',
      title: 'اسلام کی روشنی اپنے ساتھ<br><em>آج ہی لے جائیں</em>',
      desc: 'نوریا ڈاؤن لوڈ کریں اور ایمان، مراقبہ اور اللہ سے قربت کا اپنا روزانہ سفر شروع کریں — اپنی جیب میں، اپنے دل میں، ہر صبح جب آپ جاگیں۔',
      appstore_small: 'ڈاؤن لوڈ کریں', appstore: 'App Store',
      googleplay_small: 'حاصل کریں', googleplay: 'Google Play',
    },
    footer: {
      tagline: 'مسلم روح کے لیے نور — ہر روز۔',
      col1: 'ایپ', home: 'ہوم', about: 'ہمارے بارے میں', plans: 'منصوبے', dl: 'ڈاؤن لوڈ',
      col2: 'قانونی', privacy: 'پرائیویسی پالیسی', terms: 'سروس کی شرائط', delete: 'اکاؤنٹ حذف کریں',
      col3: 'مدد', support_center: 'سپورٹ سینٹر', contact: 'ہم سے رابطہ',
      copy: '© 2026 OakDev & AI AB. جملہ حقوق محفوظ ہیں۔',
    },
    pages: {
      privacy_label: 'قانونی', privacy_title: 'پرائیویسی پالیسی',
      privacy_subtitle: 'ہم آپ کی پرائیویسی کا احترام کرتے ہیں اور آپ کا ذاتی ڈیٹا ایمانداری، عنایت اور مکمل شفافیت سے سنبھالتے ہیں۔',
      terms_label: 'قانونی', terms_title: 'سروس کی شرائط',
      terms_subtitle: 'نوریا استعمال کرنے سے پہلے براہ کرم یہ شرائط غور سے پڑھیں۔ ایپ ڈاؤن لوڈ یا استعمال کر کے آپ ان کی پابندی سے اتفاق کرتے ہیں۔',
      support_label: 'ہم یہاں مدد کے لیے ہیں', support_title: 'سپورٹ سینٹر',
      support_subtitle: 'اپنے سوالوں کے جواب تلاش کریں یا براہ راست ہم سے رابطہ کریں۔ ہم نوریا کے ساتھ آپ کے تجربے کے لیے پرعزم ہیں۔',
      delete_label: 'اکاؤنٹ', delete_title: 'اپنا اکاؤنٹ حذف کریں',
      delete_subtitle: 'آپ کا جانا ہمیں افسوس ہے۔ آپ کسی بھی وقت اپنے نوریا اکاؤنٹ اور تمام منسلک ڈیٹا کو مستقل طور پر حذف کرنے کی درخواست کر سکتے ہیں۔',
      legal_notice: 'نوٹ: یہ دستاویز صرف قانونی طور پر پابند نسخے کے طور پر انگریزی میں دستیاب ہے۔',
    },
  },

  // ── Indonesian ────────────────────────────────────────────────────────────────
  id: {
    nav: {
      about: 'Tentang', daily: 'Harian', categories: 'Kategori',
      plans: 'Paket', support: 'Dukungan', download: 'Unduh',
    },
    hero: {
      subtitle: 'Panduan Islam Sunni Harian, Doa & Refleksi',
      desc: 'Mulailah setiap hari dalam cahaya iman. Terima doa yang tulus, hikmah abadi, dan panduan bermakna yang berakar dari tradisi Islam Sunni yang indah.',
      stat_categories: 'Kategori', stat_days: 'Hari Panduan', stat_barakah: 'Barakah',
      appstore_small: 'Unduh di', appstore: 'App Store',
      googleplay_small: 'Dapatkan di', googleplay: 'Google Play',
      discover: 'Temukan Nuria',
    },
    quote1: {
      text: '"Barangsiapa bertakwa kepada Allah, niscaya Dia membukakan jalan keluar baginya."',
      cite: 'Al-Qur\'an · At-Talaq 65:2',
    },
    about: {
      label: 'Tentang Nuria',
      title: 'Teman <em>Cahaya</em> untuk Setiap Jiwa',
      subtitle: 'Nuria — berarti <em>bercahaya</em> — dirancang untuk membawa ajaran Islam Sunni yang abadi ke dalam ritme kehidupan sehari-hari Anda. Doa yang autentik, hikmah yang indah, dan panduan dari Sunnah.',
      f1_title: 'Doa Harian',
      f1_text: 'Mulai dan akhiri setiap hari dengan doa-doa indah yang selaras dengan Shalat Subuh dan Isya, berlandaskan Sunnah Rasulullah \u32de.',
      f2_title: 'Ayat Harian',
      f2_text: 'Terima setiap hari satu ayat bermakna dari Al-Qur\'an atau Hadits, disertai perenungan dan konteks spiritual yang memperkaya pemahaman Anda.',
      f3_title: 'Teladan Harian',
      f3_text: 'Temukan tokoh-tokoh bercahaya Islam Sunni — dari para Sahabat mulia hingga Imam-Imam agung — yang hidupnya menerangi jalan yang lurus.',
      f4_title: 'Refleksi Pribadi',
      f4_text: 'Pilih dari 15 kategori spiritual dan terima panduan pribadi yang mendalam, dirancang dengan penuh perhatian dan niat — teman pribadi bagi jiwa.',
      f5_title: 'Perspektif Sunni Autentik',
      f5_text: 'Setiap kata berakar pada keilmuan Sunni autentik, Al-Qur\'an, dan Hadits. Hikmah tradisional yang disampaikan dengan kehangatan, kejelasan, dan kepedulian.',
      f6_title: 'Pertumbuhan Spiritual',
      f6_text: 'Bangun kebiasaan dzikir, refleksi, dan kedekatan dengan Allah yang konsisten. Nuria tumbuh bersama Anda dalam perjalanan menuju versi terbaik diri Anda.',
      f7_title: 'Tanya Nuria Apa Saja',
      f7_text: 'Ada pertanyaan tentang deen Anda? Sebuah kesulitan di hati? Sesuatu yang selalu ingin Anda ketahui? Tanyakan dengan bebas — Nuria menjawab dengan hikmah dari tradisi Sunni.',
      f8_title: 'Kompas Kiblat',
      f8_text: 'Di mana pun Anda berada di dunia, hadaplah arah suci dengan penuh keyakinan. Kompas Kiblat Nuria mengarahkan Anda ke Ka\'bah di Mekah — selalu akurat, selalu tersedia.',
      f9_title: 'Jadwal Shalat 5 Waktu',
      f9_text: 'Jangan pernah terlewat Shalat. Nuria menampilkan waktu tepat untuk kelima shalat harian — Subuh, Dzuhur, Ashar, Maghrib, dan Isya — dihitung untuk lokasi Anda setiap hari.',
    },
    daily: {
      label: 'Yang Menanti Anda Setiap Hari',
      title: 'Setiap Pagi, Berkah <em>Baru</em>',
      d1_title: 'Ayat Harian',
      d1_text: 'Sebuah ayat yang dipilih dengan cermat dari Al-Qur\'an atau Hadits Rasulullah \u32de, disertai refleksi dan konteks untuk memperdalam hubungan Anda dengan Firman Ilahi.',
      d2_title: 'Teladan Harian',
      d2_text: 'Kenali tokoh bercahaya Islam Sunni — seorang Sahabat, Imam agung, atau ulama hati. Setiap hari, cahaya baru dari tradisi kita.',
      d3_title: 'Refleksi Pribadi',
      d3_text: 'Teman spiritual harian Anda. Sebuah refleksi yang dibuat dengan hikmah dan niat, berbicara langsung kepada Anda di mana pun Anda berada dalam perjalanan ini.',
    },
    quote2: {
      text: '"Sesungguhnya Allah itu Maha Indah dan Dia mencintai keindahan."',
      cite: 'Shahih Muslim \u00b7 91',
    },
    categories: {
      label: '15 Kategori Refleksi',
      title: 'Setiap Dimensi <em>Jiwa</em> Anda',
      subtitle: 'Pilih aspek kehidupan Anda di mana hati Anda mencari panduan. Terima hikmah dan refleksi yang dirancang dengan penuh perhatian untuk kebutuhan spiritual Anda.',
      c1: 'Panduan Harian',   c2: 'Iman & Tawakkal',    c3: 'Refleksi Shalat',
      c4: 'Sabar & Harapan',  c5: 'Mencari Ampunan',    c6: 'Kasih Sayang',
      c7: 'Iman & Kekuatan',  c8: 'Hati Bersyukur',     c9: 'Tujuan Hidup',
      c10: 'Ikatan Keluarga', c11: 'Kedamaian Batin',   c12: 'Hikmah Nabi',
      c13: 'Akhlak Mulia',    c14: 'Melawan Godaan',    c15: 'Dzikir Malam',
    },
    newfeatures: {
      label: 'Baru di Nuria',
      title: 'Lebih dari Refleksi — Teman Islamik <em>Lengkap</em>',
      subtitle: 'Nuria telah berkembang. Selain berkah harian dan refleksi pribadi, tiga alat baru yang powerful kini ada di ujung jari Anda.',
      ask_tag: '1 Refleksi', ask_title: 'Tanya Nuria Apa Saja',
      ask_text: 'Pertanyaan tentang deen Anda. Sebuah kesulitan yang membebani hati. Sesuatu yang selalu ingin Anda ketahui tentang Islam. Tanyakan. Nuria merespons dengan jawaban personal yang penuh pertimbangan dari tradisi Sunni autentik.',
      ask_li1: 'Tanya tentang Al-Qur\'an, Hadits, atau hukum Islam',
      ask_li2: 'Cari panduan untuk masalah pribadi',
      ask_li3: 'Dapatkan jawaban dalam bahasa Anda',
      qibla_tag: 'Gratis \u00b7 Selalu Aktif', qibla_title: 'Arah Kiblat',
      qibla_text: 'Di mana pun Anda berada — di rumah, bepergian, atau di tempat asing — hadaplah arah suci dengan keyakinan. Kompas Kiblat Nuria mengarah ke Ka\'bah menggunakan kompas perangkat Anda.',
      qibla_li1: 'Kompas real-time ke Ka\'bah',
      qibla_li2: 'Berfungsi di mana saja di dunia',
      qibla_li3: 'Tidak perlu pengaturan',
      prayer_tag: 'Gratis \u00b7 Harian', prayer_title: 'Jadwal Shalat 5 Waktu',
      prayer_text: 'Shalat adalah tiang Islam. Jangan pernah melewatkan shalat. Nuria menghitung dan menampilkan waktu tepat untuk kelima shalat harian berdasarkan lokasi Anda.',
      prayer_li1: 'Subuh \u00b7 Dzuhur \u00b7 Ashar \u00b7 Maghrib \u00b7 Isya',
      prayer_li2: 'Waktu shalat akurat sesuai lokasi',
      prayer_li3: 'Ditampilkan jelas setiap hari',
    },
    pricing: {
      label: 'Pilih Jalur Anda',
      title: 'Mulai dengan <em>Standard</em>, Berkembang dengan <em>Barakah</em>',
      subtitle: 'Setiap Muslim berhak mendapatkan panduan spiritual. Mulai gratis, dan ketika Anda siap — buka kelimpahan penuh Nuria.',
      std_tier: 'Standard',
      std_price: 'Termasuk dengan aplikasi \u00b7 150 refleksi',
      std_desc: 'Saat mengunduh Nuria, Anda mendapatkan 150 refleksi untuk digunakan di berbagai kategori pilihan Anda — langkah pertama di jalan yang diterangi cahaya.',
      std_f1: '\u2713\u00a0\u00a0Ayat Harian',             std_f2: '\u2713\u00a0\u00a0Teladan Harian',
      std_f3: '\u2713\u00a0\u00a0Refleksi Pribadi Harian', std_f4: '\u2713\u00a0\u00a0Kompas Kiblat',
      std_f5: '\u2713\u00a0\u00a0Jadwal Shalat 5 Waktu',   std_f6: '\u2713\u00a0\u00a0150 refleksi termasuk',
      std_f7: '\u2713\u00a0\u00a0Tanya Nuria Apa Saja (menggunakan refleksi)',
      std_f8: '\u2713\u00a0\u00a0Akses kategori terpilih',
      std_f9: '\u2717\u00a0\u00a0Semua 15 kategori refleksi',
      std_f10: '\u2717\u00a0\u00a0300 refleksi Barakah tambahan',
      std_f11: '\u2717\u00a0\u00a0Top-up refleksi & fitur mendatang',
      std_btn: 'Unduh Nuria',
      bar_badge: 'Paling Dicintai',
      bar_price: '+300 refleksi \u00b7 Top-up tersedia',
      bar_desc: 'Beli Barakah dan dapatkan 300 refleksi tambahan di atas jatah Standard Anda — plus top-up kapan pun Anda membutuhkan lebih.',
      bar_f1: '\u2713\u00a0\u00a0Semua yang ada di Standard',
      bar_f2: '\u2713\u00a0\u00a0300 refleksi tambahan',
      bar_f3: '\u2713\u00a0\u00a0Semua 15 kategori refleksi terbuka',
      bar_f4: '\u2713\u00a0\u00a0Tanya Nuria Apa Saja — tak terbatas',
      bar_f5: '\u2713\u00a0\u00a0Beli top-up refleksi kapan saja',
      bar_f6: '\u2713\u00a0\u00a0Akses awal ke kategori baru',
      bar_f7: '\u2713\u00a0\u00a0Prioritas fitur mendatang',
      bar_btn: 'Terima Barakah',
    },
    download: {
      label: 'Tersedia Sekarang',
      title: 'Bawa Cahaya Islam<br><em>Bersamamu Hari Ini</em>',
      desc: 'Unduh Nuria dan mulailah perjalanan harian Anda dalam iman, refleksi, dan kedekatan dengan Allah — di saku Anda, di hati Anda, setiap pagi Anda bangun.',
      appstore_small: 'Unduh di', appstore: 'App Store',
      googleplay_small: 'Dapatkan di', googleplay: 'Google Play',
    },
    footer: {
      tagline: 'Cahaya untuk jiwa Muslim — setiap hari.',
      col1: 'Aplikasi', home: 'Beranda', about: 'Tentang', plans: 'Paket', dl: 'Unduh',
      col2: 'Hukum', privacy: 'Kebijakan Privasi', terms: 'Syarat Layanan', delete: 'Hapus Akun',
      col3: 'Bantuan', support_center: 'Pusat Dukungan', contact: 'Hubungi Kami',
      copy: '\u00a9 2026 OakDev & AI AB. Semua hak dilindungi.',
    },
    pages: {
      privacy_label: 'Hukum', privacy_title: 'Kebijakan Privasi',
      privacy_subtitle: 'Kami menghormati privasi Anda dan menangani data pribadi Anda dengan kejujuran, kepedulian, dan transparansi penuh.',
      terms_label: 'Hukum', terms_title: 'Syarat Layanan',
      terms_subtitle: 'Harap baca syarat-syarat ini dengan cermat sebelum menggunakan Nuria. Dengan mengunduh atau menggunakan Aplikasi, Anda setuju untuk terikat olehnya.',
      support_label: 'Kami Siap Membantu', support_title: 'Pusat Dukungan',
      support_subtitle: 'Temukan jawaban atas pertanyaan Anda atau hubungi kami langsung. Kami berkomitmen untuk pengalaman Anda dengan Nuria.',
      delete_label: 'Akun', delete_title: 'Hapus Akun Anda',
      delete_subtitle: 'Kami menyesal melihat Anda pergi. Anda dapat meminta penghapusan permanen akun Nuria dan semua data terkait kapan saja.',
      legal_notice: 'Catatan: Dokumen ini hanya tersedia dalam bahasa Inggris sebagai versi yang mengikat secara hukum.',
    },
  },

  // ── French ────────────────────────────────────────────────────────────────────
  fr: {
    nav: {
      about: '\u00c0 propos', daily: 'Quotidien', categories: 'Cat\u00e9gories',
      plans: 'Formules', support: 'Assistance', download: 'T\u00e9l\u00e9charger',
    },
    hero: {
      subtitle: 'Guidance Islamique Sunnite Quotidienne, Pri\u00e8re & R\u00e9flexion',
      desc: 'Commencez chaque journ\u00e9e dans la lumi\u00e8re de la foi. Recevez des invocations sinc\u00e8res, une sagesse intemporelle et une guidance ancr\u00e9e dans la belle tradition de l\'islam sunnite.',
      stat_categories: 'Cat\u00e9gories', stat_days: 'Jours de Guidance', stat_barakah: 'Barakah',
      appstore_small: 'T\u00e9l\u00e9charger sur l\'', appstore: 'App Store',
      googleplay_small: 'Disponible sur', googleplay: 'Google Play',
      discover: 'D\u00e9couvrir Nuria',
    },
    quote1: {
      text: '\u00ab\u00a0Quiconque craint Allah, Il lui ouvrira une issue.\u00a0\u00bb',
      cite: 'Coran \u00b7 At-Tal\u00e2q 65:2',
    },
    about: {
      label: '\u00c0 propos de Nuria',
      title: 'Un Compagnon de <em>Lumi\u00e8re</em> pour Chaque \u00c2me',
      subtitle: 'Nuria — signifiant <em>lumineuse</em> — est con\u00e7ue pour int\u00e9grer les enseignements intemporels de l\'islam sunnite dans le rythme de votre vie quotidienne.',
      f1_title: 'Pri\u00e8res Quotidiennes',
      f1_text: 'Commencez et terminez chaque jour avec de belles invocations align\u00e9es sur Fajr et Isha, ancr\u00e9es dans la Sunna du Proph\u00e8te \u32de.',
      f2_title: 'Verset du Jour',
      f2_text: 'Recevez chaque jour un verset significatif du Saint Coran ou du Hadith, accompagn\u00e9 d\'une r\u00e9flexion et d\'un contexte spirituel.',
      f3_title: 'Mod\u00e8les du Jour',
      f3_text: 'D\u00e9couvrez les luminaires de l\'islam sunnite — des nobles Compagnons aux grands Im\u00e2ms — dont les vies \u00e9clairent la voie droite.',
      f4_title: 'R\u00e9flexions Personnelles',
      f4_text: 'Choisissez parmi 15 cat\u00e9gories spirituelles et recevez une guidance profond\u00e9ment personnelle, con\u00e7ue avec soin et intention.',
      f5_title: 'Perspective Sunnite Authentique',
      f5_text: 'Chaque mot est ancr\u00e9 dans l\'enseignement sunnite authentique, le Coran et le Hadith. Sagesse traditionnelle transmise avec chaleur, clart\u00e9 et soin.',
      f6_title: 'Croissance Spirituelle',
      f6_text: 'Construisez des habitudes constantes de dhikr, de r\u00e9flexion et de proximit\u00e9 avec Allah. Nuria grandit avec vous sur votre chemin.',
      f7_title: 'Posez N\'importe Quelle Question \u00e0 Nuria',
      f7_text: 'Une question sur votre deen ? Une \u00e9preuve sur le c\u0153ur ? Posez-la librement — Nuria r\u00e9pond avec sagesse enracin\u00e9e dans la tradition sunnite.',
      f8_title: 'Boussole Qibla',
      f8_text: 'O\u00f9 que vous soyez dans le monde, faites face \u00e0 la direction sacr\u00e9e avec confiance. La boussole Qibla de Nuria vous oriente vers la Ka\u2019ba \u00e0 La Mecque.',
      f9_title: 'Horaires des 5 Pri\u00e8res',
      f9_text: 'Ne manquez jamais la Salah. Nuria affiche les heures pr\u00e9cises des cinq pri\u00e8res quotidiennes — Fajr, Dhuhr, Asr, Maghrib et Isha — calcul\u00e9es pour votre emplacement.',
    },
    daily: {
      label: 'Ce Qui Vous Attend Chaque Jour',
      title: 'Chaque Matin, une Nouvelle <em>B\u00e9n\u00e9diction</em>',
      d1_title: 'Verset du Jour',
      d1_text: 'Un verset soigneusement choisi du Saint Coran ou du Hadith du Proph\u00e8te \u32de, accompagn\u00e9 d\'une r\u00e9flexion et d\'un contexte pour approfondir votre connexion au Verbe Divin.',
      d2_title: 'Mod\u00e8le du Jour',
      d2_text: 'Rencontrez un luminaire de l\'islam sunnite — un Compagnon, un grand Im\u00e2m, un savant du c\u0153ur. Chaque jour, une nouvelle lumi\u00e8re de notre tradition.',
      d3_title: 'R\u00e9flexion Personnelle',
      d3_text: 'Votre compagnon spirituel quotidien. Une r\u00e9flexion con\u00e7ue avec sagesse et intention, vous parlant directement l\u00e0 o\u00f9 vous \u00eates sur votre chemin.',
    },
    quote2: {
      text: '\u00ab\u00a0Certes, Allah est beau et Il aime la beaut\u00e9.\u00a0\u00bb',
      cite: 'Sahih Muslim \u00b7 91',
    },
    categories: {
      label: '15 Cat\u00e9gories de R\u00e9flexion',
      title: 'Chaque Dimension de Votre <em>\u00c2me</em>',
      subtitle: 'Choisissez l\'aspect de votre vie o\u00f9 votre c\u0153ur cherche une guidance. Recevez sagesse et r\u00e9flexion con\u00e7ues avec soin pour votre besoin spirituel.',
      c1: 'Guidance Quotidienne',   c2: 'Iman & Confiance',       c3: 'R\u00e9flexion sur la Pri\u00e8re',
      c4: 'Patience & Espoir',      c5: 'Chercher le Pardon',     c6: 'Mis\u00e9ricorde & Compassion',
      c7: 'Foi & Force',            c8: 'C\u0153ur Reconnaissant', c9: 'But de Vie',
      c10: 'Liens Familiaux',       c11: 'Paix Int\u00e9rieure',  c12: 'Sagesse des Proph\u00e8tes',
      c13: 'Bon Caract\u00e8re',    c14: 'R\u00e9sister \u00e0 la Tentation', c15: 'Dhikr du Soir',
    },
    newfeatures: {
      label: 'Nouveau dans Nuria',
      title: 'Plus que de la R\u00e9flexion — Compagnon Islamique <em>Complet</em>',
      subtitle: 'Nuria a \u00e9volu\u00e9. En plus de vos b\u00e9n\u00e9dictions quotidiennes, trois nouveaux outils puissants sont maintenant \u00e0 port\u00e9e de main.',
      ask_tag: '1 R\u00e9flexion', ask_title: 'Posez N\'importe Quelle Question \u00e0 Nuria',
      ask_text: 'Une question sur votre deen. Une \u00e9preuve pesant sur votre c\u0153ur. Quelque chose que vous avez toujours voulu savoir sur l\'islam. Posez-la. Nuria r\u00e9pond avec une r\u00e9ponse personnalis\u00e9e ancr\u00e9e dans la tradition sunnite authentique.',
      ask_li1: 'Posez des questions sur le Coran, le Hadith ou le droit islamique',
      ask_li2: 'Cherchez une guidance pour des \u00e9preuves personnelles',
      ask_li3: 'Obtenez des r\u00e9ponses dans votre langue',
      qibla_tag: 'Gratuit \u00b7 Toujours actif', qibla_title: 'Direction de la Qibla',
      qibla_text: 'O\u00f9 que vous soyez — \u00e0 la maison, en voyage — faites face \u00e0 la direction sacr\u00e9e avec certitude. La boussole Qibla de Nuria pointe vers la Ka\u2019ba.',
      qibla_li1: 'Boussole en temps r\u00e9el vers la Ka\u2019ba',
      qibla_li2: 'Fonctionne partout dans le monde',
      qibla_li3: 'Aucune configuration requise',
      prayer_tag: 'Gratuit \u00b7 Quotidien', prayer_title: '5 Horaires de Pri\u00e8res',
      prayer_text: 'La Salah est le pilier de l\'islam. Ne manquez jamais une pri\u00e8re. Nuria calcule et affiche les heures pr\u00e9cises des cinq pri\u00e8res bas\u00e9es sur votre localisation.',
      prayer_li1: 'Fajr \u00b7 Dhuhr \u00b7 Asr \u00b7 Maghrib \u00b7 Isha',
      prayer_li2: 'Horaires pr\u00e9cis selon votre position',
      prayer_li3: 'Affich\u00e9s clairement chaque jour',
    },
    pricing: {
      label: 'Choisissez Votre Voie',
      title: 'Commencez avec <em>Standard</em>, \u00c9panouissez-vous avec <em>Barakah</em>',
      subtitle: 'Chaque musulman m\u00e9rite un acc\u00e8s \u00e0 la guidance spirituelle. Commencez gratuitement, et quand vous \u00eates pr\u00eat — d\u00e9bloquez toute l\'abondance de Nuria.',
      std_tier: 'Standard',
      std_price: 'Inclus avec l\'application \u00b7 150 r\u00e9flexions',
      std_desc: 'En t\u00e9l\u00e9chargeant Nuria, vous recevez 150 r\u00e9flexions \u00e0 utiliser dans vos cat\u00e9gories choisies — vos premiers pas sur le chemin illumin\u00e9.',
      std_f1: '\u2713\u00a0\u00a0Verset quotidien',         std_f2: '\u2713\u00a0\u00a0Mod\u00e8le du jour',
      std_f3: '\u2713\u00a0\u00a0R\u00e9flexion personnelle',   std_f4: '\u2713\u00a0\u00a0Boussole Qibla',
      std_f5: '\u2713\u00a0\u00a05 horaires de pri\u00e8res',   std_f6: '\u2713\u00a0\u00a0150 r\u00e9flexions incluses',
      std_f7: '\u2713\u00a0\u00a0Questions \u00e0 Nuria (utilise des r\u00e9flexions)',
      std_f8: '\u2713\u00a0\u00a0Acc\u00e8s aux cat\u00e9gories s\u00e9lectionn\u00e9es',
      std_f9: '\u2717\u00a0\u00a0Toutes les 15 cat\u00e9gories',
      std_f10: '\u2717\u00a0\u00a0300 r\u00e9flexions Barakah suppl\u00e9mentaires',
      std_f11: '\u2717\u00a0\u00a0Recharges de r\u00e9flexions & fonctionnalit\u00e9s',
      std_btn: 'T\u00e9l\u00e9charger Nuria',
      bar_badge: 'Le Plus Aim\u00e9',
      bar_price: '+300 r\u00e9flexions \u00b7 Recharges disponibles',
      bar_desc: 'Achetez Barakah et recevez 300 r\u00e9flexions suppl\u00e9mentaires en plus de votre allocation Standard — avec des recharges quand vous en avez besoin.',
      bar_f1: '\u2713\u00a0\u00a0Tout ce qui est dans Standard',
      bar_f2: '\u2713\u00a0\u00a0300 r\u00e9flexions suppl\u00e9mentaires',
      bar_f3: '\u2713\u00a0\u00a0Toutes les 15 cat\u00e9gories d\u00e9bloqu\u00e9es',
      bar_f4: '\u2713\u00a0\u00a0Questions \u00e0 Nuria — illimit\u00e9es',
      bar_f5: '\u2713\u00a0\u00a0Achetez des recharges \u00e0 tout moment',
      bar_f6: '\u2713\u00a0\u00a0Acc\u00e8s anticip\u00e9 aux nouvelles cat\u00e9gories',
      bar_f7: '\u2713\u00a0\u00a0Priorit\u00e9 aux nouvelles fonctionnalit\u00e9s',
      bar_btn: 'Recevoir Barakah',
    },
    download: {
      label: 'Disponible Maintenant',
      title: 'Portez la Lumi\u00e8re de l\'Islam<br><em>avec Vous Aujourd\'hui</em>',
      desc: 'T\u00e9l\u00e9chargez Nuria et commencez votre voyage quotidien de foi, de r\u00e9flexion et de proximit\u00e9 avec Allah — dans votre poche, dans votre c\u0153ur, chaque matin.',
      appstore_small: 'T\u00e9l\u00e9charger sur l\'', appstore: 'App Store',
      googleplay_small: 'Disponible sur', googleplay: 'Google Play',
    },
    footer: {
      tagline: 'Lumi\u00e8re pour l\'\u00e2me musulmane — chaque jour.',
      col1: 'Application', home: 'Accueil', about: '\u00c0 propos', plans: 'Formules', dl: 'T\u00e9l\u00e9charger',
      col2: 'L\u00e9gal', privacy: 'Politique de confidentialit\u00e9', terms: 'Conditions d\'utilisation', delete: 'Supprimer le compte',
      col3: 'Aide', support_center: 'Centre d\'assistance', contact: 'Nous contacter',
      copy: '\u00a9 2026 OakDev & AI AB. Tous droits r\u00e9serv\u00e9s.',
    },
    pages: {
      privacy_label: 'L\u00e9gal', privacy_title: 'Politique de Confidentialit\u00e9',
      privacy_subtitle: 'Nous respectons votre vie priv\u00e9e et traitons vos donn\u00e9es personnelles avec honn\u00eatet\u00e9, soin et pleine transparence.',
      terms_label: 'L\u00e9gal', terms_title: 'Conditions d\'Utilisation',
      terms_subtitle: 'Veuillez lire attentivement ces conditions avant d\'utiliser Nuria. En t\u00e9l\u00e9chargeant ou en utilisant l\'application, vous acceptez d\'\u00eatre li\u00e9 par elles.',
      support_label: 'Nous Sommes L\u00e0 pour Vous Aider', support_title: 'Centre d\'Assistance',
      support_subtitle: 'Trouvez des r\u00e9ponses \u00e0 vos questions ou contactez-nous directement. Nous sommes engag\u00e9s envers votre exp\u00e9rience avec Nuria.',
      delete_label: 'Compte', delete_title: 'Supprimer Votre Compte',
      delete_subtitle: 'Nous sommes d\u00e9sol\u00e9s de vous voir partir. Vous pouvez demander la suppression permanente de votre compte Nuria et de toutes les donn\u00e9es associ\u00e9es \u00e0 tout moment.',
      legal_notice: 'Note\u00a0: Ce document est uniquement disponible en anglais en tant que version juridiquement contraignante.',
    },
  },

  // ── Turkish ───────────────────────────────────────────────────────────────────
  tr: {
    nav: {
      about: 'Hakk\u0131nda', daily: 'G\u00fcnl\u00fck', categories: 'Kategoriler',
      plans: 'Planlar', support: 'Destek', download: '\u0130ndir',
    },
    hero: {
      subtitle: 'G\u00fcnl\u00fck S\u00fcnni \u0130slam Rehberli\u011fi, Namaz & Tefekkür',
      desc: 'Her güne imanın ışığında başlayın. Sünni İslam\'ın güzel geleneğine dayanan içten dualar, zamansız hikmetler ve anlamlı rehberlik alın.',
      stat_categories: 'Kategori', stat_days: 'Günlük Rehberlik', stat_barakah: 'Bereket',
      appstore_small: 'İndir', appstore: 'App Store',
      googleplay_small: 'Edinin', googleplay: 'Google Play',
      discover: 'Nuria\'yı Keşfet',
    },
    quote1: {
      text: '"Kim Allah\'tan korkarsa, O ona bir çıkış yolu açar."',
      cite: 'Kur\'an · At-Talak 65:2',
    },
    about: {
      label: 'Nuria Hakkında',
      title: 'Her Ruh için <em>Işık</em> Eşlikçisi',
      subtitle: 'Nuria — \'ışıklı\' anlamına gelir — Sünni İslam\'ın zamansız öğretilerini günlük hayatınıza taşımak için tasarlanmıştır. Özgün dualar, güzel hikmetler ve Sünnet\'ten rehberlik.',
      f1_title: 'Günlük Dualar',
      f1_text: 'Sabah ve Yatsı\'ya hizalı, Hz. Peygamber\'in ﷺ Sünneti\'ne dayanan güzel dualarla her güne başlayın ve bitirin.',
      f2_title: 'Günlük Ayet',
      f2_text: 'Her gün Kur\'an-ı Kerim veya Hadis\'ten anlamlı bir ayet alın; anlayışınızı zenginleştiren tefekkür ve bağlamla birlikte.',
      f3_title: 'Günlük Rol Modeller',
      f3_text: 'Sünni İslam\'ın aydınlık isimlerini keşfedin — soylu Sahabeler\'den büyük İmamlar\'a — hayatları doğru yolu aydınlatan.',
      f4_title: 'Kişisel Tefekkürler',
      f4_text: '15 manevi kategoriden seçin ve özen ile niyetle hazırlanmış derin kişisel rehberlik alın — ruh için özel bir eşlikçi.',
      f5_title: 'Özgün Sünni Bakış Açısı',
      f5_text: 'Her kelime özgün Sünni ilmine, Kur\'an\'a ve Hadis\'e dayalıdır. Sıcaklık, netlik ve özenle sunulan geleneksel hikmet.',
      f6_title: 'Manevi Gelişim',
      f6_text: 'Tutarlı zikir, tefekkür ve Allah\'a yakınlık alışkanlıkları edinin. Nuria, kendinizin en iyi versiyonuna doğru yolculuğunuzda sizinle büyür.',
      f7_title: 'Nuria\'ya Her Şeyi Sorun',
      f7_text: 'Dininiz hakkında bir sorunuz mu var? Kalbinize ağırlık basan bir sıkıntı mı? Özgürce sorun — Nuria Sünni geleneğe dayanan hikmetle yanıt verir.',
      f8_title: 'Kıble Pusulası',
      f8_text: 'Dünyanın neresinde olursanız olun, kutsal yöne güvenle yöneliniz. Nuria\'nın yerleşik Kıble pusulası Mekke\'deki Kâbe\'ye işaret eder.',
      f9_title: '5 Vakit Namaz',
      f9_text: 'Namazı kaçırmayın. Nuria her gün konumunuza göre beş vakit namazın — Sabah, Öğle, İkindi, Akşam ve Yatsı — tam vakitlerini gösterir.',
    },
    daily: {
      label: 'Her Gün Sizi Neler Bekliyor',
      title: 'Her Sabah Yeni Bir <em>Bereket</em>',
      d1_title: 'Günlük Ayet',
      d1_text: 'Kur\'an-ı Kerim\'den veya Hz. Peygamber\'in ﷺ hadisinden özenle seçilmiş bir ayet; İlahi Kelam\'la bağınızı derinleştiren tefekkür ve bağlamla.',
      d2_title: 'Günlük Rol Model',
      d2_text: 'Sünni İslam\'ın bir aydınlık ismiyle tanışın — bir Sahabi, büyük bir İmam, bir kalp alimi. Her gün geleneğimizden yeni bir ışık.',
      d3_title: 'Kişisel Tefekkür',
      d3_text: 'Günlük manevi eşlikçiniz. Hikmet ve niyetle hazırlanmış, yolculuğunuzda tam olarak bulunduğunuz yere doğrudan seslenen bir tefekkür.',
    },
    quote2: {
      text: '"Şüphesiz Allah güzeldir ve güzelliği sever."',
      cite: 'Sahih Muslim \u00b7 91',
    },
    categories: {
      label: '15 Tefekkür Kategorisi',
      title: 'Ruhunuzun Her <em>Boyutu</em>',
      subtitle: 'Kalbinizin rehberlik aradığı hayatın boyutunu seçin. Manevi ihtiyacınız için özenle hazırlanmış hikmet ve tefekkür alın.',
      c1: 'Günlük Rehberlik',   c2: 'İman & Tevekkül',      c3: 'Namaz Tefekkürü',
      c4: 'Sabır & Umut',       c5: 'Tövbe & Af',           c6: 'Merhamet & Şefkat',
      c7: 'İman & Güç',         c8: 'Şükran Kalbi',         c9: 'Yaşam Amacı',
      c10: 'Aile Bağları',      c11: 'İç Huzur',            c12: 'Peygamber Hikmeti',
      c13: 'Güzel Ahlak',       c14: 'Nefse Hâkim Olmak',   c15: 'Akşam Zikri',
    },
    newfeatures: {
      label: 'Nuria\'da Yeni',
      title: 'Tefekkürden Fazlası — <em>Eksiksiz</em> İslami Eşlikçi',
      subtitle: 'Nuria büyüdü. Günlük bereketlerin ve kişisel tefekkürlerinizin yanında üç güçlü yeni araç artık parmaklarınızın ucunda.',
      ask_tag: '1 Tefekkür', ask_title: 'Nuria\'ya Her Şeyi Sorun',
      ask_text: 'Dininiz hakkında bir soru. Kalbinize ağırlık basan bir sıkıntı. İslam hakkında her zaman merak ettiğiniz bir şey. Sorun. Nuria özgün Sünni geleneğe dayanan düşünceli, kişiselleştirilmiş bir yanıt verir.',
      ask_li1: 'Kur\'an, Hadis veya İslami hükümler hakkında sorun',
      ask_li2: 'Kişisel zorluklar için rehberlik isteyin',
      ask_li3: 'Kendi dilinizde yanıt alın',
      qibla_tag: 'Ücretsiz \u00b7 Her Zaman', qibla_title: 'Kıble Yönü',
      qibla_text: 'Nerede olursanız olun — evde, seyahatte — kutsal yöne kesinlikle yöneliniz. Nuria\'nın Kıble pusulası cihazınızın pusulasını kullanarak Kâbe\'ye işaret eder.',
      qibla_li1: 'Kâbe\'ye gerçek zamanlı pusula',
      qibla_li2: 'Dünyanın her yerinde çalışır',
      qibla_li3: 'Kurulum gerektirmez',
      prayer_tag: 'Ücretsiz \u00b7 Günlük', prayer_title: '5 Vakit Namaz',
      prayer_text: 'Namaz İslam\'ın direğidir. Hiçbir namazı kaçırmayın. Nuria konumunuza göre beş vakit namazın — Sabah, Öğle, İkindi, Akşam ve Yatsı — tam vakitlerini hesaplar ve gösterir.',
      prayer_li1: 'Sabah \u00b7 Öğle \u00b7 İkindi \u00b7 Akşam \u00b7 Yatsı',
      prayer_li2: 'Konuma göre doğru namaz vakitleri',
      prayer_li3: 'Her gün açıkça görüntülenir',
    },
    pricing: {
      label: 'Yolunuzu Seçin',
      title: '<em>Standard</em> ile Başlayın, <em>Bereket</em> ile Gelişin',
      subtitle: 'Her Müslüman manevi rehberliğe erişmeyi hak eder. Ücretsiz başlayın ve hazır olduğunuzda — Nuria\'nın tam bolluğunu açın.',
      std_tier: 'Standard',
      std_price: 'Uygulama ile dahil \u00b7 150 tefekkür',
      std_desc: 'Nuria\'yı indirdiğinizde seçtiğiniz kategorilerde kullanmak için 150 tefekkür alırsınız — aydınlık yoldaki ilk adımlarınız.',
      std_f1: '\u2713\u00a0\u00a0Günlük Ayet',            std_f2: '\u2713\u00a0\u00a0Günlük Rol Model',
      std_f3: '\u2713\u00a0\u00a0Günlük Kişisel Tefekkür', std_f4: '\u2713\u00a0\u00a0Kıble Pusulası',
      std_f5: '\u2713\u00a0\u00a05 Vakit Namaz',           std_f6: '\u2713\u00a0\u00a0150 tefekkür dahil',
      std_f7: '\u2713\u00a0\u00a0Nuria\'ya Soru Sor (tefekkür kullanır)',
      std_f8: '\u2713\u00a0\u00a0Seçili kategorilere erişim',
      std_f9: '\u2717\u00a0\u00a0Tüm 15 tefekkür kategorisi',
      std_f10: '\u2717\u00a0\u00a0300 ek Bereket tefekkürü',
      std_f11: '\u2717\u00a0\u00a0Tefekkür yüklemeleri & gelecek özellikler',
      std_btn: 'Nuria\'yı İndir',
      bar_badge: 'En Çok Sevilen',
      bar_price: '+300 tefekkür \u00b7 Yükleme mevcut',
      bar_desc: 'Bereket satın alın ve Standard kotanızın üstüne 300 ek tefekkür kazanın — ihtiyaç duyduğunuzda yükleme yapın.',
      bar_f1: '\u2713\u00a0\u00a0Standard\'daki her şey',
      bar_f2: '\u2713\u00a0\u00a0300 ek tefekkür',
      bar_f3: '\u2713\u00a0\u00a0Tüm 15 tefekkür kategorisi açık',
      bar_f4: '\u2713\u00a0\u00a0Nuria\'ya Soru Sor — sınırsız',
      bar_f5: '\u2713\u00a0\u00a0İstediğiniz zaman yükleme satın alın',
      bar_f6: '\u2713\u00a0\u00a0Yeni kategorilere erken erişim',
      bar_f7: '\u2713\u00a0\u00a0Gelecek özelliklere öncelik',
      bar_btn: 'Bereket Al',
    },
    download: {
      label: 'Şimdi Mevcut',
      title: 'İslam\'ın Işığını<br><em>Bugün Yanınızda Taşıyın</em>',
      desc: 'Nuria\'yı indirin ve iman, tefekkür ve Allah\'a yakınlığın günlük yolculuğuna başlayın — cebinizde, kalbinizde, her sabah uyandığınızda.',
      appstore_small: 'İndir', appstore: 'App Store',
      googleplay_small: 'Edinin', googleplay: 'Google Play',
    },
    footer: {
      tagline: 'Müslüman ruh için ışık — her gün.',
      col1: 'Uygulama', home: 'Ana Sayfa', about: 'Hakkında', plans: 'Planlar', dl: 'İndir',
      col2: 'Hukuki', privacy: 'Gizlilik Politikası', terms: 'Kullanım Şartları', delete: 'Hesabı Sil',
      col3: 'Yardım', support_center: 'Destek Merkezi', contact: 'Bize Ulaşın',
      copy: '\u00a9 2026 OakDev & AI AB. Tüm hakları saklıdır.',
    },
    pages: {
      privacy_label: 'Hukuki', privacy_title: 'Gizlilik Politikası',
      privacy_subtitle: 'Gizliliğinize saygı duyuyor ve kişisel verilerinizi dürüstlük, özen ve tam şeffaflıkla işliyoruz.',
      terms_label: 'Hukuki', terms_title: 'Kullanım Şartları',
      terms_subtitle: 'Lütfen Nuria\'yı kullanmadan önce bu şartları dikkatlice okuyun. Uygulamayı indirerek veya kullanarak bu şartlara uymayı kabul edersiniz.',
      support_label: 'Size Yardımcı Olmak İçin Buradayız', support_title: 'Destek Merkezi',
      support_subtitle: 'Sorularınızın yanıtlarını bulun veya doğrudan bizimle iletişime geçin. Nuria deneyiminize adanmış durumdayız.',
      delete_label: 'Hesap', delete_title: 'Hesabınızı Silin',
      delete_subtitle: 'Gitmenizi üzülerek karşılıyoruz. Nuria hesabınızın ve ilgili tüm verilerinizin kalıcı olarak silinmesini istediğiniz zaman talep edebilirsiniz.',
      legal_notice: 'Not: Bu belge yalnızca İngilizce olarak yasal bağlayıcı sürümü olarak mevcuttur.',
    },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getVal(lang, path) {
  const parts = path.split('.');
  let obj = T[lang] || T.en;
  for (const p of parts) {
    if (obj === undefined || obj === null) return undefined;
    obj = obj[p];
  }
  // fallback to English if key missing in current lang
  if (obj === undefined) {
    let fb = T.en;
    for (const p of parts) { if (!fb) return ''; fb = fb[p]; }
    return fb || '';
  }
  return obj;
}

function applyLang(lang) {
  const meta = LANG_META[lang] || LANG_META.en;

  // text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = getVal(lang, el.dataset.i18n);
    if (v !== undefined && v !== null) el.textContent = v;
  });

  // innerHTML (for em tags etc.)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const v = getVal(lang, el.dataset.i18nHtml);
    if (v !== undefined && v !== null) el.innerHTML = v;
  });

  // dir + lang on <html>
  document.documentElement.lang = lang;
  document.documentElement.dir  = meta.dir;
  document.documentElement.dataset.lang = lang;

  // update switcher button
  document.querySelectorAll('.lang-flag').forEach(el => el.textContent = meta.flag);
  document.querySelectorAll('.lang-code').forEach(el => el.textContent = meta.label);

  // mark active in dropdown
  document.querySelectorAll('.nav__lang-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
}

function setLang(lang) {
  if (!T[lang]) return;
  localStorage.setItem('nuriaLang', lang);
  applyLang(lang);
}

function getLang() {
  const stored = localStorage.getItem('nuriaLang');
  if (stored && T[stored]) return stored;
  // auto-detect from browser
  const browser = (navigator.language || 'en').split('-')[0].toLowerCase();
  return T[browser] ? browser : 'en';
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const lang = getLang();
  applyLang(lang);

  // toggle dropdown
  document.querySelectorAll('.nav__lang-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const wrapper = btn.closest('.nav__lang');
      wrapper.classList.toggle('open');
      btn.setAttribute('aria-expanded', wrapper.classList.contains('open'));
    });
  });

  // select language
  document.querySelectorAll('.nav__lang-option').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setLang(btn.dataset.lang);
      btn.closest('.nav__lang').classList.remove('open');
    });
  });

  // close on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.nav__lang.open')
      .forEach(w => w.classList.remove('open'));
  });
});
