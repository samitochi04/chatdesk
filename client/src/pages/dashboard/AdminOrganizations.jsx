import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { HiOutlineChevronRight, HiOutlinePlus, HiXMark } from "react-icons/hi2";

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
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);

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

  const filtered = filter
    ? orgs.filter((o) => o.approval_status === filter)
    : orgs;

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter + Create */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-tertiary)]">
          {filtered.length} {t("admin.organizationsCount")}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-sm font-medium text-[var(--color-primary-text)] hover:opacity-90"
          >
            <HiOutlinePlus className="h-4 w-4" />
            {t("admin.createOrg", "Create Organization")}
          </button>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text-primary)]"
          >
            <option value="">{t("common.all")}</option>
            <option value="approved">{t("admin.approvedLabel")}</option>
            <option value="pending">{t("admin.pendingLabel")}</option>
            <option value="rejected">{t("admin.rejectedLabel")}</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3">{t("admin.orgName")}</th>
              <th className="px-4 py-3">{t("admin.plan")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3">{t("admin.teamLimit")}</th>
              <th className="px-4 py-3">{t("admin.createdAt")}</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filtered.map((org) => (
              <tr
                key={org.id}
                onClick={() =>
                  navigate(`/dashboard/admin/organizations/${org.id}`)
                }
                className="cursor-pointer transition-colors hover:bg-[var(--color-bg-secondary)]"
              >
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
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${PLAN_COLORS[org.subscription_plan]}`}
                  >
                    {org.subscription_plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[org.approval_status]}`}
                  >
                    {org.approval_status}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {org.max_team_members === -1 ? "∞" : org.max_team_members}
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {new Date(org.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <HiOutlineChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateOrgModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchOrgs();
          }}
        />
      )}
    </div>
  );
}

/* ── Create Organization Modal ─────────────────── */

function CreateOrgModal({ onClose, onSaved }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState("starter");
  const [saving, setSaving] = useState(false);

  const handleNameChange = (val) => {
    setName(val);
    setSlug(
      val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-"),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/admin/organizations/create", {
        name,
        slug,
        subscriptionPlan: plan,
      });
      toast.success(t("admin.orgCreated", "Organization created"));
      onSaved();
    } catch (err) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("admin.createOrg", "Create Organization")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              {t("admin.orgName", "Name")}
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              Slug
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              pattern="^[a-z0-9-]+$"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              placeholder="acme-corp"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              {t("admin.plan", "Plan")}
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

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-text)] hover:opacity-90 disabled:opacity-50"
            >
              {saving
                ? t("common.loading", "Creating...")
                : t("common.create", "Create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
