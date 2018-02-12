import React, {Fragment} from 'react';
import ReactDOM from 'react-dom';
import {BrowserRouter as Router, Route, Link} from 'react-router-dom';

import loadComponent from './loadComponent';
import {CacheContext} from './cache';

import 'glamor/reset';

import {css} from 'glamor';

css.global('*', {boxSizing: 'border-box'});

const Home = loadComponent(import('./Home'));
const Movies = loadComponent(import('./Movies'));

function App() {
  return (
    <Router>
      <Fragment>
        <Route exact path="/" component={Home} />
        <Route path="/movies" component={Movies} />
      </Fragment>
    </Router>
  );
}

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
