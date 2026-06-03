import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock, ArrowLeft, Calendar, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";

const MOCK_USERS = [
  { id: "esportes", name: "Departamento de Esportes", role: "MASTER", icon: ShieldCheck },
  { id: "professor", name: "Corpo Docente", role: "PROFESSOR", icon: User },
];

export default function AuthSelectionPage() {
  const [, setLocation] = useLocation();
  const [selectedUser, setSelectedUser] = useState<typeof MOCK_USERS[0] | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    // Se for professor, entra direto sem senha
    if (selectedUser?.role === "PROFESSOR") {
      const params = new URLSearchParams();
      params.set("name", selectedUser.name);
      params.set("role", "user");
      window.location.href = `/api/auth/mock?${params.toString()}`;
      return;
    }

    // Se for admin, exige a senha
    if (password === "ESP2026") {
      const params = new URLSearchParams();
      params.set("name", selectedUser?.name || "");
      const technicalRole = selectedUser?.role === "MASTER" ? "admin" : "user";
      params.set("role", technicalRole);
      window.location.href = `/api/auth/mock?${params.toString()}`;
    } else {
      setError("Senha incorreta. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-2xl bg-white dark:bg-slate-950">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Calendar className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Identificação</CardTitle>
          <CardDescription>
            {selectedUser 
              ? selectedUser.role === "PROFESSOR" 
                ? `Acessando como ${selectedUser.name}...`
                : `Acessando como ${selectedUser.name}`
              : "Selecione seu perfil de acesso"}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {!selectedUser ? (
            <div className="grid grid-cols-1 gap-4">
              {MOCK_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    if (u.role === "PROFESSOR") {
                      // Login direto para professor
                      const params = new URLSearchParams();
                      params.set("name", u.name);
                      params.set("role", "user");
                      window.location.href = `/api/auth/mock?${params.toString()}`;
                    } else {
                      setSelectedUser(u);
                    }
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                    <u.icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">{u.role}</p>
                  </div>
                </button>
              ))}
              
              <Button variant="ghost" onClick={() => setLocation("/")} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="password">Senha de Acesso</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-12 h-12"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={handleLogin}
                  className="h-12 bg-blue-600 hover:bg-blue-700 font-bold"
                >
                  Confirmar Entrada
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setSelectedUser(null);
                    setPassword("");
                    setError("");
                  }}
                >
                  Trocar Usuário
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
