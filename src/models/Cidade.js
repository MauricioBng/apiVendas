import { normalizeCrudValueForWrite } from "../utils/crudNormalize.js";

export class Cidade {
  static allowedFields = ["nomecidade"];

  constructor(db) {
    this.db = db;
  }

  async consultar({ idcidade, nomecidade, limit = 50, offset = 0 } = {}) {
    const where = [];
    const values = [];

    if (idcidade != null) {
      values.push(idcidade);
      where.push(`idcidade = $${values.length}`);
    }
    if (nomecidade != null) {
      values.push(`%${nomecidade}%`);
      where.push(`nomecidade ILIKE $${values.length}`);
    }

    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const sql = `
      SELECT *
      FROM cidade
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY idcidade DESC
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
    const sql = `INSERT INTO cidade (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async alterar(idcidade, data) {
    if (idcidade == null) throw new Error("Informe o id para alterar.");
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) throw new Error("Nenhum campo válido para alteração.");
    const sets = columns.map((col, i) => `${col} = $${i + 1}`);
    values.push(idcidade);
    const sql = `UPDATE cidade SET ${sets.join(", ")} WHERE idcidade = $${values.length} RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async excluir(idcidade) {
    if (idcidade == null) throw new Error("Informe o id para excluir.");
    const res = await this.db.pool.query("DELETE FROM cidade WHERE idcidade = $1", [idcidade]);
    return res.rowCount ?? 0;
  }

  #pickAllowedFields(data) {
    const columns = [];
    const values = [];
    if (!data || typeof data !== "object") return { columns, values };
    for (const field of Cidade.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field) && data[field] != null) {
        columns.push(field);
        values.push(normalizeCrudValueForWrite(data[field]));
      }
    }
    return { columns, values };
  }
}

