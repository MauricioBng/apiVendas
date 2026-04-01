/**
 * Qualquer string enviada nos CRUDs é gravada em maiúsculas (pt-BR).
 * Números, booleans e null não são alterados.
 * @param {unknown} value
 * @returns {unknown}
 */
export function normalizeCrudValueForWrite(value) {
  if (typeof value === "string") return value.toLocaleUpperCase("pt-BR");
  return value;
}
