/**
 * Renderiza a tabela com os resultados da busca, combinando itens NCM/NBS
 * com as classificações tributárias encontradas na base da cclasstrib.
 * Cada linha representa uma combinação item ↔ classificação calculada no App.
 *
 * @param {{ results: Array<{ item: object, classificacao: object | null }> }} props
 */
export default function ResultsTable({ results }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Item (NCM/NBS)</th>
          <th>Classificação Tributária</th>
          <th>Código CST e Alíquota</th>
          <th>LC 214/25</th>
          <th>Link do Artigo</th>
        </tr>
      </thead>
      <tbody>
        {results.map(({ item, classificacao }, index) => {
          // Como o mesmo item pode aparecer várias vezes (cada classificação gera uma linha)
          // usamos o índice na chave para evitar colisões.
          const key = `${item.tipo}-${item.codigoNormalizado}-${index}`;
          return (
            <tr key={key}>
              <td>
                <div className="item-code">{item.tipo} • {item.codigoOriginal}</div>
                <div className="item-description">{item.descricao || 'Descrição não informada.'}</div>
              </td>
              <td>
                {classificacao ? (
                  <div className="classification-details">
                    <div className="classification-details__header">
                      <span className="classification-details__code">
                        {classificacao.codigoClassificacao}
                      </span>
                    </div>
                    <p className="classification-details__description">
                      {classificacao.descricaoClassificacao || 'Descrição não disponível.'}
                    </p>
                  </div>
                ) : (
                  <span className="classification-empty">Nenhuma classificação relacionada encontrada automaticamente.</span>
                )}
              </td>
              <td>
                {classificacao ? (
                  <div className="classification-meta">
                    <strong>{classificacao.codigoCst || '—'}</strong>
                    <span>
                      {classificacao.descricaoCst || 'Situação tributária não informada.'}
                    </span>
                    <span>{classificacao.aliquotaInfo}</span>
                  </div>
                ) : (
                  <span className="classification-empty">—</span>
                )}
              </td>
              <td>
                {classificacao?.lc214 ? classificacao.lc214 : <span className="classification-empty">—</span>}
              </td>
              <td>
                {classificacao?.url ? (
                  <a
                    href={classificacao.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Abrir legislação referente à classificação ${classificacao.codigoClassificacao}`}
                    title="Abrir legislação"
                    className="legislation-link"
                  >
                    📖
                  </a>
                ) : (
                  <span className="classification-empty">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
