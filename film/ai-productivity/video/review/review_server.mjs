// Copied from the film-studio skill (scripts/review_server.mjs), with one fix: "/" (and any folder URL) serves its index.html; the skill copy answers 404 there.
// A live-preview server for a code film: static files with no caching and byte
// ranges (so audio and video seek), plus GET/PUT of a notes file the player saves to.
//   node review_server.mjs --root <dir> --notes <file.json> [--port 5190] [--host 127.0.0.1,100.69.115.38]
// The player fetches /api/notes and PUTs the whole list back as JSON.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (name, d) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : d);
const ROOT = path.resolve(opt("root", process.cwd()));
const NOTES = path.resolve(opt("notes", path.join(ROOT, "notes.json")));
const PORT = Number(opt("port", 5190));
const HOSTS = opt("host", "127.0.0.1").split(",");
const TYPES = {
  ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml",
  ".woff2": "font/woff2", ".wav": "audio/wav", ".mp3": "audio/mpeg", ".mp4": "video/mp4",
};

function notes(req, res) {
  if (req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    res.end(fs.existsSync(NOTES) ? fs.readFileSync(NOTES) : "[]");
    return;
  }
  if (req.method !== "PUT") return res.writeHead(405).end();
  const chunks = [];
  let size = 0;
  req.on("data", (c) => {
    size += c.length;
    if (size > 1e6) req.destroy();
    chunks.push(c);
  });
  req.on("end", () => {
    try {
      const list = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      if (!Array.isArray(list)) throw new Error("notes must be a list");
      fs.writeFileSync(NOTES, JSON.stringify(list, null, 2) + "\n");
      res.writeHead(204).end();
    } catch (err) {
      res.writeHead(400).end(String(err));
    }
  });
}

const handler = (req, res) => {
  const url = new URL(req.url, "http://x");
  if (url.pathname === "/api/notes") return notes(req, res);
  const asked = url.pathname.endsWith("/") ? `${url.pathname}index.html` : url.pathname;
  const file = path.normalize(path.join(ROOT, decodeURIComponent(asked)));
  if (!file.startsWith(ROOT + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  const size = fs.statSync(file).size;
  const head = { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream", "cache-control": "no-store", "accept-ranges": "bytes" };
  const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range ?? "");
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { ...head, "content-range": `bytes ${start}-${end}/${size}`, "content-length": end - start + 1 });
    fs.createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.writeHead(200, { ...head, "content-length": size });
  fs.createReadStream(file).pipe(res);
};

for (const host of HOSTS) {
  http.createServer(handler).listen(PORT, host, () => console.log(`review: http://${host}:${PORT}/  notes -> ${NOTES}`));
}
