"use client";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { SurveyProvider } from "@/context/SurveyContext";

const PUBLIC_PAGES = ["/survey"];
const ADMIN_PAGES = ["/admin"];

export default function AppLayout({ children }) {
  const pathname = usePathname();

  const isPublicPage = useMemo(
    () => pathname === "/" || PUBLIC_PAGES.some((p) => pathname.startsWith(p)),
    [pathname]
  );

  const isAdminPage = useMemo(
    () => ADMIN_PAGES.some((p) => pathname.startsWith(p)),
    [pathname]
  );

  if (isPublicPage) {
    return (
      <SurveyProvider>
        <div className="min-h-screen bg-slate-950">{children}</div>
      </SurveyProvider>
    );
  }

  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-green-50">
        <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-indigo-500/10 shadow-sm h-16 flex items-center gap-3 px-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-lg">
            📊
          </div>
          <div>
            <span className="font-extrabold text-base text-slate-800 tracking-tight">Survey Admin</span>
            <span className="text-xs text-slate-400 ml-2">Video Survey Platform</span>
          </div>
        </header>
        <main className="max-w-3xl mx-auto px-6 py-12">{children}</main>
      </div>
    );
  }

  return <div className="min-h-screen">{children}</div>;
}
