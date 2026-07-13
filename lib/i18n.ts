// Tiny bilingual helper. Pure (no server-only imports) so both server and client can use it.
export type Lang = "en" | "ur";

export const LANGS: Lang[] = ["en", "ur"];
export const DEFAULT_LANG: Lang = "en";
export const LANG_COOKIE = "qa_lang";

export function dir(lang: Lang): "rtl" | "ltr" {
  return lang === "ur" ? "rtl" : "ltr";
}

/** Pick the value for the current language from an {en, ur} pair (falls back gracefully). */
export function pick(lang: Lang, en: string, ur: string): string {
  if (lang === "ur") return ur || en;
  return en || ur;
}

// UI chrome strings (buttons, labels, nav). Content typed by the teacher is stored separately.
const DICT = {
  en: {
    "nav.home": "Home",
    "nav.courses": "Courses",
    "nav.fees": "Fees",
    "nav.blog": "Blog",
    "nav.gallery": "Gallery",
    "nav.videos": "Videos",
    "nav.register": "Register",
    "nav.login": "Login",
    "nav.logout": "Log out",
    "nav.admin": "Admin",
    "nav.portal": "My Portal",
    "common.explore": "Explore Courses",
    "common.registerNow": "Register Now",
    "common.viewDetails": "View Details",
    "common.join": "Join Live Class",
    "common.watch": "Watch",
    "common.contact": "Contact Us",
    "common.whatsapp": "WhatsApp",
    "common.save": "Save",
    "common.saving": "Saving…",
    "common.saved": "Saved",
    "common.cancel": "Cancel",
    "common.name": "Full Name",
    "common.email": "Email",
    "common.phone": "Phone",
    "common.password": "Password",
    "common.message": "Message",
    "common.course": "Course",
    "common.selectCourse": "Select a course",
    "common.preferredTime": "Preferred day & time",
    "common.submit": "Submit Request",
    "common.month": "month",
    "common.fee": "Fee",
    "common.perMonth": "/ month",
    "editbar.title": "Edit mode — click any highlighted text to change it",
    "editbar.viewSite": "View as visitor",
    "editbar.goAdmin": "Admin panel",
    "login.title": "Login",
    "login.subtitle": "Sign in to your account",
    "login.button": "Sign In",
    "register.thanks": "Thank you! Your request has been received. We will contact you soon.",
    "portal.myCourses": "My Courses",
    "portal.liveClasses": "Live Classes",
    "portal.recordings": "Recorded Lectures",
    "portal.fees": "My Fee Records",
    "portal.noLive": "No upcoming live classes yet.",
    "portal.noRecordings": "No recorded lectures yet.",
    "portal.noFees": "No fee records yet.",
  },
  ur: {
    "nav.home": "ہوم",
    "nav.courses": "کورسز",
    "nav.fees": "فیس",
    "nav.blog": "بلاگ",
    "nav.gallery": "گیلری",
    "nav.videos": "ویڈیوز",
    "nav.register": "رجسٹریشن",
    "nav.login": "لاگ اِن",
    "nav.logout": "لاگ آؤٹ",
    "nav.admin": "ایڈمن",
    "nav.portal": "میرا پورٹل",
    "common.explore": "کورسز دیکھیں",
    "common.registerNow": "ابھی رجسٹر کریں",
    "common.viewDetails": "تفصیل دیکھیں",
    "common.join": "لائیو کلاس میں شامل ہوں",
    "common.watch": "دیکھیں",
    "common.contact": "ہم سے رابطہ کریں",
    "common.whatsapp": "واٹس ایپ",
    "common.save": "محفوظ کریں",
    "common.saving": "محفوظ ہو رہا ہے…",
    "common.saved": "محفوظ ہو گیا",
    "common.cancel": "منسوخ",
    "common.name": "پورا نام",
    "common.email": "ای میل",
    "common.phone": "فون نمبر",
    "common.password": "پاس ورڈ",
    "common.message": "پیغام",
    "common.course": "کورس",
    "common.selectCourse": "کورس منتخب کریں",
    "common.preferredTime": "پسندیدہ دن اور وقت",
    "common.submit": "درخواست بھیجیں",
    "common.month": "ماہ",
    "common.fee": "فیس",
    "common.perMonth": "/ ماہانہ",
    "editbar.title": "ایڈٹ موڈ — کسی بھی نمایاں متن پر کلک کر کے تبدیل کریں",
    "editbar.viewSite": "بطور ناظر دیکھیں",
    "editbar.goAdmin": "ایڈمن پینل",
    "login.title": "لاگ اِن",
    "login.subtitle": "اپنے اکاؤنٹ میں داخل ہوں",
    "login.button": "داخل ہوں",
    "register.thanks": "شکریہ! آپ کی درخواست موصول ہو گئی ہے۔ ہم جلد آپ سے رابطہ کریں گے۔",
    "portal.myCourses": "میرے کورسز",
    "portal.liveClasses": "لائیو کلاسز",
    "portal.recordings": "ریکارڈ شدہ لیکچرز",
    "portal.fees": "میرے فیس ریکارڈ",
    "portal.noLive": "ابھی کوئی آنے والی لائیو کلاس نہیں۔",
    "portal.noRecordings": "ابھی کوئی ریکارڈ شدہ لیکچر نہیں۔",
    "portal.noFees": "ابھی کوئی فیس ریکارڈ نہیں۔",
  },
} as const;

export type TKey = keyof (typeof DICT)["en"];

export function t(lang: Lang, key: TKey): string {
  return DICT[lang][key] ?? DICT.en[key] ?? key;
}
