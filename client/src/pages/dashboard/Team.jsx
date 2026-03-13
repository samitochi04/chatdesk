import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineUsers,
  HiOutlineTrash,
} from "react-icons/hi2";

const ROLE_COLORS = {
  owner:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  agent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  super_admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/* ── Invite Modal ─────────────────────── */

function InviteModal({ onClose, onSaved }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("agent");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/admin/invitations", { email, role });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-modal-title"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div className="w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="invite-modal-title"
            className="text-lg font-bold text-[var(--color-text-primary)]"
          >
            {t("dashboard.team.invite")}
          </h2>
          <button onClick={onClose} aria-label={t("common.cancel")}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.team.email")} *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.team.role")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="admin">{t("dashboard.team.admin")}</option>
              <option value="agent">{t("dashboard.team.agent")}</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "..." : t("dashboard.team.sendInvite")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────── */

export default function Team() {
  const { t } = useTranslation();
  const { user, organization, profile } = useAuth();
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [membersRes, invitesRes] = await Promise.all([
        api.get("/admin/team"),
        api.get("/admin/invitations"),
      ]);
      setMembers(membersRes.data || []);
      setInvitations(invitesRes.data || []);
    } catch {
      setMembers([]);
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRoleChange = async (memberId, newRole) => {
    try {
      await api.patch(`/admin/team/${memberId}`, { role: newRole });
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const handleRemove = async (memberId) => {
    if (!confirm(t("dashboard.team.confirmRemove"))) return;
    try {
      await api.patch(`/admin/team/${memberId}`, { isActive: false });
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const handleCancelInvite = async (id) => {
    try {
      await api.post(`/admin/invitations/${id}/cancel`);
      fetchData();
    } catch {
      /* ignore */
    }
  };

  const isSuperAdmin = profile?.role === "super_admin";
  const isOwner = profile?.role === "owner";
  const canManageTeam = isSuperAdmin || isOwner;
  const maxMembers = organization?.max_team_members ?? 2;
  const atLimit =
    !isSuperAdmin && maxMembers !== -1 && members.length >= maxMembers;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("dashboard.team.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.team.membersUsed", {
              used: members.length,
              max: maxMembers === -1 ? "∞" : maxMembers,
            })}
          </p>
        </div>
        {canManageTeam && (
          <button
            onClick={() => setShowInvite(true)}
            disabled={atLimit}
            title={atLimit ? t("dashboard.team.limitReached") : ""}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <HiOutlinePlus className="h-4 w-4" />
            {t("dashboard.team.invite")}
          </button>
        )}
      </div>

      {/* Members */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineUsers className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.team.noMembers")}
          </p>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
              <tr>
                <th className="px-4 py-3">{t("dashboard.contacts.name")}</th>
                <th className="px-4 py-3">{t("dashboard.team.role")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {members.map((m) => {
                const isSelf = m.id === user?.id;
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-sm font-bold text-[var(--color-primary)]">
                          {(m.full_name || "?")[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {m.full_name || "—"}
                          {isSelf && (
                            <span className="ml-1 text-xs text-[var(--color-text-tertiary)]">
                              ({t("dashboard.team.you")})
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isSelf || m.role === "owner" || !canManageTeam ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[m.role]}`}
                        >
                          {t(`dashboard.team.${m.role}`)}
                        </span>
                      ) : (
                        <select
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.id, e.target.value)
                          }
                          className="rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
                        >
                          <option value="admin">
                            {t("dashboard.team.admin")}
                          </option>
                          <option value="agent">
                            {t("dashboard.team.agent")}
                          </option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          m.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {m.is_active
                          ? t("common.active")
                          : t("common.inactive")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canManageTeam && !isSelf && m.role !== "owner" && (
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          title={t("dashboard.team.removeMember")}
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending Invitations */}
      {invitations.filter((i) => i.status === "pending").length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
            {t("dashboard.team.pendingInvites")}
          </h2>
          <div className="space-y-2">
            {invitations
              .filter((i) => i.status === "pending")
              .map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {inv.email}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {t(`dashboard.team.${inv.role}`)} ·{" "}
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelInvite(inv.id)}
                    className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    {t("common.cancel")}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSaved={() => {
            setShowInvite(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
