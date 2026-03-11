import { ThemeProvider } from "@/contexts/ThemeContext";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";

function App() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-6">
          <Logo className="h-16 w-auto" />
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
            ChatDesk
          </h1>
          <ThemeToggle />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
