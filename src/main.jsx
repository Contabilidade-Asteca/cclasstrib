import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Ponto de entrada da aplicação. Renderiza o componente App
// dentro da div com id="root" definida em index.html.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);