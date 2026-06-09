import "dotenv/config";
import express, { Application, Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth.js";
import { appRouter } from "../routers.js";
import { createContext } from "./context.js";
import { serveStatic, setupVite } from "./vite.js";

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

// Configure basic middlewares synchronously
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Debug middleware for Vercel
app.use((req: Request, res: Response, next: NextFunction) => {
  if (process.env.VERCEL) {
    console.log(`[Vercel Request] ${req.method} ${req.url}`);
  }
  next();
});

// Register routes synchronously
registerOAuthRoutes(app);

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
  res.status(500).json({ 
    error: "Internal Server Error", 
    message: err instanceof Error ? err.message : String(err),
    stack: process.env.NODE_ENV === "development" ? (err instanceof Error ? err.stack : undefined) : undefined
  });
});

// Register static files for production non-Vercel environments
if (process.env.NODE_ENV !== "development" && !process.env.VERCEL) {
  serveStatic(app);
}

// Only start the HTTP server locally
if (!process.env.VERCEL) {
  startServer().catch(console.error);
}

export default app;
