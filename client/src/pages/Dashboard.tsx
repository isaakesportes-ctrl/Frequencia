import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Users, Clock, Activity, Award, MapPin, TrendingUp, Briefcase } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } }
};

export default function Dashboard() {
  const { data: stats } = trpc.stats.aulas.useQuery();

  const emptyStats = {
    totalAulas: 0,
    totalProfessores: 0,
    totalCLT: 0,
    totalTerceiros: 0,
    totalLocais: 0,
    totalModalidades: 0,
    aulasManha: 0,
    aulasTarde: 0,
    aulasNoite: 0,
    aulasAdulto: 0,
    aulasInfantilTeen: 0,
    porDia: {} as Record<string, number>,
    porTurno: {} as Record<string, number>,
    porCategoria: {} as Record<string, number>,
    porContrato: {} as Record<string, number>,
    porStatus: {} as Record<string, number>,
    rankingLocais: [] as { nome: string; total: number }[],
    rankingModalidades: [] as { nome: string; total: number }[]
  };

  const currentStats = stats || emptyStats;

  const DIAS_COM_AULAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"].filter(
    dia => ((currentStats.porDia as any)[dia] || 0) > 0
  );

  return (
    <div className="space-y-8 md:space-y-12 max-w-[1400px] mx-auto pb-10">
      <header className="space-y-1">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white"
        >
          Estatísticas
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-xl text-slate-500 font-medium tracking-tight"
        >
          Sua grade esportiva analisada em tempo real.
        </motion.p>
      </header>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 md:space-y-12">
        {/* Main Stats - Apple Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
          {[
            { label: "Total de Aulas", value: currentStats.totalAulas, icon: Calendar, color: "blue", bg: "bg-[#0071e3]" },
            { label: "Professores", value: currentStats.totalProfessores, icon: Users, color: "red", bg: "bg-[#ff3b30]" },
            { label: "CLT", value: currentStats.totalCLT, icon: Briefcase, color: "green", bg: "bg-[#34c759]" },
            { label: "Terceiros", value: currentStats.totalTerceiros, icon: Activity, color: "purple", bg: "bg-[#af52de]" },
            { label: "Locais", value: currentStats.totalLocais, icon: MapPin, color: "orange", bg: "bg-[#ff9500]" },
            { label: "Modalidades", value: currentStats.totalModalidades, icon: Award, color: "indigo", bg: "bg-[#5856d6]" }
          ].map((stat, idx) => (
            <motion.div key={idx} variants={item}>
              <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden apple-card-hover">
                <CardContent className="p-6 md:p-8">
                  <div className="space-y-6">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center text-white shadow-xl`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1 truncate">{stat.label}</p>
                      <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white truncate">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Turno & Categoria Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          <motion.div variants={item}>
            <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] p-2 overflow-hidden apple-card-hover h-full">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-500" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">Aulas por Turno</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="space-y-6">
                  {[
                    { label: "Manhã", value: currentStats.aulasManha, color: "bg-yellow-500" },
                    { label: "Tarde", value: currentStats.aulasTarde, color: "bg-orange-500" },
                    { label: "Noite", value: currentStats.aulasNoite, color: "bg-indigo-500" }
                  ].map((turno, i) => {
                    const percentage = currentStats.totalAulas > 0 ? (turno.value / currentStats.totalAulas) * 100 : 0;
                    return (
                      <div key={turno.label} className="space-y-2">
                        <div className="flex justify-between text-sm font-heavy tracking-tight">
                          <span className="text-slate-600 dark:text-slate-400">{turno.label}</span>
                          <span className="text-slate-900 dark:text-white">{turno.value}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                            className={`h-full ${turno.color} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] p-2 overflow-hidden apple-card-hover h-full">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">Aulas por Categoria</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="space-y-6">
                  {[
                    { label: "Adulto", value: currentStats.aulasAdulto, color: "bg-emerald-500" },
                    { label: "Infantil-Teen", value: currentStats.aulasInfantilTeen, color: "bg-pink-500" }
                  ].map((cat, i) => {
                    const percentage = currentStats.totalAulas > 0 ? (cat.value / currentStats.totalAulas) * 100 : 0;
                    return (
                      <div key={cat.label} className="space-y-2">
                        <div className="flex justify-between text-sm font-heavy tracking-tight">
                          <span className="text-slate-600 dark:text-slate-400">{cat.label}</span>
                          <span className="text-slate-900 dark:text-white">{cat.value}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                            className={`h-full ${cat.color} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Status Breakdown & Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Status Breakdown */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] p-2 overflow-hidden apple-card-hover h-full">
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-500" />
                  </div>
                  <CardTitle className="text-xl font-black tracking-tight">Status das Aulas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <div className="space-y-6">
                  {['Ativa', 'Chuva', 'Feriado', 'Sem Aluno', 'Final de Ano'].map((st, i) => {
                    const count = (currentStats.porStatus as any)[st] || 0;
                    const percentage = currentStats.totalAulas > 0 ? (count / currentStats.totalAulas) * 100 : 0;
                    const colors: Record<string, string> = {
                      'Ativa': 'bg-emerald-500',
                      'Chuva': 'bg-blue-500',
                      'Feriado': 'bg-orange-500',
                      'Sem Aluno': 'bg-red-500',
                      'Final de Ano': 'bg-purple-500'
                    };
                    return (
                      <div key={st} className="space-y-2">
                        <div className="flex justify-between text-sm font-heavy tracking-tight">
                          <span className="text-slate-600 dark:text-slate-400">{st}</span>
                          <span className="text-slate-900 dark:text-white">{count}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                            className={`h-full ${colors[st]} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {[
            { title: "Top Modalidades", icon: Award, color: "amber", data: currentStats.rankingModalidades, iconColor: "text-amber-500", barColor: "bg-black dark:bg-white" },
            { title: "Locais Utilizados", icon: MapPin, color: "blue", data: currentStats.rankingLocais, iconColor: "text-blue-500", barColor: "bg-[#0071e3]" }
          ].map((rank, idx) => (
            <motion.div key={idx} variants={item}>
              <Card className="border-0 shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] p-2 overflow-hidden apple-card-hover h-full">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center gap-4 mb-1">
                    <div className={`w-10 h-10 rounded-xl bg-${rank.color}-50 dark:bg-${rank.color}-900/30 flex items-center justify-center`}>
                      <rank.icon className={`w-5 h-5 ${rank.iconColor}`} />
                    </div>
                    <CardTitle className="text-xl font-black tracking-tight">{rank.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                  <div className="space-y-6">
                    {rank.data.slice(0, 5).map((entry: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm font-heavy tracking-tight">
                          <span className="text-slate-600 dark:text-slate-400 truncate pr-4">{entry.nome}</span>
                          <span className="text-slate-900 dark:text-white shrink-0">{entry.total} aulas</span>
                        </div>
                        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(entry.total / (rank.data[0]?.total || 1)) * 100}%` }}
                            transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                            className={`h-full ${rank.barColor} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Volume Semanal */}
        <motion.div variants={item} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Volume Semanal</h2>
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 px-2 scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
            {DIAS_COM_AULAS.length > 0 ? (
              DIAS_COM_AULAS.map(dia => (
                <motion.div 
                  key={dia} 
                  whileHover={{ scale: 1.02 }}
                  className="flex-shrink-0 w-64 p-8 rounded-[2.5rem] bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-none apple-card-hover"
                >
                  <div className="space-y-6">
                    <span className="inline-block px-4 py-1 rounded-full bg-slate-900 text-white dark:bg-white dark:text-black text-[10px] font-black uppercase tracking-[0.15em]">
                      {dia}
                    </span>
                    <div className="min-w-0">
                      <span className="text-5xl font-black text-slate-900 dark:text-white block mb-1 leading-none truncate">
                        {(currentStats.porDia as any)[dia] || 0}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aulas Agendadas</span>
                    </div>
                    <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(((currentStats.porDia as any)[dia] || 0) / currentStats.totalAulas) * 100}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="w-full py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 text-slate-400">
                <Calendar className="w-12 h-12 opacity-20" />
                <p className="text-xl font-bold">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
