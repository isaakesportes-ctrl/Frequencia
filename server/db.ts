import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Aula, Professor, Local, AulasStats, User, AulaPresenca } from "../shared/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SPREADSHEET_PATH = path.resolve(process.cwd(), 'grade.xlsx');

if (process.env.VERCEL) {
  if (fs.existsSync(SPREADSHEET_PATH)) {
    console.log(`[DB] Found spreadsheet at ${SPREADSHEET_PATH}`);
  } else {
    console.error(`[DB] Spreadsheet NOT FOUND at ${SPREADSHEET_PATH}`);
    // Check if it's in the same directory as the bundled file
    const altPath = path.resolve(__dirname, '..', '..', 'grade.xlsx');
    console.log(`[DB] Checking alternative path: ${altPath}`);
    if (fs.existsSync(altPath)) {
      console.log(`[DB] Found spreadsheet at alternative path!`);
    }
  }
}

let cachedAulas: Aula[] = [];
let cachedProfessores: Professor[] = [];
let cachedLocais: Local[] = [];
let lastReadTime = 0;

// Armazenamento de presenças (em memória para este exemplo)
let presencas: AulaPresenca[] = [];
let presencaCounter = 1;

// Mock user storage for development
const mockUsers = new Map<number, User>([
  [1, { 
    id: 1, 
    openId: "mock-user-admin", 
    name: "Departamento de Esportes", 
    email: null, 
    password: "ESP2026", // Senha padrão do Master
    role: "admin", // Nível MASTER visualmente
    loginMethod: "mock",
    createdAt: new Date(), 
    updatedAt: new Date(), 
    lastSignedIn: new Date() 
  }],
]);

// Armazenamento persistente de senhas em memória (em um sistema real seria um BD)
const userPasswords = new Map<number, string>();
// Armazenamento de nomes editados (para sobrescrever o que vem da planilha)
const editedProfessorNames = new Map<number, string>();
// Armazenamento de cargos editados
const userRoles = new Map<number, "user" | "admin" | "monitor">();

// Armazenamento de aulas criadas/editadas manualmente
let manualAulas = new Map<number, Aula>();
let manualAulaCounter = 10000; // Começa alto para não conflitar com planilha

const safeSplit = (val: any, separator: string) => String(val || "").split(separator);

export async function getUsers() {
  try {
    await syncFromSpreadsheet();
    const users = Array.from(mockUsers.values());
    
    // Add professors who are not already in mockUsers
    cachedProfessores.forEach(prof => {
      const isAlreadyUser = users.some(u => u.name === prof.nome || u.openId === `prof-${prof.id}`);
      if (!isAlreadyUser) {
        const id = prof.id + 1000;
        // Senha padrão: primeiro nome em minúsculo ou "123"
        const defaultPass = safeSplit(prof.nome || "usuario", " ")[0].toLowerCase();
        
        users.push({
          id,
          openId: `prof-${prof.id}`,
          name: editedProfessorNames.get(prof.id) || prof.nome || "Usuário",
          email: null,
          password: userPasswords.get(id) || defaultPass,
          role: userRoles.get(id) || "user",
          loginMethod: "password",
          createdAt: prof.createdAt || new Date(),
          updatedAt: prof.updatedAt || new Date(),
          lastSignedIn: prof.updatedAt || new Date()
        });
      }
    });
    
    // Adiciona senhas para usuários que já estão no mockUsers (exceto Master que já tem)
    return users.map(u => {
      const profIdMatch = u.openId?.match(/^prof-(\d+)$/);
      const displayName = profIdMatch ? (editedProfessorNames.get(parseInt(profIdMatch[1])) || u.name) : u.name;
      const role = userRoles.get(u.id) || u.role;
      
      // Se o nome no mockUsers for diferente do displayName (nome editado), atualiza o mockUsers
      if (u.id < 1000 && u.name !== displayName) {
        mockUsers.set(u.id, { ...u, name: displayName || u.name });
      }
      
      return {
        ...u,
        name: displayName || "Usuário",
        role: u.id === 1 ? "admin" : (role || "user"),
        password: u.id === 1 ? u.password : (userPasswords.get(u.id) || u.password || safeSplit(u.name || "", " ")[0]?.toLowerCase() || "123")
      };
    });
  } catch (error) {
    console.error("[getUsers] Error:", error);
    return [];
  }
}

export async function updateUserRole(id: number, newRole: "user" | "admin" | "monitor") {
  if (id === 1) return { success: false, error: "Não é possível alterar o cargo do Master" };
  
  const user = Array.from(mockUsers.values()).find(u => u.id === id);
  if (user) {
    mockUsers.set(user.id, { ...user, role: newRole, updatedAt: new Date() });
  }
  userRoles.set(id, newRole);
  return { success: true };
}

export async function updateUserName(id: number, newName: string) {
  const user = Array.from(mockUsers.values()).find(u => u.id === id);
  if (user) {
    mockUsers.set(user.id, { ...user, name: newName, updatedAt: new Date() });
  }
  
  // Se for um professor (ID > 1000), salvar no mapa de nomes editados
  if (id > 1000) {
    const profId = id - 1000;
    editedProfessorNames.set(profId, newName);
    
    // Atualiza o cache de aulas e professores para refletir imediatamente
    cachedProfessores = cachedProfessores.map(p => p.id === profId ? { ...p, nome: newName } : p);
    cachedAulas = cachedAulas.map(a => a.professorId === profId ? { ...a, professor: { ...a.professor!, nome: newName } } : a);
  }
  
  return { success: true };
}

export async function updateUserPassword(id: number, newPassword: string) {
  const user = Array.from(mockUsers.values()).find(u => u.id === id);
  if (user) {
    user.password = newPassword;
    mockUsers.set(user.id, { ...user, updatedAt: new Date() });
  }
  userPasswords.set(id, newPassword);
  return { success: true };
}

export async function deleteUser(id: number) {
  if (id === 1) throw new Error("O administrador principal não pode ser removido.");
  return mockUsers.delete(id);
}

export async function createUser(data: Partial<User>) {
  const id = Math.max(0, ...Array.from(mockUsers.keys())) + 1;
  const newUser: User = {
    id,
    openId: String(id),
    name: data.name || "Novo Usuário",
    email: null,
    role: data.role === "admin" ? "admin" : (data.role === "monitor" ? "monitor" : "user"),
    loginMethod: "password",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  mockUsers.set(id, newUser);
  return newUser;
}

async function syncFromSpreadsheet() {
  const now = Date.now();
  if (now - lastReadTime < 30000) return; // Cache por 30 segundos

  try {
    if (!fs.existsSync(SPREADSHEET_PATH)) {
      console.warn(`[Spreadsheet] File not found at ${SPREADSHEET_PATH}`);
      return;
    }

    const workbook = XLSX.readFile(SPREADSHEET_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const newAulas: Aula[] = [];
    const newProfessoresMap = new Map<string, number>();
    const newLocaisMap = new Map<string, number>();
    let profCounter = 1;
    let localCounter = 1;

    data.forEach((row: any, index: number) => {
      const {
        Atividade: atividade,
        Horário: horario,
        Dia: diaRaw,
        Local: localNome,
        'Faixa Etária': faixaEtaria,
        Categoria: categoria,
        Professor: professorNome,
        'Tipo de Contrato': tipoContrato,
        Turno: turnoRaw
      } = row;

      if (!atividade || !horario || !diaRaw) return;

      if (!newLocaisMap.has(localNome)) {
        newLocaisMap.set(localNome, localCounter++);
      }
      const localId = newLocaisMap.get(localNome)!;

      if (!professorNome) {
        // Ignora ou trata professor sem nome
        return;
      }

      if (!newProfessoresMap.has(professorNome)) {
        newProfessoresMap.set(professorNome, profCounter++);
      }
      const professorId = newProfessoresMap.get(professorNome)!;
      const finalProfessorNome = editedProfessorNames.get(professorId) || professorNome;

      // Normalize time format to HH:mm
      let formattedHorario = String(horario).trim();
      if (/^\d{1,2}$/.test(formattedHorario)) {
        formattedHorario = `${formattedHorario.padStart(2, '0')}:00`;
      } else if (/^\d{1,2}:\d{2}$/.test(formattedHorario)) {
        formattedHorario = safeSplit(formattedHorario, ':').map(p => p.padStart(2, '0')).join(':');
      }

      // Determine shift if not provided
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

      // Check if this aula was manually edited
      const manualId = index + 1;
      const manualEdit = manualAulas.get(manualId);

      newAulas.push(manualEdit || {
        id: manualId,
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
      });
    });

    // Add completely new manual aulas
    manualAulas.forEach((aula, id) => {
      if (id >= 10000) {
        newAulas.push(aula);
      }
    });

    cachedAulas = newAulas;
    cachedProfessores = Array.from(newProfessoresMap.entries()).map(([nome, id]) => ({
      id,
      nome: editedProfessorNames.get(id) || nome,
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
}

export async function getAulas(filters?: {
  dia?: string;
  turno?: string;
  categoria?: string;
  professorId?: number;
  localId?: number;
  search?: string;
}) {
  await syncFromSpreadsheet();
  let result = [...cachedAulas];

  if (filters) {
    if (filters.dia && filters.dia !== 'all') {
      result = result.filter(a => a.dia === filters.dia);
    }
    if (filters.turno && filters.turno !== 'all') {
      result = result.filter(a => a.turno === filters.turno);
    }
    if (filters.categoria && filters.categoria !== 'all') {
      result = result.filter(a => a.categoria === filters.categoria);
    }
    if (filters.professorId) {
      result = result.filter(a => a.professorId === filters.professorId);
    }
    if (filters.localId) {
      result = result.filter(a => a.localId === filters.localId);
    }
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

export async function getAllAulas() {
  return await getAulas();
}

export async function getAulasByFilters(filters: any) {
  return await getAulas(filters);
}

export async function searchAulas(query: string) {
  return await getAulas({ search: query });
}

export async function getAulaById(id: number) {
  await syncFromSpreadsheet();
  return cachedAulas.find(a => a.id === id);
}

export async function getAllProfessores() {
  await syncFromSpreadsheet();
  return cachedProfessores.map(prof => {
    const id = prof.id + 1000;
    const defaultPass = safeSplit(prof.nome || "professor", " ")[0].toLowerCase();
    return {
      ...prof,
      password: userPasswords.get(id) || defaultPass,
      role: userRoles.get(id) || "user"
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

  cachedAulas.forEach(aula => {
    stats.porDia[aula.dia] = (stats.porDia[aula.dia] || 0) + 1;
    stats.porTurno[aula.turno] = (stats.porTurno[aula.turno] || 0) + 1;
    stats.porCategoria[aula.categoria] = (stats.porCategoria[aula.categoria] || 0) + 1;
    stats.porContrato[aula.tipoContrato] = (stats.porContrato[aula.tipoContrato] || 0) + 1;
    stats.porStatus[aula.status || 'Ativa'] = (stats.porStatus[aula.status || 'Ativa'] || 0) + 1;

    const localNome = aula.local?.nome || 'Desconhecido';
    locaisCount[localNome] = (locaisCount[localNome] || 0) + 1;
    modalidadesCount[aula.atividade] = (modalidadesCount[aula.atividade] || 0) + 1;
    
    if (aula.professorId) {
      professoresContrato.set(aula.professorId, aula.tipoContrato);
    }
  });

  professoresContrato.forEach((tipo) => {
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

// User Operations
export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  // If no users exist, create a default admin for development
  if (mockUsers.size === 0) {
    const admin: User = {
      id: 1,
      openId: "mock-user-admin",
      name: "Departamento de Esportes",
      email: null,
      password: "ESP2026",
      loginMethod: "mock",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date()
    };
    mockUsers.set(admin.id, admin);
  }
  return Array.from(mockUsers.values()).find(u => u.openId === openId);
}

export async function upsertUser(data: Partial<User> & { openId: string }): Promise<User> {
  const existing = Array.from(mockUsers.values()).find(u => u.openId === data.openId);
  if (existing) {
    // Preserva o cargo de admin se for o usuário Master ou se vier explicitamente como admin
    const role = (existing.id === 1 || data.role === "admin") ? "admin" : (data.role === "monitor" ? "monitor" : "user");
    const updated: User = { ...existing, ...data, email: null, role: role as "admin" | "user" | "monitor", updatedAt: new Date() };
    mockUsers.set(updated.id, updated);
    return updated;
  }
  
  const id = Math.max(0, ...Array.from(mockUsers.keys())) + 1;
  const newUser: User = {
    ...data,
    id,
    openId: data.openId,
    name: data.name || "Usuário",
    email: null,
    loginMethod: data.loginMethod || "mock",
    role: (data.role === "admin" ? "admin" : (data.role === "monitor" ? "monitor" : "user")) as "admin" | "user" | "monitor", 
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  mockUsers.set(id, newUser);
  return newUser;
}

// Write operations
export async function createAula(data: Partial<Aula>) {
  const id = manualAulaCounter++;
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
  
  // Buscar nomes para cache imediato
  const prof = cachedProfessores.find(p => p.id === novaAula.professorId);
  const local = cachedLocais.find(l => l.id === novaAula.localId);
  novaAula.professor = prof ? { ...prof } : undefined;
  novaAula.local = local ? { ...local } : undefined;

  manualAulas.set(id, novaAula);
  lastReadTime = 0; // Forçar resync para incluir na lista cached
  return novaAula;
}

export async function updateAula(id: number, data: Partial<Aula>) {
  await syncFromSpreadsheet();
  const existing = cachedAulas.find(a => a.id === id);
  if (!existing) throw new Error("Aula não encontrada");

  const updated: Aula = {
    ...existing,
    ...data,
    updatedAt: new Date()
  };

  // Buscar nomes atualizados se IDs mudaram
  if (data.professorId) {
    const prof = cachedProfessores.find(p => p.id === data.professorId);
    updated.professor = prof ? { ...prof } : undefined;
  }
  if (data.localId) {
    const local = cachedLocais.find(l => l.id === data.localId);
    updated.local = local ? { ...local } : undefined;
  }

  manualAulas.set(id, updated);
  lastReadTime = 0; // Forçar resync
  return updated;
}

export async function deleteAula(id: number) {
  manualAulas.delete(id);
  // Se for da planilha, precisariamos de uma lista de "IDs deletados" para filtrar no sync
  // Por enquanto, deletamos apenas se for manual ou sobrescrevemos como inativa se for planilha
  lastReadTime = 0;
  return { success: true };
}

export async function createProfessor(...args: any[]) { throw new Error("Operação não permitida em modo Planilha"); }
export async function createLocal(...args: any[]) { throw new Error("Operação não permitida em modo Planilha"); }

// Attendance Operations
export async function registrarPresenca(data: { aulaId: number; socioNome: string; socioMatricula: string; data: string }) {
  const novaPresenca: AulaPresenca = {
    id: presencaCounter++,
    ...data,
    createdAt: new Date()
  };
  presencas.push(novaPresenca);
  return novaPresenca;
}

export async function getPresencasByAula(aulaId: number, data: string) {
  return presencas.filter(p => p.aulaId === aulaId && p.data === data);
}

export async function removerPresenca(id: number) {
  presencas = presencas.filter(p => p.id !== id);
  return { success: true };
}
