import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  HiBars3,
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUserGroup,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function TopBar({ onMenuClick }) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data?.unread || 0);
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch notifications list
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications?limit=15");
      setNotifications(res.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const handleOpenNotif = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen) fetchNotifications();
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setUnreadCount(0);
      setNotifications((prev) => prev.filter((n) => n.read));
    } catch {
      /* ignore */
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      try {
        await api.patch(`/notifications/${notif.id}/read`);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      } catch {
        /* ignore */
      }
    }
    if (notif.link) {
      navigate(notif.link);
    }
    setNotifOpen(false);
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchTargets = [
    {
      key: "contacts",
      path: "/dashboard/contacts",
      icon: HiOutlineUserGroup,
      label: t("dashboard.sidebar.contacts"),
    },
    {
      key: "conversations",
      path: "/dashboard/conversations",
      icon: HiOutlineChatBubbleLeftRight,
      label: t("dashboard.sidebar.conversations"),
    },
  ];

  const handleSearchNav = (path) => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`${path}?search=${encodeURIComponent(q)}`);
    setSearchQuery("");
    setSearchOpen(false);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      {/* Left: hamburger + search */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="cursor-pointer rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] lg:hidden"
          aria-label="Open sidebar"
        >
          <HiBars3 className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block" ref={searchRef}>
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(e.target.value.trim().length > 0);
            }}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearchNav("/dashboard/contacts");
              }
              if (e.key === "Escape") setSearchOpen(false);
            }}
            placeholder={t("common.search")}
            className="h-9 w-64 rounded-lg bg-[var(--color-bg-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          {searchOpen && searchQuery.trim() && (
            <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
              <p className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-tertiary)]">
                {t("common.search")} &quot;{searchQuery.trim()}&quot;
              </p>
              {searchTargets.map(({ key, path, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleSearchNav(path)}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleOpenNotif}
            className="relative cursor-pointer rounded-lg p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {t("dashboard.settings.notifications")}
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                  >
                    <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                    {t("dashboard.settings.markAllRead")}
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
                    {t("dashboard.settings.noNotifications")}
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      className={`flex w-full cursor-pointer flex-col gap-0.5 border-b border-[var(--color-border)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-hover)] ${!notif.read ? "bg-[var(--color-primary)]/5" : ""}`}
                    >
                      <p
                        className={`text-sm ${!notif.read ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"}`}
                      >
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-[var(--color-text-tertiary)] line-clamp-2">
                          {notif.body}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex cursor-pointer items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-medium text-[var(--color-primary-text)]">
              {profile?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
              <div className="border-b border-[var(--color-border)] px-4 py-2.5">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {profile?.full_name || "User"}
                </p>
                <p className="truncate text-xs text-[var(--color-text-tertiary)]">
                  {profile?.role}
                </p>
              </div>
              <Link
                to="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              >
                <HiOutlineCog6Tooth className="h-4 w-4" />
                {t("dashboard.sidebar.settings")}
              </Link>
              <Link
                to="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              >
                <HiOutlineUser className="h-4 w-4" />
                {t("dashboard.settings.profile")}
              </Link>
              <hr className="my-1 border-[var(--color-border)]" />
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  signOut();
                }}
                className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-danger)] transition-colors hover:bg-[var(--color-surface-hover)]"
              >
                <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
                {t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
