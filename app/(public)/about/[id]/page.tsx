import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { Editable } from "@/components/Editable";
import { FacultyPhoto } from "@/components/FacultyPhoto";

export default async function FacultyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const ur = lang === "ur";
  const suffix = ur ? "Ur" : "En";

  const f = await prisma.faculty.findUnique({ where: { id }, include: { category: true } });
  if (!f) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/about" className="text-sm font-semibold text-brand hover:text-brand-dark">
        {ur ? "← فیکلٹی" : "← Faculty"}
      </Link>

      <div className="mt-4 flex flex-col items-center text-center">
        <FacultyPhoto facultyId={f.id} photo={f.photo} lang={lang} size="detail" />
        <Editable
          field={`faculty:${f.id}:name${suffix}`}
          value={ur ? f.nameUr : f.nameEn}
          as="h1"
          className="mt-4 text-3xl font-bold text-brand-dark"
          placeholder={ur ? "نام" : "Name"}
        />
        <p className="mt-1 font-semibold text-brand">{ur ? f.category.nameUr : f.category.nameEn}</p>
      </div>

      <Editable
        field={`faculty:${f.id}:bio${suffix}`}
        value={ur ? f.bioUr : f.bioEn}
        as="div"
        multiline
        className="mt-8 whitespace-pre-wrap leading-relaxed text-slate-700"
        placeholder={ur ? "مکمل تعارف یہاں لکھیں…" : "Write the full profile here…"}
      />
    </article>
  );
}
