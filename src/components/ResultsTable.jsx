/**
 * Componente ResultsTable
 *
 * @param {object} props - As propriedades do componente.
 * @param {Array} props.results - Uma lista de itens a serem exibidos na tabela.
 * @param {boolean} props.hasSearched - Um indicador para saber se uma busca já foi realizada.
 * @param {boolean} props.isTruncated - Um indicador para saber se os resultados foram truncados (limitados).
 * @param {number} props.totalResults - O número total de resultados encontrados na busca.
 */
export default function ResultsTable({ results, hasSearched, isTruncated, totalResults }) {
  // URL base para a Lei Complementar 214/25.
  const LEGISLATION_BASE_URL = 'https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';

  /**
   * Gera a URL para um artigo específico da legislação.
   * Extrai o primeiro número do texto da lei (ex: "Art. 157" -> "157").
   * @param {string} lcText - O texto da referência da lei (ex: "Art. 157").
   * @returns {string|null} A URL completa ou null se nenhum número for encontrado.
   */
  function getLegislationUrl(lcText) {
    if (!lcText) {
      return null;
    }
    // Usa uma expressão regular para encontrar o primeiro conjunto de dígitos no texto.
    const match = lcText.match(/\d+/);
    if (match) {
      const articleNumber = match[0];
      return `${LEGISLATION_BASE_URL}#art${articleNumber}`;
    }
    return null;
  }

  // Se nenhuma busca foi feita ainda, o componente não renderiza nada.
  if (!hasSearched) {
    return null;
  }

  // Se uma busca foi feita, mas não encontrou resultados, exibe uma mensagem.
  if (results.length === 0) {
    return <p>Nenhum resultado encontrado.</p>;
  }

  // Renderiza a tabela de resultados.
  return (
    <>
      {/* Se os resultados foram truncados, exibe uma mensagem de aviso. */}
      {isTruncated && (
        <p>
          <strong>
            Atenção: A busca retornou {totalResults} resultados. Apenas os
            primeiros 200 estão sendo exibidos.
          </strong>
        </p>
      )}
      <table>
        <thead>
          <tr>
            <th>Item (NCM/NBS)</th>
            <th>Classificação Tributária</th>
            <th>CST-IBS/CBS</th>
            <th>LC 214/25</th>
            <th>Data de Atualização</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item, index) => {
            // Gera a URL da legislação para o item atual.
            const url = getLegislationUrl(item.classificacao?.lc21425);

            return (
              <tr key={index}>
                <td>
                  <strong>{item.codigo_formatado}</strong>
                  <br />
                  {item.descricao}
                </td>
                <td>
                  {item.classificacao?.codigo && (
                    <>
                      <strong>{item.classificacao.codigo}</strong>
                      <br />
                      {item.classificacao.descricao}
                    </>
                  )}
                </td>
                <td>
                  {item.classificacao?.cst && (
                    <>
                      <strong>{item.classificacao.cst}</strong>
                      <br />
                      {item.classificacao.descricaoCst}
                    </>
                  )}
                </td>
                {/* Coluna da LC 214/25 com o link e o ícone. */}
                <td>
                  {item.classificacao?.lc21425}
                  {/* Se a URL foi gerada com sucesso, mostra o ícone com o link. */}
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '8px', textDecoration: 'none' }}>
                      📖
                    </a>
                  )}
                </td>
                <td>{item.classificacao?.dataAtualizacao}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
