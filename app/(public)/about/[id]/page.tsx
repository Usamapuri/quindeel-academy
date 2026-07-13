import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { Editable } from "@/components/Editable";
import { FacultyPhoto } from "@/components/FacultyPhoto";

// Turn a bio into readable paragraphs for visitors. If the professor added his
// own line breaks we respect them; if he pasted one long block, we group the
// sentences so it doesn't read as a single wall of text. Display only — the
// stored text is never changed, and the teacher still edits the raw value.
function toParagraphs(text: string, ur: boolean): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (/\n/.test(trimmed)) {
    return trimmed.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  }
  // Nudge in a missing space after a sentence end (e.g. "research.His" → "research. His").
  const cleaned = ur ? trimmed : trimmed.replace(/([.!?])(["“'A-Z])/g, "$1 $2");
  const sentences = (ur ? cleaned.split(/(?<=۔)\s*/) : cleaned.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter(Boolean);
  const perPara = 3;
  const paras: string[] = [];
  for (let i = 0; i < sentences.length; i += perPara) {
    paras.push(sentences.slice(i, i + perPara).join(" "));
  }
  return paras;
}

export default async function FacultyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const ur = lang === "ur";
  const suffix = ur ? "Ur" : "En";
  const session = await getSession();
  const canEdit = session?.role === "TEACHER";

  const f = await prisma.faculty.findUnique({ where: { id }, include: { category: true } });
  if (!f) notFound();

  const bio = ur ? f.bioUr : f.bioEn;
  const paragraphs = toParagraphs(bio, ur);

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/about" className="text-sm font-semibold text-brand hover:text-brand-dark">
        {ur ? "← فیکلٹی" : "← Faculty"}
      </Link>

      {/* Header card */}
      <header className="mt-4 flex flex-col items-center rounded-3xl border border-slate-200 bg-gradient-to-b from-brand-light/60 to-white px-6 py-10 text-center shadow-sm">
        <FacultyPhoto facultyId={f.id} photo={f.photo} lang={lang} size="detail" />
        <Editable
          field={`faculty:${f.id}:name${suffix}`}
          value={ur ? f.nameUr : f.nameEn}
          as="h1"
          className="mt-5 text-3xl font-bold text-brand-dark sm:text-4xl"
          placeholder={ur ? "نام" : "Name"}
        />
        <span className="mt-3 inline-block rounded-full bg-brand px-4 py-1 text-sm font-semibold text-white">
          {ur ? f.category.nameUr : f.category.nameEn}
        </span>
      </header>

      {/* Bio */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-brand-dark">
          {ur ? "تعارف" : "Profile"}
        </h2>
        {canEdit ? (
          // Teacher edits the raw text inline (tip: press Enter for a new paragraph).
          <Editable
            field={`faculty:${f.id}:bio${suffix}`}
            value={bio}
            as="div"
            multiline
            className="text-lg leading-8 text-slate-700"
            placeholder={ur ? "مکمل تعارف یہاں لکھیں…" : "Write the full profile here…"}
          />
        ) : paragraphs.length > 0 ? (
          <div className="space-y-5 text-lg leading-8 text-slate-700">
            {paragraphs.map((p, i) => (
              <p key={i} className="break-words">{p}</p>
            ))}
          </div>
        ) : (
          <p className="text-slate-400">{ur ? "ابھی کوئی تعارف شامل نہیں۔" : "No profile added yet."}</p>
        )}
      </section>
    </article>
  );
}
