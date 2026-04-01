import http from "http";
import { PostgresClient } from "./db/PostgresClient.js";
import { Bairro } from "./models/Bairro.js";
import { Cidade } from "./models/Cidade.js";
import { Cliente } from "./models/Cliente.js";
import { Funcionario } from "./models/Funcionario.js";
import { Produto } from "./models/Produto.js";
import { Venda } from "./models/Venda.js";
import { VendaItem } from "./models/VendaItem.js";

const PORT = process.env.PORT || 3000;
const db = new PostgresClient();
const models = {
  cliente: {
    instance: new Cliente(db),
    idField: "idcliente",
    listFilters: [
      "idcliente",
      "nome",
      "cpf",
      "idbairro",
      "idcidade",
      "nomebairro",
      "nomecidade",
    ],
  },
  cidade: { instance: new Cidade(db), idField: "idcidade", listFilters: ["idcidade", "nomecidade"] },
  bairro: { instance: new Bairro(db), idField: "idbairro", listFilters: ["idbairro", "nomebairro"] },
  funcionario: {
    instance: new Funcionario(db),
    idField: "idfuncionario",
    listFilters: ["idfuncionario", "nomefuncionario"],
  },
  produto: {
    instance: new Produto(db),
    idField: "idproduto",
    listFilters: ["idproduto", "descricao"],
  },
  venda: {
    instance: new Venda(db),
    idField: "idvenda",
    listFilters: ["idvenda", "idcliente", "idfuncionario", "datavenda", "nomecliente", "nomefuncionario"],
  },
  vendaitem: {
    instance: new VendaItem(db),
    idField: "idvendaitem",
    listFilters: ["idvendaitem", "idvenda", "idproduto"],
  },
};

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode;
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function buildListParams(url, allowedFilters) {
  const params = {};
  for (const key of allowedFilters) {
    const value = url.searchParams.get(key);
    if (value != null) params[key] = value;
  }

  const limit = url.searchParams.get("limit");
  const offset = url.searchParams.get("offset");
  if (limit != null) params.limit = Number(limit);
  if (offset != null) params.offset = Number(offset);

  return params;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return;
  }

  // Normaliza path sem querystring
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const path = url.pathname;

  // Apenas trata GET /
  if (req.method === "GET" && path === "/") {
    sendJson(res, 200, { message: "Servidor Node funcionando! 🚀" });
    return;
  }

  if (req.method === "GET" && path === "/teste") {
    const now = new Date();
    sendJson(res, 200, { iso: now.toISOString(), locale: now.toLocaleString("pt-BR") });
    return;
  }

  if (req.method === "GET" && path === "/testebanco") {
    try {
      const nowFromDb = await db.testConnection();
      sendJson(res, 200, { ok: true, nowFromDb });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err?.message ?? String(err) });
    }
    return;
  }

  // CRUD das tabelas
  for (const [resource, config] of Object.entries(models)) {
    const basePath = `/${resource}`;
    const itemMatch = path.match(new RegExp(`^/${resource}/(\\d+)$`));

    if (req.method === "GET" && path === basePath) {
      try {
        const params = buildListParams(url, config.listFilters);
        const rows = await config.instance.consultar(params);
        sendJson(res, 200, rows);
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err?.message ?? String(err) });
      }
      return;
    }

    if (req.method === "POST" && path === basePath) {
      try {
        const body = await readJsonBody(req);
        const created = await config.instance.incluir(body ?? {});
        sendJson(res, 201, created);
      } catch (err) {
        const msg = err?.message ?? String(err);
        sendJson(res, msg.includes("JSON") ? 400 : 500, { ok: false, error: msg });
      }
      return;
    }

    if (itemMatch && req.method === "PUT") {
      try {
        const id = Number(itemMatch[1]);
        const body = await readJsonBody(req);
        const updated = await config.instance.alterar(id, body ?? {});
        if (!updated) {
          sendJson(res, 404, { ok: false, error: "Registro não encontrado." });
          return;
        }
        sendJson(res, 200, updated);
      } catch (err) {
        const msg = err?.message ?? String(err);
        sendJson(res, msg.includes("JSON") ? 400 : 500, { ok: false, error: msg });
      }
      return;
    }

    if (itemMatch && req.method === "DELETE") {
      try {
        const id = Number(itemMatch[1]);
        const deleted = await config.instance.excluir(id);
        if (!deleted) {
          sendJson(res, 404, { ok: false, error: "Registro não encontrado." });
          return;
        }
        sendJson(res, 200, { ok: true, [config.idField]: id, deleted });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err?.message ?? String(err) });
      }
      return;
    }
  }

  // Qualquer outra rota/método
  sendJson(res, 404, { error: "Rota não encontrada" });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


