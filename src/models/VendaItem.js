export class VendaItem {
  static allowedFields = ["idvenda", "idproduto", "quantidade", "valorunitario", "valortotal"];

  constructor(db) {
    this.db = db;
  }

  async consultar({ idvendaitem, idvenda, idproduto, limit = 50, offset = 0 } = {}) {
    const where = [];
    const values = [];

    if (idvendaitem != null) {
      values.push(idvendaitem);
      where.push(`idvendaitem = $${values.length}`);
    }
    if (idvenda != null) {
      values.push(idvenda);
      where.push(`idvenda = $${values.length}`);
    }
    if (idproduto != null) {
      values.push(idproduto);
      where.push(`idproduto = $${values.length}`);
    }

    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const sql = `
      SELECT *
      FROM vendaitem
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY idvendaitem DESC
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
    const sql = `INSERT INTO vendaitem (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async alterar(idvendaitem, data) {
    if (idvendaitem == null) throw new Error("Informe o id para alterar.");
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) throw new Error("Nenhum campo válido para alteração.");
    const sets = columns.map((col, i) => `${col} = $${i + 1}`);
    values.push(idvendaitem);
    const sql = `UPDATE vendaitem SET ${sets.join(", ")} WHERE idvendaitem = $${values.length} RETURNING *`;
    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async excluir(idvendaitem) {
    if (idvendaitem == null) throw new Error("Informe o id para excluir.");
    const res = await this.db.pool.query("DELETE FROM vendaitem WHERE idvendaitem = $1", [idvendaitem]);
    return res.rowCount ?? 0;
  }

  #pickAllowedFields(data) {
    const columns = [];
    const values = [];
    if (!data || typeof data !== "object") return { columns, values };
    for (const field of VendaItem.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field) && data[field] != null) {
        columns.push(field);
        values.push(data[field]);
      }
    }
    return { columns, values };
  }
}

