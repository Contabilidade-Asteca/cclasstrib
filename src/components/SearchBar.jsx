/**
 * Componente de busca responsável por controlar o valor digitado e acionar o
 * callback de pesquisa sempre que houver alteração. Todo o estado da busca é
 * mantido no componente pai (App), garantindo um fluxo unidirecional de dados.
 *
 * @param {{ value: string, onSearch: (value: string) => void }} props
 */
export default function SearchBar({ value, onSearch }) {
  /**
   * Impede o envio do formulário, já que a busca é reativa ao digitar.
   * Mantemos o handler para evitar a recarga da página caso o usuário pressione Enter.
   */
  function handleSubmit(event) {
    event.preventDefault();
  }

  /**
   * Notifica o componente pai sobre cada alteração do campo de texto.
   * O valor é enviado imediatamente para que o App refaça a busca.
   */
  function handleChange(event) {
    onSearch(event.target.value);
  }

  /**
   * Restaura o campo de busca para uma string vazia e dispara nova consulta.
   */
  function handleClear() {
    onSearch('');
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <label className="search-bar__label" htmlFor="ncm-search-input">
        Pesquise por código NCM ou NBS.
      </label>
      <div className="search-bar__controls">
        <input
          id="ncm-search-input"
          className="search-bar__input"
          type="search"
          value={value}
          placeholder='Ex.: 01012100'
          onChange={handleChange}
          autoComplete="off"
          spellCheck="false"
        />
        {value && (
          <button
            type="button"
            className="search-bar__button search-bar__button--ghost"
            onClick={handleClear}
          >
            Limpar
          </button>
        )}
        <button type="submit" className="search-bar__button">
          Buscar
        </button>
      </div>
      <p className="search-bar__hint">
        Use códigos completos para resultados mais precisos.
      </p>
    </form>
  );
}
