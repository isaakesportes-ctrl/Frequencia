import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getAulas, getAulasByFilters, searchAulas, getAulaById, createAula, updateAula, deleteAula, getAllProfessores, getProfessorAulas, getAllLocais, getAulasStats, getUsers, createUser, deleteUser, updateUserPassword, updateUserName, updateUserRole, registrarPresenca, getPresencasByAula, removerPresenca } from "./db";

export const appRouter = router({
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
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
      return await getUsers();
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        role: z.enum(["user", "admin", "monitor"])
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
        role: z.enum(["user", "admin", "monitor"])
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
      return await getAllProfessores();
    }),
    
    aulas: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getProfessorAulas(input.id);
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
});

export type AppRouter = typeof appRouter;
