import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  User, 
  Edit, 
  LayoutGrid,
  Users,
  MoveHorizontal,
  Layers,
  CalendarDays,
  Clock,
  Trash2,
  Check,
  X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const MODALITY_GROUPS: Record<string, string[]> = {
  "Esportes Coletivos": ["Futebol", "Basquete", "Vôlei", "Handebol", "Futsal"],
  "Aquáticos": ["Natação", "Hidroginástica", "Piscina Livre", "Polo Aquático"],
  "Bem-estar & Fitness": ["Yoga", "Pilates", "Alongamento", "Musculação", "Funcional", "Zumba"],
  "Artes Marciais": ["Judô", "Karatê", "Jiu-Jitsu", "Boxe", "Muay Thai"],
  "Raquete": ["Tênis", "Beach Tennis", "Padel", "Ping Pong"]
};

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function AdminPanel() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeGroup, setActiveGroup] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<any | null>(null);

  const utils = trpc.useUtils();
  const { data: aulas = [], isLoading } = trpc.aulas.list.useQuery({});
  const { data: professores = [] } = trpc.professores.list.useQuery();
  const { data: locais = [] } = trpc.locais.list.useQuery();

  const createMutation = trpc.aulas.create.useMutation({
    onSuccess: () => {
      toast.success("Aula criada com sucesso");
      setIsEditorOpen(false);
      utils.aulas.list.invalidate();
      utils.stats.aulas.invalidate();
    }
  });

  const updateMutation = trpc.aulas.update.useMutation({
    onSuccess: () => {
      toast.success("Aula atualizada com sucesso");
      setIsEditorOpen(false);
      setEditingAula(null);
      utils.aulas.list.invalidate();
      utils.stats.aulas.invalidate();
    }
  });

  const deleteMutation = trpc.aulas.delete.useMutation({
    onSuccess: () => {
      toast.success("Aula removida");
      utils.aulas.list.invalidate();
      utils.stats.aulas.invalidate();
    }
  });

  const [formData, setFormData] = useState({
    atividade: "",
    horario: "08:00",
    dia: "Segunda",
    localId: 0,
    faixaEtaria: "Livre",
    categoria: "Adulto",
    professorId: 0,
    tipoContrato: "CLT",
    turno: "Manhã",
    status: "Ativa" as any
  });

  const handleOpenCreate = () => {
    setEditingAula(null);
    setFormData({
      atividade: "",
      horario: "08:00",
      dia: "Segunda",
      localId: locais[0]?.id || 0,
      faixaEtaria: "Livre",
      categoria: "Adulto",
      professorId: professores[0]?.id || 0,
      tipoContrato: "CLT",
      turno: "Manhã",
      status: "Ativa"
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (aula: any) => {
    setEditingAula(aula);
    setFormData({
      atividade: aula.atividade,
      horario: aula.horario,
      dia: aula.dia,
      localId: aula.localId,
      faixaEtaria: aula.faixaEtaria,
      categoria: aula.categoria,
      professorId: aula.professorId,
      tipoContrato: aula.tipoContrato,
      turno: aula.turno,
      status: aula.status || "Ativa"
    });
    setIsEditorOpen(true);
  };

  const handleSubmit = () => {
    if (editingAula) {
      updateMutation.mutate({ id: editingAula.id, data: formData });
    } else {
      createMutation.mutate(formData as any);
    }
  };

  const activityToGroup = useMemo(() => {
    const map: Record<string, string> = {};
    if (!aulas) return map;
    
    aulas.forEach(aula => {
      let found = false;
      for (const [group, activities] of Object.entries(MODALITY_GROUPS)) {
        if (activities.some(act => aula.atividade.toLowerCase().includes(act.toLowerCase()))) {
          map[aula.atividade] = group;
          found = true;
          break;
        }
      }
      if (!found) map[aula.atividade] = "Outros";
    });
    return map;
  }, [aulas]);

  const availableGroups = useMemo(() => {
    if (!aulas) return [];
    const groups = new Set(Object.values(activityToGroup));
    return Array.from(groups).sort();
  }, [aulas, activityToGroup]);

  const filteredAulas = useMemo(() => {
    if (!aulas) return [];
    let result = [...aulas];
    if (activeCategory !== "all") result = result.filter(a => a.categoria === activeCategory);
    if (activeGroup !== "all") result = result.filter(a => activityToGroup[a.atividade] === activeGroup);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(a => 
        a.atividade.toLowerCase().includes(s) || 
        (a.professor?.nome && a.professor.nome.toLowerCase().includes(s)) ||
        a.dia.toLowerCase().includes(s)
      );
    }
    return result;
  }, [aulas, activeCategory, activeGroup, search, activityToGroup]);

  const groupedAulas = useMemo(() => {
    const diaOrdem: Record<string, number> = {
      "Segunda": 1, "Terça": 2, "Quarta": 3, "Quinta": 4, "Sexta": 5, "Sábado": 6, "Domingo": 7
    };
    const grouped: Record<string, any[]> = {};
    filteredAulas.forEach(aula => {
      if (!grouped[aula.dia]) grouped[aula.dia] = [];
      grouped[aula.dia].push(aula);
    });
    const sortedDays = Object.keys(grouped).sort((a, b) => diaOrdem[a] - diaOrdem[b]);
    return sortedDays.map(dia => ({
      dia,
      aulas: grouped[dia].sort((a, b) => a.horario.localeCompare(b.horario))
    }));
  }, [filteredAulas]);

  if (isLoading) {
    return (
      <div className="space-y-6 md:space-y-10 max-w-[1400px] mx-auto pb-10">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-1">
            <Skeleton className="h-12 w-64 rounded-2xl" />
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
          <Skeleton className="h-14 w-40 rounded-full" />
        </header>

        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <Skeleton className="h-14 md:col-span-8 rounded-2xl" />
            <Skeleton className="h-14 md:col-span-4 rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-32 rounded-xl shrink-0" />
              ))}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-12 w-48 rounded-2xl shrink-0" />
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-12">
          {[1, 2].map((group) => (
            <div key={group} className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <Skeleton className="h-10 w-48 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 max-w-[1400px] mx-auto pb-10">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-1">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-6xl font-heavy tracking-tighter text-slate-900 dark:text-white"
          >
            Gerenciar
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm md:text-lg text-slate-500 font-medium tracking-tight"
          >
            Organize a grade esportiva com precisão e clareza.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Button 
            onClick={handleOpenCreate}
            className="w-full sm:w-auto bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-full px-8 py-4 text-base font-heavy apple-card-shadow transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Aula
          </Button>
        </motion.div>
      </header>

      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0071e3] transition-all duration-500 w-5 h-5" />
            <Input 
              placeholder="Buscar por atividade, professor ou dia..." 
              className="pl-14 h-14 bg-white dark:bg-slate-900 border-0 apple-card-shadow rounded-2xl text-base font-medium focus-visible:ring-2 focus-visible:ring-blue-500/10 transition-all duration-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="md:col-span-4">
            <div className="h-14 bg-white dark:bg-slate-900 apple-card-shadow rounded-2xl flex items-center px-6 gap-3 text-slate-500 font-heavy text-base">
              <Filter className="w-5 h-5 text-[#0071e3]" />
              <span className="truncate">{filteredAulas.length} resultados encontrados</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="relative group">
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {["all", "Adulto", "Infantil-Teen"].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] md:text-[12px] font-black uppercase tracking-[0.15em] transition-all duration-300 whitespace-nowrap shrink-0 ${
                    activeCategory === cat 
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" 
                    : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900 apple-card-shadow"
                  }`}
                >
                  {cat === "all" ? "Todas as Idades" : cat}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none opacity-100 md:opacity-0 transition-opacity" />
          </div>

          <div className="relative group">
            <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              <button
                onClick={() => setActiveGroup("all")}
                className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-base font-heavy transition-all duration-300 whitespace-nowrap shrink-0 apple-card-shadow ${
                  activeGroup === "all" 
                  ? "bg-blue-50 text-[#0071e3] ring-1 ring-[#0071e3]/10" 
                  : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
                Todas as Modalidades
              </button>
              {availableGroups.map(group => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl text-base font-heavy transition-all duration-300 whitespace-nowrap shrink-0 apple-card-shadow ${
                    activeGroup === group 
                    ? "bg-blue-50 text-[#0071e3] ring-1 ring-[#0071e3]/10" 
                    : "bg-white text-slate-500 hover:bg-slate-50 dark:bg-slate-900"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  {group}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white dark:from-slate-950 to-transparent pointer-events-none opacity-100 md:opacity-0 transition-opacity" />
          </div>
        </div>
      </section>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12"
      >
        {groupedAulas.map(({ dia, aulas }) => (
          <motion.div key={dia} variants={item} className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="w-12 h-12 rounded-2xl bg-black dark:bg-white flex items-center justify-center shadow-xl">
                <CalendarDays className="w-6 h-6 text-white dark:text-black" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                {dia}
              </h2>
              <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 ml-4 hidden md:block" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {aulas.map((aula) => (
                <Card key={aula.id} className="border-0 apple-card-shadow bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden group apple-card-hover h-full flex flex-col">
                  <CardContent className="p-8 space-y-6 flex-1 flex flex-col">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <Badge className="bg-blue-50 text-[#0071e3] dark:bg-blue-900/30 dark:text-blue-400 border-0 rounded-full font-black px-4 py-1 text-[10px] uppercase tracking-widest shrink-0">
                          {aula.categoria}
                        </Badge>
                        <div className="bg-slate-900 text-white dark:bg-white dark:text-black px-3 py-1.5 rounded-xl font-heavy text-xs shrink-0 shadow-lg">
                          {aula.horario}
                        </div>
                      </div>
                      <h3 className="text-2xl font-heavy text-slate-900 dark:text-white leading-tight tracking-tight line-clamp-2 min-h-[3.5rem]">
                        {aula.atividade}
                      </h3>
                    </div>

                    <div className="space-y-4 pt-2 flex-1 min-w-0">
                      <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Docente</span>
                          <span className="font-heavy text-sm leading-tight truncate">{aula.professor?.nome}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest opacity-40">Local</span>
                          <span className="font-heavy text-sm leading-tight truncate">{aula.local?.nome}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between gap-4 mt-auto">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full shadow-sm ${
                          aula.status === 'Ativa' ? 'bg-emerald-500 shadow-emerald-500/50' :
                          aula.status === 'Chuva' ? 'bg-blue-500 shadow-blue-500/50' :
                          aula.status === 'Feriado' ? 'bg-orange-500 shadow-orange-500/50' :
                          aula.status === 'Sem Aluno' ? 'bg-red-500 shadow-red-500/50' :
                          'bg-purple-500 shadow-purple-500/50'
                        }`} />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {aula.status || 'Ativa'}
                        </span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleOpenEdit(aula)}
                        className="w-10 h-10 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-[#0071e3] transition-all"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

        {groupedAulas.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-20 text-center space-y-4"
          >
            <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-2xl apple-card-shadow flex items-center justify-center mx-auto">
              <CalendarDays className="w-10 h-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-heavy text-slate-900 dark:text-white tracking-tighter">Nada por aqui</h3>
              <p className="text-base text-slate-500 font-medium">Tente ajustar seus filtros para encontrar aulas.</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => { setActiveCategory("all"); setActiveGroup("all"); setSearch(""); }}
              className="rounded-full px-8 py-3.5 text-sm font-heavy border-2 hover:bg-slate-50"
            >
              Limpar filtros
            </Button>
          </motion.div>
        )}

      {/* Editor de Aula (Criar/Editar) */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] bg-white dark:bg-slate-950 border-0 apple-card-shadow rounded-[2.5rem] p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className={`p-8 text-white relative shrink-0 ${editingAula ? 'bg-[#0071e3]' : 'bg-black dark:bg-white dark:text-black'}`}>
            <DialogHeader className="text-left">
              <DialogTitle className="text-3xl font-black tracking-tight leading-tight">
                {editingAula ? "Editar Aula" : "Nova Aula"}
              </DialogTitle>
              <DialogDescription className={`${editingAula ? 'text-white/70' : 'text-slate-500'} font-medium`}>
                {editingAula ? `Alterando detalhes de: ${editingAula.atividade}` : "Preencha as informações para adicionar uma nova aula à grade."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Atividade */}
              <div className="space-y-2 col-span-full">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Atividade / Modalidade</Label>
                <div className="relative">
                  <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Ex: Beach Tennis"
                    className="pl-11 h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold"
                    value={formData.atividade}
                    onChange={(e) => setFormData({ ...formData, atividade: e.target.value })}
                  />
                </div>
              </div>

              {/* Professor */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Docente</Label>
                <Select 
                  value={String(formData.professorId)} 
                  onValueChange={(val) => setFormData({ ...formData, professorId: parseInt(val) })}
                >
                  <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-4 font-bold">
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    {professores.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)} className="rounded-xl py-3">{p.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Local */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Local</Label>
                <Select 
                  value={String(formData.localId)} 
                  onValueChange={(val) => setFormData({ ...formData, localId: parseInt(val) })}
                >
                  <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-4 font-bold">
                    <SelectValue placeholder="Selecione o local" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    {locais.map((l: any) => (
                      <SelectItem key={l.id} value={String(l.id)} className="rounded-xl py-3">{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Horário */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Horário (HH:mm)</Label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Ex: 08:00"
                    className="pl-11 h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl font-bold"
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  />
                </div>
              </div>

              {/* Dia da Semana */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Dia da Semana</Label>
                <Select 
                  value={formData.dia} 
                  onValueChange={(val) => setFormData({ ...formData, dia: val })}
                >
                  <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-4 font-bold">
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].map(dia => (
                      <SelectItem key={dia} value={dia} className="rounded-xl py-3">{dia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Categoria / Público</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(val) => setFormData({ ...formData, categoria: val })}
                >
                  <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-4 font-bold">
                    <SelectValue placeholder="Selecione o público" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    {["Adulto", "Infantil-Teen"].map(cat => (
                      <SelectItem key={cat} value={cat} className="rounded-xl py-3">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Status Atual</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-14 bg-slate-50 dark:bg-slate-900 border-0 rounded-2xl px-4 font-bold">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-2xl">
                    {['Ativa', 'Chuva', 'Feriado', 'Sem Aluno', 'Final de Ano'].map(st => (
                      <SelectItem key={st} value={st} className="rounded-xl py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            st === 'Ativa' ? 'bg-emerald-500' :
                            st === 'Chuva' ? 'bg-blue-500' :
                            st === 'Feriado' ? 'bg-orange-500' :
                            st === 'Sem Aluno' ? 'bg-red-500' :
                            'bg-purple-500'
                          }`} />
                          {st}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 flex-col sm:flex-row gap-3 shrink-0">
            {editingAula && (
              <Button 
                variant="ghost" 
                className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full h-12 px-6"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir esta aula?")) {
                    deleteMutation.mutate({ id: editingAula.id });
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Aula
              </Button>
            )}
            <div className="flex-1" />
            <Button variant="ghost" onClick={() => setIsEditorOpen(false)} className="rounded-full font-heavy h-12">
              Cancelar
            </Button>
            <Button 
              className={`rounded-full px-10 h-12 font-heavy apple-card-shadow ${editingAula ? 'bg-[#0071e3] hover:bg-[#0077ed] text-white' : 'bg-black dark:bg-white text-white dark:text-black'}`}
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editingAula ? "Salvar Alterações" : "Criar Aula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
