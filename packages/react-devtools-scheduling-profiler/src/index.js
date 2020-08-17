import React from 'react';
import {unstable_createRoot as createRoot} from 'react-dom';
import App from './App';
import './index.css';

const container = document.getElementById('root');

createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
