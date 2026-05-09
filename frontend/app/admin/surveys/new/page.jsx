"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { surveyAPI } from "@/lib/api";

const STEPS = [
  { label: "Create Survey", icon: "✏️", active: true },
  { label: "Add Questions", icon: "📝", active: false },
  { label: "Publish", icon: "🚀", active: false },
];

export default function NewSurveyPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError("Survey title is required."); return; }
    setLoading(true);
    setError(null);
    try {
      const { data } = await surveyAPI.create({ title: title.trim() });
      router.push(`/admin/surveys/${data.id}/questions`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create survey.");
      setLoading(false);
    }
  };

  const disabled = loading || !title.trim();

  return (
    <div>
      {/* Header */}
      <div className="mb-9">
        <div className="inline-flex items-center bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3.5">
          Step 1 of 3
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Create New Survey</h1>
        <p className="text-slate-500 text-sm">Give your survey a clear, descriptive title to get started</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-indigo-500/10 p-9 shadow-[0_8px_40px_rgba(99,102,241,0.08)]">
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
            Survey Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Candidate Video Survey 2025"
            autoFocus
            className="w-full px-4 py-3.5 border-2 border-slate-200 rounded-xl text-base text-slate-900 bg-slate-50 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
          />

          {error && (
            <div className="mt-3.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={disabled}
            className={
              "mt-6 w-full py-4 rounded-xl font-bold text-base text-white transition-all " +
              (disabled
                ? "bg-indigo-200 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:brightness-110 cursor-pointer")
            }
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-fast inline-block" />
                Creating…
              </span>
            ) : "Continue to Questions →"}
          </button>
        </form>
      </div>

      {/* Step indicators */}
      <div className="mt-7 flex gap-2.5">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className={
              "flex-1 px-3 py-3.5 rounded-xl text-center text-xs border transition " +
              (step.active
                ? "bg-gradient-to-br from-violet-100 to-purple-100 border-purple-300 text-violet-700 font-bold"
                : "bg-white border-slate-200 text-slate-400 font-medium")
            }
          >
            <div className="text-xl mb-1">{step.icon}</div>
            {step.label}
          </div>
        ))}
      </div>
    </div>
  );
}
