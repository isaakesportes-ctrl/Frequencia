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
  // #region debug-point C:protected-route-init
  (()=>{
    const u = "http://127.0.0.1:7777/event";
    const s = "login-render-hooks-error";
    fetch(u, {
      method: "POST",
      body: JSON.stringify({
        sessionId: s,
        runId: "pre",
        hypothesisId: "C",
        location: "App.tsx:25",
        msg: "[DEBUG] ProtectedRoute rendered",
        data: { requiredRole },
        ts: Date.now()
      })
    }).catch(()=>{});
  })();
  // #endregion
  
  const { user, loading } = useAuth();

  if (loading) {
    // #region debug-point D:protected-route-loading
    (()=>{
      const u = "http://127.0.0.1:7777/event";
      const s = "login-render-hooks-error";
      fetch(u, {
        method: "POST",
        body: JSON.stringify({
          sessionId: s,
          runId: "pre",
          hypothesisId: "D",
          location: "App.tsx:46",
          msg: "[DEBUG] ProtectedRoute loading, returning null",
          data: {},
          ts: Date.now()
        })
      }).catch(()=>{});
    })();
    // #endregion
    return null;
  }

  if (!user) {
    // #region debug-point E:protected-route-no-user
    (()=>{
      const u = "http://127.0.0.1:7777/event";
      const s = "login-render-hooks-error";
      fetch(u, {
        method: "POST",
        body: JSON.stringify({
          sessionId: s,
          runId: "pre",
          hypothesisId: "E",
          location: "App.tsx:68",
          msg: "[DEBUG] ProtectedRoute no user, redirecting to /",
          data: {},
          ts: Date.now()
        })
      }).catch(()=>{});
    })();
    // #endregion
    window.location.href = "/";
    return null;
  }

  // #region debug-point F:protected-route-user
  (()=>{
    const u = "http://127.0.0.1:7777/event";
    const s = "login-render-hooks-error";
    fetch(u, {
      method: "POST",
      body: JSON.stringify({
        sessionId: s,
        runId: "pre",
        hypothesisId: "F",
        location: "App.tsx:91",
        msg: "[DEBUG] ProtectedRoute has user, checking role",
        data: { user, requiredRole },
        ts: Date.now()
      })
    }).catch(()=>{});
  })();
  // #endregion
  
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
