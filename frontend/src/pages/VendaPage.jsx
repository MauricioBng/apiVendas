import { VendaItensForm } from "../components/VendaItensForm";
import CadastroPage from "./CadastroPage";

/** gridSpan: colunas (de 12) no registro selecionado — 1ª linha: Cliente (maior), Funcionário, Data */
const fields = [
  { name: "idcliente", label: "Cliente", type: "number", gridSpan: 5 },
  { name: "idfuncionario", label: "Funcionário", type: "number", gridSpan: 4 },
  { name: "datavenda", label: "Data da venda", format: "datePickerBr", gridSpan: 3 },
  { name: "valorbruto", label: "Valor bruto", type: "number", gridSpan: 3, decimal2: true, readOnly: true },
  { name: "desconto", label: "Desconto", type: "number", gridSpan: 3, decimal2: true },
  { name: "acrescimo", label: "Acréscimo", type: "number", gridSpan: 3, decimal2: true },
  { name: "valorliquido", label: "Valor líquido", type: "number", gridSpan: 3, decimal2: true, readOnly: true },
  { name: "parcelas", label: "Parcelas", type: "number", gridSpan: 3 },
];

const searchFields = [
  { name: "idvenda", label: "ID Venda" },
  { name: "idcliente", label: "ID Cliente (código)" },
  { name: "idfuncionario", label: "ID Funcionário (código)" },
  { name: "nomecliente", label: "Cliente (parte do nome)", fkTextSearch: true },
  { name: "nomefuncionario", label: "Funcionário (parte do nome)", fkTextSearch: true },
  { name: "datavenda", label: "Data da venda", format: "datePickerBr" },
  { name: "valorbruto", label: "Valor bruto" },
  { name: "desconto", label: "Desconto" },
  { name: "acrescimo", label: "Acréscimo" },
  { name: "valorliquido", label: "Valor líquido" },
  { name: "parcelas", label: "Parcelas" },
];

const fkConfigs = [
  {
    field: "idcliente",
    resource: "cliente",
    idField: "idcliente",
    labelField: "nome",
    searchParam: "nome",
  },
  {
    field: "idfuncionario",
    resource: "funcionario",
    idField: "idfuncionario",
    labelField: "nomefuncionario",
    searchParam: "nomefuncionario",
  },
];

export default function VendaPage() {
  return (
    <CadastroPage
      title="Movimento de Vendas"
      resource="venda"
      idField="idvenda"
      fields={fields}
      searchFields={searchFields}
      fkConfigs={fkConfigs}
      formLayout="horizontal"
      insertAfterFieldName="parcelas"
      renderInsertAfter={({ idVenda, patchVendaForm, isNovo, ensureVendaBeforeItem }) => (
        <VendaItensForm
          idvenda={idVenda}
          patchVendaForm={patchVendaForm}
          isNovo={isNovo}
          ensureVendaBeforeItem={ensureVendaBeforeItem}
        />
      )}
    />
  );
}
