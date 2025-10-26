import { createClient } from "@supabase/supabase-js";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { env } from "./config/env";
import "./index.css";
import "./styles/notifications.css";
import { useAuthStore } from "./store/authStore";
import { sessionManager } from "./utils/sessionManager";

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function Bootloader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          sessionManager.clearAllAuthData();
          useAuthStore.getState().clearAuth();
        }
      } finally {
        if (isMounted) setReady(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!ready) {
    // You can customize this splash/loading screen
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
        }}
      >
        Loading…
      </div>
    );
  }
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Bootloader />
  </StrictMode>
);
