import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Calendar, Users, Clock, Activity, Award, MapPin, TrendingUp, Briefcase, Target } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

// Mock data for the weekly attendance chart
const weeklyAttendanceData = [
  { name: "Seg", current: 45, previous: 38 },
  { name: "Ter", current: 52, previous: 48 },
  { name: "Qua", current: 48, previous: 50 },
  { name: "Qui", current: 60, previous: 55 },
  { name: "Sex", current: 58, previous: 52 },
  { name: "Sáb", current: 72, previous: 65 }
];

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
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground"
        >
          Estatísticas
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-xl text-muted-foreground font-medium tracking-tight"
        >
          Sua grade esportiva analisada em tempo real.
        </motion.p>
      </header>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-10 md:space-y-12">
        {/* Goals Banner */}
        <motion.div variants={item}>
          <Card className="border-0 shadow-xl bg-gradient-to-r from-[#006c49] to-[#00a86b] text-white rounded-[1.5rem] overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Target className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold mb-1">Meta do Mês</h3>
                    <p className="text-white/80">85% de frequência alcançada! Continue assim!</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-4xl font-extrabold">85%</p>
                    <p className="text-white/80 text-sm">Concluído</p>
                  </div>
                  <div className="w-16 h-16 relative">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="10" fill="none" />
                      <motion.circle cx="50" cy="50" r="40" stroke="white" strokeWidth="10" fill="none" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 0.85 }} transition={{ duration: 1.5, ease: "easeOut" }} />
                    </svg>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Stats - Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
          {[
            { label: "Total de Aulas", value: currentStats.totalAulas, icon: Calendar, bg: "bg-primary" },
            { label: "Professores", value: currentStats.totalProfessores, icon: Users, bg: "bg-blue-500" },
            { label: "CLT", value: currentStats.totalCLT, icon: Briefcase, bg: "bg-emerald-500" },
            { label: "Terceiros", value: currentStats.totalTerceiros, icon: Activity, bg: "bg-purple-500" },
            { label: "Locais", value: currentStats.totalLocais, icon: MapPin, bg: "bg-orange-500" },
            { label: "Modalidades", value: currentStats.totalModalidades, icon: Award, bg: "bg-indigo-500" }
          ].map((stat, idx) => (
            <motion.div key={idx} variants={item}>
              <Card className="border-0 shadow-xl bg-card rounded-xl overflow-hidden hover:shadow-2xl transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center text-white shadow-md`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 truncate">{stat.label}</p>
                      <p className="text-3xl font-extrabold text-foreground truncate">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Turno & Categoria Breakdown + Weekly Attendance Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <motion.div variants={item} className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-card rounded-xl overflow-hidden h-full">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-[#6cf8bb]/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-[#006c49]" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">Frequência Semanal</CardTitle>
                </div>
                <CardDescription className="text-muted-foreground">Comparativo entre a semana atual e anterior</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyAttendanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "white", borderRadius: "0.75rem", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                        itemStyle={{ color: "#0b1c30" }}
                      />
                      <Bar dataKey="previous" fill="#e2e8f0" radius={[4, 4, 0, 0]} name="Semana Anterior" />
                      <Bar dataKey="current" fill="#006c49" radius={[4, 4, 0, 0]} name="Semana Atual" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="border-0 shadow-xl bg-card rounded-xl overflow-hidden h-full">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">Aulas por Turno</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-5">
                  {[
                    { label: "Manhã", value: currentStats.aulasManha, color: "bg-yellow-400" },
                    { label: "Tarde", value: currentStats.aulasTarde, color: "bg-orange-400" },
                    { label: "Noite", value: currentStats.aulasNoite, color: "bg-indigo-500" }
                  ].map((turno, i) => {
                    const percentage = currentStats.totalAulas > 0 ? (turno.value / currentStats.totalAulas) * 100 : 0;
                    return (
                      <div key={turno.label} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold tracking-tight">
                          <span className="text-muted-foreground">{turno.label}</span>
                          <span className="text-foreground">{turno.value}</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
        </div>

        {/* Status Breakdown & Rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Status Breakdown */}
          <motion.div variants={item}>
            <Card className="border-0 shadow-xl bg-card rounded-xl overflow-hidden h-full">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl font-bold tracking-tight">Status das Aulas</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-5">
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
                        <div className="flex justify-between text-sm font-bold tracking-tight">
                          <span className="text-muted-foreground">{st}</span>
                          <span className="text-foreground">{count}</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
            { title: "Top Modalidades", icon: Award, data: currentStats.rankingModalidades, iconColor: "text-amber-600", bgColor: "bg-amber-100", barColor: "bg-amber-500" },
            { title: "Locais Utilizados", icon: MapPin, data: currentStats.rankingLocais, iconColor: "text-blue-600", bgColor: "bg-blue-100", barColor: "bg-blue-500" }
          ].map((rank, idx) => (
            <motion.div key={idx} variants={item}>
              <Card className="border-0 shadow-xl bg-card rounded-xl overflow-hidden h-full">
                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center gap-4 mb-1">
                    <div className={`w-10 h-10 rounded-xl ${rank.bgColor} flex items-center justify-center`}>
                      <rank.icon className={`w-5 h-5 ${rank.iconColor}`} />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-tight">{rank.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-5">
                    {rank.data.slice(0, 5).map((entry: any, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex justify-between text-sm font-bold tracking-tight">
                          <span className="text-muted-foreground truncate pr-4">{entry.nome}</span>
                          <span className="text-foreground shrink-0">{entry.total} aulas</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">Volume Semanal</h2>
            </div>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
            {DIAS_COM_AULAS.length > 0 ? (
              DIAS_COM_AULAS.map(dia => (
                <motion.div 
                  key={dia} 
                  whileHover={{ scale: 1.02 }}
                  className="flex-shrink-0 w-56 p-6 rounded-xl bg-card shadow-xl hover:shadow-2xl transition-shadow"
                >
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-foreground text-background text-xs font-bold uppercase tracking-wider">
                      {dia}
                    </span>
                    <div className="min-w-0">
                      <span className="text-4xl font-extrabold text-foreground block mb-1 leading-none truncate">
                        {(currentStats.porDia as any)[dia] || 0}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Aulas Agendadas</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
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
              <div className="w-full py-20 bg-muted/50 rounded-[1.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 text-muted-foreground">
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
