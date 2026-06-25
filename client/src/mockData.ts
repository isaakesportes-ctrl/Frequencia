import type { User, Professor, Socio, Aula, AulaPresenca, FrequenciaKids, MemberEntry } from "../../shared/types";

export const mockUsers: User[] = [
  {
    id: 1,
    openId: "1",
    name: "João Silva",
    email: "joao@exemplo.com",
    password: "123456",
    loginMethod: "email",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  {
    id: 2,
    openId: "2",
    name: "Maria Santos",
    email: "maria@exemplo.com",
    password: "123456",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
];

export const mockProfessores: Professor[] = [
  {
    id: 1,
    nome: "Carlos Alberto",
    password: "prof123",
    role: "Professor",
    tipoContrato: "CLT",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    nome: "Ana Paula",
    password: "prof456",
    role: "Monitor",
    tipoContrato: "Terceiro",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 3,
    nome: "Pedro Henrique",
    password: "prof789",
    role: "Professor",
    tipoContrato: "CLT",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockSocios: Socio[] = [
  { id: 1, nome: "José da Costa", matricula: "SOC001" },
  { id: 2, nome: "Fernanda Lima", matricula: "SOC002" },
  { id: 3, nome: "Ricardo Mendes", matricula: "SOC003" },
];

export const mockAulas: Aula[] = [
  {
    id: 1,
    atividade: "Musculação",
    horario: "07:00",
    dia: "Segunda-feira",
    localId: 1,
    faixaEtaria: "Adulto",
    categoria: "Musculação",
    professorId: 1,
    tipoContrato: "CLT",
    turno: "Manhã",
    status: "Ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    atividade: "Natação Infantil",
    horario: "16:00",
    dia: "Terça-feira",
    localId: 2,
    faixaEtaria: "Infantil",
    categoria: "Natação",
    professorId: 2,
    tipoContrato: "Terceiro",
    turno: "Tarde",
    status: "Ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockAulaPresencas: AulaPresenca[] = [
  {
    id: 1,
    aulaId: 1,
    socioNome: "José da Costa",
    socioMatricula: "SOC001",
    data: "2025-06-23",
    createdAt: new Date(),
  },
  {
    id: 2,
    aulaId: 1,
    socioNome: "Fernanda Lima",
    socioMatricula: "SOC002",
    data: "2025-06-23",
    createdAt: new Date(),
  },
];

export const mockFrequenciaKids: FrequenciaKids[] = [
  {
    id: 1,
    numeroSocio: "SOC004",
    nomeAluno: "Lucas Silva",
    idade: 8,
    acompanhado: true,
    data: "2025-06-23",
    createdAt: new Date(),
  },
];

export const mockMemberEntries: MemberEntry[] = [
  {
    id: 1,
    numeroSocio: "SOC001",
    nomes: ["José da Costa"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockPendingRequests = [
  { id: 1, name: "Lucas Oliveira", role: "aprendiz", requestedAt: new Date() },
  { id: 2, name: "Juliana Costa", role: "monitor", requestedAt: new Date() },
];
