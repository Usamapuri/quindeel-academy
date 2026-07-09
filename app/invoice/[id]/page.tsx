import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getLang } from "@/lib/lang";
import { getSettings } from "@/lib/content";
import { pick } from "@/lib/i18n";
import { PrintButton } from "@/components/PrintButton";

const STATUS = {
  PAID: { en: "Paid", ur: "ادا شدہ", cls: "bg-emerald-100 text-emerald-700" },
  DUE: { en: "Due", ur: "واجب الادا", cls: "bg-red-100 text-red-700" },
  PARTIAL: { en: "Partial", ur: "جزوی", cls: "bg-amber-100 text-amber-700" },
} as const;

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const fee = await prisma.feeRecord.findUnique({ where: { id }, include: { student: true, course: true } });
  if (!fee) notFound();
  // A student may only open their own invoice; the teacher may open any.
  if (session.role !== "TEACHER" && fee.studentId !== session.sub) notFound();

  const lang = await getLang();
  const ur = lang === "ur";
  const s = await getSettings();
  const academy = (ur ? s.academyNameUr : s.academyNameEn) || s.academyNameEn || "Quindeel Academy";
  const teacherName = (ur ? s.teacherNameUr : s.teacherNameEn) || "";
  const st = STATUS[fee.status as keyof typeof STATUS];

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString(ur ? "ur-PK" : "en-GB", { dateStyle: "medium" }) : "—";
  const money = (n: number) => `${n.toLocaleString()} ${ur ? "روپے" : "PKR"}`;
  const isReceipt = fee.status === "PAID";
  const docTitle = isReceipt ? (ur ? "ادائیگی کی رسید" : "Payment Receipt") : (ur ? "فیس انوائس" : "Fee Invoice");

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-brand-dark">{value}</span>
    </div>
  );

  return (
    <div dir={ur ? "rtl" : "ltr"} className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <a href={session.role === "TEACHER" ? "/admin/fees" : "/portal"} className="text-sm font-semibold text-brand hover:text-brand-dark">
          ← {ur ? "واپس" : "Back"}
        </a>
        <PrintButton label={`⬇ ${ur ? "پی ڈی ایف محفوظ کریں" : "Save as PDF"}`} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xl font-extrabold text-brand-dark">{academy}</p>
            {teacherName && <p className="text-sm text-slate-500">{teacherName}</p>}
          </div>
          <div className="text-end">
            <p className="text-lg font-bold text-brand-dark">{docTitle}</p>
            <p className="text-xs text-slate-500">#{fee.id.slice(-8).toUpperCase()}</p>
            <span className={"mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold " + st.cls}>
              {ur ? st.ur : st.en}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{ur ? "بنام" : "Billed to"}</p>
            <p className="font-bold text-brand-dark">{fee.student.name}</p>
            <p className="text-sm text-slate-500">{fee.student.email}</p>
            {fee.student.phone && <p className="text-sm text-slate-500">{fee.student.phone}</p>}
          </div>
          <div className="sm:text-end">
            <Row label={ur ? "جاری کردہ" : "Issued"} value={fmt(fee.createdAt)} />
            {fee.status === "PAID" && <Row label={ur ? "ادائیگی کی تاریخ" : "Paid on"} value={fmt(fee.paidOn)} />}
            <Row label={ur ? "مدت" : "Period"} value={fee.period} />
          </div>
        </div>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-start text-slate-500">
              <th className="py-2 text-start font-semibold">{ur ? "تفصیل" : "Description"}</th>
              <th className="py-2 text-end font-semibold">{ur ? "رقم" : "Amount"}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-100">
              <td className="py-3 text-brand-dark">
                {fee.course ? pick(lang, fee.course.titleEn, fee.course.titleUr) : ur ? "فیس" : "Fee"}
                <span className="text-slate-400"> · {fee.period}</span>
              </td>
              <td className="py-3 text-end font-medium text-brand-dark">{money(fee.amount)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-end font-bold text-brand-dark">{ur ? "کل" : "Total"}</td>
              <td className="py-3 text-end text-lg font-extrabold text-brand">{money(fee.amount)}</td>
            </tr>
          </tfoot>
        </table>

        {fee.note && (
          <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <span className="font-semibold">{ur ? "نوٹ: " : "Note: "}</span>
            {fee.note}
          </p>
        )}

        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-sm text-slate-500">
          {isReceipt
            ? ur ? "ادائیگی کا شکریہ۔" : "Thank you for your payment."
            : ur ? "براہ کرم مقررہ تاریخ تک ادائیگی کر دیں۔" : "Please make the payment by the due date."}
        </p>
      </div>
    </div>
  );
}
