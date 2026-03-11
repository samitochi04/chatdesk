import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Logo from "@/components/ui/Logo";
import { HiOutlineEnvelope } from "react-icons/hi2";
import { FaXTwitter, FaLinkedinIn, FaFacebookF } from "react-icons/fa6";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="h-8 w-auto" />
              <span className="text-lg font-bold text-[var(--color-text-primary)]">
                ChatDesk
              </span>
            </Link>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              {t("footer.description")}
            </p>
            <div className="mt-4 flex gap-3">
              <SocialIcon href="#" label="Twitter">
                <FaXTwitter className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href="#" label="LinkedIn">
                <FaLinkedinIn className="h-4 w-4" />
              </SocialIcon>
              <SocialIcon href="#" label="Facebook">
                <FaFacebookF className="h-4 w-4" />
              </SocialIcon>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
              {t("footer.quickLinks")}
            </h4>
            <ul className="space-y-2 text-sm">
              <FooterLink to="/#features">{t("nav.services")}</FooterLink>
              <FooterLink to="/guides">{t("nav.guides")}</FooterLink>
              <FooterLink to="/#pricing">{t("nav.pricing")}</FooterLink>
              <FooterLink to="/contact">{t("nav.contact")}</FooterLink>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
              {t("footer.legal")}
            </h4>
            <ul className="space-y-2 text-sm">
              <FooterLink to="/privacy">{t("footer.privacy")}</FooterLink>
              <FooterLink to="/terms">{t("footer.terms")}</FooterLink>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
              {t("nav.contact")}
            </h4>
            <a
              href="mailto:support@chatdesk.app"
              className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
            >
              <HiOutlineEnvelope className="h-4 w-4" />
              support@chatdesk.app
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-[var(--color-border)] pt-6 text-center text-sm text-[var(--color-text-tertiary)]">
          {t("footer.copyright", { year })}
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-primary)]"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ href, label, children }) {
  return (
    <a
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
