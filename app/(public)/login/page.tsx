import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(session.role === "TEACHER" ? "/admin" : "/portal");
  const lang = await getLang();

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{t(lang, "login.title")}</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">{t(lang, "login.subtitle")}</p>
      <LoginForm />
    </section>
  );
}
