import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "react-hot-toast";
import AppRouter from "@/router/AppRouter";
import CookieConsent from "@/components/ui/CookieConsent";

function App() {
  return (
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <AppRouter />
          <CookieConsent />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}

export default App;
