// db/db.js
(function(){
  function uuidv4(){
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    // fallback
    const rnd = crypto.getRandomValues(new Uint8Array(16));
    rnd[6] = (rnd[6] & 0x0f) | 0x40;
    rnd[8] = (rnd[8] & 0x3f) | 0x80;
    const toHex = (n) => n.toString(16).padStart(2,'0');
    const b = Array.from(rnd, toHex).join('');
    return `${b.substr(0,8)}-${b.substr(8,4)}-${b.substr(12,4)}-${b.substr(16,4)}-${b.substr(20)}`;
  }

  async function salvarNoGitHub(dados, opts) {
    if (!window.DB_API_ENDPOINT || window.DB_API_ENDPOINT.indexOf("http") !== 0) {
      throw new Error("DB_API_ENDPOINT não configurado. Edite db/config.js");
    }
    const now = new Date().toISOString();
    const id = uuidv4();
    const payload = Object.assign({ id, created_at: now }, dados || {});
    const res = await fetch(window.DB_API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let out;
    try { out = await res.json(); } catch(e) { out = { error: true, message: await res.text() }; }
    if (!res.ok) {
      throw new Error(out && (out.error || out.message) || "Falha ao gravar no GitHub");
    }
    return out;
  }

  function serializeForm(formEl){
    const data = {};
    const formData = new FormData(formEl);
    for (const [k, v] of formData.entries()){
      if (k.endsWith("[]")) {
        const key = k.slice(0,-2);
        if (!Array.isArray(data[key])) data[key] = [];
        data[key].push(v);
      } else if (k in data) {
        // multiplo
        if (!Array.isArray(data[k])) data[k] = [data[k]];
        data[k].push(v);
      } else {
        data[k] = v;
      }
    }
    return data;
  }

  async function handleDbSaveSubmit(ev){
    ev.preventDefault();
    const form = ev.currentTarget;
    const dados = serializeForm(form);
    try {
      const resp = await salvarNoGitHub(dados);
      alert(`Registro salvo!\nID: ${resp.id || dados.id}\nPath: ${resp.path || "ver repositorio"}`);
      if (form.classList.contains("db-reset")) form.reset();
    } catch(err) {
      alert("Erro ao salvar no GitHub: " + err.message);
      console.error(err);
    }
  }

  function bindAuto(){
    document.querySelectorAll("form.db-save").forEach(f=>{
      f.addEventListener("submit", handleDbSaveSubmit);
    });
  }

  window.salvarNoGitHub = salvarNoGitHub;
  window.dbSerializeForm = serializeForm;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAuto);
  } else {
    bindAuto();
  }
})();
