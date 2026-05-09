"use client";
import { useEffect, useRef } from "react";

/**
 * Watches faceStatus and fires onViolation() exactly once per
 * multi-face detection event (debounced — won't re-fire until
 * faceStatus leaves "multi-face" and returns again).
 *
 * @param {string}   faceStatus   - current face detection status
 * @param {Function} onViolation  - async callback that calls the backend
 */
export function useViolationTracker(faceStatus, onViolation) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (faceStatus === "multi-face" || faceStatus === "no-face") {
      if (!firedRef.current) {
        firedRef.current = true;
        onViolation(faceStatus); // pass type so backend can log it
      }
    } else {
      firedRef.current = false;
    }
  }, [faceStatus, onViolation]);
}
