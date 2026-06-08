"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

export function GoogleProvider({ children }: { children: React.ReactNode }) {
  // Usamos el Web Client ID
  return (
    <GoogleOAuthProvider clientId="922502878492-2ko3s5folq2q4nvgf9sae3mgnp5vlva5.apps.googleusercontent.com">
      {children}
    </GoogleOAuthProvider>
  );
}
