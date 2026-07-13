import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSettings, settingKey } from "@/lib/content";
import { t } from "@/lib/i18n";
import { Editable } from "@/components/Editable";
import { CourseCard } from "@/components/CourseCard";
import { FacultyCard } from "@/components/FacultyCard";
import { GallerySlideshow } from "@/components/GallerySlideshow";
import { TestimonialSlideshow } from "@/components/TestimonialSlideshow";
import { Reveal } from "@/components/Reveal";

// Fixed icons for the "Why learn with us" cards (text is inline-editable, icons aren't).
const FEATURE_ICONS = [
  // Live class (camera)
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
    <rect x="2" y="6" width="13" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3" />
  </svg>,
  // Recorded (play/library)
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
    <circle cx="12" cy="12" r="9" /><path d="m10 9 5 3-5 3z" />
  </svg>,
  // Personal attention (mentor)
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
    <circle cx="12" cy="8" r="3.2" /><path d="M5 20a7 7 0 0 1 14 0" />
  </svg>,
];

export default async function LandingPage() {
  const lang = await getLang();
  const s = await getSettings();
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  // Latest photos for the home-page slideshow (kept small to stay light).
  const photos = await prisma.photo.findMany({ orderBy: { createdAt: "desc" }, take: 12 });
  // The featured founder = first member of the first faculty category (seeded: Prof. Zaheer).
  // Single source of truth: the professor edits himself on /about and it shows here too.
  const founder = await prisma.faculty.findFirst({
    orderBy: [{ category: { order: "asc" } }, { order: "asc" }],
  });
  // A few testimonials to feature (edited on the /testimonials page).
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // helpers to bind a bilingual setting to an Editable field
  const field = (base: string) => `setting:${settingKey(base, lang)}`;
  const val = (base: string) => s[settingKey(base, lang)] || "";

  const stats = [1, 2, 3] as const;
  const features = [1, 2, 3] as const;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-mid text-white">
        <div className="hero-motif pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-16 text-center sm:py-24">
          <span className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-white ring-4 ring-white/30">
            <Image src="/logo.jpeg" alt="Quindeel Academy" width={96} height={96} className="h-24 w-24 object-contain" />
          </span>
          <Editable
            field={field("academyName")}
            value={val("academyName")}
            as="h1"
            className="text-3xl font-extrabold sm:text-5xl"
          />
          <Editable
            field={field("heroTagline")}
            value={val("heroTagline")}
            as="p"
            className="text-xl font-semibold text-brand-light sm:text-2xl"
          />
          <Editable
            field={field("heroSubtitle")}
            value={val("heroSubtitle")}
            as="p"
            multiline
            className="max-w-2xl text-white/85"
          />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/courses" className="btn bg-white !text-brand-dark hover:!bg-brand-light">
              {t(lang, "common.explore")}
            </Link>
            <Link href="/register" className="btn btn-accent">
              {t(lang, "common.registerNow")}
            </Link>
          </div>
        </div>
      </section>

      {/* Admission notice */}
      <div className="bg-amber-50">
        <div className="mx-auto max-w-6xl px-4 py-3 text-center font-semibold text-amber-800">
          <Editable field={field("startNotice")} value={val("startNotice")} />
        </div>
      </div>

      {/* Credibility stats strip */}
      <div className="border-b border-slate-100 bg-white">
        <div className="mx-auto grid max-w-4xl grid-cols-1 divide-y divide-slate-100 px-4 py-6 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {stats.map((n) => (
            <div key={n} className="px-4 py-3 sm:py-0">
              <div>
                <Editable
                  field={field(`stat${n}Value`)}
                  value={val(`stat${n}Value`)}
                  as="span"
                  className="text-3xl font-extrabold text-brand"
                />
              </div>
              <div className="mt-1">
                <Editable
                  field={field(`stat${n}Label`)}
                  value={val(`stat${n}Label`)}
                  as="span"
                  className="text-sm text-slate-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About + founder card */}
      <Reveal>
        <section className="mx-auto max-w-4xl px-4 py-14 text-center">
          <Editable
            field={field("aboutTitle")}
            value={val("aboutTitle")}
            as="h2"
            className="text-2xl font-bold text-brand-dark sm:text-3xl"
          />
          <Editable
            field={field("aboutBody")}
            value={val("aboutBody")}
            as="p"
            multiline
            className="mx-auto mt-4 max-w-2xl text-lg text-slate-600"
          />
          {founder && (
            <div className="mt-8">
              <FacultyCard
                id={founder.id}
                name={lang === "ur" ? founder.nameUr : founder.nameEn}
                short={lang === "ur" ? founder.shortUr : founder.shortEn}
                photo={founder.photo}
                lang={lang}
              />
            </div>
          )}
        </section>
      </Reveal>

      {/* Why learn with us */}
      <Reveal>
        <section className="bg-slate-50 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <Editable
              field={field("featuresTitle")}
              value={val("featuresTitle")}
              as="h2"
              className="mb-8 text-center text-2xl font-bold text-brand-dark sm:text-3xl"
            />
            <div className="grid gap-6 sm:grid-cols-3">
              {features.map((n, i) => (
                <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-light text-brand">
                    {FEATURE_ICONS[i]}
                  </span>
                  <Editable
                    field={field(`feature${n}Title`)}
                    value={val(`feature${n}Title`)}
                    as="h3"
                    className="mt-4 text-lg font-bold text-brand-dark"
                  />
                  <Editable
                    field={field(`feature${n}Body`)}
                    value={val(`feature${n}Body`)}
                    as="p"
                    multiline
                    className="mt-2 text-sm text-slate-600"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Courses */}
      <Reveal>
        <section className="bg-white py-14">
          <div className="mx-auto max-w-6xl px-4">
            <Editable
              field={field("coursesTitle")}
              value={val("coursesTitle")}
              as="h2"
              className="mb-8 text-center text-2xl font-bold text-brand-dark sm:text-3xl"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c, i) => (
                <CourseCard key={c.id} course={c} lang={lang} index={i} viewLabel={t(lang, "common.viewDetails")} />
              ))}
            </div>
          </div>
        </section>
      </Reveal>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <Reveal>
          <section className="bg-slate-50 py-14">
            <div className="mx-auto max-w-6xl px-4">
              <Editable
                field={field("testimonialsTitle")}
                value={val("testimonialsTitle")}
                as="h2"
                className="mb-8 text-center text-2xl font-bold text-brand-dark sm:text-3xl"
              />
              <TestimonialSlideshow
                items={testimonials.map((tm) => ({
                  id: tm.id,
                  quote: tm.quote,
                  author: tm.author,
                  role: tm.role,
                }))}
              />
              <div className="mt-6 text-center">
                <Link href="/testimonials" className="text-sm font-semibold text-brand hover:text-brand-dark">
                  {lang === "ur" ? "تمام آراء دیکھیں" : "Read all testimonials"} →
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Fee + Register CTA */}
      <Reveal>
        <section className="mx-auto max-w-4xl px-4 py-14 text-center">
          <Editable
            field={field("registerTitle")}
            value={val("registerTitle")}
            as="h2"
            className="text-2xl font-bold text-brand-dark sm:text-3xl"
          />
          <Editable
            field={field("registerIntro")}
            value={val("registerIntro")}
            as="p"
            multiline
            className="mx-auto mt-3 max-w-2xl text-slate-600"
          />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/fees" className="btn btn-outline">
              {t(lang, "nav.fees")}
            </Link>
            <Link href="/register" className="btn btn-primary">
              {t(lang, "common.registerNow")}
            </Link>
          </div>
        </section>
      </Reveal>

      {/* Photo gallery slideshow (auto-cycles) */}
      {photos.length > 0 && (
        <Reveal>
          <section className="bg-slate-50 py-14">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-8 text-center text-2xl font-bold text-brand-dark sm:text-3xl">
                {t(lang, "nav.gallery")}
              </h2>
              <GallerySlideshow urls={photos.map((p) => p.url)} />
              <div className="mt-5 text-center">
                <Link href="/gallery" className="text-sm font-semibold text-brand hover:text-brand-dark">
                  {lang === "ur" ? "پوری گیلری دیکھیں" : "View full gallery"} →
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}
    </>
  );
}
