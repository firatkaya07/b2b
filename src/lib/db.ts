import { Pool } from "pg";

// PostgreSQL (Supabase) bağlantısı. Vercel sunucusuz ortamı için bağlantı havuzu küçük tutulur.
// DATABASE_URL: Supabase "Transaction pooler" (port 6543) bağlantı dizesi önerilir.
declare global {
  // eslint-disable-next-line no-var
  var __pool: Pool | undefined;
}

function getPool(): Pool {
  if (!global.__pool) {
    // Vercel'in Supabase entegrasyonu değişkeni POSTGRES_URL adıyla ekler.
    const connectionString =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL_NON_POOLING;
    if (!connectionString) {
      throw new Error(
        "Veritabanı bağlantı dizesi yok. DATABASE_URL veya POSTGRES_URL ayarlayın (Supabase Postgres)."
      );
    }
    global.__pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 3,
    });
  }
  return global.__pool;
}

// SQL içinde "?" yer tutucularını Postgres "$1, $2, ..." biçimine çevirir.
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

// Birden çok satır döndüren sorgular.
export async function q<T = any>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await getPool().query(toPg(sql), params);
  return res.rows as T[];
}

// Tek satır (veya undefined).
export async function one<T = any>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  const rows = await q<T>(sql, params);
  return rows[0];
}

// INSERT/UPDATE/DELETE. INSERT için "RETURNING id" ekleyip oluşan id'yi döndürür.
export async function run(
  sql: string,
  params: unknown[] = []
): Promise<{ rowCount: number; id?: number }> {
  const res = await getPool().query(toPg(sql), params);
  const id = res.rows?.[0]?.id;
  return { rowCount: res.rowCount ?? 0, id: id != null ? Number(id) : undefined };
}
