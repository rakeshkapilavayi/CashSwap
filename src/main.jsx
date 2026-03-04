import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

// Initialize React application
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element. Please check your HTML file.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);