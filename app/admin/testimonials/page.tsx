import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import {
  deleteTestimonial,
  setTestimonialStatus,
  regenerateTestimonialLink,
} from "@/app/actions/testimonial";
import ConfirmDeleteButton from "@/components/ConfirmDeleteButton";
import { CopyLinkButton } from "@/components/CopyLinkButton";

export default async function AdminTestimonialsPage() {
  const lang = await getLang();
  const ur = lang === "ur";

  const [setting, all] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: "testimonial_token" } }),
    prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  const token = setting?.value || "";
  const pending = all.filter((t) => t.status === "pending");
  const live = all.filter((t) => t.status !== "pending");

  // Build the absolute shareable URL from the incoming request (works on
  // localhost and in production without any env config).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const shareUrl = token ? `${proto}://${host}/testify/${token}` : "";

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{ur ? "آراء و تاثرات" : "Testimonials"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {ur
            ? "لوگوں کو نیچے دیا گیا لنک بھیجیں۔ ان کے تاثرات یہاں آئیں گے — جسے آپ منظور کریں گے وہی ویب سائٹ پر دکھایا جائے گا۔"
            : "Send people the link below. Their testimonials arrive here — only the ones you approve appear on the website."}
        </p>
      </div>

      {/* Shareable link */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-bold text-brand-dark">{ur ? "شیئر کرنے والا لنک" : "Shareable link"}</h2>
        <p className="mb-4 text-sm text-slate-500">
          {ur
            ? "یہ ایک ہی لنک آپ جتنے چاہیں لوگوں کو بھیج سکتے ہیں۔"
            : "Send this one link to as many people as you like."}
        </p>

        {token ? (
          <div className="space-y-3">
            <CopyLinkButton url={shareUrl} lang={lang} />
            <form action={regenerateTestimonialLink}>
              <button className="text-sm font-semibold text-slate-500 underline hover:text-red-600">
                {ur ? "نیا لنک بنائیں (پرانا بند ہو جائے گا)" : "Generate a new link (old one stops working)"}
              </button>
            </form>
          </div>
        ) : (
          <form action={regenerateTestimonialLink}>
            <button className="btn btn-primary !py-2 text-sm">
              {ur ? "لنک بنائیں" : "Create link"}
            </button>
          </form>
        )}
      </section>

      {/* Pending queue */}
      <section>
        <h2 className="mb-3 font-bold text-brand-dark">
          {ur ? "زیرِ التوا" : "Pending review"}
          {pending.length > 0 && (
            <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              {pending.length}
            </span>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-slate-400">{ur ? "کوئی نیا تاثر نہیں۔" : "Nothing new to review."}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pending.map((t) => (
              <TestimonialCard key={t.id} t={t} ur={ur} pending />
            ))}
          </div>
        )}
      </section>

      {/* Live on the site */}
      <section>
        <h2 className="mb-3 font-bold text-brand-dark">{ur ? "ویب سائٹ پر موجود" : "Live on the site"}</h2>
        {live.length === 0 ? (
          <p className="text-sm text-slate-400">{ur ? "ابھی کوئی نہیں۔" : "None yet."}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {live.map((t) => (
              <TestimonialCard key={t.id} t={t} ur={ur} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type Row = { id: string; author: string; role: string; quote: string; photo: string };

function TestimonialCard({ t, ur, pending }: { t: Row; ur: boolean; pending?: boolean }) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="whitespace-pre-wrap break-words text-sm italic leading-relaxed text-slate-700">
        “{t.quote}”
      </p>
      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3">
        {t.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.photo} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200" />
        )}
        <div>
          <p className="font-bold text-brand-dark">{t.author || (ur ? "(بے نام)" : "(no name)")}</p>
          {t.role && <p className="text-xs text-slate-500">{t.role}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {pending ? (
          <form action={setTestimonialStatus}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="status" value="approved" />
            <button className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">
              ✓ {ur ? "منظور کریں" : "Approve"}
            </button>
          </form>
        ) : (
          <form action={setTestimonialStatus}>
            <input type="hidden" name="id" value={t.id} />
            <input type="hidden" name="status" value="pending" />
            <button className="rounded-full border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
              {ur ? "ویب سائٹ سے ہٹائیں" : "Unpublish"}
            </button>
          </form>
        )}
        <ConfirmDeleteButton
          action={deleteTestimonial}
          fields={{ id: t.id }}
          message={ur ? "یہ تاثر حذف کریں؟" : "Delete this testimonial?"}
          className="rounded-full border border-red-200 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          {ur ? "حذف کریں" : "Delete"}
        </ConfirmDeleteButton>
      </div>
    </div>
  );
}
