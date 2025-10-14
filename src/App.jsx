import { useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import ncmData from './data/Tabela_NCM_Vigente_20240921.json';
import classData from './data/classificacao_tributaria.json';

// Combina dados de NCM com sua respectiva classificação tributária (quando houver)
function mergeItemWithClassification(item) {
  const classInfo = classData.find(c => c.codigo_ncm === item.codigo_ncm) || {};
  return { ...item, ...classInfo };
}

export default function App() {
  const [results, setResults] = useState([]);

  /**
   * Filtra a base de NCM com base no valor digitado.
   * Aceita buscas por código (8 dígitos) ou por trechos da descrição.
   * @param {string} value
   */
  function handleSearch(value) {
    const query = value.trim().toLowerCase();
    if (!query) {
      setResults([]);
      return;
    }
    const filtered = ncmData.filter(item => {
      return (
        item.codigo_ncm.toLowerCase().includes(query) ||
        item.descricao.toLowerCase().includes(query)
      );
    }).map(mergeItemWithClassification);
    setResults(filtered);
  }

  return (
    <div className="container">
      <h1>Consulta Classificação Tributária</h1>
      <SearchBar onSearch={handleSearch} />
      <ResultsTable results={results} />
    </div>
  );
}