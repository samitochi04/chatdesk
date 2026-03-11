import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  HiOutlineUserGroup,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineTag,
} from "react-icons/hi2";

const CLASSIFICATIONS = ["new", "regular", "vip"];

/* ── Add / Edit Contact Modal ───────────── */

function ContactModal({ contact, tags, onClose, onSave }) {
  const { t } = useTranslation();
  const isEdit = !!contact;
  const [form, setForm] = useState({
    phoneNumber: contact?.phone_number || "",
    name: contact?.name || "",
    email: contact?.email || "",
    classification: contact?.classification || "new",
    notes: contact?.notes || "",
    selectedTags: contact?.contact_tags?.map((ct) => ct.tag_id) || [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/crm/contacts/${contact.id}`, {
          name: form.name,
          email: form.email,
          classification: form.classification,
          notes: form.notes,
        });
        await api.put(`/crm/contacts/${contact.id}/tags`, {
          tagIds: form.selectedTags,
        });
      } else {
        await api.post("/crm/contacts", {
          phoneNumber: form.phoneNumber,
          name: form.name,
          email: form.email,
          classification: form.classification,
          notes: form.notes,
          tags: form.selectedTags,
        });
      }
      onSave();
    } catch {
      /* toast */
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (tagId) => {
    setForm((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tagId)
        ? prev.selectedTags.filter((t) => t !== tagId)
        : [...prev.selectedTags, tagId],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {isEdit
              ? t("dashboard.contacts.editContact")
              : t("dashboard.contacts.addContact")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.contacts.phone")} *
              </label>
              <input
                required
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                }
                placeholder="+234..."
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.contacts.name")}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.contacts.classification")}
            </label>
            <select
              value={form.classification}
              onChange={(e) =>
                setForm((p) => ({ ...p, classification: e.target.value }))
              }
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                {t("dashboard.contacts.tags")}
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      form.selectedTags.includes(tag.id)
                        ? "text-white"
                        : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]"
                    }`}
                    style={
                      form.selectedTags.includes(tag.id)
                        ? { backgroundColor: tag.color }
                        : {}
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
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
        </form>
      </div>
    </div>
  );
}

/* ── Main Contacts Page ─────────────────── */

export default function Contacts() {
  const { t } = useTranslation();
  const [contacts, setContacts] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classification, setClassification] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const limit = 20;

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      if (classification) params.set("classification", classification);
      const res = await api.get(`/crm/contacts?${params}`);
      setContacts(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, classification]);

  const fetchTags = useCallback(async () => {
    try {
      const res = await api.get("/crm/tags");
      setTags(res.data || []);
    } catch {
      setTags([]);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const totalPages = Math.ceil(total / limit);

  const handleSave = () => {
    setShowModal(false);
    setEditContact(null);
    fetchContacts();
  };

  const handleDelete = async (id) => {
    if (!confirm(t("dashboard.contacts.confirmDelete"))) return;
    try {
      await api.delete(`/crm/contacts/${id}`);
      fetchContacts();
    } catch {
      /* toast */
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {t("dashboard.contacts.title")}
        </h1>
        <button
          onClick={() => {
            setEditContact(null);
            setShowModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("dashboard.contacts.addContact")}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t("dashboard.contacts.searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <select
          value={classification}
          onChange={(e) => {
            setClassification(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="">{t("dashboard.contacts.allClassifications")}</option>
          {CLASSIFICATIONS.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                  {t("dashboard.contacts.name")}
                </th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                  {t("dashboard.contacts.phone")}
                </th>
                <th className="hidden px-4 py-3 font-medium text-[var(--color-text-secondary)] md:table-cell">
                  {t("dashboard.contacts.tags")}
                </th>
                <th className="hidden px-4 py-3 font-medium text-[var(--color-text-secondary)] sm:table-cell">
                  {t("dashboard.contacts.classification")}
                </th>
                <th className="hidden px-4 py-3 font-medium text-[var(--color-text-secondary)] lg:table-cell">
                  {t("dashboard.contacts.totalOrders")}
                </th>
                <th className="px-4 py-3 font-medium text-[var(--color-text-secondary)]">
                  {t("dashboard.contacts.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="mx-auto h-6 w-6 animate-spin rounded-full border-3 border-[var(--color-primary)] border-t-transparent" />
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-[var(--color-text-tertiary)]"
                  >
                    <HiOutlineUserGroup className="mx-auto mb-2 h-8 w-8" />
                    {t("dashboard.contacts.noContacts")}
                  </td>
                </tr>
              ) : (
                contacts.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-secondary)]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/contacts/${c.id}`}
                        className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary)]"
                      >
                        {c.name || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {c.phone_number}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {c.contact_tags?.map((ct) => (
                          <span
                            key={ct.tag_id}
                            className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{
                              backgroundColor: ct.tags?.color || "#6B7280",
                            }}
                          >
                            {ct.tags?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          c.classification === "vip"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : c.classification === "regular"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        {c.classification}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-[var(--color-text-secondary)] lg:table-cell">
                      {c.total_orders || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditContact(c);
                            setShowModal(true);
                          }}
                          className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
                          title="Edit"
                        >
                          <HiOutlineTag className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                          title="Delete"
                        >
                          <HiOutlineXMark className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t("dashboard.contacts.showing", {
                from: (page - 1) * limit + 1,
                to: Math.min(page * limit, total),
                total,
              })}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40"
              >
                <HiOutlineChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-40"
              >
                <HiOutlineChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <ContactModal
          contact={editContact}
          tags={tags}
          onClose={() => {
            setShowModal(false);
            setEditContact(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
