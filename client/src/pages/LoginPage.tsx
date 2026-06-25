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
import { motion, AnimatePresence } from "framer-motion";

type FormMode = "login" | "register";

export default function LoginPage() {
  const { isAuthenticated, loading, login, requestAccess, requestAccessLoading } = useAuth();
  const [, setLocation] = useLocation();

  const [formMode, setFormMode] = useState<FormMode>("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin" | "monitor" | "aprendiz" | "corpo_docente">("user");
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#eff4ff] flex items-center justify-center p-4"
      >
        <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm text-center">
          <CardHeader className="pt-12 pb-8">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
              className="w-20 h-20 rounded-full bg-[#6cf8bb]/30 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-[#006c49]" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-foreground">Solicitação Enviada!</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
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
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Voltar para o Login
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f9ff] to-[#eff4ff] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="text-foreground space-y-6 hidden md:block"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Calendar className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Agenda Master</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight">
              Gerencie suas aulas com <span className="text-[#006c49]">sofisticação</span> e clareza.
            </h2>
            <p className="text-lg text-muted-foreground">
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
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5 text-[#006c49]" />
                <span className="text-foreground/80">{feature}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <div className="flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="w-full max-w-md border-0 shadow-2xl bg-card/95 backdrop-blur-sm">
              <CardHeader className="space-y-1 pt-8 text-center">
                <div className="md:hidden flex justify-center mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {formMode === "login" ? "Seja bem-vindo!" : "Crie sua conta"}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {formMode === "login"
                    ? "Entre com sua conta"
                    : "Solicite acesso ao sistema"}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8 space-y-6">
                <AnimatePresence mode="wait">
                  <motion.form
                    key={formMode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={formMode === "login" ? handleLogin : handleRegister}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome de Usuário</Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 overflow-hidden"
                      >
                        <Label htmlFor="function">Função</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="function"
                            type="text"
                            value={func}
                            onChange={(e) => setFunc(e.target.value)}
                            placeholder="Ex: Professor de Natação"
                            className="h-12 pl-12"
                          />
                        </div>
                      </motion.div>
                    )}

                    {formMode === "register" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 overflow-hidden"
                      >
                        <Label htmlFor="role">Tipo de Acesso</Label>
                        <Select value={role} onValueChange={(val: any) => setRole(val)}>
                          <SelectTrigger className="h-12 pl-4">
                            <SelectValue placeholder="Selecione o tipo de acesso" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aprendiz">Aprendiz</SelectItem>
                            <SelectItem value="corpo_docente">Corpo Docente</SelectItem>
                            <SelectItem value="user">Professor</SelectItem>
                            <SelectItem value="monitor">Monitor de Recreação</SelectItem>
                          </SelectContent>
                        </Select>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
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
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2 overflow-hidden"
                      >
                        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 pl-12"
                          />
                        </div>
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      disabled={requestAccessLoading || loading}
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      {requestAccessLoading || loading
                        ? "Carregando..."
                        : formMode === "login"
                        ? "Entrar no Sistema"
                        : "Solicitar Acesso"}
                    </Button>
                  </motion.form>
                </AnimatePresence>

                <div className="flex items-center justify-center">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setFormMode(formMode === "login" ? "register" : "login")
                    }
                    className="text-primary hover:text-primary/80 hover:bg-muted font-semibold"
                  >
                    {formMode === "login"
                      ? "Não tem conta? Cadastre-se"
                      : "Já tem conta? Voltar para login"}
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Conexão criptografada de ponta a ponta
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
