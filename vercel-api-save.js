// serverless-examples/vercel-api-save.js
// Vercel Serverless Function (Node 18+). Salva JSON no repositório GitHub.
import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(200).send("ok");
  }
  if (req.method !== "POST") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(405).json({ error: true, message: "Method Not Allowed" });
  }

  try {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // "seuUser/seuRepo"
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

    const payload = req.body;
    const now = new Date();
    const id = crypto.randomUUID();
    const y = now.getFullYear();
    const m = String(now.getMonth()+1).padStart(2,"0");
    const d = String(now.getDate()).padStart(2,"0");
    const path = `data/${y}/${m}/${d}/${id}.json`;

    const body = JSON.stringify({ id, created_at: now.toISOString(), ...payload }, null, 2);
    const base64 = Buffer.from(body, "utf-8").toString("base64");

    const [owner, repo] = GITHUB_REPO.split("/");
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

    const ghRes = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${GITHUB_TOKEN}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "db-on-github-vercel"
      },
      body: JSON.stringify({
        message: `chore(data): add record ${id}`,
        content: base64,
        branch: GITHUB_BRANCH,
        committer: { name: "DB Bot", email: "bot@example.com" },
        author: { name: "DB Bot", email: "bot@example.com" }
      })
    });

    if (!ghRes.ok) {
      const msg = await ghRes.text();
      res.setHeader("Access-Control-Allow-Origin", "*");
      return res.status(500).json({ error: true, message: msg });
    }

    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).json({ ok: true, id, path });
  } catch (e) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(400).json({ error: true, message: String(e) });
  }
}
