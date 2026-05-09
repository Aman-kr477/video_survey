"use client";
import { createContext, useContext, useState } from "react";

const SurveyContext = createContext(null);

export function SurveyProvider({ children }) {
  const [submissionId, setSubmissionId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(1);
  const [violationCount, setViolationCount] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);

  return (
    <SurveyContext.Provider
      value={{
        submissionId, setSubmissionId,
        currentQuestionIndex, setCurrentQuestionIndex,
        violationCount, setViolationCount,
        isTerminated, setIsTerminated,
      }}
    >
      {children}
    </SurveyContext.Provider>
  );
}

export const useSurvey = () => {
  const ctx = useContext(SurveyContext);
  if (!ctx) throw new Error("useSurvey must be used inside SurveyProvider");
  return ctx;
};
