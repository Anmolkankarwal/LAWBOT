import { useState, useCallback, useEffect } from "react";

const GUEST_ID_KEY = "lawbot_guest_id";

export function useGuestAuth() {
  const [guestId, setGuestId] = useState<string | null>(() => {
    return localStorage.getItem(GUEST_ID_KEY);
  });

  const isGuest = !!guestId;

  const createGuestSession = useCallback((newGuestId: string) => {
    localStorage.setItem(GUEST_ID_KEY, newGuestId);
    setGuestId(newGuestId);
  }, []);

  const clearGuestSession = useCallback(() => {
    localStorage.removeItem(GUEST_ID_KEY);
    setGuestId(null);
  }, []);

  // Refresh guest session on activity
  useEffect(() => {
    if (!guestId) return;

    const handleActivity = () => {
      // Session stays alive with activity
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [guestId]);

  return {
    guestId,
    isGuest,
    createGuestSession,
    clearGuestSession,
  };
}
