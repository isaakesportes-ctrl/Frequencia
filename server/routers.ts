// @ts-nocheck
import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies.js";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc.js";
import { getAulas, getAulasByFilters, searchAulas, getAulaById, createAula, updateAula, deleteAula, getAllProfessores, getProfessorAulas, getAllLocais, getAulasStats, getUsers, createUser, deleteUser, updateUserPassword, updateUserName, updateUserRole, updateProfessorTipoContrato, registrarPresenca, getPresencasByAula, removerPresenca, loginWithNameAndPassword, requestAccess, getPendingAccessRequests, approveAccess, rejectAccess, registrarFrequenciaAulas, getFrequenciaAulasByDateAndHorario, getAllFrequenciaAulas, registrarFrequenciaKids, getFrequenciaKidsByDate, getAllFrequenciaKids, getSocioByMatricula, uploadMembers, getMembers, getMemberByNumero, clearMembers } from "./db.js";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => {
      console.log("[TRPC] auth.me called, user:", opts.ctx.user);
      return opts.ctx.user;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({
        name: z.string(),
        password: z.string()
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await loginWithNameAndPassword(input.name, input.password);
        
        if (!result.success || !result.user) {
          return result;
        }
        
        // Create session
        const { sdk } = await import("./_core/sdk.js");
        const sessionToken = await sdk.createSessionToken(result.user.openId, {
          name: result.user.name,
          expiresInMs: 365 * 24 * 60 * 60 * 1000, // 1 year
        });
        
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { 
          ...cookieOptions, 
          maxAge: 365 * 24 * 60 * 60 * 1000 
        });
        
        return { success: true, user: result.user };
      }),
    requestAccess: publicProcedure
      .input(z.object({ 
        name: z.string(),
        password: z.string(),
        role: z.enum(["user", "admin", "monitor", "aprendiz", "frequencia"]),
        function: z.string()
      }))
      .mutation(async ({ input }) => {
        return await requestAccess(input.name, input.password, input.role, input.function);
      }),
    getPendingRequests: protectedProcedure.query(async () => {
      return await getPendingAccessRequests();
    }),
    approveAccess: protectedProcedure
      .input(z.object({
        requestId: z.number(),
        name: z.string().optional(),
        password: z.string().optional(),
        role: z.enum(["user", "admin", "monitor", "aprendiz", "frequencia"]).optional(),
        function: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const { requestId, ...updates } = input;
        return await approveAccess(requestId, updates);
      }),
    rejectAccess: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ input }) => {
        return await rejectAccess(input.requestId);
      }),
  }),

  // Attendance routes
  attendance: router({
    register: protectedProcedure
      .input(z.object({
        aulaId: z.number(),
        socioNome: z.string(),
        socioMatricula: z.string(),
        data: z.string()
      }))
      .mutation(async ({ input }) => {
        return await registrarPresenca(input);
      }),
    list: protectedProcedure
      .input(z.object({
        aulaId: z.number(),
        data: z.string()
      }))
      .query(async ({ input }) => {
        return await getPresencasByAula(input.aulaId, input.data);
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await removerPresenca(input.id);
      }),
  }),

  // Users routes
  users: router({
    list: protectedProcedure.query(async () => {
      try {
        return await getUsers();
      } catch (error: any) {
        console.error("[TRPC Server Error] users.list:", error);
        throw error;
      }
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        role: z.enum(["user", "admin", "monitor", "aprendiz", "frequencia"])
      }))
      .mutation(async ({ input }) => {
        return await createUser(input);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteUser(input.id);
      }),
    updatePassword: protectedProcedure
      .input(z.object({
        id: z.number(),
        password: z.string()
      }))
      .mutation(async ({ input }) => {
        return await updateUserPassword(input.id, input.password);
      }),
    updateName: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string()
      }))
      .mutation(async ({ input }) => {
        return await updateUserName(input.id, input.name);
      }),
    updateRole: protectedProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(["user", "admin", "monitor", "aprendiz", "frequencia"])
      }))
      .mutation(async ({ input }) => {
        return await updateUserRole(input.id, input.role);
      }),
  }),

  // Aulas routes
  aulas: router({
    list: publicProcedure
      .input(z.object({
        dia: z.string().optional(),
        turno: z.string().optional(),
        categoria: z.string().optional(),
        professorId: z.number().optional(),
        localId: z.number().optional(),
        search: z.string().optional()
      }))
      .query(async ({ input }) => {
        return await getAulas(input);
      }),
    create: protectedProcedure
      .input(z.object({
        atividade: z.string(),
        horario: z.string(),
        dia: z.string(),
        localId: z.number(),
        faixaEtaria: z.string(),
        categoria: z.string(),
        professorId: z.number(),
        tipoContrato: z.string(),
        turno: z.string(),
        status: z.enum(['Ativa', 'Chuva', 'Feriado', 'Sem Aluno', 'Final de Ano'])
      }))
      .mutation(async ({ input }) => {
        return await createAula(input);
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        data: z.object({
          atividade: z.string().optional(),
          horario: z.string().optional(),
          dia: z.string().optional(),
          localId: z.number().optional(),
          faixaEtaria: z.string().optional(),
          categoria: z.string().optional(),
          professorId: z.number().optional(),
          tipoContrato: z.string().optional(),
          turno: z.string().optional(),
          status: z.enum(['Ativa', 'Chuva', 'Feriado', 'Sem Aluno', 'Final de Ano']).optional()
        })
      }))
      .mutation(async ({ input }) => {
        return await updateAula(input.id, input.data);
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteAula(input.id);
      }),
  }),

  // Professores routes
  professores: router({
    list: publicProcedure.query(async () => {
      try {
        return await getAllProfessores();
      } catch (error: any) {
        console.error("[TRPC Server Error] professores.list:", error);
        throw error;
      }
    }),
    
    aulas: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getProfessorAulas(input.id);
      }),
    
    updateTipoContrato: protectedProcedure
      .input(z.object({
        professorId: z.number(),
        tipoContrato: z.string()
      }))
      .mutation(async ({ input }) => {
        return await updateProfessorTipoContrato(input.professorId, input.tipoContrato);
      }),
  }),

  // Locais routes
  locais: router({
    list: publicProcedure.query(async () => {
      return await getAllLocais();
    }),
  }),

  // Stats routes
  stats: router({
    aulas: publicProcedure.query(async () => {
      return await getAulasStats();
    }),
  }),

  // Frequência de Aulas routes
  frequenciaAulas: router({
    register: protectedProcedure
      .input(z.object({
        aulaId: z.number(),
        quantidadePresentes: z.number(),
        data: z.string(),
        horario: z.string()
      }))
      .mutation(async ({ input }) => {
        return await registrarFrequenciaAulas(input);
      }),
    list: protectedProcedure
      .input(z.object({
        data: z.string(),
        horario: z.string()
      }))
      .query(async ({ input }) => {
        return await getFrequenciaAulasByDateAndHorario(input.data, input.horario);
      }),
    all: protectedProcedure.query(async () => {
      return await getAllFrequenciaAulas();
    }),
  }),

  // Frequência Kids routes
  frequenciaKids: router({
    register: protectedProcedure
      .input(z.object({
        numeroSocio: z.string(),
        nomeAluno: z.string(),
        idade: z.number(),
        acompanhado: z.boolean(),
        data: z.string()
      }))
      .mutation(async ({ input }) => {
        return await registrarFrequenciaKids(input);
      }),
    list: protectedProcedure
      .input(z.object({
        data: z.string()
      }))
      .query(async ({ input }) => {
        return await getFrequenciaKidsByDate(input.data);
      }),
    all: protectedProcedure.query(async () => {
      return await getAllFrequenciaKids();
    }),
    getSocio: protectedProcedure
      .input(z.object({
        matricula: z.string()
      }))
      .query(async ({ input }) => {
        return await getSocioByMatricula(input.matricula);
      }),
  }),
  
  // Members routes
  members: router({
    upload: protectedProcedure
      .input(z.record(z.array(z.string()))) // Exatamente o formato que o usuário pediu!
      .mutation(async ({ input }) => {
        return await uploadMembers(input);
      }),
    list: protectedProcedure.query(async () => {
      return await getMembers();
    }),
    get: protectedProcedure
      .input(z.object({
        numeroSocio: z.string()
      }))
      .query(async ({ input }) => {
        return await getMemberByNumero(input.numeroSocio);
      }),
    clear: protectedProcedure.mutation(async () => {
      return await clearMembers();
    }),
  }),
});

export type AppRouter = typeof appRouter;
