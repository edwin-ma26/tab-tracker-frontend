'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

if (!clientId) {
  throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables");
}


export default function SignIn() {
  const handleLoginSuccess = (credentialResponse: any) => {
    console.log(credentialResponse);

    // Parse user info from the credential (if needed, decode JWT here)
    const user = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    console.log('User Info:', user);

    // Save user info to localStorage
    localStorage.setItem('user', JSON.stringify(user));
    window.location.href = '/dashboard'; // Redirect to dashboard
  };

  const handleLoginFailure = () => {
    alert('Login failed. Please try again.');
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <main className="p-8 font-sans">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <GoogleLogin
          onSuccess={handleLoginSuccess}
          onError={handleLoginFailure}
          useOneTap // Optional: Enables One Tap sign-in
        />
      </main>
    </GoogleOAuthProvider>
  );
}
