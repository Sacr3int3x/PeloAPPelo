import React from "react";

import { HashRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

// Components
import Header from "./components/Header/Header";
import BottomNav from "./components/BottomNav/BottomNav";
import PageTransition from "./components/PageTransition/PageTransition";

// Pages
import HomePage from "./pages/HomePage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import ItemPage from "./pages/ItemPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import PublishPage from "./pages/PublishPage";
import FavsPage from "./pages/FavsPage";
import InboxPage from "./pages/InboxPage";
import ProfileListingsPage from "./pages/ProfileListingsPage";
import SwapPage from "./pages/SwapPage";

// Context Providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DataProvider } from "./context/DataContext";
import { MessageProvider } from "./context/MessageContext";


// Auth Guard Component
function RequireAuth({ children }) {
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

  return children;
}

// App Shell
function Shell() {
  return (
    <>
      <Header />
      <PageTransition />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/item/:id" element={<ItemPage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchPage />} />
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
          path="/swap/:id"
          element={
            <RequireAuth>
              <SwapPage />
            </RequireAuth>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <BottomNav />
    </>
  );
}

// App Root
export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <DataProvider>
          <MessageProvider>
            <Shell />
          </MessageProvider>
        </DataProvider>
      </AuthProvider>
    </HashRouter>
  );
}
