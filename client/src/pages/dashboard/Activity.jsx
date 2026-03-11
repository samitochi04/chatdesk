import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";

const ENTITY_TYPES = [
  "organization",
  "team_member",
  "team_invitation",
  "contact",
  "conversation",
  "broadcast",
  "ai_agent",
  "pipeline_deal",
];

const PAGE_SIZE = 50;

export default function Activity() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");

  const fetchLogs = useCallback(
    async (newOffset = 0, append = false) => {
      try {
        setLoading(true);
        let url = `/admin/activity?limit=${PAGE_SIZE}&offset=${newOffset}`;
        if (entityFilter) url += `&entityType=${entityFilter}`;
        const res = await api.get(url);
        const data = res.data || [];
        setLogs(append ? (prev) => [...prev, ...data] : data);
        setHasMore(data.length === PAGE_SIZE);
        setOffset(newOffset);
      } catch {
        if (!append) setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [entityFilter],
  );

  useEffect(() => {
    fetchLogs(0);
  }, [fetchLogs]);

  const loadMore = () => {
    fetchLogs(offset + PAGE_SIZE, true);
  };

  if (loading && logs.length === 0) {
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
          {t("dashboard.activity.title")}
        </h1>
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="">{t("common.all")}</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineClipboardDocumentList className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.activity.noActivity")}
          </p>
        </div>
      ) : (
        <div className="overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-xs text-[var(--color-text-tertiary)]">
              <tr>
                <th className="px-4 py-3">
                  {t("dashboard.activity.timestamp")}
                </th>
                <th className="px-4 py-3">{t("dashboard.activity.action")}</th>
                <th className="px-4 py-3">{t("dashboard.activity.entity")}</th>
                <th className="px-4 py-3">{t("dashboard.activity.details")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-[var(--color-text-secondary)]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-[var(--color-bg-secondary)] px-2 py-0.5 text-xs font-medium text-[var(--color-text-primary)]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                    {log.entity_type?.replace(/_/g, " ")}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-xs text-[var(--color-text-tertiary)]">
                    {log.metadata
                      ? JSON.stringify(log.metadata).slice(0, 100)
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Load more */}
      {hasMore && logs.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] disabled:opacity-50"
          >
            {loading ? "..." : t("dashboard.activity.loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
