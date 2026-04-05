import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import LoginPage from "./components/LoginPage";
import ProfileSetup from "./components/ProfileSetup";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetCallerUserProfile, useIsCallerAdmin } from "./hooks/useQueries";
import AdminAllSubmissions from "./pages/AdminAllSubmissions";
import AdminAllUsers from "./pages/AdminAllUsers";
import AdminDashboard from "./pages/AdminDashboard";
import GroupsPage from "./pages/GroupsPage";
import MySubmissions from "./pages/MySubmissions";
import UploadFiles from "./pages/UploadFiles";
import UserDashboard from "./pages/UserDashboard";

type Page =
  | "dashboard"
  | "upload"
  | "my-submissions"
  | "groups"
  | "admin-submissions"
  | "admin-users";

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground">
          Loading Office Portal...
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [localGroupCount, setLocalGroupCount] = useState(0);

  const {
    data: userProfile,
    isLoading: profileLoading,
    isFetched: profileFetched,
  } = useGetCallerUserProfile();

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();

  useEffect(() => {
    if (!identity) return;
    const principalStr = identity.getPrincipal().toString();
    const key = `office_portal_groups_${principalStr}`;
    try {
      const stored = JSON.parse(localStorage.getItem(key) ?? "[]");
      setLocalGroupCount(stored.length);
    } catch {
      setLocalGroupCount(0);
    }
  }, [identity]);

  if (isInitializing) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  if (profileLoading || !profileFetched) {
    return <LoadingScreen />;
  }

  const showProfileSetup =
    isAuthenticated &&
    !profileLoading &&
    profileFetched &&
    userProfile === null;
  if (showProfileSetup) {
    return (
      <>
        <ProfileSetup onComplete={() => {}} />
        <Toaster />
      </>
    );
  }

  if (adminLoading) {
    return <LoadingScreen />;
  }

  const adminMode = isAdmin === true;

  const renderPage = () => {
    if (adminMode) {
      switch (currentPage) {
        case "admin-submissions":
          return <AdminAllSubmissions />;
        case "admin-users":
          return <AdminAllUsers />;
        case "groups":
          return <GroupsPage />;
        default:
          return (
            <AdminDashboard
              profile={userProfile ?? null}
              onNavigate={setCurrentPage}
            />
          );
      }
    }
    switch (currentPage) {
      case "upload":
        return <UploadFiles />;
      case "my-submissions":
        return <MySubmissions />;
      case "groups":
        return <GroupsPage />;
      default:
        return (
          <UserDashboard
            profile={userProfile ?? null}
            onNavigate={setCurrentPage}
            groupCount={localGroupCount}
          />
        );
    }
  };

  return (
    <>
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        isAdmin={adminMode}
        profile={userProfile ?? null}
      >
        {renderPage()}
      </Layout>
      <Toaster />
    </>
  );
}
