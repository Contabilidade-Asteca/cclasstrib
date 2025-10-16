# Consulta Classificação Tributária IBS/CBS

Aplicativo web que auxilia na consulta de classificações tributárias do
IBS/CBS. A busca é realizada a partir de códigos **NCM** e **NBS** ou de
termos presentes nas descrições dos produtos. Todas as fontes de dados
residem localmente em arquivos JSON (NCM, NBS e base de classificações),
garantindo respostas imediatas sem depender de APIs externas.

Toda a base de código foi amplamente comentada para facilitar a
manutenção, destacando a função de cada módulo, expressão regular e
transformação aplicada aos dados.

## Tecnologias utilizadas

- **React 18** para construção da interface SPA.
- **Vite** como bundler e servidor de desenvolvimento.
- **CSS** puro para estilização dos componentes.
- Dados armazenados em `src/Data/` em formato JSON.

## Funcionalidades

- Pesquisa por código (com tolerância a formatações diferentes) ou por
  palavras-chave das descrições.
- Ranqueamento dos itens pelo melhor ajuste ao termo pesquisado e
  associação automática às classificações tributárias mais relevantes.
- Indicação, quando disponível, das reduções de IBS/CBS e link direto
  para a legislação associada.
- Feedback visual para estados vazios, busca inicial e resultados
  truncados (limite configurável de 200 linhas).

## Como executar localmente

```bash
# Instalar dependências
npm install

# Rodar o servidor de desenvolvimento em modo hot-reload
npm run dev

# Construir a versão otimizada para produção
npm run build

# Pré-visualizar a build de produção localmente
npm run preview
```

## Estrutura de diretórios

- `src/`
  - `App.jsx` – Componente principal com toda a lógica de classificação e comentários detalhados.
  - `components/` – Barra de busca e tabela de resultados.
  - `Data/` – Arquivos JSON com as tabelas NCM, NBS e de classificação.
  - `main.jsx` – Ponto de entrada do React.
  - `styles.css` – Estilos globais organizados por seções comentadas.
- `index.html` – Documento base servido pelo Vite.
- `package.json` – Dependências e scripts NPM.
- `vite.config.js` – Configuração do bundler.

## Implantação

A aplicação pode ser publicada sem ajustes em plataformas como **Vercel**
ou **Netlify**. Basta enviar o repositório para o GitHub e importar o
projeto na plataforma desejada. O comando de build padrão (`npm run
build`) é suficiente. A opção `base` no `vite.config.js` permanece como
`'/'`, garantindo que os assets sejam referenciados corretamente na raiz
do domínio.
