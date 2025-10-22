import React from "react";
import {
  HashRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";

// Components that should load immediately
import Header from "./components/Header/Header";
import BottomNav from "./components/BottomNav/BottomNav";
import PageTransition from "./components/PageTransition/PageTransition";
import LoadingPage from "./pages/LoadingPage";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider, useData } from "./context/DataContext";
import { MessageProvider } from "./context/MessageContext";
import { BlockProvider } from "./context/BlockContext";

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
const ReputationDetails = lazy(() => import("./pages/ReputationDetails"));
const PublishPage = lazy(() => import("./pages/PublishPage"));
const FavsPage = lazy(() => import("./pages/FavsPage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const ProfileListingsPage = lazy(() => import("./pages/ProfileListingsPage"));
const SwapPage = lazy(() => import("./pages/SwapPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));

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

// App Shell
function Shell() {
  const data = useData();
  const auth = useAuth();
  const user = auth?.user;

  return (
    <>
      <Header />
      <PageTransition />
      <Suspense fallback={<LoadingPage />}>
        <Routes>
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
            path="/profile/billing-details"
            element={
              <RequireAuth>
                <BillingDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/profile/reputation-details"
            element={
              <RequireAuth>
                <ReputationDetails />
              </RequireAuth>
            }
          />
          <Route
            path="/swap/:id"
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
        </Routes>
      </Suspense>
      <BottomNav />
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
      <AuthProvider>
        <BlockProvider>
          <DataProvider>
            <MessageProvider>
              <Shell />
            </MessageProvider>
          </DataProvider>
        </BlockProvider>
      </AuthProvider>
    </HashRouter>
  );
}
