import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { toCrudUpperInput } from "../utils/format";

function fkOptionLabel(item, labelField) {
  if (!item) return "";
  const t = item[labelField];
  return t != null && t !== "" ? String(t) : "(sem descrição)";
}

function fkIdWithLabel(selectedId, row, fkConfig) {
  if (selectedId === "" || selectedId == null) return "";
  if (!row) return String(selectedId);
  const t = row[fkConfig.labelField];
  const label = t != null && String(t).trim() !== "" ? String(t).trim() : "";
  const idStr = String(selectedId);
  return label ? `${idStr} — ${label}` : idStr;
}

/**
 * Combobox único: buscar (digitar) e escolher na lista; mesmo campo.
 * fkConfig: { field, resource, idField, labelField, searchParam }
 */
export function FkField({ fkConfig, value, onChange, disabled, label }) {
  const { resource, idField, labelField, searchParam } = fkConfig;
  const [text, setText] = useState("");
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const skipSearchRef = useRef(false);
  /** Evita apagar o texto quando o valor foi limpo para continuar digitando a busca */
  const ignoreEmptySyncRef = useRef(false);

  useEffect(() => {
    if (value === "" || value == null) {
      if (ignoreEmptySyncRef.current) {
        ignoreEmptySyncRef.current = false;
        return;
      }
      setText("");
      setSelectedRow(null);
      skipSearchRef.current = false;
      return;
    }
    let cancelled = false;
    (async () => {
      const rows = await api.list(resource, { [idField]: value, limit: 1 });
      if (cancelled || !rows[0]) return;
      skipSearchRef.current = true;
      setSelectedRow(rows[0]);
      setText(toCrudUpperInput(fkOptionLabel(rows[0], labelField)));
    })();
    return () => {
      cancelled = true;
    };
  }, [value, resource, idField, labelField]);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const q = text.trim();
        if (!q) {
          if (!cancelled) setOptions([]);
          return;
        }
        const params = { limit: 30, offset: 0, [searchParam]: q };
        let rows = await api.list(resource, params);
        if (cancelled) return;
        if (value != null && value !== "") {
          const found = rows.some((r) => String(r[idField]) === String(value));
          if (!found) {
            const extra = await api.list(resource, { [idField]: value, limit: 1 });
            if (!cancelled && extra[0]) rows = [extra[0], ...rows];
          }
        }
        if (!cancelled) setOptions(rows);
      } catch {
        if (!cancelled) setOptions([]);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [text, resource, searchParam, idField, value]);

  const pick = (item) => {
    skipSearchRef.current = true;
    setSelectedRow(item);
    setText(toCrudUpperInput(fkOptionLabel(item, labelField)));
    onChange(String(item[idField]));
    setOpen(false);
  };

  const clear = () => {
    setText("");
    setSelectedRow(null);
    setOptions([]);
    onChange("");
    skipSearchRef.current = false;
  };

  const onInputChange = (e) => {
    const v = toCrudUpperInput(e.target.value);
    setText(v);
    setSelectedRow(null);
    if (value) {
      ignoreEmptySyncRef.current = true;
      onChange("");
    }
    setOpen(true);
  };

  const onInputFocus = () => {
    setOpen(true);
  };

  const onInputBlur = () => {
    setTimeout(() => setOpen(false), 180);
  };

  const loadAllRecords = async () => {
    setOpen(true);
    try {
      const rows = await api.list(resource, { limit: 30, offset: 0 });
      setOptions(rows);
    } catch {
      setOptions([]);
    }
  };

  const hasSelection = value !== "" && value != null;
  const showListAllBtn = !hasSelection && !disabled && !text.trim();

  return (
    <div className="fk-field fk-combo">
      <label className="fk-combo-label">{label}</label>
      <div className={`fk-combo-wrap ${showListAllBtn ? "fk-combo-wrap--with-list" : ""}`}>
        <input
          type="text"
          className={`fk-combo-input ${showListAllBtn ? "fk-combo-input--with-side-btn" : ""}`}
          value={text}
          onChange={onInputChange}
          onFocus={onInputFocus}
          onBlur={onInputBlur}
          placeholder="Digite para buscar e clique na opção…"
          disabled={disabled}
          autoComplete="off"
        />
        {showListAllBtn && (
          <button
            type="button"
            className="fk-combo-list-all"
            title="Listar registros da tabela"
            aria-label="Listar registros da tabela"
            onMouseDown={(e) => e.preventDefault()}
            onClick={loadAllRecords}
          >
            Lista
          </button>
        )}
        {hasSelection && !disabled && (
          <button
            type="button"
            className="fk-combo-clear"
            aria-label="Limpar"
            onMouseDown={(e) => e.preventDefault()}
            onClick={clear}
          >
            ×
          </button>
        )}
        {open && options.length > 0 && (
          <ul className="fk-combo-list" role="listbox">
            {options.map((item) => (
              <li
                key={item[idField]}
                role="option"
                className="fk-combo-option"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item);
                }}
              >
                {toCrudUpperInput(fkOptionLabel(item, labelField))}
              </li>
            ))}
          </ul>
        )}
      </div>
      {hasSelection && (
        <p className="fk-selected-id">
          Código: <strong>{fkIdWithLabel(value, selectedRow, fkConfig)}</strong>
        </p>
      )}
    </div>
  );
}
