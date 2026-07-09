import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSettings, settingKey } from "@/lib/content";
import { Editable } from "@/components/Editable";
import { RegisterForm } from "@/components/RegisterForm";
import { UnregisterForm } from "@/components/UnregisterForm";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  const lang = await getLang();
  const s = await getSettings();
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
    select: { id: true, titleEn: true, titleUr: true, slug: true },
  });

  const field = (base: string) => `setting:${settingKey(base, lang)}`;
  const val = (base: string) => s[settingKey(base, lang)] || "";

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <Editable field={field("registerTitle")} value={val("registerTitle")} as="h1" className="text-center text-3xl font-bold text-brand-dark" />
      <Editable field={field("registerIntro")} value={val("registerIntro")} as="p" multiline className="mb-8 mt-3 text-center text-slate-600" />
      <RegisterForm courses={courses} preselectSlug={course} lang={lang} />
      <UnregisterForm courses={courses} lang={lang} />
    </section>
  );
}
