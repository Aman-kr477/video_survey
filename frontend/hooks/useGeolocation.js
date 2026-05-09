"use client";
import { useState, useEffect } from "react";

/**
 * Uses browser GPS to get lat/lng, then reverse-geocodes via Nominatim.
 * Returns { location: "City, Country" | null, locationReady: bool }
 * locationReady becomes true once resolved or failed (permission denied, etc.)
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [locationReady, setLocationReady] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationReady(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          // Use display_name directly — already formatted as "City, Region, Country"
          const loc = data.display_name || null;
          setLocation(loc);
        } catch {
          // reverse geocode failed
        } finally {
          setLocationReady(true);
        }
      },
      () => {
        // permission denied or unavailable
        setLocationReady(true);
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return { location, locationReady };
}
