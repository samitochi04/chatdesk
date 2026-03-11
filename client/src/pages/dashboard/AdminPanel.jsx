import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi2";

const PLAN_COLORS = {
  starter: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  growth: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  business:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

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

export default function AdminPanel() {
  const { t } = useTranslation();
  const location = useLocation();
  const isRoot =
    location.pathname === "/admin" || location.pathname === "/admin/";

  // Pending orgs shown on root
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState({});

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/organizations/pending");
      setPending(res.data || []);
    } catch {
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRoot) fetchPending();
  }, [isRoot, fetchPending]);

  const handleApprove = async (orgId) => {
    const plan = selectedPlan[orgId] || "starter";
    setApproving(orgId);
    try {
      await api.post("/admin/organizations/approve", {
        organizationId: orgId,
        subscriptionPlan: plan,
      });
      fetchPending();
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
      fetchPending();
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
      <div className="flex gap-2">
        <NavTab to="/admin" label={t("admin.pendingOrgs")} />
        <NavTab to="/admin/organizations" label={t("admin.allOrgs")} />
        <NavTab to="/admin/invitations" label={t("admin.invitations")} />
      </div>

      {/* Root: Pending Orgs */}
      {isRoot && (
        <div>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
              <p className="text-[var(--color-text-tertiary)]">
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
      )}

      <Outlet />
    </div>
  );
}
