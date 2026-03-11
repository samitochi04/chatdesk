import { useTranslation } from "react-i18next";

export default function Contact() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
        {t("contact.title")}
      </h1>
      <p className="mt-2 text-[var(--color-text-secondary)]">
        {t("contact.subtitle")}
      </p>
    </div>
  );
}
