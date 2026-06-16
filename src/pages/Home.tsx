import { useState, useEffect } from "react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { trpc } from "@/providers/trpc";
import SplashScreen from "@/sections/SplashScreen";
import AuthScreen from "@/sections/AuthScreen";
import ChatDashboard from "@/sections/ChatDashboard";

export default function Home() {
  const auth = useUnifiedAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  const createGuest = trpc.guest.create.useMutation();

  // Show splash for 1.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Handle guest login
  const handleGuestLogin = async () => {
    const result = await createGuest.mutateAsync();
    if (result.guestId) {
      auth.createGuestSession(result.guestId);
      setAppReady(true);
    }
  };

  // Handle OAuth login success
  const handleOAuthSuccess = () => {
    setAppReady(true);
  };

  // Check if already authenticated
  useEffect(() => {
    if (auth.isAuthenticated) {
      setAppReady(true);
    }
  }, [auth.isAuthenticated]);

  // Show splash screen
  if (showSplash) {
    return <SplashScreen />;
  }

  // Show auth screen if not authenticated
  if (!appReady && !auth.isAuthenticated) {
    return (
      <AuthScreen
        onGuestLogin={handleGuestLogin}
        onOAuthSuccess={handleOAuthSuccess}
        isLoading={createGuest.isPending}
      />
    );
  }

  // Show main chat interface
  return <ChatDashboard />;
}
