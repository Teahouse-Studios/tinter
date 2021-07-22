import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import RoomPage from './pages/room';

const App = () => <HashRouter>
  <Switch>
    <Route path={'/room'} exact>
      <RoomPage />
    </Route>
  </Switch>
</HashRouter>;

export default App;
