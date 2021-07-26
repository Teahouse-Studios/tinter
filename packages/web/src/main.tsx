import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

document.body.addEventListener('touchmove', (e) => {
  e.preventDefault();
}, { passive: false });

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('tinter'),
);
