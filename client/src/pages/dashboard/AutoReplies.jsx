import { useTranslation } from "react-i18next";

export default function AutoReplies() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        {t("dashboard.autoReplies.title")}
      </h1>
    </div>
  );
}
