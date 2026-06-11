# Adds the /invite (friend referral) landing page keys to all six site
# locale files. Idempotent: re-running simply rewrites the same values.
import collections
import json
import os

KEYS = {
    "en": {
        "invite.meta_title": "You're invited to Nuria",
        "invite.meta_desc": "A friend invited you to Nuria — Quran, prayer times, duas and daily Islamic guidance. Join through their link and you both receive bonus reflections.",
        "invite.hero_label": "Invitation",
        "invite.hero_title": "A friend invited you to Nuria",
        "invite.hero_subtitle": "Quran, prayer times, duas and daily guidance in one beautiful app — and you both receive bonus reflections when you join.",
        "invite.card_kicker": "Friend invite",
        "invite.card_title": "Accept the invitation in Nuria",
        "invite.card_copy": "If Nuria does not open automatically, tap the button below. If the app is not installed yet, download Nuria first and open this link again — your invite is applied automatically.",
        "invite.open_cta": "Open in Nuria",
        "invite.retry_cta": "Try again",
        "invite.status_ready": "Ready to open Nuria.",
        "invite.status_opening": "Opening Nuria...",
        "invite.status_fallback": "If Nuria did not open, install it from the store buttons below — your invite is applied automatically on first launch.",
        "invite.aside_label": "Why Nuria",
        "invite.aside_title": "One companion for your deen",
        "invite.aside_copy": "Full Quran with tajweed, tafsir and word-by-word audio, accurate prayer times with adhan, qibla, duas, dhikr and personal reflections — free, in more than 100 languages.",
        "invite.fact_1_title": "You both win",
        "invite.fact_1_text": "Joining through an invite gives bonus reflections to you and your friend.",
        "invite.fact_2_title": "Free to use",
        "invite.fact_2_text": "No account needed to start — sign in when you want to keep progress.",
    },
    "ar": {
        "invite.meta_title": "لديك دعوة إلى نوريا",
        "invite.meta_desc": "دعاك صديق إلى نوريا — القرآن ومواقيت الصلاة والأدعية والإرشاد اليومي. انضم عبر رابطه وستحصلان معًا على تأملات إضافية.",
        "invite.hero_label": "دعوة",
        "invite.hero_title": "دعاك صديق إلى نوريا",
        "invite.hero_subtitle": "القرآن ومواقيت الصلاة والأدعية والإرشاد اليومي في تطبيق واحد جميل — وتحصلان معًا على تأملات إضافية عند انضمامك.",
        "invite.card_kicker": "دعوة صديق",
        "invite.card_title": "اقبل الدعوة في نوريا",
        "invite.card_copy": "إذا لم يُفتح نوريا تلقائيًا، اضغط على الزر أدناه. وإذا لم يكن التطبيق مثبتًا بعد، حمّل نوريا أولًا ثم افتح هذا الرابط مرة أخرى — تُطبَّق دعوتك تلقائيًا.",
        "invite.open_cta": "افتح في نوريا",
        "invite.retry_cta": "حاول مرة أخرى",
        "invite.status_ready": "جاهز لفتح نوريا.",
        "invite.status_opening": "جارٍ فتح نوريا...",
        "invite.status_fallback": "إذا لم يُفتح نوريا، ثبّته من أزرار المتجر أدناه — تُطبَّق دعوتك تلقائيًا عند أول تشغيل.",
        "invite.aside_label": "لماذا نوريا",
        "invite.aside_title": "رفيق واحد لدينك",
        "invite.aside_copy": "القرآن كاملًا بألوان التجويد والتفسير والصوت كلمة بكلمة، ومواقيت صلاة دقيقة مع الأذان، والقبلة، والأدعية، والأذكار، وتأملات شخصية — مجانًا وبأكثر من 100 لغة.",
        "invite.fact_1_title": "تربحان معًا",
        "invite.fact_1_text": "الانضمام عبر دعوة يمنح تأملات إضافية لك ولصديقك.",
        "invite.fact_2_title": "مجاني للاستخدام",
        "invite.fact_2_text": "لا حاجة لحساب للبدء — سجّل الدخول متى أردت حفظ تقدمك.",
    },
    "fr": {
        "invite.meta_title": "Vous êtes invité sur Nuria",
        "invite.meta_desc": "Un ami vous a invité sur Nuria — Coran, horaires de prière, douas et guidance quotidienne. Rejoignez via son lien et vous recevez tous les deux des réflexions bonus.",
        "invite.hero_label": "Invitation",
        "invite.hero_title": "Un ami vous a invité sur Nuria",
        "invite.hero_subtitle": "Coran, horaires de prière, douas et guidance quotidienne dans une seule belle application — et vous recevez tous les deux des réflexions bonus.",
        "invite.card_kicker": "Invitation d'un ami",
        "invite.card_title": "Acceptez l'invitation dans Nuria",
        "invite.card_copy": "Si Nuria ne s'ouvre pas automatiquement, appuyez sur le bouton ci-dessous. Si l'application n'est pas encore installée, téléchargez d'abord Nuria puis rouvrez ce lien — votre invitation s'applique automatiquement.",
        "invite.open_cta": "Ouvrir dans Nuria",
        "invite.retry_cta": "Réessayer",
        "invite.status_ready": "Prêt à ouvrir Nuria.",
        "invite.status_opening": "Ouverture de Nuria...",
        "invite.status_fallback": "Si Nuria ne s'est pas ouvert, installez l'application via les boutons ci-dessous — votre invitation s'applique au premier lancement.",
        "invite.aside_label": "Pourquoi Nuria",
        "invite.aside_title": "Un seul compagnon pour votre dîn",
        "invite.aside_copy": "Coran complet avec tajwid, tafsir et audio mot à mot, horaires de prière précis avec adhan, qibla, douas, dhikr et réflexions personnelles — gratuit, en plus de 100 langues.",
        "invite.fact_1_title": "Vous gagnez tous les deux",
        "invite.fact_1_text": "Rejoindre via une invitation offre des réflexions bonus à vous et à votre ami.",
        "invite.fact_2_title": "Gratuit",
        "invite.fact_2_text": "Aucun compte requis pour commencer — connectez-vous quand vous voulez conserver votre progression.",
    },
    "id": {
        "invite.meta_title": "Anda diundang ke Nuria",
        "invite.meta_desc": "Seorang teman mengundang Anda ke Nuria — Al-Qur'an, jadwal sholat, doa, dan bimbingan harian. Bergabunglah lewat tautannya dan kalian berdua mendapat refleksi bonus.",
        "invite.hero_label": "Undangan",
        "invite.hero_title": "Seorang teman mengundang Anda ke Nuria",
        "invite.hero_subtitle": "Al-Qur'an, jadwal sholat, doa, dan bimbingan harian dalam satu aplikasi indah — dan kalian berdua mendapat refleksi bonus saat Anda bergabung.",
        "invite.card_kicker": "Undangan teman",
        "invite.card_title": "Terima undangan di Nuria",
        "invite.card_copy": "Jika Nuria tidak terbuka otomatis, ketuk tombol di bawah. Jika aplikasi belum terpasang, unduh Nuria terlebih dahulu lalu buka tautan ini lagi — undangan Anda diterapkan otomatis.",
        "invite.open_cta": "Buka di Nuria",
        "invite.retry_cta": "Coba lagi",
        "invite.status_ready": "Siap membuka Nuria.",
        "invite.status_opening": "Membuka Nuria...",
        "invite.status_fallback": "Jika Nuria tidak terbuka, pasang lewat tombol toko di bawah — undangan Anda diterapkan otomatis saat pertama dibuka.",
        "invite.aside_label": "Mengapa Nuria",
        "invite.aside_title": "Satu pendamping untuk din Anda",
        "invite.aside_copy": "Al-Qur'an lengkap dengan tajwid, tafsir, dan audio kata per kata, jadwal sholat akurat dengan adzan, kiblat, doa, dzikir, dan refleksi pribadi — gratis, dalam 100+ bahasa.",
        "invite.fact_1_title": "Kalian berdua untung",
        "invite.fact_1_text": "Bergabung lewat undangan memberi refleksi bonus untuk Anda dan teman Anda.",
        "invite.fact_2_title": "Gratis digunakan",
        "invite.fact_2_text": "Tidak perlu akun untuk memulai — masuk kapan pun Anda ingin menyimpan progres.",
    },
    "tr": {
        "invite.meta_title": "Nuria'ya davet edildiniz",
        "invite.meta_desc": "Bir arkadaşınız sizi Nuria'ya davet etti — Kur'an, namaz vakitleri, dualar ve günlük rehberlik. Bağlantısıyla katılın, ikiniz de bonus yansımalar kazanın.",
        "invite.hero_label": "Davet",
        "invite.hero_title": "Bir arkadaşınız sizi Nuria'ya davet etti",
        "invite.hero_subtitle": "Kur'an, namaz vakitleri, dualar ve günlük rehberlik tek bir güzel uygulamada — katıldığınızda ikiniz de bonus yansımalar kazanırsınız.",
        "invite.card_kicker": "Arkadaş daveti",
        "invite.card_title": "Daveti Nuria'da kabul edin",
        "invite.card_copy": "Nuria otomatik olarak açılmazsa aşağıdaki düğmeye dokunun. Uygulama henüz yüklü değilse önce Nuria'yı indirin ve bu bağlantıyı tekrar açın — davetiniz otomatik uygulanır.",
        "invite.open_cta": "Nuria'da aç",
        "invite.retry_cta": "Tekrar dene",
        "invite.status_ready": "Nuria açılmaya hazır.",
        "invite.status_opening": "Nuria açılıyor...",
        "invite.status_fallback": "Nuria açılmadıysa aşağıdaki mağaza düğmelerinden yükleyin — davetiniz ilk açılışta otomatik uygulanır.",
        "invite.aside_label": "Neden Nuria",
        "invite.aside_title": "Dininiz için tek yol arkadaşı",
        "invite.aside_copy": "Tecvid, tefsir ve kelime kelime sesli tam Kur'an, ezanlı doğru namaz vakitleri, kıble, dualar, zikir ve kişisel yansımalar — ücretsiz, 100'den fazla dilde.",
        "invite.fact_1_title": "İkiniz de kazanırsınız",
        "invite.fact_1_text": "Davetle katılmak size ve arkadaşınıza bonus yansımalar kazandırır.",
        "invite.fact_2_title": "Kullanımı ücretsiz",
        "invite.fact_2_text": "Başlamak için hesap gerekmez — ilerlemenizi saklamak istediğinizde giriş yapın.",
    },
    "ur": {
        "invite.meta_title": "آپ کو نوریا میں مدعو کیا گیا ہے",
        "invite.meta_desc": "ایک دوست نے آپ کو نوریا میں مدعو کیا — قرآن، نماز کے اوقات، دعائیں اور روزانہ رہنمائی۔ ان کے لنک سے شامل ہوں اور آپ دونوں کو بونس ریفلیکشنز ملیں گی۔",
        "invite.hero_label": "دعوت",
        "invite.hero_title": "ایک دوست نے آپ کو نوریا میں مدعو کیا",
        "invite.hero_subtitle": "قرآن، نماز کے اوقات، دعائیں اور روزانہ رہنمائی ایک خوبصورت ایپ میں — اور شامل ہونے پر آپ دونوں کو بونس ریفلیکشنز ملتی ہیں۔",
        "invite.card_kicker": "دوست کی دعوت",
        "invite.card_title": "نوریا میں دعوت قبول کریں",
        "invite.card_copy": "اگر نوریا خود بخود نہ کھلے تو نیچے دیا گیا بٹن دبائیں۔ اگر ایپ ابھی انسٹال نہیں ہے تو پہلے نوریا ڈاؤن لوڈ کریں اور یہ لنک دوبارہ کھولیں — آپ کی دعوت خود بخود لاگو ہو جائے گی۔",
        "invite.open_cta": "نوریا میں کھولیں",
        "invite.retry_cta": "دوبارہ کوشش کریں",
        "invite.status_ready": "نوریا کھولنے کے لیے تیار۔",
        "invite.status_opening": "نوریا کھل رہا ہے...",
        "invite.status_fallback": "اگر نوریا نہ کھلے تو نیچے اسٹور بٹنوں سے انسٹال کریں — پہلی بار کھولنے پر آپ کی دعوت خود بخود لاگو ہو جائے گی۔",
        "invite.aside_label": "نوریا کیوں",
        "invite.aside_title": "آپ کے دین کا ایک ساتھی",
        "invite.aside_copy": "تجوید، تفسیر اور لفظ بہ لفظ آڈیو کے ساتھ مکمل قرآن، اذان کے ساتھ درست نماز کے اوقات، قبلہ، دعائیں، ذکر اور ذاتی ریفلیکشنز — مفت، 100 سے زائد زبانوں میں۔",
        "invite.fact_1_title": "دونوں کا فائدہ",
        "invite.fact_1_text": "دعوت کے ذریعے شامل ہونے پر آپ اور آپ کے دوست دونوں کو بونس ریفلیکشنز ملتی ہیں۔",
        "invite.fact_2_title": "استعمال مفت ہے",
        "invite.fact_2_text": "شروع کرنے کے لیے اکاؤنٹ ضروری نہیں — جب چاہیں سائن ان کر کے اپنی پیش رفت محفوظ رکھیں۔",
    },
}


def main() -> None:
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for lang, additions in KEYS.items():
        path = os.path.join(root, "l10n", f"site_{lang}.arb")
        with open(path, encoding="utf-8") as f:
            data = json.load(f, object_pairs_hook=collections.OrderedDict)
        data.update(additions)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        total = len([k for k in data if not k.startswith("@")])
        print(f"{lang}: now {total} keys")


if __name__ == "__main__":
    main()
