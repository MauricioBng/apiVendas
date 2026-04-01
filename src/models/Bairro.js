import { normalizeCrudValueForWrite } from "../utils/crudNormalize.js";

export class Bairro {
  static allowedFields = ["nomebairro"];

  constructor(db) {
    this.db = db;
  }

  async consultar({ idbairro, nomebairro, limit = 50, offset = 0 } = {}) {
    const where = [];
    const values = [];

    if (idbairro != null) {
      values.push(idbairro);
      where.push(`idbairro = $${values.length}`);
    }
    if (nomebairro != null) {
      values.push(`%${nomebairro}%`);
      where.push(`nomebairro ILIKE $${values.length}`);
    }

    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const sql = `
      SELECT *
      FROM bairro
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY idbairro DESC
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
    const sql = `INSERT INTO bairro (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async alterar(idbairro, data) {
    if (idbairro == null) throw new Error("Informe o id para alterar.");
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) throw new Error("Nenhum campo válido para alteração.");
    const sets = columns.map((col, i) => `${col} = $${i + 1}`);
    values.push(idbairro);
    const sql = `UPDATE bairro SET ${sets.join(", ")} WHERE idbairro = $${values.length} RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async excluir(idbairro) {
    if (idbairro == null) throw new Error("Informe o id para excluir.");
    const res = await this.db.pool.query("DELETE FROM bairro WHERE idbairro = $1", [idbairro]);
    return res.rowCount ?? 0;
  }

  #pickAllowedFields(data) {
    const columns = [];
    const values = [];
    if (!data || typeof data !== "object") return { columns, values };
    for (const field of Bairro.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field) && data[field] != null) {
        columns.push(field);
        values.push(normalizeCrudValueForWrite(data[field]));
      }
    }
    return { columns, values };
  }
}

