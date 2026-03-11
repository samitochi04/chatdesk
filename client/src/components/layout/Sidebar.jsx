import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import {
  HiOutlineHome,
  HiOutlineChatBubbleLeftRight,
  HiOutlineUsers,
  HiOutlineFunnel,
  HiOutlineDevicePhoneMobile,
  HiOutlineCpuChip,
  HiOutlineBolt,
  HiOutlineMegaphone,
  HiOutlineChartBar,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineCog6Tooth,
  HiOutlineXMark,
} from "react-icons/hi2";

const getNavItems = (t) => [
  {
    to: "/dashboard",
    icon: HiOutlineHome,
    label: t("dashboard.sidebar.overview"),
    end: true,
  },
  {
    to: "/dashboard/conversations",
    icon: HiOutlineChatBubbleLeftRight,
    label: t("dashboard.sidebar.conversations"),
  },
  {
    to: "/dashboard/contacts",
    icon: HiOutlineUsers,
    label: t("dashboard.sidebar.contacts"),
  },
  {
    to: "/dashboard/pipeline",
    icon: HiOutlineFunnel,
    label: t("dashboard.sidebar.pipeline"),
  },
  {
    to: "/dashboard/whatsapp",
    icon: HiOutlineDevicePhoneMobile,
    label: t("dashboard.sidebar.whatsapp"),
  },
  {
    to: "/dashboard/ai-agents",
    icon: HiOutlineCpuChip,
    label: t("dashboard.sidebar.aiAgents"),
  },
  {
    to: "/dashboard/auto-replies",
    icon: HiOutlineBolt,
    label: t("dashboard.sidebar.autoReplies"),
  },
  {
    to: "/dashboard/broadcasts",
    icon: HiOutlineMegaphone,
    label: t("dashboard.sidebar.broadcasts"),
    plan: "growth",
  },
  {
    to: "/dashboard/analytics",
    icon: HiOutlineChartBar,
    label: t("dashboard.sidebar.analytics"),
    plan: "growth",
  },
  {
    to: "/dashboard/quick-replies",
    icon: HiOutlineChatBubbleBottomCenterText,
    label: t("dashboard.sidebar.quickReplies"),
  },
  {
    to: "/dashboard/team",
    icon: HiOutlineUserGroup,
    label: t("dashboard.sidebar.team"),
  },
  {
    to: "/dashboard/activity",
    icon: HiOutlineClipboardDocumentList,
    label: t("dashboard.sidebar.activity"),
    roles: ["super_admin", "owner", "admin"],
  },
  {
    to: "/dashboard/settings",
    icon: HiOutlineCog6Tooth,
    label: t("dashboard.sidebar.settings"),
  },
];

export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation();
  const { profile, organization } = useAuth();
  const location = useLocation();
  const navItems = getNavItems(t);

  const planOrder = { starter: 0, growth: 1, business: 2 };
  const orgPlan = organization?.plan || "starter";
  const userRole = profile?.role;

  const isVisible = (item) => {
    if (item.plan && (planOrder[orgPlan] ?? 0) < (planOrder[item.plan] ?? 0)) {
      return false;
    }
    if (item.roles && (!userRole || !item.roles.includes(userRole))) {
      return false;
    }
    return true;
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--color-sidebar-bg)] border-r border-[var(--color-border)] transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4">
          <NavLink to="/" className="flex items-center gap-2">
            <Logo className="h-7 w-auto" />
            <span className="text-base font-bold text-[var(--color-text-primary)]">
              ChatDesk
            </span>
          </NavLink>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] lg:hidden"
            aria-label="Close sidebar"
          >
            <HiOutlineXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul className="flex flex-col gap-0.5">
            {navItems.filter(isVisible).map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[var(--color-sidebar-active)] text-[var(--color-sidebar-text-active)]"
                        : "text-[var(--color-sidebar-text)] hover:bg-[var(--color-sidebar-hover)]"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer - Org info */}
        {organization && (
          <div className="border-t border-[var(--color-border)] p-4">
            <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
              {organization.name}
            </p>
            <p className="text-xs capitalize text-[var(--color-text-tertiary)]">
              {orgPlan} plan
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
