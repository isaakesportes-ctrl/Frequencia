/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export * from "./_core/errors.js";

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  password?: string | null; // Adicionado para controle de acesso dos professores
  loginMethod: string | null;
  role: "user" | "admin" | "monitor";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
}

export interface Professor {
  id: number;
  nome: string;
  password?: string; // Adicionado para visualização direta de senhas de professores
  role?: string; // Adicionado para diferenciar entre Professor e Monitor
  tipoContrato?: string; // Adicionado para classificar como CLT ou Terceiro
  createdAt: Date;
  updatedAt: Date;
}

export interface Socio {
  id: number;
  nome: string;
  matricula: string;
}

export interface AulaPresenca {
  id: number;
  aulaId: number;
  socioNome: string;
  socioMatricula: string;
  data: string; // ISO string YYYY-MM-DD
  createdAt: Date;
}

export interface Local {
  id: number;
  nome: string;
  createdAt: Date;
  updatedAt: Date;
}

export type AulaStatus = 'Ativa' | 'Chuva' | 'Feriado' | 'Sem Aluno' | 'Final de Ano';

export interface Aula {
  id: number;
  atividade: string;
  horario: string;
  dia: string;
  localId: number;
  faixaEtaria: string;
  categoria: string;
  professorId: number;
  tipoContrato: string;
  turno: string;
  status: AulaStatus;
  createdAt: Date;
  updatedAt: Date;
  local?: Local;
  professor?: Professor;
}

export interface AulasStats {
  totalAulas: number;
  totalProfessores: number;
  totalCLT: number;
  totalTerceiros: number;
  totalLocais: number;
  totalModalidades: number;
  aulasManha: number;
  aulasTarde: number;
  aulasNoite: number;
  aulasAdulto: number;
  aulasInfantilTeen: number;
  porDia: Record<string, number>;
  porTurno: Record<string, number>;
  porCategoria: Record<string, number>;
  porContrato: Record<string, number>;
  porStatus: Record<string, number>;
  rankingLocais: { nome: string; total: number }[];
  rankingModalidades: { nome: string; total: number }[];
}

export interface FrequenciaAulas {
  id: number;
  aulaId: number;
  quantidadePresentes: number;
  data: string; // ISO string YYYY-MM-DD
  horario: string; // HH:mm
  createdAt: Date;
}

export interface FrequenciaKids {
  id: number;
  numeroSocio: string;
  nomeAluno: string;
  idade: number;
  acompanhado: boolean;
  data: string; // ISO string YYYY-MM-DD
  createdAt: Date;
}

export interface MembersData {
  [numeroSocio: string]: string[];
}

export interface MemberEntry {
  id: number;
  numeroSocio: string;
  nomes: string[];
  createdAt: Date;
  updatedAt: Date;
}
