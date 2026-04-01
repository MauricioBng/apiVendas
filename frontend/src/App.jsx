import { Link, Navigate, Route, Routes } from "react-router-dom";
import CadastroPage from "./pages/CadastroPage";
import VendaPage from "./pages/VendaPage";

const cadastroPages = [
  {
    path: "/cadastros/cliente",
    label: "Cliente",
    resource: "cliente",
    idField: "idcliente",
    fields: [
      { name: "nome", label: "Nome" },
      { name: "cpf", label: "CPF", format: "cpf" },
      { name: "rg", label: "RG" },
      { name: "dtnascimento", label: "Data de nascimento", format: "dateBr" },
      { name: "celular", label: "Celular" },
      { name: "endereco", label: "Endereço" },
      { name: "idbairro", label: "Bairro", type: "number" },
      { name: "idcidade", label: "Cidade", type: "number" },
    ],
    searchFields: [
      { name: "idcliente", label: "ID Cliente" },
      { name: "nome", label: "Nome" },
      { name: "cpf", label: "CPF" },
      { name: "rg", label: "RG" },
      { name: "dtnascimento", label: "Data de nascimento" },
      { name: "celular", label: "Celular" },
      { name: "endereco", label: "Endereço" },
      { name: "idbairro", label: "ID Bairro (código)" },
      { name: "idcidade", label: "ID Cidade (código)" },
      { name: "nomebairro", label: "Bairro (parte do nome)", fkTextSearch: true },
      { name: "nomecidade", label: "Cidade (parte do nome)", fkTextSearch: true },
    ],
    fkConfigs: [
      {
        field: "idbairro",
        resource: "bairro",
        idField: "idbairro",
        labelField: "nomebairro",
        searchParam: "nomebairro",
      },
      {
        field: "idcidade",
        resource: "cidade",
        idField: "idcidade",
        labelField: "nomecidade",
        searchParam: "nomecidade",
      },
    ],
  },
  {
    path: "/cadastros/cidade",
    label: "Cidade",
    resource: "cidade",
    idField: "idcidade",
    fields: [{ name: "nomecidade", label: "Nome da cidade" }],
    searchFields: [
      { name: "idcidade", label: "ID Cidade" },
      { name: "nomecidade", label: "Nome da cidade" },
    ],
  },
  {
    path: "/cadastros/bairro",
    label: "Bairro",
    resource: "bairro",
    idField: "idbairro",
    fields: [{ name: "nomebairro", label: "Nome do bairro" }],
    searchFields: [
      { name: "idbairro", label: "ID Bairro" },
      { name: "nomebairro", label: "Nome do bairro" },
    ],
  },
  {
    path: "/cadastros/funcionario",
    label: "Funcionário",
    resource: "funcionario",
    idField: "idfuncionario",
    fields: [{ name: "nomefuncionario", label: "Nome do funcionário" }],
    searchFields: [
      { name: "idfuncionario", label: "ID Funcionário" },
      { name: "nomefuncionario", label: "Nome do funcionário" },
    ],
  },
  {
    path: "/cadastros/produto",
    label: "Produto",
    resource: "produto",
    idField: "idproduto",
    fields: [
      { name: "descricao", label: "Descrição" },
      { name: "custo", label: "Custo", type: "number", decimal2: true },
      { name: "vrvenda", label: "Valor de venda", type: "number", decimal2: true },
      { name: "estoque", label: "Estoque", type: "number" },
    ],
    searchFields: [
      { name: "idproduto", label: "ID Produto" },
      { name: "descricao", label: "Descrição" },
      { name: "custo", label: "Custo" },
      { name: "vrvenda", label: "Valor de venda" },
      { name: "estoque", label: "Estoque" },
    ],
  },
];

function Home() {
  return (
    <section className="home">
      <h1>Sistema de Cadastros e Movimento</h1>
      <p>Use o menu acima para acessar os cadastros e a página de vendas.</p>
    </section>
  );
}

export default function App() {
  return (
    <div>
      <header className="topbar">
        <h1>Front-end React</h1>
        <nav className="menu">
          <Link to="/">Início</Link>

          <details>
            <summary>Cadastros</summary>
            <div className="submenu">
              {cadastroPages.map((page) => (
                <Link key={page.path} to={page.path}>
                  {page.label}
                </Link>
              ))}
            </div>
          </details>

          <details>
            <summary>Movimento</summary>
            <div className="submenu">
              <Link to="/movimento/vendas">Vendas</Link>
            </div>
          </details>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movimento/vendas" element={<VendaPage />} />
          {cadastroPages.map((page) => (
            <Route
              key={page.path}
              path={page.path}
              element={
                <CadastroPage
                  key={page.path}
                  title={`Cadastro de ${page.label}`}
                  resource={page.resource}
                  idField={page.idField}
                  fields={page.fields}
                  searchFields={page.searchFields}
                  fkConfigs={page.fkConfigs}
                />
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
