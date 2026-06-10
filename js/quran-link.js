(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
    return;
  }

  root.NuriaQuranLink = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  // Transliterated surah names, index 0 = surah 1. Ayah counts let us reject
  // links that point past the end of a surah.
  const SURAHS = [
    ['Al-Fatihah', 7], ['Al-Baqarah', 286], ["Ali 'Imran", 200], ['An-Nisa', 176],
    ["Al-Ma'idah", 120], ["Al-An'am", 165], ["Al-A'raf", 206], ['Al-Anfal', 75],
    ['At-Tawbah', 129], ['Yunus', 109], ['Hud', 123], ['Yusuf', 111],
    ["Ar-Ra'd", 43], ['Ibrahim', 52], ['Al-Hijr', 99], ['An-Nahl', 128],
    ['Al-Isra', 111], ['Al-Kahf', 110], ['Maryam', 98], ['Taha', 135],
    ['Al-Anbya', 112], ['Al-Hajj', 78], ["Al-Mu'minun", 118], ['An-Nur', 64],
    ['Al-Furqan', 77], ["Ash-Shu'ara", 227], ['An-Naml', 93], ['Al-Qasas', 88],
    ['Al-Ankabut', 69], ['Ar-Rum', 60], ['Luqman', 34], ['As-Sajdah', 30],
    ['Al-Ahzab', 73], ['Saba', 54], ['Fatir', 45], ['Ya-Sin', 83],
    ['As-Saffat', 182], ['Sad', 88], ['Az-Zumar', 75], ['Ghafir', 85],
    ['Fussilat', 54], ['Ash-Shuraa', 53], ['Az-Zukhruf', 89], ['Ad-Dukhan', 59],
    ['Al-Jathiyah', 37], ['Al-Ahqaf', 35], ['Muhammad', 38], ['Al-Fath', 29],
    ['Al-Hujurat', 18], ['Qaf', 45], ['Adh-Dhariyat', 60], ['At-Tur', 49],
    ['An-Najm', 62], ['Al-Qamar', 55], ['Ar-Rahman', 78], ["Al-Waqi'ah", 96],
    ['Al-Hadid', 29], ['Al-Mujadila', 22], ['Al-Hashr', 24], ['Al-Mumtahanah', 13],
    ['As-Saf', 14], ["Al-Jumu'ah", 11], ['Al-Munafiqun', 11], ['At-Taghabun', 18],
    ['At-Talaq', 12], ['At-Tahrim', 12], ['Al-Mulk', 30], ['Al-Qalam', 52],
    ['Al-Haqqah', 52], ["Al-Ma'arij", 44], ['Nuh', 28], ['Al-Jinn', 28],
    ['Al-Muzzammil', 20], ['Al-Muddaththir', 56], ['Al-Qiyamah', 40], ['Al-Insan', 31],
    ['Al-Mursalat', 50], ['An-Naba', 40], ["An-Nazi'at", 46], ['Abasa', 42],
    ['At-Takwir', 29], ['Al-Infitar', 19], ['Al-Mutaffifin', 36], ['Al-Inshiqaq', 25],
    ['Al-Buruj', 22], ['At-Tariq', 17], ["Al-A'la", 19], ['Al-Ghashiyah', 26],
    ['Al-Fajr', 30], ['Al-Balad', 20], ['Ash-Shams', 15], ['Al-Layl', 21],
    ['Ad-Duhaa', 11], ['Ash-Sharh', 8], ['At-Tin', 8], ["Al-'Alaq", 19],
    ['Al-Qadr', 5], ['Al-Bayyinah', 8], ['Az-Zalzalah', 8], ["Al-'Adiyat", 11],
    ["Al-Qari'ah", 11], ['At-Takathur', 8], ["Al-'Asr", 3], ['Al-Humazah', 9],
    ['Al-Fil', 5], ['Quraysh', 4], ["Al-Ma'un", 7], ['Al-Kawthar', 3],
    ['Al-Kafirun', 6], ['An-Nasr', 3], ['Al-Masad', 5], ['Al-Ikhlas', 4],
    ['Al-Falaq', 5], ['An-Nas', 6],
  ];

  function surahName(number) {
    const entry = SURAHS[number - 1];
    return entry ? entry[0] : '';
  }

  function ayahCount(number) {
    const entry = SURAHS[number - 1];
    return entry ? entry[1] : 0;
  }

  /// Accepts `/quran/<surah>/<ayah>` paths and `?s=&a=` query params.
  /// Returns { surah, ayah, name } or null.
  function parseVerseFromLocation(locationLike) {
    const locationRef = locationLike || {};
    const path = String(locationRef.pathname || '');
    const params = new URLSearchParams(locationRef.search || '');

    let surah = NaN;
    let ayah = NaN;

    const match = path.match(/^\/quran\/(\d{1,3})\/(\d{1,3})(?:\/)?$/i);
    if (match) {
      surah = parseInt(match[1], 10);
      ayah = parseInt(match[2], 10);
    } else {
      surah = parseInt(params.get('s') || '', 10);
      ayah = parseInt(params.get('a') || '', 10);
    }

    if (!Number.isInteger(surah) || !Number.isInteger(ayah)) return null;
    if (surah < 1 || surah > 114) return null;
    if (ayah < 1 || ayah > ayahCount(surah)) return null;

    return { surah, ayah, name: surahName(surah) };
  }

  /// 404 helper: turns `/quran/<s>/<a>` into the canonical landing-page URL
  /// `/quran/?s=<s>&a=<a>`. Returns null when the path is not a verse link
  /// (so other 404 routing keeps working).
  function buildQuranRedirectUrl(locationLike) {
    const locationRef = locationLike || {};
    const path = String(locationRef.pathname || '');
    if (!/^\/quran\//i.test(path)) return null;

    const verse = parseVerseFromLocation(locationRef);
    if (!verse) return '/quran/';

    return `/quran/?s=${verse.surah}&a=${verse.ayah}`;
  }

  function buildSchemeUrl(verse, scheme) {
    const appScheme = scheme || 'nuria';
    if (!verse) return `${appScheme}://quran`;
    return `${appScheme}://quran/${verse.surah}/${verse.ayah}`;
  }

  return {
    parseVerseFromLocation,
    buildQuranRedirectUrl,
    buildSchemeUrl,
    surahName,
    ayahCount,
  };
}));
