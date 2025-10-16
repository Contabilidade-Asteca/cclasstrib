import { useMemo, useState } from 'react';
import SearchBar from './components/SearchBar';
import ResultsTable from './components/ResultsTable';
import ncmRaw from './Data/Tabela_NCM.json';
import nbsRaw from './Data/Tabela_NBS.json';
import classificationRaw from './Data/cclasstrib.json';

/**
 * Expressão regular que captura qualquer caractere que não seja número.
 * É utilizada para higienizar códigos NCM/NBS removendo pontos, traços etc.
 */
const DIGITS_ONLY_REGEX = /\D+/g;

/**
 * Expressão regular que identifica acentos e diacríticos.
 * Usada em conjunto com `String.prototype.normalize` para remover variações
 * de acentuação antes de comparar textos.
 */
const DIACRITICS_REGEX = /\p{Diacritic}/gu;

/**
 * Conjunto de palavras consideradas irrelevantes em buscas por texto.
 * A filtragem evita que termos muito comuns gerem falsos positivos na
 * correlação entre descrições e classificações tributárias.
 */
const STOP_WORDS = new Set([
  'a', 'e', 'o', 'as', 'os', 'de', 'da', 'do', 'das', 'dos', 'para', 'por',
  'em', 'no', 'na', 'nos', 'nas', 'com', 'sem', 'um', 'uma', 'uns', 'umas'
]);

/**
 * Limite máximo de linhas exibidas simultaneamente na tabela de resultados.
 * Impede que consultas muito abrangentes deixem a interface lenta ou difícil
 * de navegar.
 */
const MAX_RESULTS = 200;

/**
 * Quantidade máxima de classificações tributárias associadas a um mesmo item.
 * Mantém o resultado conciso, priorizando as classificações mais relevantes
 * segundo a pontuação calculada.
 */
const MAX_CLASSIFICATIONS_PER_ITEM = 5;

/**
 * Normaliza textos para facilitar comparações case-insensitive e sem acentos.
 * @param {unknown} text Texto original que pode ser string ou outro tipo.
 * @returns {string} Texto convertido para minúsculas, sem acentos.
 */
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

/**
 * Remove caracteres não numéricos de um código NCM/NBS.
 * @param {unknown} value Código original possivelmente com formatação.
 * @returns {string} Sequência numérica contínua utilizada nas buscas.
 */
function normalizeCode(value) {
  return value ? value.toString().replace(DIGITS_ONLY_REGEX, '') : '';
}

/**
 * Gera palavras-chave a partir de um texto previamente normalizado.
 * @param {string} normalizedText Texto em minúsculas e sem acento.
 * @returns {string[]} Lista de tokens relevantes com pelo menos 3 caracteres.
 */
function splitKeywords(normalizedText) {
  return normalizedText
    .split(/\s+/)
    .filter(token => token.length >= 3 && !STOP_WORDS.has(token));
}

/**
 * Monta uma string amigável com as reduções de IBS e CBS disponíveis.
 * @param {Record<string, string>} entry Registro da base de classificação.
 * @returns {string} Texto descrevendo as reduções ou mensagem padrão.
 */
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

/**
 * Converte a planilha de classificações tributárias em uma estrutura otimizada
 * para busca textual. Cada entrada recebe campos normalizados e um conjunto de
 * palavras-chave para comparação rápida.
 *
 * @param {unknown[]} raw Dados crus importados do arquivo JSON.
 * @returns {Array<object>} Coleção de classificações enriquecidas.
 */
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

      // A concatenação dos textos fornece uma descrição ampla usada para ranking.
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

/**
 * Mescla as tabelas NCM e NBS em um único array normalizado.
 * Cada item contém variações normalizadas para facilitar o cálculo de score.
 *
 * @param {unknown[]} ncmData Lista de itens NCM.
 * @param {unknown[]} nbsData Lista de itens NBS.
 * @returns {Array<object>} Conjunto unificado de nomenclaturas.
 */
function buildNomenclatureDataset(ncmData, nbsData) {
  const dataset = [];
  const seenCodes = new Set();

  /**
   * Adiciona um item ao dataset, evitando duplicidades por código/tipo.
   * @param {{ tipo: 'NCM' | 'NBS', codigoOriginal: string, descricao?: string }} entry
   */
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

/**
 * Expande uma lista de itens (NCM/NBS) relacionando cada um com as
 * classificações tributárias mais prováveis com base em palavras-chave.
 *
 * @param {Array<object>} items Itens da base de nomenclaturas.
 * @param {Array<object>} classificationDataset Classificações pré-processadas.
 * @param {string} queryText Texto original digitado pelo usuário.
 * @returns {Array<{ item: object, classificacao: object | null }>} Linhas da tabela.
 */
function buildResultRows(items, classificationDataset, queryText) {
  const normalizedQuery = normalizeText(queryText);

  const results = [];

  items.forEach(item => {
    const descriptionKeywords = splitKeywords(item.normalizedDescricao);
    const queryKeywords = splitKeywords(normalizedQuery);

    // Conjunto de palavras-chave que serão usadas para pontuar as classificações.
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

        // Caso nenhuma palavra-chave gere pontos, tentamos uma correspondência
        // direta usando a descrição completa do item.
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

/**
 * Calcula a relevância de cada item NCM/NBS para a consulta informada.
 * Os critérios priorizam correspondência exata do código, seguida de
 * prefixos e subsequências, e por fim a presença da descrição.
 *
 * @param {Array<object>} items Coleção de nomenclaturas normalizadas.
 * @param {string} query Valor digitado pelo usuário.
 * @returns {Array<object>} Itens ordenados pela melhor correspondência.
 */
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

/**
 * Componente principal responsável por integrar a barra de busca com a tabela
 * de resultados. Ele pré-processa as bases de dados, controla o estado da
 * consulta e aplica as regras de rankeamento e montagem da lista final.
 */
export default function App() {
  // Pré-processa os datasets apenas uma vez, evitando recomputações custosas.
  const classificationDataset = useMemo(() => buildClassificationDataset(classificationRaw), []);
  const nomenclatureDataset = useMemo(() => buildNomenclatureDataset(ncmRaw, nbsRaw), []);

  // Estados de UI: valor digitado, resultados, indicadores de busca e limites.
  const [searchValue, setSearchValue] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  /**
   * Atualiza a busca sempre que o usuário altera o campo da barra de pesquisa.
   * A função realiza validações básicas e controla o fluxo de exibição de estados.
   *
   * @param {string} value Texto digitado na barra de busca.
   */
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

  // Estados derivados para definir o conteúdo exibido na seção de resultados.
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
