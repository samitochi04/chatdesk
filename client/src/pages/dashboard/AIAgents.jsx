import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  HiOutlineCpuChip,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

const AGENT_TYPES = [
  "auto_reply",
  "marketing",
  "follow_up",
  "support",
  "custom",
];
const MODELS = ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];

const TYPE_LABELS = {
  auto_reply: "autoReply",
  marketing: "marketing",
  follow_up: "followUp",
  support: "support",
  custom: "custom",
};

const TYPE_COLORS = {
  auto_reply:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  marketing:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  follow_up:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  support:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  custom: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/* ── Agent Modal ─────────────────────────── */

function AgentModal({ agent, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!agent;
  const [form, setForm] = useState({
    name: agent?.name || "",
    type: agent?.type || "auto_reply",
    description: agent?.description || "",
    systemPrompt: agent?.system_prompt || "",
    model: agent?.model || "gpt-4o-mini",
    isActive: agent?.is_active ?? true,
    temperature: agent?.configuration?.temperature ?? 0.7,
    maxTokens: agent?.configuration?.max_tokens ?? 1024,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        description: form.description || null,
        systemPrompt: form.systemPrompt || null,
        model: form.model,
        isActive: form.isActive,
        configuration: {
          temperature: Number(form.temperature),
          max_tokens: Number(form.maxTokens),
        },
      };
      if (isEdit) {
        await api.patch(`/ai/agents/${agent.id}`, payload);
      } else {
        await api.post("/ai/agents", payload);
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
              ? t("dashboard.aiAgents.editAgent")
              : t("dashboard.aiAgents.create")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.aiAgents.name")} *
            </label>
            <input
              required
              value={form.name}
              onChange={set("name")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Type + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.aiAgents.type")}
              </label>
              <select
                value={form.type}
                onChange={set("type")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                {AGENT_TYPES.map((t_) => (
                  <option key={t_} value={t_}>
                    {t_
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.aiAgents.model")}
              </label>
              <select
                value={form.model}
                onChange={set("model")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                {MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.aiAgents.description")}
            </label>
            <input
              value={form.description}
              onChange={set("description")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.aiAgents.systemPrompt")}
            </label>
            <textarea
              value={form.systemPrompt}
              onChange={set("systemPrompt")}
              rows={4}
              placeholder={t("dashboard.aiAgents.systemPromptHint")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Temperature + Max Tokens */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.aiAgents.temperature")} ({form.temperature})
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(e) =>
                  setForm((p) => ({ ...p, temperature: e.target.value }))
                }
                className="w-full accent-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.aiAgents.maxTokens")}
              </label>
              <input
                type="number"
                min="64"
                max="4096"
                value={form.maxTokens}
                onChange={set("maxTokens")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
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
            {t("dashboard.aiAgents.active")}
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              {t("dashboard.aiAgents.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "..." : t("dashboard.aiAgents.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Delete Confirmation ─────────────────── */

function DeleteModal({ agentName, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-[var(--color-surface)] p-6 text-center shadow-xl">
        <HiOutlineTrash className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
          {t("dashboard.aiAgents.deleteTitle")}
        </h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          {t("dashboard.aiAgents.deleteConfirm", { name: agentName })}
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            {t("dashboard.aiAgents.cancel")}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "..." : t("dashboard.aiAgents.delete")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────── */

export default function AIAgents() {
  const { t } = useTranslation();
  const { organization } = useAuth();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAgent, setEditAgent] = useState(null);
  const [deleteAgent, setDeleteAgent] = useState(null);

  const canCreate = organization?.can_advanced_automation;

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/ai/agents");
      setAgents(res.data || []);
    } catch {
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSave = () => {
    setShowModal(false);
    setEditAgent(null);
    fetchAgents();
  };

  const handleDelete = async () => {
    if (!deleteAgent) return;
    try {
      await api.delete(`/ai/agents/${deleteAgent.id}`);
      setDeleteAgent(null);
      fetchAgents();
    } catch {
      /* toast */
    }
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
            {t("dashboard.aiAgents.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {agents.length} {t("dashboard.aiAgents.agentCount")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditAgent(null);
            setShowModal(true);
          }}
          disabled={!canCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          title={!canCreate ? t("dashboard.aiAgents.upgradeRequired") : ""}
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("dashboard.aiAgents.create")}
        </button>
      </div>

      {/* Feature gate notice */}
      {!canCreate && (
        <div className="rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
          {t("dashboard.aiAgents.upgradeRequired")}
        </div>
      )}

      {/* Agent grid */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineCpuChip className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.aiAgents.noAgents")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.aiAgents.noAgentsHint")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    <HiOutlineCpuChip className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      {agent.name}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[agent.type] || TYPE_COLORS.custom}`}
                      >
                        {t(
                          `dashboard.aiAgents.${TYPE_LABELS[agent.type] || "custom"}`,
                        )}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          agent.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {agent.is_active
                          ? t("dashboard.aiAgents.active")
                          : t("dashboard.aiAgents.inactive")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditAgent(agent);
                      setShowModal(true);
                    }}
                    className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteAgent(agent)}
                    className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1 text-xs text-[var(--color-text-tertiary)]">
                <p>
                  {t("dashboard.aiAgents.model")}: {agent.model}
                </p>
                {agent.configuration?.temperature !== undefined && (
                  <p>
                    {t("dashboard.aiAgents.temperature")}:{" "}
                    {agent.configuration.temperature}
                  </p>
                )}
                {agent.description && (
                  <p className="mt-1 text-[var(--color-text-secondary)]">
                    {agent.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <AgentModal
          agent={editAgent}
          onClose={() => {
            setShowModal(false);
            setEditAgent(null);
          }}
          onSave={handleSave}
        />
      )}
      {deleteAgent && (
        <DeleteModal
          agentName={deleteAgent.name}
          onClose={() => setDeleteAgent(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
