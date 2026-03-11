import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineMegaphone,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineStopCircle,
  HiOutlineArrowLeft,
} from "react-icons/hi2";

/* ── Status helpers ───────────────────── */

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  sending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  sent: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  failed: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

/* ── Create Modal (multi-step) ────────── */

function CreateModal({ onClose, onSaved }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: info, 2: recipients, 3: schedule, 4: review
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [name, setName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [whatsappAccountId, setWhatsappAccountId] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [scheduleType, setScheduleType] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");

  // Loaded data
  const [accounts, setAccounts] = useState([]);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [accRes, tagRes] = await Promise.all([
          api.get("/whatsapp/accounts"),
          api.get("/crm/tags"),
        ]);
        const accs = accRes.data || [];
        setAccounts(accs);
        if (accs.length > 0) setWhatsappAccountId(accs[0].id);
        setTags(tagRes.data || []);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name,
        messageTemplate,
        whatsappAccountId,
        targetTagIds: selectedTags,
        scheduledAt:
          scheduleType === "later" && scheduledAt ? scheduledAt : null,
      };
      const res = await api.post("/broadcasts", payload);

      // If "now", schedule + send immediately
      if (scheduleType === "now") {
        await api.post("/broadcasts/schedule", {
          broadcastId: res.data.id,
        });
        await api.post("/broadcasts/send", {
          broadcastId: res.data.id,
        });
      } else {
        await api.post("/broadcasts/schedule", {
          broadcastId: res.data.id,
        });
      }

      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const canNext =
    (step === 1 && name && messageTemplate && whatsappAccountId) ||
    step === 2 ||
    step === 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("dashboard.broadcasts.create")} —{" "}
            {t("dashboard.broadcasts.step")} {step}/4
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Step 1: Name & Message */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.broadcasts.name")} *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.broadcasts.message")} *
              </label>
              <textarea
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={4}
                placeholder={t("dashboard.broadcasts.messageHint")}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.broadcasts.whatsappAccount")}
              </label>
              <select
                value={whatsappAccountId}
                onChange={(e) => setWhatsappAccountId(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.display_name || a.phone_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Recipients */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("dashboard.broadcasts.recipientHint")}
            </p>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.includes(tag.id)
                          ? prev.filter((id) => id !== tag.id)
                          : [...prev, tag.id],
                      )
                    }
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selectedTags.includes(tag.id)
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {t("dashboard.broadcasts.noTags")}
              </p>
            )}
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {selectedTags.length === 0
                ? t("dashboard.broadcasts.allContacts")
                : `${selectedTags.length} ${t("dashboard.broadcasts.tagsSelected")}`}
            </p>
          </div>
        )}

        {/* Step 3: Schedule */}
        {step === 3 && (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <input
                type="radio"
                name="schedule"
                checked={scheduleType === "now"}
                onChange={() => setScheduleType("now")}
                className="accent-[var(--color-primary)]"
              />
              {t("dashboard.broadcasts.sendNow")}
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <input
                type="radio"
                name="schedule"
                checked={scheduleType === "later"}
                onChange={() => setScheduleType("later")}
                className="accent-[var(--color-primary)]"
              />
              {t("dashboard.broadcasts.scheduleLater")}
            </label>
            {scheduleType === "later" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-3 rounded-lg bg-[var(--color-bg-secondary)] p-4 text-sm">
            <div>
              <span className="font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.broadcasts.name")}:
              </span>{" "}
              <span className="text-[var(--color-text-primary)]">{name}</span>
            </div>
            <div>
              <span className="font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.broadcasts.message")}:
              </span>
              <p className="mt-1 whitespace-pre-wrap text-[var(--color-text-primary)]">
                {messageTemplate}
              </p>
            </div>
            <div>
              <span className="font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.broadcasts.recipients")}:
              </span>{" "}
              <span className="text-[var(--color-text-primary)]">
                {selectedTags.length === 0
                  ? t("dashboard.broadcasts.allContacts")
                  : `${selectedTags.length} ${t("dashboard.broadcasts.tagsSelected")}`}
              </span>
            </div>
            <div>
              <span className="font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.broadcasts.schedule")}:
              </span>{" "}
              <span className="text-[var(--color-text-primary)]">
                {scheduleType === "now"
                  ? t("dashboard.broadcasts.sendNow")
                  : scheduledAt}
              </span>
            </div>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            {step > 1 ? t("common.previous") : t("common.cancel")}
          </button>
          {step < 4 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {t("common.next")}
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleCreate}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "..." : t("common.confirm")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Detail Modal ─────────────────────── */

function DetailModal({ broadcast, onClose, onRefresh }) {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/broadcasts/${broadcast.id}/recipients`);
        setRecipients(res.data || []);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, [broadcast.id]);

  const total = broadcast.total_recipients || 1;
  const deliveredPct = Math.round(
    ((broadcast.delivered_count || 0) / total) * 100,
  );
  const readPct = Math.round(((broadcast.read_count || 0) / total) * 100);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post(`/broadcasts/${broadcast.id}/cancel`);
      onRefresh();
    } catch {
      /* ignore */
    } finally {
      setCancelling(false);
    }
  };

  const canCancel =
    broadcast.status === "scheduled" || broadcast.status === "sending";

  const RCPT_COLORS = {
    pending: "text-gray-500",
    sent: "text-blue-600",
    delivered: "text-green-600",
    read: "text-green-700",
    failed: "text-red-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onClose}>
              <HiOutlineArrowLeft className="h-5 w-5 text-[var(--color-text-secondary)]" />
            </button>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
              {broadcast.name}
            </h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[broadcast.status]}`}
            >
              {t(`dashboard.broadcasts.${broadcast.status}`)}
            </span>
          </div>
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="inline-flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <HiOutlineStopCircle className="h-4 w-4" />
              {t("dashboard.broadcasts.cancelCampaign")}
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
            <span>{t("dashboard.broadcasts.delivered")}</span>
            <span>
              {broadcast.delivered_count || 0}/{total} ({deliveredPct}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${deliveredPct}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-[var(--color-text-secondary)]">
            <span>{t("dashboard.broadcasts.readRate")}</span>
            <span>
              {broadcast.read_count || 0}/{total} ({readPct}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-secondary)]">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{ width: `${readPct}%` }}
            />
          </div>
        </div>

        {/* Recipients table */}
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
          {t("dashboard.broadcasts.recipients")}
        </h3>
        {loading ? (
          <div className="flex h-20 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
          </div>
        ) : recipients.length === 0 ? (
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.broadcasts.noRecipients")}
          </p>
        ) : (
          <div className="max-h-60 overflow-auto rounded-lg border border-[var(--color-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
                <tr>
                  <th className="px-3 py-2">{t("dashboard.contacts.name")}</th>
                  <th className="px-3 py-2">{t("dashboard.contacts.phone")}</th>
                  <th className="px-3 py-2">{t("common.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {recipients.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-[var(--color-text-primary)]">
                      {r.contacts?.name || "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                      {r.contacts?.phone_number || "—"}
                    </td>
                    <td
                      className={`px-3 py-2 font-medium ${RCPT_COLORS[r.status] || ""}`}
                    >
                      {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────── */

export default function Broadcasts() {
  const { t } = useTranslation();
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState(null);

  const fetchBroadcasts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/broadcasts");
      setBroadcasts(res.data || []);
    } catch {
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  const handleDelete = async (id) => {
    if (!confirm(t("dashboard.broadcasts.confirmDelete"))) return;
    try {
      await api.delete(`/broadcasts/${id}`);
      fetchBroadcasts();
    } catch {
      /* ignore */
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
            {t("dashboard.broadcasts.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {broadcasts.length} {t("dashboard.broadcasts.campaignCount")}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("dashboard.broadcasts.create")}
        </button>
      </div>

      {/* List */}
      {broadcasts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineMegaphone className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.broadcasts.noCampaigns")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.broadcasts.noCampaignsHint")}
          </p>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
              <tr>
                <th className="px-4 py-3">{t("dashboard.broadcasts.name")}</th>
                <th className="px-4 py-3">{t("common.status")}</th>
                <th className="px-4 py-3">
                  {t("dashboard.broadcasts.delivered")}
                </th>
                <th className="px-4 py-3">
                  {t("dashboard.broadcasts.readRate")}
                </th>
                <th className="px-4 py-3">
                  {t("dashboard.broadcasts.createdAt")}
                </th>
                <th className="px-4 py-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {broadcasts.map((b) => {
                const total = b.total_recipients || 0;
                return (
                  <tr key={b.id}>
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                      {b.name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[b.status]}`}
                      >
                        {t(`dashboard.broadcasts.${b.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {b.delivered_count || 0}/{total}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {b.read_count || 0}/{total}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="flex gap-1 px-4 py-3">
                      <button
                        onClick={() => setDetail(b)}
                        className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                        title={t("common.details")}
                      >
                        <HiOutlineEye className="h-4 w-4" />
                      </button>
                      {b.status === "draft" && (
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          title={t("common.delete")}
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

      {/* Modals */}
      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchBroadcasts();
          }}
        />
      )}
      {detail && (
        <DetailModal
          broadcast={detail}
          onClose={() => setDetail(null)}
          onRefresh={() => {
            setDetail(null);
            fetchBroadcasts();
          }}
        />
      )}
    </div>
  );
}
