import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { Editable } from "@/components/Editable";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { addTestimonial, deleteTestimonial } from "@/app/actions/testimonial";

export default async function TestimonialsPage() {
  const lang = await getLang();
  const ur = lang === "ur";
  const session = await getSession();
  const canEdit = session?.role === "TEACHER";
  const testimonials = await prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{ur ? "آراء و تاثرات" : "Testimonials"}</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">
        {ur ? "ہمارے طلبہ اور والدین کیا کہتے ہیں۔" : "What our students and parents say."}
      </p>

      {canEdit && (
        <form action={addTestimonial} className="mb-8 text-center">
          <button className="btn btn-primary !py-2 text-sm">+ {ur ? "نیا تاثر" : "Add testimonial"}</button>
        </form>
      )}

      {testimonials.length === 0 ? (
        <p className="text-center text-slate-500">{ur ? "ابھی کوئی تاثر نہیں۔" : "No testimonials yet."}</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {testimonials.map((tm) => (
            <div key={tm.id} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              {canEdit && (
                <div className="absolute right-2 top-2">
                  <ConfirmDeleteButton
                    action={deleteTestimonial}
                    fields={{ id: tm.id }}
                    message={ur ? "یہ تاثر حذف کریں؟" : "Delete this testimonial?"}
                    className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 hover:bg-red-600 hover:text-white"
                  >
                    ✕
                  </ConfirmDeleteButton>
                </div>
              )}
              <p className="text-4xl leading-none text-brand/30">“</p>
              <Editable
                field={`testimonial:${tm.id}:quote`}
                value={tm.quote}
                as="p"
                multiline
                className="-mt-3 whitespace-pre-wrap break-words text-lg italic leading-relaxed text-slate-700"
                placeholder={ur ? "یہاں تاثر لکھیں…" : "Write the testimonial here…"}
              />
              <div className="mt-4 border-t border-slate-100 pt-3">
                <Editable
                  field={`testimonial:${tm.id}:author`}
                  value={tm.author}
                  as="p"
                  className="font-bold text-brand-dark"
                  placeholder={ur ? "نام" : "Name"}
                />
                <Editable
                  field={`testimonial:${tm.id}:role`}
                  value={tm.role}
                  as="p"
                  className="text-sm text-slate-500"
                  placeholder={ur ? "مثلاً: والد / او لیول طالب علم" : "e.g. Parent / O-Level student"}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
