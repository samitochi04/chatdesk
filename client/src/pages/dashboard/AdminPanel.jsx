import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBuildingOffice2,
  HiOutlineUsers,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMegaphone,
  HiOutlineEnvelope,
} from "react-icons/hi2";

function NavTab({ to, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-[var(--color-primary)] text-white"
            : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
        }`
      }
    >
      {label}
    </NavLink>
  );
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
          <Icon className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {value}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">{label}</p>
        </div>
      </div>
      {sub && (
        <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">{sub}</p>
      )}
    </div>
  );
}

export default function AdminPanel() {
  const { t } = useTranslation();
  const location = useLocation();
  const isRoot =
    location.pathname === "/dashboard/admin" ||
    location.pathname === "/dashboard/admin/";

  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState({});

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, pendingRes] = await Promise.all([
        api.get("/admin/platform/stats"),
        api.get("/admin/organizations/pending"),
      ]);
      setStats(statsRes.data);
      setPending(pendingRes.data || []);
    } catch {
      setStats(null);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRoot) fetchData();
  }, [isRoot, fetchData]);

  const handleApprove = async (orgId) => {
    const plan = selectedPlan[orgId] || "starter";
    setApproving(orgId);
    try {
      await api.post("/admin/organizations/approve", {
        organizationId: orgId,
        subscriptionPlan: plan,
      });
      fetchData();
    } catch {
      /* ignore */
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (orgId) => {
    setApproving(orgId);
    try {
      await api.post("/admin/organizations/reject", {
        organizationId: orgId,
      });
      fetchData();
    } catch {
      /* ignore */
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        {t("admin.title")}
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <NavTab to="/dashboard/admin" label={t("admin.overview")} />
        <NavTab
          to="/dashboard/admin/organizations"
          label={t("admin.allOrgs")}
        />
        <NavTab to="/dashboard/admin/users" label={t("admin.allUsers")} />
        <NavTab
          to="/dashboard/admin/invitations"
          label={t("admin.invitations")}
        />
      </div>

      {/* Root: Platform Dashboard */}
      {isRoot && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Stat cards */}
              {stats && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <StatCard
                    icon={HiOutlineBuildingOffice2}
                    label={t("admin.totalOrgs")}
                    value={stats.totalOrganizations}
                    sub={`${stats.orgsByStatus.pending} ${t("admin.pendingLabel")} · ${stats.orgsByStatus.approved} ${t("admin.approvedLabel")}`}
                  />
                  <StatCard
                    icon={HiOutlineUsers}
                    label={t("admin.totalUsers")}
                    value={stats.totalUsers}
                  />
                  <StatCard
                    icon={HiOutlineChatBubbleLeftRight}
                    label={t("admin.totalMessages")}
                    value={stats.totalMessages}
                    sub={`${stats.totalConversations} ${t("admin.conversationsLabel")}`}
                  />
                  <StatCard
                    icon={HiOutlineMegaphone}
                    label={t("admin.totalBroadcastsLabel")}
                    value={stats.totalBroadcasts}
                    sub={`${stats.totalContacts} ${t("admin.contactsLabel")}`}
                  />
                </div>
              )}

              {/* Plan distribution */}
              {stats && (
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <h3 className="mb-3 text-sm font-medium text-[var(--color-text-primary)]">
                    {t("admin.planDistribution")}
                  </h3>
                  <div className="flex gap-4">
                    {["starter", "growth", "business"].map((plan) => (
                      <div key={plan} className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            plan === "starter"
                              ? "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              : plan === "growth"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          }`}
                        >
                          {plan}
                        </span>
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          {stats.orgsByPlan[plan]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending orgs */}
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                  <HiOutlineEnvelope className="h-4 w-4" />
                  {t("admin.pendingOrgs")} ({pending.length})
                </h3>
                {pending.length === 0 ? (
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
                    <p className="text-sm text-[var(--color-text-tertiary)]">
                      {t("admin.noPending")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.map((org) => (
                      <div
                        key={org.id}
                        className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h3 className="font-medium text-[var(--color-text-primary)]">
                            {org.name}
                          </h3>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {org.slug} ·{" "}
                            {new Date(org.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={selectedPlan[org.id] || "starter"}
                            onChange={(e) =>
                              setSelectedPlan((p) => ({
                                ...p,
                                [org.id]: e.target.value,
                              }))
                            }
                            className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
                          >
                            <option value="starter">Starter</option>
                            <option value="growth">Growth</option>
                            <option value="business">Business</option>
                          </select>
                          <button
                            onClick={() => handleApprove(org.id)}
                            disabled={approving === org.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <HiOutlineCheckCircle className="h-4 w-4" />
                            {t("admin.approve")}
                          </button>
                          <button
                            onClick={() => handleReject(org.id)}
                            disabled={approving === org.id}
                            className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <HiOutlineXCircle className="h-4 w-4" />
                            {t("admin.reject")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <Outlet />
    </div>
  );
}
