import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

function ChartCard({ title, children, isEmpty }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      {isEmpty ? (
        <div className="flex h-[250px] items-center justify-center text-sm text-[var(--color-text-tertiary)]">
          Not enough data yet
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export default function Analytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [dateRange, setDateRange] = useState("7d");

  // Analytics data from various endpoints
  const [messagesData, setMessagesData] = useState([]);
  const [convByStatus, setConvByStatus] = useState([]);
  const [classificationData, setClassificationData] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);
  const [broadcastData, setBroadcastData] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const [dashRes, broadcastsRes, analyticsRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/broadcasts"),
        api.get(`/admin/analytics?days=${days}`),
      ]);
      setDashboard(dashRes.data);

      // Build conversations-by-status from dashboard
      const d = dashRes.data;
      const open = d.openConversations || 0;
      const totalConv = d.totalConversations || 0;
      const closed = totalConv - open;
      setConvByStatus([
        { name: t("dashboard.conversations.open"), value: open },
        {
          name: t("dashboard.conversations.closed"),
          value: closed > 0 ? closed : 0,
        },
      ]);

      // Real messages-per-day from analytics endpoint
      const analytics = analyticsRes.data;
      setMessagesData(
        (analytics.messagesPerDay || []).map((m) => ({
          date: new Date(m.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          }),
          messages: m.messages,
        })),
      );

      // Real classification breakdown
      setClassificationData(analytics.classificationData || []);

      // Real pipeline funnel
      setPipelineData(analytics.pipelineData || []);

      // Broadcast delivery from real data
      const casts = broadcastsRes.data || [];
      const sentCasts = casts.filter((b) => b.status === "sent");
      const totalRecipients = sentCasts.reduce(
        (acc, b) => acc + (b.total_recipients || 0),
        0,
      );
      const totalDelivered = sentCasts.reduce(
        (acc, b) => acc + (b.delivered_count || 0),
        0,
      );
      const totalRead = sentCasts.reduce(
        (acc, b) => acc + (b.read_count || 0),
        0,
      );
      setBroadcastData([
        {
          name: t("dashboard.broadcasts.sent"),
          value: totalRecipients,
        },
        {
          name: t("dashboard.broadcasts.delivered"),
          value: totalDelivered,
        },
        {
          name: t("dashboard.broadcasts.readRate"),
          value: totalRead,
        },
      ]);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [dateRange, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          {t("dashboard.analytics.title")}
        </h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="7d">{t("dashboard.analytics.last7")}</option>
          <option value="30d">{t("dashboard.analytics.last30")}</option>
          <option value="90d">{t("dashboard.analytics.last90")}</option>
        </select>
      </div>

      {/* Stat cards */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: t("dashboard.overview.totalContacts"),
              value: dashboard.totalContacts,
            },
            {
              label: t("dashboard.overview.openConversations"),
              value: dashboard.openConversations,
            },
            {
              label: t("dashboard.overview.totalDeals"),
              value: dashboard.totalDeals,
            },
            {
              label: t("dashboard.overview.totalBroadcasts"),
              value: dashboard.totalBroadcasts,
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Messages per day */}
        <ChartCard
          title={t("dashboard.analytics.messagesPerDay")}
          isEmpty={messagesData.every((m) => m.messages === 0)}
        >
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={messagesData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="messages"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Conversations by status */}
        <ChartCard
          title={t("dashboard.analytics.conversationsByStatus")}
          isEmpty={convByStatus.every((c) => c.value === 0)}
        >
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={convByStatus}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {convByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Contact classification */}
        <ChartCard
          title={t("dashboard.analytics.contactClassification")}
          isEmpty={classificationData.length === 0}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={classificationData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--color-text-tertiary)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Pipeline funnel */}
        <ChartCard
          title={t("dashboard.analytics.pipelineFunnel")}
          isEmpty={
            pipelineData.length === 0 ||
            pipelineData.every((p) => p.value === 0)
          }
        >
          <ResponsiveContainer width="100%" height={250}>
            <FunnelChart>
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Funnel dataKey="value" data={pipelineData} isAnimationActive>
                <LabelList
                  position="right"
                  fill="var(--color-text-secondary)"
                  stroke="none"
                  dataKey="name"
                  fontSize={12}
                />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Broadcast delivery */}
        <ChartCard
          title={t("dashboard.analytics.broadcastDelivery")}
          isEmpty={broadcastData.every((b) => b.value === 0)}
        >
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={broadcastData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
              />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
