import { prisma } from "@/lib/db";
import { getLang } from "@/lib/lang";
import { TestimonialForm } from "@/components/TestimonialForm";

// Public, no login. Anyone with the current shareable link lands here and can
// leave a testimonial (arrives PENDING for the teacher to approve). An old or
// wrong token shows a friendly "link not valid" note instead of the form.
export default async function TestifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const lang = await getLang();
  const ur = lang === "ur";

  const setting = await prisma.siteSetting.findUnique({ where: { key: "testimonial_token" } });
  const valid = Boolean(setting?.value) && token === setting?.value;

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-center text-3xl font-bold text-brand-dark">
        {ur ? "اپنا تاثر بھیجیں" : "Share your testimonial"}
      </h1>
      <p className="mb-8 mt-3 text-center text-slate-600">
        {ur
          ? "قندیل اکیڈمی اور پروفیسر قندیل کے بارے میں اپنی رائے ہمارے ساتھ شیئر کریں۔"
          : "Tell us about your experience with Quindeel Academy and Prof. Quindeel."}
      </p>

      {valid ? (
        <TestimonialForm token={token} lang={lang} />
      ) : (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-8 text-center text-lg font-semibold text-amber-800">
          {ur
            ? "یہ لنک اب کارآمد نہیں رہا۔ براہ کرم استاد سے نیا لنک طلب کریں۔"
            : "This link is no longer valid. Please ask the teacher for a new one."}
        </div>
      )}
    </section>
  );
}
