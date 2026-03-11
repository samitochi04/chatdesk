import { useTranslation } from "react-i18next";

export default function Blog() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        {t("blog.title")}
      </h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        {t("blog.subtitle")}
      </p>
    </div>
  );
}
