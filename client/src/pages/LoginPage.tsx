import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

  export default function LoginPage() {
  const { isAuthenticated, loading, user } = useAuth();
  const [, setLocation] = useLocation();

  // Se já estiver autenticado, redireciona para a página correta conforme o cargo
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const target = user.role === "admin" ? "/dashboard" : "/professores";
      setLocation(target);
    }
  }, [isAuthenticated, loading, user, setLocation]);

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Lado Esquerdo: Branding e Info */}
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
              "Acesso seguro e restrito"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-300" />
                <span className="text-blue-50/90">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lado Direito: Card de Login */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pt-8 text-center">
              <div className="md:hidden flex justify-center mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900">Seja bem-vindo!</CardTitle>
              <CardDescription className="text-slate-500">
                Entre com sua conta para acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8 space-y-6">
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400">Acesso Seguro</span>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                  asChild
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <a href="/auth-selection">
                    Entrar no Sistema
                  </a>
                </Button>
                
                <p className="text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5" />
                  Conexão criptografada de ponta a ponta
                </p>
              </div>

              <div className="pt-4 text-center">
                <Button variant="link" className="text-blue-600 font-medium" asChild>
                  <a href="/grade">Apenas visualizar grade pública</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
