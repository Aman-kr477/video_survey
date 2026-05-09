"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { surveyAPI } from "@/lib/api";

const EMPTY_QUESTIONS = Array.from({ length: 5 }, (_, i) => ({
  question_text: "",
  order: i + 1,
}));

export default function QuestionsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState(EMPTY_QUESTIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [focusedIdx, setFocusedIdx] = useState(null);

  const updateQuestion = (index, value) =>
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, question_text: value } : q)));

  const allFilled = questions.every((q) => q.question_text.trim().length > 0);
  const filledCount = questions.filter((q) => q.question_text.trim()).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allFilled) { setError("All 5 questions must be filled before saving."); return; }
    setLoading(true);
    setError(null);
    try {
      await surveyAPI.addQuestionsBulk(id, { questions });
      router.push(`/admin/surveys/${id}/publish`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save questions.");
      setLoading(false);
    }
  };

  const disabled = loading || !allFilled;

  return (
    <div>
      {/* Header */}
      <div className="mb-9">
        <div className="inline-flex items-center bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3.5">
          Step 2 of 3
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Add 5 Questions</h1>
        <p className="text-slate-500 text-sm">All questions are Yes/No — fill all 5 to continue</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 mb-5">
          {questions.map((q, i) => {
            const filled = q.question_text.trim().length > 0;
            const isFocused = focusedIdx === i;
            return (
              <div
                key={i}
                className={
                  "rounded-2xl p-5 border-2 transition-all " +
                  (isFocused
                    ? "border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.1)] bg-white"
                    : filled
                    ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50"
                    : "border-slate-200 bg-white shadow-sm")
                }
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all " +
                    (filled
                      ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                      : isFocused
                      ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white"
                      : "bg-slate-100 text-slate-400")
                  }>
                    {filled ? "✓" : q.order}
                  </div>
                  <span className={
                    "text-xs font-bold uppercase tracking-wide " +
                    (filled ? "text-green-700" : isFocused ? "text-indigo-600" : "text-slate-500")
                  }>
                    Question {q.order}
                  </span>
                  {filled && (
                    <span className="ml-auto text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      ✓ Filled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={q.question_text}
                  onChange={(e) => updateQuestion(i, e.target.value)}
                  placeholder="Type your question here…"
                  onFocus={() => setFocusedIdx(i)}
                  onBlur={() => setFocusedIdx(null)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 bg-white/80 outline-none"
                />
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3.5 px-5 py-4 bg-white border border-slate-200 rounded-2xl mb-4 shadow-sm">
          <div className="flex-1 flex gap-1.5">
            {questions.map((q, i) => (
              <div
                key={i}
                className={
                  "flex-1 h-2 rounded-full transition-all duration-300 " +
                  (q.question_text.trim() ? "bg-gradient-to-r from-green-500 to-emerald-500" : "bg-slate-100")
                }
              />
            ))}
          </div>
          <span className={
            "text-xs font-bold whitespace-nowrap " +
            (filledCount === 5 ? "text-green-700" : "text-slate-500")
          }>
            {filledCount} / 5 filled
          </span>
        </div>

        {error && (
          <div className="px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 mb-4">
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={disabled}
          className={
            "w-full py-4 rounded-xl font-bold text-base text-white transition-all " +
            (disabled
              ? "bg-indigo-200 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_4px_20px_rgba(99,102,241,0.35)] hover:brightness-110 cursor-pointer")
          }
        >
          {loading
            ? "Saving…"
            : !allFilled
            ? `Fill all 5 questions to continue (${filledCount}/5)`
            : "Continue to Publish →"}
        </button>
      </form>
    </div>
  );
}
