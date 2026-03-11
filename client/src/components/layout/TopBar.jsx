import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import {
  HiBars3,
  HiOutlineBell,
  HiOutlineMagnifyingGlass,
  HiOutlineUser,
  HiOutlineCog6Tooth,
  HiOutlineArrowRightOnRectangle,
} from "react-icons/hi2";

export default function TopBar({ onMenuClick }) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

        <div className="relative hidden sm:block">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            placeholder={t("common.search")}
            className="h-9 w-64 rounded-lg bg-[var(--color-bg-secondary)] pl-9 pr-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-none transition-colors focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <LanguageToggle />
        <ThemeToggle />
        <button
          className="relative cursor-pointer rounded-lg p-2 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          aria-label="Notifications"
        >
          <HiOutlineBell className="h-5 w-5" />
        </button>

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
