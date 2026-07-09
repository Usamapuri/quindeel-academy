import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ deactivated?: string }>;
}) {
  const sp = await searchParams;
  const session = await getSession();
  if (session) redirect(session.role === "TEACHER" ? "/admin" : "/portal");
  const lang = await getLang();
  const ur = lang === "ur";

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{t(lang, "login.title")}</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">{t(lang, "login.subtitle")}</p>
      {sp.deactivated && (
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-800">
          {ur
            ? "آپ کا اکاؤنٹ غیر فعال کر دیا گیا ہے۔ براہ کرم استاد سے رابطہ کریں۔"
            : "Your account has been deactivated. Please contact the teacher."}
        </p>
      )}
      <LoginForm />
    </section>
  );
}
