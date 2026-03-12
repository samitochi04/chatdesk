import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import {
  HiOutlineDevicePhoneMobile,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineSignal,
  HiOutlineArrowPath,
  HiOutlineTrash,
  HiOutlineQrCode,
} from "react-icons/hi2";

const STATUS_COLORS = {
  connected:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  disconnected: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  banned: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

/* ── Register Modal ──────────────────────── */

function RegisterModal({ onClose, onSave }) {
  const { t } = useTranslation();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post("/whatsapp/accounts", {
        phoneNumber: phoneNumber.replace(/\D/g, ""),
        displayName: displayName || null,
      });
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
            {t("dashboard.whatsapp.registerAccount")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.whatsapp.phoneNumber")} *
            </label>
            <input
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="2348012345678"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
              {t("dashboard.whatsapp.phoneHint")}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
              {t("dashboard.whatsapp.displayName")}
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("dashboard.whatsapp.displayNameHint")}
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
              {t("dashboard.whatsapp.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "..." : t("dashboard.whatsapp.register")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── QR Modal ────────────────────────────── */

function QrModal({ accountId, onClose, onConnected }) {
  const { t } = useTranslation();
  const [qrCode, setQrCode] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const initConnect = async () => {
      try {
        const res = await api.post(`/whatsapp/accounts/${accountId}/connect`);
        if (cancelled) return;

        if (res.data.status === "connected") {
          setStatus("connected");
          onConnected();
          return;
        }

        setQrCode(res.data.qrCode);
        setStatus("pending");

        // Poll for connection status
        pollRef.current = setInterval(async () => {
          try {
            const statusRes = await api.get(
              `/whatsapp/accounts/${accountId}/status`,
            );
            if (
              statusRes.data.liveStatus === "connected" ||
              statusRes.data.status === "connected"
            ) {
              clearInterval(pollRef.current);
              setStatus("connected");
              onConnected();
            } else if (statusRes.data.qrCode) {
              setQrCode(statusRes.data.qrCode);
            }
          } catch {
            /* keep polling */
          }
        }, 3000);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setStatus("error");
        }
      }
    };

    initConnect();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [accountId, onConnected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-[var(--color-surface)] p-6 text-center shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            {t("dashboard.whatsapp.connect")}
          </h2>
          <button onClick={onClose}>
            <HiOutlineXMark className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {status === "loading" && (
          <div className="flex flex-col items-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              {t("dashboard.whatsapp.generatingQr")}
            </p>
          </div>
        )}

        {status === "pending" && qrCode && (
          <div className="space-y-4">
            <div className="mx-auto flex items-center justify-center rounded-xl bg-white p-3">
              <img src={qrCode} alt="QR Code" className="h-56 w-56" />
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("dashboard.whatsapp.scanQr")}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-tertiary)]">
              <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin" />
              {t("dashboard.whatsapp.waitingConnection")}
            </div>
          </div>
        )}

        {status === "pending" && !qrCode && (
          <div className="py-8">
            <HiOutlineQrCode className="mx-auto mb-2 h-12 w-12 text-[var(--color-text-tertiary)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t("dashboard.whatsapp.qrTimeout")}
            </p>
          </div>
        )}

        {status === "connected" && (
          <div className="py-8 text-green-600">
            <HiOutlineSignal className="mx-auto mb-2 h-12 w-12" />
            <p className="font-medium">{t("dashboard.whatsapp.connected")}!</p>
          </div>
        )}

        {status === "error" && (
          <div className="py-8 text-red-500">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Account Card ────────────────────────── */

function AccountCard({ account, onConnect, onDisconnect, onDelete }) {
  const { t } = useTranslation();
  const status = account.liveStatus || account.status;
  const isConnected = status === "connected";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
          <HiOutlineDevicePhoneMobile className="h-6 w-6" />
        </div>
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">
            {account.display_name || account.phone_number}
          </p>
          {account.display_name && (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {account.phone_number}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.disconnected}`}
            >
              {t(`dashboard.whatsapp.${status}`)}
            </span>
            {account.last_connected_at && (
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {t("dashboard.whatsapp.lastConnected")}:{" "}
                {new Date(account.last_connected_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {!isConnected && status !== "banned" && (
          <button
            onClick={() => onConnect(account.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm text-white hover:opacity-90"
          >
            <HiOutlineSignal className="h-4 w-4" />
            {t("dashboard.whatsapp.connect")}
          </button>
        )}
        {isConnected && (
          <button
            onClick={() => onDisconnect(account.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            {t("dashboard.whatsapp.disconnect")}
          </button>
        )}
        <button
          onClick={() => onDelete(account.id)}
          className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
          title={t("dashboard.whatsapp.deleteAccount")}
        >
          <HiOutlineTrash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────── */

export default function WhatsApp() {
  const { t } = useTranslation();
  const { organization, profile } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [connectId, setConnectId] = useState(null);

  const isSuperAdmin = profile?.role === "super_admin";
  const maxAccounts = organization?.max_whatsapp_numbers || 1;

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/whatsapp/accounts");
      setAccounts(res.data || []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDisconnect = async (id) => {
    try {
      await api.post(`/whatsapp/accounts/${id}/disconnect`);
      fetchAccounts();
    } catch {
      /* toast */
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("dashboard.whatsapp.confirmDelete"))) return;
    try {
      await api.delete(`/whatsapp/accounts/${id}`);
      fetchAccounts();
    } catch {
      /* toast */
    }
  };

  const atLimit = !isSuperAdmin && accounts.length >= maxAccounts;

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
            {t("dashboard.whatsapp.title")}
          </h1>
          {/* Plan limit indicator */}
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.whatsapp.accountsUsed", {
              used: accounts.length,
              max: maxAccounts,
            })}
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          disabled={atLimit}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          title={atLimit ? t("dashboard.whatsapp.limitReached") : ""}
        >
          <HiOutlinePlus className="h-4 w-4" />
          {t("dashboard.whatsapp.connect")}
        </button>
      </div>

      {/* Limit warning */}
      {atLimit && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-700 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
          {t("dashboard.whatsapp.limitReached")}
        </div>
      )}

      {/* Account list */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
          <HiOutlineDevicePhoneMobile className="mb-3 h-12 w-12 text-[var(--color-text-tertiary)]" />
          <p className="text-lg font-medium text-[var(--color-text-primary)]">
            {t("dashboard.whatsapp.noAccounts")}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
            {t("dashboard.whatsapp.noAccountsHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onConnect={(id) => setConnectId(id)}
              onDisconnect={handleDisconnect}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Register Modal */}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSave={() => {
            setShowRegister(false);
            fetchAccounts();
          }}
        />
      )}

      {/* QR Connect Modal */}
      {connectId && (
        <QrModal
          accountId={connectId}
          onClose={() => setConnectId(null)}
          onConnected={() => {
            setConnectId(null);
            fetchAccounts();
          }}
        />
      )}
    </div>
  );
}
