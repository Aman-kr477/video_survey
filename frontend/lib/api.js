import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Utility ──────────────────────────────────────────────────────────────────
export const utilAPI = {
  getMyIp: () => api.get("/api/my-ip"),
};

// ── Survey APIs ──────────────────────────────────────────────────────────────
export const surveyAPI = {
  create: (data) => api.post("/api/surveys", data),
  get: (id) => api.get(`/api/surveys/${id}`),
  addQuestion: (id, data) => api.post(`/api/surveys/${id}/questions`, data),
  addQuestionsBulk: (id, data) => api.post(`/api/surveys/${id}/questions/bulk`, data),
  publish: (id) => api.post(`/api/surveys/${id}/publish`),
};

// ── Submission APIs ───────────────────────────────────────────────────────────
export const submissionAPI = {
  start: (surveyId, data) => api.post(`/api/surveys/${surveyId}/start`, data),
  resume: (surveyId, params) => api.get(`/api/surveys/${surveyId}/resume`, { params }),
  getState: (submissionId) => api.get(`/api/submissions/${submissionId}`),
  submitAnswer: (submissionId, data) => api.post(`/api/submissions/${submissionId}/answers`, data),
  uploadMedia: (submissionId, file) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/api/submissions/${submissionId}/media`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  recordViolation: (submissionId, violationType = "multiple_faces") =>
    api.post(`/api/submissions/${submissionId}/violation`, { violation_type: violationType }),
  complete: (submissionId) => api.post(`/api/submissions/${submissionId}/complete`),
};
