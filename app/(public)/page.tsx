import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSettings, settingKey } from "@/lib/content";
import { t } from "@/lib/i18n";
import { Editable } from "@/components/Editable";
import { CourseCard } from "@/components/CourseCard";
import { GallerySlideshow } from "@/components/GallerySlideshow";
import { TestimonialSlideshow } from "@/components/TestimonialSlideshow";
import { Reveal } from "@/components/Reveal";

// Small check mark for the professor's credential list (fixed; text is editable).
function Check() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-brand">
      <path d="m4 10 4 4 8-9" />
    </svg>
  );
}

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
  const heroCreds = [1, 2, 3, 4]
    .map((n) => ({ n, text: val(`heroCred${n}`) }))
    .filter((c) => c.text);

  return (
    <>
      {/* Hero — split: message + stats on one side, the professor on the other */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-mid text-white">
        <div className="hero-motif pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-20 lg:grid-cols-2">
          {/* Message + CTAs + stats */}
          <div className="text-start">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-brand-light ring-1 ring-white/25">
              <span aria-hidden="true">🏅</span>
              <Editable field={field("heroBadge")} value={val("heroBadge")} />
            </span>
            <Editable
              field={field("heroTagline")}
              value={val("heroTagline")}
              as="h1"
              className="mt-5 text-3xl font-extrabold leading-tight sm:text-5xl"
            />
            <Editable
              field={field("heroSubtitle")}
              value={val("heroSubtitle")}
              as="p"
              multiline
              className="mt-4 max-w-xl text-white/85"
            />
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/courses" className="btn bg-white !text-brand-dark hover:!bg-brand-light">
                {t(lang, "common.explore")}
              </Link>
              <Link href="/register" className="btn btn-accent">
                {t(lang, "common.registerNow")}
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-white/15 pt-6">
              {stats.map((n) => (
                <div key={n}>
                  <div>
                    <Editable field={field(`heroStat${n}Value`)} value={val(`heroStat${n}Value`)} as="span" className="text-3xl font-extrabold text-white" />
                  </div>
                  <div className="mt-0.5">
                    <Editable field={field(`heroStat${n}Label`)} value={val(`heroStat${n}Label`)} as="span" className="text-sm text-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Professor card + admission callout */}
          <div>
            {founder && (
              <div className="card relative overflow-hidden p-7 text-start">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-brand to-brand-accent" />
                <div className="flex items-center gap-4">
                  <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-brand/15">
                    {founder.photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={founder.photo} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl text-slate-300">👤</span>
                    )}
                  </span>
                  <div>
                    <p className="text-xl font-bold text-brand-dark">{lang === "ur" ? founder.nameUr : founder.nameEn}</p>
                    <p className="mt-0.5 text-sm font-medium text-brand">{lang === "ur" ? founder.shortUr : founder.shortEn}</p>
                  </div>
                </div>
                {heroCreds.length > 0 && (
                  <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                    {heroCreds.map((c) => (
                      <li key={c.n} className="flex gap-2">
                        <Check />
                        <Editable field={field(`heroCred${c.n}`)} value={c.text} />
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/about/${founder.id}`} className="mt-5 inline-block text-sm font-semibold text-brand hover:underline">
                  {lang === "ur" ? "مکمل تعارف ←" : "View full profile →"}
                </Link>
              </div>
            )}
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/20">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white/15 text-white" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <rect x="2" y="6" width="13" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3" />
                </svg>
              </span>
              <Editable field={field("startNotice")} value={val("startNotice")} multiline className="text-sm font-medium text-white/90" />
            </div>
          </div>
        </div>
      </section>

      {/* About the academy */}
      <Reveal>
        <section className="mx-auto max-w-3xl px-4 py-14 text-center">
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
        </section>
      </Reveal>

      {/* Why learn with us */}
      <Reveal>
        <section className="bg-white py-14">
          <div className="mx-auto max-w-6xl px-4">
            <Editable
              field={field("featuresTitle")}
              value={val("featuresTitle")}
              as="h2"
              className="mb-8 text-center text-2xl font-bold text-brand-dark sm:text-3xl"
            />
            <div className="grid gap-6 sm:grid-cols-3">
              {features.map((n, i) => (
                <div key={n} className="card card-hover p-6 text-center">
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
        <section className="py-14">
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
          <section className="bg-gradient-to-b from-[#e4eef9] to-[#d3e4f5] py-14">
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
                  {lang === "ur" ? "تمام آراء دیکھیں ←" : "Read all testimonials →"}
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}

      {/* Fee + Register CTA — highlighted panel */}
      <Reveal>
        <section className="px-4 py-14">
          <div className="card mx-auto max-w-4xl px-6 py-12 text-center sm:px-10">
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
          </div>
        </section>
      </Reveal>

      {/* Photo gallery slideshow (auto-cycles) */}
      {photos.length > 0 && (
        <Reveal>
          <section className="py-14">
            <div className="mx-auto max-w-6xl px-4">
              <h2 className="mb-8 text-center text-2xl font-bold text-brand-dark sm:text-3xl">
                {t(lang, "nav.gallery")}
              </h2>
              <GallerySlideshow urls={photos.map((p) => p.url)} />
              <div className="mt-5 text-center">
                <Link href="/gallery" className="text-sm font-semibold text-brand hover:text-brand-dark">
                  {lang === "ur" ? "پوری گیلری دیکھیں ←" : "View full gallery →"}
                </Link>
              </div>
            </div>
          </section>
        </Reveal>
      )}
    </>
  );
}
