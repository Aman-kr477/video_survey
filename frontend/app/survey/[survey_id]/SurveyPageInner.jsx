"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { submissionAPI, surveyAPI, utilAPI } from "@/lib/api";
import { useGeolocation } from "@/hooks/useGeolocation";
import QuestionScreen from "@/components/survey/QuestionScreen";
import CompletionScreen from "@/components/survey/CompletionScreen";
import FullPageLoader from "@/components/ui/FullPageLoader";

export default function SurveyPageInner() {
  const { survey_id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [survey, setSurvey] = useState(null);
  const [submissionId, setSubmissionId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [violationCount, setViolationCount] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Receives streamRef from QuestionScreen once camera is ready
  const streamRef = useRef(null);
  const handleStreamReady = useCallback((ref) => { streamRef.current = ref.current; }, []);

  const { location, locationReady } = useGeolocation();
  const locationRef = useRef(null);
  const surveyStarted = useRef(false);

  useEffect(() => { locationRef.current = location; }, [location]);

  useEffect(() => {
    if (!locationReady) return;           // wait for geolocation to finish
    if (surveyStarted.current) return;    // only run once
    surveyStarted.current = true;
    initSurvey(locationRef.current);
  }, [locationReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSubmissionInUrl = useCallback(
    (id) => { router.replace("/survey/" + survey_id + "?submission_id=" + id); },
    [router, survey_id]
  );

  const getFingerprint = (ip) => {
    const ua = navigator.userAgent;
    return {
      ip,
      browser:
        /Chrome/.test(ua) && !/Edg/.test(ua) ? "Chrome"
        : /Firefox/.test(ua) ? "Firefox"
        : /Safari/.test(ua) ? "Safari"
        : /Edg/.test(ua) ? "Edge"
        : "Other",
      os:
        /Windows/.test(ua) ? "Windows"
        : /Mac/.test(ua) ? "macOS"
        : /Linux/.test(ua) ? "Linux"
        : /Android/.test(ua) ? "Android"
        : /iPhone|iPad/.test(ua) ? "iOS"
        : "Unknown",
      device: /Mobi|Android/i.test(ua) ? "Mobile" : "Desktop",
    };
  };

  const initSurvey = async (resolvedLocation) => {
    try {
      setLoading(true);
      const { data: surveyData } = await surveyAPI.get(survey_id);
      setSurvey(surveyData);

      const idFromUrl = searchParams.get("submission_id");
      if (idFromUrl) {
        try {
          const { data: state } = await submissionAPI.getState(idFromUrl);
          if (state.is_terminated) { setSubmissionId(idFromUrl); setIsTerminated(true); return; }
          if (state.is_complete) { setIsComplete(true); return; }
          setSubmissionId(idFromUrl);
          setCurrentIndex(state.current_question_index);
          setViolationCount(state.violation_count);
          return;
        } catch { /* fall through */ }
      }

      let ip = "0.0.0.0";
      try { const { data: ipData } = await utilAPI.getMyIp(); ip = ipData.ip || "0.0.0.0"; } catch { /* fallback */ }

      const fp = getFingerprint(ip);
      const { data: resumeData } = await submissionAPI.resume(survey_id, fp);

      if (resumeData.submission_id) {
        const idx = resumeData.current_question_index;
        if (idx > 5) { setIsComplete(true); return; }
        setSubmissionId(resumeData.submission_id);
        setCurrentIndex(idx);
        setViolationCount(resumeData.violation_count || 0);
        setSubmissionInUrl(resumeData.submission_id);
      } else {
        const { data: startData } = await submissionAPI.start(survey_id, {
          ip: fp.ip, user_agent: navigator.userAgent,
          device: fp.device, os: fp.os, browser: fp.browser,
          location: resolvedLocation || "Unknown",
        });
        setSubmissionId(startData.submission_id);
        setCurrentIndex(startData.current_question_index);
        setSubmissionInUrl(startData.submission_id);
      }
    } catch {
      setError("Failed to load survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = useCallback(
    async (answer, faceScore, faceImageBase64, questionVideoBlob) => {
      const question = survey.questions[currentIndex - 1];
      try {
        const { data } = await submissionAPI.submitAnswer(submissionId, {
          question_id: question.id,
          answer,
          face_detected: true,
          face_score: faceScore,
          face_image_base64: faceImageBase64,
        });

        if (questionVideoBlob) {
          const ext = questionVideoBlob.type.includes("mp4") ? "mp4" : "webm";
          const file = new File([questionVideoBlob], "q" + currentIndex + "." + ext, { type: questionVideoBlob.type });
          submissionAPI.uploadMedia(submissionId, file).catch((e) => console.warn("Video upload failed:", e));
        }

        if (data.current_question_index > 5) {
          await submissionAPI.complete(submissionId);
          setIsComplete(true);
        } else {
          setCurrentIndex(data.current_question_index);
        }
      } catch (e) {
        console.error("Failed to submit answer", e);
      }
    },
    [survey, currentIndex, submissionId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const handleViolation = useCallback(async () => {
    if (!submissionId) return;
    try {
      const { data } = await submissionAPI.recordViolation(submissionId);
      setViolationCount(data.violation_count);
      if (data.is_terminated) setIsTerminated(true);
    } catch (e) {
      console.error("Failed to record violation", e);
    }
  }, [submissionId]);

  if (loading) return <FullPageLoader message="Loading survey..." />;

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950 text-red-400 text-center px-6">
        <div>
          <div className="text-5xl mb-3">⚠️</div>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (isComplete) return <CompletionScreen />;

  const currentQuestion = survey && survey.questions && survey.questions[currentIndex - 1];

  return (
    <QuestionScreen
      question={currentQuestion ? currentQuestion.question_text : ""}
      questionIndex={currentIndex}
      totalQuestions={5}
      violationCount={violationCount}
      isTerminated={isTerminated}
      onAnswer={handleAnswer}
      onViolation={handleViolation}
      onStreamReady={handleStreamReady}
    />
  );
}
