/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {createContext, Component, useContext} from 'react';
import PropTypes from 'prop-types';

function someNamedFunction() {}

function formatContextForDisplay(name, value) {
  return (
    <li>
      {name}: <pre>{JSON.stringify(value, null, 2)}</pre>
    </li>
  );
}

const contextData = {
  array: ['first', 'second', 'third'],
  bool: true,
  func: someNamedFunction,
  number: 123,
  object: {outer: {inner: {}}},
  string: 'abc',
  symbol: Symbol.for('symbol'),
  null: null,
  undefined: undefined,
};

class LegacyContextProvider extends Component<any> {
  static childContextTypes = {
    array: PropTypes.array,
    bool: PropTypes.bool,
    func: PropTypes.func,
    number: PropTypes.number,
    object: PropTypes.object,
    string: PropTypes.string,
    symbol: PropTypes.symbol,
    null: PropTypes.any,
    undefined: PropTypes.any,
  };

  getChildContext() {
    return contextData;
  }

  render() {
    return this.props.children;
  }
}

class LegacyContextConsumer extends Component<any> {
  static contextTypes = {
    array: PropTypes.array,
    bool: PropTypes.bool,
    func: PropTypes.func,
    number: PropTypes.number,
    object: PropTypes.object,
    string: PropTypes.string,
    symbol: PropTypes.symbol,
    null: PropTypes.any,
    undefined: PropTypes.any,
  };

  render() {
    return formatContextForDisplay('LegacyContextConsumer', this.context);
  }
}

const ModernContext = createContext();
ModernContext.displayName = 'ModernContext';
const ArrayContext = createContext(contextData.array);
ArrayContext.displayName = 'ArrayContext';
const BoolContext = createContext(contextData.bool);
BoolContext.displayName = 'BoolContext';
const FuncContext = createContext(contextData.func);
FuncContext.displayName = 'FuncContext';
const NumberContext = createContext(contextData.number);
NumberContext.displayName = 'NumberContext';
const StringContext = createContext(contextData.string);
StringContext.displayName = 'StringContext';
const SymbolContext = createContext(contextData.symbol);
SymbolContext.displayName = 'SymbolContext';
const NullContext = createContext(null);
NullContext.displayName = 'NullContext';
const UndefinedContext = createContext(undefined);
UndefinedContext.displayName = 'UndefinedContext';

class ModernContextType extends Component<any> {
  static contextType = ModernContext;

  render() {
    return formatContextForDisplay('ModernContextType', this.context);
  }
}

function FunctionalContextConsumer() {
  const value = useContext(StringContext);
  return formatContextForDisplay('FunctionalContextConsumer', value);
}

export default function Contexts() {
  return (
    <div>
      <h1>Contexts</h1>
      <ul>
        <LegacyContextProvider>
          <LegacyContextConsumer />
        </LegacyContextProvider>
        <ModernContext.Provider value={contextData}>
          <ModernContext.Consumer>
            {value => formatContextForDisplay('ModernContext.Consumer', value)}
          </ModernContext.Consumer>
          <ModernContextType />
        </ModernContext.Provider>
        <FunctionalContextConsumer />
        <ArrayContext.Consumer>
          {value => formatContextForDisplay('ArrayContext.Consumer', value)}
        </ArrayContext.Consumer>
        <BoolContext.Consumer>
          {value => formatContextForDisplay('BoolContext.Consumer', value)}
        </BoolContext.Consumer>
        <FuncContext.Consumer>
          {value => formatContextForDisplay('FuncContext.Consumer', value)}
        </FuncContext.Consumer>
        <NumberContext.Consumer>
          {value => formatContextForDisplay('NumberContext.Consumer', value)}
        </NumberContext.Consumer>
        <StringContext.Consumer>
          {value => formatContextForDisplay('StringContext.Consumer', value)}
        </StringContext.Consumer>
        <SymbolContext.Consumer>
          {value => formatContextForDisplay('SymbolContext.Consumer', value)}
        </SymbolContext.Consumer>
        <NullContext.Consumer>
          {value => formatContextForDisplay('NullContext.Consumer', value)}
        </NullContext.Consumer>
        <UndefinedContext.Consumer>
          {value => formatContextForDisplay('UndefinedContext.Consumer', value)}
        </UndefinedContext.Consumer>
      </ul>
    </div>
  );
}
