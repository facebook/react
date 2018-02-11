# `react-is`

This package allows you to test arbitrary values and see if they're a particular React type, e.g. React Elements.

## Installation
```sh
# Yarn
yarn add react-is

# NPM
npm install react-is --save
```

## Usage

### AsyncMode
```js
import React from 'react';
import ReactIs from 'react-is';

const AsyncMode = React.unstable_AsyncMode;

ReactIs.isAsyncMode(<AsyncMode />); // true
ReactIs.typeOf(<AsyncMode />) === ReactIs.AsyncMode; // true
```

### Context
```js
import React from 'react';
ReactIs ReactIs from 'react-is';

const ThemeContext = React.createContext('blue');

ReactIs.isContextConsumer(<ThemeContext.Consumer />); // true
ReactIs.isContextProvider(<ThemeContext.Provider />); // true
ReactIs.typeOf(<ThemeContext.Provider />) === ReactIs.ContextProvider; // true
ReactIs.typeOf(<ThemeContext.Consumer />) === ReactIs.ContextConsumer; // true
```

### Element
```js
import React from 'react';
import ReactIs from 'react-is';

ReactIs.isElement(<div />); // true
ReactIs.typeOf(<div />) === ReactIs.Element; // true
```

### Fragment
```js
import React from 'react';
import ReactIs from 'react-is';

ReactIs.isFragment(<></>); // true
ReactIs.typeOf(<></>) === ReactIs.Fragment; // true
```

### Portal
```js
import React from 'react';
import ReactDOM from 'react-dom';
import ReactIs from 'react-is';

const div = document.createElement('div');
const portal = ReactDOM.createPortal(<div />, div);

ReactIs.isPortal(portal); // true
ReactIs.typeOf(portal) === ReactIs.Portal; // true
```

### StrictMode
```js
import React from 'react';
import ReactIs from 'react-is';

const {StrictMode} = React;

ReactIs.isStrictMode(<StrictMode />); // true
ReactIs.typeOf(<StrictMode />) === ReactIs.StrictMode; // true
```