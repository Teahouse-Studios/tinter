import React from 'react';
import ReactDOM from 'react-dom';
import App from './pages/room';

const Hydro = (window as any).Hydro;

const page = new Hydro.NamedPage('hydroAutoload', () => {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById('tinter'),
  );
});
Hydro.extraPages.push(page);
