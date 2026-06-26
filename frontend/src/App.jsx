import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import AuthenticatedApp from "./AuthenticatedApp.jsx";
import PageLoader from "./components/common/PageLoader.jsx";

function AppGate() {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader pageName="Dashboard" />;
  if (!user) return <LoginPage />;
  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
