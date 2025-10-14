import { useMemo, useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import ncmData from './data/Tabela_NCM_Vigente_20240921.json';
import cclassData from './data/cclass-trib-publicacao.json';
import ncmClassificationMapping from './data/ncm_cclass_mapping.json';

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

function buildClassificationDetailsMap(data) {
  if (!Array.isArray(data)) {
    return new Map();
  }

  return data.reduce((map, entry) => {
    if (!entry || typeof entry !== 'object') {
      return map;
    }

    const code = typeof entry.cClassTrib === 'string'
      ? entry.cClassTrib.trim()
      : '';

    if (!code || map.has(code)) {
      return map;
    }

    map.set(code, {
      codigo: code,
      nome: entry['Nome cClassTrib']?.trim() ?? '',
      descricao: entry['Descrição cClassTrib']?.trim() ?? '',
      cst: entry['CST-IBS/CBS']?.trim() ?? '',
      descricaoCst: entry['Descrição CST-IBS/CBS']?.trim() ?? '',
      lc21425: entry['LC 214/25']?.trim() ?? '',
      tipoAliquota: entry['Tipo de Alíquota']?.trim() ?? '',
      dataAtualizacao: entry.DataAtualização?.trim() ?? '',
    });

    return map;
  }, new Map());
}

function buildNcmClassificationMap(mapping) {
  if (!mapping || typeof mapping !== 'object') {
    return new Map();
  }

  return Object.entries(mapping).reduce((map, [rawCode, classificationCode]) => {
    if (typeof rawCode !== 'string' || typeof classificationCode !== 'string') {
      return map;
    }

    const normalizedCode = rawCode.replace(DIGIT_ONLY_REGEX, '');
    if (normalizedCode.length !== 8) {
      return map;
    }

    map.set(normalizedCode, classificationCode.trim());
    return map;
  }, new Map());
}

function prepareNcmDataset(rawData, classificationDetailsMap, ncmClassificationMap) {
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

      const classificationCode = ncmClassificationMap.get(normalizedCodigo);
      if (classificationCode) {
        const classificationDetails = classificationDetailsMap.get(classificationCode);
        if (classificationDetails) {
          return { ...merged, classificacao: classificationDetails };
        }

        return {
          ...merged,
          classificacao: { codigo: classificationCode }
        };
      }

      return merged;
    })
    .filter(Boolean);
}

export default function App() {
  const classificationDetailsMap = useMemo(
    () => buildClassificationDetailsMap(cclassData),
    []
  );
  const ncmClassificationMap = useMemo(
    () => buildNcmClassificationMap(ncmClassificationMapping),
    []
  );
  const dataset = useMemo(
    () => prepareNcmDataset(ncmData, classificationDetailsMap, ncmClassificationMap),
    [classificationDetailsMap, ncmClassificationMap]
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