import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import Professores from "./pages/Professores";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import UsersPage from "./pages/Users";
import FrequenciaPage from "./pages/FrequenciaPage";
import DashboardLayout from "./components/DashboardLayout";
import AuthSelectionPage from "./pages/AuthSelectionPage";
import { useAuth } from "./_core/hooks/useAuth";

function ProtectedRoute({ 
  component: Component, 
  requiredRole 
}: { 
  component: React.ComponentType; 
  requiredRole?: "admin" | "user"; 
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    window.location.href = "/";
    return null;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
            <p className="text-slate-500">Você não tem permissão para acessar esta área.</p>
            <Button onClick={() => window.location.href = "/grade"}>Voltar para Grade</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={LoginPage} />
      <Route path="/auth-selection" component={AuthSelectionPage} />
      <Route path="/grade">
        <ProtectedRoute component={Home} />
      </Route>
      <Route path="/frequencia">
        <ProtectedRoute component={FrequenciaPage} />
      </Route>
      <Route path="/admin">
        <ProtectedRoute component={AdminPanel} requiredRole="admin" />
      </Route>
      <Route path="/professores">
        <ProtectedRoute component={Professores} />
      </Route>
      <Route path="/usuarios">
        <ProtectedRoute component={UsersPage} requiredRole="admin" />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} requiredRole="admin" />
      </Route>
      <Route path="/404" component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster position="top-right" className="!z-[100]" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
