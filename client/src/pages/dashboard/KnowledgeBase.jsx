import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  HiOutlineBookOpen,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

/* ── KB Entry Modal ──────────────────────── */

function KBModal({ entry, agents, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!entry;
  const [form, setForm] = useState({
    title: entry?.title || "",
    content: entry?.content || "",
    aiAgentId: entry?.ai_agent_id || "",
    isActive: entry?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        content: form.content,
        aiAgentId: form.aiAgentId || null,
        isActive: form.isActive,
      };
      if (isEdit) {
        await api.patch(`/ai/knowledge-base/${entry.id}`, payload);
      } else {
        await api.post("/ai/knowledge-base", payload);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isEdit
              ? t("dashboard.knowledgeBase.editEntry")
              : t("dashboard.knowledgeBase.createEntry")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.knowledgeBase.title_")} *
            </label>
            <input
              required
              value={form.title}
              onChange={set("title")}
              placeholder={t("dashboard.knowledgeBase.titleHint")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.knowledgeBase.content")} *
            </label>
            <textarea
              required
              value={form.content}
              onChange={set("content")}
              rows={6}
              placeholder={t("dashboard.knowledgeBase.contentHint")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* AI Agent scope */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.knowledgeBase.agent")}
            </label>
            <select
              value={form.aiAgentId}
              onChange={set("aiAgentId")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">{t("dashboard.knowledgeBase.allAgents")}</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {t("dashboard.knowledgeBase.agentHint")}
            </p>
          </div>

          {/* Active toggle */}
          <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((p) => ({ ...p, isActive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)]"
            />
            {t("dashboard.knowledgeBase.active")}
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              {t("dashboard.knowledgeBase.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "..." : t("dashboard.knowledgeBase.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────── */

export default function KnowledgeBase() {
  const { t } = useTranslation();
  const { organization, profile } = useAuth();
  const [entries, setEntries] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState(null);

  const canManage =
    profile?.role === "super_admin" ||
    (organization?.can_advanced_automation &&
      ["owner", "admin"].includes(profile?.role));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [kbRes, agentsRes] = await Promise.all([
        api.get("/ai/knowledge-base"),
        api.get("/ai/agents"),
      ]);
      setEntries(kbRes.data || []);
      setAgents(agentsRes.data || []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setShowModal(false);
    setEditEntry(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm(t("dashboard.knowledgeBase.confirmDelete"))) return;
    try {
      await api.delete(`/ai/knowledge-base/${id}`);
      fetchData();
    } catch {
      /* toast */
    }
  };

  const getAgentName = (agentId) => {
    if (!agentId) return t("dashboard.knowledgeBase.allAgents");
    const agent = agents.find((a) => a.id === agentId);
    return agent?.name || "—";
  };

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
            {t("dashboard.knowledgeBase.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.knowledgeBase.pageSubtitle")}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditEntry(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <HiOutlinePlus className="h-4 w-4" />
            {t("dashboard.knowledgeBase.createEntry")}
          </button>
        )}
      </div>

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineBookOpen className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.knowledgeBase.noEntries")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.knowledgeBase.noEntriesHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      {entry.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        entry.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {entry.is_active
                        ? t("dashboard.knowledgeBase.active")
                        : t("dashboard.knowledgeBase.inactive")}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--color-text-secondary)]">
                    {entry.content}
                  </p>
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
                    {t("dashboard.knowledgeBase.agent")}:{" "}
                    {getAgentName(entry.ai_agent_id)}
                  </p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditEntry(entry);
                        setShowModal(true);
                      }}
                      className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                    >
                      <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <KBModal
          entry={editEntry}
          agents={agents}
          onClose={() => {
            setShowModal(false);
            setEditEntry(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
