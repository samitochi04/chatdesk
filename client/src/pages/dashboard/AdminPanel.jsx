import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function AdminPanel() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        {t("admin.title")}
      </h1>
      <Outlet />
    </div>
  );
}
