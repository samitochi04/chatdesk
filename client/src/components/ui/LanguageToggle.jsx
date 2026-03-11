import { useTranslation } from "react-i18next";

export default function LanguageToggle({ className = "" }) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("fr") ? "fr" : "en";

  const toggle = () => {
    i18n.changeLanguage(currentLang === "en" ? "fr" : "en");
  };

  return (
    <button
      onClick={toggle}
      className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] ${className}`}
      aria-label="Toggle language"
    >
      {currentLang === "en" ? "FR" : "EN"}
    </button>
  );
}
