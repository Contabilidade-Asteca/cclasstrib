/**
 * Componente de barra de busca. Aciona a função onSearch a
 * cada alteração de valor.
 * @param {{onSearch: (value: string) => void}} props
 */
export default function SearchBar({ onSearch }) {
  return (
    <input
      type="text"
      placeholder="Digite o código NCM ou uma palavra..."
      onChange={(e) => onSearch(e.target.value)}
    />
  );
}