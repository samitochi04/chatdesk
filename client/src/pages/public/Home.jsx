import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
        {t("home.hero.title")}
      </h1>
    </div>
  );
}
