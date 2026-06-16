
import { useGuestAuth } from "./useGuestAuth";


export function useUnifiedAuth() {
  const oauth = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    logout: () => { },
  };
  const guest = useGuestAuth();

  const isAuthenticated = oauth.isAuthenticated || guest.isGuest;
  const isLoading = oauth.isLoading;
  const user = oauth.user;
  const guestId = guest.guestId;

  const logout = () => {
    if (oauth.isAuthenticated) {
      oauth.logout();
    }
    guest.clearGuestSession();
    window.location.reload();
  };

  return {
    user,
    guestId,
    isAuthenticated,
    isLoading,
    isOAuth: oauth.isAuthenticated,
    isGuest: guest.isGuest,
    logout,
    createGuestSession: guest.createGuestSession,
    clearGuestSession: guest.clearGuestSession,
  };
}
