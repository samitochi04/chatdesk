import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import {
  HiOutlineUser,
  HiOutlineBuildingOffice,
  HiOutlineBell,
} from "react-icons/hi2";

/* ================================================================== */
/*  Tab Button                                                         */
/* ================================================================== */
function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-[var(--color-primary)] text-[var(--color-primary)]"
          : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ================================================================== */
/*  Profile Tab                                                        */
/* ================================================================== */
function ProfileTab({ t, profile, user }) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveName = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success(t("common.success"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error(t("dashboard.settings.passwordMinLength"));
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success(t("common.success"));
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Info (read-only) */}
      <div className="max-w-md space-y-3">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          {t("dashboard.settings.accountInfo")}
        </h3>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">
              {t("dashboard.settings.email")}
            </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {user?.email || "—"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-secondary)]">
              {t("dashboard.settings.role")}
            </span>
            <span className="font-medium capitalize text-[var(--color-text-primary)]">
              {profile?.role?.replace("_", " ") || "—"}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-[var(--color-border)]" />

      {/* Change Name */}
      <form onSubmit={handleSaveName} className="max-w-md space-y-4">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          {t("dashboard.settings.changeName")}
        </h3>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
            {t("auth.signUp.fullName")}
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>
      </form>

      <hr className="border-[var(--color-border)]" />

      {/* Change Password */}
      <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          {t("dashboard.settings.changePassword")}
        </h3>
        <div>
          <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
            {t("dashboard.settings.newPassword")}
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={changingPassword}
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
        >
          {changingPassword
            ? t("common.loading")
            : t("dashboard.settings.changePassword")}
        </button>
      </form>
    </div>
  );
}

/* ================================================================== */
/*  Organization Tab                                                   */
/* ================================================================== */
function OrganizationTab({ t, organization }) {
  const [orgName, setOrgName] = useState(organization?.name || "");
  const [currency, setCurrency] = useState(organization?.currency || "NGN");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName, currency })
        .eq("id", organization.id);
      if (error) throw error;
      toast.success(t("common.success"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
          {t("dashboard.settings.orgName")}
        </label>
        <input
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
          {t("dashboard.settings.currency")}
        </label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
        >
          <option value="NGN">NGN - Nigerian Naira</option>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="GHS">GHS - Ghanaian Cedi</option>
          <option value="KES">KES - Kenyan Shilling</option>
          <option value="ZAR">ZAR - South African Rand</option>
          <option value="XOF">XOF - West African CFA</option>
          <option value="XAF">XAF - Central African CFA</option>
          <option value="EGP">EGP - Egyptian Pound</option>
          <option value="MAD">MAD - Moroccan Dirham</option>
          <option value="TZS">TZS - Tanzanian Shilling</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
      >
        {saving ? t("common.loading") : t("common.save")}
      </button>
    </form>
  );
}

/* ================================================================== */
/*  Notifications Tab                                                  */
/* ================================================================== */
function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
        checked ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function NotificationsTab({ t }) {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await api.get("/notifications/preferences");
      setPrefs(res.data);
    } catch {
      setPrefs({
        new_message_app: true,
        new_message_email: false,
        new_contact_app: true,
        new_contact_email: false,
        deal_update_app: false,
        deal_update_email: false,
        broadcast_app: true,
        broadcast_email: false,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleToggle = async (key) => {
    const updated = { ...prefs, [key]: !prefs[key] };
    setPrefs(updated);
    try {
      await api.put("/notifications/preferences", { [key]: updated[key] });
    } catch {
      setPrefs(prefs); // revert
      toast.error("Failed to save");
    }
  };

  const items = [
    {
      label: t("dashboard.settings.notifyNewMessage"),
      appKey: "new_message_app",
      emailKey: "new_message_email",
    },
    {
      label: t("dashboard.settings.notifyNewContact"),
      appKey: "new_contact_app",
      emailKey: "new_contact_email",
    },
    {
      label: t("dashboard.settings.notifyDealUpdate"),
      appKey: "deal_update_app",
      emailKey: "deal_update_email",
    },
    {
      label: t("dashboard.settings.notifyBroadcast"),
      appKey: "broadcast_app",
      emailKey: "broadcast_email",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-3 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      <p className="text-sm text-[var(--color-text-tertiary)]">
        {t("dashboard.settings.notificationsHint")}
      </p>

      {/* Header row */}
      <div className="flex items-center justify-end gap-6 px-4 text-xs font-medium text-[var(--color-text-tertiary)]">
        <span className="w-11 text-center">
          {t("dashboard.settings.inApp")}
        </span>
        <span className="w-11 text-center">
          {t("dashboard.settings.emailNotif")}
        </span>
      </div>

      {items.map((item) => (
        <div
          key={item.appKey}
          className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
        >
          <span className="text-sm text-[var(--color-text-primary)]">
            {item.label}
          </span>
          <div className="flex items-center gap-6">
            <Toggle
              checked={!!prefs?.[item.appKey]}
              onChange={() => handleToggle(item.appKey)}
              label={`${item.label} - in-app`}
            />
            <Toggle
              checked={!!prefs?.[item.emailKey]}
              onChange={() => handleToggle(item.emailKey)}
              label={`${item.label} - email`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Settings Page                                                      */
/* ================================================================== */
export default function Settings() {
  const { t } = useTranslation();
  const { user, profile, organization } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const canEditOrg = ["owner", "super_admin"].includes(profile?.role);

  const tabs = [
    {
      id: "profile",
      label: t("dashboard.settings.profile"),
      icon: HiOutlineUser,
    },
    ...(canEditOrg
      ? [
          {
            id: "organization",
            label: t("dashboard.settings.organization"),
            icon: HiOutlineBuildingOffice,
          },
        ]
      : []),
    {
      id: "notifications",
      label: t("dashboard.settings.notifications"),
      icon: HiOutlineBell,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        {t("dashboard.settings.title")}
      </h1>

      {/* Tab Bar */}
      <div className="border-b border-[var(--color-border)]">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        {activeTab === "profile" && (
          <ProfileTab t={t} profile={profile} user={user} />
        )}
        {activeTab === "organization" && (
          <OrganizationTab t={t} organization={organization} />
        )}
        {activeTab === "notifications" && <NotificationsTab t={t} />}
      </div>
    </div>
  );
}
