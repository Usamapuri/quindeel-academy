"use client";

import { useState } from "react";
import { addFeeRecord } from "@/app/actions/admin";

type Student = { id: string; name: string };
type Course = { id: string; title: string; price: number };

const input =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30";

// "Record a fee" form. The teacher picks the courses being charged; their prices
// are summed automatically, a percentage discount is applied, and the result
// fills the (required) Amount field — which can still be edited by hand.
export default function FeeRecorder({ students, courses }: { students: Student[]; courses: Course[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [discount, setDiscount] = useState("0");
  const [amount, setAmount] = useState("");

  const subtotal = courses.filter((c) => selected[c.id]).reduce((s, c) => s + c.price, 0);
  const compute = (sel: Record<string, boolean>, disc: string) => {
    const sub = courses.filter((c) => sel[c.id]).reduce((s, c) => s + c.price, 0);
    const d = Math.min(100, Math.max(0, parseFloat(disc) || 0));
    return Math.round(sub * (1 - d / 100));
  };

  const toggle = (id: string) => {
    const next = { ...selected, [id]: !selected[id] };
    setSelected(next);
    setAmount(String(compute(next, discount)));
  };
  const onDiscount = (v: string) => {
    setDiscount(v);
    setAmount(String(compute(selected, v)));
  };

  return (
    <form action={addFeeRecord} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-brand-dark">Record a fee</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select name="studentId" required className={input}>
          <option value="">Select learner</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input name="period" placeholder="Period e.g. 2026-08" required className={input} />
        <select name="status" className={input}>
          <option value="DUE">Due</option>
          <option value="PAID">Paid</option>
          <option value="PARTIAL">Partial</option>
        </select>
      </div>

      {/* Course multi-select — prices auto-sum */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Courses charged (prices add up automatically)
        </p>
        {courses.length === 0 ? (
          <p className="text-sm text-slate-400">No courses yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <label key={c.id} className="cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="courseId"
                  value={c.id}
                  checked={!!selected[c.id]}
                  onChange={() => toggle(c.id)}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-500 transition peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white">
                  {c.title}
                  {c.price > 0 ? ` · ${c.price.toLocaleString()}` : " · —"}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold text-slate-500">
          Discount %
          <input
            name="discount"
            type="number"
            min={0}
            max={100}
            value={discount}
            onChange={(e) => onDiscount(e.target.value)}
            className={`${input} mt-1`}
          />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Amount (PKR) <span className="text-red-500">*</span>
          <input
            name="amount"
            type="number"
            min={1}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Required"
            className={`${input} mt-1`}
          />
        </label>
        <input name="note" placeholder="Note (optional)" className={`${input} self-end sm:col-span-2`} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Subtotal <span className="font-semibold text-brand-dark">{subtotal.toLocaleString()}</span>
          {" − "}
          {Math.min(100, Math.max(0, parseFloat(discount) || 0))}% ={" "}
          <span className="font-semibold text-brand-dark">
            {(parseInt(amount, 10) || 0).toLocaleString()} PKR
          </span>
        </p>
        <button className="btn btn-primary !py-2 text-sm">Add fee</button>
      </div>
    </form>
  );
}
