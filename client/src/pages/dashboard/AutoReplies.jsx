import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import {
  HiOutlineBolt,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineChatBubbleBottomCenterText,
} from "react-icons/hi2";

/* ── Rule Modal ──────────────────────────── */

function RuleModal({ rule, agents, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!rule;
  const [form, setForm] = useState({
    name: rule?.name || "",
    keywords: rule?.trigger_keywords?.join(", ") || "",
    responseText: rule?.response_text || "",
    aiAgentId: rule?.ai_agent_id || "",
    priority: rule?.priority ?? 0,
    isActive: rule?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const triggerKeywords = form.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      if (triggerKeywords.length === 0) {
        setError(t("dashboard.autoReplies.keywordsRequired"));
        setSaving(false);
        return;
      }

      const payload = {
        name: form.name,
        triggerKeywords,
        responseText: form.responseText,
        aiAgentId: form.aiAgentId || null,
        priority: Number(form.priority),
        isActive: form.isActive,
      };

      if (isEdit) {
        await api.patch(`/ai/rules/${rule.id}`, payload);
      } else {
        await api.post("/ai/rules", payload);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Preview
  const previewKeyword = form.keywords.split(",")[0]?.trim();
  const previewResponse =
    form.responseText.length > 80
      ? form.responseText.slice(0, 80) + "…"
      : form.responseText;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isEdit
              ? t("dashboard.autoReplies.editRule")
              : t("dashboard.autoReplies.create")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.autoReplies.ruleName")} *
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Keywords */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.autoReplies.keywords")} *
            </label>
            <input
              required
              value={form.keywords}
              onChange={(e) =>
                setForm((p) => ({ ...p, keywords: e.target.value }))
              }
              placeholder={t("dashboard.autoReplies.keywordsHint")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Response */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.autoReplies.response")} *
            </label>
            <textarea
              required
              value={form.responseText}
              onChange={(e) =>
                setForm((p) => ({ ...p, responseText: e.target.value }))
              }
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          {/* Agent + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.autoReplies.agent")}
              </label>
              <select
                value={form.aiAgentId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, aiAgentId: e.target.value }))
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">{t("dashboard.autoReplies.noAgent")}</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.autoReplies.priority")}
              </label>
              <input
                type="number"
                min="0"
                max="1000"
                value={form.priority}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priority: e.target.value }))
                }
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
              className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
            />
            {t("dashboard.autoReplies.activeToggle")}
          </label>

          {/* Preview */}
          {previewKeyword && previewResponse && (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3">
              <p className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-tertiary)]">
                {t("dashboard.autoReplies.preview")}
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t("dashboard.autoReplies.previewText", {
                  keyword: previewKeyword,
                  response: previewResponse,
                })}
              </p>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            >
              {t("dashboard.autoReplies.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "..." : t("dashboard.autoReplies.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────── */

export default function AutoReplies() {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRule, setEditRule] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rulesRes, agentsRes] = await Promise.all([
        api.get("/ai/rules"),
        api.get("/ai/agents"),
      ]);
      setRules(rulesRes.data || []);
      setAgents(agentsRes.data || []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = () => {
    setShowModal(false);
    setEditRule(null);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm(t("dashboard.autoReplies.confirmDelete"))) return;
    try {
      await api.delete(`/ai/rules/${id}`);
      fetchData();
    } catch {
      /* toast */
    }
  };

  const handleToggle = async (rule) => {
    try {
      await api.patch(`/ai/rules/${rule.id}`, {
        isActive: !rule.is_active,
      });
      fetchData();
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
            {t("dashboard.autoReplies.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {rules.length} {t("dashboard.autoReplies.ruleCount")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditRule(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("dashboard.autoReplies.create")}
        </button>
      </div>

      {/* Rules list */}
      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineBolt className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.autoReplies.noRules")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.autoReplies.noRulesHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={`rounded-xl border bg-[var(--color-surface)] p-5 transition-colors ${
                rule.is_active
                  ? "border-[var(--color-border)]"
                  : "border-[var(--color-border)] opacity-60"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      {rule.name}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        rule.is_active
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {rule.is_active
                        ? t("dashboard.autoReplies.activeLabel")
                        : t("dashboard.autoReplies.inactiveLabel")}
                    </span>
                    <span className="rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                      P{rule.priority}
                    </span>
                  </div>

                  {/* Keywords */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {rule.trigger_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>

                  {/* Preview */}
                  <div className="mt-2 flex items-start gap-2">
                    <HiOutlineChatBubbleBottomCenterText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {rule.response_text.length > 120
                        ? rule.response_text.slice(0, 120) + "…"
                        : rule.response_text}
                    </p>
                  </div>

                  {/* Agent */}
                  {rule.ai_agents && (
                    <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
                      {t("dashboard.autoReplies.agent")}: {rule.ai_agents.name}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      rule.is_active
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {rule.is_active
                      ? t("dashboard.autoReplies.on")
                      : t("dashboard.autoReplies.off")}
                  </button>
                  <button
                    onClick={() => {
                      setEditRule(rule);
                      setShowModal(true);
                    }}
                    className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <RuleModal
          rule={editRule}
          agents={agents}
          onClose={() => {
            setShowModal(false);
            setEditRule(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
