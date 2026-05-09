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
  // Track whether we already fired for the current "multi-face" window
  const firedRef = useRef(false);

  useEffect(() => {
    if (faceStatus === "multi-face") {
      if (!firedRef.current) {
        firedRef.current = true;
        onViolation();
      }
    } else {
      // Reset so the next distinct multi-face event fires again
      firedRef.current = false;
    }
  }, [faceStatus, onViolation]);
}
