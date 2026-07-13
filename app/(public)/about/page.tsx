import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { Editable } from "@/components/Editable";
import { FacultyPhoto } from "@/components/FacultyPhoto";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import {
  addCategory,
  deleteCategory,
  moveCategory,
  addFaculty,
  deleteFaculty,
  moveFaculty,
} from "@/app/actions/faculty";

// The Faculty directory. Members grouped into ordered categories (Headmaster at
// the top). Inline-edited by the teacher; read-only for everyone else.
export default async function AboutPage() {
  const lang = await getLang();
  const ur = lang === "ur";
  const suffix = ur ? "Ur" : "En";
  const session = await getSession();
  const canEdit = session?.role === "TEACHER";

  const categories = await prisma.facultyCategory.findMany({
    orderBy: { order: "asc" },
    include: { members: { orderBy: { order: "asc" } } },
  });
  const firstCat = categories[0]?.id;
  const lastCat = categories[categories.length - 1]?.id;

  const arrowBtn = "text-slate-400 hover:text-brand disabled:opacity-30";

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{ur ? "ہماری فیکلٹی" : "Our Faculty"}</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">{ur ? "ہمارے اساتذہ سے ملیں۔" : "Meet our teachers."}</p>

      {canEdit && (
        <form action={addCategory} className="mb-10 text-center">
          <button className="btn btn-primary !py-2 text-sm">+ {ur ? "نئی کیٹیگری" : "Add category"}</button>
        </form>
      )}

      {categories.length === 0 && (
        <p className="text-center text-slate-500">{ur ? "ابھی کوئی فیکلٹی شامل نہیں۔" : "No faculty added yet."}</p>
      )}

      <div className="space-y-14">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
              {canEdit && (
                <div className="flex flex-col leading-none">
                  <form action={moveCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <input type="hidden" name="dir" value="up" />
                    <button disabled={cat.id === firstCat} className={arrowBtn}>▲</button>
                  </form>
                  <form action={moveCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <input type="hidden" name="dir" value="down" />
                    <button disabled={cat.id === lastCat} className={arrowBtn}>▼</button>
                  </form>
                </div>
              )}
              <Editable
                field={`facultycat:${cat.id}:name${suffix}`}
                value={ur ? cat.nameUr : cat.nameEn}
                as="h2"
                className="text-2xl font-bold text-brand"
                placeholder={ur ? "کیٹیگری کا نام" : "Category name"}
              />
              {canEdit && (
                <ConfirmDeleteButton
                  action={deleteCategory}
                  fields={{ id: cat.id }}
                  message={ur ? "یہ کیٹیگری اور اس کے تمام ارکان حذف کریں؟" : "Delete this category and all its members?"}
                  className="rounded-full border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                >
                  ✕
                </ConfirmDeleteButton>
              )}
            </div>

            {canEdit && (
              <form action={addFaculty} className="mb-5 text-center">
                <input type="hidden" name="categoryId" value={cat.id} />
                <button className="rounded-full border border-brand px-3 py-1 text-xs font-semibold text-brand hover:bg-brand-light">
                  + {ur ? "استاد شامل کریں" : "Add teacher"}
                </button>
              </form>
            )}

            <div className="flex flex-wrap justify-center gap-6">
              {cat.members.map((f, fi) => (
                <div key={f.id} className="relative flex w-full flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition hover:shadow-md sm:w-72">
                  {canEdit && (
                    <div className="absolute right-2 top-2 flex items-center gap-1">
                      <form action={moveFaculty}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="dir" value="up" />
                        <button disabled={fi === 0} className={arrowBtn}>◀</button>
                      </form>
                      <form action={moveFaculty}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="dir" value="down" />
                        <button disabled={fi === cat.members.length - 1} className={arrowBtn}>▶</button>
                      </form>
                      <ConfirmDeleteButton
                        action={deleteFaculty}
                        fields={{ id: f.id }}
                        message={ur ? "اس استاد کو حذف کریں؟" : "Delete this teacher?"}
                        className="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 hover:bg-red-600 hover:text-white"
                      >
                        ✕
                      </ConfirmDeleteButton>
                    </div>
                  )}

                  {canEdit ? (
                    <FacultyPhoto facultyId={f.id} photo={f.photo} lang={lang} />
                  ) : (
                    <Link href={`/about/${f.id}`} aria-label={ur ? "پروفائل دیکھیں" : "View profile"}>
                      <FacultyPhoto facultyId={f.id} photo={f.photo} lang={lang} />
                    </Link>
                  )}

                  <Editable
                    field={`faculty:${f.id}:name${suffix}`}
                    value={ur ? f.nameUr : f.nameEn}
                    as="p"
                    className="mt-3 text-lg font-bold text-brand-dark"
                    placeholder={ur ? "نام" : "Name"}
                  />
                  <Editable
                    field={`faculty:${f.id}:short${suffix}`}
                    value={ur ? f.shortUr : f.shortEn}
                    as="p"
                    multiline
                    className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600"
                    placeholder={ur ? "مختصر تعارف…" : "Short description…"}
                  />

                  <Link href={`/about/${f.id}`} className="mt-3 text-sm font-semibold text-brand hover:underline">
                    {ur ? "مکمل تعارف →" : "View full profile →"}
                  </Link>
                </div>
              ))}
              {cat.members.length === 0 && (
                <p className="w-full text-center text-sm text-slate-400">
                  {ur ? "اس کیٹیگری میں ابھی کوئی استاد نہیں۔" : "No teachers in this category yet."}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
