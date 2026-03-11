import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/api";
import {
  HiOutlineArrowLeft,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineTag,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingCart,
} from "react-icons/hi2";

export default function ContactDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/crm/contacts/${id}`)
      .then((res) => setContact(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        {error || "Contact not found"}
      </div>
    );
  }

  const infoItems = [
    {
      icon: HiOutlinePhone,
      label: t("dashboard.contacts.phone"),
      value: contact.phone_number,
    },
    {
      icon: HiOutlineEnvelope,
      label: "Email",
      value: contact.email || "—",
    },
    {
      icon: HiOutlineShoppingCart,
      label: t("dashboard.contacts.totalOrders"),
      value: contact.total_orders || 0,
    },
    {
      icon: HiOutlineCurrencyDollar,
      label: t("dashboard.contacts.totalSpent"),
      value: contact.total_spent
        ? `₦${Number(contact.total_spent).toLocaleString()}`
        : "₦0",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/contacts")}
        className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
      >
        <HiOutlineArrowLeft className="h-4 w-4" />
        {t("dashboard.contacts.backToContacts")}
      </button>

      {/* Header card */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-xl font-bold text-[var(--color-primary)]">
              {(contact.name || contact.phone_number || "?")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                {contact.name || contact.phone_number}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    contact.classification === "vip"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : contact.classification === "regular"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {contact.classification}
                </span>
                <span className="text-sm text-[var(--color-text-tertiary)]">
                  {t("dashboard.contacts.created")}:{" "}
                  {new Date(contact.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Link
            to={`/dashboard/conversations`}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
            {t("dashboard.contacts.viewConversations")}
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Info card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase text-[var(--color-text-tertiary)]">
            {t("dashboard.contacts.info")}
          </h2>
          <div className="space-y-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon className="h-5 w-5 text-[var(--color-text-tertiary)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {item.label}
                  </p>
                  <p className="text-sm text-[var(--color-text-primary)]">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tags card */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase text-[var(--color-text-tertiary)]">
            <HiOutlineTag className="h-4 w-4" />
            {t("dashboard.contacts.tags")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {contact.contact_tags?.length > 0 ? (
              contact.contact_tags.map((ct) => (
                <span
                  key={ct.tag_id}
                  className="rounded-full px-3 py-1 text-xs font-medium text-white"
                  style={{
                    backgroundColor: ct.tags?.color || "#6B7280",
                  }}
                >
                  {ct.tags?.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {t("dashboard.contacts.noTags")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Notes */}
      {contact.notes && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h2 className="mb-2 text-sm font-semibold uppercase text-[var(--color-text-tertiary)]">
            {t("dashboard.contacts.notesLabel")}
          </h2>
          <p className="whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">
            {contact.notes}
          </p>
        </div>
      )}
    </div>
  );
}
