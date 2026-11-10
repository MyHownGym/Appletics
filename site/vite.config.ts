import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "node:fs";

// Emit the existing official logo at a stable URL for sharing crawlers.
// No public/ files are modified; this works in development and published builds.
const shareLogo = readFileSync(path.resolve(__dirname, "src/assets/logo-full.png"));

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: "appletics-sharing-logo",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.split("?")[0] !== "/appletics-share.png") return next();
          res.statusCode = 200;
          res.setHeader("Content-Type", "image/png");
          res.setHeader("Cache-Control", "public, max-age=3600");
          res.end(req.method === "HEAD" ? undefined : shareLogo);
        });
      },
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "appletics-share.png", source: shareLogo });
      },
      transformIndexHtml: {
        order: "post",
        handler(html) {
          return html.replace(
            "<!-- Appletics share image dimensions -->",
            `<meta property="og:image:width" content="${shareLogo.readUInt32BE(16)}" /><meta property="og:image:height" content="${shareLogo.readUInt32BE(20)}" />`,
          );
        },
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
