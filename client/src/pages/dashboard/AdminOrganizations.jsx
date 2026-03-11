import { useTranslation } from "react-i18next";

export default function AdminOrganizations() {
  const { t } = useTranslation();

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
        {t("admin.allOrgs")}
      </h2>
    </div>
  );
}
