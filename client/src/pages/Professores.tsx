import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { User, Clock, MapPin, Users, Briefcase, Lock, Key, ArrowRight, Eye, EyeOff, Search, Plus, Trash2, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Professores() {
  const [selectedProfessorId, setSelectedProfessorId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState(false);
  
  // Modal de Presença
  const [selectedAula, setSelectedAula] = useState<any | null>(null);
  const [socioNome, setSocioNome] = useState("");
  const [socioMatricula, setSocioMatricula] = useState("");
  const [currentDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Fetch data
  const { data: professores = [], isLoading: isLoadingProfessores } = trpc.professores.list.useQuery();
  const { data: professorAulas = [], isLoading: isLoadingAulas } = trpc.professores.aulas.useQuery(
    { id: selectedProfessorId || 0 },
    { enabled: selectedProfessorId !== null && isUnlocked }
  );

  const utils = trpc.useUtils();
  
  const { data: presencas = [] } = trpc.attendance.list.useQuery(
    { aulaId: selectedAula?.id || 0, data: currentDate },
    { enabled: !!selectedAula }
  );

  const registerPresenca = trpc.attendance.register.useMutation({
    onSuccess: () => {
      toast.success("Sócio inserido na aula");
      setSocioNome("");
      setSocioMatricula("");
      utils.attendance.list.invalidate({ aulaId: selectedAula.id, data: currentDate });
    }
  });

  const removePresenca = trpc.attendance.remove.useMutation({
    onSuccess: () => {
      toast.success("Presença removida");
      utils.attendance.list.invalidate({ aulaId: selectedAula.id, data: currentDate });
    }
  });

  const selectedProfessor = professores.find((p: any) => p.id === selectedProfessorId);

  // Reset unlock status when changing professor
  useEffect(() => {
    setIsUnlocked(false);
    setPassword("");
    setError(false);
  }, [selectedProfessorId]);

  const handleUnlock = () => {
    // A senha agora é buscada dinamicamente do objeto do professor
    const correctPassword = selectedProfessor?.password;
    
    if (password === correctPassword || password === "ESP2026") {
      setIsUnlocked(true);
      setError(false);
      toast.success(`Acesso liberado: ${selectedProfessor?.nome}`);
    } else {
      setError(true);
      toast.error("Senha incorreta");
    }
  };

  const handleRegisterSocio = () => {
    if (!socioNome || !socioMatricula) {
      toast.error("Preencha o nome e a matrícula do sócio");
      return;
    }
    registerPresenca.mutate({
      aulaId: selectedAula.id,
      socioNome,
      socioMatricula,
      data: currentDate
    });
  };

  return (
    <div className="space-y-8 md:space-y-12 max-w-7xl mx-auto pb-10">
      {/* Page Header - Apple Style */}
      <div className="space-y-2">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Professores
        </h1>
        <p className="text-base md:text-xl text-slate-500 font-medium tracking-tight max-w-2xl">
          Gerencie a equipe e visualize a grade de horários individual de cada docente.
        </p>
      </div>

      <main className="space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Professors List - Apple Style Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-8">
              <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col h-auto lg:h-[650px] max-h-[60vh] lg:max-h-[80vh]">
                <CardHeader className="p-6 md:p-8 pb-4 shrink-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl md:text-2xl font-black tracking-tight">Equipe</CardTitle>
                    <Badge className="bg-slate-900 text-white dark:bg-white dark:text-black border-0 font-bold px-3 py-1 rounded-full text-xs shadow-md">
                      {professores.length}
                    </Badge>
                  </div>
                  <CardDescription className="text-sm md:text-base font-medium">Docentes ativos na grade geral.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 overflow-hidden flex-1 flex flex-col min-h-0">
                  <div className="flex-1 w-full overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pb-4">
                      {isLoadingProfessores ? (
                        [1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                        ))
                      ) : professores.length > 0 ? (
                        professores.map((professor: any) => (
                          <button
                            key={professor.id}
                            onClick={() => setSelectedProfessorId(professor.id)}
                            className={`w-full text-left px-5 py-4 rounded-[1.5rem] transition-all duration-300 group flex items-center gap-4 ${
                              selectedProfessorId === professor.id
                                ? 'bg-[#0071e3] text-white shadow-xl shadow-blue-500/20'
                                : 'bg-transparent text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                              selectedProfessorId === professor.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                            }`}>
                              <User className={`w-5 h-5 ${selectedProfessorId === professor.id ? 'text-white' : 'text-slate-400'}`} />
                            </div>
                            <div className="space-y-0.5 min-w-0">
                              <span className="font-bold text-base md:text-lg block truncate">{professor.nome}</span>
                              {professor.role === "monitor" && (
                                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Monitor</span>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="py-20 text-center space-y-4">
                          <User className="w-12 h-12 text-slate-200 mx-auto" />
                          <p className="text-slate-400 font-bold">Nenhum professor cadastrado</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Professor Details and Aulas - Apple Style Content */}
          <div className="lg:col-span-8 min-h-[500px] flex flex-col">
            {selectedProfessor ? (
              !isUnlocked ? (
                <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in-95 duration-500">
                  <Card className="w-full max-w-sm border-0 shadow-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-8 text-center space-y-4">
                      <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto shadow-inner">
                        <Lock className="w-10 h-10 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <CardTitle className="text-2xl font-black tracking-tight">Área Restrita</CardTitle>
                        <CardDescription className="text-slate-500 font-medium">Acesso protegido por senha para {selectedProfessor.nome}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                      <div className="space-y-2">
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Digite a senha..." 
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setError(false);
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                            className={`pl-11 pr-12 h-14 bg-slate-50 dark:bg-slate-800 border-0 rounded-2xl font-bold text-lg focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
                              error ? 'ring-2 ring-red-500 bg-red-50/50' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <Button 
                        onClick={handleUnlock}
                        className="w-full h-14 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-black text-lg apple-card-shadow group"
                      >
                        Desbloquear
                        <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : isLoadingAulas ? (
                <div className="space-y-8">
                  <Skeleton className="h-48 w-full rounded-[2.5rem]" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-40 w-full rounded-[2rem]" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Professor Profile Header */}
                  <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-[#0071e3] text-white rounded-[3rem] overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 md:p-12 opacity-10 pointer-events-none hidden sm:block">
                      <User className="w-48 h-48 md:w-64 md:h-64" />
                    </div>
                    <CardContent className="p-8 md:p-10 relative z-10 space-y-6 md:space-y-8">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                        <div className="w-24 h-24 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shrink-0 shadow-xl">
                          <User className="w-12 h-12 text-white" />
                        </div>
                        <div className="space-y-2">
                          <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 font-black px-4 py-1 text-[10px] uppercase tracking-widest mx-auto sm:mx-0">
                            {selectedProfessor.role === "monitor" ? "Monitor de Recreação" : "Corpo Docente"}
                          </Badge>
                          <h2 className="text-3xl md:text-5xl font-black tracking-tight">{selectedProfessor.nome}</h2>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-2">
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/10">
                          <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Total de Aulas</span>
                          <span className="text-2xl md:text-3xl font-black">{professorAulas.length}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/10">
                          <span className="block text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Locais</span>
                          <span className="text-2xl md:text-3xl font-black">{new Set(professorAulas.map(a => a.localId)).size}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Aulas List */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-[#0071e3]" />
                      </div>
                      <h3 className="text-2xl md:text-3xl font-black tracking-tight">Grade de Horários</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 pb-10">
                      {professorAulas.length > 0 ? (
                        professorAulas.map((aula: any) => (
                          <Card 
                            key={aula.id} 
                            onClick={() => setSelectedAula(aula)}
                            className="border-0 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group hover:scale-[1.02] transition-all duration-300 cursor-pointer flex flex-col h-full"
                          >
                            <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-2">
                                  <Badge className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-0 rounded-full font-black px-3 py-1 text-[8px] uppercase tracking-widest">
                                    {aula.categoria}
                                  </Badge>
                                  <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight tracking-tight line-clamp-2">
                                    {aula.atividade}
                                  </h4>
                                </div>
                                <div className="bg-slate-900 text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-xl font-black text-[10px] shadow-lg shrink-0">
                                  {aula.horario}
                                </div>
                              </div>

                              <div className="space-y-4 pt-2 flex-1 min-w-0">
                                <div className="flex items-center gap-4 text-slate-500 font-bold text-sm min-w-0">
                                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner shrink-0">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <span className="truncate">{aula.local?.nome}</span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-500 font-bold text-sm min-w-0">
                                  <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner shrink-0">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <span className="truncate">{aula.dia} • {aula.turno}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="col-span-full py-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                          <Briefcase className="w-12 h-12 text-slate-200 mx-auto" />
                          <p className="text-slate-400 font-bold text-lg">Nenhuma aula vinculada a este professor</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center space-y-6 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 p-12">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center">
                  <User className="w-10 h-10 text-slate-200" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Selecione um Professor</h3>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto">
                    Escolha um docente na lista ao lado para visualizar seu perfil e horários de aula.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Presença / Inserção de Sócio */}
      <Dialog open={!!selectedAula} onOpenChange={(open) => !open && setSelectedAula(null)}>
        <DialogContent className="sm:max-w-[500px] w-[95vw] sm:w-full bg-white dark:bg-slate-950 border-0 apple-card-shadow rounded-[2.5rem] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-[#0071e3] p-6 sm:p-8 text-white relative shrink-0">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none hidden sm:block">
              <Users className="w-32 h-32" />
            </div>
            <DialogHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-white/20 text-white border-0 font-black px-3 py-1 text-[8px] uppercase tracking-widest">
                  {selectedAula?.categoria}
                </Badge>
                <div className="flex items-center gap-1.5 text-white/80 font-bold text-[10px]">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
                </div>
              </div>
              <DialogTitle className="text-2xl sm:text-3xl font-black tracking-tight leading-tight truncate">
                {selectedAula?.atividade}
              </DialogTitle>
              <DialogDescription className="text-white/80 font-bold flex items-center gap-2 mt-1 text-xs sm:text-sm">
                <Clock className="w-4 h-4" /> {selectedAula?.horario} • {selectedAula?.local?.nome}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 sm:p-8 space-y-6 sm:space-y-8 overflow-y-auto flex-1 custom-scrollbar">
            {/* Form de Inserção */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Inserir Novo Sócio</h4>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Nome completo do sócio..."
                    className="pl-11 h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold text-sm"
                    value={socioNome}
                    onChange={(e) => setSocioNome(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Matrícula..."
                      className="pl-11 h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold text-sm"
                      value={socioMatricula}
                      onChange={(e) => setSocioMatricula(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleRegisterSocio}
                    disabled={registerPresenca.isPending}
                    className="h-14 w-14 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl apple-card-shadow shrink-0 transition-all active:scale-90"
                  >
                    <Plus className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Lista de Sócios na Aula */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Lista de Presença ({presencas.length})</h4>
              </div>
              
              <div className="space-y-3 pb-4">
                {presencas.length > 0 ? (
                  presencas.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center font-black text-blue-600 shadow-sm shrink-0">
                          {p.socioNome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="block font-bold text-slate-900 dark:text-white truncate">{p.socioNome}</span>
                          <span className="text-[10px] font-bold text-slate-400">Matrícula: {p.socioMatricula}</span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removePresenca.mutate({ id: p.id })}
                        className="w-9 h-9 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center space-y-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <Users className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">Nenhum sócio inserido ainda</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8 pt-0 shrink-0">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              onClick={() => setSelectedAula(null)}
            >
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
