const { supabaseAdmin } = require("../config/supabase");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/**
 * Columns returned for each export type.
 * Keys map to the `type` query parameter.
 */
const EXPORT_CONFIGS = {
  contacts: {
    table: "contacts",
    columns:
      "id, phone_number, name, email, classification, total_orders, total_spent, last_conversation_at, created_at",
    headers: [
      "ID",
      "Phone",
      "Name",
      "Email",
      "Classification",
      "Total Orders",
      "Total Spent",
      "Last Conversation",
      "Created At",
    ],
    mapRow: (r) => [
      r.id,
      r.phone_number,
      r.name || "",
      r.email || "",
      r.classification,
      r.total_orders,
      r.total_spent,
      r.last_conversation_at || "",
      r.created_at,
    ],
  },
  conversations: {
    table: "conversations",
    columns:
      "id, contact_id, status, is_ai_handled, unread_count, last_message_at, created_at, closed_at",
    headers: [
      "ID",
      "Contact ID",
      "Status",
      "AI Handled",
      "Unread",
      "Last Message",
      "Created At",
      "Closed At",
    ],
    mapRow: (r) => [
      r.id,
      r.contact_id,
      r.status,
      r.is_ai_handled,
      r.unread_count,
      r.last_message_at || "",
      r.created_at,
      r.closed_at || "",
    ],
  },
  pipeline_deals: {
    table: "pipeline_deals",
    columns:
      "id, title, value, currency, stage_id, contact_id, assigned_to, expected_close_date, won_at, lost_at, lost_reason, created_at",
    headers: [
      "ID",
      "Title",
      "Value",
      "Currency",
      "Stage ID",
      "Contact ID",
      "Assigned To",
      "Expected Close",
      "Won At",
      "Lost At",
      "Lost Reason",
      "Created At",
    ],
    mapRow: (r) => [
      r.id,
      r.title,
      r.value ?? "",
      r.currency,
      r.stage_id,
      r.contact_id,
      r.assigned_to || "",
      r.expected_close_date || "",
      r.won_at || "",
      r.lost_at || "",
      r.lost_reason || "",
      r.created_at,
    ],
  },
};

/**
 * GET /api/export?type=contacts
 * Streams a CSV file to the client.
 */
const exportCsv = catchAsync(async (req, res) => {
  const orgId = req.organization.id;
  const { type } = req.query;

  const cfg = EXPORT_CONFIGS[type];
  if (!cfg) throw ApiError.badRequest(`Unknown export type: ${type}`);

  const { data: rows, error } = await supabaseAdmin
    .from(cfg.table)
    .select(cfg.columns)
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) throw ApiError.internal("Failed to query data for export");

  // Build CSV
  const csvLines = [cfg.headers.join(",")];

  for (const row of rows || []) {
    const values = cfg.mapRow(row).map(escapeCsvField);
    csvLines.push(values.join(","));
  }

  const csv = csvLines.join("\r\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${type}_export_${Date.now()}.csv"`,
  );
  res.send(csv);
});

/**
 * Escape a single CSV field value.
 * Wraps in quotes if value contains commas, quotes, or newlines.
 */
function escapeCsvField(value) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

module.exports = { exportCsv };
