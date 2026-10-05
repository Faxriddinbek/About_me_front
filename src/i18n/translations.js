/**
 * UI copy in both supported languages.
 *
 * Only *interface* text lives here. Project and media content is bilingual in
 * the database and resolved server-side via `?lang=`, so it never appears in
 * this file.
 */

export const LANGS = ['uz', 'en']

export const translations = {
  uz: {
    kicker: 'Python Backend Dasturchi',
    heading: 'Salom, men Faxriddinbek',
    subtitle: 'Men Python yordamida tez va kengaytiriladigan backend tizimlar quraman.',
    viewProjects: 'Loyihalarni ko‘rish',
    contact: 'Bog‘lanish',

    projEyebrow: 'LOYIHALAR',
    projTitle: 'Tanlangan ishlar',
    projSubtitle: 'Men yaratgan backend tizimlar, API’lar va vositalar to‘plami.',
    projEmpty: 'Hozircha loyihalar qo‘shilmagan',
    projError: 'Loyihalarni yuklab bo‘lmadi',

    conEyebrow: 'BOG‘LANISH',
    conTitle: 'Keling, birga ishlaymiz',
    conSubtitle: 'Loyihangiz bormi? Menga xabar yuboring.',
    conName: 'Ismingiz',
    conEmail: 'Email',
    conMessage: 'Xabaringiz',
    conSend: 'Xabar yuborish',
    conSending: 'Yuborilmoqda...',
    conSuccess: 'Xabaringiz yuborildi. Tez orada javob beraman.',
    conError: 'Xabar yuborilmadi. Qaytadan urinib ko‘ring.',
    conRateLimited: 'Juda ko‘p urinish. Bir soatdan keyin qayta yuboring.',
    nameErr: 'Ismingizni kiriting',
    emailErr: 'Email noto‘g‘ri',
    msgErr: 'Xabar kamida 10 ta belgidan iborat bo‘lishi kerak',

    medEyebrow: 'MEDIA',
    medTitle: 'Galereya',
    medSubtitle: 'Suratlar va videolar to‘plami.',
    medAll: 'Barchasi',
    medPhotos: 'Suratlar',
    medVideos: 'Videolar',
    medEmpty: 'Hozircha media yo‘q',
    medError: 'Mediani yuklab bo‘lmadi',

    retry: 'Qayta urinish',
    loadMore: 'Yana yuklash',
    loadingMore: 'Yuklanmoqda…',

    aiTitle: 'Faxriddinbekning AI yordamchisi',
    aiGreeting:
      'Salom! Men Faxriddinbek haqidagi savollaringizga javob beraman: ko‘nikmalari, loyihalari va u bilan qanday bog‘lanish mumkinligi.',
    aiSuggestions: [
      'Qaysi texnologiyalarni biladi?',
      'Qanday loyihalar qilgan?',
      'U bilan qanday bog‘lansam bo‘ladi?',
    ],
    aiPlaceholder: 'Savolingizni yozing…',
    aiSend: 'Yuborish',
    aiStop: 'To‘xtatish',
    aiClose: 'Yopish',
    aiDisclaimer: 'AI xato qilishi mumkin. Muhim masalalarda to‘g‘ridan-to‘g‘ri yozing.',
    aiBusy: 'AI hozir band. Birozdan keyin urinib ko‘ring yoki Kontakt orqali yozing.',
    aiUnavailable: 'AI yordamchi hozircha ishlamayapti. Kontakt orqali yozing.',
    aiRateLimited: 'Juda ko‘p savol yuborildi. Bir necha daqiqadan keyin urinib ko‘ring.',
    aiError: 'Javob olib bo‘lmadi. Qayta urinib ko‘ring.',
  },

  en: {
    kicker: 'Python Backend Developer',
    heading: 'Hi, I’m Faxriddinbek',
    subtitle: 'I build fast, scalable backend systems with Python.',
    viewProjects: 'View Projects',
    contact: 'Contact me',

    projEyebrow: 'PROJECTS',
    projTitle: 'Selected Work',
    projSubtitle: 'A collection of backend systems, APIs and tools I’ve built.',
    projEmpty: 'No projects yet',
    projError: 'Could not load projects',

    conEyebrow: 'CONTACT',
    conTitle: 'Let’s work together',
    conSubtitle: 'Have a project in mind? Send me a message.',
    conName: 'Name',
    conEmail: 'Email',
    conMessage: 'Message',
    conSend: 'Send Message',
    conSending: 'Sending...',
    conSuccess: 'Message sent. I’ll get back to you soon.',
    conError: 'Message didn’t send. Try again.',
    conRateLimited: 'Too many attempts. Please try again in an hour.',
    nameErr: 'Please enter your name',
    emailErr: 'Invalid email address',
    msgErr: 'Message must be at least 10 characters',

    medEyebrow: 'MEDIA',
    medTitle: 'Gallery',
    medSubtitle: 'A collection of photos and videos.',
    medAll: 'All',
    medPhotos: 'Photos',
    medVideos: 'Videos',
    medEmpty: 'No media yet',
    medError: 'Could not load media',

    retry: 'Retry',
    loadMore: 'Load more',
    loadingMore: 'Loading…',

    aiTitle: 'Faxriddinbek’s AI assistant',
    aiGreeting:
      'Hi! I answer questions about Faxriddinbek — his skills, his projects, and how to get in touch.',
    aiSuggestions: [
      'What technologies does he use?',
      'What projects has he built?',
      'How can I contact him?',
    ],
    aiPlaceholder: 'Type your question…',
    aiSend: 'Send',
    aiStop: 'Stop',
    aiClose: 'Close',
    aiDisclaimer: 'AI can make mistakes. For anything important, contact him directly.',
    aiBusy: 'The AI is busy right now. Try again shortly, or use the contact form.',
    aiUnavailable: 'The AI assistant is unavailable right now. Please use the contact form.',
    aiRateLimited: 'Too many questions. Please try again in a few minutes.',
    aiError: 'Could not get an answer. Please try again.',
  },
}

/** Build a lookup function for one language, falling back to the key itself. */
export function makeTranslator(lang) {
  const dict = translations[lang] ?? translations.uz
  return (key) => dict[key] ?? key
}
