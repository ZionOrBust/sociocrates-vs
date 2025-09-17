import express, { type Express } from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";
import { createRequire } from "module";

// IMPORTANT: When bundling, __dirname becomes the dist folder.
// Use process.cwd() to reliably reference the project root.
const projectRoot = process.cwd();

export function log(message: string) {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  console.log(`${timestamp} [express] ${message}`);
}

async function getViteCreateServer() {
  // Resolve Vite from the client's node_modules to avoid root resolution issues
  const requireFromClient = createRequire(path.resolve(projectRoot, "client/package.json"));
  const vitePkgPath = requireFromClient.resolve("vite/package.json");
  const viteRoot = path.dirname(vitePkgPath);
  const viteEntry = path.resolve(viteRoot, "dist/node/index.js");
  const vite = await import(viteEntry);
  return vite.createServer as typeof import("vite").createServer;
}

export async function setupVite(app: Express, server: Server) {
  try {
    log("Setting up Vite development server...");

    const createViteServer = await getViteCreateServer();
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false // Disable HMR to fix connection issues
      },
      appType: "spa",
      // Always point to the client vite config from project root
      configFile: path.resolve(projectRoot, "client/vite.config.ts"),
      clearScreen: false,
      optimizeDeps: {
        include: ["react", "react-dom"]
      }
    });

    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);

    log("✅ Vite development server ready");
  } catch (error: any) {
    log(`❌ Vite setup failed: ${error.message}`);
    throw error;
  }
}

export function serveStatic(app: Express) {
  // Serve the built client from client/dist when not in dev
  const distPath = path.resolve(projectRoot, "client/dist");
  const indexHtml = path.join(distPath, "index.html");

  // Always provide a root redirect to /app
  app.get(["/", ""], (_req, res) => res.redirect("/app"));

  // If build is missing, serve a minimal placeholder to avoid 500s
  if (!fs.existsSync(indexHtml)) {
    app.get(["/app", "/app/*"], (_req, res) => {
      res.status(200).send(`<!doctype html>
        <html>
          <head>
            <meta charset=\"utf-8\" />
            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
            <title>Sociocrates</title>
            <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;padding:24px;max-width:720px;margin:auto;line-height:1.5}</style>
          </head>
          <body>
            <h1>Backend is running</h1>
            <p>The UI build is not available right now. API is healthy at <code>/api/ping</code>.</p>
            <p>If you expected the full UI, the client build needs to be generated. For now, this placeholder is shown so the server doesn't hang.</p>
          </body>
        </html>`);
    });
    return;
  }

  // Serve static assets from /app/
  app.use("/app", express.static(distPath, { fallthrough: true, redirect: false }));

  // Explicit asset handler to avoid SPA wildcard catching files
  app.get("/app/assets/*", (req, res, next) => {
    const rel = req.path.replace(/^\/app\//, "");
    const abs = path.join(distPath, rel);
    if (fs.existsSync(abs)) return res.sendFile(abs);
    return next();
  });

  // Handle SPA routing for /app/* routes
  app.get("/app/*", (_req, res) => {
    res.sendFile(indexHtml);
  });

  // Fallback for root /app route
  app.get("/app", (_req, res) => {
    res.sendFile(indexHtml);
  });
}
