import { normalizeCrudValueForWrite } from "../utils/crudNormalize.js";

export class Produto {
  static allowedFields = ["descricao", "custo", "vrvenda", "estoque"];

  constructor(db) {
    this.db = db;
  }

  async consultar({ idproduto, descricao, limit = 50, offset = 0 } = {}) {
    const where = [];
    const values = [];

    if (idproduto != null) {
      values.push(idproduto);
      where.push(`idproduto = $${values.length}`);
    }
    if (descricao != null) {
      values.push(`%${descricao}%`);
      where.push(`descricao ILIKE $${values.length}`);
    }

    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const sql = `
      SELECT *
      FROM produto
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY idproduto DESC
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
    const sql = `INSERT INTO produto (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async alterar(idproduto, data) {
    if (idproduto == null) throw new Error("Informe o id para alterar.");
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) throw new Error("Nenhum campo válido para alteração.");
    const sets = columns.map((col, i) => `${col} = $${i + 1}`);
    values.push(idproduto);
    const sql = `UPDATE produto SET ${sets.join(", ")} WHERE idproduto = $${values.length} RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async excluir(idproduto) {
    if (idproduto == null) throw new Error("Informe o id para excluir.");
    const res = await this.db.pool.query("DELETE FROM produto WHERE idproduto = $1", [idproduto]);
    return res.rowCount ?? 0;
  }

  #pickAllowedFields(data) {
    const columns = [];
    const values = [];
    if (!data || typeof data !== "object") return { columns, values };
    for (const field of Produto.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field) && data[field] != null) {
        columns.push(field);
        values.push(normalizeCrudValueForWrite(data[field]));
      }
    }
    return { columns, values };
  }
}

