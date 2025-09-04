// db/read.js
// Funções auxiliares para listar registros salvos no GitHub (repo público).
// ATENÇÃO: só funciona se o repositório for PÚBLICO.
// Se for privado, crie um endpoint serverless GET que faça proxy desta leitura.

async function ghJson(url){
  const res = await fetch(url, { headers: { "Accept":"application/vnd.github+json" }});
  if (!res.ok) throw new Error(`GitHub GET falhou: ${await res.text()}`);
  return await res.json();
}

async function listGitHubRecords(maxItems=50){
  if (!window.DB_GH_REPO_OWNER || !window.DB_GH_REPO_NAME || !window.DB_GH_BRANCH) {
    throw new Error("Config GitHub repo não definida em db/config.js");
  }
  const owner = window.DB_GH_REPO_OWNER;
  const repo = window.DB_GH_REPO_NAME;
  const branch = window.DB_GH_BRANCH;
  // Obter árvore do branch (lista todos caminhos)
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
  const tree = await ghJson(treeUrl);
  const files = (tree.tree||[])
    .filter(n => n.type === "blob" && n.path.startsWith("data/") && n.path.endsWith(".json"))
    .map(n => n.path);
  // Ordenar por caminho decrescente (YYYY/MM/DD/UUID.json)
  files.sort((a,b)=> a<b ? 1 : -1);
  const take = files.slice(0, Math.min(files.length, maxItems));
  const out = [];
  for (const path of take){
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
    const obj = await ghJson(url);
    // conteúdo vem em base64
    const raw = atob(obj.content.replace(/\n/g,''));
    let data;
    try { data = JSON.parse(raw); } catch(e){ data = { error:true, raw }; }
    out.push({ path, data, sha: obj.sha, size: obj.size });
  }
  return out;
}

window.listGitHubRecords = listGitHubRecords;
