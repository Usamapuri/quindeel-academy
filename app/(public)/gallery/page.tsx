import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { PhotoGallery } from "@/components/PhotoGallery";

export default async function GalleryPage() {
  const lang = await getLang();
  const ur = lang === "ur";
  const photos = await prisma.photo.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-brand-dark">{ur ? "تصویری گیلری" : "Photo Gallery"}</h1>
      <p className="mb-8 mt-2 text-center text-slate-600">
        {ur ? "اکیڈمی کی تصاویر اور لمحات۔" : "Photos and moments from the academy."}
      </p>
      <PhotoGallery
        photos={photos.map((p) => ({ id: p.id, url: p.url }))}
        configured={cloudinaryConfigured()}
        lang={lang}
      />
    </section>
  );
}
