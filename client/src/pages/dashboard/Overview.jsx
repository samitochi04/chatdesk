import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import {
  HiOutlineUserGroup,
  HiOutlineChatBubbleLeftRight,
  HiOutlineDevicePhoneMobile,
  HiOutlineCurrencyDollar,
  HiOutlineMegaphone,
  HiOutlinePlus,
  HiOutlineLink,
} from "react-icons/hi2";

export default function Overview() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/admin/dashboard")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
        {error}
      </div>
    );
  }

  const cards = [
    {
      label: t("dashboard.overview.totalContacts"),
      value: data.totalContacts,
      icon: HiOutlineUserGroup,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: t("dashboard.overview.openConversations"),
      value: data.openConversations,
      icon: HiOutlineChatBubbleLeftRight,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30",
    },
    {
      label: t("dashboard.overview.activeAccounts"),
      value: data.whatsappAccounts.connected,
      icon: HiOutlineDevicePhoneMobile,
      color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      label: t("dashboard.overview.totalDeals"),
      value: data.totalDeals,
      icon: HiOutlineCurrencyDollar,
      color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
    },
    {
      label: t("dashboard.overview.totalBroadcasts"),
      value: data.totalBroadcasts,
      icon: HiOutlineMegaphone,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  const quickActions = [
    {
      label: t("dashboard.overview.newConversation"),
      to: "/dashboard/conversations",
      icon: HiOutlineChatBubbleLeftRight,
    },
    {
      label: t("dashboard.overview.addContact"),
      to: "/dashboard/contacts",
      icon: HiOutlinePlus,
    },
    {
      label: t("dashboard.overview.connectWhatsapp"),
      to: "/dashboard/whatsapp",
      icon: HiOutlineLink,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {t("dashboard.overview.title")}
        </h1>
        {data.plan && (
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.overview.currentPlan")}: {data.plan}
          </p>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {card.value}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {card.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          {t("dashboard.overview.quickActions")}
        </h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
