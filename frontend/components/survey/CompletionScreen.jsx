"use client";
export default function CompletionScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-950 flex items-center justify-center p-6">
      {/* Decorative blob */}
      <div className="fixed top-[-100px] right-[-100px] w-80 h-80 rounded-full bg-indigo-500/10 pointer-events-none" />

      <div className="text-center max-w-sm relative z-10">
        <div className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.15)]">
          ✅
        </div>

        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          All Done!
        </h1>
        <p className="text-indigo-300 text-base leading-relaxed mb-10">
          Thank you for completing the survey. Your responses and video have been securely recorded.
        </p>

        <div className="h-px bg-white/10 mb-6" />
        <p className="text-indigo-300/40 text-sm">You may safely close this window</p>
      </div>
    </div>
  );
}
