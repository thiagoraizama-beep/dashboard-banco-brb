import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import AuthenticatedApp from "./AuthenticatedApp.jsx";
import PageLoader from "./components/common/PageLoader.jsx";

function AppGate() {
  const { user, loading } = useAuth();

  // Link de recuperacao de senha vindo por e-mail: /redefinir-senha?token=...
  // Funciona independente de estar logado ou nao, pois so exige o token valido.
  if (window.location.pathname === "/redefinir-senha") {
    return <ResetPasswordPage />;
  }

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
