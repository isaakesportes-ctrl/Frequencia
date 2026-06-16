import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Lock, ArrowLeft, Calendar, ShieldCheck, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AuthSelectionPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRequestAccess, setShowRequestAccess] = useState(false);
  const [requestedAccess, setRequestedAccess] = useState(false);
  
  // Campos para solicitação
  const [requestName, setRequestName] = useState("");
  const [requestPassword, setRequestPassword] = useState("");
  const [requestRole, setRequestRole] = useState<"user" | "admin" | "monitor">("user");
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);

  const loginMutation = trpc.auth.login.useMutation();
  const requestAccessMutation = trpc.auth.requestAccess.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await loginMutation.mutateAsync({ name, password });
      
      if (result.success) {
        toast.success("Login realizado com sucesso!");
        const target = (result.user?.role === "admin") ? "/dashboard" : "/professores";
        setLocation(target);
      } else {
        toast.error(result.error || "Erro ao fazer login");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestName || !requestPassword || selectedFunctions.length === 0) {
      toast.error("Preencha todos os campos e selecione pelo menos uma função");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await requestAccessMutation.mutateAsync({ 
        name: requestName, 
        password: requestPassword,
        role: requestRole,
        function: selectedFunctions.join(", ")
      });
      
      if (result.success) {
        setRequestedAccess(true);
        toast.success("Solicitação enviada! Aguardando aprovação do Departamento de Esportes.");
      } else {
        toast.error("Erro ao enviar solicitação");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  const resetRequestForm = () => {
    setRequestName("");
    setRequestPassword("");
    setRequestRole("user");
    setSelectedFunctions([]);
    setShowRequestAccess(false);
    setRequestedAccess(false);
  };

  const toggleFunction = (func: string) => {
    if (selectedFunctions.includes(func)) {
      setSelectedFunctions(selectedFunctions.filter(f => f !== func));
    } else {
      setSelectedFunctions([...selectedFunctions, func]);
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
          <CardTitle className="text-2xl font-bold">
            {requestedAccess ? "Solicitação Enviada" : (showRequestAccess ? "Solicitar Acesso" : "Entrar no Sistema")}
          </CardTitle>
          <CardDescription>
            {requestedAccess 
              ? "Aguardando aprovação do Departamento de Esportes" 
              : (showRequestAccess 
                ? "Preencha seus dados para solicitar acesso" 
                : "Acesse com seu nome e senha")}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pb-8">
          {requestedAccess ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">
                Sua solicitação foi enviada com sucesso!
              </p>
              <p className="text-sm text-slate-500 mt-2">
                O Departamento de Esportes irá analisar e aprovar seu acesso em breve.
              </p>
              <Button 
                variant="ghost" 
                onClick={resetRequestForm}
                className="mt-6"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> 
                Voltar ao login
              </Button>
            </div>
          ) : showRequestAccess ? (
            <form onSubmit={handleRequestAccess} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="requestName">Seu Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="requestName"
                    type="text"
                    placeholder="Ex: João Silva"
                    className="pl-10 h-12"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestPassword">Crie sua Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="requestPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite uma senha segura"
                    className="pl-10 pr-12 h-12"
                    value={requestPassword}
                    onChange={(e) => setRequestPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="requestRole">Cargo</Label>
                <Select 
                  value={requestRole} 
                  onValueChange={(value: "user" | "admin" | "monitor") => setRequestRole(value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Professor</SelectItem>
                    <SelectItem value="monitor">Monitor de Recreação</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>O que você vai fazer?</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <Checkbox
                      id="function-aula"
                      checked={selectedFunctions.includes("Aula")}
                      onCheckedChange={() => toggleFunction("Aula")}
                    />
                    <Label htmlFor="function-aula" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Aula
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <Checkbox
                      id="function-frequencia"
                      checked={selectedFunctions.includes("Frequência")}
                      onCheckedChange={() => toggleFunction("Frequência")}
                    />
                    <Label htmlFor="function-frequencia" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                      Frequência
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  type="submit"
                  className="h-12 bg-blue-600 hover:bg-blue-700 font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Solicitação"}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={resetRequestForm}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> 
                  Voltar ao login
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Ex: Departamento de Esportes"
                    className="pl-10 h-12"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha de Acesso</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    className="pl-10 pr-12 h-12"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  type="submit"
                  className="h-12 bg-blue-600 hover:bg-blue-700 font-bold"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
                
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200 dark:border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-slate-950 px-2 text-slate-400">
                      ou
                    </span>
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  onClick={() => setShowRequestAccess(true)}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" /> 
                  Solicitar acesso ao sistema
                </Button>
                
                <Button variant="ghost" onClick={() => setLocation("/")} className="mt-2">
                  <ArrowLeft className="w-4 h-4 mr-2" /> 
                  Voltar
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
