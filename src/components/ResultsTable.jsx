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
      {/* Início da tabela de resultados. */}
      <table>
        {/* Cabeçalho da tabela. */}
        <thead>
          <tr>
            <th>Item (NCM/NBS)</th>
            <th>Classificação Tributária</th>
            <th>CST-IBS/CBS</th>
            <th>LC 214/25</th>
            <th>Tipo de Alíquota</th>
            <th>Data de Atualização</th>
          </tr>
        </thead>
        {/* Corpo da tabela, onde os resultados são renderizados. */}
        <tbody>
          {/* Mapeia cada item do array de resultados para uma linha da tabela. */}
          {results.map((item, index) => (
            <tr key={index}>
              {/* Coluna do Item (NCM/NBS): exibe o código formatado e a descrição. */}
              <td>
                <strong>{item.codigo_formatado}</strong>
                <br />
                {item.descricao}
              </td>
              {/* Coluna da Classificação Tributária: exibe o código e a descrição da classificação. */}
              <td>
                {/* Verifica se existe uma classificação para o item antes de tentar exibir. */}
                {item.classificacao?.codigo && (
                  <>
                    <strong>{item.classificacao.codigo}</strong>
                    <br />
                    {item.classificacao.descricao}
                  </>
                )}
              </td>
              {/* Coluna do CST-IBS/CBS: exibe o código e a descrição do CST. */}
              <td>
                {/* Verifica se existe um CST para a classificação antes de tentar exibir. */}
                {item.classificacao?.cst && (
                  <>
                    <strong>{item.classificacao.cst}</strong>
                    <br />
                    {item.classificacao.descricaoCst}
                  </>
                )}
              </td>
              {/* Coluna da LC 214/25: exibe a referência da lei. */}
              <td>{item.classificacao?.lc21425}</td>
              {/* Coluna do Tipo de Alíquota: exibe o tipo de alíquota. */}
              <td>{item.classificacao?.tipoAliquota}</td>
              {/* Coluna da Data de Atualização: exibe a data da última atualização. */}
              <td>{item.classificacao?.dataAtualizacao}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
