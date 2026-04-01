import { cloneElement, useCallback, useEffect, useMemo, useState } from "react";
import { DatePickerBrField } from "../components/DatePickerBrField";
import { FkField } from "../components/FkField";
import { api } from "../api";
import {
  cpfToApi,
  dateApiToBr,
  dateBrToApi,
  formatCpfDisplay,
  formatDecimal2,
  maskDateBrInput,
  onlyDigits,
  parseDecimalBr,
  toCrudUpperInput,
} from "../utils/format";

function coerceValue(type, value) {
  if (value === "") return null;
  if (type === "number") return Number(value);
  return value;
}

export default function CadastroPage({
  title,
  resource,
  idField,
  fields,
  searchFields = [],
  fkConfigs = [],
  /** `"horizontal"` — em Movimento de Vendas, campos de registro selecionado em grade horizontal */
  formLayout,
  /** Nome do campo (`fields`) após o qual inserir conteúdo extra (ex.: itens da venda) */
  insertAfterFieldName,
  renderInsertAfter,
}) {
  /** inicio = tela limpa (form oculto); novo = inclusão; pesquisar = busca + edição ao selecionar */
  const [mode, setMode] = useState("inicio");
  const [searchField, setSearchField] = useState(searchFields[0]?.name ?? idField);
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSearchField(searchFields[0]?.name ?? idField);
  }, [searchFields, idField]);

  const buildSearchParams = useCallback(() => {
    const fieldMeta = fields.find((f) => f.name === searchField);
    let queryValue = searchValue;
    if (fieldMeta?.format === "cpf") {
      const d = onlyDigits(searchValue, 11);
      queryValue = d.length ? d : searchValue;
    } else if (fieldMeta?.format === "dateBr" || fieldMeta?.format === "datePickerBr") {
      const iso = dateBrToApi(searchValue);
      queryValue = iso ?? searchValue;
    } else if (fieldMeta?.type === "number") {
      const n = Number(searchValue);
      queryValue = Number.isNaN(n) ? searchValue : n;
    } else {
      queryValue = searchValue;
    }
    return { [searchField]: queryValue };
  }, [searchField, searchValue, fields]);

  useEffect(() => {
    setMode("inicio");
    setSearchValue("");
    setResults([]);
    setSelectedRecord(null);
    setForm({});
    setError("");
  }, [resource]);

  const onChangeField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** Mescla campos no formulário (ex.: `valorbruto` após incluir item em vendaitem). */
  const patchVendaForm = useCallback((patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  }, []);

  const payload = useMemo(() => {
    const nextPayload = {};
    for (const field of fields) {
      const rawValue = form[field.name];
      if (rawValue === "" || rawValue == null) continue;
      if (field.format === "cpf") {
        const c = cpfToApi(rawValue);
        if (c) nextPayload[field.name] = c;
        continue;
      }
      if (field.format === "dateBr" || field.format === "datePickerBr") {
        const c = dateBrToApi(rawValue);
        if (c) nextPayload[field.name] = c;
        continue;
      }
      const converted = coerceValue(field.type, rawValue ?? "");
      if (converted !== null) nextPayload[field.name] = converted;
    }
    if (resource === "venda" && !Object.prototype.hasOwnProperty.call(nextPayload, "parcelas")) {
      nextPayload.parcelas = 0;
    }
    return nextPayload;
  }, [form, fields, resource]);

  const setRecordInForm = (record) => {
    if (!record) return;
    const nextForm = {};
    for (const field of fields) {
      const v = record[field.name];
      if (field.format === "cpf") {
        nextForm[field.name] = v != null && v !== "" ? formatCpfDisplay(String(v)) : "";
      } else if (field.format === "dateBr" || field.format === "datePickerBr") {
        nextForm[field.name] = v != null && v !== "" ? dateApiToBr(v) : "";
      } else if (field.type === "number" || field.type === "date") {
        if (field.type === "number" && field.decimal2 && v != null && v !== "") {
          nextForm[field.name] = formatDecimal2(v);
        } else if (resource === "venda" && field.name === "parcelas" && (v == null || v === "")) {
          nextForm[field.name] = "0";
        } else {
          nextForm[field.name] = v ?? "";
        }
      } else {
        const s = v ?? "";
        nextForm[field.name] = s === "" ? "" : toCrudUpperInput(String(s));
      }
    }
    setForm(nextForm);
    setSelectedRecord(record);
  };

  /** Salva a venda na primeira inclusão de item (Novo) quando ainda não há `idvenda`. */
  const ensureVendaBeforeItem = useCallback(async () => {
    if (resource !== "venda") return null;
    if (selectedRecord?.[idField] != null) return selectedRecord[idField];
    if (mode !== "novo") {
      throw new Error("Selecione uma venda na pesquisa ou abra Novo registro.");
    }
    const p = { ...payload };
    if (!p.idcliente || !p.idfuncionario || !p.datavenda) {
      throw new Error("Preencha Cliente, Funcionário e Data da venda antes do primeiro item.");
    }
    const created = await api.create(resource, p);
    if (!created?.[idField]) throw new Error("Não foi possível salvar a venda.");
    setRecordInForm(created);
    setMode("pesquisar");
    setResults([]);
    setSearchValue("");
    setError("");
    return created[idField];
  }, [resource, selectedRecord, mode, payload, idField]);

  /** Valor líquido = valor bruto − desconto + acréscimo (somente venda). */
  useEffect(() => {
    if (resource !== "venda") return;
    setForm((prev) => {
      const vb = parseDecimalBr(prev.valorbruto);
      if (Number.isNaN(vb)) return prev;
      const d = parseDecimalBr(prev.desconto);
      const a = parseDecimalBr(prev.acrescimo);
      const d0 = Number.isNaN(d) ? 0 : d;
      const a0 = Number.isNaN(a) ? 0 : a;
      const vl = Math.round((vb - d0 + a0) * 100) / 100;
      const cur = parseDecimalBr(prev.valorliquido);
      const curOk = !Number.isNaN(cur);
      if (curOk && Math.abs(cur - vl) < 0.00001) return prev;
      return { ...prev, valorliquido: formatDecimal2(vl) };
    });
  }, [resource, form.valorbruto, form.desconto, form.acrescimo]);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      const created = await api.create(resource, payload);
      if (resource === "venda" && created && created[idField] != null) {
        setRecordInForm(created);
        setMode("pesquisar");
        setResults([]);
        setSearchValue("");
        setError("Venda registrada. Inclua os itens abaixo ou pesquise outra venda.");
        return;
      }
      setForm({});
      setMode("pesquisar");
      setResults([]);
      setSearchValue("");
      setSelectedRecord(null);
      setError("Registro incluído com sucesso. Faça uma pesquisa para visualizar.");
    } catch (err) {
      setError(err.message);
    }
  };

  const runSearch = useCallback(async () => {
    const q = searchValue.trim();
    if (!searchField || !q) {
      setError("Informe campo e valor para pesquisar.");
      return;
    }
    const fieldMeta = fields.find((f) => f.name === searchField);
    if (fieldMeta?.format === "dateBr" || fieldMeta?.format === "datePickerBr") {
      const iso = dateBrToApi(searchValue.trim());
      if (!iso) {
        setError("Informe a data completa (dd/mm/aaaa) para pesquisar.");
        return;
      }
    }

    setLoading(true);
    setError("");
    try {
      const params = buildSearchParams();
      const found = await api.list(resource, {
        ...params,
        limit: 30,
        offset: 0,
      });
      setResults(found);
      setSelectedRecord(null);
      setForm({});
      if (found.length === 0) setError("Nenhum registro encontrado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchField, searchValue, resource, buildSearchParams, fields]);

  /** Busca ao digitar (debounce) para todos os campos de pesquisa */
  useEffect(() => {
    if (mode !== "pesquisar") return;

    const q = searchValue.trim();
    if (!q) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    const fieldMeta = fields.find((f) => f.name === searchField);
    if (fieldMeta?.type === "number" && Number.isNaN(Number(q))) {
      setResults([]);
      setError("");
      setLoading(false);
      return;
    }

    if (fieldMeta?.format === "dateBr" || fieldMeta?.format === "datePickerBr") {
      const iso = dateBrToApi(searchValue.trim());
      if (!iso) {
        setResults([]);
        setError("");
        setLoading(false);
        return;
      }
    }

    let cancelled = false;
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = buildSearchParams();
        const found = await api.list(resource, {
          ...params,
          limit: 30,
          offset: 0,
        });
        if (cancelled) return;
        setResults(found);
        setSelectedRecord(null);
        setForm({});
        if (found.length === 0) setError("Nenhum registro encontrado.");
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [searchValue, searchField, mode, resource, buildSearchParams, fields]);

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!selectedRecord?.[idField]) {
      setError("Selecione um registro para atualizar.");
      return;
    }

    try {
      const updated = await api.update(resource, selectedRecord[idField], payload);
      setError("Registro atualizado com sucesso.");
      if (resource === "venda" && updated && typeof updated === "object") {
        setRecordInForm(updated);
        return;
      }
      await runSearch();
    } catch (err) {
      setError(err.message);
    }
  };

  const onDelete = async () => {
    if (!selectedRecord?.[idField]) return;
    const ok = window.confirm(
      `Excluir o registro selecionado (${idField} = ${selectedRecord[idField]})?\n\nEsta ação não pode ser desfeita.`,
    );
    if (!ok) return;
    try {
      await api.remove(resource, selectedRecord[idField]);
      setError("Registro excluído com sucesso.");
      setSelectedRecord(null);
      setForm({});
      setResults((prev) => prev.filter((row) => row[idField] !== selectedRecord[idField]));
    } catch (err) {
      setError(err.message);
    }
  };

  const isNovo = mode === "novo";
  const isPesquisar = mode === "pesquisar";
  const showMainForm = isNovo || (isPesquisar && Boolean(selectedRecord));
  /** Movimento de Vendas: grade horizontal em Novo registro e em Registro selecionado */
  const horizontalVendaFormLayout =
    formLayout === "horizontal" && showMainForm && (isNovo || Boolean(selectedRecord));

  const formLocked = !isNovo && !selectedRecord;

  const buildFieldElement = (field) => {
    const fkConfig = fkConfigs.find((fk) => fk.field === field.name);
    let inner;
    if (fkConfig) {
      inner = (
        <FkField
          fkConfig={fkConfig}
          value={form[field.name]}
          onChange={(v) => onChangeField(field.name, v)}
          disabled={!isNovo && !selectedRecord}
          label={field.label}
        />
      );
    } else if (field.format === "cpf") {
      inner = (
        <label>
          {field.label}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            maxLength={14}
            value={form[field.name] ?? ""}
            onChange={(e) => onChangeField(field.name, formatCpfDisplay(e.target.value))}
            disabled={!isNovo && !selectedRecord}
          />
        </label>
      );
    } else if (field.format === "datePickerBr") {
      inner = (
        <DatePickerBrField
          label={field.label}
          value={form[field.name]}
          onChange={(v) => onChangeField(field.name, v)}
          disabled={!isNovo && !selectedRecord}
        />
      );
    } else if (field.format === "dateBr") {
      inner = (
        <label>
          {field.label}
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="dd/mm/aaaa"
            maxLength={10}
            value={form[field.name] ?? ""}
            onChange={(e) => onChangeField(field.name, maskDateBrInput(e.target.value))}
            disabled={!isNovo && !selectedRecord}
          />
        </label>
      );
    } else if (field.type === "number") {
      const rawVal = form[field.name];
      let displayVal = "";
      if (rawVal !== "" && rawVal != null) {
        if (field.decimal2 && field.readOnly) {
          displayVal = formatDecimal2(rawVal);
        } else if (field.decimal2 && !field.readOnly) {
          displayVal = rawVal;
        } else {
          displayVal = rawVal;
        }
      }
      inner = (
        <label className={field.readOnly ? "venda-field-readonly" : undefined}>
          {field.label}
          <input
            type="number"
            step={field.decimal2 ? "0.01" : "1"}
            value={displayVal === "" ? "" : displayVal}
            readOnly={Boolean(field.readOnly) && !formLocked}
            disabled={formLocked}
            onChange={(e) => {
              const raw = e.target.value;
              onChangeField(field.name, raw === "" ? "" : raw);
            }}
            onBlur={(e) => {
              if (formLocked || field.readOnly || !field.decimal2) return;
              const raw = e.target.value;
              if (raw === "") return;
              const n = parseDecimalBr(raw);
              if (!Number.isNaN(n)) onChangeField(field.name, formatDecimal2(n));
            }}
          />
        </label>
      );
    } else {
      inner = (
        <label>
          {field.label}
          <input
            type={field.type || "text"}
            value={form[field.name] ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              const next = field.type === "date" ? raw : toCrudUpperInput(raw);
              onChangeField(field.name, next);
            }}
            disabled={!isNovo && !selectedRecord}
          />
        </label>
      );
    }

    if (horizontalVendaFormLayout) {
      const span = field.gridSpan ?? 3;
      return (
        <div key={field.name} className="venda-form-field-cell" style={{ gridColumn: `span ${span}` }}>
          {inner}
        </div>
      );
    }

    return cloneElement(inner, { key: field.name });
  };

  const formFieldNodes = fields.flatMap((field) => {
    const nodes = [buildFieldElement(field)];
    if (insertAfterFieldName && field.name === insertAfterFieldName && typeof renderInsertAfter === "function") {
      nodes.push(
        <div
          key={`${field.name}-insert`}
          className={horizontalVendaFormLayout ? "venda-itens-wrap" : "venda-itens-wrap venda-itens-wrap--stack"}
        >
          {renderInsertAfter({
            idVenda: selectedRecord?.[idField] ?? null,
            isNovo,
            selectedRecord,
            patchVendaForm,
            ensureVendaBeforeItem,
          })}
        </div>,
      );
    }
    return nodes;
  });

  return (
    <section className="page">
      <h2>{title}</h2>
      {error && <p className="error">{error}</p>}

      <div className="card mode-menu">
        <button
          className={isNovo ? "active" : ""}
          onClick={() => {
            setMode("novo");
            setSelectedRecord(null);
            setForm(resource === "venda" ? { parcelas: "0" } : {});
            setResults([]);
            setSearchValue("");
            setError("");
          }}
        >
          Novo
        </button>
        <button
          className={isPesquisar ? "active" : ""}
          onClick={() => {
            setMode("pesquisar");
            setSelectedRecord(null);
            setForm({});
            setResults([]);
            setSearchValue("");
            setError("");
          }}
        >
          Pesquisar
        </button>
      </div>

      {isPesquisar && (
        <div className="card search-bar">
          <label>
            Campo
            <select
              value={searchField}
              onChange={(e) => {
                setSearchField(e.target.value);
                setResults([]);
                setSelectedRecord(null);
                setForm({});
                setError("");
              }}
            >
              {searchFields.map((f) => (
                <option key={f.name} value={f.name}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Valor
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(toCrudUpperInput(e.target.value))}
              placeholder="Digite para filtrar…"
            />
          </label>
          <span className="search-fk-hint" title="Filtro atualizado enquanto você digita">
            {loading ? "Buscando…" : "Ao digitar"}
          </span>
          <p className="search-fk-note">
            A lista é atualizada automaticamente a cada digitação (com pequeno atraso). Para data de nascimento, informe
            a data completa (dd/mm/aaaa).
          </p>
        </div>
      )}

      {showMainForm && (
        <form className="card" onSubmit={isNovo ? onCreate : onUpdate}>
          <h3>{isNovo ? "Novo registro" : "Registro selecionado"}</h3>
          {!isNovo && selectedRecord && (
            <p>
              {idField}: <strong>{selectedRecord[idField]}</strong>
            </p>
          )}
          {horizontalVendaFormLayout ? (
            <div className="venda-form-fields-row">{formFieldNodes}</div>
          ) : (
            formFieldNodes
          )}

          {isNovo ? (
            <button type="submit">Salvar</button>
          ) : (
            <div className="actions">
              <button type="submit" disabled={!selectedRecord}>
                Atualizar
              </button>
              {selectedRecord && (
                <button type="button" className="danger" onClick={onDelete}>
                  Excluir registro
                </button>
              )}
            </div>
          )}
        </form>
      )}

      {isPesquisar && !selectedRecord && results.length > 0 && (
        <p className="hint">Selecione um registro na lista abaixo para editar ou excluir.</p>
      )}

      {isPesquisar && (
        <div className="card">
          <h3>Resultado da pesquisa</h3>
          {results.length === 0 ? (
            <p>Nenhum resultado carregado.</p>
          ) : (
            <div className="result-list">
              {results.map((row) => (
                <button
                  type="button"
                  key={row[idField]}
                  className="result-item"
                  onClick={() => setRecordInForm(row)}
                >
                  {idField}: {row[idField]} -{" "}
                  {(() => {
                    const raw = row[searchField] ?? row[fields[0]?.name];
                    const meta = fields.find((f) => f.name === searchField);
                    if (meta?.format === "cpf" && raw != null && raw !== "") {
                      return formatCpfDisplay(String(raw));
                    }
                    if (
                      (meta?.format === "dateBr" || meta?.format === "datePickerBr") &&
                      raw != null &&
                      raw !== ""
                    ) {
                      return dateApiToBr(raw);
                    }
                    if (meta?.type === "number" && meta?.decimal2 && raw != null && raw !== "") {
                      const n = Number(raw);
                      if (!Number.isNaN(n)) return formatDecimal2(n);
                    }
                    return String(raw ?? "").slice(0, 60);
                  })()}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
