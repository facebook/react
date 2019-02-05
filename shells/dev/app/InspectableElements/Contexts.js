// @flow

import React, { createContext, Component, Fragment, useContext } from 'react';
import PropTypes from 'prop-types';

function someNamedFunction() {}

const contextData = {
  array: ['first', 'second', 'third'],
  bool: true,
  func: someNamedFunction,
  number: 123,
  object: { outer: { inner: {} } },
  string: 'abc',
  symbol: Symbol.for('symbol'),
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
  };

  render() {
    return null;
  }
}

const ModernContext = createContext();
// $FlowFixMe Flow does not yet know about Context.displayName
ModernContext.displayName = 'ModernContext';
const ArrayContext = createContext(contextData.array);
// $FlowFixMe Flow does not yet know about Context.displayName
ArrayContext.displayName = 'ArrayContext';
const BoolContext = createContext(contextData.bool);
// $FlowFixMe Flow does not yet know about Context.displayName
BoolContext.displayName = 'BoolContext';
const FuncContext = createContext(contextData.func);
// $FlowFixMe Flow does not yet know about Context.displayName
FuncContext.displayName = 'FuncContext';
const NumberContext = createContext(contextData.number);
// $FlowFixMe Flow does not yet know about Context.displayName
NumberContext.displayName = 'NumberContext';
const StringContext = createContext(contextData.string);
// $FlowFixMe Flow does not yet know about Context.displayName
StringContext.displayName = 'StringContext';
const SymbolContext = createContext(contextData.symbol);
// $FlowFixMe Flow does not yet know about Context.displayName
SymbolContext.displayName = 'SymbolContext';
const NullContext = createContext(null);
// $FlowFixMe Flow does not yet know about Context.displayName
NullContext.displayName = 'NullContext';
const UndefinedContext = createContext(undefined);
// $FlowFixMe Flow does not yet know about Context.displayName
UndefinedContext.displayName = 'UndefinedContext';

class ModernContextType extends Component<any> {
  static contextType = ModernContext;

  render() {
    return null;
  }
}

function FunctionalContextConsumer() {
  useContext(StringContext);
  return null;
}

export default function Contexts() {
  return (
    <Fragment>
      <LegacyContextProvider>
        <LegacyContextConsumer />
      </LegacyContextProvider>
      <ModernContext.Provider value={contextData}>
        <ModernContext.Consumer>{value => null}</ModernContext.Consumer>
        <ModernContextType />
      </ModernContext.Provider>
      <FunctionalContextConsumer />
      <ArrayContext.Consumer>{value => null}</ArrayContext.Consumer>
      <BoolContext.Consumer>{value => null}</BoolContext.Consumer>
      <FuncContext.Consumer>{value => null}</FuncContext.Consumer>
      <NumberContext.Consumer>{value => null}</NumberContext.Consumer>
      <StringContext.Consumer>{value => null}</StringContext.Consumer>
      <SymbolContext.Consumer>{value => null}</SymbolContext.Consumer>
      <NullContext.Consumer>{value => null}</NullContext.Consumer>
      <UndefinedContext.Consumer>{value => null}</UndefinedContext.Consumer>
    </Fragment>
  );
}
