"use client";
import { useRef, useState, useEffect } from "react";

export function useCameraStream() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // If stream already exists (React Strict Mode double-invoke), reuse it
    if (streamRef.current) {
      const video = videoRef.current;
      if (video && !video.srcObject) {
        video.srcObject = streamRef.current;
        video.onloadedmetadata = () => setIsReady(true);
        if (video.readyState >= 1) setIsReady(true);
      }
      return;
    }

    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => setIsReady(true);
          if (video.readyState >= 1) setIsReady(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setCameraError(
            err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
              ? "Camera access denied. Please allow camera access in your browser settings to continue."
              : "Unable to access camera. Please ensure a camera is connected and try again."
          );
        }
      });

    // Cleanup: mark cancelled but do NOT stop tracks — stream must stay alive
    // across question transitions. Tracks are only stopped on full page unload.
    return () => { cancelled = true; };
  }, []);

  return { videoRef, streamRef, cameraError, isReady };
}
