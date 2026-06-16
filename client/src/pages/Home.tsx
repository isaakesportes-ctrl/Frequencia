import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Calendar, Clock, MapPin, User, Briefcase, Users, Search, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TURNOS = ["Manhã", "Tarde", "Noite"];
const CATEGORIAS = ["Adulto", "Infantil-Teen"];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
};

export default function Home() {
  const [selectedDay, setSelectedDay] = useState("all");
  const [selectedTurno, setSelectedTurno] = useState("all");
  const [selectedCategoria, setSelectedCategoria] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats, isLoading } = trpc.stats.aulas.useQuery();
  const { data: aulas } = trpc.aulas.list.useQuery({});

  const displayAulas = (aulas || []).filter((aula: any) => {
    const matchesDay = selectedDay === "all" || aula.dia === selectedDay;
    const matchesTurno = selectedTurno === "all" || aula.turno === selectedTurno;
    const matchesCat = selectedCategoria === "all" || aula.categoria === selectedCategoria;
    const matchesSearch = !searchQuery || 
      aula.atividade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (aula.professor?.nome && aula.professor.nome.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesDay && matchesTurno && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto pb-10">
      <header className="space-y-1">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl md:text-5xl font-heavy tracking-tighter text-slate-900 dark:text-white"
        >
          Grade Geral
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-slate-500 font-medium tracking-tight max-w-lg"
        >
          Explore as atividades esportivas e planeje sua semana.
        </motion.p>
      </header>

      {/* Quick Stats - Apple Style Bento */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      >
        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))
        ) : stats && (
          <>
            {[
              { label: "Aulas", value: stats.totalAulas, icon: Calendar, color: "blue" },
              { label: "Docentes", value: stats.totalProfessores, icon: Users, color: "purple" },
              { label: "Turnos", value: Object.keys(stats.porTurno || {}).length, icon: Clock, color: "orange" },
              { label: "Modalidades", value: Object.keys(stats.porCategoria || {}).length, icon: Briefcase, color: "emerald" }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={item}>
                <Card className="border-0 apple-card-shadow apple-blur apple-card-hover rounded-2xl overflow-hidden">
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
                        <p className="text-2xl md:text-3xl font-heavy text-slate-900 dark:text-white truncate">
                          {stat.value || 0}
                        </p>
                      </div>
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-900/30 flex items-center justify-center text-${stat.color}-500 shrink-0 shadow-inner`}>
                        <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </>
        )}
      </motion.div>

      {/* Filters and Search - Modern Glass Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0071e3] transition-all duration-500 w-4 h-4" />
          <Input
            placeholder="Buscar atividade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-white dark:bg-slate-900 border-0 apple-card-shadow rounded-2xl text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500/10 transition-all duration-500 placeholder:text-slate-300"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { value: selectedDay, setter: setSelectedDay, options: DIAS, label: "Dia da Semana", icon: Calendar, color: "text-blue-500" },
            { value: selectedTurno, setter: setSelectedTurno, options: TURNOS, label: "Turno", icon: Clock, color: "text-orange-500" },
            { value: selectedCategoria, setter: setSelectedCategoria, options: CATEGORIAS, label: "Público Alvo", icon: Filter, color: "text-purple-500" }
          ].map((filter, idx) => (
            <div key={idx} className="w-full">
              <Select value={filter.value} onValueChange={filter.setter}>
                <SelectTrigger className="h-11 bg-white dark:bg-slate-900 border-0 apple-card-shadow rounded-xl px-4 text-xs font-bold text-slate-600 transition-all hover:bg-slate-50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <filter.icon className={`w-4 h-4 shrink-0 ${filter.color}`} />
                    <SelectValue placeholder={`${filter.label}`} className="truncate" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-0 apple-card-shadow p-1.5">
                  <SelectItem value="all" className="rounded-lg py-2 font-bold text-xs">Todos</SelectItem>
                  {filter.options.map((opt) => (
                    <SelectItem key={opt} value={opt} className="rounded-lg py-2 font-bold text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Aulas Grid - Clean Modern Cards */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
      >
        {isLoading ? (
          [1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-40 sm:h-48 rounded-3xl" />
          ))
        ) : displayAulas.length > 0 ? (
          displayAulas.map((aula: any) => (
            <motion.div key={aula.id} variants={item}>
              <Card className="border-0 apple-card-shadow bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden group apple-card-hover h-full flex flex-col">
                <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-3">
                      <Badge className="bg-blue-50 text-[#0071e3] dark:bg-blue-900/30 dark:text-blue-400 border-0 rounded-full font-black px-3 py-0.5 text-[8px] uppercase tracking-widest shrink-0">
                        {aula.categoria}
                      </Badge>
                      <div className="bg-slate-900 text-white dark:bg-white dark:text-black px-2 py-1 rounded-lg font-heavy text-[10px] shrink-0 shadow-md">
                        {aula.horario}
                      </div>
                    </div>
                    <h3 className="text-lg sm:text-xl font-heavy text-slate-900 dark:text-white leading-tight tracking-tight line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem]">
                      {aula.atividade}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner shrink-0">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Docente</span>
                        <span className="font-heavy text-xs leading-tight truncate">{aula.professor?.nome}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner shrink-0">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Local</span>
                        <span className="font-heavy text-xs leading-tight truncate">{aula.local?.nome}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner shrink-0">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Dia & Turno</span>
                        <span className="font-heavy text-xs leading-tight truncate">{aula.dia} • {aula.turno}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Calendar className="w-10 h-10 text-slate-200" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-900 dark:text-white font-heavy text-xl">Nenhuma aula encontrada</p>
              <p className="text-slate-400 font-medium">Tente ajustar seus filtros de busca.</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

