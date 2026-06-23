import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle2, Key, Lock, User, Briefcase } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type FormMode = "login" | "register";

export default function LoginPage() {
  const { isAuthenticated, loading, login, requestAccess, requestAccessLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [formMode, setFormMode] = useState<FormMode>("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "monitor" | "aprendiz">("user");
  const [func, setFunc] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Se já estiver autenticado, redireciona para o dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    try {
      await login(name, password);
      toast.success("Login realizado com sucesso!");
    } catch (error) {
      toast.error("Falha no login. Verifique nome e senha.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password || !confirmPassword || !func) {
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    try {
      await requestAccess(name, password, role, func);
      setShowSuccess(true);
      toast.success("Solicitação de acesso enviada com sucesso! Aguarde aprovação.");
    } catch (error) {
      toast.error("Falha ao enviar solicitação de acesso.");
    }
  };

  if (loading) {
    return null;
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm text-center">
          <CardHeader className="pt-12 pb-8">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Solicitação Enviada!</CardTitle>
            <CardDescription className="text-slate-500 text-base">
              Sua solicitação de acesso foi enviada com sucesso. Aguarde a aprovação de um administrador.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12">
            <Button
              onClick={() => {
                setShowSuccess(false);
                setFormMode("login");
              }}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Voltar para o Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="text-white space-y-6 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Academia Master</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight">
              Gerencie suas aulas com <span className="text-blue-300">sofisticação</span> e clareza.
            </h2>
            <p className="text-lg text-blue-100/80">
              Acesse a grade completa, gerencie professores e acompanhe o desempenho da sua academia em um só lugar.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            {[
              "Visualização de grade em tempo real",
              "Gestão simplificada de professores",
              "Dashboard analítico completo",
              "Acesso seguro e restrito",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-300" />
                <span className="text-blue-50/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pt-8 text-center">
              <div className="md:hidden flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {formMode === "login" ? "Seja bem-vindo!" : "Crie sua conta"}
              </CardTitle>
              <CardDescription className="text-slate-500">
                {formMode === "login"
                  ? "Entre com sua conta"
                  : "Solicite acesso ao sistema"}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 space-y-6">
              <form onSubmit={formMode === "login" ? handleLogin : handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome de Usuário</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={formMode === "login" ? "Seu nome de usuário" : "Seu nome completo"}
                      className="h-12 pl-12"
                    />
                  </div>
                </div>

                {formMode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="function">Função</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="function"
                        type="text"
                        value={func}
                        onChange={(e) => setFunc(e.target.value)}
                        placeholder="Ex: Professor de Natação"
                        className="h-12 pl-12"
                      />
                    </div>
                  </div>
                )}

                {formMode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Tipo de Acesso</Label>
                    <Select value={role} onValueChange={(val: any) => setRole(val)}>
                      <SelectTrigger className="h-12 pl-4">
                        <SelectValue placeholder="Selecione o tipo de acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aprendiz">Aprendiz</SelectItem>
                        <SelectItem value="user">Professor</SelectItem>
                        <SelectItem value="monitor">Monitor de Recreação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-12 pl-12"
                    />
                  </div>
                </div>

                {formMode === "register" && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-12 pl-12"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={requestAccessLoading || loading}
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {requestAccessLoading || loading
                    ? "Carregando..."
                    : formMode === "login"
                    ? "Entrar no Sistema"
                    : "Solicitar Acesso"}
                </Button>
              </form>

              <div className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  onClick={() =>
                    setFormMode(formMode === "login" ? "register" : "login")
                  }
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
                >
                  {formMode === "login"
                    ? "Não tem conta? Cadastre-se"
                    : "Já tem conta? Voltar para login"}
                </Button>
              </div>

              <p className="text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                Conexão criptografada de ponta a ponta
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
