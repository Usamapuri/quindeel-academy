import Link from "next/link";
import { Editable } from "./Editable";
import type { Lang } from "@/lib/i18n";

export type CourseCardData = {
  id: string;
  slug: string;
  titleEn: string;
  titleUr: string;
  summaryEn: string;
  summaryUr: string;
  feeText: string;
};

const ICONS = ["📖", "✒️", "📝", "🎓", "🏫", "📚", "🏆", "👥"];

export function CourseCard({
  course,
  lang,
  index,
  viewLabel,
}: {
  course: CourseCardData;
  lang: Lang;
  index: number;
  viewLabel: string;
}) {
  const suffix = lang === "ur" ? "Ur" : "En";
  const title = lang === "ur" ? course.titleUr : course.titleEn;
  const summary = lang === "ur" ? course.summaryUr : course.summaryEn;

  return (
    <div className="card card-hover group flex h-full flex-col p-6">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-light text-2xl">
        {ICONS[index % ICONS.length]}
      </div>
      <Editable
        field={`course:${course.id}:title${suffix}`}
        value={title}
        as="h3"
        className="text-lg font-bold text-brand-dark"
      />
      <Editable
        field={`course:${course.id}:summary${suffix}`}
        value={summary}
        as="p"
        multiline
        className="mt-2 flex-1 text-sm text-slate-600"
        placeholder="Add a short description…"
      />
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-brand-light px-3 py-1 text-sm font-bold text-brand">
          <Editable field={`course:${course.id}:feeText`} value={course.feeText} />
        </span>
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm font-semibold text-brand hover:text-brand-dark"
        >
          {viewLabel} →
        </Link>
      </div>
    </div>
  );
}
