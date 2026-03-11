import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-6xl font-bold text-[var(--color-primary)]">404</h1>
      <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        {t("notFound.title")}
      </h2>
      <p className="max-w-md text-[var(--color-text-secondary)]">
        {t("notFound.message")}
      </p>
      <Link
        to="/"
        className="mt-4 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-[var(--color-primary-text)] transition-colors hover:bg-[var(--color-primary-hover)]"
      >
        {t("notFound.backHome")}
      </Link>
    </div>
  );
}
