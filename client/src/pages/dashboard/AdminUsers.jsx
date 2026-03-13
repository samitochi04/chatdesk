import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { HiOutlinePencilSquare, HiXMark } from "react-icons/hi2";

const ROLE_COLORS = {
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  owner:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  agent: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

/* ── Edit User Modal ─────────────────────── */

function EditUserModal({ user, orgs, onClose, onSaved }) {
  const { t } = useTranslation();
  const [orgId, setOrgId] = useState(user.organization_id || "");
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/platform/users/${user.id}`, {
        organizationId: orgId || null,
        role,
      });
      toast.success(t("common.saved", "Saved"));
      onSaved();
    } catch (err) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("admin.editUser", "Edit User")}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)]"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
          {user.full_name || user.id}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              {t("admin.orgOf", "Organization")}
            </label>
            <select
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="">
                — {t("admin.noOrg", "No organization")} —
              </option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-primary)]">
              {t("dashboard.team.role", "Role")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)]"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
              <option value="super_admin">Super Admin</option>
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
              {saving ? t("common.loading", "Saving...") : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, orgsRes] = await Promise.all([
        api.get("/admin/platform/users"),
        api.get("/admin/organizations"),
      ]);
      setUsers(usersRes.data || []);
      setOrgs(orgsRes.data || []);
    } catch {
      setUsers([]);
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
        <p className="text-[var(--color-text-tertiary)]">
          {t("admin.noUsers")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-tertiary)]">
        {users.length} {t("admin.usersCount")}
      </p>

      <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3">{t("common.name")}</th>
              <th className="px-4 py-3">{t("dashboard.team.role")}</th>
              <th className="px-4 py-3">{t("admin.orgOf")}</th>
              <th className="px-4 py-3">{t("common.status")}</th>
              <th className="px-4 py-3">{t("admin.joinedAt")}</th>
              <th className="px-4 py-3">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {u.full_name || "—"}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {u.email || u.id}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${ROLE_COLORS[u.role] || ROLE_COLORS.agent}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {u.organizations?.name || "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${u.is_active ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  <span className="ml-1.5 text-[var(--color-text-secondary)]">
                    {u.is_active ? t("common.active") : t("common.inactive")}
                  </span>
                </td>
                <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setEditingUser(u)}
                    className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]"
                    title={t("admin.editUser", "Edit User")}
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          orgs={orgs}
          onClose={() => setEditingUser(null)}
          onSaved={() => {
            setEditingUser(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
