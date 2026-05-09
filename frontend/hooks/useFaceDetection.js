"use client";
import { useEffect, useRef, useState } from "react";

let faceapi = null;
let modelsLoaded = false;

async function loadFaceApi() {
  if (faceapi && modelsLoaded) return faceapi;
  faceapi = await import("face-api.js");
  if (!modelsLoaded) {
    await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
    modelsLoaded = true;
  }
  return faceapi;
}

export function useFaceDetection(videoRef, isReady) {
  const [faceStatus, setFaceStatus] = useState("loading");
  const [faceScore, setFaceScore] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    // Only show "loading" if models aren't loaded yet
    if (!modelsLoaded) setFaceStatus("loading");

    loadFaceApi()
      .then((api) => {
        if (cancelled) return;
        setFaceStatus("checking");

        intervalRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;

          try {
            const detections = await api.detectAllFaces(
              video,
              new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
            );
            if (cancelled) return;

            if (detections.length === 0) {
              setFaceStatus("no-face");
              setFaceScore(0);
            } else if (detections.length === 1) {
              setFaceStatus("ok");
              setFaceScore(Math.round(detections[0].score * 100));
            } else {
              setFaceStatus("multi-face");
              setFaceScore(0);
            }
          } catch {
            if (!cancelled) {
              setFaceStatus("no-face");
              setFaceScore(0);
            }
          }
        }, 500);
      })
      .catch(() => {
        if (!cancelled) setFaceStatus("no-face");
      });

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isReady, videoRef]); // eslint-disable-line

  return { faceStatus, faceScore };
}
