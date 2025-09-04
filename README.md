# Gravação de dados no GitHub (Serverless)

Este diretório contém exemplos de backend para gravar dados do seu projeto diretamente em um repositório GitHub como arquivos JSON.

## Por que serverless?
Para escrever no GitHub, é preciso um token. Nunca exponha o token no frontend. Em vez disso, use uma função serverless:

- Recebe o JSON do seu HTML (via `fetch POST`)
- Faz `PUT /repos/:owner/:repo/contents/...` na GitHub API
- Commita o arquivo em `data/YYYY/MM/DD/UUID.json` no branch de destino

## Opção 1: Cloudflare Worker
Arquivo: `cloudflare-worker.js`

1. Crie um Worker.
2. Configure os Secrets:
   - `GITHUB_TOKEN` (fine-grained com permissão Contents no repo)
   - `GITHUB_REPO`  (ex.: `seuUser/seuRepo`)
   - `GITHUB_BRANCH` (ex.: `main`)
3. Publique. Copie a URL (`https://SEU_WORKER.workers.dev`).
4. Edite `db/config.js` e cole a URL no `window.DB_API_ENDPOINT`.

## Opção 2: Vercel Serverless
Arquivo: `vercel-api-save.js` (dentro de `api/save.js` no seu projeto Vercel)

1. Crie um projeto na Vercel.
2. Adicione uma função em `api/save.js` com o conteúdo do arquivo.
3. Configure as variáveis de ambiente:
   - `GITHUB_TOKEN`, `GITHUB_REPO`, `GITHUB_BRANCH`
4. Deploy e use a URL `https://suaapp.vercel.app/api/save` em `db/config.js`.

## Frontend
Já adicionei:
- `db/config.js` (endereço do endpoint)
- `db/db.js` (funções `salvarNoGitHub(dados)` e auto-bind em `form.db-save`)

### Como usar num formulário existente
No seu `<form>` adicione a classe `db-save`:
```html
<form class="db-save db-reset" id="formAtestado">
  <!-- campos -->
</form>
```
- `db-save`: intercepta o `submit`, serializa campos e envia ao endpoint.
- `db-reset` (opcional): reseta o formulário após salvar.

Ou chame manualmente:
```html
<script>
  // monte o objeto com os campos do seu sistema
  const dados = { navio: "NOME", imo: "1234567", porto_destino: "SANTOS" };
  salvarNoGitHub(dados).then(console.log).catch(console.error);
</script>
```

## Leitura/consulta
Você pode listar os JSON diretamente no GitHub (UI) ou criar outra função serverless para consultar.
