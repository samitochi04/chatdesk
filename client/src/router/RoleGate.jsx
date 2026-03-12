import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { HiOutlineLockClosed } from "react-icons/hi2";

export default function RoleGate({ roles, children }) {
  const { profile, loading } = useAuth();
  const { t } = useTranslation();

  if (loading || !profile) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  const userRole = profile.role;

  if (!roles.includes(userRole)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <HiOutlineLockClosed className="h-16 w-16 text-[var(--color-text-tertiary)]" />
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {t("common.accessDenied")}
        </h2>
        <p className="max-w-md text-[var(--color-text-secondary)]">
          {t("common.accessDeniedMessage")}
        </p>
      </div>
    );
  }

  return children;
}
