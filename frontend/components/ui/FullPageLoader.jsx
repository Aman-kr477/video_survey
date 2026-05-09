"use client";
export default function FullPageLoader({ message = "Loading…" }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-950 to-indigo-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="w-11 h-11 mx-auto mb-4 rounded-full border-[3px] border-indigo-300/20 border-t-indigo-400 animate-spin-fast" />
        <p className="text-indigo-300 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}
