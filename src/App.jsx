import { useMemo, useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import ncmRaw from './Data/Tabela_NCM.json';
import nbsRaw from './Data/Tabela_NBS.json';
import classificationRaw from './Data/cclasstrib.json';

const DIGITS_ONLY_REGEX = /\D+/g;
const DIACRITICS_REGEX = /\p{Diacritic}/gu;
const STOP_WORDS = new Set([
  'a', 'e', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'para', 'por',
  'em', 'no', 'na', 'nos', 'nas', 'com', 'sem', 'um', 'uma', 'uns', 'umas'
]);
const MAX_RESULTS = 200;
const MAX_CLASSIFICATIONS_PER_ITEM = 5;

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

function normalizeCode(value) {
  return value ? value.toString().replace(DIGITS_ONLY_REGEX, '') : '';
}

function splitKeywords(normalizedText) {
  return normalizedText
    .split(/\s+/)
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

function buildAliquotaInfo(entry) {
  const reductionIbs = entry['Percentual Redução IBS']?.trim();
  const reductionCbs = entry['Percentual Redução CBS']?.trim();

  const hasIbs = reductionIbs && reductionIbs !== '0';
  const hasCbs = reductionCbs && reductionCbs !== '0';

  if (!hasIbs && !hasCbs) {
    return 'Sem redução informada.';
  }

  const parts = [];
  if (hasIbs) {
    parts.push(`Redução IBS: ${reductionIbs}%`);
  }
  if (hasCbs) {
    parts.push(`Redução CBS: ${reductionCbs}%`);
  }

  return parts.join(' • ');
}

function buildClassificationDataset(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter(entry => entry && typeof entry === 'object')
    .map(entry => {
      const codigoClassificacao = entry['Código da Classificação Tributária']?.trim() ?? '';
      const descricaoClassificacao = entry['Descrição do Código da Classificação Tributária']?.trim() ?? '';
      const codigoCst = entry['Código da Situação Tributária']?.trim() ?? '';
      const descricaoCst = entry['Descrição da Situação Tributária']?.trim() ?? '';
      const lc214 = entry['LC 214/25']?.trim() ?? '';
      const dataAtualizacao = entry['DataAtualização']?.trim() ?? '';
      const url = entry['Url da Legislação']?.trim() ?? '';
      const fullText = [descricaoClassificacao, descricaoCst, entry['LC Redação']]
        .filter(Boolean)
        .join(' ');
      const normalizedText = normalizeText(fullText);
      const keywordSet = new Set(splitKeywords(normalizedText));

      return {
        codigoClassificacao,
        descricaoClassificacao,
        codigoCst,
        descricaoCst,
        aliquotaInfo: buildAliquotaInfo(entry),
        lc214,
        dataAtualizacao,
        url,
        normalizedText,
        keywordSet,
      };
    });
}

function buildNomenclatureDataset(ncmData, nbsData) {
  const dataset = [];
  const seenCodes = new Set();

  const addEntry = ({ tipo, codigoOriginal, descricao }) => {
    const normalizedCode = normalizeCode(codigoOriginal);
    if (!normalizedCode || seenCodes.has(`${tipo}-${normalizedCode}`)) {
      return;
    }

    dataset.push({
      tipo,
      codigoOriginal: codigoOriginal.trim(),
      codigoNormalizado: normalizedCode,
      descricao: descricao?.trim() ?? '',
      normalizedDescricao: normalizeText(descricao ?? ''),
    });
    seenCodes.add(`${tipo}-${normalizedCode}`);
  };

  if (Array.isArray(ncmData)) {
    ncmData.forEach(entry => {
      if (!entry || typeof entry.Codigo !== 'string') {
        return;
      }
      addEntry({ tipo: 'NCM', codigoOriginal: entry.Codigo, descricao: entry.Descricao });
    });
  }

  if (Array.isArray(nbsData)) {
    nbsData.forEach(entry => {
      if (!entry || typeof entry.NBS !== 'string') {
        return;
      }
      addEntry({ tipo: 'NBS', codigoOriginal: entry.NBS, descricao: entry['DESCRIÇÃO'] });
    });
  }

  return dataset;
}

function buildResultRows(items, classificationDataset, queryText) {
  const normalizedQuery = normalizeText(queryText);

  const results = [];

  items.forEach(item => {
    const descriptionKeywords = splitKeywords(item.normalizedDescricao);
    const queryKeywords = splitKeywords(normalizedQuery);
    const keywords = new Set([...descriptionKeywords, ...queryKeywords]);

    const matches = classificationDataset
      .map(classificacao => {
        let score = 0;
        keywords.forEach(keyword => {
          if (classificacao.keywordSet.has(keyword)) {
            score += 2;
          } else if (keyword && classificacao.normalizedText.includes(keyword)) {
            score += 1;
          }
        });

        if (!score && item.normalizedDescricao && classificacao.normalizedText.includes(item.normalizedDescricao)) {
          score = 1;
        }

        return { classificacao, score };
      })
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.classificacao.codigoClassificacao.localeCompare(b.classificacao.codigoClassificacao))
      .slice(0, MAX_CLASSIFICATIONS_PER_ITEM)
      .map(entry => ({
        ...entry.classificacao,
        matchScore: entry.score,
      }));

    if (matches.length === 0) {
      results.push({ item, classificacao: null });
    } else {
      matches.forEach(match => {
        results.push({ item, classificacao: match });
      });
    }
  });

  return results;
}

function rankItemsByQuery(items, query) {
  const normalizedCodeQuery = normalizeCode(query);
  const normalizedTextQuery = normalizeText(query);

  return items
    .map(item => {
      let score = 0;

      if (normalizedCodeQuery) {
        if (item.codigoNormalizado === normalizedCodeQuery) {
          score += 6;
        } else if (item.codigoNormalizado.startsWith(normalizedCodeQuery)) {
          score += 4;
        } else if (item.codigoNormalizado.includes(normalizedCodeQuery)) {
          score += 2;
        }
      }

      if (normalizedTextQuery && item.normalizedDescricao.includes(normalizedTextQuery)) {
        score += 1;
      }

      return { item, score };
    })
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.codigoNormalizado.localeCompare(b.item.codigoNormalizado))
    .map(entry => entry.item);
}

export default function App() {
  const classificationDataset = useMemo(() => buildClassificationDataset(classificationRaw), []);
  const nomenclatureDataset = useMemo(() => buildNomenclatureDataset(ncmRaw, nbsRaw), []);

  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);
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

    const rankedItems = rankItemsByQuery(nomenclatureDataset, trimmed);
    if (rankedItems.length === 0) {
      setResults([]);
      setHasSearched(true);
      setIsTruncated(false);
      setTotalResults(0);
      return;
    }

    const expandedResults = buildResultRows(rankedItems, classificationDataset, trimmed);
    setTotalResults(expandedResults.length);

    if (expandedResults.length > MAX_RESULTS) {
      setIsTruncated(true);
      setResults(expandedResults.slice(0, MAX_RESULTS));
    } else {
      setIsTruncated(false);
      setResults(expandedResults);
    }

    setHasSearched(true);
  }

  const shouldShowPlaceholder = !hasSearched;
  const shouldShowEmptyState = hasSearched && results.length === 0;
  const shouldShowResults = hasSearched && results.length > 0;

  return (
    <div className="container">
      <h1>Consulta Classificação Tributária</h1>
      <SearchBar value={searchValue} onSearch={handleSearch} />

      <section className="results-section" aria-live="polite">
        {shouldShowPlaceholder && (
          <p className="placeholder">
            Informe um código NCM ou NBS completo para encontrar a descrição do item
            e consultar possíveis classificações tributárias.
          </p>
        )}

        {shouldShowEmptyState && (
          <p className="placeholder">Nenhum resultado encontrado para o código informado.</p>
        )}

        {shouldShowResults && (
          <>
            <p className="results-summary">
              {isTruncated
                ? `Exibindo ${results.length} de ${totalResults} combinações encontradas. Refine a busca para resultados mais específicos.`
                : `Foram encontradas ${totalResults} combinações entre itens e classificações.`}
            </p>

            <div className="table-wrapper">
              <ResultsTable results={results} />
            </div>

            {isTruncated && (
              <p className="results-note">
                A lista foi limitada a {MAX_RESULTS} linhas para facilitar a navegação.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
