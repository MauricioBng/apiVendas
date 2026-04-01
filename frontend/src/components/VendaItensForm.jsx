import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { formatDecimal2, parseDecimalBr } from "../utils/format";
import { FkField } from "./FkField";

const fkProduto = {
  field: "idproduto",
  resource: "produto",
  idField: "idproduto",
  labelField: "descricao",
  searchParam: "descricao",
};

/** Evita que Enter dispare o submit do formulário pai (cabeçalho da venda). */
function stopEnterSubmit(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    e.stopPropagation();
  }
}

/**
 * Inclusão de linhas em `vendaitem` para uma venda já salva (`idvenda`).
 * `patchVendaForm` atualiza o campo valor bruto no formulário da venda após somar os itens.
 */
export function VendaItensForm({ idvenda, patchVendaForm, isNovo, ensureVendaBeforeItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [idproduto, setIdproduto] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [valorunitario, setValorunitario] = useState("");
  const [valortotal, setValortotal] = useState("");
  const [produtoLabels, setProdutoLabels] = useState({});

  /** Ordem cronológica (primeiro lançado = item 1). */
  const displayRows = useMemo(
    () => [...items].sort((a, b) => Number(a.idvendaitem) - Number(b.idvendaitem)),
    [items],
  );

  useEffect(() => {
    const ids = [
      ...new Set(displayRows.map((i) => i.idproduto).filter((x) => x != null && x !== "")),
    ];
    if (ids.length === 0) {
      setProdutoLabels({});
      return;
    }
    let cancelled = false;
    (async () => {
      const map = {};
      await Promise.all(
        ids.map(async (id) => {
          const key = String(id);
          try {
            const rows = await api.list("produto", { idproduto: Number(id), limit: 1 });
            if (!cancelled) {
              map[key] = rows?.[0]?.descricao != null ? String(rows[0].descricao) : key;
            }
          } catch {
            if (!cancelled) map[key] = key;
          }
        }),
      );
      if (!cancelled) setProdutoLabels(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [displayRows]);

  const syncValorBrutoFromRows = useCallback(
    async (rows, overrideVendaId) => {
      const vid = overrideVendaId ?? idvenda;
      if (vid == null || vid === "" || typeof patchVendaForm !== "function") return;
      const sum = rows.reduce((s, r) => {
        const v = Number(r.valortotal);
        return s + (Number.isNaN(v) ? 0 : v);
      }, 0);
      const rounded = Math.round(sum * 100) / 100;
      try {
        await api.update("venda", Number(vid), { valorbruto: rounded });
        patchVendaForm({ valorbruto: formatDecimal2(rounded) });
      } catch (e) {
        setMsg(e?.message ?? String(e));
      }
    },
    [idvenda, patchVendaForm],
  );

  const loadItems = useCallback(
    async (overrideId) => {
      const vid = overrideId != null && overrideId !== "" ? overrideId : idvenda;
      if (vid == null || vid === "") {
        setItems([]);
        return;
      }
      setLoading(true);
      setMsg("");
      try {
        const rows = await api.list("vendaitem", { idvenda: vid, limit: 200, offset: 0 });
        const list = Array.isArray(rows) ? rows : [];
        setItems(list);
        await syncValorBrutoFromRows(list, vid);
      } catch (e) {
        setMsg(e?.message ?? String(e));
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [idvenda, syncValorBrutoFromRows],
  );

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  /** Ao escolher produto, preenche valor unitário com `vrvenda` do cadastro de produto */
  useEffect(() => {
    if (idproduto === "" || idproduto == null) {
      setValorunitario("");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const rows = await api.list("produto", { idproduto: Number(idproduto), limit: 1 });
        if (cancelled || !rows?.[0]) return;
        const vr = rows[0].vrvenda;
        if (vr != null && !Number.isNaN(Number(vr))) {
          setValorunitario(formatDecimal2(vr));
        }
      } catch {
        /* mantém valor atual se a busca falhar */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idproduto]);

  /** Valor total = quantidade × valor unitário (somente leitura). */
  useEffect(() => {
    const q = parseDecimalBr(quantidade);
    const vu = parseDecimalBr(valorunitario);
    if (!Number.isNaN(q) && q > 0 && !Number.isNaN(vu) && vu >= 0) {
      const vt = Math.round(q * vu * 100) / 100;
      setValortotal(formatDecimal2(vt));
    } else {
      setValortotal("");
    }
  }, [quantidade, valorunitario]);

  const handleIncluirItem = async () => {
    setMsg("");
    let effectiveId = idvenda;
    if (effectiveId == null || effectiveId === "") {
      if (typeof ensureVendaBeforeItem === "function") {
        try {
          effectiveId = await ensureVendaBeforeItem();
        } catch (err) {
          setMsg(err?.message ?? String(err));
          return;
        }
      }
    }
    if (effectiveId == null || effectiveId === "") {
      setMsg("Não foi possível obter o código da venda.");
      return;
    }
    const vid = Number(effectiveId);
    const pid = Number(idproduto);
    const q = parseDecimalBr(quantidade);
    const vu = parseDecimalBr(valorunitario);
    const vt = Math.round(q * vu * 100) / 100;
    if (!pid || Number.isNaN(pid)) {
      setMsg("Selecione o produto.");
      return;
    }
    if (Number.isNaN(q) || q <= 0) {
      setMsg("Informe a quantidade.");
      return;
    }
    if (Number.isNaN(vu) || vu < 0) {
      setMsg("Informe o valor unitário.");
      return;
    }
    if (Number.isNaN(vt)) {
      setMsg("Não foi possível calcular o valor total.");
      return;
    }
    setSaving(true);
    try {
      await api.create("vendaitem", {
        idvenda: vid,
        idproduto: pid,
        quantidade: q,
        valorunitario: vu,
        valortotal: vt,
      });
      setIdproduto("");
      setQuantidade("");
      setValorunitario("");
      setValortotal("");
      setMsg("Item incluído.");
      await loadItems(vid);
    } catch (err) {
      setMsg(err?.message ?? String(err));
    } finally {
      setSaving(false);
    }
  };

  const needsId =
    (idvenda == null || idvenda === "") && (!isNovo || typeof ensureVendaBeforeItem !== "function");
  const disabled = needsId;

  return (
    <div className="venda-itens-section">
      <h4 className="venda-itens-title">Itens da venda</h4>
      {!isNovo && disabled && (
        <p className="hint venda-itens-hint">
          Selecione uma venda na pesquisa para incluir itens.
        </p>
      )}
      {msg && <p className={msg.startsWith("Item incluído") ? "hint" : "error"}>{msg}</p>}

      <div className="venda-itens-form">
        <div className="venda-itens-form-grid">
          <FkField
            fkConfig={fkProduto}
            value={idproduto}
            onChange={setIdproduto}
            disabled={disabled}
            label="Produto"
          />
          <label>
            Quantidade
            <input
              type="text"
              inputMode="decimal"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              onBlur={(e) => {
                const raw = e.target.value;
                if (raw.trim() === "") return;
                const n = parseDecimalBr(raw);
                if (!Number.isNaN(n)) setQuantidade(formatDecimal2(n));
              }}
              onKeyDown={stopEnterSubmit}
              disabled={disabled}
            />
          </label>
          <label>
            Valor unitário
            <input
              type="text"
              inputMode="decimal"
              value={valorunitario}
              onChange={(e) => setValorunitario(e.target.value)}
              onBlur={(e) => {
                const raw = e.target.value;
                if (raw.trim() === "") return;
                const n = parseDecimalBr(raw);
                if (!Number.isNaN(n)) setValorunitario(formatDecimal2(n));
              }}
              onKeyDown={stopEnterSubmit}
              disabled={disabled}
            />
          </label>
          <label>
            Valor total
            <input
              type="text"
              readOnly
              tabIndex={-1}
              title="Calculado: Quantidade × Valor unitário"
              value={valortotal}
              className="venda-itens-valortotal-readonly"
              disabled={disabled}
            />
          </label>
        </div>
        <button type="button" disabled={disabled || saving} onClick={() => void handleIncluirItem()}>
          {saving ? "Incluindo…" : "Incluir item"}
        </button>
      </div>

      <div className="venda-itens-list-wrap">
        <h5 className="venda-itens-list-title">Itens lançados</h5>
        {loading ? (
          <p>Carregando itens…</p>
        ) : items.length === 0 ? (
          <p className="venda-itens-empty">Nenhum item nesta venda.</p>
        ) : (
          <table className="venda-itens-table">
            <thead>
              <tr>
                <th>Nº</th>
                <th>Produto</th>
                <th>Qtd</th>
                <th>Vlr. unit.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) => (
                <tr key={row.idvendaitem}>
                  <td>{idx + 1}</td>
                  <td>{produtoLabels[String(row.idproduto)] ?? row.idproduto}</td>
                  <td>{formatDecimal2(row.quantidade)}</td>
                  <td>{formatDecimal2(row.valorunitario)}</td>
                  <td>{formatDecimal2(row.valortotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
