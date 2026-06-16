import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SimpleSelect } from "@/components/ui/simple-select";
import { trpc } from "@/lib/trpc";
import { Calendar, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Aula } from "../../../shared/types";

export default function FrequenciaPage() {
  const [activeTab, setActiveTab] = useState("aulas");
  const [currentDateDisplay, setCurrentDateDisplay] = useState("");
  const [currentDateBackend, setCurrentDateBackend] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [currentDayName, setCurrentDayName] = useState("");

  // Frequência de Aulas
  const { data: aulas, isLoading: aulasLoading } = trpc.aulas.list.useQuery({});
  const registerFrequenciaAulas = trpc.frequenciaAulas.register.useMutation();

  // Frequência Kids
  const [numeroSocio, setNumeroSocio] = useState("");
  const [nomeAluno, setNomeAluno] = useState("");
  const [idade, setIdade] = useState("");
  const [acompanhado, setAcompanhado] = useState(false);
  const { data: members } = trpc.members.list.useQuery();
  const getSocio = trpc.frequenciaKids.getSocio.useQuery({ matricula: numeroSocio }, { enabled: !!numeroSocio });
  const registerFrequenciaKids = trpc.frequenciaKids.register.useMutation();

  // Encontrar o sócio atual
  const currentMember = members?.find(m => m.numeroSocio === numeroSocio);
  const memberOptions = currentMember
    ? currentMember.nomes.map((nome) => ({ value: nome, label: nome }))
    : [];

  // Initialize date and time
  useEffect(() => {
    const now = new Date();
    // Format date as dd/mm/yyyy for display
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dateStrDisplay = `${day}/${month}/${year}`;
    
    // Format date as YYYY-MM-DD for backend
    const dateStrBackend = now.toISOString().split('T')[0];
    
    const hours = now.getHours().toString().padStart(2, '0');
    const timeStr = `${hours}:00`;

    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayName = days[now.getDay()];

    setCurrentDateDisplay(dateStrDisplay);
    setCurrentDateBackend(dateStrBackend);
    setCurrentTime(timeStr);
    setCurrentDayName(dayName);
  }, []);

  // Filter aulas for current day and time range
  const filteredAulas = (aulas || []).filter((aula: Aula) => {
    const aulaHour = parseInt(aula.horario.split(':')[0]);
    const currentHour = parseInt(currentTime.split(':')[0]);
    return aula.dia.toLowerCase() === currentDayName.toLowerCase();
  });

  const handleRegisterAula = async (aulaId: number, quantidadePresentes: number) => {
    try {
      await registerFrequenciaAulas.mutateAsync({
        aulaId,
        quantidadePresentes,
        data: currentDateBackend,
        horario: currentTime
      });
      toast.success("Frequência registrada com sucesso!");
    } catch (error) {
      toast.error("Erro ao registrar frequência");
    }
  };

  useEffect(() => {
    if (currentMember && currentMember.nomes.length > 0) {
      setNomeAluno(currentMember.nomes[0]);
    } else if (getSocio.data) {
      setNomeAluno(getSocio.data.nome);
    } else {
      setNomeAluno("");
    }
  }, [currentMember, getSocio.data]);

  const handleRegisterKids = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroSocio || !nomeAluno || !idade) {
      toast.error("Preencha todos os campos");
      return;
    }
    try {
      await registerFrequenciaKids.mutateAsync({
        numeroSocio,
        nomeAluno,
        idade: parseInt(idade),
        acompanhado,
        data: currentDateBackend
      });
      toast.success("Frequência Kids registrada com sucesso!");
      setNumeroSocio("");
      setNomeAluno("");
      setIdade("");
      setAcompanhado(false);
    } catch (error) {
      toast.error("Erro ao registrar frequência");
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 max-w-[1400px] mx-auto pb-10">
      <header className="space-y-1">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl md:text-5xl font-heavy tracking-tighter text-slate-900 dark:text-white"
        >
          Controle de Frequência
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-slate-500 font-medium tracking-tight max-w-lg"
        >
          Gerencie a frequência das aulas e das crianças.
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
            Frequência de Aulas
          </button>
          <button
            onClick={() => setActiveTab("kids")}
            className={`rounded-xl font-bold text-sm py-2 transition-all duration-300 ${
              activeTab === "kids"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Frequência Kids
          </button>
        </div>

        {activeTab === "aulas" && (
          <div className="mt-6">
            <Card className="border-0 apple-card-shadow bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Data</Label>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-heavy text-slate-900 dark:text-white">
                    {currentDateDisplay}
                  </div>
                </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Horário</Label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-heavy text-slate-900 dark:text-white">
                      {currentTime}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Dia da Semana</Label>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-heavy text-slate-900 dark:text-white">
                      {currentDayName}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-heavy text-xl text-slate-900 dark:text-white">Aulas do Dia</h3>
                  {aulasLoading ? (
                    <div className="text-slate-500">Carregando aulas...</div>
                  ) : filteredAulas.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAulas.map((aula: Aula) => (
                        <AulaCard
                          key={aula.id}
                          aula={aula}
                          onRegister={handleRegisterAula}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500">Nenhuma aula para hoje.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "kids" && (
          <div className="mt-6">
            <Card className="border-0 apple-card-shadow bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
              <CardContent className="p-6">
                <form onSubmit={handleRegisterKids} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="numeroSocio" className="text-xs font-bold text-slate-500 uppercase">Número do Sócio</Label>
                      <Input
                        id="numeroSocio"
                        value={numeroSocio}
                        onChange={(e) => setNumeroSocio(e.target.value)}
                        placeholder="Digite o número do sócio"
                        className="h-12 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nomeAluno" className="text-xs font-bold text-slate-500 uppercase">Nome do Aluno</Label>
                      {currentMember && memberOptions.length > 0 ? (
                        <SimpleSelect
                          id="nomeAluno"
                          value={nomeAluno}
                          onChange={(e) => setNomeAluno(e.target.value)}
                          options={memberOptions}
                          className="h-12 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl"
                        />
                      ) : (
                        <Input
                          id="nomeAluno"
                          value={nomeAluno}
                          onChange={(e) => setNomeAluno(e.target.value)}
                          placeholder="Nome do aluno"
                          className="h-12 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="idade" className="text-xs font-bold text-slate-500 uppercase">Idade</Label>
                      <Input
                        id="idade"
                        type="number"
                        value={idade}
                        onChange={(e) => setIdade(e.target.value)}
                        placeholder="Idade"
                        className="h-12 bg-slate-50 dark:bg-slate-800 border-0 rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="acompanhado"
                        checked={acompanhado}
                        onCheckedChange={(checked) => setAcompanhado(checked as boolean)}
                      />
                      <Label htmlFor="acompanhado" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Aluno acompanhado
                      </Label>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-xl"
                  >
                    Registrar Frequência Kids
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function AulaCard({ aula, onRegister }: { aula: Aula; onRegister: (id: number, qtd: number) => void }) {
  const [quantidade, setQuantidade] = useState("0");

  return (
    <Card className="border-0 apple-card-shadow bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div>
          <h4 className="font-heavy text-lg text-slate-900 dark:text-white">{aula.atividade}</h4>
          <p className="text-xs font-medium text-slate-500">{aula.professor?.nome}</p>
        </div>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-500 uppercase">Quantidade Presentes</Label>
            <Input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              className="h-10 bg-white dark:bg-slate-900 border-0 rounded-lg"
            />
          </div>
          <Button
            onClick={() => onRegister(aula.id, parseInt(quantidade) || 0)}
            className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white font-bold rounded-lg"
          >
            Registrar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
