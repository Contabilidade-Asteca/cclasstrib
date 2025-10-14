/**
 * Exibe os resultados da busca em formato de tabela. Caso não haja
 * resultados, apresenta uma mensagem contextual.
 * @param {{
 *   results: any[],
 *   hasSearched: boolean,
 *   isTruncated: boolean,
 *   totalResults: number
 * }} props
 */
export default function ResultsTable({ results, hasSearched, isTruncated, totalResults }) {
  if (!hasSearched) {
    return <p className="placeholder">Digite um termo ou código para iniciar a consulta.</p>;
  }

  if (!results || results.length === 0) {
    return <p className="placeholder">Nenhum resultado encontrado para a busca informada.</p>;
  }

  return (
    <section className="results-section">
      <p className="results-summary">
        {isTruncated
          ? `Exibindo ${results.length} de ${totalResults} resultados encontrados. Refine a busca para ver mais.`
          : `Foram encontrados ${totalResults} resultado${totalResults === 1 ? '' : 's'}.`}
      </p>
      <div className="table-wrapper">
        <table>
          <caption className="sr-only">Tabela com os resultados da consulta de NCM</caption>
          <thead>
            <tr>
              <th>Código NCM</th>
              <th>Descrição</th>
              <th>Vigência</th>
              <th>Ato Normativo</th>
              <th>Classificação Tributária IBS/CBS</th>
            </tr>
          </thead>
          <tbody>
            {results.map((item) => (
              <tr key={item.codigo_ncm}>
                <td>{item.codigo_formatado ?? formatNcmCode(item.codigo_ncm)}</td>
                <td>{item.descricao || item.Descricao || 'Descrição não disponível'}</td>
                <td>{formatVigencia(item)}</td>
                <td>{formatAto(item)}</td>
                <td>{renderClassificationDetails(item.classificacao)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatNcmCode(code) {
  if (!code) {
    return '-';
  }
  const digits = code.replace(DIGIT_ONLY_REGEX, '');
  if (digits.length !== 8) {
    return code;
  }
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

function formatVigencia(item) {
  const inicio = item.Data_Inicio;
  const fim = item.Data_Fim;
  if (inicio && fim) {
    return `${inicio} a ${fim}`;
  }
  return inicio || fim || '-';
}

function formatAto(item) {
  const tipo = item.Tipo_Ato_Ini;
  const numero = item.Numero_Ato_Ini ? `nº ${item.Numero_Ato_Ini}` : '';
  const ano = item.Ano_Ato_Ini;
  const texto = [tipo, numero, ano].filter(Boolean).join(' ');
  return texto || '-';
}

function renderClassificationDetails(classificacao) {
  if (!classificacao) {
    return 'Classificação não disponível';
  }

  const codigo = classificacao.codigo || classificacao.Codigo || '';
  const nome = classificacao.nome || classificacao['Nome cClassTrib'] || '';
  const descricao = classificacao.descricao || classificacao.Descricao || '';
  const dataAtualizacao = classificacao.dataAtualizacao || classificacao.DataAtualização || '';
  const cst = classificacao.cst || classificacao['CST-IBS/CBS'] || '';
  const descricaoCst =
    classificacao.descricaoCst ||
    classificacao['Descrição CST-IBS/CBS'] ||
    '';
  const lc21425 = classificacao.lc21425 || classificacao['LC 214/25'] || '';
  const tipoAliquota = classificacao.tipoAliquota || classificacao['Tipo de Alíquota'] || '';

  return (
    <div className="classification-details">
      <div className="classification-details__header">
        <span className="classification-details__code">{codigo || 'Código não informado'}</span>
        <span className="classification-details__cst">
          {cst ? `${cst}${descricaoCst ? ` - ${descricaoCst}` : ''}` : 'CST não informado'}
        </span>
      </div>
      {nome && <p className="classification-details__name">{nome}</p>}
      <p className="classification-details__description">{descricao || 'Descrição não disponível.'}</p>
      <ul className="classification-details__meta">
        <li>
          <strong>Data de atualização:</strong> {dataAtualizacao || 'Não informada'}
        </li>
        <li>
          <strong>LC 214/25:</strong> {lc21425 || 'Não informada'}
        </li>
        <li>
          <strong>Tipo de alíquota:</strong> {tipoAliquota || 'Não informado'}
        </li>
      </ul>
    </div>
  );
}

const DIGIT_ONLY_REGEX = /\D/g;
