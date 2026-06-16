// @ts-nocheck
import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { Request, Response, Application } from "express";
import * as db from "../db.js";
import { getSessionCookieOptions } from "./cookies.js";
import { sdk } from "./sdk.js";
import { ENV } from "./env.js";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = (req.query as Record<string, any>)[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Application) {
  const handler = async (req: Request, res: Response) => {

    try {
      const name = getQueryParam(req, "name") || "Departamento de Esportes";
      const role = getQueryParam(req, "role") || "admin";

      console.log(`[Auth] Starting mock login flow for: ${name} (${role})`);
      
      const mockUser = {
        openId: `mock-user-${role}`,
        name: name,
        email: `${role}@academia.com`,
      };

      console.log("[Auth] Upserting mock user to DB...");
      const upsertedUser = await db.upsertUser({
        openId: mockUser.openId,
        name: mockUser.name,
        email: mockUser.email,
        loginMethod: "mock",
        lastSignedIn: new Date(),
        role: role as "admin" | "user",
      });
      
      console.log("[Auth] Upserted user:", upsertedUser);

      console.log("[Auth] Creating session token...");
      const sessionToken = await sdk.createSessionToken(mockUser.openId, {
        name: mockUser.name,
        expiresInMs: ONE_YEAR_MS,
      });

      console.log("[Auth] Setting cookie and redirecting...");
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect based on role: Admin to Dashboard, Professor (user) to Professores
      const redirectUrl = role === "admin" ? "/dashboard" : "/professores";
      res.redirect(302, redirectUrl);
    } catch (error) {
      console.error("[Auth] Mock login failed:", error);
      res.status(500).json({ error: "Mock login failed", details: error instanceof Error ? error.message : String(error) });
    }
  };

  // Support both with and without /api prefix
  app.get("/api/auth/mock", handler);
  app.get("/auth/mock", handler);
}
