import pg from "pg";

const { Pool } = pg;

export class PostgresClient {
  constructor({
    host = "localhost",
    port = 5432,
    user = "postgres",
    password = "postgres",
    database = "testes",
  } = {}) {
    this.pool = new Pool({ host, port, user, password, database });
  }

  async testConnection() {
    const res = await this.pool.query("SELECT NOW() as now");
    return res.rows[0]?.now ?? null;
  }

  async close() {
    await this.pool.end();
  }
}

