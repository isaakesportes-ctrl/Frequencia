import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Calendar, Users, User, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function RegistrosFrequenciaPage() {
  const [activeTab, setActiveTab] = useState("aulas");

  const { data: frequenciaAulas, isLoading: loadingAulas } = trpc.frequenciaAulas.all.useQuery();
  const { data: frequenciaKids, isLoading: loadingKids } = trpc.frequenciaKids.all.useQuery();

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto pb-10">
      <header className="space-y-1">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl md:text-5xl font-heavy tracking-tighter text-slate-900 dark:text-white"
        >
          Registros de Frequências
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-slate-500 font-medium tracking-tight max-w-lg"
        >
          Visualize todos os registros de frequência de aulas e kids.
        </motion.p>
      </header>

      <div className="w-full">
        <div className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab("aulas")}
            className={`rounded-xl font-bold text-sm py-2 transition-all duration-300 ${
              activeTab === "aulas"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Registros de Aulas
          </button>
          <button
            onClick={() => setActiveTab("kids")}
            className={`rounded-xl font-bold text-sm py-2 transition-all duration-300 ${
              activeTab === "kids"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Registros de Kids
          </button>
        </div>

        {activeTab === "aulas" && (
          <div className="mt-6">
            <Card className="border-0 apple-card-shadow bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-heavy text-xl text-slate-900 dark:text-white">Registros de Frequência de Aulas</h3>
                {loadingAulas ? (
                  <div className="text-slate-500">Carregando registros...</div>
                ) : frequenciaAulas && frequenciaAulas.length > 0 ? (
                  <div className="space-y-3">
                    {frequenciaAulas.map((registro) => (
                      <div
                        key={registro.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              Aula ID: {registro.aulaId}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">
                                {registro.data}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {registro.horario}
                              </Badge>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
                                {registro.quantidadePresentes} presentes
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500">Nenhum registro de frequência de aulas.</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "kids" && (
          <div className="mt-6">
            <Card className="border-0 apple-card-shadow bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-heavy text-xl text-slate-900 dark:text-white">Registros de Frequência Kids</h3>
                {loadingKids ? (
                  <div className="text-slate-500">Carregando registros...</div>
                ) : frequenciaKids && frequenciaKids.length > 0 ? (
                  <div className="space-y-3">
                    {frequenciaKids.map((registro) => (
                      <div
                        key={registro.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {registro.nomeAluno}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-[10px]">
                                Matrícula: {registro.numeroSocio}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                Idade: {registro.idade}
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {registro.data}
                              </Badge>
                              {registro.acompanhado && (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-[10px]">
                                  Acompanhado
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500">Nenhum registro de frequência kids.</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
