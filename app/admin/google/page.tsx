import { googleConfigured, isGoogleConnected, getConnectedAccount } from "@/lib/google";
import { startGoogleConnect, disconnectGoogleAction } from "@/app/actions/google";
import { getLang } from "@/lib/lang";

export default async function GooglePage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const lang = await getLang();
  const ur = lang === "ur";
  const sp = await searchParams;
  const configured = googleConfigured();
  const connected = await isGoogleConnected();
  const account = connected ? await getConnectedAccount() : null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">{ur ? "گوگل کیلنڈر / میٹ" : "Google Calendar / Meet"}</h1>
      <p className="text-slate-600">
        {ur
          ? "اپنا گوگل اکاؤنٹ منسلک کریں تاکہ لائیو کلاس شیڈول کرتے وقت خودبخود گوگل میٹ لنک بن جائے اور اندراج شدہ طلبہ کو دعوت مل جائے۔ اگر منسلک نہ ہو تو آپ لائیو کلاسز کے صفحے پر میٹنگ لنک خود بھی پیسٹ کر سکتے ہیں۔"
          : "Connect your Google account so that scheduling a live class automatically creates a Google Meet link and invites the enrolled learners. If it is not connected, you can still paste a meeting link manually on the Live Classes page."}
      </p>

      {sp.connected && (
        <p className="rounded-lg bg-emerald-50 px-4 py-2 font-medium text-emerald-700">{ur ? "✓ گوگل کامیابی سے منسلک ہو گیا۔" : "✓ Google connected successfully."}</p>
      )}
      {sp.error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 font-medium text-red-700">{ur ? "منسلک نہیں ہو سکا۔ براہ کرم دوبارہ کوشش کریں۔" : "Could not connect. Please try again."}</p>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {!configured ? (
          <div className="space-y-2">
            <p className="font-semibold text-amber-700">{ur ? "⚠️ گوگل ابھی ترتیب نہیں دیا گیا۔" : "⚠️ Google is not set up yet."}</p>
            <p className="text-sm text-slate-600">
              {ur ? "ایک ایڈمنسٹریٹر کو سرور سیٹنگز میں " : "An administrator needs to add "}
              <code className="rounded bg-slate-100 px-1">GOOGLE_CLIENT_ID</code>,{" "}
              <code className="rounded bg-slate-100 px-1">GOOGLE_CLIENT_SECRET</code> {ur ? "اور" : "and"}{" "}
              <code className="rounded bg-slate-100 px-1">GOOGLE_REDIRECT_URI</code>
              {ur
                ? " شامل کرنے کی ضرورت ہے۔ تب تک میٹنگ لنکس خود پیسٹ کریں — باقی سب کچھ کام کرتا ہے۔"
                : " in the server settings. Until then, paste meeting links manually — everything else works."}
            </p>
          </div>
        ) : connected ? (
          <div className="space-y-3">
            <p className="font-semibold text-emerald-700">{ur ? "🔗 منسلک" : "🔗 Connected"}{account?.email ? `${ur ? " — " : " as "}${account.email}` : ""}.</p>
            <form action={disconnectGoogleAction}>
              <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {ur ? "منقطع کریں" : "Disconnect"}
              </button>
            </form>
          </div>
        ) : (
          <form action={startGoogleConnect}>
            <button className="btn btn-primary">{ur ? "گوگل اکاؤنٹ منسلک کریں" : "Connect Google account"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
