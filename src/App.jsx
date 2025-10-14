import { useMemo, useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import ncmData from './data/Tabela_NCM_Vigente_20240921.json';
import classData from './data/classificacao_tributaria.json';

const DIGIT_ONLY_REGEX = /\D/g;
const DIACRITICS_REGEX = /\p{Diacritic}/gu;
const MAX_RESULTS = 200;

function normalizeText(text) {
  if (!text) {
    return '';
  }
  return text
    .toString()
    .normalize('NFD')
    .replace(DIACRITICS_REGEX, '')
    .toLowerCase();
}

function extractClassificationCode(entry) {
  if (!entry || typeof entry !== 'object') {
    return '';
  }

  const possibleKeys = [
    'codigo_ncm',
    'Código NCM',
    'Código_NCM',
    'CodigoNCM',
    'NCM',
    'codigo',
    'Codigo'
  ];

  for (const key of possibleKeys) {
    if (typeof entry[key] === 'string') {
      const normalized = entry[key].replace(DIGIT_ONLY_REGEX, '');
      if (normalized.length === 8) {
        return normalized;
      }
    }
  }

  return '';
}

function buildClassificationMap(data) {
  if (!Array.isArray(data)) {
    return new Map();
  }

  return data.reduce((map, entry) => {
    const code = extractClassificationCode(entry);
    if (code && !map.has(code)) {
      map.set(code, entry);
    }
    return map;
  }, new Map());
}

function prepareNcmDataset(rawData, classificationMap) {
  const entries = Array.isArray(rawData?.Nomenclaturas)
    ? rawData.Nomenclaturas
    : Array.isArray(rawData)
      ? rawData
      : [];

  return entries
    .filter(entry => entry && typeof entry.Codigo === 'string')
    .map(entry => {
      const normalizedCodigo = entry.Codigo.replace(DIGIT_ONLY_REGEX, '');
      if (normalizedCodigo.length !== 8) {
        return null;
      }

      const descricao = entry.Descricao?.trim() ?? '';
      const merged = {
        ...entry,
        codigo_ncm: normalizedCodigo,
        codigo_formatado: entry.Codigo,
        descricao,
        normalizedDescricao: normalizeText(descricao),
        normalizedCodigo,
      };

      const classification = classificationMap.get(normalizedCodigo);
      if (classification) {
        return { ...merged, classificacao: classification };
      }

      return merged;
    })
    .filter(Boolean);
}

export default function App() {
  const classificationMap = useMemo(() => buildClassificationMap(classData), []);
  const dataset = useMemo(
    () => prepareNcmDataset(ncmData, classificationMap),
    [classificationMap]
  );

  const [results, setResults] = useState([]);
  const [searchValue, setSearchValue] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  function handleSearch(value) {
    setSearchValue(value);

    const trimmed = value.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      setIsTruncated(false);
      setTotalResults(0);
      return;
    }

    const normalizedQuery = normalizeText(trimmed);
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);
    const numericInput = trimmed.replace(DIGIT_ONLY_REGEX, '');

    const filtered = dataset.filter(item => {
      if (!terms.length && !numericInput) {
        return false;
      }

      const codigoLower = (item.codigo_ncm ?? '').toLowerCase();
      const codigoFormatado = (item.codigo_formatado ?? '').toLowerCase();
      const descricao = item.normalizedDescricao ?? '';

      const matchesTerms = terms.every(term => {
        if (!term) {
          return true;
        }
        const numericTerm = term.replace(DIGIT_ONLY_REGEX, '');
        return (
          codigoLower.includes(term) ||
          codigoFormatado.includes(term) ||
          (numericTerm && item.normalizedCodigo.includes(numericTerm)) ||
          descricao.includes(term)
        );
      });

      if (matchesTerms) {
        return true;
      }

      if (numericInput) {
        return item.normalizedCodigo.includes(numericInput);
      }

      return false;
    });

    setTotalResults(filtered.length);

    if (filtered.length > MAX_RESULTS) {
      setIsTruncated(true);
      setResults(filtered.slice(0, MAX_RESULTS));
    } else {
      setIsTruncated(false);
      setResults(filtered);
    }

    setHasSearched(true);
  }

  return (
    <div className="container">
      <h1>Consulta Classificação Tributária</h1>
      <SearchBar value={searchValue} onSearch={handleSearch} />
      <ResultsTable
        results={results}
        hasSearched={hasSearched}
        isTruncated={isTruncated}
        totalResults={totalResults}
      />
    </div>
  );
}