import { useTheme } from "@/contexts/ThemeContext";
import logoDark from "@/assets/logo-dark.svg";
import logoLight from "@/assets/logo-light.svg";

export default function Logo({ className = "h-8 w-auto" }) {
  const { theme } = useTheme();

  return (
    <img
      src={theme === "dark" ? logoLight : logoDark}
      alt="ChatDesk"
      className={className}
    />
  );
}
