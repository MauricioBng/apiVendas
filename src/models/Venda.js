import { normalizeCrudValueForWrite } from "../utils/crudNormalize.js";

export class Venda {
  static allowedFields = [
    "idcliente",
    "idfuncionario",
    "datavenda",
    "valorbruto",
    "desconto",
    "acrescimo",
    "valorliquido",
    "parcelas",
  ];

  constructor(db) {
    this.db = db;
  }

  async consultar({
    idvenda,
    idcliente,
    idfuncionario,
    datavenda,
    nomecliente,
    nomefuncionario,
    limit = 50,
    offset = 0,
  } = {}) {
    const where = [];
    const values = [];

    if (idvenda != null) {
      values.push(idvenda);
      where.push(`idvenda = $${values.length}`);
    }
    if (idcliente != null) {
      values.push(idcliente);
      where.push(`idcliente = $${values.length}`);
    }
    if (idfuncionario != null) {
      values.push(idfuncionario);
      where.push(`idfuncionario = $${values.length}`);
    }
    if (datavenda != null) {
      values.push(datavenda);
      where.push(`datavenda = $${values.length}`);
    }
    if (nomecliente != null && String(nomecliente).trim() !== "") {
      values.push(`%${nomecliente}%`);
      where.push(
        `EXISTS (SELECT 1 FROM cliente c WHERE c.idcliente = venda.idcliente AND c.nome ILIKE $${values.length})`,
      );
    }
    if (nomefuncionario != null && String(nomefuncionario).trim() !== "") {
      values.push(`%${nomefuncionario}%`);
      where.push(
        `EXISTS (SELECT 1 FROM funcionario f WHERE f.idfuncionario = venda.idfuncionario AND f.nomefuncionario ILIKE $${values.length})`,
      );
    }

    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const sql = `
      SELECT *
      FROM venda
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY idvenda DESC
      LIMIT $${limitIdx}
      OFFSET $${offsetIdx}
    `;
    const res = await this.db.pool.query(sql, values);
    return res.rows;
  }

  async incluir(data) {
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) throw new Error("Nenhum campo válido para inclusão.");
    const placeholders = values.map((_, i) => `$${i + 1}`);
    const sql = `INSERT INTO venda (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async alterar(idvenda, data) {
    if (idvenda == null) throw new Error("Informe o id para alterar.");
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) throw new Error("Nenhum campo válido para alteração.");
    const sets = columns.map((col, i) => `${col} = $${i + 1}`);
    values.push(idvenda);
    const sql = `UPDATE venda SET ${sets.join(", ")} WHERE idvenda = $${values.length} RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async excluir(idvenda) {
    if (idvenda == null) throw new Error("Informe o id para excluir.");
    const res = await this.db.pool.query("DELETE FROM venda WHERE idvenda = $1", [idvenda]);
    return res.rowCount ?? 0;
  }

  #pickAllowedFields(data) {
    const columns = [];
    const values = [];
    if (!data || typeof data !== "object") return { columns, values };
    for (const field of Venda.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field) && data[field] != null) {
        columns.push(field);
        values.push(normalizeCrudValueForWrite(data[field]));
      }
    }
    return { columns, values };
  }
}

