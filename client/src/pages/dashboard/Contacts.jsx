import { useTranslation } from "react-i18next";

export default function Contacts() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        {t("dashboard.contacts.title")}
      </h1>
    </div>
  );
}
