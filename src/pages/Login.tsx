import { auth } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function googleLogin() {
  try {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);

    console.log(result.user);
    alert(`Welcome ${result.user.displayName}`);
  } catch (error) {
    console.error(error);
    alert("Google Login Failed");
  }
}

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={googleLogin}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
