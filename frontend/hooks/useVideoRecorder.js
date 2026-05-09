"use client";
import { useRef, useCallback } from "react";

/**
 * Manages MediaRecorder for per-question video segments and full session recording.
 *
 * Usage:
 *   const { startQuestion, stopQuestion, getSessionBlob } = useVideoRecorder(streamRef);
 *
 *   - startQuestion()  — begins recording a new segment for the current question
 *   - stopQuestion()   — stops the current segment; returns a Promise<Blob>
 *   - getSessionBlob() — returns a Promise<Blob> of the full concatenated session
 *                        (all segments combined as a single webm/mp4 blob)
 */
export function useVideoRecorder(streamRef) {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const allChunksRef = useRef([]); // accumulates chunks across all questions

  const getSupportedMimeType = () => {
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  };

  const startQuestion = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    const mimeType = getSupportedMimeType();
    const options = mimeType ? { mimeType } : {};

    try {
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
          allChunksRef.current.push(e.data);
        }
      };
      recorder.start(250); // collect data every 250ms
      recorderRef.current = recorder;
    } catch (err) {
      console.error("MediaRecorder start failed:", err);
    }
  }, [streamRef]);

  const stopQuestion = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        recorderRef.current = null;
        resolve(blob);
      };

      recorder.stop();
    });
  }, []);

  const getSessionBlob = useCallback(() => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;

      const buildBlob = () => {
        const mimeType =
          (recorder && recorder.mimeType) ||
          getSupportedMimeType() ||
          "video/webm";
        const blob = new Blob(allChunksRef.current, { type: mimeType });
        allChunksRef.current = [];
        resolve(blob);
      };

      if (recorder && recorder.state !== "inactive") {
        recorder.onstop = buildBlob;
        recorder.stop();
      } else {
        buildBlob();
      }
    });
  }, []);

  return { startQuestion, stopQuestion, getSessionBlob };
}
