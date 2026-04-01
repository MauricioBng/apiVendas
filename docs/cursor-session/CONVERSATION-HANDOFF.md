# Handoff da conversa — projeto Node + React (cadastros e vendas)

**Última atualização do arquivo:** 2026-04-01  
**Escopo preferencial do usuário:** ajustes recentes concentrados em **Movimento de Vendas** (`frontend`), salvo quando indicado outro cadastro.

---

## Visão geral do sistema

- **Backend:** Node, HTTP server em `src/index.js`, Postgres, CRUD por recurso (`cliente`, `cidade`, `bairro`, `funcionario`, `produto`, `venda`, `vendaitem`).
- **Modelos:** `src/models/*.js` — `allowedFields`, `incluir` / `alterar` / `consultar` / `excluir`; strings normalizadas com `src/utils/crudNormalize.js` (`normalizeCrudValueForWrite`).
- **Frontend:** React + Vite em `frontend/`, proxy `/api` em dev, `frontend/src/api.js`.

---

## Frontend — rotas e páginas

- **Cadastros:** definidos em `frontend/src/App.jsx` (cliente, cidade, bairro, funcionário, produto).
- **Movimento de Vendas:** `frontend/src/pages/VendaPage.jsx` → usa `CadastroPage` com `formLayout="horizontal"`, `insertAfterFieldName="parcelas"`, `renderInsertAfter` com `VendaItensForm`.
- **Formulário genérico:** `frontend/src/pages/CadastroPage.jsx` (modo Novo / Pesquisar, payload, FKs, `datePickerBr`, grade 12 colunas para venda, `patchVendaForm`, `ensureVendaBeforeItem`, efeito `valorliquido = valorbruto - desconto + acrescimo`).

---

## Componentes importantes

| Arquivo | Função |
|---------|--------|
| `frontend/src/components/FkField.jsx` | Combobox FK: busca com debounce, botão **Lista** (30 registros) quando campo vazio, limpar seleção. |
| `frontend/src/components/DatePickerBrField.jsx` | Data `dd/mm/aaaa` + calendário nativo (`showPicker`). |
| `frontend/src/components/VendaItensForm.jsx` | Itens da venda: produto (FK), qtd, VU (de `vrvenda`), total calculado; sem `<form>` interno (`type="button"`); `loadItems(overrideId)` após criar venda no primeiro item; tabela com **Nº** (contagem), **Produto** = descrição via API; `syncValorBrutoFromRows` + `PATCH` venda `valorbruto`. |
| `frontend/src/utils/format.js` | `formatDecimal2`, `parseDecimalBr`, datas, CPF, `toCrudUpperInput`. |

---

## Movimento de Vendas — regras de negócio na UI

- Campos **Valor bruto** e **Valor líquido:** somente leitura; bruto = soma de `valortotal` dos itens; líquido recalculado no `CadastroPage` a partir de bruto, desconto e acréscimo.
- **Parcelas:** padrão **0** em Novo (`setForm({ parcelas: "0" })`); payload força `parcelas: 0` se omitido; `setRecordInForm` trata `parcelas` vazio como `"0"` em venda.
- **Primeiro item em Novo:** `ensureVendaBeforeItem` faz `POST /venda` se ainda não houver `idvenda` (obrigatório cliente, funcionário, data).
- **Atualizar venda** (`onUpdate`): para `resource === "venda"` não chama `runSearch()` após sucesso — mantém seleção.
- **Grade horizontal:** `gridSpan` em `VendaPage.jsx` (cliente 5, funcionário 4, data 3, etc.).
- **Produto (cadastro):** `custo` e `vrvenda` com `decimal2: true` em `App.jsx`.

---

## Estilos

- `frontend/src/styles.css` — `.venda-form-fields-row`, `.venda-itens-*`, `.fk-combo-*`, `.date-picker-br-*`, `.venda-field-readonly`, etc.

---

## Onde paramos (ponto de retomada)

- Handoff e pasta `docs/cursor-session/` criados para versionar contexto no Git.
- Próximos passos possíveis (não solicitados explicitamente): otimizar N+1 nas descrições de produto na tabela de itens (endpoint agregado), excluir/editar linha de `vendaitem`, ou alinhar mais cadastros com `decimal2`.

---

## Como o agente deve usar este arquivo

1. Tratar este Markdown como **fonte de verdade** para decisões já tomadas no projeto.  
2. Se o usuário disser que o chat “perdeu contexto”, sugerir `@docs/cursor-session/CONVERSATION-HANDOFF.md` e resumir divergências.  
3. Após mudanças arquiteturais relevantes, **atualizar** este arquivo (e a data no topo) em conjunto com o usuário.
