import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">

        {/* 404 */}
        <p className="text-8xl font-black text-white/5 leading-none mb-2 select-none">404</p>

        <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-2xl mx-auto mb-5">
          🔍
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">Page not found</h1>
        <p className="text-white/40 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href="/admin/surveys/new"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-[0_8px_24px_rgba(99,102,241,0.35)] hover:brightness-110 transition-all text-center"
          >
            Go to Admin Dashboard
          </Link>
          <Link
            href="/"
            className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold text-sm hover:bg-white/8 transition-all text-center"
          >
            Back to Home
          </Link>
        </div>

        <p className="text-white/20 text-xs mt-6">
          If you have a survey link, check that the URL is correct.
        </p>
      </div>
    </div>
  );
}
