"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { surveyAPI } from "@/lib/api";

export default function PublishPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    surveyAPI.get(id).then(({ data }) => {
      setSurvey(data);
      setPublished(data.is_active);
      setLoading(false);
    });
  }, [id]);

  const handlePublish = async () => {
    setPublishing(true);
    setError(null);
    try {
      await surveyAPI.publish(id);
      setPublished(true);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to publish.");
    } finally {
      setPublishing(false);
    }
  };

  const surveyUrl =
    typeof window !== "undefined"
      ? window.location.origin + "/survey/" + id
      : "/survey/" + id;

  const copyLink = () => {
    navigator.clipboard.writeText(surveyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-slate-500 text-sm">
        <div className="text-3xl mb-3">⏳</div>
        Loading survey…
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-9">
        <div className="inline-flex items-center bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3.5">
          Step 3 of 3
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Review &amp; Publish</h1>
        <p className="text-slate-500 text-sm">Check your questions then make the survey live</p>
      </div>

      {/* Survey card */}
      <div className="bg-white rounded-2xl border border-indigo-500/10 p-7 shadow-[0_8px_40px_rgba(99,102,241,0.08)] mb-5">
        {/* Title row */}
        <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-2xl flex-shrink-0">
            📋
          </div>
          <div className="flex-1">
            <h2 className="font-extrabold text-lg text-slate-900 mb-0.5">{survey?.title}</h2>
            <p className="text-xs text-slate-400">{survey?.questions?.length || 0} questions · Yes/No format</p>
          </div>
          {published && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-3.5 py-1.5 rounded-full text-xs font-bold border border-green-300">
              ✓ Live
            </div>
          )}
        </div>

        {/* Questions list */}
        <div className="flex flex-col gap-2">
          {survey?.questions?.map((q) => (
            <div key={q.id} className="flex items-start gap-3 px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <div className="min-w-[26px] h-[26px] rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                {q.order}
              </div>
              <span className="text-sm text-gray-700 leading-relaxed">{q.question_text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Published state */}
      {published ? (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-300 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
              🎉
            </div>
            <div>
              <p className="font-extrabold text-base text-green-800">Survey is live!</p>
              <p className="text-xs text-green-500">Share this link with respondents</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 bg-white border border-green-200 rounded-xl px-4 py-3.5">
            <span className="flex-1 text-xs text-slate-900 break-all font-mono">{surveyUrl}</span>
            <button
              onClick={copyLink}
              className={
                "px-4 py-2 rounded-lg font-bold text-xs text-white whitespace-nowrap transition-all cursor-pointer " +
                (copied
                  ? "bg-gradient-to-r from-green-500 to-emerald-600"
                  : "bg-gradient-to-r from-indigo-500 to-violet-500 hover:brightness-110")
              }
            >
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          {error && (
            <div className="px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2 mb-4">
              <span>⚠️</span> {error}
            </div>
          )}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className={
              "w-full py-4 rounded-xl font-bold text-base text-white transition-all " +
              (publishing
                ? "bg-green-300 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-emerald-600 shadow-[0_4px_20px_rgba(34,197,94,0.35)] hover:brightness-110 cursor-pointer")
            }
          >
            {publishing ? "Publishing…" : "🚀 Publish Survey"}
          </button>
        </div>
      )}
    </div>
  );
}
