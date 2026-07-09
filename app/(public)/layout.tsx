import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { getSettings, settingKey } from "@/lib/content";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { EditModeBar } from "@/components/EditModeBar";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const session = await getSession();
  const s = await getSettings();

  const academyName = s[settingKey("academyName", lang)] || "Quindeel Academy";
  const teacherName = s[settingKey("teacherName", lang)] || "";

  return (
    <>
      <EditModeBar />
      <SiteHeader
        academyName={academyName}
        session={session ? { role: session.role, name: session.name } : null}
      />
      <main className="flex-1">{children}</main>
      <SiteFooter
        academyName={academyName}
        teacherName={teacherName}
        phone1={s.phone1 || ""}
        phone2={s.phone2 || ""}
        whatsapp={s.whatsapp || ""}
        footerNote={s.footerNote || ""}
        lang={lang}
      />
    </>
  );
}
