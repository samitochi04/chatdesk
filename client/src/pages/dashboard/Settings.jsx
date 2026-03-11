import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
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
function ProfileTab({ t, profile }) {
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
  const [industry, setIndustry] = useState(organization?.industry || "");
  const [timezone, setTimezone] = useState(
    organization?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName, industry, timezone })
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
          {t("dashboard.settings.industry")}
        </label>
        <input
          type="text"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
          {t("dashboard.settings.timezone")}
        </label>
        <input
          type="text"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
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
  );
}

/* ================================================================== */
/*  Notifications Tab                                                  */
/* ================================================================== */
function NotificationsTab({ t }) {
  const [prefs, setPrefs] = useState({
    newMessage: true,
    newContact: true,
    dealUpdate: false,
    broadcastComplete: true,
  });

  const toggle = (key) => setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: "newMessage", label: t("dashboard.settings.notifyNewMessage") },
    { key: "newContact", label: t("dashboard.settings.notifyNewContact") },
    { key: "dealUpdate", label: t("dashboard.settings.notifyDealUpdate") },
    {
      key: "broadcastComplete",
      label: t("dashboard.settings.notifyBroadcast"),
    },
  ];

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-[var(--color-text-tertiary)]">
        {t("dashboard.settings.notificationsHint")}
      </p>
      {items.map((item) => (
        <label
          key={item.key}
          className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
        >
          <span className="text-sm text-[var(--color-text-primary)]">
            {item.label}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={prefs[item.key]}
            onClick={() => toggle(item.key)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
              prefs[item.key]
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-border)]"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                prefs[item.key] ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </label>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Settings Page                                                      */
/* ================================================================== */
export default function Settings() {
  const { t } = useTranslation();
  const { profile, organization } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    {
      id: "profile",
      label: t("dashboard.settings.profile"),
      icon: HiOutlineUser,
    },
    {
      id: "organization",
      label: t("dashboard.settings.organization"),
      icon: HiOutlineBuildingOffice,
    },
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
        {activeTab === "profile" && <ProfileTab t={t} profile={profile} />}
        {activeTab === "organization" && (
          <OrganizationTab t={t} organization={organization} />
        )}
        {activeTab === "notifications" && <NotificationsTab t={t} />}
      </div>
    </div>
  );
}
