/**
 * Exibe os resultados da busca em formato de tabela. Caso não haja
 * resultados, apresenta uma mensagem padrão.
 * @param {{results: any[]}} props
 */
export default function ResultsTable({ results }) {
  if (!results || results.length === 0) {
    return <p>Nenhum resultado encontrado.</p>;
  }
  return (
    <table>
      <thead>
        <tr>
          <th>Código NCM</th>
          <th>Descrição</th>
          <th>II</th>
          <th>IPI</th>
          <th>PIS</th>
          <th>COFINS</th>
          <th>ICMS</th>
          <th>CST ICMS</th>
        </tr>
      </thead>
      <tbody>
        {results.map((item) => (
          <tr key={item.codigo_ncm}>
            <td>{item.codigo_ncm}</td>
            <td>{item.descricao}</td>
            <td>{item.aliquota_ii ?? '-'}</td>
            <td>{item.aliquota_ipi ?? '-'}</td>
            <td>{item.aliquota_pis ?? '-'}</td>
            <td>{item.aliquota_cofins ?? '-'}</td>
            <td>{item.aliquota_icms ?? '-'}</td>
            <td>{item.cst_icms ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}