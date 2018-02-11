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
import React from "react";
import { AsyncMode, isAsyncMode, typeOf } from "react-is";

isAsyncMode(<React.unstable_AsyncMode />); // true
typeOf(<React.unstable_AsyncMode />) === AsyncMode; // true
```

### Context

```js
import React from "react";
import {
  ContextConsumer,
  ContextProvider,
  isContextConsumer,
  isContextProvider,
  typeOf
} from "react-is";

const ThemeContext = React.createContext("blue");

isContextConsumer(<ThemeContext.Consumer />); // true
isContextProvider(<ThemeContext.Provider />); // true
typeOf(<ThemeContext.Provider />) === ContextProvider; // true
typeOf(<ThemeContext.Consumer />) === ContextConsumer; // true
```

### Element

```js
import React from "react";
import { Element, isElement, typeOf } from "react-is";

isElement(<div />); // true
typeOf(<div />) === Element; // true
```

### Fragment

```js
import React from "react";
import { Fragment, isFragment, typeOf } from "react-is";

isFragment(<></>); // true
typeOf(<></>) === Fragment; // true
```

### Portal

```js
import React from "react";
import ReactDOM from "react-dom";
import { isPortal, Portal, typeOf } from "react-is";

const div = document.createElement("div");
const portal = ReactDOM.createPortal(<div />, div);

isPortal(portal); // true
typeOf(portal) === Portal; // true
```

### StrictMode

```js
import React from "react";
import { isStrictMode, StrictMode, TypeOf } from "react-is";

isStrictMode(<React.StrictMode />); // true
typeOf(<React.StrictMode />) === StrictMode; // true
```
