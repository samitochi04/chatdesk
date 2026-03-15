import { useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageToggle from "@/components/ui/LanguageToggle";
import { HiBars3, HiXMark } from "react-icons/hi2";

const navLinks = [
  { key: "nav.services", href: "/#features" },
  { key: "nav.guides", href: "/guides" },
  { key: "nav.contact", href: "/contact" },
  { key: "nav.pricing", href: "/#pricing" },
];

export default function Navbar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleHashLink = useCallback(
    (e, href) => {
      if (href.includes("#")) {
        e.preventDefault();
        const [path, hash] = href.split("#");
        if (
          location.pathname === path ||
          (path === "/" && location.pathname === "/")
        ) {
          const el = document.getElementById(hash);
          if (el) el.scrollIntoView({ behavior: "smooth" });
        } else {
          navigate(`${path}#${hash}`);
        }
      }
    },
    [location.pathname, navigate],
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo className="h-8 w-auto" />
          <span className="text-lg font-bold text-[var(--color-text-primary)]">
            ChatDesk
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              to={l.href}
              onClick={(e) => handleHashLink(e, l.href)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === l.href
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </div>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-1 md:flex">
          <LanguageToggle />
          <ThemeToggle />
          {user ? (
            <Link
              to="/dashboard"
              className="ml-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-text)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              {t("nav.dashboard")}
            </Link>
          ) : (
            <>
              <Link
                to="/signin"
                className="ml-2 rounded-lg px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
              >
                {t("nav.signIn")}
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-text)] transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                {t("nav.signUp")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="cursor-pointer rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <HiXMark className="h-6 w-6" />
          ) : (
            <HiBars3 className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-[var(--color-surface)] shadow-xl md:hidden">
            <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                Menu
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="cursor-pointer rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              >
                <HiXMark className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-4 bg-[var(--color-surface)]">
              {navLinks.map((l) => (
                <Link
                  key={l.key}
                  to={l.href}
                  onClick={(e) => {
                    handleHashLink(e, l.href);
                    setMobileOpen(false);
                  }}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                >
                  {t(l.key)}
                </Link>
              ))}
              <hr className="my-2 border-[var(--color-border)]" />
              <div className="flex items-center gap-2 px-3">
                <LanguageToggle />
                <ThemeToggle />
              </div>
              <hr className="my-2 border-[var(--color-border)]" />
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-primary-text)]"
                >
                  {t("nav.dashboard")}
                </Link>
              ) : (
                <>
                  <Link
                    to="/signin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-center text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    {t("nav.signIn")}
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-center text-sm font-medium text-[var(--color-primary-text)]"
                  >
                    {t("nav.signUp")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
