'use strict';

(function () {
  if (typeof T === 'undefined') return;

  const PATCH = {
    en: {
      footer: {
        sources: 'Sources',
      },
      pages: {
        sources_label: 'Sources',
        sources_title: 'Sources & Standards',
        sources_subtitle:
          "This page explains the concrete source systems, curated collections, and AI guardrails behind Nuria's Quran, duas, prayer tools, tafsir, and reflections.",
        doc_sources_title: 'Sources & Standards - Nuria',
        doc_sources_desc:
          "See the concrete source systems, curated collections, and AI guardrails behind Nuria's Quran, duas, prayer tools, tafsir, and reflections.",
      },
      sources: {
        intro_title:
          'Nuria is built on different kinds of foundations, and we want to be clear about which is which.',
        intro_text:
          'Some parts of the app come from named Quran APIs or curated in-app datasets. Some are calculated on your device. AI features are wrapped in strict instruction and blocking rules. Where precision or rulings matter, the app should support practice, not replace qualified local scholarship.',
        card_quran_title: 'Quran text and translations',
        card_quran_text:
          "The Quran reading experience uses Arabic text and surah metadata from api.alquran.cloud. In AlQuran.cloud's own public contributor credits, its Quran text is attributed to Tanzil.net, with Quran Academy credited for edited Uthmanic text. In Nuria, translation editions stay behind a curated trust allowlist; most are fetched via api.alquran.cloud, while selected editions such as Mufti Taqi Usmani are fetched from api.quran.com. New upstream editions are not admitted automatically.",
        card_quran_point_1:
          'Arabic Quran text in Nuria is served via api.alquran.cloud, which publicly credits Tanzil.net for the text and Quran Academy for edited Uthmanic text.',
        card_quran_point_2:
          'Translations are not taken from an open feed; Nuria uses a curated trust allowlist, mainly via api.alquran.cloud with selected editions from api.quran.com.',
        card_audio_title: 'Recitation and audio delivery',
        card_audio_text:
          'Per-ayah Quran recitation audio is served from everyayah.com. Nuria uses a small curated reciter catalogue rather than an open feed, including reciters such as Mishary Rashid Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit, and Hani Ar-Rifai.',
        card_audio_point_1:
          'Per-ayah recitation delivery: everyayah.com.',
        card_audio_point_2:
          'Reciters: curated catalogue including Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit, and Hani Ar-Rifai.',
        card_devotional_title: 'Duas, adhkar, hadith, and ruqyah',
        card_devotional_text:
          "Nuria's devotional collections are curated in app data and content storage with a source attached to each item. The cited references include Quran verses and hadith collections such as Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud, and Ibn Majah.",
        card_devotional_point_1:
          "Each item keeps its own source reference inside Nuria's devotional data or content storage.",
        card_devotional_point_2:
          'Cited source families include Quran, Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud, and Ibn Majah.',
        card_prayer_title: 'Prayer times and Qibla',
        card_prayer_text:
          'Prayer times are calculated through the adhan library with selectable methods such as Muslim World League, Egyptian, Karachi, Umm al-Qura, Dubai, Moon Sighting Committee, North America, Kuwait, Qatar, Singapore, Turkey, and Tehran. Qibla is computed from your location toward the Kaaba in Makkah using great-circle bearing and device sensors.',
        card_prayer_point_1:
          'Prayer calculations: adhan library with selectable regional methods.',
        card_prayer_point_2:
          'Qibla: great-circle bearing from device location toward the Kaaba, using device sensors.',
        card_tafsir_title: 'Named tafsir works only',
        card_tafsir_text:
          'Tafsir explanations are tied to a named scholar catalogue inside the app. When tafsir is generated, the prompt is source locked to the selected published tafsir work and explicitly treats anonymous websites, social posts, blogs, unattributed API text, and AI summaries as untrusted.',
        card_tafsir_point_1:
          "Tafsir generation is restricted to named works in the app's scholar catalogue.",
        card_tafsir_point_2:
          'Anonymous websites, blogs, social posts, unattributed API text, and AI summaries are treated as untrusted.',
        card_ai_title: 'Ask Nuria AI guardrails',
        card_ai_text:
          'Ask Nuria uses a strict system prompt and backend checks. The instruction layer says answers must draw only from the Quran, authenticated hadith, the Companions, and recognised Sunni scholars. The backend blocks medical advice, mental health and self-harm requests, extremism, and fatwa or halal-haram style ruling requests before generation.',
        card_ai_point_1:
          'Prompt source scope: Quran, authenticated hadith, the Companions, and recognised Sunni scholars.',
        card_ai_point_2:
          'Blocked before generation: medical advice, mental health and self-harm, extremism, and fatwa or halal-haram ruling requests.',
        card_ai_point_3:
          'Operational controls: App Check is enforced and requests are rate limited before a reply is returned.',
        note_title: 'Scope and limits',
        note_text:
          'Nuria uses established upstreams and curated source controls rather than anonymous or user-submitted religious content. Original Arabic text and source references are kept separate from localized supporting translations. For fatwas, urgent health matters, or mosque-specific schedules, rely on qualified scholars, licensed professionals, and local mosques.',
        report_title: 'Found a source issue?',
        report_text:
          'If you spot a broken reference, mistranslation, or anything that looks off, contact us. We would rather correct a problem quickly than leave unclear material in place.',
        report_link: 'Contact support',
        quote_text: '"My Lord, increase me in knowledge."',
        quote_ref: 'Quran 20:114',
      },
    },
    ar: {
      footer: {
        sources: 'المصادر',
      },
      pages: {
        sources_label: 'المصادر',
        sources_title: 'المصادر والمعايير',
        sources_subtitle:
          'توضح هذه الصفحة أنظمة المصادر الفعلية والمجموعات المنسقة والضوابط الصارمة للذكاء الاصطناعي وراء القرآن والأدعية وأدوات الصلاة والتفسير والتأملات في نوريا.',
        doc_sources_title: 'المصادر والمعايير - نوريا',
        doc_sources_desc:
          'اطلع على أنظمة المصادر الفعلية والمجموعات المنسقة والضوابط الصارمة للذكاء الاصطناعي وراء القرآن والأدعية وأدوات الصلاة والتفسير والتأملات في نوريا.',
      },
      sources: {
        intro_title:
          'نُورِيا مبنية على أنواع مختلفة من الأسس، ونريد أن نكون واضحين في التفريق بينها.',
        intro_text:
          'بعض أجزاء التطبيق تأتي من واجهات قرآن مسماة أو من مجموعات بيانات منسقة داخل التطبيق. وبعضها يُحسب على جهازك. وميزات الذكاء الاصطناعي محاطة بتعليمات وقواعد حظر صارمة. وحيث تكون الدقة أو الأحكام مهمة، فالتطبيق يساند الممارسة ولا يحل محل العلماء المحليين المؤهلين.',
        card_quran_title: 'نص القرآن وترجماته',
        card_quran_text:
          'تجربة قراءة القرآن تستخدم النص العربي وبيانات السور من api.alquran.cloud. وفي صفحة المساهمين العامة الخاصة بـ AlQuran.cloud يُنسب نص القرآن إلى Tanzil.net، مع الإشارة إلى Quran Academy بخصوص النص العثماني المحرر. وفي نوريا تبقى الترجمات خلف قائمة ثقة منسقة داخل التطبيق؛ ومعظمها يُجلب عبر api.alquran.cloud، بينما تُجلب بعض الإصدارات المختارة مثل ترجمة مفتي تقي عثماني من api.quran.com. ولا تُقبل الإصدارات الجديدة القادمة من المصدر الخارجي تلقائيًا.',
        card_quran_point_1:
          'النص العربي للقرآن في نوريا يُقدَّم عبر api.alquran.cloud، والذي يذكر علنًا Tanzil.net كمصدر للنص وQuran Academy للنص العثماني المحرر.',
        card_quran_point_2:
          'الترجمات لا تؤخذ من تغذية مفتوحة؛ بل يستخدم نوريا قائمة ثقة منسقة، معظمها عبر api.alquran.cloud مع بعض الإصدارات المختارة من api.quran.com.',
        card_audio_title: 'التلاوة وتسليم الصوت',
        card_audio_text:
          'يتم تقديم تلاوات القرآن آية بآية عبر everyayah.com. ويستخدم نوريا فهرسًا صغيرًا ومنسقًا للقراء بدلًا من تغذية مفتوحة، ويشمل قراء مثل مشاري راشد العفاسي والسديس والشريم والمعيقلي والمنشاوي والحصري وعبد الباسط وهاني الرفاعي.',
        card_audio_point_1:
          'تسليم تلاوة القرآن آية بآية: everyayah.com.',
        card_audio_point_2:
          'القراء: فهرس منسق يشمل العفاسي والسديس والشريم والمعيقلي والمنشاوي والحصري وعبد الباسط وهاني الرفاعي.',
        card_devotional_title: 'الأدعية والأذكار والحديث والرقية',
        card_devotional_text:
          'تُنسق مجموعات نوريا التعبدية داخل بيانات التطبيق وتخزين المحتوى مع إرفاق المصدر بكل عنصر. وتشمل المراجع المذكورة آيات من القرآن ومجموعات حديث مثل صحيح البخاري وصحيح مسلم وجامع الترمذي وسنن أبي داود وابن ماجه.',
        card_devotional_point_1:
          'كل عنصر يحتفظ بمرجع مصدره داخل بيانات نوريا التعبدية أو تخزين المحتوى.',
        card_devotional_point_2:
          'تشمل عائلات المصادر المذكورة القرآن وصحيح البخاري وصحيح مسلم وجامع الترمذي وسنن أبي داود وابن ماجه.',
        card_prayer_title: 'مواقيت الصلاة والقبلة',
        card_prayer_text:
          'تُحسب مواقيت الصلاة عبر مكتبة adhan مع طرق اختيارية مثل رابطة العالم الإسلامي والمصرية وكراتشي وأم القرى ودبي ولجنة تحري الأهلة وأمريكا الشمالية والكويت وقطر وسنغافورة وتركيا وطهران. وتُحسب القبلة من موقعك باتجاه الكعبة في مكة باستخدام المسار الأعظم وحساسات الجهاز.',
        card_prayer_point_1:
          'حسابات الصلاة: مكتبة adhan مع طرق إقليمية قابلة للاختيار.',
        card_prayer_point_2:
          'القبلة: مسار أعظم من موقع الجهاز نحو الكعبة باستخدام حساسات الجهاز.',
        card_tafsir_title: 'أعمال التفسير المسماة فقط',
        card_tafsir_text:
          'ترتبط شروحات التفسير داخل التطبيق بفهرس محدد من العلماء والأعمال. وعندما يُولَّد التفسير يكون الطلب مقيدًا بالمصدر ومحصورًا في عمل التفسير المنشور المختار، ويعامل المواقع المجهولة والمنشورات الاجتماعية والمدونات والنصوص غير المنسوبة وملخصات الذكاء الاصطناعي على أنها غير موثوقة.',
        card_tafsir_point_1:
          'يُقصر توليد التفسير على الأعمال المسماة في فهرس العلماء داخل التطبيق.',
        card_tafsir_point_2:
          'تُعامل المواقع المجهولة والمدونات والمنشورات الاجتماعية ونصوص API غير المنسوبة وملخصات الذكاء الاصطناعي على أنها غير موثوقة.',
        card_ai_title: 'ضوابط Ask Nuria للذكاء الاصطناعي',
        card_ai_text:
          'يستخدم Ask Nuria طلبًا نظاميًا صارمًا وفحوصات خلفية. وتنص طبقة التعليمات على أن الإجابات يجب أن تعتمد فقط على القرآن والحديث الصحيح والصحابة والعلماء السنة المعترف بهم. كما تمنع الخلفية طلبات النصائح الطبية، والصحة النفسية وإيذاء النفس، والتطرف، وطلبات الفتاوى أو أحكام الحلال والحرام قبل التوليد.',
        card_ai_point_1:
          'نطاق مصادر الطلب: القرآن والحديث الصحيح والصحابة والعلماء السنة المعترف بهم.',
        card_ai_point_2:
          'يُحظر قبل التوليد: النصائح الطبية، والصحة النفسية وإيذاء النفس، والتطرف، وطلبات الفتوى أو أحكام الحلال والحرام.',
        card_ai_point_3:
          'الضوابط التشغيلية: يتم فرض App Check وتطبيق حدود للمعدل قبل إرجاع أي رد.',
        note_title: 'النطاق والحدود',
        note_text:
          'يستخدم نوريا مصادر علوية معروفة وضوابط مصادر منسقة بدلًا من المحتوى الديني المجهول أو المرسل من المستخدمين. ويُفصل النص العربي الأصلي وبيانات المصدر عن الترجمات المساندة المترجمة. وبالنسبة للفتاوى، والمسائل الصحية العاجلة، أو مواعيد المساجد الخاصة، فارجع إلى العلماء المؤهلين والمهنيين المرخصين والمساجد المحلية.',
        report_title: 'وجدت مشكلة في مصدر؟',
        report_text:
          'إذا لاحظت مرجعًا مكسورًا أو ترجمة غير دقيقة أو أي شيء يبدو غير صحيح، فتواصل معنا. نحن نفضل تصحيح المشكلة بسرعة على ترك مادة غير واضحة في مكانها.',
        report_link: 'تواصل مع الدعم',
        quote_text: '"رب زدني علما"',
        quote_ref: 'القرآن 20:114',
      },
    },
    ur: {
      footer: {
        sources: 'مآخذ',
      },
      pages: {
        sources_label: 'مآخذ',
        sources_title: 'مآخذ اور معیارات',
        sources_subtitle:
          'یہ صفحہ اُن حقیقی ماخذی نظاموں، مرتب مجموعوں اور سخت AI ضوابط کی وضاحت کرتا ہے جن پر Nuria میں قرآن، دعائیں، نماز tools، تفسیر اور reflections قائم ہیں.',
        doc_sources_title: 'مآخذ اور معیارات - نوریا',
        doc_sources_desc:
          'Nuria کے قرآن، دعاؤں، نماز tools، تفسیر اور reflections کے پیچھے موجود حقیقی source systems، مرتب collections اور سخت AI guardrails دیکھیں.',
      },
      sources: {
        intro_title:
          'Nuria مختلف نوعیت کی بنیادوں پر قائم ہے، اور ہم واضح کرنا چاہتے ہیں کہ کون سی چیز کس درجے کی ہے.',
        intro_text:
          'ایپ کے کچھ حصے نامزد Quran APIs یا ایپ کے اندر مرتب datasets سے آتے ہیں۔ کچھ آپ کے اپنے device پر calculate ہوتے ہیں۔ AI features سخت instruction اور blocking rules کے ساتھ چلتے ہیں۔ جہاں دقت یا شرعی حکم اہم ہو وہاں ایپ سہارا دے سکتی ہے، qualified local scholarship کا بدل نہیں بن سکتی۔',
        card_quran_title: 'قرآن کا متن اور تراجم',
        card_quran_text:
          'قرآن پڑھنے کا تجربہ عربی متن اور سورت metadata کے لیے api.alquran.cloud استعمال کرتا ہے۔ AlQuran.cloud کی اپنی public contributor credits میں قرآن کے متن کو Tanzil.net سے منسوب کیا گیا ہے اور edited Uthmanic text کے لیے Quran Academy کا ذکر کیا گیا ہے۔ Nuria میں تراجم ایک curated trust allowlist کے پیچھے رکھے جاتے ہیں؛ زیادہ تر api.alquran.cloud کے ذریعے آتے ہیں، جبکہ بعض منتخب editions جیسے مفتی تقی عثمانی api.quran.com سے لیے جاتے ہیں۔ نئے upstream editions خودکار طور پر شامل نہیں کیے جاتے۔',
        card_quran_point_1:
          'Nuria میں عربی قرآن کا متن api.alquran.cloud کے ذریعے آتا ہے، اور وہ publicly Tanzil.net کو متن کے لیے اور Quran Academy کو edited Uthmanic text کے لیے credit دیتا ہے۔',
        card_quran_point_2:
          'تراجم کسی کھلی feed سے نہیں لیے جاتے؛ Nuria ایک curated trust allowlist استعمال کرتی ہے، زیادہ تر api.alquran.cloud کے ذریعے اور بعض منتخب editions api.quran.com سے۔',
        card_audio_title: 'تلاوت اور آڈیو',
        card_audio_text:
          'قرآن کی آیت بہ آیت تلاوت everyayah.com کے ذریعے فراہم کی جاتی ہے۔ Nuria کھلی feed کے بجائے ایک چھوٹی curated reciter catalogue استعمال کرتی ہے، جس میں مشاری راشد العفاسی، السديس، الشريم، المعيقلي، المنشاوي، الحصري، عبدالباسط اور ہانی الرفاعی جیسے قاری شامل ہیں۔',
        card_audio_point_1:
          'آیت بہ آیت تلاوت کی فراہمی: everyayah.com.',
        card_audio_point_2:
          'قراء: مرتب catalogue جس میں العفاسی، السديس، الشريم، المعيقلي، المنشاوي، الحصري، عبدالباسط اور ہانی الرفاعی شامل ہیں۔',
        card_devotional_title: 'دعائیں، اذکار، حدیث اور رقیہ',
        card_devotional_text:
          'Nuria کے devotional collections ایپ data اور content storage میں curate کیے جاتے ہیں اور ہر item کے ساتھ source منسلک ہوتا ہے۔ حوالہ جات میں قرآنی آیات اور حدیث collections شامل ہیں جیسے صحیح البخاری، صحیح مسلم، جامع الترمذی، سنن ابی داود اور ابن ماجہ۔',
        card_devotional_point_1:
          'ہر item اپنا source reference Nuria کے devotional data یا content storage میں رکھتا ہے۔',
        card_devotional_point_2:
          'حوالہ جاتی ماخذ میں قرآن، صحیح البخاری، صحیح مسلم، جامع الترمذی، سنن ابی داود اور ابن ماجہ شامل ہیں۔',
        card_prayer_title: 'اوقات نماز اور قبلہ',
        card_prayer_text:
          'نماز کے اوقات adhan library کے ذریعے calculate ہوتے ہیں اور ان میں Muslim World League، Egyptian، Karachi، Umm al-Qura، Dubai، Moon Sighting Committee، North America، Kuwait، Qatar، Singapore، Turkey اور Tehran جیسے طریقے منتخب کیے جا سکتے ہیں۔ قبلہ آپ کی location سے مکہ میں کعبہ کی سمت device sensors اور great-circle bearing کے ذریعے نکالا جاتا ہے۔',
        card_prayer_point_1:
          'نماز کے حسابات: adhan library کے ذریعے منتخب علاقائی طریقوں کے ساتھ۔',
        card_prayer_point_2:
          'قبلہ: device location سے کعبہ کی سمت great-circle bearing اور device sensors کے ذریعے۔',
        card_tafsir_title: 'صرف نامزد تفسیر کے works',
        card_tafsir_text:
          'تفسیر explanations ایپ کے اندر نامزد scholars کے catalogue سے منسلک ہیں۔ جب tafsir generate ہوتی ہے تو prompt منتخب published tafsir work سے source locked ہوتی ہے اور anonymous websites، social posts، blogs، unattributed API text اور AI summaries کو غیر معتبر سمجھتی ہے۔',
        card_tafsir_point_1:
          'Tafsir generation کو ایپ کے scholar catalogue میں موجود نامزد works تک محدود رکھا جاتا ہے۔',
        card_tafsir_point_2:
          'گمنام websites، blogs، social posts، بے نسبت API text اور AI summaries کو غیر معتبر سمجھا جاتا ہے۔',
        card_ai_title: 'Ask Nuria کے AI guardrails',
        card_ai_text:
          'Ask Nuria ایک سخت system prompt اور backend checks استعمال کرتی ہے۔ instruction layer کہتی ہے کہ جواب صرف قرآن، authentic hadith، صحابہ اور recognised Sunni scholars سے اخذ کیے جائیں۔ backend generation سے پہلے medical advice، mental health اور self harm، extremism، اور fatwa یا halal-haram نوعیت کی ruling requests کو block کر دیتا ہے۔',
        card_ai_point_1:
          'Prompt source scope: قرآن، authentic hadith، صحابہ اور recognised Sunni scholars.',
        card_ai_point_2:
          'Generation سے پہلے block کیا جاتا ہے: medical advice، mental health اور self-harm، extremism، اور fatwa یا halal-haram نوعیت کے ruling requests.',
        card_ai_point_3:
          'Operational controls: جواب واپس آنے سے پہلے App Check نافذ ہوتا ہے اور rate limits لاگو ہوتی ہیں۔',
        note_title: 'دائرہ اور حدود',
        note_text:
          'Nuria گمنام یا user-submitted دینی مواد کے بجائے established upstreams اور curated source controls استعمال کرتی ہے۔ اصل عربی متن اور source references کو localized supporting translations سے الگ رکھا جاتا ہے۔ فتاویٰ، فوری صحت کے معاملات یا مسجد کے مخصوص اوقات کے لیے qualified scholars، licensed professionals اور local mosques سے رجوع کریں۔',
        report_title: 'کسی source میں مسئلہ ملا؟',
        report_text:
          'اگر آپ کو کوئی broken reference، غلط ترجمہ یا کوئی بھی مشکوک چیز نظر آئے تو ہم سے رابطہ کریں۔ ہم غیر واضح مواد چھوڑنے کے بجائے مسئلہ جلد درست کرنا پسند کرتے ہیں۔',
        report_link: 'سپورٹ سے رابطہ کریں',
        quote_text: '"اے میرے رب، میرے علم میں اضافہ فرما۔"',
        quote_ref: 'قرآن 20:114',
      },
    },
    id: {
      footer: {
        sources: 'Sumber',
      },
      pages: {
        sources_label: 'Sumber',
        sources_title: 'Sumber & Standar',
        sources_subtitle:
          'Halaman ini menjelaskan sistem sumber yang nyata, koleksi yang dikurasi, dan pagar pengaman AI yang ketat di balik Quran, doa, alat shalat, tafsir, dan reflections di Nuria.',
        doc_sources_title: 'Sumber & Standar - Nuria',
        doc_sources_desc:
          'Lihat sistem sumber yang nyata, koleksi yang dikurasi, dan pagar pengaman AI yang ketat di balik Quran, doa, alat shalat, tafsir, dan reflections di Nuria.',
      },
      sources: {
        intro_title:
          'Nuria dibangun di atas beberapa jenis fondasi, dan kami ingin jelas tentang perbedaan di antaranya.',
        intro_text:
          'Sebagian bagian aplikasi berasal dari API Quran yang disebut jelas atau dari dataset aplikasi yang dikurasi. Sebagian dihitung di perangkat Anda. Fitur AI dibungkus dengan instruksi dan aturan pemblokiran yang ketat. Ketika ketepatan atau hukum agama penting, aplikasi ini seharusnya membantu praktik, bukan menggantikan ulama lokal yang memenuhi syarat.',
        card_quran_title: 'Teks Quran dan terjemahan',
        card_quran_text:
          'Pengalaman membaca Quran menggunakan teks Arab dan metadata surah dari api.alquran.cloud. Dalam kredit kontributor publik AlQuran.cloud sendiri, teks Quran mereka dikaitkan dengan Tanzil.net, dengan Quran Academy diberi kredit untuk teks Utsmani yang telah diedit. Di Nuria, edisi terjemahan tetap berada di balik allowlist kepercayaan yang dikurasi; sebagian besar diambil melalui api.alquran.cloud, sedangkan edisi tertentu seperti Mufti Taqi Usmani diambil dari api.quran.com. Edisi upstream baru tidak diterima secara otomatis.',
        card_quran_point_1:
          'Teks Arab Quran di Nuria disajikan melalui api.alquran.cloud, yang secara publik mengkreditkan Tanzil.net untuk teksnya dan Quran Academy untuk teks Utsmani yang diedit.',
        card_quran_point_2:
          'Terjemahan tidak diambil dari feed terbuka; Nuria memakai allowlist kepercayaan yang dikurasi, terutama melalui api.alquran.cloud dengan edisi tertentu dari api.quran.com.',
        card_audio_title: 'Tilawah dan pengiriman audio',
        card_audio_text:
          'Audio tilawah Quran per ayat disajikan dari everyayah.com. Nuria memakai katalog qari yang kecil dan dikurasi, bukan feed terbuka, termasuk qari seperti Mishary Rashid Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit, dan Hani Ar-Rifai.',
        card_audio_point_1:
          'Pengiriman tilawah per ayat: everyayah.com.',
        card_audio_point_2:
          'Qari: katalog terkurasi termasuk Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit, dan Hani Ar-Rifai.',
        card_devotional_title: 'Doa, adhkar, hadith, dan ruqyah',
        card_devotional_text:
          'Koleksi ibadah Nuria dikurasi di data aplikasi dan penyimpanan konten dengan sumber yang dilampirkan pada setiap item. Rujukan yang dipakai mencakup ayat Quran dan kitab hadith seperti Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud, dan Ibn Majah.',
        card_devotional_point_1:
          'Setiap item menyimpan referensi sumbernya sendiri di data ibadah atau penyimpanan konten Nuria.',
        card_devotional_point_2:
          'Keluarga sumber yang dirujuk meliputi Quran, Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud, dan Ibn Majah.',
        card_prayer_title: 'Waktu shalat dan Kiblat',
        card_prayer_text:
          "Waktu shalat dihitung melalui pustaka adhan dengan metode yang bisa dipilih seperti Muslim World League, Egyptian, Karachi, Umm al-Qura, Dubai, Moon Sighting Committee, North America, Kuwait, Qatar, Singapore, Turkey, dan Tehran. Kiblat dihitung dari lokasi Anda menuju Ka'bah di Makkah menggunakan great-circle bearing dan sensor perangkat.",
        card_prayer_point_1:
          'Perhitungan shalat: pustaka adhan dengan metode regional yang bisa dipilih.',
        card_prayer_point_2:
          "Kiblat: great-circle bearing dari lokasi perangkat menuju Ka'bah, dengan sensor perangkat.",
        card_tafsir_title: 'Hanya karya tafsir bernama',
        card_tafsir_text:
          'Penjelasan tafsir terhubung ke katalog ulama bernama di dalam aplikasi. Saat tafsir dibuat, prompt dikunci pada karya tafsir terbitan yang dipilih dan secara eksplisit memperlakukan situs anonim, unggahan media sosial, blog, teks API tanpa atribusi, dan ringkasan AI sebagai sumber yang tidak tepercaya.',
        card_tafsir_point_1:
          'Pembuatan tafsir dibatasi pada karya bernama di katalog ulama aplikasi.',
        card_tafsir_point_2:
          'Situs anonim, blog, unggahan sosial, teks API tanpa atribusi, dan ringkasan AI diperlakukan sebagai tidak tepercaya.',
        card_ai_title: 'Pagar pengaman AI Ask Nuria',
        card_ai_text:
          'Ask Nuria menggunakan system prompt yang ketat dan pemeriksaan backend. Lapisan instruksi menyatakan bahwa jawaban hanya boleh bersandar pada Quran, hadith yang sahih, para Sahabat, dan ulama Sunni yang diakui. Backend memblokir nasihat medis, permintaan kesehatan mental dan self-harm, ekstremisme, serta permintaan fatwa atau penetapan halal-haram sebelum jawaban dihasilkan.',
        card_ai_point_1:
          'Cakupan sumber prompt: Quran, hadith sahih, para Sahabat, dan ulama Sunni yang diakui.',
        card_ai_point_2:
          'Diblokir sebelum jawaban dibuat: nasihat medis, kesehatan mental dan self-harm, ekstremisme, serta permintaan fatwa atau putusan halal-haram.',
        card_ai_point_3:
          'Kontrol operasional: App Check diberlakukan dan permintaan dibatasi dengan rate limit sebelum balasan dikirim.',
        note_title: 'Cakupan dan batasan',
        note_text:
          'Nuria menggunakan upstream yang mapan dan kontrol sumber yang dikurasi, bukan konten keagamaan anonim atau kiriman pengguna. Teks Arab asli dan rujukan sumber dipisahkan dari terjemahan pendukung yang dilokalkan. Untuk fatwa, urusan kesehatan mendesak, atau jadwal khusus masjid, andalkan ulama yang memenuhi syarat, tenaga profesional berlisensi, dan masjid setempat.',
        report_title: 'Menemukan masalah sumber?',
        report_text:
          'Jika Anda melihat rujukan yang rusak, terjemahan yang keliru, atau apa pun yang tampak tidak tepat, hubungi kami. Kami lebih memilih memperbaiki masalah dengan cepat daripada membiarkan materi yang tidak jelas tetap ada.',
        report_link: 'Hubungi dukungan',
        quote_text: '"Ya Tuhanku, tambahkanlah ilmuku."',
        quote_ref: 'Al-Quran 20:114',
      },
    },
    fr: {
      footer: {
        sources: 'Sources',
      },
      pages: {
        sources_label: 'Sources',
        sources_title: 'Sources et Standards',
        sources_subtitle:
          'Cette page explique les systèmes de sources concrets, les collections éditorialisées et les garde-fous IA stricts derrière le Coran, les duas, les outils de prière, le tafsir et les réflexions dans Nuria.',
        doc_sources_title: 'Sources et Standards - Nuria',
        doc_sources_desc:
          'Consultez les systèmes de sources concrets, les collections éditorialisées et les garde-fous IA stricts derrière le Coran, les duas, les outils de prière, le tafsir et les réflexions dans Nuria.',
      },
      sources: {
        intro_title:
          'Nuria repose sur plusieurs types de fondations, et nous voulons être clairs sur la nature de chacune.',
        intro_text:
          "Certaines parties de l'application proviennent d'API coraniques nommées ou de jeux de données intégrés et éditorialisés. D'autres sont calculées sur votre appareil. Les fonctions IA sont encadrées par des instructions strictes et des règles de blocage. Là où la précision ou les avis religieux comptent, l'application doit accompagner la pratique, pas remplacer une autorité savante locale qualifiée.",
        card_quran_title: 'Texte coranique et traductions',
        card_quran_text:
          "L'expérience de lecture du Coran utilise le texte arabe et les métadonnées des sourates de api.alquran.cloud. Dans les crédits publics d'AlQuran.cloud, leur texte coranique est attribué à Tanzil.net, tandis que Quran Academy est créditée pour le texte uthmanien édité. Dans Nuria, les éditions de traduction restent derrière une liste de confiance éditorialisée ; la plupart sont récupérées via api.alquran.cloud, tandis que certaines éditions sélectionnées, comme Mufti Taqi Usmani, sont récupérées via api.quran.com. Les nouvelles éditions amont ne sont pas admises automatiquement.",
        card_quran_point_1:
          "Le texte arabe du Coran dans Nuria est servi via api.alquran.cloud, qui crédite publiquement Tanzil.net pour le texte et Quran Academy pour le texte uthmanien édité.",
        card_quran_point_2:
          "Les traductions ne proviennent pas d'un flux ouvert ; Nuria utilise une liste de confiance éditorialisée, principalement via api.alquran.cloud avec certaines éditions sélectionnées depuis api.quran.com.",
        card_audio_title: 'Récitation et diffusion audio',
        card_audio_text:
          "L'audio de récitation coranique, verset par verset, est servi via everyayah.com. Nuria utilise un petit catalogue de récitateurs éditorialisé plutôt qu'un flux ouvert, avec notamment Mishary Rashid Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit et Hani Ar-Rifai.",
        card_audio_point_1:
          'Diffusion de la récitation verset par verset : everyayah.com.',
        card_audio_point_2:
          'Récitateurs : catalogue éditorialisé comprenant Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit et Hani Ar-Rifai.',
        card_devotional_title: 'Duas, adhkar, hadiths et ruqyah',
        card_devotional_text:
          "Les collections dévotionnelles de Nuria sont éditorialisées dans les données de l'application et le stockage de contenu, avec une source attachée à chaque élément. Les références citées incluent des versets coraniques et des recueils de hadiths tels que Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud et Ibn Majah.",
        card_devotional_point_1:
          "Chaque entrée conserve sa propre référence de source dans les données dévotionnelles ou le stockage de contenu de Nuria.",
        card_devotional_point_2:
          'Les familles de sources citées incluent le Coran, Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud et Ibn Majah.',
        card_prayer_title: 'Horaires de prière et Qibla',
        card_prayer_text:
          "Les horaires de prière sont calculés via la bibliothèque adhan avec des méthodes sélectionnables comme Muslim World League, Egyptian, Karachi, Umm al-Qura, Dubai, Moon Sighting Committee, North America, Kuwait, Qatar, Singapore, Turkey et Tehran. La Qibla est calculée depuis votre position vers la Kaaba à La Mecque à l'aide du grand cercle et des capteurs de l'appareil.",
        card_prayer_point_1:
          'Calculs de prière : bibliothèque adhan avec méthodes régionales sélectionnables.',
        card_prayer_point_2:
          "Qibla : cap du grand cercle depuis la position de l'appareil vers la Kaaba, avec les capteurs de l'appareil.",
        card_tafsir_title: 'Uniquement des ouvrages de tafsir nommés',
        card_tafsir_text:
          "Les explications de tafsir sont liées à un catalogue interne d'auteurs et d'ouvrages nommés. Lorsqu'un tafsir est généré, le prompt est verrouillé sur l'ouvrage publié sélectionné et considère explicitement les sites anonymes, publications sociales, blogs, textes d'API non attribués et résumés IA comme non fiables.",
        card_tafsir_point_1:
          "La génération de tafsir est limitée aux ouvrages nommés du catalogue savant de l'application.",
        card_tafsir_point_2:
          "Les sites anonymes, blogs, publications sociales, textes d'API non attribués et résumés IA sont traités comme non fiables.",
        card_ai_title: 'Garde-fous IA de Ask Nuria',
        card_ai_text:
          "Ask Nuria utilise un system prompt strict et des vérifications côté serveur. La couche d'instructions dit que les réponses doivent s'appuyer uniquement sur le Coran, les hadiths authentifiés, les Compagnons et des savants sunnites reconnus. Le backend bloque les conseils médicaux, les demandes liées à la santé mentale et à l'automutilation, l'extrémisme, ainsi que les demandes de fatwa ou de jugement halal-haram avant la génération.",
        card_ai_point_1:
          'Périmètre des sources du prompt : Coran, hadiths authentifiés, Compagnons et savants sunnites reconnus.',
        card_ai_point_2:
          'Bloqué avant génération : conseils médicaux, santé mentale et automutilation, extrémisme, et demandes de fatwa ou de jugement halal-haram.',
        card_ai_point_3:
          "Contrôles opérationnels : App Check est appliqué et les requêtes sont limitées avant qu'une réponse soit renvoyée.",
        note_title: 'Portée et limites',
        note_text:
          "Nuria utilise des sources amont établies et des contrôles de sources éditorialisés plutôt qu'un contenu religieux anonyme ou soumis par les utilisateurs. Le texte arabe original et les références de source sont conservés séparément des traductions d'appui localisées. Pour les fatwas, les urgences de santé ou les horaires propres à une mosquée, fiez-vous à des savants qualifiés, des professionnels habilités et aux mosquées locales.",
        report_title: 'Vous avez trouvé un problème de source ?',
        report_text:
          "Si vous repérez une référence cassée, une mauvaise traduction ou quoi que ce soit de douteux, contactez-nous. Nous préférons corriger rapidement un problème plutôt que laisser en place un contenu flou.",
        report_link: 'Contacter le support',
        quote_text: '"Mon Seigneur, accrois-moi en savoir."',
        quote_ref: 'Coran 20:114',
      },
    },
    tr: {
      footer: {
        sources: 'Kaynaklar',
      },
      pages: {
        sources_label: 'Kaynaklar',
        sources_title: 'Kaynaklar ve Standartlar',
        sources_subtitle:
          "Bu sayfa, Nuria'daki Kuran, dualar, namaz araçları, tefsir ve tefekkürlerin arkasındaki somut kaynak sistemlerini, kürasyonlu koleksiyonları ve sıkı AI güvenlik sınırlarını açıklar.",
        doc_sources_title: 'Kaynaklar ve Standartlar - Nuria',
        doc_sources_desc:
          "Nuria'daki Kuran, dualar, namaz araçları, tefsir ve tefekkürlerin arkasındaki somut kaynak sistemlerini, kürasyonlu koleksiyonları ve sıkı AI güvenlik sınırlarını görün.",
      },
      sources: {
        intro_title:
          'Nuria farklı türde temeller üzerine kuruludur ve hangisinin ne olduğunu açıkça belirtmek istiyoruz.',
        intro_text:
          "Uygulamanın bazı bölümleri adı açıkça belli olan Quran API'lerinden veya uygulama içi kürasyonlu veri setlerinden gelir. Bazıları cihazınızda hesaplanır. AI özellikleri sıkı talimatlar ve engelleme kurallarıyla çevrelenmiştir. Hassasiyetin veya dini hükmün önemli olduğu yerlerde uygulama ibadeti desteklemeli, yetkin yerel ilim ehlinin yerini almamalıdır.",
        card_quran_title: 'Kuran metni ve mealler',
        card_quran_text:
          "Kuran okuma deneyimi Arapça metni ve sure metadata'sını api.alquran.cloud üzerinden kullanır. AlQuran.cloud'un kendi herkese açık katkı kayıtlarında Kuran metni Tanzil.net'e atfedilir ve düzenlenmiş Osmanlı metni için Quran Academy'ye kredi verilir. Nuria'da meal sürümleri kürasyonlu bir güven allowlist'i arkasında tutulur; çoğu api.alquran.cloud üzerinden gelirken Mufti Taqi Usmani gibi seçili sürümler api.quran.com üzerinden alınır. Yeni upstream sürümler otomatik olarak eklenmez.",
        card_quran_point_1:
          "Nuria'daki Arapça Kuran metni api.alquran.cloud üzerinden sunulur; bu servis metin için Tanzil.net'i ve düzenlenmiş Osmanlı metni için Quran Academy'yi herkese açık biçimde kredilendirir.",
        card_quran_point_2:
          "Mealler açık bir akıştan alınmaz; Nuria, ağırlıklı olarak api.alquran.cloud ve seçili sürümler için api.quran.com kullanan kürasyonlu bir güven allowlist'i kullanır.",
        card_audio_title: 'Tilavet ve ses sunumu',
        card_audio_text:
          'Ayet bazlı Kuran tilaveti sesi everyayah.com üzerinden sunulur. Nuria açık bir akış yerine küçük ve kürasyonlu bir kariler kataloğu kullanır; buna Mishary Rashid Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit ve Hani Ar-Rifai gibi kariler dahildir.',
        card_audio_point_1:
          'Ayet bazlı tilavet sunumu: everyayah.com.',
        card_audio_point_2:
          "Kariler: Alafasy, Al-Sudais, Al-Shuraim, Al-Muaiqly, Al-Minshawi, Al-Husary, Abdul Basit ve Hani Ar-Rifai'yi içeren kürasyonlu katalog.",
        card_devotional_title: 'Dualar, adhkar, hadis ve rukye',
        card_devotional_text:
          "Nuria'nın ibadet koleksiyonları uygulama verisinde ve içerik depolamasında kürasyonlu olarak tutulur ve her öğeye bir kaynak eklenir. Atıf yapılan referanslar arasında Kuran ayetleri ve Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud ve Ibn Majah gibi hadis koleksiyonları vardır.",
        card_devotional_point_1:
          "Her içerik, Nuria'nın ibadet verisi veya içerik depolaması içinde kendi kaynak referansını taşır.",
        card_devotional_point_2:
          'Atıf yapılan kaynak aileleri arasında Kuran, Sahih al-Bukhari, Sahih Muslim, Jami al-Tirmidhi, Sunan Abi Dawud ve Ibn Majah bulunur.',
        card_prayer_title: 'Namaz vakitleri ve kıble',
        card_prayer_text:
          "Namaz vakitleri, Muslim World League, Egyptian, Karachi, Umm al-Qura, Dubai, Moon Sighting Committee, North America, Kuwait, Qatar, Singapore, Turkey ve Tehran gibi seçilebilir yöntemlerle adhan kütüphanesi üzerinden hesaplanır. Kıble, cihaz sensörleri ve great-circle bearing kullanılarak bulunduğunuz konumdan Mekke'deki Kabe'ye doğru hesaplanır.",
        card_prayer_point_1:
          'Namaz hesaplamaları: seçilebilir bölgesel yöntemlerle adhan kütüphanesi.',
        card_prayer_point_2:
          'Kıble: cihaz konumundan Kabe’ye doğru, cihaz sensörleri kullanılarak great-circle bearing ile hesaplanır.',
        card_tafsir_title: 'Yalnızca adı belli tefsir eserleri',
        card_tafsir_text:
          "Tefsir açıklamaları uygulama içindeki adı belli alim ve eser kataloğuna bağlıdır. Tefsir üretildiğinde prompt, seçilen yayımlanmış tefsir eserine source locked olur ve anonim siteleri, sosyal medya paylaşımlarını, blogları, kaynağı belirsiz API metinlerini ve AI özetlerini açıkça güvenilmez sayar.",
        card_tafsir_point_1:
          "Tefsir üretimi uygulamanın alim kataloğundaki adı belli eserlerle sınırlandırılır.",
        card_tafsir_point_2:
          'Anonim siteler, bloglar, sosyal paylaşımlar, kaynağı belirsiz API metinleri ve AI özetleri güvenilmez kabul edilir.',
        card_ai_title: 'Ask Nuria AI güvenlik sınırları',
        card_ai_text:
          'Ask Nuria sıkı bir system prompt ve backend kontrolleri kullanır. Talimat katmanı, cevapların yalnızca Kuran, sahih hadis, Sahabe ve tanınmış Sünni alimlerden beslenmesi gerektiğini söyler. Backend, tıbbi tavsiyeleri, ruh sağlığı ve self-harm taleplerini, aşırılıkçılığı ve fetva ya da helal-haram tarzı hüküm taleplerini üretimden önce engeller.',
        card_ai_point_1:
          'Prompt kaynak kapsamı: Kuran, sahih hadis, Sahabe ve tanınmış Sünni alimler.',
        card_ai_point_2:
          'Üretimden önce engellenenler: tıbbi tavsiye, ruh sağlığı ve self-harm, aşırılıkçılık, ayrıca fetva ya da helal-haram hüküm talepleri.',
        card_ai_point_3:
          'Operasyonel kontroller: yanıt dönmeden önce App Check uygulanır ve istekler rate limit ile sınırlandırılır.',
        note_title: 'Kapsam ve sınırlar',
        note_text:
          'Nuria anonim veya kullanıcı gönderimli dini içerikler yerine yerleşik upstream kaynaklar ve kürasyonlu kaynak kontrolleri kullanır. Orijinal Arapça metin ve kaynak referansları, yerelleştirilmiş destek çevirilerinden ayrı tutulur. Fetvalar, acil sağlık meseleleri veya camiye özgü vakitler için yetkin alimlere, lisanslı profesyonellere ve yerel camilere başvurun.',
        report_title: 'Bir kaynak sorunu mu buldunuz?',
        report_text:
          'Kırık bir referans, hatalı çeviri ya da şüpheli görünen herhangi bir şey fark ederseniz bize ulaşın. Belirsiz bir içeriği bırakmaktansa sorunu hızla düzeltmeyi tercih ederiz.',
        report_link: 'Desteğe ulaşın',
        quote_text: '"Rabbim, ilmimi artır."',
        quote_ref: "Kur'an 20:114",
      },
    },
  };

  function mergeInto(target, patch) {
    Object.keys(patch).forEach((key) => {
      const value = patch[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {};
        }
        mergeInto(target[key], value);
        return;
      }
      target[key] = value;
    });
  }

  Object.keys(PATCH).forEach((lang) => {
    if (!T[lang]) T[lang] = {};
    mergeInto(T[lang], PATCH[lang]);
  });

  if (typeof applyLang === 'function' && typeof getLang === 'function') {
    applyLang(getLang());
  }
}());
