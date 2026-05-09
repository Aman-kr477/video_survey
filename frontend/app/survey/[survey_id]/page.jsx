"use client";
import dynamic from "next/dynamic";
import FullPageLoader from "@/components/ui/FullPageLoader";

const SurveyPageInner = dynamic(() => import("./SurveyPageInner"), {
  ssr: false,
  loading: () => <FullPageLoader message="Loading survey..." />,
});

export default function SurveyPage() {
  return <SurveyPageInner />;
}
