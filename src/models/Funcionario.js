export class Funcionario {
  static allowedFields = ["nomefuncionario"];

  constructor(db) {
    this.db = db;
  }

  async consultar({ idfuncionario, nomefuncionario, limit = 50, offset = 0 } = {}) {
    const where = [];
    const values = [];

    if (idfuncionario != null) {
      values.push(idfuncionario);
      where.push(`idfuncionario = $${values.length}`);
    }
    if (nomefuncionario != null) {
      values.push(`%${nomefuncionario}%`);
      where.push(`nomefuncionario ILIKE $${values.length}`);
    }

    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const sql = `
      SELECT *
      FROM funcionario
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY idfuncionario DESC
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
    const sql = `INSERT INTO funcionario (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async alterar(idfuncionario, data) {
    if (idfuncionario == null) throw new Error("Informe o id para alterar.");
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) throw new Error("Nenhum campo válido para alteração.");
    const sets = columns.map((col, i) => `${col} = $${i + 1}`);
    values.push(idfuncionario);
    const sql = `UPDATE funcionario SET ${sets.join(", ")} WHERE idfuncionario = $${values.length} RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async excluir(idfuncionario) {
    if (idfuncionario == null) throw new Error("Informe o id para excluir.");
    const res = await this.db.pool.query("DELETE FROM funcionario WHERE idfuncionario = $1", [
      idfuncionario,
    ]);
    return res.rowCount ?? 0;
  }

  #pickAllowedFields(data) {
    const columns = [];
    const values = [];
    if (!data || typeof data !== "object") return { columns, values };
    for (const field of Funcionario.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field) && data[field] != null) {
        columns.push(field);
        values.push(data[field]);
      }
    }
    return { columns, values };
  }
}

