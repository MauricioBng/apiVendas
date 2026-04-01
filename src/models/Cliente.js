import { normalizeCrudValueForWrite } from "../utils/crudNormalize.js";

/**
 * CRUD da tabela `cliente`.
 *
 * Ajuste `allowedFields` para refletir as colunas reais da sua tabela.
 */
export class Cliente {
  static allowedFields = [
    "nome",
    "cpf",
    "rg",
    "dtnascimento",
    "celular",
    "endereco",
    "idbairro",
    "idcidade",
  ];

  /**
   * @param {import("../db/PostgresClient.js").PostgresClient} db
   */
  constructor(db) {
    this.db = db;
  }

  async consultar({
    idcliente,
    nome,
    cpf,
    idbairro,
    idcidade,
    nomebairro,
    nomecidade,
    limit = 50,
    offset = 0,
  } = {}) {
    const where = [];
    const values = [];

    if (idcliente != null) {
      values.push(idcliente);
      where.push(`idcliente = $${values.length}`);
    }
    if (nome != null) {
      values.push(`%${nome}%`);
      where.push(`nome ILIKE $${values.length}`);
    }
    if (cpf != null) {
      values.push(cpf);
      where.push(`cpf = $${values.length}`);
    }
    if (idbairro != null) {
      values.push(idbairro);
      where.push(`idbairro = $${values.length}`);
    }
    if (idcidade != null) {
      values.push(idcidade);
      where.push(`idcidade = $${values.length}`);
    }
    if (nomebairro != null && String(nomebairro).trim() !== "") {
      values.push(`%${nomebairro}%`);
      where.push(
        `EXISTS (SELECT 1 FROM bairro b WHERE b.idbairro = cliente.idbairro AND b.nomebairro ILIKE $${values.length})`,
      );
    }
    if (nomecidade != null && String(nomecidade).trim() !== "") {
      values.push(`%${nomecidade}%`);
      where.push(
        `EXISTS (SELECT 1 FROM cidade c WHERE c.idcidade = cliente.idcidade AND c.nomecidade ILIKE $${values.length})`,
      );
    }

    values.push(limit);
    const limitIdx = values.length;
    values.push(offset);
    const offsetIdx = values.length;

    const sql = `
      SELECT *
      FROM cliente
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY idcliente DESC
      LIMIT $${limitIdx}
      OFFSET $${offsetIdx}
    `;

    const res = await this.db.pool.query(sql, values);
    return res.rows;
  }

  async incluir(data) {
    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) {
      throw new Error("Nenhum campo válido para inclusão.");
    }

    const placeholders = values.map((_, i) => `$${i + 1}`);
    const sql = `
      INSERT INTO cliente (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async alterar(idcliente, data) {
    if (idcliente == null) throw new Error("Informe o id para alterar.");

    const { columns, values } = this.#pickAllowedFields(data);
    if (columns.length === 0) {
      throw new Error("Nenhum campo válido para alteração.");
    }

    const sets = columns.map((col, i) => `${col} = $${i + 1}`);
    values.push(idcliente);
    const sql = `
      UPDATE cliente
      SET ${sets.join(", ")}
      WHERE idcliente = $${values.length}
      RETURNING *
    `;

    const res = await this.db.pool.query(sql, values);
    return res.rows[0] ?? null;
  }

  async excluir(idcliente) {
    if (idcliente == null) throw new Error("Informe o id para excluir.");

    const res = await this.db.pool.query(
      `
        DELETE FROM cliente
        WHERE idcliente = $1
      `,
      [idcliente],
    );
    return res.rowCount ?? 0;
  }

  #pickAllowedFields(data) {
    const columns = [];
    const values = [];

    if (!data || typeof data !== "object") return { columns, values };

    for (const field of Cliente.allowedFields) {
      if (Object.prototype.hasOwnProperty.call(data, field) && data[field] != null) {
        columns.push(field);
        values.push(normalizeCrudValueForWrite(data[field]));
      }
    }

    return { columns, values };
  }
}

