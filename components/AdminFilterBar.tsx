"use client";

import type { ChangeEvent } from "react";

// Reusable filter + sort bar for admin list pages. It is a plain GET <form>:
// selecting a dropdown auto-submits, and the search box submits on Enter or via
// "Apply". State lives entirely in the URL query string, so the server page can
// read it from searchParams and filter/sort accordingly — no client data logic.

type Option = { value: string; label: string };
type Select = { name: string; label: string; options: Option[] };

export default function AdminFilterBar({
  basePath,
  search,
  selects = [],
  sort,
  current,
}: {
  basePath: string;
  search?: { name: string; placeholder: string };
  selects?: Select[];
  sort?: { name: string; options: Option[] };
  current: Record<string, string | undefined>;
}) {
  const autoSubmit = (e: ChangeEvent<HTMLSelectElement>) =>
    e.currentTarget.form?.requestSubmit();

  const activeKeys = [search?.name, ...selects.map((s) => s.name), sort?.name].filter(
    (n): n is string => Boolean(n),
  );
  const hasActive = activeKeys.some((n) => (current[n] ?? "") !== "");

  const control =
    "rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

  return (
    <form
      method="get"
      action={basePath}
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      {search && (
        <input
          type="search"
          name={search.name}
          defaultValue={current[search.name] ?? ""}
          placeholder={search.placeholder}
          className={`${control} w-52`}
        />
      )}

      {selects.map((s) => (
        <select
          key={s.name}
          name={s.name}
          defaultValue={current[s.name] ?? ""}
          onChange={autoSubmit}
          className={control}
        >
          <option value="">{s.label}</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {sort && (
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          Sort
          <select
            name={sort.name}
            defaultValue={current[sort.name] ?? ""}
            onChange={autoSubmit}
            className={control}
          >
            {sort.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <button
        type="submit"
        className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        Apply
      </button>

      {hasActive && (
        <a
          href={basePath}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-500 hover:bg-slate-100"
        >
          Clear
        </a>
      )}
    </form>
  );
}
