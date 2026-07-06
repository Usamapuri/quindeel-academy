import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSettings, settingKey } from "@/lib/content";
import { t } from "@/lib/i18n";
import { Editable } from "@/components/Editable";
import { CourseCard } from "@/components/CourseCard";

export default async function CoursesPage() {
  const lang = await getLang();
  const s = await getSettings();
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <Editable
        field={`setting:${settingKey("coursesTitle", lang)}`}
        value={s[settingKey("coursesTitle", lang)] || ""}
        as="h1"
        className="mb-8 text-center text-3xl font-bold text-brand-dark"
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((c, i) => (
          <CourseCard key={c.id} course={c} lang={lang} index={i} viewLabel={t(lang, "common.viewDetails")} />
        ))}
      </div>
    </section>
  );
}
