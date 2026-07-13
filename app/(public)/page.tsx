import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSettings, settingKey } from "@/lib/content";
import { t } from "@/lib/i18n";
import { Editable } from "@/components/Editable";
import { CourseCard } from "@/components/CourseCard";
import { GallerySlideshow } from "@/components/GallerySlideshow";

export default async function LandingPage() {
  const lang = await getLang();
  const s = await getSettings();
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });
  // Latest photos for the home-page slideshow (kept small to stay light).
  const photos = await prisma.photo.findMany({ orderBy: { createdAt: "desc" }, take: 12 });

  // helpers to bind a bilingual setting to an Editable field
  const field = (base: string) => `setting:${settingKey(base, lang)}`;
  const val = (base: string) => s[settingKey(base, lang)] || "";

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-dark via-brand to-brand-mid text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 py-16 text-center sm:py-24">
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

      {/* About */}
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
          className="mt-4 text-lg text-slate-600"
        />
        <div className="mt-6 inline-flex flex-col items-center rounded-2xl bg-brand-light px-8 py-4">
          <Editable field={field("teacherName")} value={val("teacherName")} className="text-lg font-bold text-brand-dark" />
          <Editable field={field("teacherTitle")} value={val("teacherTitle")} className="text-sm text-slate-600" />
        </div>
      </section>

      {/* Courses */}
      <section className="bg-slate-50 py-14">
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

      {/* Fee + Register CTA */}
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

      {/* Photo gallery slideshow (auto-cycles) */}
      {photos.length > 0 && (
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
      )}
    </>
  );
}
