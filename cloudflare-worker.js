// serverless-examples/cloudflare-worker.js
// Cloudflare Worker para gravar JSON no repositório GitHub.
// Defina os Secrets:
// - GITHUB_TOKEN: token com escopo "repo" (ou só "contents" no fine-grained) no repositório-alvo
// - GITHUB_REPO:  ex.: "seuUser/seuRepo"
// - GITHUB_BRANCH: ex.: "main"
export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: cors() });
    }
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: cors() });
    }
    try {
      const payload = await request.json();
      const now = new Date();
      const id = crypto.randomUUID();
      const y = now.getFullYear();
      const m = String(now.getMonth()+1).padStart(2,"0");
      const d = String(now.getDate()).padStart(2,"0");
      const path = `data/${y}/${m}/${d}/${id}.json`;

      const body = JSON.stringify({ id, created_at: now.toISOString(), ...payload }, null, 2);
      // base64 do conteúdo
      const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(body)));

      const [owner, repo] = env.GITHUB_REPO.split("/");
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

      const ghRes = await fetch(url, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "db-on-github-worker"
        },
        body: JSON.stringify({
          message: `chore(data): add record ${id}`,
          content: base64,
          branch: env.GITHUB_BRANCH,
          committer: { name: "DB Bot", email: "bot@example.com" },
          author: { name: "DB Bot", email: "bot@example.com" }
        })
      });

      if (!ghRes.ok) {
        const msg = await ghRes.text();
        return new Response(JSON.stringify({ error: true, message: msg }), { status: 500, headers: { ...cors(), "Content-Type":"application/json" }});
      }

      return new Response(JSON.stringify({ ok: true, id, path }), { status: 200, headers: { ...cors(), "Content-Type":"application/json" }});
    } catch (e) {
      return new Response(JSON.stringify({ error: true, message: String(e) }), { status: 400, headers: { ...cors(), "Content-Type":"application/json" }});
    }
  }
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}
