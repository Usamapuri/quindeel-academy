import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Courses from the official fee schedule. Urdu titles are sensible defaults — the professor
// refines the exact spelling inline on the live site. Re-seeding never overwrites his edits.
const COURSES = [
  {
    slug: "igcse-urdu",
    titleEn: "IGCSE Urdu",
    titleUr: "آئی جی سی ایس ای اردو",
    summaryEn: "Complete IGCSE Urdu course with full syllabus coverage.",
    summaryUr: "آئی جی سی ایس ای اردو کا مکمل کورس، پورے نصاب کے ساتھ۔",
    feeText: "15000/month",
    order: 1,
  },
  {
    slug: "o-level-urdu-syllabus-b",
    titleEn: "O Level Urdu (Syllabus B)",
    titleUr: "او لیول اردو (سلیبس B)",
    summaryEn: "Full O Level Urdu Syllabus B preparation.",
    summaryUr: "او لیول اردو سلیبس B کی مکمل تیاری۔",
    feeText: "15000/month",
    order: 2,
  },
  {
    slug: "o-level-urdu-syllabus-a",
    titleEn: "O Level Urdu (Syllabus A)",
    titleUr: "او لیول اردو (سلیبس A)",
    summaryEn: "Full O Level Urdu Syllabus A preparation.",
    summaryUr: "او لیول اردو سلیبس A کی مکمل تیاری۔",
    feeText: "20000/month",
    order: 3,
  },
  {
    slug: "a-level-urdu",
    titleEn: "A Level Urdu",
    titleUr: "اے لیول اردو",
    summaryEn: "Complete A Level Urdu course.",
    summaryUr: "اے لیول اردو کا مکمل کورس۔",
    feeText: "20000/month",
    order: 4,
  },
  {
    slug: "cadet-colleges-preparation",
    titleEn: "Preparation for Cadet Colleges",
    titleUr: "کیڈٹ کالجز کی تیاری",
    summaryEn: "Complete Urdu preparation for Cadet College entrance.",
    summaryUr: "کیڈٹ کالجز کے داخلہ ٹیسٹ کے لیے اردو کی مکمل تیاری۔",
    feeText: "20000/month",
    order: 5,
  },
  {
    slug: "urdu-board-classes",
    titleEn: "Urdu for Board Classes (Matric/FSc)",
    titleUr: "بورڈ کلاسز کے لیے اردو (میٹرک/ایف ایس سی)",
    summaryEn: "Urdu guidance for Matric and FSc board students.",
    summaryUr: "میٹرک اور ایف ایس سی کے طلبہ کے لیے اردو کی رہنمائی۔",
    feeText: "10000/month",
    order: 6,
  },
  {
    slug: "urdu-competitive-exams",
    titleEn: "Urdu for Competitive Exams (CSS/PMS)",
    titleUr: "مقابلہ جاتی امتحانات کے لیے اردو (CSS/PMS)",
    summaryEn: "Complete Urdu guidance for CSS/PMS competitive exams.",
    summaryUr: "سی ایس ایس اور پی ایم ایس کے لیے اردو کی مکمل رہنمائی۔",
    feeText: "20000/Full Package",
    order: 7,
  },
  {
    slug: "workshop-for-teachers",
    titleEn: "Workshop for Teachers (Urdu)",
    titleUr: "اساتذہ کے لیے ورکشاپ (اردو)",
    summaryEn: "Training workshop for Urdu teachers at educational institutions.",
    summaryUr: "تعلیمی اداروں میں اردو کے مدرسین کے لیے تربیتی ورکشاپ۔",
    feeText: "5000/Head",
    order: 8,
  },
];

// Editable landing-page copy. Seeded once; never overwritten so the professor keeps his edits.
const SETTINGS: Record<string, string> = {
  academyNameEn: "Quindeel Academy (Online)",
  academyNameUr: "قندیل اکیڈمی",
  heroTaglineEn: "39 Years of Continuous Excellence in Urdu Education",
  heroTaglineUr: "اردو تعلیم میں انتالیس سال کی مسلسل خدمت",
  heroSubtitleEn:
    "Online Urdu classes under the supervision of Prof. Muhammad Zaheer Quindeel, former Head of Urdu Department, Cadet College Hassan Abdal.",
  heroSubtitleUr:
    "پروفیسر محمد ظہیر قندیل کی نگرانی میں آن لائن اردو کلاسز — سابق صدر شعبۂ اردو، کیڈٹ کالج حسن ابدال۔",
  startNoticeEn: "Online classes commencing from August 1, 2026 — Free admission for all courses.",
  startNoticeUr: "آن لائن کلاسز یکم اگست 2026 سے شروع — تمام کورسز میں داخلہ مفت۔",
  aboutTitleEn: "About the Academy",
  aboutTitleUr: "اکیڈمی کے بارے میں",
  aboutBodyEn:
    "Quindeel Academy offers expert online Urdu tuition for O/A Level, IGCSE, board classes, cadet college entrance, and competitive exams — guided by Prof. Muhammad Zaheer Quindeel, with 39 years of teaching excellence and outstanding results.",
  aboutBodyUr:
    "قندیل اکیڈمی او لیول، اے لیول، آئی جی سی ایس ای، بورڈ کلاسز، کیڈٹ کالج داخلہ اور مقابلہ جاتی امتحانات کے لیے ماہرانہ آن لائن اردو تدریس فراہم کرتی ہے — پروفیسر محمد ظہیر قندیل کی رہنمائی میں، انتالیس سالہ تدریسی تجربے اور نمایاں نتائج کے ساتھ۔",
  coursesTitleEn: "Our Courses",
  coursesTitleUr: "ہمارے کورسز",
  feeTitleEn: "Fee Structure",
  feeTitleUr: "فیس اسٹرکچر",
  feeIntroEn: "Schedule of admission and fees. Free admission for all courses.",
  feeIntroUr: "داخلہ اور فیس کا شیڈول۔ تمام کورسز میں داخلہ مفت۔",
  policy1En: "10% concession in monthly fee for a second admission from the same family.",
  policy1Ur: "ایک ہی خاندان کے دوسرے داخلے پر ماہانہ فیس میں 10 فیصد رعایت۔",
  policy2En: "Fee shall be cleared by the 5th of every month.",
  policy2Ur: "فیس ہر ماہ کی 5 تاریخ تک ادا کی جائے۔",
  registerTitleEn: "Register / Book a Class",
  registerTitleUr: "رجسٹریشن / کلاس بک کریں",
  registerIntroEn: "Send a registration request and pick a preferred time. We'll get back to you.",
  registerIntroUr: "رجسٹریشن کی درخواست بھیجیں اور اپنا پسندیدہ وقت منتخب کریں۔ ہم آپ سے رابطہ کریں گے۔",

  // Home-page credibility strip (three quick facts). Value = the bold line, label = caption.
  stat1ValueEn: "39+", stat1ValueUr: "39+",
  stat1LabelEn: "Years of teaching", stat1LabelUr: "سال تدریسی تجربہ",
  stat2ValueEn: "Free", stat2ValueUr: "مفت",
  stat2LabelEn: "Admission, all courses", stat2LabelUr: "تمام کورسز میں داخلہ",
  stat3ValueEn: "Online", stat3ValueUr: "آن لائن",
  stat3LabelEn: "Live & recorded classes", stat3LabelUr: "لائیو اور ریکارڈڈ کلاسز",

  // Home-page "Why learn with us" feature row (three cards). Icons are fixed in code.
  featuresTitleEn: "Why learn with us", featuresTitleUr: "ہمارے ساتھ کیوں پڑھیں",
  feature1TitleEn: "Live online classes", feature1TitleUr: "لائیو آن لائن کلاسز",
  feature1BodyEn: "Interactive classes on Google Meet — join from anywhere.",
  feature1BodyUr: "گوگل میٹ پر انٹرایکٹو کلاسز — کہیں سے بھی شامل ہوں۔",
  feature2TitleEn: "Recorded lectures", feature2TitleUr: "ریکارڈڈ لیکچرز",
  feature2BodyEn: "Every class is recorded, so you can revise anytime.",
  feature2BodyUr: "ہر کلاس ریکارڈ ہوتی ہے، جب چاہیں دوبارہ دیکھیں۔",
  feature3TitleEn: "Personal attention", feature3TitleUr: "انفرادی توجہ",
  feature3BodyEn: "Small groups and bilingual guidance for real results.",
  feature3BodyUr: "چھوٹے گروپس اور دو لسانی رہنمائی، بہترین نتائج کے لیے۔",

  // Home-page testimonials section heading.
  testimonialsTitleEn: "What students & parents say", testimonialsTitleUr: "طلبہ اور والدین کیا کہتے ہیں",
  teacherNameEn: "Prof. Muhammad Zaheer Quindeel",
  teacherNameUr: "پروفیسر محمد ظہیر قندیل",
  teacherTitleEn: "Former Head of Urdu Department, Cadet College Hassan Abdal",
  teacherTitleUr: "سابق صدر شعبۂ اردو، کیڈٹ کالج حسن ابدال",
  phone1: "0346-5209131",
  phone2: "0323-5209131",
  whatsapp: "923465209131",
  contactEmail: "info@quindeel.academy",
};

async function main() {
  // 1. Teacher (idempotent — do not reset password on re-seed)
  const email = process.env.TEACHER_EMAIL ?? "teacher@quindeel.academy";
  const name = process.env.TEACHER_NAME ?? "Prof. Muhammad Zaheer Quindeel";
  const password = process.env.TEACHER_PASSWORD ?? "changeme123";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { name, role: Role.TEACHER, active: true },
    create: { email, name, role: Role.TEACHER, active: true, passwordHash },
  });
  console.log(`✓ teacher ${email}`);

  // 2. Courses (create if missing; preserve teacher's inline edits on re-seed)
  for (const c of COURSES) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      update: {}, // keep existing edits
      create: c,
    });
  }
  console.log(`✓ ${COURSES.length} courses`);

  // 3. Site settings (create if missing; never overwrite)
  for (const [key, value] of Object.entries(SETTINGS)) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  console.log(`✓ ${Object.keys(SETTINGS).length} site settings`);

  // 4. Faculty: reserved "Headmaster" category at the top with Prof. Zaheer.
  // Fixed ids keep it idempotent; the teacher adds more categories/members inline.
  await prisma.facultyCategory.upsert({
    where: { id: "cat-headmaster" },
    update: {},
    create: { id: "cat-headmaster", nameEn: "Headmaster", nameUr: "ہیڈ ماسٹر", order: 0 },
  });
  await prisma.faculty.upsert({
    where: { id: "fac-zaheer" },
    update: {},
    create: {
      id: "fac-zaheer",
      categoryId: "cat-headmaster",
      nameEn: name,
      nameUr: "پروفیسر محمد ظہیر قندیل",
      shortEn: "Former Head of Urdu Department, Cadet College Hassan Abdal.",
      shortUr: "سابق صدر شعبۂ اردو، کیڈٹ کالج حسن ابدال۔",
      order: 0,
    },
  });
  console.log("✓ faculty (Headmaster + Prof. Zaheer)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
