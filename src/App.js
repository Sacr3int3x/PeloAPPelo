import React from "react";
import {
  HashRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Components that should load immediately
import Header from "./components/Header/Header";
import BottomNav from "./components/BottomNav/BottomNav";
import ScrollToTop from "./components/ScrollToTop";
import { useData } from "./context/DataContext";
import LoadingPage from "./pages/LoadingPage";
import "./styles/theme.css";
import "./styles/animations.css";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { MessageProvider } from "./context/MessageContext";
import { NotificationProvider } from "./context/NotificationContext";

// Lazy loaded pages
const HomePage = lazy(() => import("./pages/HomePage"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ItemPage = lazy(() => import("./pages/ItemPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const BlockedUsersPage = lazy(() => import("./pages/BlockedUsersPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const BillingDetails = lazy(() => import("./pages/BillingDetails"));
const PublishPage = lazy(() => import("./pages/PublishPage"));
const FavsPage = lazy(() => import("./pages/FavsPage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const ProfileListingsPage = lazy(() => import("./pages/ProfileListingsPage"));
const SwapPage = lazy(() => import("./pages/SwapPage"));
const SwapDetailPage = lazy(() => import("./pages/SwapDetailPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminUserProfilePage = lazy(() => import("./pages/AdminUserProfilePage"));
const EditListingPage = lazy(() => import("./pages/EditListingPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const PendingRatingsPage = lazy(() => import("./pages/PendingRatingsPage"));
const UserReputationPage = lazy(() => import("./pages/UserReputationPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));

// Auth Guard Component
function RequireAuth({ children, admin }) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) {
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`}
        replace
      />
    );
  }

  if (admin && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Animated Routes Component
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{
          duration: 0.3,
          ease: [0.25, 0.46, 0.45, 0.94], // Cubic bezier similar to iOS
        }}
        style={{ width: "100%", minHeight: "100vh" }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/item/:id" element={<ItemPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Rutas protegidas */}
          <Route
            path="/favs"
            element={
              <RequireAuth>
                <FavsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/publish"
            element={
              <RequireAuth>
                <PublishPage />
              </RequireAuth>
            }
          />
          <Route
            path="/inbox"
            element={
              <RequireAuth>
                <InboxPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile/listings"
            element={
              <RequireAuth>
                <ProfileListingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile/pending-ratings"
            element={
              <RequireAuth>
                <PendingRatingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/billing"
            element={
              <RequireAuth>
                <BillingDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/swap/:id"
            element={
              <RequireAuth>
                <SwapDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/propose-swap/:id"
            element={
              <RequireAuth>
                <SwapPage />
              </RequireAuth>
            }
          />
          <Route
            path="/profile/blocked-users"
            element={
              <RequireAuth>
                <BlockedUsersPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth admin>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/user/:id"
            element={
              <RequireAuth admin>
                <AdminUserProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="/publicar/:id"
            element={
              <RequireAuth>
                <EditListingPage />
              </RequireAuth>
            }
          />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route
            path="/user/:userId/reputation"
            element={<UserReputationPage />}
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <NotificationsPage />
              </RequireAuth>
            }
          />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
} // App Shell
function Shell() {
  const { isDesktop } = useData();
  return (
    <>
      <Header showNav={isDesktop} />
      <div className={isDesktop ? "desktop-container" : ""}>
        <Suspense fallback={<LoadingPage />}>
          <AnimatedRoutes />
        </Suspense>
      </div>
      {!isDesktop && <BottomNav />}
    </>
  );
}

// App Root
export default function App() {
  return (
    <HashRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ScrollToTop />
      <AuthProvider>
        <DataProvider>
          <MessageProvider>
            <NotificationProvider>
              <Shell />
              <ToastContainer
                position="top-right"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
            </NotificationProvider>
          </MessageProvider>
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
}
