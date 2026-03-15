import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "@/components/layout/PublicLayout";
import ScrollToHash from "@/components/ui/ScrollToHash";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ProtectedRoute from "@/router/ProtectedRoute";
import PublicRoute from "@/router/PublicRoute";
import PlanGate from "@/router/PlanGate";
import RoleGate from "@/router/RoleGate";

// Public pages
import Home from "@/pages/public/Home";
import NotFound from "@/pages/public/NotFound";

// Lazy-loaded pages
const Contact = lazy(() => import("@/pages/public/Contact"));
const Blog = lazy(() => import("@/pages/public/Blog"));
const BlogPost = lazy(() => import("@/pages/public/BlogPost"));
const Privacy = lazy(() => import("@/pages/public/Privacy"));
const Terms = lazy(() => import("@/pages/public/Terms"));
const SignIn = lazy(() => import("@/pages/auth/SignIn"));
const SignUp = lazy(() => import("@/pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("@/pages/auth/ForgotPassword"));
const AcceptInvite = lazy(() => import("@/pages/auth/AcceptInvite"));
const Overview = lazy(() => import("@/pages/dashboard/Overview"));
const Conversations = lazy(() => import("@/pages/dashboard/Conversations"));
const ConversationDetail = lazy(
  () => import("@/pages/dashboard/ConversationDetail"),
);
const Contacts = lazy(() => import("@/pages/dashboard/Contacts"));
const ContactDetail = lazy(() => import("@/pages/dashboard/ContactDetail"));
const Pipeline = lazy(() => import("@/pages/dashboard/Pipeline"));
const WhatsApp = lazy(() => import("@/pages/dashboard/WhatsApp"));
const AIAgents = lazy(() => import("@/pages/dashboard/AIAgents"));
const AutoReplies = lazy(() => import("@/pages/dashboard/AutoReplies"));
const Broadcasts = lazy(() => import("@/pages/dashboard/Broadcasts"));
const Analytics = lazy(() => import("@/pages/dashboard/Analytics"));
const QuickReplies = lazy(() => import("@/pages/dashboard/QuickReplies"));
const Team = lazy(() => import("@/pages/dashboard/Team"));
const Activity = lazy(() => import("@/pages/dashboard/Activity"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const AdminPanel = lazy(() => import("@/pages/dashboard/AdminPanel"));
const AdminOrganizations = lazy(
  () => import("@/pages/dashboard/AdminOrganizations"),
);
const AdminInvitations = lazy(
  () => import("@/pages/dashboard/AdminInvitations"),
);
const AdminUsers = lazy(() => import("@/pages/dashboard/AdminUsers"));
const AdminOrgDetail = lazy(() => import("@/pages/dashboard/AdminOrgDetail"));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
    </div>
  );
}

function S({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        {/* Public pages with Navbar + Footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/contact"
            element={
              <S>
                <Contact />
              </S>
            }
          />
          <Route
            path="/guides"
            element={
              <S>
                <Blog />
              </S>
            }
          />
          <Route
            path="/guides/:slug"
            element={
              <S>
                <BlogPost />
              </S>
            }
          />
          <Route
            path="/privacy"
            element={
              <S>
                <Privacy />
              </S>
            }
          />
          <Route
            path="/terms"
            element={
              <S>
                <Terms />
              </S>
            }
          />

          {/* Auth pages — redirect to dashboard if signed in */}
          <Route element={<PublicRoute />}>
            <Route
              path="/signin"
              element={
                <S>
                  <SignIn />
                </S>
              }
            />
            <Route
              path="/signup"
              element={
                <S>
                  <SignUp />
                </S>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <S>
                  <ForgotPassword />
                </S>
              }
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Invitation accept — standalone page (no PublicLayout) */}
        <Route
          path="/invite/:token"
          element={
            <S>
              <AcceptInvite />
            </S>
          }
        />

        {/* Dashboard — protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <S>
                  <Overview />
                </S>
              }
            />
            <Route
              path="/dashboard/conversations"
              element={
                <S>
                  <Conversations />
                </S>
              }
            />
            <Route
              path="/dashboard/conversations/:id"
              element={
                <S>
                  <ConversationDetail />
                </S>
              }
            />
            <Route
              path="/dashboard/contacts"
              element={
                <S>
                  <Contacts />
                </S>
              }
            />
            <Route
              path="/dashboard/contacts/:id"
              element={
                <S>
                  <ContactDetail />
                </S>
              }
            />
            <Route
              path="/dashboard/pipeline"
              element={
                <S>
                  <Pipeline />
                </S>
              }
            />
            <Route
              path="/dashboard/whatsapp"
              element={
                <S>
                  <WhatsApp />
                </S>
              }
            />
            <Route
              path="/dashboard/ai-agents"
              element={
                <S>
                  <AIAgents />
                </S>
              }
            />
            <Route
              path="/dashboard/auto-replies"
              element={
                <S>
                  <AutoReplies />
                </S>
              }
            />
            <Route
              path="/dashboard/broadcasts"
              element={
                <S>
                  <PlanGate plan="growth">
                    <Broadcasts />
                  </PlanGate>
                </S>
              }
            />
            <Route
              path="/dashboard/analytics"
              element={
                <S>
                  <PlanGate plan="growth">
                    <Analytics />
                  </PlanGate>
                </S>
              }
            />
            <Route
              path="/dashboard/quick-replies"
              element={
                <S>
                  <QuickReplies />
                </S>
              }
            />
            <Route
              path="/dashboard/team"
              element={
                <S>
                  <Team />
                </S>
              }
            />
            <Route
              path="/dashboard/activity"
              element={
                <S>
                  <RoleGate roles={["super_admin", "owner", "admin"]}>
                    <Activity />
                  </RoleGate>
                </S>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <S>
                  <Settings />
                </S>
              }
            />

            {/* Super-admin panel */}
            <Route
              path="/dashboard/admin"
              element={
                <S>
                  <RoleGate roles={["super_admin"]}>
                    <AdminPanel />
                  </RoleGate>
                </S>
              }
            >
              <Route
                path="organizations"
                element={
                  <S>
                    <AdminOrganizations />
                  </S>
                }
              />
              <Route
                path="organizations/:id"
                element={
                  <S>
                    <AdminOrgDetail />
                  </S>
                }
              />
              <Route
                path="users"
                element={
                  <S>
                    <AdminUsers />
                  </S>
                }
              />
              <Route
                path="invitations"
                element={
                  <S>
                    <AdminInvitations />
                  </S>
                }
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
