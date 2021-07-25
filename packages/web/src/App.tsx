import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import RoomPage from './pages/room';
import IndexPage from './pages';
import 'react-toastify/dist/ReactToastify.css';

const App = () => <HashRouter>
  <ToastContainer />
  <Switch>
    <Route path={'/'} exact><IndexPage /></Route>
    <Route path={'/room'} exact>
      <RoomPage />
    </Route>
  </Switch>
</HashRouter>;

export default App;
