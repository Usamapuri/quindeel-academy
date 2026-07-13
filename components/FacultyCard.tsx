import Link from "next/link";

// A read-only presentation of a single faculty member — the same look as the
// cards on the /about page, but without the inline-edit controls. Used on the
// landing page to feature the founder. Content comes straight from the Faculty
// record, so the professor edits it once (on /about) and it shows here too.
export function FacultyCard({
  id,
  name,
  short,
  photo,
  lang = "en",
}: {
  id: string;
  name: string;
  short: string;
  photo: string;
  lang?: "en" | "ur";
}) {
  const ur = lang === "ur";
  return (
    <div className="card card-hover mx-auto flex w-full max-w-sm flex-col items-center p-7 text-center">
      <span className="grid h-28 w-28 place-items-center overflow-hidden rounded-full bg-slate-100 ring-2 ring-brand/20">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-4xl text-slate-300">👤</span>
        )}
      </span>
      <p className="mt-4 text-lg font-bold text-brand-dark">{name}</p>
      {short && (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-600">{short}</p>
      )}
      <Link href={`/about/${id}`} className="mt-4 text-sm font-semibold text-brand hover:underline">
        {ur ? "مکمل تعارف →" : "View full profile →"}
      </Link>
    </div>
  );
}
