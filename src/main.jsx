import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Ponto de entrada da aplicação. Aqui solicitamos ao ReactDOM que crie
// uma "root" controlada pelo React dentro da div com id="root" definida
// em index.html. O StrictMode ajuda a identificar efeitos colaterais
// durante o desenvolvimento executando algumas verificações extras.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);