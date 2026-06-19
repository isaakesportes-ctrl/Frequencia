import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import bcrypt from 'bcryptjs';
import { Aula, Professor, Local, AulasStats, User, AulaPresenca, FrequenciaAulas, FrequenciaKids, Socio, MemberEntry, MembersData } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SPREADSHEET_PATH = path.resolve(process.cwd(), 'grade.xlsx');
const DB_PATH = path.resolve(process.cwd(), 'data.json');

// Database type definitions
interface DatabaseData {
  users: (User & { approved: boolean; function?: string; password?: string })[];
  pendingAccessRequests: { id: number; name: string; password: string; role: 'user' | 'admin' | 'monitor' | 'aprendiz'; function: string; requestedAt: string }[];
  editedProfessorNames: Record<number, string>;
  editedProfessorTipoContrato: Record<number, string>;
  userRoles: Record<number, 'user' | 'admin' | 'monitor' | 'aprendiz'>;
  userPasswords: Record<number, string>;
  manualAulas: Record<number, Aula>;
  presencas: AulaPresenca[];
  frequenciaAulas: FrequenciaAulas[];
  frequenciaKids: FrequenciaKids[];
  members: MemberEntry[];
  auditLog: { id: number; action: string; userId: number | null; details: any; createdAt: string }[];
  counters: {
    manualAula: number;
    presenca: number;
    frequenciaAula: number;
    frequenciaKid: number;
    member: number;
    accessRequest: number;
    auditLog: number;
  };
}

// Initialize database
const defaultData: DatabaseData = {
  users: [],
  pendingAccessRequests: [],
  editedProfessorNames: {},
  editedProfessorTipoContrato: {},
  userRoles: {},
  userPasswords: {},
  manualAulas: {},
  presencas: [],
  frequenciaAulas: [],
  frequenciaKids: [],
  members: [],
  auditLog: [],
  counters: {
    manualAula: 10000,
    presenca: 1,
    frequenciaAula: 1,
    frequenciaKid: 1,
    member: 1,
    accessRequest: 1,
    auditLog: 1
  }
};

const adapter = new JSONFile<DatabaseData>(DB_PATH);
const db = new Low<DatabaseData>(adapter, defaultData);
await db.read();

// Cache for spreadsheet data
let cachedAulas: Aula[] = [];
let cachedProfessores: Professor[] = [];
let cachedLocais: Local[] = [];
let lastReadTime = 0; // Force sync now

// Helper functions
const safeSplit = (val: any, separator: string) => String(val || "").split(separator);

const logAudit = async (action: string, userId: number | null, details: any) => {
  await db.read();
  const logEntry = {
    id: db.data.counters.auditLog++,
    action,
    userId,
    details,
    createdAt: new Date().toISOString()
  };
  db.data.auditLog.push(logEntry);
  await db.write();
};

const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

const ensureAdminExists = async () => {
  await db.read();
  const adminExists = db.data.users.some(u => u.openId === 'mock-user-admin');
  if (!adminExists) {
    const hashedPassword = await hashPassword('ESP2026');
    const now = new Date().toISOString();
    db.data.users.push({
      id: 1,
      openId: 'mock-user-admin',
      name: 'Departamento de Esportes',
      email: null,
      password: hashedPassword,
      role: 'admin',
      loginMethod: 'password',
      approved: true,
      createdAt: new Date(now),
      updatedAt: new Date(now),
      lastSignedIn: new Date(now)
    });
    await db.write();
    await logAudit('CREATE_ADMIN', null, { name: 'Departamento de Esportes' });
  }
};
await ensureAdminExists();

const syncFromSpreadsheet = async () => {
  const now = Date.now();
  console.log(`[Spreadsheet] Checking sync, lastReadTime: ${lastReadTime}, now: ${now}`);
  if (now - lastReadTime < 30000) {
    console.log(`[Spreadsheet] Skipping sync, last read was ${now - lastReadTime}ms ago (< 30s)`);
    return;
  }

  try {
    console.log(`[Spreadsheet] Trying to read file at ${SPREADSHEET_PATH}`);
    if (!fs.existsSync(SPREADSHEET_PATH)) {
      console.warn(`[Spreadsheet] File not found at ${SPREADSHEET_PATH}`);
      return;
    }

    const workbook = XLSX.readFile(SPREADSHEET_PATH);
    const sheetName = workbook.SheetNames[0];
    console.log(`[Spreadsheet] Using sheet: ${sheetName}`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`[Spreadsheet] Read ${data.length} rows from sheet`);
    if (data.length > 0) {
      console.log(`[Spreadsheet] First row:`, JSON.stringify(data[0], null, 2));
      if (data.length > 1) {
        console.log(`[Spreadsheet] Second row:`, JSON.stringify(data[1], null, 2));
      }
    }

    const newAulas: Aula[] = [];
    const newProfessoresMap = new Map<string, number>();
    const newProfessoresContrato = new Map<number, string>();
    const newLocaisMap = new Map<string, number>();
    let profCounter = 1;
    let localCounter = 1;

    await db.read();

    data.forEach((row: any, index: number) => {
      const {
        Atividade: atividade,
        "Horário": horario,
        Dia: diaRaw,
        Local: localNome,
        "Faixa Etária": faixaEtaria,
        Categoria: categoria,
        Professor: professorNome,
        "Tipo Contrato": tipoContrato,
        Turno: turnoRaw
      } = row;

      if (!atividade || !horario || !diaRaw) return;

      if (!newLocaisMap.has(localNome)) {
        newLocaisMap.set(localNome, localCounter++);
      }
      const localId = newLocaisMap.get(localNome)!;

      if (!professorNome) return;

      if (!newProfessoresMap.has(professorNome)) {
        newProfessoresMap.set(professorNome, profCounter++);
      }
      const professorId = newProfessoresMap.get(professorNome)!;
      // Initialize editedProfessorNames and editedProfessorTipoContrato if they don't exist
      if (!db.data.editedProfessorNames) db.data.editedProfessorNames = {};
      if (!db.data.editedProfessorTipoContrato) db.data.editedProfessorTipoContrato = {};
      const finalProfessorNome = db.data.editedProfessorNames[professorId] || professorNome;
      const finalTipoContrato = db.data.editedProfessorTipoContrato[professorId] || String(tipoContrato || 'N/A');

      if (!newProfessoresContrato.has(professorId)) {
        newProfessoresContrato.set(professorId, finalTipoContrato);
      }

      // Normalize time format
      let formattedHorario = String(horario).trim();
      const serialTime = parseFloat(formattedHorario);
      if (!isNaN(serialTime) && serialTime >= 0 && serialTime < 1) {
        const totalMinutes = Math.round(serialTime * 24 * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        formattedHorario = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else if (/^\d{1,2}$/.test(formattedHorario)) {
        formattedHorario = `${formattedHorario.padStart(2, '0')}:00`;
      } else if (/^\d{1,2}:\d{2}$/.test(formattedHorario)) {
        formattedHorario = safeSplit(formattedHorario, ':').map(p => p.padStart(2, '0')).join(':');
      }

      let turno = turnoRaw;
      if (!turno && formattedHorario.includes(':')) {
        const hour = parseInt(safeSplit(formattedHorario, ':')[0]);
        if (hour < 12) turno = 'Manhã';
        else if (hour < 18) turno = 'Tarde';
        else turno = 'Noite';
      } else if (!turno) {
        turno = 'Manhã';
      }

      let normalizedDia = String(diaRaw).charAt(0).toUpperCase() + String(diaRaw).slice(1).toLowerCase();
      normalizedDia = normalizedDia.replace('-feira', '');
      const normalizedTurno = turno.charAt(0).toUpperCase() + turno.slice(1).toLowerCase();

      const aulaId = index + 1;
      const manualAula = db.data.manualAulas[aulaId];

      const newAula = manualAula || {
        id: aulaId,
        atividade: String(atividade),
        horario: formattedHorario,
        dia: normalizedDia,
        localId,
        faixaEtaria: String(faixaEtaria),
        categoria,
        professorId,
        tipoContrato: String(tipoContrato || 'N/A'),
        turno: normalizedTurno,
        status: 'Ativa',
        createdAt: new Date(),
        updatedAt: new Date(),
        local: { id: localId, nome: String(localNome), createdAt: new Date(), updatedAt: new Date() },
        professor: { id: professorId, nome: String(finalProfessorNome), createdAt: new Date(), updatedAt: new Date() }
      };
      newAulas.push(newAula);
      console.log(`[Spreadsheet] Added aula ${index + 1}:`, newAula.atividade);
    });

    // Add manual aulas
    Object.entries(db.data.manualAulas).forEach(([id, aula]) => {
      const numId = parseInt(id);
      if (numId >= 10000) {
        newAulas.push(aula);
      }
    });

    cachedAulas = newAulas;
    cachedProfessores = Array.from(newProfessoresMap.entries()).map(([nome, id]) => ({
      id,
      nome: db.data.editedProfessorNames[id] || nome,
      tipoContrato: db.data.editedProfessorTipoContrato[id] || newProfessoresContrato.get(id) || 'N/A',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    cachedLocais = Array.from(newLocaisMap.entries()).map(([nome, id]) => ({
      id,
      nome,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    lastReadTime = now;
    console.log(`[Spreadsheet] Synced ${cachedAulas.length} aulas from grade.xlsx`);
  } catch (error) {
    console.error('[Spreadsheet] Error reading spreadsheet:', error);
  }
};

export async function getUsers() {
  await syncFromSpreadsheet();
  await db.read();
  
  const users = [...db.data.users];

  cachedProfessores.forEach(prof => {
    const isAlreadyUser = users.some(u => u.openId === `prof-${prof.id}`);
    if (!isAlreadyUser) {
      const id = prof.id + 1000;
      const defaultPass = safeSplit(prof.nome || "usuario", " ")[0].toLowerCase();
      const password = db.data.userPasswords[id] || defaultPass;
      const role = db.data.userRoles[id] || "user";

      users.push({
        id,
        openId: `prof-${prof.id}`,
        name: db.data.editedProfessorNames[prof.id] || prof.nome || "Usuário",
        email: null,
        password,
        role,
        loginMethod: "password",
        approved: true,
        createdAt: prof.createdAt || new Date(),
        updatedAt: prof.updatedAt || new Date(),
        lastSignedIn: prof.updatedAt || new Date()
      });
    }
  });

  return users;
}

export async function updateUserRole(id: number, newRole: 'user' | 'admin' | 'monitor') {
  if (id === 1) return { success: false, error: "Não é possível alterar o cargo do Master" };

  await db.read();
  const userIndex = db.data.users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    db.data.users[userIndex].role = newRole;
    db.data.users[userIndex].updatedAt = new Date();
  }
  db.data.userRoles[id] = newRole;
  await db.write();
  await logAudit('UPDATE_USER_ROLE', id, { newRole });
  return { success: true };
}

export async function updateUserName(id: number, newName: string) {
  await db.read();
  const userIndex = db.data.users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    db.data.users[userIndex].name = newName;
    db.data.users[userIndex].updatedAt = new Date();
  }

  if (id > 1000) {
    const profId = id - 1000;
    db.data.editedProfessorNames[profId] = newName;
    // Update cache immediately
    cachedProfessores = cachedProfessores.map(p => p.id === profId ? { ...p, nome: newName } : p);
    cachedAulas = cachedAulas.map(a => a.professorId === profId ? { ...a, professor: { ...a.professor!, nome: newName } } : a);
  }

  await db.write();
  await logAudit('UPDATE_USER_NAME', id, { newName });
  return { success: true };
}

export async function updateUserPassword(id: number, newPassword: string) {
  const hashedPassword = await hashPassword(newPassword);
  await db.read();
  const userIndex = db.data.users.findIndex(u => u.id === id);
  if (userIndex !== -1) {
    db.data.users[userIndex].password = hashedPassword;
    db.data.users[userIndex].updatedAt = new Date();
  }
  db.data.userPasswords[id] = hashedPassword;
  await db.write();
  await logAudit('UPDATE_USER_PASSWORD', id, {});
  return { success: true };
}

export async function updateProfessorTipoContrato(professorId: number, tipoContrato: string) {
  await db.read();
  db.data.editedProfessorTipoContrato[professorId] = tipoContrato;
  await db.write();
  await logAudit('UPDATE_PROFESSOR_TIPO_CONTRATO', null, { professorId, tipoContrato });
  lastReadTime = 0;
  return { success: true };
}

export async function deleteUser(id: number) {
  if (id === 1) throw new Error("O administrador principal não pode ser removido");
  await db.read();
  db.data.users = db.data.users.filter(u => u.id !== id);
  await db.write();
  await logAudit('DELETE_USER', id, {});
  return true;
}

export async function createUser(data: Partial<User>) {
  await db.read();
  const maxId = Math.max(0, ...db.data.users.map(u => u.id));
  const id = maxId + 1;
  const defaultPassword = '123456';
  const hashedPassword = await hashPassword(defaultPassword);
  const now = new Date().toISOString();

  const newUser: User & { approved: boolean } = {
    id,
    openId: String(id),
    name: data.name || "Novo Usuário",
    email: null,
    role: data.role === "admin" ? "admin" : (data.role === "monitor" ? "monitor" : "user"),
    loginMethod: "password",
    approved: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date()
  };

  db.data.users.push({ ...newUser, password: hashedPassword });
  await db.write();
  await logAudit('CREATE_USER', id, { name: newUser.name });
  return newUser;
}

export async function getAulas(filters?: { dia?: string; turno?: string; categoria?: string; professorId?: number; localId?: number; search?: string }) {
  await syncFromSpreadsheet();
  let result = [...cachedAulas];

  if (filters) {
    if (filters.dia && filters.dia !== 'all') result = result.filter(a => a.dia === filters.dia);
    if (filters.turno && filters.turno !== 'all') result = result.filter(a => a.turno === filters.turno);
    if (filters.categoria && filters.categoria !== 'all') result = result.filter(a => a.categoria === filters.categoria);
    if (filters.professorId) result = result.filter(a => a.professorId === filters.professorId);
    if (filters.localId) result = result.filter(a => a.localId === filters.localId);
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(a => 
        String(a.atividade || "").toLowerCase().includes(search) ||
        String(a.faixaEtaria || "").toLowerCase().includes(search) ||
        String(a.professor?.nome || "").toLowerCase().includes(search) ||
        String(a.local?.nome || "").toLowerCase().includes(search)
      );
    }
  }
  return result;
}

export async function getAllAulas() { return getAulas(); }
export async function getAulasByFilters(filters: any) { return getAulas(filters); }
export async function searchAulas(query: string) { return getAulas({ search: query }); }
export async function getAulaById(id: number) {
  await syncFromSpreadsheet();
  return cachedAulas.find(a => a.id === id);
}

export async function getAllProfessores() {
  await syncFromSpreadsheet();
  await db.read();
  return cachedProfessores.map(prof => {
    const id = prof.id + 1000;
    const defaultPass = safeSplit(prof.nome || "professor", " ")[0].toLowerCase();
    return {
      ...prof,
      password: db.data.userPasswords[id] || defaultPass,
      role: db.data.userRoles[id] || "user"
    };
  });
}

export async function getProfessorById(id: number) {
  await syncFromSpreadsheet();
  return cachedProfessores.find(p => p.id === id);
}

export async function getProfessorAulas(professorId: number) {
  await syncFromSpreadsheet();
  return cachedAulas.filter(a => a.professorId === professorId);
}

export async function getAllLocais() {
  await syncFromSpreadsheet();
  return cachedLocais;
}

export async function getLocalById(id: number) {
  await syncFromSpreadsheet();
  return cachedLocais.find(l => l.id === id);
}

export async function getAulasStats(): Promise<AulasStats> {
  await syncFromSpreadsheet();

  const stats: AulasStats = {
    totalAulas: cachedAulas.length,
    totalProfessores: cachedProfessores.length,
    totalCLT: 0,
    totalTerceiros: 0,
    totalLocais: cachedLocais.length,
    totalModalidades: 0,
    aulasManha: 0,
    aulasTarde: 0,
    aulasNoite: 0,
    aulasAdulto: 0,
    aulasInfantilTeen: 0,
    porDia: {},
    porTurno: {},
    porCategoria: {},
    porContrato: {},
    porStatus: {},
    rankingLocais: [],
    rankingModalidades: []
  };

  const locaisCount: Record<string, number> = {};
  const modalidadesCount: Record<string, number> = {};
  const professoresContrato = new Map<number, string>();
  const modalidadesSet = new Set<string>();

  cachedAulas.forEach(aula => {
    stats.porDia[aula.dia] = (stats.porDia[aula.dia] || 0) + 1;
    stats.porTurno[aula.turno] = (stats.porTurno[aula.turno] || 0) + 1;
    stats.porCategoria[aula.categoria] = (stats.porCategoria[aula.categoria] || 0) + 1;
    stats.porContrato[aula.tipoContrato] = (stats.porContrato[aula.tipoContrato] || 0) + 1;
    stats.porStatus[aula.status || 'Ativa'] = (stats.porStatus[aula.status || 'Ativa'] || 0) + 1;

    if (aula.turno === 'Manhã') stats.aulasManha++;
    else if (aula.turno === 'Tarde') stats.aulasTarde++;
    else if (aula.turno === 'Noite') stats.aulasNoite++;

    if (aula.categoria === 'Adulto') stats.aulasAdulto++;
    else if (aula.categoria === 'Infantil-Teen') stats.aulasInfantilTeen++;

    const localNome = aula.local?.nome || 'Desconhecido';
    locaisCount[localNome] = (locaisCount[localNome] || 0) + 1;
    modalidadesCount[aula.atividade] = (modalidadesCount[aula.atividade] || 0) + 1;
    modalidadesSet.add(aula.atividade);

    if (aula.professorId) {
      professoresContrato.set(aula.professorId, aula.tipoContrato);
    }
  });

  stats.totalModalidades = modalidadesSet.size;
  professoresContrato.forEach(tipo => {
    if (tipo.toUpperCase().includes('CLT')) stats.totalCLT++;
    else if (tipo.toUpperCase().includes('TERC')) stats.totalTerceiros++;
  });

  stats.rankingLocais = Object.entries(locaisCount)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  stats.rankingModalidades = Object.entries(modalidadesCount)
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return stats;
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  await syncFromSpreadsheet();
  await db.read();
  let user = db.data.users.find(u => u.openId === openId);
  if (user) return user;

  const users = await getUsers();
  return users.find(u => u.openId === openId);
}

export async function upsertUser(data: Partial<User> & { openId: string }): Promise<User> {
  await db.read();
  const existing = db.data.users.find(u => u.openId === data.openId);
  if (existing) {
    const role = (existing.id === 1 || data.role === "admin") ? "admin" : (data.role === "monitor" ? "monitor" : "user");
    const updated = { ...existing, ...data, role, updatedAt: new Date(), email: null };
    const idx = db.data.users.findIndex(u => u.id === existing.id);
    db.data.users[idx] = updated;
    await db.write();
    await logAudit('UPDATE_USER', existing.id, {});
    return updated;
  }

  const maxId = Math.max(0, ...db.data.users.map(u => u.id));
  const id = maxId + 1;
  const defaultPassword = '123456';
  const hashedPassword = await hashPassword(defaultPassword);
  const now = new Date();

  const newUser: User & { approved: boolean } = {
    ...data,
    id,
    openId: data.openId,
    name: data.name || "Usuário",
    email: null,
    loginMethod: data.loginMethod || "password",
    role: (data.role === "admin" ? "admin" : (data.role === "monitor" ? "monitor" : "user")) as any,
    approved: true,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now
  };

  db.data.users.push({ ...newUser, password: hashedPassword });
  await db.write();
  await logAudit('CREATE_USER', id, { name: newUser.name });
  return newUser;
}

export async function createAula(data: Partial<Aula>) {
  await db.read();
  const id = db.data.counters.manualAula++;
  const novaAula: Aula = {
    id,
    atividade: data.atividade || "Nova Atividade",
    horario: data.horario || "00:00",
    dia: data.dia || "Segunda",
    localId: data.localId || 1,
    faixaEtaria: data.faixaEtaria || "Livre",
    categoria: data.categoria || "Adulto",
    professorId: data.professorId || 1,
    tipoContrato: data.tipoContrato || "CLT",
    turno: data.turno || "Manhã",
    status: data.status || "Ativa",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data
  };

  const prof = cachedProfessores.find(p => p.id === novaAula.professorId);
  const local = cachedLocais.find(l => l.id === novaAula.localId);
  novaAula.professor = prof ? { ...prof } : undefined;
  novaAula.local = local ? { ...local } : undefined;

  db.data.manualAulas[id] = novaAula;
  await db.write();
  lastReadTime = 0;
  await logAudit('CREATE_AULA', null, { atividade: novaAula.atividade });
  return novaAula;
}

export async function updateAula(id: number, data: Partial<Aula>) {
  await syncFromSpreadsheet();
  const existing = cachedAulas.find(a => a.id === id);
  if (!existing) throw new Error("Aula não encontrada");

  const updated: Aula = { ...existing, ...data, updatedAt: new Date() };

  if (data.professorId) {
    const prof = cachedProfessores.find(p => p.id === data.professorId);
    updated.professor = prof ? { ...prof } : undefined;
  }
  if (data.localId) {
    const local = cachedLocais.find(l => l.id === data.localId);
    updated.local = local ? { ...local } : undefined;
  }

  await db.read();
  db.data.manualAulas[id] = updated;
  await db.write();
  lastReadTime = 0;
  await logAudit('UPDATE_AULA', null, { aulaId: id });
  return updated;
}

export async function deleteAula(id: number) {
  await db.read();
  delete db.data.manualAulas[id];
  await db.write();
  lastReadTime = 0;
  await logAudit('DELETE_AULA', null, { aulaId: id });
  return { success: true };
}

export async function createProfessor() { throw new Error("Operação não permitida em modo Planilha"); }
export async function createLocal() { throw new Error("Operação não permitida em modo Planilha"); }

export async function registrarPresenca(data: { aulaId: number; socioNome: string; socioMatricula: string; data: string }) {
  await db.read();
  const novaPresenca: AulaPresenca = {
    id: db.data.counters.presenca++,
    ...data,
    createdAt: new Date()
  };
  db.data.presencas.push(novaPresenca);
  await db.write();
  await logAudit('REGISTRAR_PRESENCA', null, { aulaId: data.aulaId });
  return novaPresenca;
}

export async function getPresencasByAula(aulaId: number, data: string) {
  await db.read();
  return db.data.presencas.filter(p => p.aulaId === aulaId && p.data === data);
}

export async function removerPresenca(id: number) {
  await db.read();
  db.data.presencas = db.data.presencas.filter(p => p.id !== id);
  await db.write();
  await logAudit('REMOVER_PRESENCA', null, { presencaId: id });
  return { success: true };
}

export async function loginWithNameAndPassword(name: string, password: string) {
  await syncFromSpreadsheet();
  const users = await getUsers();
  const user = users.find(u => u.name?.toLowerCase() === name.toLowerCase());
  if (!user) return { success: false, error: "Usuário não encontrado" };

  if (user.id !== 1 && !(user as any).approved) {
    return { success: false, error: "Acesso pendente de aprovação" };
  }

  await db.read();
  const userFromDB = db.data.users.find(u => u.id === user.id);
  let passwordValid = false;

  if (userFromDB && userFromDB.password) {
    passwordValid = await verifyPassword(password, userFromDB.password);
  } else {
    const defaultPass = safeSplit(user.name || "", " ")[0]?.toLowerCase() || "123";
    if (password === defaultPass || password === user.password) {
      passwordValid = true;
      const hashedPassword = await hashPassword(password);
      if (userFromDB) {
        const idx = db.data.users.findIndex(u => u.id === user.id);
        db.data.users[idx].password = hashedPassword;
        db.data.users[idx].updatedAt = new Date();
      } else {
        db.data.userPasswords[user.id] = hashedPassword;
      }
      await db.write();
    }
  }

  if (!passwordValid) return { success: false, error: "Senha incorreta" };
  await logAudit('LOGIN', user.id, { name: user.name });
  return { success: true, user };
}

export async function requestAccess(name: string, password: string, role: 'user' | 'admin' | 'monitor', userFunction: string) {
  await db.read();
  const hashedPassword = await hashPassword(password);
  const request = {
    id: db.data.counters.accessRequest++,
    name,
    password: hashedPassword,
    role,
    function: userFunction,
    requestedAt: new Date().toISOString()
  };
  db.data.pendingAccessRequests.push(request);
  await db.write();
  await logAudit('REQUEST_ACCESS', null, { name });
  return { success: true, id: request.id };
}

export async function getPendingAccessRequests() {
  await db.read();
  return db.data.pendingAccessRequests.map(r => ({
    ...r,
    requestedAt: new Date(r.requestedAt)
  }));
}

export async function approveAccess(requestId: number, updates?: { name?: string; password?: string; role?: 'user' | 'admin' | 'monitor'; function?: string }) {
  await db.read();
  const request = db.data.pendingAccessRequests.find(r => r.id === requestId);
  if (!request) return { success: false, error: "Solicitação não encontrada" };

  const maxId = Math.max(0, ...db.data.users.map(u => u.id));
  const id = maxId + 1;
  const finalPassword = updates?.password ? await hashPassword(updates.password) : request.password;
  const now = new Date();

  const newUser: User & { approved: boolean; function?: string } = {
    id,
    openId: `user-${id}`,
    name: updates?.name || request.name,
    email: null,
    password: finalPassword,
    role: updates?.role || request.role,
    loginMethod: "password",
    approved: true,
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    function: updates?.function || request.function
  };

  db.data.users.push(newUser);
  db.data.pendingAccessRequests = db.data.pendingAccessRequests.filter(r => r.id !== requestId);
  await db.write();
  await logAudit('APPROVE_ACCESS', id, { name: newUser.name });
  return { success: true, user: newUser };
}

export async function rejectAccess(requestId: number) {
  await db.read();
  db.data.pendingAccessRequests = db.data.pendingAccessRequests.filter(r => r.id !== requestId);
  await db.write();
  await logAudit('REJECT_ACCESS', null, { requestId });
  return { success: true };
}

export async function registrarFrequenciaAulas(data: { aulaId: number; quantidadePresentes: number; data: string; horario: string }) {
  await db.read();
  const novaFrequencia: FrequenciaAulas = {
    id: db.data.counters.frequenciaAula++,
    ...data,
    createdAt: new Date()
  };
  db.data.frequenciaAulas.push(novaFrequencia);
  await db.write();
  await logAudit('REGISTRAR_FREQUENCIA_AULAS', null, { aulaId: data.aulaId });
  return novaFrequencia;
}

export async function getFrequenciaAulasByDateAndHorario(data: string, horario: string) {
  await db.read();
  return db.data.frequenciaAulas.filter(f => f.data === data && f.horario === horario);
}

export async function getAllFrequenciaAulas() {
  await db.read();
  return db.data.frequenciaAulas;
}

export async function registrarFrequenciaKids(data: { numeroSocio: string; nomeAluno: string; idade: number; acompanhado: boolean; data: string }) {
  await db.read();
  const novaFrequencia: FrequenciaKids = {
    id: db.data.counters.frequenciaKid++,
    ...data,
    createdAt: new Date()
  };
  db.data.frequenciaKids.push(novaFrequencia);
  await db.write();
  await logAudit('REGISTRAR_FREQUENCIA_KIDS', null, { nomeAluno: data.nomeAluno });
  return novaFrequencia;
}

export async function getFrequenciaKidsByDate(data: string) {
  await db.read();
  return db.data.frequenciaKids.filter(f => f.data === data);
}

export async function getAllFrequenciaKids() {
  await db.read();
  return db.data.frequenciaKids;
}

export async function getSocioByMatricula(matricula: string): Promise<Socio | null> {
  await db.read();
  const member = db.data.members.find(m => m.numeroSocio === matricula);
  if (member && member.nomes.length > 0) {
    return { id: member.id, nome: member.nomes[0], matricula: member.numeroSocio };
  }
  const socios: Socio[] = [
    { id: 1, nome: "João Silva", matricula: "12345" },
    { id: 2, nome: "Maria Santos", matricula: "67890" },
    { id: 3, nome: "Pedro Costa", matricula: "11111" }
  ];
  return socios.find(s => s.matricula === matricula) || null;
}

export async function uploadMembers(data: MembersData) {
  await db.read();
  db.data.members = [];
  db.data.counters.member = 1;
  const now = new Date().toISOString();
  const members: MemberEntry[] = [];

  Object.entries(data).forEach(([numeroSocio, nomes]) => {
    const member = {
      id: db.data.counters.member++,
      numeroSocio,
      nomes,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
    members.push(member);
    db.data.members.push(member);
  });

  await db.write();
  await logAudit('UPLOAD_MEMBERS', null, { count: members.length });
  return { success: true, totalMembers: members.length, members };
}

export async function getMembers() {
  await db.read();
  return db.data.members;
}

export async function getMemberByNumero(numeroSocio: string) {
  await db.read();
  return db.data.members.find(m => m.numeroSocio === numeroSocio) || null;
}

export async function clearMembers() {
  await db.read();
  db.data.members = [];
  db.data.counters.member = 1;
  await db.write();
  await logAudit('CLEAR_MEMBERS', null, {});
  return { success: true };
}
