"use client";
import { useRef, useCallback, useState, useEffect } from "react";
import { useCameraStream } from "@/hooks/useCameraStream";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useViolationTracker } from "@/hooks/useViolationTracker";
import { useVideoRecorder } from "@/hooks/useVideoRecorder";

export default function QuestionScreen({
  question,
  questionIndex,
  totalQuestions = 5,
  violationCount,
  isTerminated,
  onAnswer,
  onViolation,
  onStreamReady, // called once with streamRef so parent can use it for uploads
}) {
  const canvasRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { videoRef, streamRef, cameraError, isReady } = useCameraStream();

  // Give parent access to the stream for session video upload
  useEffect(() => {
    if (isReady && onStreamReady) onStreamReady(streamRef);
  }, [isReady]); // eslint-disable-line

  const { faceStatus, faceScore } = useFaceDetection(videoRef, isReady);
  useViolationTracker(faceStatus, onViolation);

  const { startQuestion, stopQuestion } = useVideoRecorder(streamRef);

  useEffect(() => {
    if (!isReady) return;
    startQuestion();
  }, [isReady, questionIndex]); // eslint-disable-line

  // Reset submitting state when question changes
  useEffect(() => {
    setIsSubmitting(false);
  }, [questionIndex]); // eslint-disable-line

  const captureSnapshot = useCallback(() => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || v.videoWidth === 0) return null;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    return c.toDataURL("image/png");
  }, [videoRef]);

  const handleAnswer = useCallback(
    async (answer) => {
      if (faceStatus !== "ok" || isSubmitting) return;
      setIsSubmitting(true);
      const snapshot = captureSnapshot();
      const videoBlob = await stopQuestion();
      await onAnswer(answer, faceScore, snapshot, videoBlob);
    },
    [faceStatus, faceScore, isSubmitting, captureSnapshot, stopQuestion, onAnswer]
  );

  const faceLabel =
    faceStatus === "loading" ? "Loading…"
    : faceStatus === "checking" ? "Detecting face…"
    : faceStatus === "ok" ? `✓ Face detected · score ${faceScore}`
    : faceStatus === "no-face" ? "⚠ No face detected"
    : `⚠ Multiple faces · warning ${Math.min(violationCount, 2)}/2`;

  const faceColor =
    faceStatus === "ok" ? "text-green-400"
    : faceStatus === "no-face" ? "text-red-400"
    : faceStatus === "multi-face" ? "text-yellow-400"
    : "text-slate-400";

  const faceDot =
    faceStatus === "ok" ? "bg-green-400 shadow-[0_0_6px_#4ade80]"
    : faceStatus === "no-face" ? "bg-red-400 shadow-[0_0_6px_#f87171] animate-blink"
    : faceStatus === "multi-face" ? "bg-yellow-400 shadow-[0_0_6px_#fbbf24] animate-blink"
    : "bg-slate-400 animate-blink";

  const canSubmit = faceStatus === "ok" && !isSubmitting;
  const progressPct = ((questionIndex - 1) / totalQuestions) * 100;
  const completedCount = questionIndex - 1;

  // ── Terminated ────────────────────────────────────────────────────────────
  if (isTerminated) {
    return (
      <div className="fixed inset-0 bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center p-10 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/25 flex items-center justify-center text-4xl mx-auto mb-6">
            🚫
          </div>
          <h2 className="text-3xl font-extrabold text-gray-50 mb-3 tracking-tight">Survey Terminated</h2>
          <p className="text-gray-500 text-base leading-relaxed">
            Face verification failed 3 times. This session is permanently closed.
          </p>
        </div>
      </div>
    );
  }

  // ── Camera denied ─────────────────────────────────────────────────────────
  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-[#0f0f1a] flex items-center justify-center">
        <div className="text-center p-10 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-4xl mx-auto mb-6">
            📷
          </div>
          <h2 className="text-3xl font-extrabold text-gray-50 mb-3 tracking-tight">Camera Required</h2>
          <p className="text-gray-500 text-base leading-relaxed">{cameraError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 overflow-hidden">

      {/* ── Top progress bar ─────────────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-20">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 transition-[width] duration-700"
          style={{ width: progressPct + "%" }}
        />
      </div>

      {/* ── Camera panel — top-left ───────────────────────────────────────── */}
      <div className="absolute top-5 left-5 w-72 z-30 rounded-2xl overflow-hidden bg-black shadow-[0_12px_48px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.08)]">
        {/* Live video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full block aspect-[4/3] object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* REC / SAVING badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/65 rounded-full px-2.5 py-1">
          <span className={"w-1.5 h-1.5 rounded-full " + (isSubmitting ? "bg-yellow-400" : "bg-red-500 animate-blink")} />
          <span className="text-white text-[10px] font-bold tracking-wide">{isSubmitting ? "SAVING" : "REC"}</span>
        </div>

        {/* Face status bar */}
        <div className="px-3.5 py-2.5 bg-black/85 border-t border-white/5 flex items-center gap-2">
          <span className={"w-2 h-2 rounded-full flex-shrink-0 " + faceDot} />
          <span className={"text-xs font-semibold leading-tight " + faceColor}>{faceLabel}</span>
        </div>

        {/* Floating alert inside camera */}
        {!isSubmitting && (faceStatus === "no-face" || faceStatus === "multi-face") && (
          <div className={
            "absolute bottom-12 left-2.5 right-2.5 rounded-xl px-3 py-2.5 flex items-center gap-2 backdrop-blur-sm shadow-lg " +
            (faceStatus === "no-face" ? "bg-red-500/90" : "bg-amber-500/90")
          }>
            <span className="text-base">{faceStatus === "no-face" ? "👁" : "⚠️"}</span>
            <span className="text-white text-[11px] font-bold leading-tight">
              {faceStatus === "no-face"
                ? "No face — look at camera"
                : `Warning ${Math.min(violationCount, 2)}/2 — one face only`}
            </span>
          </div>
        )}
      </div>

      {/* ── Question area ─────────────────────────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-center pl-[340px] pr-8 pt-16 pb-10">
        <div className="w-full max-w-xl animate-slide-up">

          {/* Badge */}
          <div className="inline-flex items-center bg-indigo-500/15 border border-indigo-500/30 rounded-full px-4 py-1 mb-6">
            <span className="text-indigo-300 text-xs font-bold tracking-widest uppercase">
              Question {questionIndex} of {totalQuestions}
            </span>
          </div>

          {/* Question text */}
          <h2 className="text-3xl font-extrabold text-gray-50 leading-snug mb-8 tracking-tight">
            {question}
          </h2>

          {/* Alert banners */}
          {!isSubmitting && faceStatus === "no-face" && (
            <div className="flex items-start gap-3.5 bg-red-500/10 border border-red-500/20 border-l-4 border-l-red-500 rounded-xl px-5 py-4 mb-6">
              <span className="text-lg">👁</span>
              <div>
                <p className="text-red-300 font-bold text-sm mb-0.5">No face detected</p>
                <p className="text-red-300/70 text-xs">Position your face clearly in the camera to answer.</p>
              </div>
            </div>
          )}
          {!isSubmitting && faceStatus === "multi-face" && violationCount < 3 && (
            <div className="flex items-start gap-3.5 bg-amber-500/10 border border-amber-500/20 border-l-4 border-l-amber-500 rounded-xl px-5 py-4 mb-6">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-yellow-300 font-bold text-sm mb-0.5">
                  Warning {Math.min(violationCount, 2)} of 2
                </p>
                <p className="text-yellow-300/70 text-xs">Only one face should be visible in the camera.</p>
              </div>
            </div>
          )}

          {/* Yes / No buttons */}
          <div className="flex gap-3.5">
            <button
              onClick={() => handleAnswer("Yes")}
              disabled={!canSubmit}
              className={
                "flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-150 " +
                (canSubmit
                  ? "bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-[0_8px_24px_rgba(99,102,241,0.4)] hover:brightness-110 cursor-pointer"
                  : "bg-indigo-500/10 text-white/20 cursor-not-allowed")
              }
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast inline-block" />
                  Saving…
                </span>
              ) : "👍  Yes"}
            </button>

            <button
              onClick={() => handleAnswer("No")}
              disabled={!canSubmit}
              className={
                "flex-1 py-4 rounded-2xl font-bold text-lg transition-all duration-150 " +
                (canSubmit
                  ? "bg-white/7 border border-white/12 text-slate-200 hover:bg-white/10 cursor-pointer"
                  : "bg-white/2 border border-white/4 text-white/15 cursor-not-allowed")
              }
            >
              {isSubmitting ? "…" : "👎  No"}
            </button>
          </div>

          {/* Step dots */}
          <div className="flex justify-center gap-2 mt-9">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className={
                  "h-1.5 rounded-full transition-all duration-300 " +
                  (i < questionIndex - 1
                    ? "bg-indigo-500 w-1.5"
                    : i === questionIndex - 1
                    ? "bg-violet-400 w-7"
                    : "bg-white/10 w-1.5")
                }
              />
            ))}
          </div>
          <p className="text-center text-white/20 text-xs mt-2.5">
            {completedCount} of {totalQuestions} completed
          </p>
        </div>
      </div>
    </div>
  );
}
