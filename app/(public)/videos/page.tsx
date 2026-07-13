import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { getSession } from "@/lib/auth";
import { t } from "@/lib/i18n";
import { VideoCard } from "@/components/VideoCard";
import { VideoDescription } from "@/components/VideoDescription";
import { AddVideoForm } from "@/components/AddVideoForm";
import AdminFilterBar from "@/components/AdminFilterBar";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { deleteVideo } from "@/app/actions/video";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const lang = await getLang();
  const ur = lang === "ur";
  const session = await getSession();

  // Only logged-in users (student or teacher) may watch the videos.
  if (!session) {
    return (
      <section className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-center text-3xl font-bold text-brand-dark">{ur ? "ویڈیوز" : "Videos"}</h1>
        <div className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-slate-600">{ur ? "ویڈیوز دیکھنے کے لیے براہ کرم لاگ اِن کریں۔" : "Please log in to watch the videos."}</p>
          <Link href="/login" className="btn btn-primary mt-4">{t(lang, "nav.login")}</Link>
        </div>
      </section>
    );
  }

  const canEdit = session.role === "TEACHER";
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const sort = sp.sort ?? "";

  const all = await prisma.video.findMany({ orderBy: { createdAt: "desc" } });
  const videos = all
    .filter((v) => !q || v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q))
    .sort((a, b) => {
      switch (sort) {
        case "oldest":
          return +a.createdAt - +b.createdAt;
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return +b.createdAt - +a.createdAt; // newest
      }
    });

  return (
    <section className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{ur ? "ویڈیوز" : "Videos"}</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">{ur ? "ہماری یوٹیوب ویڈیوز دیکھیں۔" : "Watch our YouTube videos."}</p>

      {canEdit && (
        <div className="mb-6">
          <AddVideoForm lang={lang} />
        </div>
      )}

      {all.length > 0 && (
        <div className="mb-8">
          <AdminFilterBar
            basePath="/videos"
            current={sp}
            search={{ name: "q", placeholder: ur ? "ویڈیوز تلاش کریں…" : "Search videos…" }}
            sort={{
              name: "sort",
              options: [
                { value: "", label: ur ? "تازہ ترین" : "Newest" },
                { value: "oldest", label: ur ? "قدیم ترین" : "Oldest" },
                { value: "title", label: ur ? "عنوان: الف سے ے" : "Title A–Z" },
                { value: "title_desc", label: ur ? "عنوان: ے سے الف" : "Title Z–A" },
              ],
            }}
          />
        </div>
      )}

      {videos.length === 0 ? (
        <p className="text-center text-slate-500">
          {all.length === 0
            ? ur ? "ابھی کوئی ویڈیو نہیں۔" : "No videos yet."
            : ur ? "تلاش سے کوئی ویڈیو نہیں ملی۔" : "No videos match your search."}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div key={v.id} className="relative min-w-0">
              <VideoCard videoId={v.videoId} title={v.title} />
              {canEdit && (
                <div className="absolute right-2 top-2">
                  <ConfirmDeleteButton
                    action={deleteVideo}
                    fields={{ id: v.id }}
                    message={ur ? "یہ ویڈیو ہٹا دیں؟" : "Remove this video?"}
                    className="grid h-7 w-7 place-items-center rounded-full bg-black/60 text-xs font-bold text-white hover:bg-red-600"
                  >
                    ✕
                  </ConfirmDeleteButton>
                </div>
              )}
              <VideoDescription videoId={v.id} description={v.description} lang={lang} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
