/** Apenas dígitos, até `max` caracteres */
export function onlyDigits(value, max = 99) {
  return String(value ?? "").replace(/\D/g, "").slice(0, max);
}

/** CPF visual: 000.000.000-00 */
export function formatCpfDisplay(value) {
  const d = onlyDigits(value, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function cpfToApi(value) {
  const d = onlyDigits(value, 11);
  return d.length === 11 ? d : null;
}

/** Converte data vinda da API (YYYY-MM-DD ou ISO) para dd/mm/aaaa */
export function dateApiToBr(value) {
  if (value == null || value === "") return "";
  const s = String(value).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${d}/${mo}/${y}`;
  }
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    const dt = new Date(t);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }
  return "";
}

/** dd/mm/aaaa → yyyy-mm-dd (Postgres DATE) ou null */
export function dateBrToApi(value) {
  const s = String(value ?? "").trim();
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return `${String(yyyy)}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** Máscara progressiva enquanto digita (somente números) */
export function maskDateBrInput(raw) {
  const d = onlyDigits(raw, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
}

/** Texto livre nos formulários CRUD: alinha à regra de gravação em maiúsculas (pt-BR). */
export function toCrudUpperInput(value) {
  return String(value ?? "").toLocaleUpperCase("pt-BR");
}

/** Converte texto numérico (vírgula ou ponto) em número. */
export function parseDecimalBr(v) {
  if (v === "" || v == null) return NaN;
  return Number(String(v).trim().replace(",", "."));
}

/** Exibe valor monetário/decimal com exatamente duas casas decimais (string para input). */
export function formatDecimal2(value) {
  if (value === "" || value == null) return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "";
  return n.toFixed(2);
}
