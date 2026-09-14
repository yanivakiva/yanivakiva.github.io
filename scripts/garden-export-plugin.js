import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Development-only, same-origin renderer output; never mounted in production.
export default function gardenExportPlugin() {
  return { name: "local-garden-frame-export", apply: "serve", configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const match = req.url?.match(/^\/__garden-export\/(wide|portrait)\/(\d{3}\.webp|manifest\.json)$/);
      if (!match) return next();
      if (req.method !== "POST" || (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`)) {
        res.writeHead(403); return res.end("Local same-origin POST only");
      }
      try {
        const chunks = []; let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 2_000_000) { res.writeHead(413); return res.end(); }
          chunks.push(chunk);
        }
        const bytes = Buffer.concat(chunks);
        if (match[2].endsWith("json")) JSON.parse(bytes.toString());
        else if (bytes.toString("ascii", 8, 12) !== "WEBP") throw new Error("Expected WebP");
        const directory = path.resolve(server.config.root, "public/garden/sequence", match[1]);
        await mkdir(directory, { recursive: true });
        await writeFile(path.join(directory, match[2]), bytes);
        res.writeHead(201); res.end("Rendered");
      } catch { res.writeHead(400); res.end("Invalid frame"); }
    });
  } };
}
