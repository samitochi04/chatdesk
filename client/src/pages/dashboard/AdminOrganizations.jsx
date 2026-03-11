import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";

const PLAN_COLORS = {
  starter: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  growth: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  business:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const STATUS_COLORS = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminOrganizations() {
  const { t } = useTranslation();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/organizations");
      setOrgs(res.data || []);
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-4 py-3">{t("admin.orgName")}</th>
            <th className="px-4 py-3">{t("admin.plan")}</th>
            <th className="px-4 py-3">{t("common.status")}</th>
            <th className="px-4 py-3">{t("admin.whatsappLimit")}</th>
            <th className="px-4 py-3">{t("admin.teamLimit")}</th>
            <th className="px-4 py-3">{t("admin.createdAt")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {orgs.map((org) => (
            <tr key={org.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-[var(--color-text-primary)]">
                  {org.name}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {org.slug}
                </p>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PLAN_COLORS[org.subscription_plan]}`}
                >
                  {org.subscription_plan}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[org.approval_status]}`}
                >
                  {org.approval_status}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {org.max_whatsapp_numbers}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {org.max_team_members === -1 ? "∞" : org.max_team_members}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {new Date(org.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
