import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";

const STATUS_COLORS = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  accepted:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  expired: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

export default function AdminInvitations() {
  const { t } = useTranslation();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/platform/invitations");
      setInvitations(res.data || []);
    } catch {
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCancel = async (id) => {
    try {
      await api.post(`/admin/platform/invitations/${id}/cancel`);
      fetchInvitations();
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-text-tertiary)]">
          {t("admin.noInvitations")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
          <tr>
            <th className="px-4 py-3">{t("dashboard.team.email")}</th>
            <th className="px-4 py-3">{t("dashboard.team.role")}</th>
            <th className="px-4 py-3">{t("admin.orgOf")}</th>
            <th className="px-4 py-3">{t("common.status")}</th>
            <th className="px-4 py-3">{t("admin.expiresAt")}</th>
            <th className="px-4 py-3">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {invitations.map((inv) => (
            <tr key={inv.id}>
              <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                {inv.email}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {inv.role}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {inv.organizations?.name || "—"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[inv.status]}`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                {inv.expires_at
                  ? new Date(inv.expires_at).toLocaleDateString()
                  : "—"}
              </td>
              <td className="px-4 py-3">
                {inv.status === "pending" && (
                  <button
                    onClick={() => handleCancel(inv.id)}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    {t("admin.revoke")}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
