import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import {
  HiOutlineArrowLeft,
  HiOutlineUsers,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMegaphone,
  HiOutlineIdentification,
} from "react-icons/hi2";

const PLAN_COLORS = {
  starter: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  growth: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  business:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const ROLE_COLORS = {
  owner:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  agent: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function AdminOrgDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchOrg = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/organizations/${id}`);
      setOrg(res.data);
      setPlan(res.data.subscription_plan);
    } catch {
      setOrg(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  const handlePlanChange = async () => {
    if (plan === org.subscription_plan) return;
    try {
      setSaving(true);
      await api.patch(`/admin/organizations/${id}`, {
        subscriptionPlan: plan,
      });
      fetchOrg();
    } catch {
      setPlan(org.subscription_plan);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-text-tertiary)]">
          {t("admin.orgNotFound")}
        </p>
      </div>
    );
  }

  const stats = org.stats || {};

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/admin/organizations")}
          className="rounded-lg border border-[var(--color-border)] p-2 hover:bg-[var(--color-bg-secondary)]"
        >
          <HiOutlineArrowLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
        </button>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {org.name}
          </h2>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {org.slug}
          </p>
        </div>
      </div>

      {/* Info + Plan */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            {t("admin.orgInfo")}
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">
                {t("common.status")}
              </dt>
              <dd className="capitalize text-[var(--color-text-primary)]">
                {org.approval_status}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">
                {t("admin.teamLimit")}
              </dt>
              <dd className="text-[var(--color-text-primary)]">
                {org.max_team_members === -1 ? "∞" : org.max_team_members}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--color-text-tertiary)]">
                {t("admin.createdAt")}
              </dt>
              <dd className="text-[var(--color-text-primary)]">
                {new Date(org.created_at).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
            {t("admin.changePlan")}
          </h3>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-[var(--color-text-tertiary)]">
                {t("admin.plan")}
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="business">Business</option>
              </select>
            </div>
            <button
              onClick={handlePlanChange}
              disabled={plan === org.subscription_plan || saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "…" : t("common.save")}
            </button>
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
            {t("admin.currentPlan")}:{" "}
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PLAN_COLORS[org.subscription_plan]}`}
            >
              {org.subscription_plan}
            </span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: HiOutlineIdentification,
            label: t("admin.contactsLabel"),
            value: stats.totalContacts ?? 0,
          },
          {
            icon: HiOutlineChatBubbleLeftRight,
            label: t("admin.conversationsLabel"),
            value: stats.totalConversations ?? 0,
          },
          {
            icon: HiOutlineMegaphone,
            label: t("admin.totalBroadcastsLabel"),
            value: stats.totalBroadcasts ?? 0,
          },
          {
            icon: HiOutlineUsers,
            label: t("admin.members"),
            value: org.members?.length ?? 0,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
          >
            <s.icon className="mb-1 h-5 w-5 text-[var(--color-text-tertiary)]" />
            <p className="text-xl font-bold text-[var(--color-text-primary)]">
              {s.value}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Members */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {t("admin.members")}
          </h3>
        </div>
        {org.members?.length === 0 ? (
          <p className="p-5 text-center text-sm text-[var(--color-text-tertiary)]">
            {t("admin.noUsers")}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
              <tr>
                <th className="px-4 py-2">{t("common.name")}</th>
                <th className="px-4 py-2">{t("dashboard.team.role")}</th>
                <th className="px-4 py-2">{t("common.status")}</th>
                <th className="px-4 py-2">{t("admin.joinedAt")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {org.members?.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {m.full_name || "—"}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {m.email || m.id}
                    </p>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${ROLE_COLORS[m.role] || ROLE_COLORS.agent}`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${m.is_active ? "bg-green-500" : "bg-gray-400"}`}
                    />
                    <span className="ml-1.5 text-[var(--color-text-secondary)]">
                      {m.is_active ? t("common.active") : t("common.inactive")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)]">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
