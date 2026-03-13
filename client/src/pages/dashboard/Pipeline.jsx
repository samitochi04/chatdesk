import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineCalendar,
} from "react-icons/hi2";

/* ── Deal Card ───────────────────────────── */

function DealCard({ deal, onDragStart, onClick, orgCurrency }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, deal)}
      onClick={() => onClick(deal)}
      className="cursor-grab rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <p className="text-sm font-medium text-[var(--color-text-primary)]">
        {deal.title}
      </p>
      {deal.contacts && (
        <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
          <HiOutlineUser className="h-3 w-3" />
          {deal.contacts.name || deal.contacts.phone_number}
        </p>
      )}
      {deal.value && (
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
          <HiOutlineCurrencyDollar className="h-3 w-3" />
          {orgCurrency} {Number(deal.value).toLocaleString()}
        </p>
      )}
      {deal.expected_close_date && (
        <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
          <HiOutlineCalendar className="h-3 w-3" />
          {new Date(deal.expected_close_date).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

/* ── Kanban Column ───────────────────────── */

function KanbanColumn({
  stage,
  deals,
  onDragStart,
  onDragOver,
  onDrop,
  onDealClick,
  orgCurrency,
}) {
  const stageDeals = deals.filter((d) => d.stage_id === stage.id);
  const totalValue = stageDeals.reduce(
    (sum, d) => sum + Number(d.value || 0),
    0,
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add("ring-2", "ring-[var(--color-primary)]");
      }}
      onDragLeave={(e) => {
        e.currentTarget.classList.remove(
          "ring-2",
          "ring-[var(--color-primary)]",
        );
      }}
      onDrop={(e) => {
        e.currentTarget.classList.remove(
          "ring-2",
          "ring-[var(--color-primary)]",
        );
        onDrop(e, stage.id);
      }}
      className="flex w-72 shrink-0 flex-col rounded-xl bg-[var(--color-bg-secondary)] transition-all lg:w-80"
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            {stage.name}
          </h3>
          <span className="rounded-full bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)]">
            {stageDeals.length}
          </span>
        </div>
        {totalValue > 0 && (
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            {orgCurrency} {totalValue.toLocaleString()}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
        {stageDeals.map((deal) => (
          <DealCard
            key={deal.id}
            deal={deal}
            onDragStart={onDragStart}
            onClick={onDealClick}
            orgCurrency={orgCurrency}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Deal Modal ──────────────────────────── */

function DealModal({
  deal,
  stages,
  contacts,
  onClose,
  onSave,
  onDelete,
  orgCurrency,
}) {
  const { t } = useTranslation();
  const isEdit = !!deal;
  const [form, setForm] = useState({
    title: deal?.title || "",
    contactId: deal?.contact_id || "",
    stageId: deal?.stage_id || stages[0]?.id || "",
    value: deal?.value || "",
    currency: deal?.currency || orgCurrency,
    notes: deal?.notes || "",
    expectedCloseDate: deal?.expected_close_date?.split("T")[0] || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        contactId: form.contactId || null,
        stageId: form.stageId,
        value: form.value ? Number(form.value) : null,
        currency: form.currency,
        notes: form.notes,
        expectedCloseDate: form.expectedCloseDate || null,
      };
      if (isEdit) {
        await api.patch(`/crm/pipeline/deals/${deal.id}`, payload);
      } else {
        await api.post("/crm/pipeline/deals", payload);
      }
      onSave();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isEdit
              ? t("dashboard.pipeline.editDeal")
              : t("dashboard.pipeline.addDeal")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.pipeline.dealTitle")} *
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.pipeline.stage")}
              </label>
              <select
                value={form.stageId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, stageId: e.target.value }))
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.pipeline.contact")}
              </label>
              <select
                value={form.contactId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, contactId: e.target.value }))
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              >
                <option value="">—</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.phone_number}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.pipeline.value")}
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.value}
                onChange={(e) =>
                  setForm((p) => ({ ...p, value: e.target.value }))
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.pipeline.closeDate")}
              </label>
              <input
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    expectedCloseDate: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.pipeline.dealNotes")}
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(deal.id)}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  {t("dashboard.pipeline.deleteDeal")}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
              >
                {t("dashboard.contacts.cancel")}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "..." : t("dashboard.contacts.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Pipeline Page ──────────────────── */

export default function Pipeline() {
  const { t } = useTranslation();
  const { organization } = useAuth();
  const orgCurrency = organization?.currency || "NGN";
  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDeal, setEditDeal] = useState(null);
  const [dragDeal, setDragDeal] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [stageRes, dealRes, contactRes] = await Promise.all([
        api.get("/crm/pipeline/stages"),
        api.get("/crm/pipeline/deals"),
        api.get("/crm/contacts?page=1&limit=200"),
      ]);
      setStages(stageRes.data || []);
      setDeals(dealRes.data || []);
      setContacts(contactRes.data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Drag & Drop handlers
  const handleDragStart = (e, deal) => {
    setDragDeal(deal);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e, newStageId) => {
    e.preventDefault();
    if (!dragDeal || dragDeal.stage_id === newStageId) {
      setDragDeal(null);
      return;
    }

    // Optimistic update
    setDeals((prev) =>
      prev.map((d) =>
        d.id === dragDeal.id ? { ...d, stage_id: newStageId } : d,
      ),
    );

    try {
      await api.patch(`/crm/pipeline/deals/${dragDeal.id}`, {
        stageId: newStageId,
      });
      // Refresh to get full updated data (won_at/lost_at auto-set)
      const res = await api.get("/crm/pipeline/deals");
      setDeals(res.data || []);
    } catch {
      // Revert
      setDeals((prev) =>
        prev.map((d) =>
          d.id === dragDeal.id ? { ...d, stage_id: dragDeal.stage_id } : d,
        ),
      );
    }
    setDragDeal(null);
  };

  const handleDealClick = (deal) => {
    setEditDeal(deal);
    setShowModal(true);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditDeal(null);
    fetchData();
  };

  const handleDeleteDeal = async (id) => {
    if (!confirm(t("dashboard.pipeline.confirmDelete"))) return;
    try {
      await api.delete(`/crm/pipeline/deals/${id}`);
      setShowModal(false);
      setEditDeal(null);
      fetchData();
    } catch {
      /* toast */
    }
  };

  // Summary
  const totalValue = deals.reduce((s, d) => s + Number(d.value || 0), 0);
  const wonDeals = deals.filter((d) => d.pipeline_stages?.is_won);
  const wonValue = wonDeals.reduce((s, d) => s + Number(d.value || 0), 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {t("dashboard.pipeline.title")}
          </h1>
          <div className="mt-1 flex gap-4 text-sm text-[var(--color-text-tertiary)]">
            <span>
              {deals.length} {t("dashboard.pipeline.deals")}
            </span>
            <span>
              {orgCurrency} {totalValue.toLocaleString()}
            </span>
            {wonValue > 0 && (
              <span className="text-green-600">
                {t("dashboard.pipeline.won")}: {orgCurrency}{" "}
                {wonValue.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => {
            setEditDeal(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("dashboard.pipeline.addDeal")}
        </button>
      </div>

      {/* Kanban Board */}
      <div className="-mx-4 flex flex-1 gap-3 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            deals={deals}
            onDragStart={handleDragStart}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onDealClick={handleDealClick}
            orgCurrency={orgCurrency}
          />
        ))}
      </div>

      {/* Deal Modal */}
      {showModal && (
        <DealModal
          deal={editDeal}
          stages={stages}
          contacts={contacts}
          onClose={() => {
            setShowModal(false);
            setEditDeal(null);
          }}
          onSave={handleSave}
          onDelete={handleDeleteDeal}
          orgCurrency={orgCurrency}
        />
      )}
    </div>
  );
}
