import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSettings, settingKey } from "@/lib/content";
import { t } from "@/lib/i18n";
import { Editable } from "@/components/Editable";

export default async function FeesPage() {
  const lang = await getLang();
  const s = await getSettings();
  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { order: "asc" },
  });

  const field = (base: string) => `setting:${settingKey(base, lang)}`;
  const val = (base: string) => s[settingKey(base, lang)] || "";
  const suffix = lang === "ur" ? "Ur" : "En";

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <Editable field={field("feeTitle")} value={val("feeTitle")} as="h1" className="text-center text-3xl font-bold text-brand-dark" />
      <Editable field={field("feeIntro")} value={val("feeIntro")} as="p" multiline className="mt-3 text-center text-slate-600" />

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <table className="w-full text-start">
          <thead>
            <tr className="bg-brand-dark text-white">
              <th className="px-4 py-3 text-start font-semibold">{t(lang, "common.course")}</th>
              <th className="px-4 py-3 text-end font-semibold">{t(lang, "common.fee")} (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => (
              <tr key={c.id} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                <td className="px-4 py-3">
                  <Editable
                    field={`course:${c.id}:title${suffix}`}
                    value={lang === "ur" ? c.titleUr : c.titleEn}
                    className="font-medium text-brand-dark"
                  />
                </td>
                <td className="px-4 py-3 text-end font-bold text-brand">
                  <Editable field={`course:${c.id}:feeText`} value={c.feeText} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Policies */}
      <div className="mt-8 rounded-2xl bg-brand-light p-6">
        <h2 className="mb-3 text-lg font-bold text-brand-dark">{lang === "ur" ? "پالیسیاں" : "Policies"}</h2>
        <ul className="list-inside list-disc space-y-2 text-slate-700">
          <li><Editable field={field("policy1")} value={val("policy1")} multiline /></li>
          <li><Editable field={field("policy2")} value={val("policy2")} multiline /></li>
        </ul>
      </div>

      <div className="mt-8 text-center">
        <Link href="/register" className="btn btn-primary text-lg">
          {t(lang, "common.registerNow")}
        </Link>
      </div>
    </section>
  );
}
