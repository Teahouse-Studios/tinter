import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import RoomPage from './pages/room';
import IndexPage from './pages';

const App = () => <HashRouter>
  <Switch>
    <Route path={'/'} exact><IndexPage /></Route>
    <Route path={'/room'} exact>
      <RoomPage />
    </Route>
  </Switch>
</HashRouter>;

export default App;
