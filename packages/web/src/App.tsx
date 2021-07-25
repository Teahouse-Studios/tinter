import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import RoomPage from './pages/room';
import IndexPage from './pages';

const App = () => <HashRouter>
  <ChakraProvider>
    <Switch>
      <Route path={'/'} exact><IndexPage /></Route>
      <Route path={'/room'} exact>
        <RoomPage />
      </Route>
    </Switch>
  </ChakraProvider>
</HashRouter>;

export default App;
