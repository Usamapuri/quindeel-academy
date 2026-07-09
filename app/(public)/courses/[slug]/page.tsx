import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import { Editable } from "@/components/Editable";
import CourseImageBox from "@/components/CourseImageBox";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lang = await getLang();
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course || !course.published) notFound();

  const suffix = lang === "ur" ? "Ur" : "En";
  const title = lang === "ur" ? course.titleUr : course.titleEn;
  const description = lang === "ur" ? course.descriptionUr : course.descriptionEn;
  const summary = lang === "ur" ? course.summaryUr : course.summaryEn;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/courses" className="text-sm font-semibold text-brand hover:text-brand-dark">
        ← {t(lang, "nav.courses")}
      </Link>

      <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-dark to-brand p-8 text-white">
        <Editable field={`course:${course.id}:title${suffix}`} value={title} as="h1" className="text-3xl font-extrabold" />
        <Editable
          field={`course:${course.id}:summary${suffix}`}
          value={summary}
          as="p"
          multiline
          className="mt-2 text-brand-light"
          placeholder="Add a short summary…"
        />
        <span className="mt-4 inline-block rounded-full bg-white/20 px-4 py-1.5 font-bold">
          {t(lang, "common.fee")}: <Editable field={`course:${course.id}:feeText`} value={course.feeText} />
        </span>
      </div>

      <div className="mt-8 text-lg leading-relaxed text-slate-700">
        <Editable
          field={`course:${course.id}:description${suffix}`}
          value={description}
          as="div"
          multiline
          placeholder="Write the full course description here…"
        />
      </div>

      {/* Teacher-placed images, shown below the description (read-only for students) */}
      <CourseImageBox courseId={course.id} initial={course.descriptionImages} lang={lang} />

      <div className="mt-10 text-center">
        <Link href={`/register?course=${course.slug}`} className="btn btn-primary text-lg">
          {t(lang, "common.registerNow")}
        </Link>
      </div>
    </article>
  );
}
