import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  HiOutlineBolt,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";

const TRIGGER_TYPES = ["keyword", "intent", "classification", "new_contact"];

const ACTION_TYPES = [
  "assign_agent",
  "send_message",
  "notify_team",
  "classify",
  "tag_contact",
];

const CLASSIFICATION_VALUES = [
  "new_lead",
  "interested",
  "said_no",
  "bought",
  "didnt_buy",
];

const TRIGGER_COLORS = {
  keyword: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  intent:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  classification:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  new_contact:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  no_response: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  schedule: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/* ── Trigger Modal ───────────────────────── */

function TriggerModal({ trigger, agents, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!trigger;

  const [form, setForm] = useState({
    name: trigger?.name || "",
    description: trigger?.description || "",
    triggerType: trigger?.trigger_type || "keyword",
    aiAgentId: trigger?.ai_agent_id || "",
    actionType: trigger?.action_type || "assign_agent",
    isActive: trigger?.is_active ?? true,
    priority: trigger?.priority ?? 0,
    // Conditions
    keywords: trigger?.conditions?.keywords?.join(", ") || "",
    intentDescription: trigger?.conditions?.intent_description || "",
    classificationValue: trigger?.conditions?.classification || "",
    // Action config
    assignAgentId: trigger?.action_config?.agent_id || "",
    messageTemplate: trigger?.action_config?.message || "",
    classifyAs: trigger?.action_config?.classification || "",
    tagName: trigger?.action_config?.tag || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Build conditions based on trigger type
      const conditions = {};
      if (form.triggerType === "keyword") {
        conditions.keywords = form.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);
      } else if (form.triggerType === "intent") {
        conditions.intent_description = form.intentDescription;
      } else if (form.triggerType === "classification") {
        conditions.classification = form.classificationValue;
      }

      // Build action config based on action type
      const actionConfig = {};
      if (form.actionType === "assign_agent") {
        actionConfig.agent_id = form.assignAgentId;
      } else if (form.actionType === "send_message") {
        actionConfig.message = form.messageTemplate;
      } else if (form.actionType === "classify") {
        actionConfig.classification = form.classifyAs;
      } else if (form.actionType === "tag_contact") {
        actionConfig.tag = form.tagName;
      }

      const payload = {
        name: form.name,
        description: form.description || null,
        triggerType: form.triggerType,
        aiAgentId: form.aiAgentId || null,
        actionType: form.actionType,
        conditions,
        actionConfig,
        isActive: form.isActive,
        priority: Number(form.priority),
      };

      if (isEdit) {
        await api.patch(`/ai/triggers/${trigger.id}`, payload);
      } else {
        await api.post("/ai/triggers", payload);
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
              ? t("dashboard.triggers.editTrigger")
              : t("dashboard.triggers.createTrigger")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.triggers.name")} *
            </label>
            <input
              required
              value={form.name}
              onChange={set("name")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.triggers.description")}
            </label>
            <input
              value={form.description}
              onChange={set("description")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Trigger Type + AI Agent */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.triggerType")} *
              </label>
              <select
                value={form.triggerType}
                onChange={set("triggerType")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                {TRIGGER_TYPES.map((tt) => (
                  <option key={tt} value={tt}>
                    {t(`dashboard.triggers.types.${tt}`)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.agent")}
              </label>
              <select
                value={form.aiAgentId}
                onChange={set("aiAgentId")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">{t("dashboard.triggers.anyAgent")}</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditions — depends on trigger type */}
          {form.triggerType === "keyword" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.keywords")} *
              </label>
              <input
                required
                value={form.keywords}
                onChange={set("keywords")}
                placeholder={t("dashboard.triggers.keywordsHint")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

          {form.triggerType === "intent" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.intentDescription")} *
              </label>
              <textarea
                required
                value={form.intentDescription}
                onChange={set("intentDescription")}
                rows={2}
                placeholder={t("dashboard.triggers.intentHint")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

          {form.triggerType === "classification" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.classificationValue")} *
              </label>
              <select
                required
                value={form.classificationValue}
                onChange={set("classificationValue")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">
                  {t("dashboard.triggers.selectClassification")}
                </option>
                {CLASSIFICATION_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {c
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Action Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.triggers.actionType")} *
            </label>
            <select
              value={form.actionType}
              onChange={set("actionType")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              {ACTION_TYPES.map((at) => (
                <option key={at} value={at}>
                  {t(`dashboard.triggers.actions.${at}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Action config — depends on action type */}
          {form.actionType === "assign_agent" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.assignTo")} *
              </label>
              <select
                required
                value={form.assignAgentId}
                onChange={set("assignAgentId")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">{t("dashboard.triggers.selectAgent")}</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.actionType === "send_message" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.messageTemplate")} *
              </label>
              <textarea
                required
                value={form.messageTemplate}
                onChange={set("messageTemplate")}
                rows={3}
                placeholder={t("dashboard.triggers.messageHint")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

          {form.actionType === "classify" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.classifyAs")} *
              </label>
              <select
                required
                value={form.classifyAs}
                onChange={set("classifyAs")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">
                  {t("dashboard.triggers.selectClassification")}
                </option>
                {CLASSIFICATION_VALUES.map((c) => (
                  <option key={c} value={c}>
                    {c
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.actionType === "tag_contact" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.triggers.tagName")} *
              </label>
              <input
                required
                value={form.tagName}
                onChange={set("tagName")}
                placeholder={t("dashboard.triggers.tagHint")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}

          {/* Priority */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.triggers.priority")}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={form.priority}
              onChange={set("priority")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {t("dashboard.triggers.priorityHint")}
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
            {t("dashboard.triggers.active")}
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              {t("dashboard.triggers.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "..." : t("dashboard.triggers.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────── */

export default function Triggers() {
  const { t } = useTranslation();
  const { organization, profile } = useAuth();
  const [triggers, setTriggers] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTrigger, setEditTrigger] = useState(null);

  const canManage =
    profile?.role === "super_admin" ||
    (organization?.can_advanced_automation &&
      ["owner", "admin"].includes(profile?.role));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [trigRes, agentsRes] = await Promise.all([
        api.get("/ai/triggers"),
        api.get("/ai/agents"),
      ]);
      setTriggers(trigRes.data || []);
      setAgents(agentsRes.data || []);
    } catch {
      setTriggers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setShowModal(false);
    setEditTrigger(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm(t("dashboard.triggers.confirmDelete"))) return;
    try {
      await api.delete(`/ai/triggers/${id}`);
      fetchData();
    } catch {
      /* toast */
    }
  };

  const getAgentName = (agentId) => {
    if (!agentId) return "—";
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
            {t("dashboard.triggers.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.triggers.pageSubtitle")}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setEditTrigger(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            <HiOutlinePlus className="h-4 w-4" />
            {t("dashboard.triggers.createTrigger")}
          </button>
        )}
      </div>

      {/* Feature gate notice */}
      {!canManage && (
        <div className="rounded-lg border border-purple-300 bg-purple-50 p-3 text-sm text-purple-700 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
          {t("dashboard.triggers.upgradeRequired")}
        </div>
      )}

      {/* Triggers list */}
      {triggers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineBolt className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.triggers.noTriggers")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.triggers.noTriggersHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      {trigger.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TRIGGER_COLORS[trigger.trigger_type] || TRIGGER_COLORS.keyword}`}
                    >
                      {t(`dashboard.triggers.types.${trigger.trigger_type}`)}
                    </span>
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {t(`dashboard.triggers.actions.${trigger.action_type}`)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        trigger.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {trigger.is_active
                        ? t("dashboard.triggers.active")
                        : t("dashboard.triggers.inactive")}
                    </span>
                  </div>
                  {trigger.description && (
                    <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                      {trigger.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--color-text-tertiary)]">
                    <span>
                      {t("dashboard.triggers.priority")}: {trigger.priority}
                    </span>
                    {trigger.ai_agent_id && (
                      <span>
                        {t("dashboard.triggers.agent")}:{" "}
                        {getAgentName(trigger.ai_agent_id)}
                      </span>
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        setEditTrigger(trigger);
                        setShowModal(true);
                      }}
                      className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                    >
                      <HiOutlinePencilSquare className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(trigger.id)}
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
        <TriggerModal
          trigger={editTrigger}
          agents={agents}
          onClose={() => {
            setShowModal(false);
            setEditTrigger(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
