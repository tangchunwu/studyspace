import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// 确保在根DOM节点挂载前它存在
const rootElement = document.getElementById('root');
if (!rootElement) {
  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
