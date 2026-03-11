import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";

/* ── Modal ────────────────────────────── */

function ReplyModal({ reply, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!reply;
  const [form, setForm] = useState({
    title: reply?.title || "",
    content: reply?.content || "",
    shortcut: reply?.shortcut || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await api.patch(`/quick-replies/${reply.id}`, form);
      } else {
        await api.post("/quick-replies", form);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isEdit
              ? t("dashboard.quickReplies.edit")
              : t("dashboard.quickReplies.create")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.quickReplies.titleLabel")} *
            </label>
            <input
              required
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.quickReplies.shortcut")}
            </label>
            <input
              value={form.shortcut}
              onChange={(e) =>
                setForm((p) => ({ ...p, shortcut: e.target.value }))
              }
              placeholder={t("dashboard.quickReplies.shortcutHint")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.quickReplies.content")} *
            </label>
            <textarea
              required
              value={form.content}
              onChange={(e) =>
                setForm((p) => ({ ...p, content: e.target.value }))
              }
              rows={4}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
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
              {saving ? "..." : t("common.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────── */

export default function QuickReplies() {
  const { t } = useTranslation();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editReply, setEditReply] = useState(null);

  const fetchReplies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/quick-replies");
      setReplies(res.data || []);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReplies();
  }, [fetchReplies]);

  const handleSave = () => {
    setShowModal(false);
    setEditReply(null);
    fetchReplies();
  };

  const handleDelete = async (id) => {
    if (!confirm(t("dashboard.quickReplies.confirmDelete"))) return;
    try {
      await api.delete(`/quick-replies/${id}`);
      fetchReplies();
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
            {t("dashboard.quickReplies.title")}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {replies.length} {t("dashboard.quickReplies.replyCount")}
          </p>
        </div>
        <button
          onClick={() => {
            setEditReply(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("dashboard.quickReplies.create")}
        </button>
      </div>

      {/* List */}
      {replies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineChatBubbleLeftRight className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.quickReplies.noReplies")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.quickReplies.noRepliesHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {replies.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      {r.title}
                    </h3>
                    {r.shortcut && (
                      <code className="rounded bg-[var(--color-bg-secondary)] px-1.5 py-0.5 text-xs text-[var(--color-primary)]">
                        {r.shortcut}
                      </code>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    {r.content.length > 120
                      ? r.content.slice(0, 120) + "…"
                      : r.content}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditReply(r);
                      setShowModal(true);
                    }}
                    className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                  >
                    <HiOutlinePencilSquare className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
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
        <ReplyModal
          reply={editReply}
          onClose={() => {
            setShowModal(false);
            setEditReply(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
