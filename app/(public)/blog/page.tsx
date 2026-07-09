import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { Editable } from "@/components/Editable";
import { BlogImage } from "@/components/BlogImage";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { addBlogPost, deleteBlogPost, toggleBlogPublished } from "@/app/actions/blog";

export default async function BlogPage() {
  const lang = await getLang();
  const ur = lang === "ur";
  const session = await getSession();
  const canEdit = session?.role === "TEACHER";
  const suffix = ur ? "Ur" : "En";

  const posts = await prisma.blogPost.findMany({
    where: canEdit ? {} : { published: true },
    orderBy: { createdAt: "desc" },
  });
  const fmt = (d: Date) => new Date(d).toLocaleDateString(ur ? "ur-PK" : "en-GB", { dateStyle: "medium" });

  return (
    <section className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{ur ? "بلاگ" : "Blog"}</h1>
      <p className="mt-2 text-center text-slate-600">
        {ur ? "اکیڈمی کی خبریں، مضامین اور اعلانات۔" : "Academy news, articles and announcements."}
      </p>

      {canEdit && (
        <form action={addBlogPost} className="mt-5 text-center">
          <button className="btn btn-primary !py-2 text-sm">+ {ur ? "نئی پوسٹ" : "New post"}</button>
        </form>
      )}

      {posts.length === 0 && (
        <p className="mt-10 text-center text-slate-500">{ur ? "ابھی کوئی پوسٹ نہیں۔" : "No posts yet."}</p>
      )}

      <div className="mt-8 space-y-8">
        {posts.map((p) => (
          <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-400">{fmt(p.createdAt)}</span>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <form action={toggleBlogPublished}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="published" value={String(p.published)} />
                    <button
                      className={
                        "rounded-full px-3 py-1 text-xs font-semibold " +
                        (p.published ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")
                      }
                    >
                      {p.published ? (ur ? "شائع شدہ" : "Published") : (ur ? "پوشیدہ (شائع کریں)" : "Hidden (publish)")}
                    </button>
                  </form>
                  <ConfirmDeleteButton
                    action={deleteBlogPost}
                    fields={{ id: p.id }}
                    message={ur ? "یہ پوسٹ حذف کریں؟\n\nیہ عمل واپس نہیں ہو سکتا۔" : "Delete this post?\n\nThis cannot be undone."}
                    className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  />
                </div>
              )}
            </div>

            <div className="mt-3">
              <BlogImage postId={p.id} initial={p.image} lang={lang} />
            </div>

            <Editable
              field={`blog:${p.id}:title${suffix}`}
              value={ur ? p.titleUr : p.titleEn}
              as="h2"
              className="mt-1 text-2xl font-bold text-brand-dark"
              placeholder={ur ? "پوسٹ کا عنوان…" : "Post title…"}
            />
            <Editable
              field={`blog:${p.id}:body${suffix}`}
              value={ur ? p.bodyUr : p.bodyEn}
              as="div"
              multiline
              className="mt-2 leading-relaxed text-slate-700"
              placeholder={ur ? "یہاں لکھیں…" : "Write the post here…"}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
