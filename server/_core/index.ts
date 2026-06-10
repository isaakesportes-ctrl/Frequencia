// @ts-nocheck
import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import fs from "fs";
import path from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";

// Manus Debug Collector Functions
const PROJECT_ROOT = import.meta.dirname;
const LOG_DIR = path.join(PROJECT_ROOT, "../../.manus-logs");
const MAX_LOG_SIZE_BYTES = 1 * 1024 * 1024;
const TRIM_TARGET_BYTES = Math.floor(MAX_LOG_SIZE_BYTES * 0.6);

type LogSource = "browserConsole" | "networkRequests" | "sessionReplay";

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function trimLogFile(logPath: string, maxSize: number) {
  try {
    if (!fs.existsSync(logPath) || fs.statSync(logPath).size <= maxSize) {
      return;
    }
    const lines = fs.readFileSync(logPath, "utf-8").split("\n");
    const keptLines: string[] = [];
    let keptBytes = 0;
    const targetSize = TRIM_TARGET_BYTES;
    for (let i = lines.length - 1; i >= 0; i--) {
      const lineBytes = Buffer.byteLength(`${lines[i]}\n`, "utf-8");
      if (keptBytes + lineBytes > targetSize) break;
      keptLines.unshift(lines[i]);
      keptBytes += lineBytes;
    }
    fs.writeFileSync(logPath, keptLines.join("\n"), "utf-8");
  } catch {
    /* ignore trim errors */
  }
}

function writeToLogFile(source: LogSource, entries: unknown[]) {
  if (entries.length === 0) return;
  ensureLogDir();
  const logPath = path.join(LOG_DIR, `${source}.log`);
  const lines = entries.map((entry) => {
    const ts = new Date().toISOString();
    return `[${ts}] ${JSON.stringify(entry)}`;
  });
  fs.appendFileSync(logPath, `${lines.join("\n")}\n`, "utf-8");
  trimLogFile(logPath, MAX_LOG_SIZE_BYTES);
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

export const app = express();

// Log all requests
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// Configure basic middlewares synchronously
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Handle favicon.ico requests gracefully
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// Manus Debug Collector Endpoints
app.post("/__manus__/logs", (req, res) => {
  const handlePayload = (payload: any) => {
    if (payload.consoleLogs?.length > 0) {
      writeToLogFile("browserConsole", payload.consoleLogs);
    }
    if (payload.networkRequests?.length > 0) {
      writeToLogFile("networkRequests", payload.networkRequests);
    }
    if (payload.sessionEvents?.length > 0) {
      writeToLogFile("sessionReplay", payload.sessionEvents);
    }
    res.status(200).json({ success: true });
  };

  if (req.body && typeof req.body === "object") {
    try {
      handlePayload(req.body);
    } catch (e) {
      res.status(400).json({ success: false, error: String(e) });
    }
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
  });
  req.on("end", () => {
    try {
      const payload = JSON.parse(body);
      handlePayload(payload);
    } catch (e) {
      res.status(400).json({ success: false, error: String(e) });
    }
  });
});

// Serve debug-collector.js from public folder
app.get("/__manus__/debug-collector.js", (req, res) => {
  const filePath = path.join(PROJECT_ROOT, "../../client/public/__manus__/debug-collector.js");
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("Not found");
  }
});

// Debug middleware for Vercel
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.VERCEL) {
    console.log(`[Vercel Request] ${req.method} ${req.url}`);
  }
  next();
});

// Register routes synchronously
registerOAuthRoutes(app);

// Mock route
app.get("/mock", (req, res) => { 
   try { 
     const name = req.query.name as string; 
     const role = req.query.role as string; 

     if (!name || !role) { 
       return res.status(400).json({ error: "Parâmetros obrigatórios" }); 
     } 

     return res.json({ 
       message: `Usuário ${name} com role ${role}` 
     }); 
   } catch (err) { 
     console.error(err); 
     return res.status(500).json({ error: "Erro interno" }); 
   } 
 });

// tRPC API middleware
const trpcMiddleware = createExpressMiddleware({
  router: appRouter,
  createContext,
  onError({ error }) {
    console.error("[TRPC Error Formatter]", error);
  },
});

// Support both with and without /api prefix for Vercel flexibility
app.use("/api/trpc", trpcMiddleware);
app.use("/trpc", trpcMiddleware);

async function startServer() {
  const server = createServer(app);
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Register error handling middleware synchronously (must be last)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("[Server Error]", err);
  console.error("[Server Error Stack]", err.stack);
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err instanceof Error ? err.message : String(err),
    stack: process.env.NODE_ENV === "development" ? (err instanceof Error ? err.stack : undefined) : undefined
  });
});

// Register static files for production environments (including Vercel)
if (process.env.NODE_ENV !== "development") {
  serveStatic(app);
}

// Only start the HTTP server locally
if (!process.env.VERCEL) {
  startServer().catch(console.error);
}

export default app;
