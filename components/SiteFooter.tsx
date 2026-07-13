import Image from "next/image";
import { Editable } from "./Editable";

type Props = {
  academyName: string;
  teacherName: string;
  phone1: string;
  phone2: string;
  whatsapp: string;
  footerNote: string;
  lang: "en" | "ur";
};

export function SiteFooter({ academyName, teacherName, phone1, phone2, whatsapp, footerNote, lang }: Props) {
  const waDigits = whatsapp.replace(/\D/g, "");
  return (
    <footer className="mt-16 bg-brand-dark text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-white">
              <Image src="/logo.jpeg" alt="" width={48} height={48} className="h-12 w-12 object-contain" />
            </span>
            <span className="text-lg font-bold">{academyName}</span>
          </div>
          <p className="mt-3 text-sm text-white/70">{teacherName}</p>
        </div>

        <div>
          <h3 className="mb-2 font-semibold">{lang === "ur" ? "رابطہ" : "Contact"}</h3>
          {phone1 && <p className="text-sm text-white/80">📞 {phone1}</p>}
          {phone2 && <p className="text-sm text-white/80">📞 {phone2}</p>}
          {waDigits && (
            <a
              href={`https://wa.me/${waDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              WhatsApp
            </a>
          )}
        </div>

        <div className="text-sm text-white/70">
          <Editable field="setting:footerNote" value={footerNote} placeholder="Add a note here…" multiline />
          <p className="mt-4">© {new Date().getFullYear()} {academyName}</p>
        </div>
      </div>
    </footer>
  );
}
