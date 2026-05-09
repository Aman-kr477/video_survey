"use client";

export default function InstructionScreen({ onStart }) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl mx-auto mb-4">
            📋
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">Before You Begin</h1>
          <p className="text-white/40 text-sm">Read carefully before starting</p>
        </div>

        {/* Instructions list */}
        <ul className="space-y-3 mb-8">

          <li className="flex items-start gap-3 text-sm text-white/70">
            <span className="mt-0.5 text-base">📷</span>
            <span>Allow camera access when prompted — your face must be <span className="text-white font-semibold">clearly visible</span> throughout.</span>
          </li>

          <li className="flex items-start gap-3 text-sm text-white/70">
            <span className="mt-0.5 text-base">👤</span>
            <span><span className="text-red-400 font-semibold">Only one face</span> is allowed in the frame at all times.</span>
          </li>

          <li className="flex items-start gap-3 text-sm text-white/70">
            <span className="mt-0.5 text-base">👁</span>
            <span><span className="text-red-400 font-semibold">Do not leave the frame</span> or cover the camera during the survey.</span>
          </li>

          <li className="flex items-start gap-3 text-sm text-white/70">
            <span className="mt-0.5 text-base">⚠️</span>
            <span>Each violation is recorded. <span className="text-yellow-400 font-semibold">3 violations</span> will permanently terminate your session.</span>
          </li>

          <li className="flex items-start gap-3 text-sm text-white/70">
            <span className="mt-0.5 text-base">🎥</span>
            <span>Your video and responses are <span className="text-white font-semibold">recorded securely</span> for review.</span>
          </li>

        </ul>

        {/* CTA */}
        <button
          onClick={onStart}
          className="w-full py-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-base shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:brightness-110 transition-all cursor-pointer"
        >
          I Understand — Start Survey
        </button>

        <p className="text-center text-white/20 text-xs mt-4">
          By continuing you agree to be recorded during this survey
        </p>
      </div>
    </div>
  );
}
