# Consulta Classificação Tributária IBS/CBS

Este projeto é um aplicativo web que permite pesquisar a classificação
tributária de produtos a partir de um **código NCM** ou de uma
**palavra‑chave**. Os dados são provenientes de três bases
disponibilizadas em formato JSON: a tabela vigente de NCM, a
classificação tributária do sistema atual (ICMS, PIS, COFINS) e a
publicação de classes tributárias do IBS/CBS.

## Tecnologias utilizadas

- **React** e **Vite** para a construção da interface SPA.
- Estrutura de componentes simples e sem dependências extras.
- Os dados residem localmente em arquivos JSON em
  `src/data/`, tornando a busca instantânea sem necessidade de API.

## Funcionalidades

- Pesquisa por código NCM ou por palavras contidas na descrição do
  produto.
- Exibição de campos relevantes de cada código, incluindo alíquotas de
  II, IPI, PIS, COFINS e ICMS quando disponíveis.
- Integração simples com a base de classificação tributária para
  complementar as informações de cada item.

## Como executar localmente

```bash
# Instalar dependências
npm install

# Rodar o servidor de desenvolvimento
npm run dev

# Construir a versão de produção
npm run build

# Pré‑visualizar a versão de produção
npm run preview
```

## Estrutura de diretórios

- `src/` – Código‑fonte do aplicativo.
  - `components/` – Componentes reutilizáveis (barra de busca e tabela de resultados).
  - `data/` – Arquivos JSON contendo as tabelas NCM e de classificação tributária.
  - `App.jsx` – Componente principal que orquestra a busca e exibição de resultados.
  - `main.jsx` – Entrada do React.
  - `styles.css` – Estilos globais simples.
- `index.html` – Arquivo HTML de entrada usado pelo Vite.
- `package.json` – Dependências e scripts do projeto.
- `vite.config.js` – Configurações do bundler Vite.

## Implantação

O projeto foi configurado pensando em um deploy simples na
Vercel. Após realizar o `push` do repositório para o GitHub, basta
importá‑lo na Vercel e concluir a implantação. O campo `base` em
`vite.config.js` está definido como `'/'`, garantindo que o aplicativo
funcione corretamente na raiz do domínio.
